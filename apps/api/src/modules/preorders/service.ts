import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { sendEmail } from '../../lib/email';
import { config } from '../../config';
import {
  AFTER_PAYMENT,
  BALANCE_DAYS,
  balanceDueBy,
  canCancel,
  splitPayment,
  type PaymentKind,
} from '../../lib/preorders';

// Errors thrown here are written for the person who caused them to read
export class PreorderError extends Error {}

const money = (n: unknown) => `${Number(n).toLocaleString('en-US')}₮`;
export const shortId = (id: string) => id.slice(0, 8).toUpperCase();
const ordersUrl = () => `${config.siteUrl}/orders`;
const dateText = (d: Date) =>
  d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Ulaanbaatar',
  });

const withDetails = (id: string) =>
  prisma.preorder.findUniqueOrThrow({
    where: { id },
    include: { user: true, items: true },
  });
type Detailed = Awaited<ReturnType<typeof withDetails>>;

// One email template for every step; `to` is the customer unless given
const notify = (
  p: Detailed,
  message: {
    subject: string;
    heading: string;
    body: string;
    amount?: unknown;
    action?: string;
  },
  to = p.user.email
) =>
  sendEmail({
    to,
    subject: message.subject,
    template: 'preorder',
    data: {
      name: p.user.name,
      orderId: shortId(p.id),
      heading: message.heading,
      body: message.body,
      amount: message.amount != null ? money(message.amount) : null,
      actionUrl: message.action ? ordersUrl() : null,
      actionLabel: message.action,
      items: p.items.map((i) => ({
        title: `${i.title} · ${i.bottleMl}ml`,
        price: money(i.price),
      })),
      total: money(p.total),
      phone: p.deliveryPhone,
      address: p.deliveryAddress,
      note: p.deliveryNote,
    },
  }).catch((err) => logger.error('Pre-order email failed', err));

// Places a pre-order at today's bottle prices and creates its deposit
// payment. One listing id per bottle, repeated for quantity.
export const createPreorder = async (
  userId: string,
  listingIds: string[],
  delivery: { phone: string; address: string; note?: string }
) => {
  const listings = await prisma.listing.findMany({
    where: { id: { in: [...new Set(listingIds)] }, bottlePrice: { not: null } },
  });
  const bottles = listingIds.map((id) => listings.find((l) => l.id === id));
  if (bottles.some((b) => !b))
    throw new PreorderError(
      'One or more bottles can no longer be pre-ordered. Refresh and try again.'
    );
  const chosen = bottles as (typeof listings)[number][];

  const total = chosen.reduce((sum, b) => sum + Number(b.bottlePrice), 0);
  const { deposit } = splitPayment(total);

  return prisma.preorder.create({
    data: {
      userId,
      total,
      deposit,
      deliveryPhone: delivery.phone,
      deliveryAddress: delivery.address,
      deliveryNote: delivery.note ?? null,
      items: {
        create: chosen.map((b) => ({
          listingId: b.id,
          title: b.title,
          bottleMl: b.bottleMl,
          price: b.bottlePrice ?? 0,
        })),
      },
      payments: { create: { kind: 'deposit', amount: deposit } },
    },
    include: { payments: true, items: true },
  });
};

// Why a payment can't be paid right now, or null when it can
export const payableError = (
  kind: PaymentKind,
  paymentStatus: string,
  preorderStatus: string
): string | null => {
  if (paymentStatus === 'paid') return 'This is already paid';
  if (preorderStatus === 'cancelled') return 'This pre-order was cancelled';
  if (preorderStatus !== AFTER_PAYMENT[kind].from)
    return kind === 'balance'
      ? "The rest is due once your bottles arrive in UB. We'll email you."
      : 'The deposit for this pre-order is already settled';
  return null;
};

