import type { Listing } from './listing';

// A decant sent in a subscription box
export interface Order {
  id: string;
  userId: string;
  listingId: string;
  listing?: Pick<Listing, 'id' | 'title' | 'picture'>;
  sizeMl: number;
  // Its share of the month's subscription price
  price: number;
  status: 'pending' | 'completed' | 'cancelled';
  buyerConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  // The box month it was sent in, e.g. "2026-12"
  boxMonth?: string | null;
  delivery?: Delivery | null;
}

export interface Delivery {
  phone: string;
  address: string;
  note?: string | null;
}

export type PreorderStatus =
  | 'awaiting_deposit'
  | 'ordering'
  | 'arrived'
  | 'paid'
  | 'delivered'
  | 'cancelled';

export interface PreorderPayment {
  id: string;
  kind: 'deposit' | 'balance';
  amount: number;
  paid: boolean;
  paidAt: string | null;
}

// Full bottles imported to order: half paid up front, the rest on arrival
export interface Preorder {
  id: string;
  status: PreorderStatus;
  total: number;
  deposit: number;
  balance: number;
  items: {
    id: string;
    listingId: string | null;
    title: string;
    bottleMl: number;
    price: number;
    picture: string | null;
  }[];
  // The payment to make now, if one is waiting on the customer
  due: PreorderPayment | null;
  balanceDueBy: string | null;
  overdue: boolean;
  delivery: Delivery;
  createdAt: string;
  depositPaidAt: string | null;
  arrivedAt: string | null;
  paidAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
}

// What each step means to the customer, in order
export const PREORDER_STEPS: { status: PreorderStatus; label: string }[] = [
  { status: 'awaiting_deposit', label: 'Deposit' },
  { status: 'ordering', label: 'Ordered' },
  { status: 'arrived', label: 'In UB' },
  { status: 'paid', label: 'Paid' },
  { status: 'delivered', label: 'Delivered' },
];

export const PREORDER_STATUS_NAMES: Record<PreorderStatus, string> = {
  awaiting_deposit: 'Deposit not paid',
  ordering: 'Ordering from supplier',
  arrived: 'Arrived — pay the rest',
  paid: 'Paid — out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const shortId = (id: string) => id.slice(0, 8).toUpperCase();
