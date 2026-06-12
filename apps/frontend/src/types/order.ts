import type { Listing } from './listing';

export interface Order {
  id: string;
  userId: string;
  listingId: string;
  listing?: Pick<Listing, 'id' | 'title' | 'size' | 'picture' | 'price'>;
  status: 'pending' | 'completed' | 'cancelled';
  buyerConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
}
