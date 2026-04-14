'use client';

import React, { useState, useEffect } from 'react';
import ProductCard from '@/components/pos/ProductCard';
import FloatingCart from '@/components/pos/FloatingCart';
import CustomerSelector from '@/components/pos/CustomerSelector';
import AbonoModal from '@/components/pos/AbonoModal';
import AddProductModal from '@/components/pos/AddProductModal';
import AddCustomerModal from '@/components/customers/AddCustomerModal';
import Link from 'next/link';
import { useCustomers } from '@/store/useCustomers';
import { useInventory } from '@/store/useInventory';
import GlobalDashboard from '@/components/pos/GlobalDashboard';
import { PlusCircle, ShoppingBag, LayoutDashboard } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function Home() {
  const [isAbonoOpen, setIsAbonoOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { selectedCustomerId, fetchCustomers, fetchGlobalMetrics } = useCustomers();
  const { products, fetchProducts } = useInventory();

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
      <header className="sticky top-0 left-0 right-0 z-50 h-20 bg-white/95 backdrop-blur-md border-b border-amber-50 flex items-center">
        <div className="mx-auto w-full max-w-3xl flex items-center justify-between px-6">
          {/* Brand */}
          <Link href="/" className="flex flex-col leading-none group">
            <span className="font-serif text-2xl text-slate-900 tracking-tight">ChanchiMercado</span>
            <span className="text-[9px] font-medium uppercase tracking-[0.35em] text-amber-400 mt-0.5">Mercado & POS</span>
          </Link>

          {/* Nav Actions */}
          <nav className="flex items-center gap-1">
            <button
              id="btn-add-product"
              onClick={() => setIsAddProductOpen(true)}
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200"
            >
              <PlusCircle size={20} strokeWidth={1.5} />
              <span className="text-[8px] font-bold uppercase tracking-widest">Añadir</span>
            </button>

            <Link
              href="/inventario"
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200"
            >
              <LayoutDashboard size={20} strokeWidth={1.5} />
              <span className="text-[8px] font-bold uppercase tracking-widest">Gestión</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── CUSTOMER SELECTOR RIBBON ─── */}
      <CustomerSelector />

      {/* ─── STICKY SEARCH BAR ─── */}
      {selectedCustomerId && (
        <div className="sticky top-20 z-30 bg-white/80 backdrop-blur-md border-b border-slate-50 px-6 py-4">
          <div className="mx-auto w-full max-w-3xl">
            <div className="relative group">
              <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-400 transition-colors" size={18} />
              <input
                type="text"
                placeholder="¿Qué busca el cliente hoy?"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-amber-200 focus:outline-none transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT ─── */}
      <main className="mx-auto w-full max-w-3xl px-6 py-8 pb-72">

        {!selectedCustomerId ? (
          <GlobalDashboard onAddCustomer={() => setIsAddCustomerOpen(true)} />
        ) : (
          <>
            {/* High-Density Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.image}
                  />
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
              <span className="font-serif italic text-xs text-slate-900">Sabores de autor</span>
            </footer>
          </>
        )}
      </main>

      {/* ─── OVERLAYS ─── */}
      <FloatingCart />
      {isAbonoOpen && <AbonoModal onClose={() => setIsAbonoOpen(false)} />}
      {isAddProductOpen && <AddProductModal onClose={() => setIsAddProductOpen(false)} />}
      {isAddCustomerOpen && <AddCustomerModal onClose={() => setIsAddCustomerOpen(false)} />}
    </div>
  );
}
