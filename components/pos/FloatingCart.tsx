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

      <div className="fixed bottom-0 left-1/2 z-[70] w-full max-w-3xl -translate-x-1/2 px-4 sm:px-0">
        <motion.div
          layout
          initial={false}
          className="bg-white rounded-t-[2.5rem] shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden border-x border-t border-slate-100"
        >
          {/* ─── SUMMARY BAR ─── */}
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between px-8 py-8 cursor-pointer hover:bg-slate-50 transition-colors relative z-10"
          >
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="h-16 w-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white shadow-lg">
                  <ShoppingCart size={28} strokeWidth={1.5} />
                </div>
                <AnimatePresence mode="popLayout">
                  <motion.div 
                    key={itemCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-amber-400 border-[3px] border-white flex items-center justify-center pointer-events-none shadow-md"
                  >
                    <span className="text-xs font-black text-slate-900 leading-none">{itemCount}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-1">Total Pedido</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-4xl font-black text-slate-900 tracking-tight tabular-nums">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {!isExpanded && (
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                  Ver Detalle
                  <div className="h-10 w-10 rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-sm">
                    <ChevronUp size={20} className="text-slate-400" />
                  </div>
                </div>
              )}
              {isExpanded && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearCart(); setIsExpanded(false); }}
                  className="flex items-center justify-center h-12 w-12 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95 border border-rose-100"
                  title="Vaciar Carrito"
                >
                  <Trash2 size={20} />
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
                <div className="px-5 pb-32 pt-4 space-y-4 max-h-[55vh] overflow-y-auto">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4 px-1 text-center">Artículos en el pedido</p>
                  
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3"
                    >
                      {/* Zona 1: Izquierda - Info */}
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <h4 className="font-serif text-base font-bold text-slate-900 leading-tight italic truncate">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      {/* Zona 2: Centro - Cantidad */}
                      <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-1.5 border border-slate-100 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-slate-600 hover:text-rose-500 shadow-sm active:scale-90 transition-all border border-slate-100"
                        >
                          <Minus size={18} strokeWidth={2.5} />
                        </button>
                        <span className="w-6 text-center text-lg font-black text-slate-900 tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); addItem(item); }}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-slate-600 hover:text-emerald-500 shadow-sm active:scale-90 transition-all border border-slate-100"
                        >
                          <Plus size={18} strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Zona 3: Derecha - Subtotal/Acción */}
                      <div className="flex flex-col items-end justify-center gap-1 shrink-0 min-w-[70px]">
                        <p className="text-base font-black text-slate-900 tracking-tight leading-none">
                          {formatPrice(item.price * item.quantity).replace('$', '').trim()}
                        </p>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                          className="text-[9px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-600 transition-colors underline underline-offset-4"
                        >
                          Quitar
                        </button>
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
                      className="flex-1 h-16 rounded-2xl bg-white text-slate-900 border border-slate-200 flex items-center justify-center gap-2 transition-all duration-300 hover:bg-slate-50 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
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
                      className="flex-[2] h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-xl hover:shadow-amber-900/10 active:scale-[0.98] disabled:opacity-50 overflow-hidden relative group"
                      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
                    >
                      {isProcessing ? (
                        <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-amber-400/0 group-hover:bg-amber-400/5 transition-colors" />
                          <Send size={18} strokeWidth={1.5} className="text-emerald-400 transition-transform group-hover:scale-110" />
                          <span className="font-serif text-lg italic tracking-tight">Fiar y Enviar</span>
                          <ArrowRight size={16} className="text-emerald-400/50 group-hover:translate-x-2 transition-transform" />
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
