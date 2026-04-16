'use client';

import React, { useState, useEffect } from 'react';
import ProductCard from '@/components/pos/ProductCard';
import FloatingCart from '@/components/pos/FloatingCart';
import CustomerSelector from '@/components/pos/CustomerSelector';
import AbonoModal from '@/components/pos/AbonoModal';
import AddCustomerModal from '@/components/customers/AddCustomerModal';
import Link from 'next/link';
import { useCustomers } from '@/store/useCustomers';
import { useInventory } from '@/store/useInventory';
import { useCart } from '@/store/useCart';
import GlobalDashboard from '@/components/pos/GlobalDashboard';
import { PlusCircle, ShoppingBag, LayoutDashboard, Star, LayoutGrid, List as ListIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InputSearch from '@/components/ui/InputSearch';
import ProductModal from '@/components/products/ProductModal';

export default function Home() {
  const [isAbonoOpen, setIsAbonoOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { selectedCustomerId, fetchCustomers, fetchGlobalMetrics } = useCustomers();
  const { products, fetchProducts } = useInventory();
  const { items } = useCart();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const isCartEmpty = items.length === 0;

  useEffect(() => {
    fetchCustomers();
    fetchGlobalMetrics();
    fetchProducts();
  }, [fetchCustomers, fetchGlobalMetrics, fetchProducts]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ─── FIXED GLASSMORPHISM HEADER ─── */}
      <header className="sticky top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-amber-50">
        <div className="mx-auto w-full max-w-3xl flex flex-col gap-2 px-4 py-2">
          {/* Brand */}
          <Link href="/" className="flex flex-col items-center text-center leading-none group mx-auto">
            <span className="font-serif text-2xl text-slate-900 tracking-tight transition-all group-hover:text-amber-600">ChanchiMercado</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-amber-400 mt-1">Mercado & Punto de Venta</span>
          </Link>

          {/* Nav Actions */}
          <nav className="flex items-center justify-between w-full">
            <button
              id="btn-add-product"
              onClick={() => setIsAddProductOpen(true)}
              className="flex flex-col items-center justify-center gap-1.5 px-2 py-2 rounded-2xl text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200"
            >
              <div className="h-8 w-8 flex items-center justify-center">
                <PlusCircle size={24} strokeWidth={1.5} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest leading-none text-center">Añadir Item</span>
            </button>

            <Link
              href="/clientes"
              className="flex flex-col items-center justify-center gap-1.5 px-2 py-2 rounded-2xl text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200"
            >
              <div className="h-8 w-8 flex items-center justify-center">
                <PlusCircle size={24} strokeWidth={1.5} className="rotate-45" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest leading-none text-center">Clientes</span>
            </Link>

            <Link
              href="/inventario"
              className="flex flex-col items-center justify-center gap-1.5 px-2 py-2 rounded-2xl text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200"
            >
              <div className="h-8 w-8 flex items-center justify-center">
                <LayoutDashboard size={24} strokeWidth={1.5} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest leading-none text-center">Productos</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── CUSTOMER SELECTOR RIBBON ─── */}
      <CustomerSelector onOpenAbono={() => setIsAbonoOpen(true)} />

      {/* ─── STICKY SEARCH BAR ─── */}
      {selectedCustomerId && (
        <div className="sticky top-[200px] z-30 bg-white/80 backdrop-blur-md border-b border-slate-50 px-6 py-4">
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <InputSearch
                  placeholder="Busca un producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT ─── */}
      <main className="mx-auto w-full max-w-3xl px-4 py-2 md:px-6 md:py-8 pb-72">

        {!selectedCustomerId ? (
          <GlobalDashboard onAddCustomer={() => setIsAddCustomerOpen(true)} />
        ) : (
          <>
            {/* Guidance Message */}
            {isCartEmpty && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-6 rounded-3xl bg-amber-50 border border-amber-100 flex items-center gap-4 text-amber-700 shadow-inner group"
              >
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Star size={18} className="text-amber-400 fill-amber-400" />
                </div>
                <p className="font-sans font-bold text-sm tracking-tight text-amber-900/70">
                  ✨ Marque sus <span className="text-amber-600 underline decoration-amber-200 underline-offset-4">favoritos</span> con la estrella para verlos primero.
                </p>
              </motion.div>
            )}

            {/* High-Density Grid/List Container */}
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4" 
              : "flex flex-col gap-2"
            }>
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.div
                    layout
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30
                    }}
                  >
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.image}
                      isFavorite={product.is_favorite}
                      viewMode={viewMode}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-20 text-center animate-in fade-in duration-500">
                <p className="font-serif italic text-slate-300 text-lg">No encontramos ese producto...</p>
              </div>
            )}

            {/* Boutique Footer */}
            <footer className="mt-20 flex flex-col items-center opacity-10">
              <div className="h-px w-8 bg-slate-900 mb-5" />
              <span className="font-serif italic text-xs text-slate-900">Hecho con infinito Amor por su hijo</span>
            </footer>
          </>
        )}
      </main>

      {/* ─── OVERLAYS ─── */}
      <FloatingCart />
      {isAbonoOpen && <AbonoModal onClose={() => setIsAbonoOpen(false)} />}
      {isAddProductOpen && <ProductModal onClose={() => setIsAddProductOpen(false)} onRefresh={fetchProducts} />}
      {isAddCustomerOpen && <AddCustomerModal onClose={() => setIsAddCustomerOpen(false)} />}
    </div>
  );
}
