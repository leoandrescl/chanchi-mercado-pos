import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
}

interface InventoryStore {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
}

export const useInventory = create<InventoryStore>()(
  persist(
    (set) => ({
      products: [
        { id: '1', name: 'Sopaipilla', price: 500, category: 'Frituras' },
        { id: '2', name: 'Papas Fritas', price: 1200, category: 'Frituras' },
        { id: '3', name: 'Bebida 350cc', price: 1000, category: 'Bebidas' },
        { id: '4', name: 'Empanada', price: 1500, category: 'Masas' },
      ],
      addProduct: (data) => {
        const newProduct: Product = {
          ...data,
          id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        };
        set((state) => ({ products: [...state.products, newProduct] }));
      },
      removeProduct: (id) => {
        set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
      },
      updateProduct: (id, data) => {
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...data } : p)),
        }));
      },
    }),
    {
      name: 'chanchi-inventory',
    }
  )
);
