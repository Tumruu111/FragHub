import { prisma } from '../../lib/prisma';
import { parseUnit, SMALLEST_SIZE_ML } from '../../lib/decants';
import { PaymentStatus } from '../../../generated/prisma/enums';

// A payment QPay may still report as paid. 'cancelled' is included because the
// buyer can finish paying in their bank app after closing our QR modal.
export const UNSETTLED: PaymentStatus[] = [
  PaymentStatus.pending,
  PaymentStatus.cancelled,
];

// Fulfill a confirmed payment: claim it, take each decant's ml out of its
// bottle and create orders atomically. Returns false if another request
// already settled this payment — the frontend poll and the QPay callback can
// arrive at the same time. Throws if a bottle doesn't have enough ml left; the
// whole transaction rolls back.
export const fulfillPayment = async (payment: {
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
