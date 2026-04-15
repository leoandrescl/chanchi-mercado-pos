import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  is_favorite?: boolean;
  is_bundle?: boolean;
  created_at?: string;
}

interface InventoryStore {
  products: Product[];
  isFetching: boolean;
  fetchProducts: () => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'is_favorite'>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

export const useInventory = create<InventoryStore>()(
  persist(
    (set, get) => ({
      products: [],
      isFetching: false,
      
      fetchProducts: async () => {
        set({ isFetching: true });
        
        // 1. Fetch Products
        const { data: productsData, error: prodError } = await supabase
          .from('products')
          .select('*');

        if (prodError) {
          console.error("Error fetching products:", prodError);
          set({ isFetching: false });
          return;
        }

        // 2. Fetch Popularity data (Debts)
        const { data: debtsData, error: debtError } = await supabase
          .from('debts')
          .select('description')
          .filter('description', 'ilike', 'Compra:%');

        const popularityMap: Record<string, number> = {};

        if (!debtError && debtsData) {
          debtsData.forEach(debt => {
            productsData.forEach(product => {
              if (debt.description.includes(product.name)) {
                popularityMap[product.id] = (popularityMap[product.id] || 0) + 1;
              }
            });
          });
        }

        // 3. TRIPLE SORT: is_favorite DESC, then Popularity DESC, then Name ASC
        const sortedProducts = [...productsData].sort((a, b) => {
          // A. Priority 1: Favorites
          if (a.is_favorite !== b.is_favorite) {
            return a.is_favorite ? -1 : 1;
          }

          // B. Priority 2: Popularity
          const popularityA = popularityMap[a.id] || 0;
          const popularityB = popularityMap[b.id] || 0;
          
          if (popularityB !== popularityA) {
            return popularityB - popularityA;
          }

          // C. Priority 3: Alphabetical
          return a.name.localeCompare(b.name);
        });
        
        set({ products: sortedProducts, isFetching: false });
      },

      addProduct: async (data) => {
        await get().fetchProducts();
        
        const payload = {
          name: data.name,
          price: data.price,
          category: data.category,
          image: data.image,
          is_favorite: false // default for new
        };

        const { data: newProd, error } = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single();
        
        if (!error && newProd) {
          // Re-sort everything after adding
          await get().fetchProducts();
        } else if (error) {
          console.error("❌ [ERROR PRODUCTO] Detalle de Supabase:", error);
          throw error;
        }
      },

      updateProduct: async (id, data) => {
        const payload: any = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.price !== undefined) payload.price = data.price;
        if (data.category !== undefined) payload.category = data.category;
        if (data.image !== undefined) payload.image = data.image;
        if (data.is_favorite !== undefined) payload.is_favorite = data.is_favorite;

        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', id);
        
        if (!error) {
          // Re-sort because popularity or favorite status might have changed the desired order
          await get().fetchProducts();
        } else {
          console.error("❌ [ERROR UPDATE] Detalle de Supabase:", error);
          throw error;
        }
      },

      toggleFavorite: async (id) => {
        const product = get().products.find(p => p.id === id);
        if (!product) return;

        const newFavoriteState = !product.is_favorite;

        // Optimistic update
        set((state) => ({
          products: state.products.map(p => 
            p.id === id ? { ...p, is_favorite: newFavoriteState } : p
          )
        }));

        const { error } = await supabase
          .from('products')
          .update({ is_favorite: newFavoriteState })
          .eq('id', id);

        if (error) {
          console.error("❌ Error toggling favorite:", error);
          // Revert optimistic update
          await get().fetchProducts();
        } else {
          // Re-fetch to apply new sorting correctly across the whole list
          await get().fetchProducts();
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
