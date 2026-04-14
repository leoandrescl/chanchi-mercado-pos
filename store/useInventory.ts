import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  created_at?: string;
}

interface InventoryStore {
  products: Product[];
  isFetching: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
}

export const useInventory = create<InventoryStore>()(
  persist(
    (set, get) => ({
      products: [],
      isFetching: false,
      
      fetchProducts: async () => {
        set({ isFetching: true });
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true });
        
        if (!error && data) {
          set({ products: data });
        }
        set({ isFetching: false });
      },

      addProduct: async (data) => {
        const { data: newProd, error } = await supabase
          .from('products')
          .insert(data)
          .select()
          .single();
        
        if (!error && newProd) {
          set((state) => ({ products: [...state.products, newProd].sort((a,b) => a.name.localeCompare(b.name)) }));
        } else if (error) {
          throw error;
        }
      },

      updateProduct: async (id, data) => {
        const { error } = await supabase
          .from('products')
          .update(data)
          .eq('id', id);
        
        if (!error) {
          set((state) => ({
            products: state.products.map((p) => (p.id === id ? { ...p, ...data } : p)),
          }));
        } else {
          throw error;
        }
      },

      removeProduct: async (id) => {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
        
        if (!error) {
          set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
        } else {
          throw error;
        }
      },
    }),
    {
      name: 'chanchi-inventory',
    }
  )
);
