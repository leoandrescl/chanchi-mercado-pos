'use client';

import React, { useState, useEffect } from 'react';
import { useInventory, Product } from '@/store/useInventory';
import { Package, LayoutGrid, List as ListIcon } from 'lucide-react';
import ProductModal from '@/components/products/ProductModal';
import ConfirmDeleteModal from '@/components/products/ConfirmDeleteModal';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import HeaderPage from '@/components/ui/HeaderPage';
import InputSearch from '@/components/ui/InputSearch';
import ProductCard from '@/components/pos/ProductCard';

export default function InventoryPage() {
  const { products, fetchProducts, removeProduct, isFetching } = useInventory();
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await removeProduct(productToDelete.id);
      toast.success("Producto eliminado del catálogo 🗑️");
      setProductToDelete(null);
    } catch (err) {
      toast.error("Error al eliminar el producto");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-50">
        <div className="mx-auto w-full max-w-5xl px-6 py-8">
          <HeaderPage 
            title="Gestión de Inventario"
            backHref="/acceso-total-chanchi"
            primaryAction={{
              label: "Agregar Nuevo",
              onClick: () => setIsAdding(true)
            }}
          />

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1">
              <InputSearch 
                placeholder="Buscar en el catálogo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Vista Lista"
              >
                <ListIcon size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Vista Grilla"
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-8 pb-32">
        {isFetching && products.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="h-8 w-8 border-2 border-slate-100 border-t-amber-400 rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accediendo a bodega...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-200 mx-auto mb-6">
              <Package size={32} strokeWidth={1.5} />
            </div>
            <p className="font-serif italic text-slate-300 text-lg">No encontramos productos...</p>
          </div>
        ) : (
          <motion.div 
            layout
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className={viewMode === 'grid' 
              ? "grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6" 
              : "flex flex-col gap-3"
            }
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  image={p.image}
                  category={p.category}
                  isFavorite={p.is_favorite}
                  viewMode={viewMode}
                  onEdit={() => setEditingProduct(p)}
                  onDelete={() => setProductToDelete(p)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Modals */}
      {(editingProduct || isAdding) && (
        <ProductModal
          product={editingProduct || undefined}
          onClose={() => {
            setEditingProduct(null);
            setIsAdding(false);
          }}
          onRefresh={fetchProducts}
        />
      )}

      {productToDelete && (
        <ConfirmDeleteModal
          productName={productToDelete.name}
          onConfirm={handleDelete}
          onCancel={() => setProductToDelete(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
