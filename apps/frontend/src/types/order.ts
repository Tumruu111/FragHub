export interface Order {
  id: string;
  userId: string;
  listingId: string;
  status: 'pending' | 'completed' | 'cancelled';
  buyerConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
}
