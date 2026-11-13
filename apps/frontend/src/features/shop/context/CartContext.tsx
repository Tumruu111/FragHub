import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import { priceOf } from '../../../types/listing';
import type { Listing } from '../../../types/listing';

// One cart line is a decant size of a listing, e.g. 3 × 5ml of Sauvage
export interface CartItem {
  listing: Listing;
  sizeMl: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (listing: Listing, sizeMl: number, quantity?: number) => void;
  setQuantity: (listingId: string, sizeMl: number, quantity: number) => void;
  removeItem: (listingId: string, sizeMl: number) => void;
  clearCart: () => void;
  // Ml of this bottle still free after what's already in the cart
  mlLeft: (listing: Listing) => number;
  itemCount: number;
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'veritas_cart';

const sameLine = (item: CartItem, listingId: string, sizeMl: number) =>
  item.listing.id === listingId && item.sizeMl === sizeMl;

// Every size of a listing shares one bottle, so its ml in the cart is summed
const mlInCart = (items: CartItem[], listingId: string, except?: number) =>
  items
    .filter((i) => i.listing.id === listingId && i.sizeMl !== except)
    .reduce((sum, i) => sum + i.sizeMl * i.quantity, 0);

// The most of one size that fits next to the rest of the cart
const maxQuantity = (items: CartItem[], listing: Listing, sizeMl: number) =>
  Math.floor((listing.volumeMl - mlInCart(items, listing.id, sizeMl)) / sizeMl);

const loadCart = (): CartItem[] => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    // Drop lines saved before decant sizes existed
    return Array.isArray(stored)
      ? stored.filter(
          (i) =>
            typeof i?.sizeMl === 'number' && Array.isArray(i.listing?.sizes)
        )
      : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Quantities are capped by the ml we last saw in the bottle; the server
  // re-checks at checkout.
  const addItem = useCallback(
    (listing: Listing, sizeMl: number, quantity = 1) => {
      setItems((prev) => {
        // Refresh the listing snapshot on every line of this bottle
        const updated = prev.map((i) =>
          i.listing.id === listing.id ? { ...i, listing } : i
        );
        const max = maxQuantity(updated, listing, sizeMl);
        const existing = updated.find((i) => sameLine(i, listing.id, sizeMl));
        if (existing)
          return updated.map((i) =>
            i === existing
              ? { ...i, quantity: Math.min(i.quantity + quantity, max) }
              : i
          );
        if (max < 1) return updated;
        return [
          ...updated,
          { listing, sizeMl, quantity: Math.min(quantity, max) },
        ];
      });
      setIsOpen(true);
    },
    []
  );

  const setQuantity = useCallback(
    (listingId: string, sizeMl: number, quantity: number) => {
      setItems((prev) =>
        prev.flatMap((i) => {
          if (!sameLine(i, listingId, sizeMl)) return [i];
          if (quantity < 1) return [];
          const max = maxQuantity(prev, i.listing, sizeMl);
          return [{ ...i, quantity: Math.min(quantity, max) }];
        })
      );
    },
    []
  );

  const removeItem = useCallback((listingId: string, sizeMl: number) => {
    setItems((prev) => prev.filter((i) => !sameLine(i, listingId, sizeMl)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const mlLeft = useCallback(
    (listing: Listing) => listing.volumeMl - mlInCart(items, listing.id),
    [items]
  );

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce(
    (sum, i) => sum + priceOf(i.listing, i.sizeMl) * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        setQuantity,
        removeItem,
        clearCart,
        mlLeft,
        itemCount,
        total,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
