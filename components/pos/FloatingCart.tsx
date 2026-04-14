'use client';

import React, { useState } from 'react';
import { useCart } from '@/store/useCart';
import { useCustomers } from '@/store/useCustomers';
import { useTransactions } from '@/store/useTransactions';
import { ShoppingCart, X, ArrowRight, Wallet, Send, Plus, Minus, Trash2, ChevronUp } from 'lucide-react';
import { addConsolidatedDebt } from '@/lib/actions/paymentLogic';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingCart() {
  const { items, addItem, removeItem, deleteItem, clearCart, getTotal } = useCart();
  const [isExpanded, setIsExpanded] = useState(false);
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
      toast.error('Selecciona un cliente para fiar');
      return;
    }

    setIsProcessing(true);
    
    try {
      const previousBalance = selectedCustomer.balance;
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
      toast.success("Deuda registrada con éxito ✅");

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
      setIsExpanded(false);
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Error de conexión. Inténtalo de nuevo ❌');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-1/2 z-[70] w-full max-w-3xl -translate-x-1/2">
        <motion.div
          layout
          initial={false}
          className="bg-white rounded-t-[2.5rem] shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden border-x border-t border-slate-100"
        >
          {/* ─── SUMMARY BAR ─── */}
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between px-8 py-6 cursor-pointer hover:bg-slate-50 transition-colors relative z-10"
          >
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                  <ShoppingCart size={22} strokeWidth={1.5} />
                </div>
                <AnimatePresence mode="popLayout">
                  <motion.div 
                    key={itemCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -right-1.5 -top-1.5 h-6 w-6 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center pointer-events-none"
                  >
                    <span className="text-[11px] font-bold text-slate-900 leading-none">{itemCount}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="leading-tight">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400 mb-1">Total Pedido</p>
                <span className="font-sans text-3xl font-medium text-slate-900 tracking-tight tabular-nums">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {!isExpanded && (
                <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Ver Detalle
                  <ChevronUp size={14} />
                </div>
              )}
              {isExpanded && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearCart(); setIsExpanded(false); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Vaciar
                </button>
              )}
            </div>
          </div>

          {/* ─── DRAWER CONTENT ─── */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-slate-50/50"
              >
                <div className="px-8 pb-32 pt-2 space-y-4 max-h-[50vh] overflow-y-auto">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-4 px-1">Artículos en el carrito</p>
                  
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
                    >
                      <div className="flex-1">
                        <h4 className="font-sans font-bold text-slate-900 text-sm leading-tight">{item.name}</h4>
                        <p className="text-xs text-slate-400 font-medium mt-1">{formatPrice(item.price)} c/u</p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-white text-slate-600 hover:text-slate-900 shadow-sm active:scale-90 transition-all"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-slate-900 tabular-nums">{item.quantity}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); addItem(item); }}
                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-white text-slate-600 hover:text-slate-900 shadow-sm active:scale-90 transition-all"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="w-20 text-right leading-tight">
                          <p className="text-xs font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</p>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                            className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter hover:text-rose-600 transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ─── STICKY FOOTER ─── */}
                <div className="p-6 bg-white border-t border-slate-100">
                  <div className="flex gap-3 max-w-3xl mx-auto">
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

                    <button
                      onClick={() => handleCheckout(true)}
                      disabled={isProcessing}
                      className="flex-[2] h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 overflow-hidden relative group"
                      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
                    >
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
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
