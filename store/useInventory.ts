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
        // 1. Ensure state is fresh before checking/adding
        await get().fetchProducts();
        
        // 2. Sanitize payload: strictly send only what the DB expects
        const payload = {
          name: data.name,
          price: data.price,
          category: data.category,
          image: data.image
        };

        const { data: newProd, error } = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single();
        
        if (!error && newProd) {
          set((state) => ({ products: [...state.products, newProd].sort((a,b) => a.name.localeCompare(b.name)) }));
        } else if (error) {
          console.error("❌ [ERROR PRODUCTO] Detalle de Supabase:", error);
          throw error;
        }
      },

      updateProduct: async (id, data) => {
        // Sanitize update payload as well
        const payload: any = {};
        if (data.name) payload.name = data.name;
        if (data.price) payload.price = data.price;
        if (data.category) payload.category = data.category;
        if (data.image) payload.image = data.image;

        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', id);
        
        if (!error) {
          set((state) => ({
            products: state.products.map((p) => (p.id === id ? { ...p, ...data } : p)),
          }));
        } else {
          console.error("❌ [ERROR UPDATE] Detalle de Supabase:", error);
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
