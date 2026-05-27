export interface Order {
  id: number;
  userId: number;
  price: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}
