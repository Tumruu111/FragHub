import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { sendEmail } from '../../lib/email';
import { config } from '../../config';
import {
  BOX_SIZE_ML,
  LAST_PAY_DAY,
  PLANS,
  PROPOSE_DAY,
  INVOICE_DAY,
  SHIP_DAY,
  monthAndDay,
  pickBoxes,
  type Plan,
} from '../../lib/subscriptions';

// "2026-12" → "December 2026"
export const monthName = (month: string) =>
  new Date(`${month}-15T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

const PLAN_NAMES: Record<Plan, string> = { base: 'Base', premium: 'Premium' };

// Creates the month's invoice for every active subscriber who doesn't have one
// yet and emails them a link to pay. Safe to run more than once.
export const createMonthInvoices = async (month: string): Promise<number> => {
  const subscriptions = await prisma.subscription.findMany({
    where: { status: 'active', invoices: { none: { month } } },
    include: { user: true },
  });

  let created = 0;
  for (const s of subscriptions) {
    try {
      await prisma.subscriptionInvoice.create({
        data: { subscriptionId: s.id, month, amount: PLANS[s.plan].price },
      });
    } catch {
      continue; // created by a run at the same time
    }
    created++;
    sendEmail({
      to: s.user.email,
      subject: `Your ${monthName(month)} Veritas box is ready to pay`,
      template: 'subscription-invoice',
      data: {
        name: s.user.name,
        month: monthName(month),
        plan: PLAN_NAMES[s.plan],
        amount: PLANS[s.plan].price.toLocaleString(),
        payUrl: `${config.siteUrl}/subscription`,
        lastDay: LAST_PAY_DAY,
        shipDay: SHIP_DAY,
      },
    }).catch((err) => logger.error('Invoice email failed', err));
  }
  return created;
};

// Marks an invoice paid and starts the subscription if this was its first
// month. Returns false if it was already settled, so a QPay callback and the
// buyer's own check can't both count it.
export const settleInvoice = async (invoiceId: string): Promise<boolean> => {
  const marked = await prisma.subscriptionInvoice.updateMany({
    where: { id: invoiceId, status: { in: ['pending', 'cancelled'] } },
    data: { status: 'paid', paidAt: new Date() },
  });
  if (marked.count === 0) return false;
  const invoice = await prisma.subscriptionInvoice.findUniqueOrThrow({
    where: { id: invoiceId },
  });
  await prisma.subscription.updateMany({
    where: { id: invoice.subscriptionId, status: 'pending' },
    data: { status: 'active' },
  });
  return true;
};

// Picks a box for every subscriber who has paid for the month and doesn't
// have one yet. Ml that other unconfirmed boxes this month already claim is
// kept for them. Safe to run more than once, so late payers get picked too.
export const proposeBoxes = async (month: string): Promise<number> => {
  const paid = await prisma.subscriptionInvoice.findMany({
    where: {
      month,
      status: 'paid',
      subscription: { status: 'active', boxes: { none: { month } } },
    },
    include: {
      subscription: { include: { boxes: { include: { items: true } } } },
    },
    orderBy: { paidAt: 'asc' }, // first to pay, first to pick
  });
  if (paid.length === 0) return 0;

  const [listings, claimed] = await Promise.all([
    prisma.listing.findMany(),
    prisma.boxItem.groupBy({
      by: ['listingId'],
      where: { box: { status: 'proposed' }, listingId: { not: null } },
      _sum: { sizeMl: true },
    }),
  ]);
  const claimedMl = new Map(
    claimed.map((c) => [c.listingId, c._sum.sizeMl ?? 0])
  );

  const picked = pickBoxes(
    paid.map(({ subscription: s }) => ({
      subscriptionId: s.id,
      plan: s.plan,
      forWhom: s.forWhom,
      alreadySent: s.boxes.flatMap((b) =>
        b.items.flatMap((i) => (i.listingId ? [i.listingId] : []))
      ),
    })),
    listings.map((l) => ({
      id: l.id,
      tier: l.tier,
      scentFor: l.scentFor,
      freeMl: l.volumeMl - (claimedMl.get(l.id) ?? 0),
    }))
  );

  let created = 0;
  for (const box of picked) {
    try {
      await prisma.box.create({
        data: {
          subscriptionId: box.subscriptionId,
          month,
          items: {
            create: box.items.map((i) => ({
              tier: i.tier,
              listingId: i.listingId,
              sizeMl: BOX_SIZE_ML,
            })),
          },
        },
      });
      created++;
    } catch {
      // created by a run at the same time
    }
  }
  return created;
};

// The admin swaps the scent in one slot of a box that isn't confirmed yet
export const swapBoxItem = async (itemId: string, listingId: string) => {
  const item = await prisma.boxItem.findUnique({
    where: { id: itemId },
    include: { box: true },
  });
  if (!item) throw new Error('Box item not found');
  if (item.box.status !== 'proposed')
    throw new Error('This box is already confirmed');
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new Error('Listing not found');
  if (listing.volumeMl < item.sizeMl)
    throw new Error(`${listing.title} has less than ${item.sizeMl}ml left`);
  await prisma.boxItem.update({ where: { id: itemId }, data: { listingId } });
  return item.boxId;
};

// The admin confirms a box: its ml come out of the bottles and each decant
// becomes an order, which shows on the Orders page with the address.
// Everything happens together or not at all.
export const confirmBox = async (boxId: string) =>
  prisma.$transaction(async (tx) => {
    const box = await tx.box.findUnique({
      where: { id: boxId },
      include: {
        items: true,
        subscription: { include: { invoices: true } },
      },
    });
    if (!box) throw new Error('Box not found');
    if (box.items.some((i) => !i.listingId))
      throw new Error('Choose a scent for every slot first');

    // Claiming the box means two clicks can't take the ml twice
    const claimed = await tx.box.updateMany({
      where: { id: boxId, status: 'proposed' },
      data: { status: 'confirmed', confirmedAt: new Date() },
    });
    if (claimed.count === 0) throw new Error('This box is already confirmed');

    // The month's price, split across the decants, so revenue adds up
    const invoice = box.subscription.invoices.find(
      (i) => i.month === box.month
    );
    const pricePerItem =
      Number(invoice?.amount ?? PLANS[box.subscription.plan].price) /
      box.items.length;

    for (const item of box.items) {
      const listingId = item.listingId as string;
      const taken = await tx.listing.updateMany({
        where: { id: listingId, volumeMl: { gte: item.sizeMl } },
        data: { volumeMl: { decrement: item.sizeMl } },
      });
      if (taken.count === 0) {
        const l = await tx.listing.findUnique({ where: { id: listingId } });
        throw new Error(
          `${l?.title ?? 'A bottle'} has less than ${item.sizeMl}ml left`
        );
      }
      await tx.listing.updateMany({
        where: { id: listingId, volumeMl: { lt: BOX_SIZE_ML } },
        data: { status: 'out_of_order' },
      });
      await tx.order.create({
        data: {
          userId: box.subscription.userId,
          listingId,
          sizeMl: item.sizeMl,
          price: pricePerItem,
          boxId,
        },
      });
    }
    return boxId;
  });

// Runs the calendar: invoices from the 1st, box picking from the 3rd to the
// 20th (so late payers are picked up). Each step skips what's already done.
export const runSubscriptionCalendar = async (now = new Date()) => {
  const { month, day } = monthAndDay(now);
  if (day >= INVOICE_DAY) {
    const invoices = await createMonthInvoices(month);
    if (invoices)
      logger.info('Subscription invoices created', { month, invoices });
  }
  if (day >= PROPOSE_DAY && day <= LAST_PAY_DAY) {
    const boxes = await proposeBoxes(month);
    if (boxes) logger.info('Subscription boxes proposed', { month, boxes });
  }
};
