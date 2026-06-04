import { useState } from 'react';
import { usePlaceOrder } from './useOrders';
import type { Listing } from '../../../types/listing';

export const useCart = () => {
  const [items, setItems] = useState<Listing[]>([]);
  const placeOrderMutation = usePlaceOrder();

  const addItem = (listing: Listing) => {
    setItems((prev) =>
      prev.find((i) => i.id === listing.id) ? prev : [...prev, listing]
    );
  };

  const removeItem = (listingId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== listingId));
  };

  const checkout = async (listingId: string) => {
    return placeOrderMutation.mutateAsync(listingId);
  };

  return {
    items,
    addItem,
    removeItem,
    checkout,
    isCheckingOut: placeOrderMutation.isPending,
  };
};
