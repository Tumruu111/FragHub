export interface ListingSize {
  sizeMl: number;
  price: number;
  // How many of this size the ml left in the bottle can fill
  available: number;
}

// A listing is one bottle; every decant size draws from its volumeMl.
export interface Listing {
  id: string;
  title: string;
  picture: string;
  vibe: string[];
  status: 'in_stock' | 'out_of_order';
  bottleMl: number;
  volumeMl: number;
  sizes: ListingSize[];
  createdAt: string;
  updatedAt: string;
}

export interface ListingsResponse {
  data: Listing[];
}

export const priceOf = (listing: Listing, sizeMl: number) =>
  listing.sizes.find((s) => s.sizeMl === sizeMl)?.price ?? 0;

export const isSoldOut = (listing: Listing) =>
  listing.status === 'out_of_order' ||
  !listing.sizes.some((s) => s.available > 0);
