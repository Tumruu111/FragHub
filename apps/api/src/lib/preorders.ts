// Full-bottle pre-orders: the customer pays half up front, we order the
// bottles from our supplier, and once they arrive in UB the customer pays the
// rest and we deliver. Pure rules here; the database work is in
// modules/preorders.

export type PreorderStatus =
  | 'awaiting_deposit'
  | 'ordering'
  | 'arrived'
  | 'paid'
  | 'delivered'
  | 'cancelled';
export type PaymentKind = 'deposit' | 'balance';

export const MAX_BOTTLES_PER_ORDER = 10;

// Days the customer has to pay the rest after we say the bottles arrived
export const BALANCE_DAYS = 7;

// Half up front, rounded up to a whole tögrög, so the two always add up
export const splitPayment = (total: number) => {
  const deposit = Math.ceil(total / 2);
  return { deposit, balance: total - deposit };
};

// Paying the deposit or the rest moves the pre-order on one step
export const AFTER_PAYMENT: Record<
  PaymentKind,
  { from: PreorderStatus; to: PreorderStatus }
> = {
  deposit: { from: 'awaiting_deposit', to: 'ordering' },
  balance: { from: 'arrived', to: 'paid' },
};

export const balanceDueBy = (arrivedAt: Date) =>
  new Date(arrivedAt.getTime() + BALANCE_DAYS * 24 * 60 * 60 * 1000);

export const isOverdue = (arrivedAt: Date | null, now: Date) =>
  arrivedAt != null && now > balanceDueBy(arrivedAt);

// Only finished or already-cancelled pre-orders can't be cancelled
export const canCancel = (status: PreorderStatus) =>
  status !== 'delivered' && status !== 'cancelled';
