import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import type { Listing } from '../../../types/listing';

export interface CartItem {
  listing: Listing;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (listing: Listing, quantity?: number) => void;
  setQuantity: (listingId: string, quantity: number) => void;
  removeItem: (listingId: string) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'veritas_cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Quantities are capped at the stock we last saw; the server re-checks
  // stock at checkout.
  const addItem = useCallback((listing: Listing, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.listing.id === listing.id);
      if (existing)
        return prev.map((i) =>
          i.listing.id === listing.id
            ? {
                listing,
                quantity: Math.min(i.quantity + quantity, listing.stock),
              }
            : i
        );
      if (listing.stock < 1) return prev;
      return [
        ...prev,
        { listing, quantity: Math.min(quantity, listing.stock) },
      ];
    });
    setIsOpen(true);
  }, []);

  const setQuantity = useCallback((listingId: string, quantity: number) => {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.listing.id !== listingId) return [i];
        if (quantity < 1) return [];
        return [{ ...i, quantity: Math.min(quantity, i.listing.stock) }];
      })
    );
  }, []);

  const removeItem = useCallback((listingId: string) => {
    setItems((prev) => prev.filter((i) => i.listing.id !== listingId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce(
    (sum, i) => sum + Number(i.listing.price) * i.quantity,
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