// Marks a payment paid and moves its pre-order on: the deposit starts the
// order with our supplier, the rest readies it for delivery. Returns false if
// it was already settled, so a QPay callback and the buyer's own check can't
// both count it.
export const settlePreorderPayment = async (
  paymentId: string
): Promise<boolean> => {
  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const claimed = await tx.preorderPayment.updateMany({
      where: { id: paymentId, status: { in: ['pending', 'cancelled'] } },
      data: { status: 'paid', paidAt: now },
    });
    if (claimed.count === 0) return null;
    const payment = await tx.preorderPayment.findUniqueOrThrow({
      where: { id: paymentId },
    });
    const { from, to } = AFTER_PAYMENT[payment.kind];
    const moved = await tx.preorder.updateMany({
      where: { id: payment.preorderId, status: from },
      data: {
        status: to,
        ...(payment.kind === 'deposit'
          ? { depositPaidAt: now }
          : { paidAt: now }),
      },
    });
    return { payment, moved: moved.count > 0 };
  });
  if (!result) return false;

  const { payment, moved } = result;
  const p = await withDetails(payment.preorderId);
  if (!moved) {
    // Paid after the pre-order was cancelled: the money needs to go back
    logger.error('Pre-order paid after cancelling — refund needed', {
      paymentId,
    });
    notify(
      p,
      {
        subject: `⚠ Refund needed — pre-order ${shortId(p.id)}`,
        heading: 'Paid after cancelling',
        body: `${p.user.name} (${p.user.email}) paid the ${payment.kind} after this pre-order was cancelled. Refund it in QPay.`,
        amount: payment.amount,
      },
      config.email.adminAlert
    );
    return true;
  }

  if (payment.kind === 'deposit') {
    notify(p, {
      subject: `We're ordering your bottles — pre-order ${shortId(p.id)}`,
      heading: 'Deposit received',
      body: "Thank you! We're ordering your bottles from our supplier now. We'll email you when they arrive in UB, and you'll pay the rest then.",
      amount: payment.amount,
      action: 'SEE YOUR ORDER',
    });
    notify(
      p,
      {
        subject: `New pre-order ${shortId(p.id)} — order from the supplier`,
        heading: 'Deposit paid',
        body: `${p.user.name} paid the deposit. Order these bottles, then mark the pre-order arrived in admin.`,
        amount: payment.amount,
      },
      config.email.adminAlert
    );
  } else {
    notify(p, {
      subject: 'Paid in full — your bottles are on their way',
      heading: 'Paid in full',
      body: "Thank you! We'll deliver your bottles to the address below shortly.",
      amount: payment.amount,
      action: 'SEE YOUR ORDER',
    });
    notify(
      p,
      {
        subject: `Pre-order ${shortId(p.id)} paid in full — deliver it`,
        heading: 'Ready to deliver',
        body: `${p.user.name} paid the rest. Deliver the bottles, then mark it delivered.`,
        amount: payment.amount,
      },
      config.email.adminAlert
    );
  }
  return true;
};

// Admin: the bottles are in UB. Creates the payment for the rest and asks the
// customer to pay it within BALANCE_DAYS.
export const markArrived = async (preorderId: string) => {
  const now = new Date();
  const p = await prisma.$transaction(async (tx) => {
    const moved = await tx.preorder.updateMany({
      where: { id: preorderId, status: 'ordering' },
      data: { status: 'arrived', arrivedAt: now },
    });
    if (moved.count === 0)
      throw new PreorderError(
        'Only a pre-order whose deposit is paid can be marked arrived'
      );
    const preorder = await tx.preorder.findUniqueOrThrow({
      where: { id: preorderId },
    });
    await tx.preorderPayment.create({
      data: {
        preorderId,
        kind: 'balance',
        amount: Number(preorder.total) - Number(preorder.deposit),
      },
    });
    return preorder;
  });

  notify(await withDetails(p.id), {
    subject: 'Your bottles have arrived — pay the rest to get them delivered',
    heading: 'Your bottles are in UB',
    body: `Pay the rest by ${dateText(
      balanceDueBy(now)
    )} (${BALANCE_DAYS} days) and we'll deliver them straight away.`,
    amount: Number(p.total) - Number(p.deposit),
    action: 'PAY WITH QPAY',
  });
  return p;
};

// Admin: handed over to the customer
export const markDelivered = async (preorderId: string) => {
  const moved = await prisma.preorder.updateMany({
    where: { id: preorderId, status: 'paid' },
    data: { status: 'delivered', deliveredAt: new Date() },
  });
  if (moved.count === 0)
    throw new PreorderError(
      'Only a fully paid pre-order can be marked delivered'
    );
  return prisma.preorder.findUniqueOrThrow({ where: { id: preorderId } });
};

// Admin: stops a pre-order. Any refund is done by hand in QPay; this only
// records it. Paying a leftover QPay invoice afterwards alerts the admin.
export const cancelPreorder = async (preorderId: string) => {
  const p = await prisma.preorder.findUnique({ where: { id: preorderId } });
  if (!p) throw new PreorderError('Pre-order not found');
  if (!canCancel(p.status))
    throw new PreorderError(`This pre-order is already ${p.status}`);
  const moved = await prisma.preorder.updateMany({
    where: { id: preorderId, status: p.status },
    data: { status: 'cancelled', cancelledAt: new Date() },
  });
  if (moved.count === 0)
    throw new PreorderError('It changed meanwhile. Refresh and try again.');
  return prisma.preorder.findUniqueOrThrow({ where: { id: preorderId } });
};

// Customer: drops a pre-order they never paid the deposit for. It is
// cancelled rather than deleted, so a QPay payment that still comes through
// later is caught and refunded.
export const cancelUnpaidPreorder = async (
  userId: string,
  preorderId: string
) => {
  const moved = await prisma.preorder.updateMany({
    where: { id: preorderId, userId, status: 'awaiting_deposit' },
    data: { status: 'cancelled', cancelledAt: new Date() },
  });
  if (moved.count === 0)
    throw new PreorderError(
      'Only a pre-order without a paid deposit can be cancelled here. Contact us to cancel it.'
    );
  return prisma.preorder.findUniqueOrThrow({ where: { id: preorderId } });
};
