import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  is_visible?: boolean;
  order_index?: number;
  is_bundle?: boolean;
  created_at?: string;
}

interface InventoryStore {
  products: Product[];
  isFetching: boolean;
  fetchProducts: () => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'is_visible' | 'order_index'>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  toggleVisibility: (id: string) => Promise<void>;
  updateProductsOrder: (reorderedProducts: Product[]) => Promise<void>;
  syncOrderWithPopularity: () => Promise<void>;
}

export const useInventory = create<InventoryStore>()(
  persist(
    (set, get) => ({
      products: [],
      isFetching: false,
      
      syncOrderWithPopularity: async () => {
        set({ isFetching: true });
        const { getSalesRanking, getProductScore } = await import('@/lib/rankingLogic');
        
        try {
          const ranking = await getSalesRanking(15);
          const currentProducts = [...get().products];
          
          // Sort by score (descending)
          const sortedProducts = currentProducts.sort((a, b) => {
            const scoreA = getProductScore(a.name, ranking);
            const scoreB = getProductScore(b.name, ranking);
            
            if (scoreB !== scoreA) {
              return scoreB - scoreA;
            }
            // Tie-breaker: visibility or name
            return a.name.localeCompare(b.name);
          });

          // Update in DB
          const updates = sortedProducts.map((p, index) => 
            supabase
              .from('products')
              .update({ order_index: index })
              .eq('id', p.id)
          );

          await Promise.all(updates);
          await get().fetchProducts();
          
        } catch (err) {
          console.error("Error syncing order with popularity:", err);
        } finally {
          set({ isFetching: false });
        }
      },

      fetchProducts: async () => {
        set({ isFetching: true });
        
        // Fetch sorted by order_index
        const { data: productsData, error: prodError } = await supabase
          .from('products')
          .select('*')
          .order('order_index', { ascending: true })
          .order('name', { ascending: true });

        if (prodError) {
          console.error("Error fetching products:", prodError);
          set({ isFetching: false });
          return;
        }

        set({ products: productsData, isFetching: false });
      },

      addProduct: async (data) => {
        const { products } = get();
        // Max order index + 1
        const maxIndex = products.length > 0 
          ? Math.max(...products.map(p => p.order_index || 0)) 
          : 0;
        
        const payload = {
          name: data.name,
          price: data.price,
          category: data.category,
          image: data.image,
          is_visible: true,
          order_index: maxIndex + 1
        };

        const { data: newProd, error } = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single();
        
        if (!error && newProd) {
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
        if (data.is_visible !== undefined) payload.is_visible = data.is_visible;
        if (data.order_index !== undefined) payload.order_index = data.order_index;

        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', id);
        
        if (!error) {
          await get().fetchProducts();
        } else {
          console.error("❌ [ERROR UPDATE] Detalle de Supabase:", error);
          throw error;
        }
      },

      toggleVisibility: async (id) => {
        const product = get().products.find(p => p.id === id);
        if (!product) return;

        const newVisibleState = !product.is_visible;

        // Optimistic update
        set((state) => ({
          products: state.products.map(p => 
            p.id === id ? { ...p, is_visible: newVisibleState } : p
          )
        }));

        const { error } = await supabase
          .from('products')
          .update({ is_visible: newVisibleState })
          .eq('id', id);

        if (error) {
          console.error("❌ Error toggling visibility:", error);
          await get().fetchProducts();
        }
      },

      updateProductsOrder: async (reorderedProducts) => {
        // 1. Optimistic local update
        const productsWithIndices = reorderedProducts.map((p, index) => ({
          ...p,
          order_index: index
        }));
        
        set({ products: productsWithIndices });

        // 2. Persist to Supabase
        // We do this individually to ensure correctness, or batch if possible
        const updates = productsWithIndices.map(p => 
          supabase
            .from('products')
            .update({ order_index: p.order_index })
            .eq('id', p.id)
        );

        const results = await Promise.all(updates);
        const hasError = results.some(r => r.error);

        if (hasError) {
          console.error("❌ Error persisting new order");
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
