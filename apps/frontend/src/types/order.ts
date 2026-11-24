import type { Listing } from './listing';

export interface Order {
  id: string;
  userId: string;
  listingId: string;
  listing?: Pick<Listing, 'id' | 'title' | 'picture'>;
  // Decant size bought and the price paid for it
  sizeMl: number;
  price: number;
  status: 'pending' | 'completed' | 'cancelled';
  buyerConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  // The checkout it came from; orders from one checkout ship together
  paymentId?: string | null;
  // Set for a decant from a subscription box, e.g. "2026-12"
  boxMonth?: string | null;
  // Missing on orders from before delivery was added
  delivery?: Delivery | null;
}

export interface Delivery {
  phone: string;
  address: string;
  note?: string | null;
}
