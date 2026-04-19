'use client';

import React, { useState, useEffect } from 'react';
import ProductGrid from '@/components/pos/ProductGrid';
import CartDrawer from '@/components/pos/CartDrawer';
import FloatingCart from '@/components/pos/FloatingCart';
import CustomerSelector from '@/components/pos/CustomerSelector';
import AbonoModal from '@/components/pos/AbonoModal';
import AddCustomerModal from '@/components/customers/AddCustomerModal';
import { useCustomers } from '@/store/useCustomers';
import { useInventory } from '@/store/useInventory';
import { useCart } from '@/store/useCart';
import { useTransactions } from '@/store/useTransactions';
import { addConsolidatedDebt } from '@/lib/actions/paymentLogic';
import GlobalDashboard from '@/components/pos/GlobalDashboard';
import { LayoutGrid, List as ListIcon, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InputSearch from '@/components/ui/InputSearch';
import { toast } from 'sonner';

export default function AdminPOSPage() {
  const [isAbonoOpen, setIsAbonoOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { customers, selectedCustomerId, fetchCustomers, fetchGlobalMetrics, updateBalance } = useCustomers();
  const { products, fetchProducts } = useInventory();
  const { items, clearCart, total } = useCart();
  const { addTransaction } = useTransactions();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  useEffect(() => {
    fetchCustomers();
    fetchGlobalMetrics();
    fetchProducts();
  }, [fetchCustomers, fetchGlobalMetrics, fetchProducts]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckout = async () => {
    if (!selectedCustomer) {
      toast.error('Selecciona un cliente para fiar');
      return;
    }

    setIsProcessing(true);
    try {
      await addConsolidatedDebt(selectedCustomer.id, items, total);
      
      updateBalance(selectedCustomer.id, total);
      addTransaction({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        type: 'Venta',
        amount: total,
        items: items.map((i) => `${i.name} x${i.quantity}`).join(', '),
      });

      await fetchGlobalMetrics();
      toast.success("✅ Venta registrada con éxito");
      clearCart();
      setIsCartOpen(false);
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Error al registrar la venta ❌');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFCF9]">
      {/* ─── CUSTOMER SELECTOR RIBBON ─── */}
      <CustomerSelector onOpenAbono={() => setIsAbonoOpen(true)} />

      {/* ─── STICKY SEARCH BAR ─── */}
      {selectedCustomerId && (
        <div className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-slate-100 px-6 py-4 transition-all">
          <div className="mx-auto w-full max-w-5xl">
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <InputSearch
                  placeholder="Buscar producto (ej: Coca Cola, Pan...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/50"
                />
              </div>
              <div className="flex bg-slate-100/50 p-1.5 rounded-2xl backdrop-blur-md border border-white shrink-0">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-amber-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Vista Lista"
                >
                  <ListIcon size={22} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-amber-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Vista Grilla"
                >
                  <LayoutGrid size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT ─── */}
      <main className="mx-auto w-full max-w-5xl px-6 py-8 pb-72">
        {!selectedCustomerId ? (
          <GlobalDashboard onAddCustomer={() => setIsAddCustomerOpen(true)} />
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="font-serif italic text-2xl text-slate-900">Catálogo</h2>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {filteredProducts.length} items encontrados
              </div>
            </div>

            <ProductGrid 
              products={filteredProducts} 
              viewMode={viewMode}
            />

            {filteredProducts.length === 0 && (
              <div className="py-32 text-center animate-in fade-in zoom-in duration-500">
                <div className="h-24 w-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-slate-200">
                  <ShoppingBag size={48} strokeWidth={1} />
                </div>
                <p className="font-serif italic text-slate-400 text-xl">No encontramos coincidencias...</p>
              </div>
            )}

            {/* Boutique Footer */}
            <footer className="mt-32 flex flex-col items-center opacity-10">
              <div className="h-px w-12 bg-slate-900 mb-6" />
              <span className="font-serif italic text-sm text-slate-900 tracking-wider">ChanchiMercado Boutique</span>
            </footer>
          </div>
        )}
      </main>

      {/* ─── OVERLAYS ─── */}
      <FloatingCart onClick={() => setIsCartOpen(true)} />
      
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckout}
        isProcessing={isProcessing}
      />

      <AnimatePresence>
        {isAbonoOpen && <AbonoModal onClose={() => setIsAbonoOpen(false)} />}
        {isAddCustomerOpen && <AddCustomerModal onClose={() => setIsAddCustomerOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
