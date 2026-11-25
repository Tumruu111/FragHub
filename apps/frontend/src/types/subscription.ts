import type { Delivery } from './order';
import type { Listing, ListingTier } from './listing';

export type SubscriptionPlan = 'base' | 'premium';
export type SubscriberFor = 'him' | 'her';

export interface SubscriptionPlanInfo {
  plan: SubscriptionPlan;
  price: number;
  tiers: ListingTier[];
  // False while the plan only takes waitlist sign-ups
  open: boolean;
}

export interface SubscriptionInvoice {
  id: string;
  month: string; // "2026-12"
  amount: number;
  paid: boolean;
  canPay: boolean;
}

export interface BoxItem {
  id: string;
  tier: ListingTier;
  sizeMl: number;
  listing: Pick<
    Listing,
    'id' | 'title' | 'picture' | 'bottleMl' | 'bottlePrice'
  > | null;
}

export interface Box {
  id: string;
  month: string;
  status: 'proposed' | 'confirmed';
  items: BoxItem[];
}

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  forWhom: SubscriberFor;
  status: 'pending' | 'active' | 'cancelled' | 'waitlist';
  delivery: Delivery;
  invoices: SubscriptionInvoice[];
  boxes: Box[];
  createdAt: string;
  cancelledAt: string | null;
}

export const PLAN_NAMES: Record<SubscriptionPlan, string> = {
  base: 'Base',
  premium: 'Premium',
};

export const TIER_NAMES: Record<ListingTier, string> = {
  arabian: 'Arabian',
  designer: 'Designer',
  niche: 'Niche',
};

export const FOR_NAMES: Record<SubscriberFor, string> = {
  him: 'For him',
  her: 'For her',
};

// "2026-12" → "December 2026"
export const monthName = (month: string) =>
  new Date(`${month}-15T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
