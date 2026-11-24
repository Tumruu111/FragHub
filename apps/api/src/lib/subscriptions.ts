// Subscription rules: the plans, the monthly calendar and how boxes are
// picked. Kept free of the database so it can be unit tested.

export type Tier = 'arabian' | 'designer' | 'niche';
export type ScentFor = 'masculine' | 'feminine' | 'unisex';
export type Plan = 'base' | 'premium';
export type SubscriberFor = 'him' | 'her';

// Every box decant is this size
export const BOX_SIZE_ML = 5;

// `open: false` plans take waitlist sign-ups only
export const PLANS: Record<
  Plan,
  { price: number; tiers: Tier[]; open: boolean }
> = {
  base: { price: 99000, tiers: ['designer', 'arabian'], open: true },
  premium: { price: 160000, tiers: ['niche', 'designer'], open: false },
};

// The monthly calendar, in days of the month (Ulaanbaatar time)
export const INVOICE_DAY = 1; // invoices are emailed
export const PROPOSE_DAY = 3; // boxes are picked for the admin to check
export const SHIP_DAY = 5; // boxes go out
export const LAST_PAY_DAY = 20; // later than this, the month is skipped

const TIME_ZONE = 'Asia/Ulaanbaatar';

// "2026-12" and the day of the month, in Ulaanbaatar
export const monthAndDay = (now: Date): { month: string; day: number } => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return { month: `${get('year')}-${get('month')}`, day: Number(get('day')) };
};

export const nextMonth = (month: string): string => {
  const [y, m] = month.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
};

// Someone signing up by the 20th gets this month's box (late if boxes have
// shipped); after that, their first box is next month's.
export const firstBillingMonth = (now: Date): string => {
  const { month, day } = monthAndDay(now);
  return day <= LAST_PAY_DAY ? month : nextMonth(month);
};

// An invoice can be paid until the 20th of its month, or any time before
export const canPayInvoice = (invoiceMonth: string, now: Date): boolean => {
  const { month, day } = monthAndDay(now);
  return (
    invoiceMonth > month || (invoiceMonth === month && day <= LAST_PAY_DAY)
  );
};

export const fitsSubscriber = (forWhom: SubscriberFor, scentFor: ScentFor) =>
  scentFor === 'unisex' ||
  (forWhom === 'him' ? scentFor === 'masculine' : scentFor === 'feminine');

export interface PickListing {
  id: string;
  tier: Tier;
  scentFor: ScentFor;
  // Ml free for boxes: what's left minus what other boxes already claim
  freeMl: number;
}

export interface PickSubscriber {
  subscriptionId: string;
  plan: Plan;
  forWhom: SubscriberFor;
  // Listings this subscriber has had in any earlier box
  alreadySent: string[];
}

export interface PickedBox {
  subscriptionId: string;
  // One per tier of the plan; listingId null when nothing fitted
  items: { tier: Tier; listingId: string | null }[];
}

// Picks a box for each subscriber: one decant per tier of their plan, a scent
// that suits who it's for, never one they've had before, and only from
// bottles with enough ml. Fuller bottles are more likely to be picked, so
// slow sellers get used up. Subscribers earlier in the list pick first.
export const pickBoxes = (
  subscribers: PickSubscriber[],
  listings: PickListing[],
  random: () => number = Math.random
): PickedBox[] => {
  const free = new Map(listings.map((l) => [l.id, l.freeMl]));

  return subscribers.map((s) => {
    const avoid = new Set(s.alreadySent);
    const items = PLANS[s.plan].tiers.map((tier) => {
      const options = listings.filter(
        (l) =>
          l.tier === tier &&
          fitsSubscriber(s.forWhom, l.scentFor) &&
          !avoid.has(l.id) &&
          (free.get(l.id) ?? 0) >= BOX_SIZE_ML
      );
      const pick = pickWeighted(options, (l) => free.get(l.id) ?? 0, random);
      if (pick) {
        free.set(pick.id, (free.get(pick.id) ?? 0) - BOX_SIZE_ML);
        avoid.add(pick.id);
      }
      return { tier, listingId: pick?.id ?? null };
    });
    return { subscriptionId: s.subscriptionId, items };
  });
};

// A random option, each as likely as its weight
const pickWeighted = <T>(
  options: T[],
  weight: (o: T) => number,
  random: () => number
): T | null => {
  const total = options.reduce((sum, o) => sum + weight(o), 0);
  if (total <= 0) return null;
  let roll = random() * total;
  for (const o of options) {
    roll -= weight(o);
    if (roll < 0) return o;
  }
  return options[options.length - 1];
};
