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
}
