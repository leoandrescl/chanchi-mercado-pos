'use client';

import React from 'react';
import { useCart } from '@/store/useCart';
import { useCustomers } from '@/store/useCustomers';
import { useTransactions } from '@/store/useTransactions';
import { ShoppingCart, X, ArrowRight, Wallet, Send } from 'lucide-react';
import { addConsolidatedDebt } from '@/lib/actions/paymentLogic';

export default function FloatingCart() {
  const items = useCart((state) => state.items);
  const getTotal = useCart((state) => state.getTotal);
  const clearCart = useCart((state) => state.clearCart);

  const { customers, selectedCustomerId, updateBalance, fetchGlobalMetrics } = useCustomers();
  const { addTransaction } = useTransactions();

  const total = getTotal();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  if (itemCount === 0) return null;

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  const handleCheckout = () => {
    if (selectedCustomer) {
      // Create debt in Supabase
      addConsolidatedDebt(selectedCustomer.id, items, total)
        .then(() => fetchGlobalMetrics())
        .catch(console.error);

      updateBalance(selectedCustomer.id, total);
      addTransaction({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        type: 'Venta',
        amount: total,
        items: items.map((i) => `${i.name} x${i.quantity}`).join(', '),
      });

      import('@/lib/whatsapp').then(({ generateWhatsAppLink }) => {
        const link = generateWhatsAppLink({
          customerName: selectedCustomer.name,
          phone: selectedCustomer.whatsapp,
          total,
          newBalance: selectedCustomer.balance - total,
          items: items.map((i) => ({ name: i.name, quantity: i.quantity })),
        });
        window.open(link, '_blank');
      });

      clearCart();
    } else {
      alert('Venta realizada por ' + formatPrice(total));
      clearCart();
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

        {/* CTA Button */}
        <div className="px-5 pb-5">
          <button
            id="btn-checkout"
            onClick={handleCheckout}
            className="group w-full h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center gap-3 transition-all duration-300 hover:bg-slate-800 hover:shadow-lg active:scale-[0.99]"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
          >
            {selectedCustomer ? (
              <Wallet size={20} strokeWidth={1.5} className="text-amber-400" />
            ) : (
              <Send size={20} strokeWidth={1.5} className="text-amber-400" />
            )}
            <span className="font-serif text-xl italic tracking-tight">
              {selectedCustomer ? `Fiar a ${selectedCustomer.name.split(' ')[0]}` : 'Cobrar en Efectivo'}
            </span>
            <ArrowRight
              size={18}
              strokeWidth={1.5}
              className="text-amber-400 group-hover:translate-x-1 transition-transform duration-300"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
