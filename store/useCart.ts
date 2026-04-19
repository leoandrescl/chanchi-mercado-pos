import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  total: number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      addItem: (product) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id);
          const newItems = existingItem
            ? state.items.map((item) =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
              )
            : [...state.items, { ...product, quantity: 1 }];
          
          return { items: newItems, total: newItems.reduce((acc, i) => acc + i.price * i.quantity, 0) };
        });
      },
      removeItem: (id) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.id === id);
          if (!existingItem) return state;

          const newItems = existingItem.quantity > 1
            ? state.items.map((item) =>
                item.id === id ? { ...item, quantity: item.quantity - 1 } : item
              )
            : state.items.filter((item) => item.id !== id);

          return { items: newItems, total: newItems.reduce((acc, i) => acc + i.price * i.quantity, 0) };
        });
      },
      updateQuantity: (id, quantity) => {
        set((state) => {
          const newItems = quantity > 0
            ? state.items.map((item) => (item.id === id ? { ...item, quantity } : item))
            : state.items.filter((item) => item.id !== id);
          
          return { items: newItems, total: newItems.reduce((acc, i) => acc + i.price * i.quantity, 0) };
        });
      },
      deleteItem: (id) => {
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== id);
          return { items: newItems, total: newItems.reduce((acc, i) => acc + i.price * i.quantity, 0) };
        });
      },
      clearCart: () => set({ items: [], total: 0 }),
      getTotal: () => {
        return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'chanchi-cart',
    }
  )
);
