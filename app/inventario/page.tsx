'use client';

import React, { useState, useEffect } from 'react';
import { useInventory, Product } from '@/store/useInventory';
import { Package, Star, Edit3, Trash2, LayoutGrid, List as ListIcon } from 'lucide-react';
import ProductModal from '@/components/products/ProductModal';
import ConfirmDeleteModal from '@/components/products/ConfirmDeleteModal';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import HeaderPage from '@/components/ui/HeaderPage';
import InputSearch from '@/components/ui/InputSearch';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/pos/ProductCard';

export default function InventoryPage() {
  const { products, fetchProducts, updateProduct, removeProduct, addProduct, toggleFavorite, isFetching } = useInventory();
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

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  return (
    <div className="min-h-screen bg-[#FDFCF9] px-6 sm:px-12 py-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-12">
        <HeaderPage 
          title="Gestión de Inventario"
          primaryAction={{
            label: "Agregar Nuevo",
            onClick: () => setIsAdding(true)
          }}
        />

        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <InputSearch 
                placeholder="Buscar en el catálogo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Vista Lista"
              >
                <ListIcon size={20} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Vista Grilla"
              >
                <LayoutGrid size={20} />
              </button>
            </div>
          </div>

          <main>
            {isFetching && products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="h-12 w-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                <p className="font-bold text-slate-300 uppercase tracking-widest text-[10px]">Cargando catálogo...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-24 text-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-200 mx-auto mb-6">
                  <Package size={32} strokeWidth={1.5} />
                </div>
                <p className="font-bold text-slate-300 text-lg">No encontramos productos...</p>
              </div>
            ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8" 
              : "flex flex-col gap-2"
            }>
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((p, index) => (
                  <motion.div
                    layout
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.01 }}
                  >
                    <ProductCard
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
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            )}
          </main>
        </div>
      </div>

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
