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
  /** YYYY-MM-DD for venta fiada (persisted). */
  saleDate: string;
  setSaleDate: (date: string) => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  deleteItem: (id: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  total: number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      saleDate: new Date().toISOString().split('T')[0],
      setSaleDate: (saleDate) => set({ saleDate }),
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
      deleteItem: (id: string) => {
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== id);
          return { items: newItems, total: newItems.reduce((acc, i) => acc + i.price * i.quantity, 0) };
        });
      },
      clearCart: () =>
        set({ items: [], total: 0, saleDate: new Date().toISOString().split('T')[0] }),
      getTotal: () => {
        return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'chanchi-cart',
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CartStore>;
        const fallbackDate = new Date().toISOString().split('T')[0];
        return {
          ...current,
          items: p.items ?? current.items,
          total: typeof p.total === 'number' ? p.total : current.total,
          saleDate:
            typeof p.saleDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.saleDate)
              ? p.saleDate
              : fallbackDate,
        };
      },
    }
  )
);
