import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { createInvoice, checkInvoicePaid, cancelInvoice } from '../../lib/qpay';
import { sendEmail } from '../../lib/email';
import { getUserFromRequest } from '../../lib/auth';
import { config } from '../../config';
import { parseUnit, SMALLEST_SIZE_ML } from '../../lib/decants';
import { PaymentStatus } from '../../../generated/prisma/enums';

// A payment QPay may still report as paid. 'cancelled' is included because the
// buyer can finish paying in their bank app after closing our QR modal.
const UNSETTLED: PaymentStatus[] = [
  PaymentStatus.pending,
  PaymentStatus.cancelled,
];

const MAX_UNITS_PER_ORDER = 50;

// A payment stores one unit per decant bought, as "listingId:sizeMl" (see
// lib/decants), in its listingIds column. This groups them into lines of
// listing × size × quantity with each size's current price. `missing` is true
// when a unit's listing or size no longer exists.
const loadCartLines = async (units: string[]) => {
  const counts = new Map<string, number>();
  for (const unit of units) counts.set(unit, (counts.get(unit) ?? 0) + 1);

  const wanted = [...counts].flatMap(([unit, quantity]) => {
    const parsed = parseUnit(unit);
    return parsed ? [{ ...parsed, quantity }] : [];
  });
  const listings = await prisma.listing.findMany({
    where: { id: { in: wanted.map((w) => w.listingId) } },
    include: { sizes: true },
  });

  const lines = wanted.flatMap(({ listingId, sizeMl, quantity }) => {
    const listing = listings.find((l) => l.id === listingId);
    const size = listing?.sizes.find((s) => s.sizeMl === sizeMl);
    return listing && size
      ? [{ listing, sizeMl, price: Number(size.price), quantity }]
      : [];
  });
  return { lines, missing: lines.length !== counts.size };
};

const lineSize = (sizeMl: number, quantity: number) =>
  `${sizeMl}ml${quantity > 1 ? ` · × ${quantity}` : ''}`;

// Send order confirmation email after payment
const sendOrderConfirmation = async (
  userId: string,
  units: string[],
  paymentId: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const { lines } = await loadCartLines(units);
  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  await sendEmail({
    to: user.email,
    subject: 'Your Veritas Parfums order is confirmed ✓',
    template: 'order',
    data: {
      name: user.name,
      orderId: paymentId.slice(0, 8).toUpperCase(),
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      total: total.toLocaleString(),
      items: lines.map(({ listing, sizeMl, price, quantity }) => ({
        title: listing.title,
        size: lineSize(sizeMl, quantity),
        picture: listing.picture,
        price: (price * quantity).toLocaleString(),
      })),
    },
  });
};

// Payment was confirmed by QPay but fulfillment failed (stock ran out first).
// Mark the payment failed and alert the admin — the buyer needs a manual refund.
const handleFulfillmentFailure = async (
  payment: {
    id: string;
    userId: string;
    listingIds: string[];
    amount: unknown;
  },
  err: unknown
) => {
  // Only the request that actually records the failure sends the alert, so a
  // racing poll + callback can't email the admin twice.
  const marked = await prisma.payment.updateMany({
    where: { id: payment.id, status: { in: UNSETTLED } },
    data: { status: PaymentStatus.failed },
  });
  if (marked.count === 0) return;

  logger.error('Paid but unfulfilled — refund needed', {
    paymentId: payment.id,
    err,
  });

  const user = await prisma.user.findUnique({ where: { id: payment.userId } });
  const { lines } = await loadCartLines(payment.listingIds);

  await sendEmail({
    to: config.email.adminAlert,
    subject: `⚠ Refund needed — paid but unfulfilled order ${payment.id
      .slice(0, 8)
      .toUpperCase()}`,
    template: 'fulfillment-alert',
    data: {
      paymentId: payment.id,
      shortId: payment.id.slice(0, 8).toUpperCase(),
      date: new Date().toLocaleString('en-US'),
      amount: Number(payment.amount).toLocaleString(),
      reason: err instanceof Error ? err.message : String(err),
      buyerName: user?.name ?? 'Unknown',
      buyerEmail: user?.email ?? payment.userId,
      items: lines.map(({ listing, sizeMl, quantity }) => ({
        title: listing.title,
        size: lineSize(sizeMl, quantity),
      })),
    },
  });
};

