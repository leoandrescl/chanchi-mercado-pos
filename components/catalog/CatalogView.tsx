'use client';

import React, { useState, useEffect } from 'react';
import ProductCard from '@/components/pos/ProductCard';
import { useInventory } from '@/store/useInventory';
import { LayoutGrid, List as ListIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InputSearch from '@/components/ui/InputSearch';
import Link from 'next/link';
import FloatingCart from '@/components/pos/FloatingCart';
import PWAInstallButton from '@/components/pwa/PWAInstallButton';

interface CatalogViewProps {
  isAdmin?: boolean;
}

export default function CatalogView({ isAdmin = false }: CatalogViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { products, fetchProducts, isFetching } = useInventory();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const q = searchTerm.toLowerCase().trim();
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.category?.toLowerCase().includes(q) ?? false)
  );

  return (
    <div className={`flex flex-col ${!isAdmin ? 'min-h-screen bg-white' : ''}`}>
      {/* ─── ELEGANT CATALOG HEADER ─── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-50">
        <div className="mx-auto w-full max-w-5xl flex flex-col gap-4 px-6 py-3">
          {!isAdmin && (
            <div className="flex items-center justify-between">
              <Link href="/catalogo" className="flex flex-col leading-none group">
                <span className="font-serif text-2xl text-slate-900 tracking-tight transition-all group-hover:text-amber-600">ChanchiMercado</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-amber-400 mt-1">Catálogo de Productos 🎃</span>
              </Link>
              {/* PWA Install — compact pill in top-right */}
              <PWAInstallButton compact />
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <InputSearch
                placeholder="Busca algo rico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* ─── MAIN CATALOG ─── */}
      <main className="mx-auto w-full max-w-5xl px-6 py-2 pb-32">
        {/* Help Banner for Customers */}
        <div className="relative mb-8 p-4 bg-gradient-to-r from-orange-50 via-amber-50 to-purple-50 rounded-2xl border border-orange-100 flex items-center gap-4 overflow-hidden">
          <span className="absolute -right-1 -top-2 text-3xl opacity-70 hv-float pointer-events-none select-none">🦇</span>
          <span className="absolute right-10 bottom-0 text-lg opacity-60 hv-float hv-delay-2 pointer-events-none select-none">🕷️</span>
          <div className="h-10 w-10 rounded-full bg-orange-400 flex items-center justify-center shrink-0 shadow-sm text-lg">
            🎃
          </div>
          <div className="flex flex-col">
            <h4 className="text-xs font-black uppercase tracking-widest text-orange-600">Noche de compras</h4>
            <p className="text-sm text-amber-800 font-medium leading-tight">Haz clic en tus productos para agregarlos al carrito y enviarlo por WhatsApp.</p>
          </div>
        </div>

        {isFetching && products.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="h-8 w-8 border-2 border-slate-100 border-t-amber-400 rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preparando vitrina...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-40 text-center animate-in fade-in duration-500">
            <p className="font-serif italic text-slate-300 text-lg">No encontramos ese producto...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {viewMode === 'list' ? (
              <motion.div
                key="public-catalog-list"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-3"
              >
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.image}
                    viewMode="list"
                    isVisible={product.is_visible}
                    isPublic={true}
                    priority={index < 4}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="public-catalog-grid"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6"
              >
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.image}
                    viewMode="grid"
                    isVisible={product.is_visible}
                    isPublic={true}
                    priority={index < 4}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Boutique Footer */}
        <footer className="mt-32 flex flex-col items-center opacity-30 border-t border-slate-50 pt-12">
          <div className="h-px w-8 bg-slate-900 mb-6" />
          <span className="font-serif italic text-xs text-slate-900">Bienvenido a ChanchiMercado 🎃</span>
          <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-slate-400 mt-2 text-center">
            Precios sujetos a disponibilidad en el local
          </p>
          <p className="text-[10px] mt-3 tracking-[0.3em]">🦇 👻 🕷️</p>
        </footer>
      </main>

      <FloatingCart isPublic />
    </div>
  );
}
