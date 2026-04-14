'use client';

import React, { useState, useEffect } from 'react';
import ProductCard from '@/components/pos/ProductCard';
import FloatingCart from '@/components/pos/FloatingCart';
import CustomerSelector from '@/components/pos/CustomerSelector';
import AbonoModal from '@/components/pos/AbonoModal';
import AddProductModal from '@/components/pos/AddProductModal';
import Link from 'next/link';
import { useCustomers } from '@/store/useCustomers';
import { useInventory } from '@/store/useInventory';
import GlobalDashboard from '@/components/pos/GlobalDashboard';
import { PlusCircle, History, ReceiptText, ShoppingBag, LayoutDashboard } from 'lucide-react';

export default function Home() {
  const [isAbonoOpen, setIsAbonoOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const { selectedCustomerId, fetchCustomers, fetchGlobalMetrics } = useCustomers();
  const { products } = useInventory();

  useEffect(() => {
    fetchCustomers();
    fetchGlobalMetrics();
  }, [fetchCustomers, fetchGlobalMetrics]);

  return (
    <div className="min-h-screen bg-white">

      {/* ─── FIXED GLASSMORPHISM HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-white/90 backdrop-blur-sm border-b border-amber-100 flex items-center">
        <div className="mx-auto w-full max-w-3xl flex items-center justify-between px-6">
          {/* Brand */}
          <Link href="/" className="flex flex-col leading-none group">
            <span className="font-serif text-2xl text-slate-900 tracking-tight">ChanchiMercado</span>
            <span className="text-[9px] font-medium uppercase tracking-[0.35em] text-amber-400 mt-0.5">Mercado & POS</span>
          </Link>

          {/* Nav Actions — icon + label style */}
          <nav className="flex items-center gap-1">
            <button
              id="btn-add-product"
              onClick={() => setIsAddProductOpen(true)}
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200 group"
            >
              <PlusCircle size={22} strokeWidth={1.5} />
              <span className="text-[9px] font-semibold uppercase tracking-widest">Añadir</span>
            </button>

            <button
              id="btn-abono"
              onClick={() => setIsAbonoOpen(true)}
              disabled={!selectedCustomerId}
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ReceiptText size={22} strokeWidth={1.5} />
              <span className="text-[9px] font-semibold uppercase tracking-widest">Abono</span>
            </button>

            <Link
              href="/historial"
              id="nav-historial"
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200"
            >
              <History size={22} strokeWidth={1.5} />
              <span className="text-[9px] font-semibold uppercase tracking-widest">Historial</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-20" />

      {/* ─── CUSTOMER SELECTOR RIBBON ─── */}
      <CustomerSelector />

        {/* ─── MAIN CONTENT ─── */}
        <main className="mx-auto w-full max-w-3xl px-6 py-10 pb-56">

          {!selectedCustomerId ? (
            <GlobalDashboard />
          ) : (
            <>
              {/* Section Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <ShoppingBag size={20} strokeWidth={1.5} className="text-amber-400" />
                  <h2 className="font-serif text-xl text-slate-700 tracking-tight">Menú de Hoy</h2>
                </div>
                <span className="text-xs font-medium text-slate-300 tracking-widest">{products.length} items</span>
              </div>

              {/* Product Grid */}
              <div className="flex flex-col gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.image}
                  />
                ))}
              </div>

              {/* Boutique Footer */}
              <footer className="mt-20 flex flex-col items-center opacity-20">
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
    </div>
  );
}