// Fulfill a confirmed payment: claim it, take each decant's ml out of its
// bottle and create orders atomically. Returns false if another request
// already settled this payment — the frontend poll and the QPay callback can
// arrive at the same time. Throws if a bottle doesn't have enough ml left; the
// whole transaction rolls back.
const fulfillPayment = async (payment: {
  id: string;
  userId: string;
  listingIds: string[];
}): Promise<boolean> =>
  prisma.$transaction(async (tx) => {
    // Claiming locks the payment row. A concurrent request blocks here until
    // this transaction ends, then finds the payment settled and claims nothing.
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: { in: UNSETTLED } },
      data: { status: PaymentStatus.paid },
    });
    if (claimed.count === 0) return false;

    for (const unit of payment.listingIds) {
      const parsed = parseUnit(unit);
      if (!parsed) throw new Error(`Unrecognised item "${unit}"`);
      const { listingId, sizeMl } = parsed;

      const size = await tx.listingSize.findUnique({
        where: { listingId_sizeMl: { listingId, sizeMl } },
      });
      if (!size) throw new Error(`${sizeMl}ml of ${listingId} is not sold`);

      const updated = await tx.listing.updateMany({
        where: { id: listingId, status: 'in_stock', volumeMl: { gte: sizeMl } },
        data: { volumeMl: { decrement: sizeMl } },
      });
      if (updated.count === 0)
        throw new Error(`${listingId} has less than ${sizeMl}ml left`);

      await tx.listing.updateMany({
        where: { id: listingId, volumeMl: { lt: SMALLEST_SIZE_ML } },
        data: { status: 'out_of_order' },
      });

      await tx.order.create({
        data: { userId: payment.userId, listingId, sizeMl, price: size.price },
      });
    }

    return true;
  });

// POST /api/payments/create
// Body: { units: string[] } — one "listingId:sizeMl" per decant, repeated for
// quantity. Creates a QPay invoice for the entire cart and returns QR data.
export const createPayment = async (req: Request, res: Response) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const { units } = req.body as { units: unknown };
    if (
      !Array.isArray(units) ||
      !units.length ||
      !units.every((u) => typeof u === 'string' && parseUnit(u))
    )
      return res.status(400).json({ message: 'No items provided' });
    if (units.length > MAX_UNITS_PER_ORDER)
      return res.status(400).json({
        message: `You can order at most ${MAX_UNITS_PER_ORDER} items at once`,
      });

    const { lines, missing } = await loadCartLines(units);
    if (missing)
      return res
        .status(400)
        .json({ message: 'One or more items are no longer available' });

    // Every size draws from the same bottle, so check the total ml per listing
    const mlWanted = new Map<string, number>();
    for (const { listing, sizeMl, quantity } of lines)
      mlWanted.set(
        listing.id,
        (mlWanted.get(listing.id) ?? 0) + sizeMl * quantity
      );
    const short = lines.find(
      ({ listing }) =>
        listing.status === 'out_of_order' ||
        listing.volumeMl < (mlWanted.get(listing.id) ?? 0)
    );
    if (short) {
      const { title, volumeMl, status } = short.listing;
      return res.status(400).json({
        message:
          status === 'out_of_order' || volumeMl < SMALLEST_SIZE_ML
            ? `"${title}" is out of stock`
            : `Only ${volumeMl}ml of "${title}" left`,
      });
    }

    const amount = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

    // Create payment record first so we have an ID for the callback
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount,
        listingIds: units,
        status: 'pending',
      },
    });

    // Create QPay invoice
    const invoice = await createInvoice({
      paymentId: payment.id,
      amount,
      description: `Veritas Parfums — ${lines
        .map(
          ({ listing, sizeMl, quantity }) =>
            `${listing.title} ${sizeMl}ml${
              quantity > 1 ? ` × ${quantity}` : ''
            }`
        )
        .join(', ')}`,
    });

    // Store QPay data on the payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        qpayInvoiceId: invoice.invoiceId,
        qpayQrText: invoice.qrText,
        qpayQrImage: invoice.qrImage,
        qpayUrls: invoice.urls,
      },
    });

    return res.status(201).json({
      paymentId: payment.id,
      amount,
      qrText: invoice.qrText,
      qrImage: invoice.qrImage,
      urls: invoice.urls,
    });
  } catch (err) {
    logger.error('createPayment failed', err);
    return res.status(500).json({ message: 'Failed to create payment' });
  }
};

