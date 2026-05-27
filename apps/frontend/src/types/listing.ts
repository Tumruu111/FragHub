export interface Listing {
  id: number;
  productId: number;
  price: number;
  quantity: number;
  status: 'sold_out' | 'in_stock';
  createdAt: string;
  updatedAt: string;
}
