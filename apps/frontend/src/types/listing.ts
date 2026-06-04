export interface Listing {
  id: string;
  title: string;
  price: number;
  picture: string;
  size: string;
  vibe: string[];
  stock: number;
  status: 'in_stock' | 'out_of_order';
  createdAt: string;
  updatedAt: string;
}

export interface ListingsResponse {
  data: Listing[];
}