// GET /api/payments/:id/check
// Frontend polls this to see if the user has paid
export const checkPayment = async (req: Request, res: Response) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
    });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.userId !== user.id)
      return res.status(403).json({ message: 'Forbidden' });

    // Already confirmed
    if (payment.status === 'paid') return res.json({ status: 'paid' });
    if (payment.status === 'cancelled')
      return res.json({ status: 'cancelled' });
    if (payment.status === 'failed') return res.json({ status: 'failed' });

    const paid = await checkInvoicePaid(payment.qpayInvoiceId!);
    if (!paid) return res.json({ status: 'pending' });

    let fulfilled: boolean;
    try {
      fulfilled = await fulfillPayment(payment);
    } catch (err) {
      await handleFulfillmentFailure(payment, err);
      return res.json({ status: 'failed' });
    }

    if (!fulfilled) {
      // The QPay callback settled it first; report what it decided.
      const current = await prisma.payment.findUnique({
        where: { id: payment.id },
        select: { status: true },
      });
      return res.json({ status: current?.status ?? 'pending' });
    }

    logger.info('Payment confirmed', {
      paymentId: payment.id,
      userId: user.id,
    });
    sendOrderConfirmation(payment.userId, payment.listingIds, payment.id);
    return res.json({ status: 'paid' });
  } catch (err: any) {
    logger.error('checkPayment failed', err);
    return res
      .status(500)
      .json({ message: err?.message ?? 'Payment check failed' });
  }
};

export const paymentCallback = async (req: Request, res: Response) => {
  const paymentId = (req.query.paymentId ?? req.body?.paymentId) as string;
  if (!paymentId) return res.status(400).json({ message: 'Missing paymentId' });

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment || payment.status === 'paid' || payment.status === 'failed')
      return res.json({ ok: true });

    const paid = await checkInvoicePaid(payment.qpayInvoiceId!);
    if (!paid) return res.json({ ok: false });

    let fulfilled: boolean;
    try {
      fulfilled = await fulfillPayment(payment);
    } catch (err) {
      await handleFulfillmentFailure(payment, err);
      return res.json({ ok: true });
    }

    // The frontend poll settled it first; nothing left to do.
    if (!fulfilled) return res.json({ ok: true });

    logger.info('Payment confirmed via callback', { paymentId });
    sendOrderConfirmation(payment.userId, payment.listingIds, payment.id);
    return res.json({ ok: true });
  } catch (err) {
    logger.error('paymentCallback failed', err);
    return res.status(502).json({ message: 'Callback processing failed' });
  }
};

export const cancelPayment = async (req: Request, res: Response) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
    });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.userId !== user.id)
      return res.status(403).json({ message: 'Forbidden' });
    if (payment.status === 'paid')
      return res.status(400).json({ message: 'Payment already completed' });

    if (payment.qpayInvoiceId) {
      await cancelInvoice(payment.qpayInvoiceId).catch(() => {
        /* best-effort */
      });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'cancelled' },
    });
    return res.json({ message: 'Payment cancelled' });
  } catch (err) {
    logger.error('cancelPayment failed', err);
    return res.status(500).json({ message: 'Failed to cancel payment' });
  }
};
