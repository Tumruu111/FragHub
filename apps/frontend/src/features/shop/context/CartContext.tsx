import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import { MAX_BOTTLES_PER_ORDER } from '../../../types/listing';
import type { Listing } from '../../../types/listing';

// What the cart needs to know about a bottle
export type CartListing = Pick<
  Listing,
  'id' | 'title' | 'picture' | 'bottleMl' | 'bottlePrice'
>;

// One cart line is a full bottle of a listing, e.g. 2 × Sauvage 100ml
export interface CartItem {
  listing: CartListing;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (listing: CartListing, quantity?: number) => void;
  setQuantity: (listingId: string, quantity: number) => void;
  removeItem: (listingId: string) => void;
  clearCart: () => void;
  // How many more bottles fit in one pre-order
  roomLeft: number;
  itemCount: number;
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'veritas_cart';

const countOf = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.quantity, 0);

const loadCart = (): CartItem[] => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    // Drop decant lines saved before the shop sold full bottles
    return Array.isArray(stored)
      ? stored.filter(
          (i) =>
            typeof i?.quantity === 'number' &&
            typeof i.listing?.bottlePrice === 'number' &&
            i.sizeMl === undefined
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

  // Bottles are imported to order, so there's no stock to run out of; only
  // the size of one pre-order is capped. The server re-checks prices.
  const addItem = useCallback((listing: CartListing, quantity = 1) => {
    setItems((prev) => {
      const room = MAX_BOTTLES_PER_ORDER - countOf(prev);
      const add = Math.min(quantity, room);
      if (add < 1) return prev;
      const existing = prev.find((i) => i.listing.id === listing.id);
      return existing
        ? prev.map((i) =>
            i === existing ? { listing, quantity: i.quantity + add } : i
          )
        : [...prev, { listing, quantity: add }];
    });
    setIsOpen(true);
  }, []);

  const setQuantity = useCallback((listingId: string, quantity: number) => {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.listing.id !== listingId) return [i];
        if (quantity < 1) return [];
        const max = MAX_BOTTLES_PER_ORDER - (countOf(prev) - i.quantity);
        return [{ ...i, quantity: Math.min(quantity, max) }];
      })
    );
  }, []);

  const removeItem = useCallback((listingId: string) => {
    setItems((prev) => prev.filter((i) => i.listing.id !== listingId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = countOf(items);
  const total = items.reduce(
    (sum, i) => sum + (i.listing.bottlePrice ?? 0) * i.quantity,
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
        roomLeft: MAX_BOTTLES_PER_ORDER - itemCount,
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
