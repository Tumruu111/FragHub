// A listing is one scent. Our opened bottle of it (volumeMl) fills
// subscription box decants; with a bottlePrice, customers can pre-order a
// full sealed bottle, which we import for them.
export interface Listing {
  id: string;
  title: string;
  picture: string;
  vibe: string[];
  status: 'in_stock' | 'out_of_order';
  bottleMl: number;
  volumeMl: number;
  // Full bottle price; null when it isn't sold as a bottle
  bottlePrice: number | null;
  // Which subscription box slot it fills, and who it suits
  tier: ListingTier;
  scentFor: ScentFor;
  createdAt: string;
  updatedAt: string;
}

export type ListingTier = 'arabian' | 'designer' | 'niche';
export type ScentFor = 'masculine' | 'feminine' | 'unisex';

export interface ListingsResponse {
  data: Listing[];
}

// Pre-orders are paid in two halves, the first rounded up (as the server does)
export const splitPayment = (total: number) => {
  const deposit = Math.ceil(total / 2);
  return { deposit, balance: total - deposit };
};

export const MAX_BOTTLES_PER_ORDER = 10;
