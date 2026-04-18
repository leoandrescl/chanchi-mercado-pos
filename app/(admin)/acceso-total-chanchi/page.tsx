'use client';

import React, { useState, useEffect } from 'react';
import ProductCard from '@/components/pos/ProductCard';
import FloatingCart from '@/components/pos/FloatingCart';
import CustomerSelector from '@/components/pos/CustomerSelector';
import AbonoModal from '@/components/pos/AbonoModal';
import AddCustomerModal from '@/components/customers/AddCustomerModal';
import { useCustomers } from '@/store/useCustomers';
import { useInventory } from '@/store/useInventory';
import { useCart } from '@/store/useCart';
import GlobalDashboard from '@/components/pos/GlobalDashboard';
import { LayoutGrid, List as ListIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InputSearch from '@/components/ui/InputSearch';

export default function AdminPOSPage() {
  const [isAbonoOpen, setIsAbonoOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { selectedCustomerId, fetchCustomers, fetchGlobalMetrics } = useCustomers();
  const { products, fetchProducts } = useInventory();
  const { items } = useCart();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

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
    <div className="flex flex-col">
      {/* ─── CUSTOMER SELECTOR RIBBON ─── */}
      <CustomerSelector onOpenAbono={() => setIsAbonoOpen(true)} />

      {/* ─── STICKY SEARCH BAR ─── */}
      {selectedCustomerId && (
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-50 px-6 py-2">
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
      <main className="mx-auto w-full max-w-3xl px-4 py-2 md:px-6 md:py-4 pb-72">

        {!selectedCustomerId ? (
          <GlobalDashboard onAddCustomer={() => setIsAddCustomerOpen(true)} />
        ) : (
          <>
            <motion.div 
              layout
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className={viewMode === 'grid'
                ? "grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4"
                : "flex flex-col gap-2"
              }
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.image}
                    isVisible={product.is_visible}
                    viewMode={viewMode}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

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
      {isAddCustomerOpen && <AddCustomerModal onClose={() => setIsAddCustomerOpen(false)} />}
    </div>
  );
}
