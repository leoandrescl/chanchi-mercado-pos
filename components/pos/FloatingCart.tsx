'use client';

import React, { useState } from 'react';
import { useCart } from '@/store/useCart';
import { useCustomers } from '@/store/useCustomers';
import { useTransactions } from '@/store/useTransactions';
import { ShoppingCart, X, ArrowRight, Wallet, Send } from 'lucide-react';
import { addConsolidatedDebt } from '@/lib/actions/paymentLogic';

export default function FloatingCart() {
  const items = useCart((state) => state.items);
  const getTotal = useCart((state) => state.getTotal);
  const clearCart = useCart((state) => state.clearCart);
  
  const [isProcessing, setIsProcessing] = useState(false);

  const { customers, selectedCustomerId, updateBalance, fetchGlobalMetrics } = useCustomers();
  const { addTransaction } = useTransactions();

  const total = getTotal();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  if (itemCount === 0) return null;

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  const handleCheckout = async (sendWhatsApp: boolean = false) => {
    if (!selectedCustomer) {
      alert('Venta realizada por ' + formatPrice(total));
      clearCart();
      return;
    }

    setIsProcessing(true);
    
    try {
      // 1. Capture current balance as previousBalance
      const previousBalance = selectedCustomer.balance;
      
      // 2. Persist to Supabase
      await addConsolidatedDebt(selectedCustomer.id, items, total);

      // 3. Local update (Optimistic)
      updateBalance(selectedCustomer.id, total);
      addTransaction({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        type: 'Venta',
        amount: total,
        items: items.map((i) => `${i.name} x${i.quantity}`).join(', '),
      });

      // 4. Refresh global view
      await fetchGlobalMetrics();

      // 5. Conditional WhatsApp logic
      if (sendWhatsApp) {
        const { generateWhatsAppLink } = await import('@/lib/whatsapp');
        const link = generateWhatsAppLink({
          customerName: selectedCustomer.name,
          phone: selectedCustomer.whatsapp,
          total,
          previousBalance,
          newBalance: previousBalance + total,
          items: items.map((i) => ({ name: i.name, quantity: i.quantity })),
        });
        window.open(link, '_blank');
      }

      clearCart();
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Error al registrar la venta. Inténtalo de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15),0_0_0_1px_rgba(251,191,36,0.08)] overflow-hidden">

        {/* Cart summary row */}
        <div className="flex items-center justify-between px-6 py-5">
          {/* Cart icon + total */}
          <div className="flex items-center gap-5">
            {/* Icon with badge */}
            <div className="relative shrink-0">
              <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                <ShoppingCart size={22} strokeWidth={1.5} />
              </div>
              <div className="absolute -right-1.5 -top-1.5 h-6 w-6 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
                <span className="text-[11px] font-semibold text-slate-900 leading-none tabular-nums">{itemCount}</span>
              </div>
            </div>

            {/* Total */}
            <div className="leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400 mb-0.5">Total</p>
              <span className="font-sans text-4xl font-medium text-slate-900 tracking-tight tabular-nums">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Clear button */}
          <button
            id="btn-clear-cart"
            onClick={clearCart}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-slate-400 hover:border-rose-200 hover:text-rose-400 hover:bg-rose-50 transition-all duration-200"
          >
            <X size={14} strokeWidth={2} />
            Vaciar
          </button>
        </div>

        {/* CTA Buttons */}
        <div className="px-5 pb-5">
          <div className="flex gap-3">
            {/* Action 1: Just Save */}
            <button
              onClick={() => handleCheckout(false)}
              disabled={isProcessing}
              className="flex-1 h-16 rounded-2xl bg-white text-slate-900 border border-slate-200 flex items-center justify-center gap-2 transition-all duration-300 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="h-4 w-4 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
              ) : (
                <>
                  <Wallet size={18} strokeWidth={1.5} className="text-slate-400" />
                  <span className="font-serif text-lg italic tracking-tight">Fiar</span>
                </>
              )}
            </button>

            {/* Action 2: Save and Send */}
            <button
              onClick={() => handleCheckout(true)}
              disabled={isProcessing}
              className="flex-[2] h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 overflow-hidden relative group"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
            >
              <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity" />
              {isProcessing ? (
                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} strokeWidth={1.5} className="text-emerald-400" />
                  <span className="font-serif text-lg italic tracking-tight">Fiar y Enviar</span>
                  <ArrowRight size={16} className="text-emerald-400/50 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
