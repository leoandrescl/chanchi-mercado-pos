'use client';

import React, { useState, useEffect } from 'react';
import { useInventory, Product } from '@/store/useInventory';
import { Search, Plus, Edit3, Trash2, ArrowLeft, Package, LayoutGrid, List, Star } from 'lucide-react';
import Link from 'next/link';
import ProductModal from '@/components/inventory/ProductModal';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function InventoryPage() {
  const { products, fetchProducts, updateProduct, removeProduct, addProduct, toggleFavorite, isFetching } = useInventory();
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar "${name}"? Esta acción no se puede deshacer.`)) {
      try {
        await removeProduct(id);
        toast.success("Producto eliminado del catálogo 🗑️");
      } catch (err) {
        toast.error("Error al eliminar el producto");
      }
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col">
      {/* Editorial Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-900 hover:text-white transition-all duration-300">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-amber-500 mb-1">Módulo Administrativo</p>
              <h1 className="font-serif text-3xl text-slate-900 italic">Gestión de Inventario</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="text"
                placeholder="Buscar en el catálogo..."
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm focus:bg-white focus:border-amber-200 focus:outline-none transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsAdding(true)}
              className="h-12 px-6 rounded-2xl bg-slate-900 text-white font-semibold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Nuevo Ítem</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        {isFetching && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="h-12 w-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
            <p className="font-serif italic text-slate-400">Consultando catálogo maestro...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
            <Package size={48} className="mx-auto text-slate-100 mb-4" />
            <p className="font-serif text-2xl text-slate-300 italic">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            <AnimatePresence>
              {filteredProducts.map((p) => (
                <motion.div
                  layout
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
                >
                  {/* Favorite Toggle (Absolute) */}
                  <button
                    onClick={() => toggleFavorite(p.id)}
                    className={`absolute top-4 left-4 md:top-6 md:left-6 z-20 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-90 ${
                      p.is_favorite 
                        ? 'bg-amber-400 text-white shadow-amber-200 shadow-lg scale-110' 
                        : 'bg-white/80 backdrop-blur-sm text-slate-300 hover:text-amber-400'
                    }`}
                  >
                    <Star size={16} className="md:w-[18px] md:h-[18px]" fill={p.is_favorite ? 'currentColor' : 'none'} />
                  </button>

                  {/* Product Visual */}
                  <div className="aspect-[4/5] bg-slate-50 overflow-hidden relative">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100">
                        <h3 className="font-serif text-2xl md:text-4xl text-slate-200 leading-tight uppercase tracking-tighter transition-all group-hover:text-slate-300">
                          {p.name}
                        </h3>
                        {p.category && (
                          <span className="mt-2 md:mt-4 px-3 py-1 rounded-full bg-white/50 text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-slate-400">
                            {p.category}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Action Overlay */}
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2 md:gap-3">
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="h-10 w-10 md:h-12 md:w-12 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-xl hover:scale-110 transition-transform active:scale-95"
                      >
                        <Edit3 size={18} className="md:w-5 md:h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="h-10 w-10 md:h-12 md:w-12 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform active:scale-95"
                      >
                        <Trash2 size={18} className="md:w-5 md:h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Info Panel */}
                  <div className="p-4 md:p-8">
                    <div className="flex justify-between items-start mb-1 md:mb-2">
                       <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">
                        {p.category || 'General'}
                      </span>
                      <span className="font-serif text-sm md:text-xl font-bold text-slate-900 italic">
                        {formatPrice(p.price)}
                      </span>
                    </div>
                    <h3 className="font-serif text-base md:text-2xl text-slate-900 leading-tight truncate">
                      {p.name}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
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
          onSave={async (data) => {
            if (editingProduct) {
              await updateProduct(editingProduct.id, data);
            } else {
              await addProduct(data);
            }
          }}
        />
      )}
    </div>
  );
}
