'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/store/useCart';
import { useCustomers } from '@/store/useCustomers';
import { useTransactions } from '@/store/useTransactions';
import { ShoppingCart, Send, Plus, Minus, Trash2, ChevronUp, CreditCard } from 'lucide-react';
import { addConsolidatedDebt } from '@/lib/actions/paymentLogic';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { generateWhatsAppLink, generateCustomerOrderLink } from '@/lib/whatsapp';

interface FloatingCartProps {
  isPublic?: boolean;
}

export default function FloatingCart({ isPublic = false }: FloatingCartProps) {
  const { items, addItem, removeItem, deleteItem, clearCart, getTotal } = useCart();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shouldBounce, setShouldBounce] = useState(false);

  const { customers, selectedCustomerId, updateBalance, fetchGlobalMetrics } = useCustomers();
  const { addTransaction } = useTransactions();

  const total = getTotal();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleAdded = () => {
      setShouldBounce(true);
      setTimeout(() => setShouldBounce(false), 300);
    };
    window.addEventListener('product-added', handleAdded);
    return () => window.removeEventListener('product-added', handleAdded);
  }, []);

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
      toast.success("✅ Venta registrada con éxito");

      if (sendWhatsApp) {
        const link = generateWhatsAppLink({
          customerName: selectedCustomer.name,
          phone: selectedCustomer.whatsapp,
          total,
          previousBalance,
          newBalance: previousBalance + total,
          items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
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

  const handlePublicOrder = async () => {
    setIsProcessing(true);
    try {
      const link = generateCustomerOrderLink({
        items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        total
      });
      window.open(link, '_blank');
      toast.success("🚀 Redirigiendo a WhatsApp...");
      clearCart();
      setIsExpanded(false);
    } catch (err) {
      toast.error("Error al generar el pedido");
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

      <div className="fixed bottom-0 left-1/2 z-[70] w-full max-w-3xl -translate-x-1/2 px-4 pb-4">
        <motion.div
          layout
          initial={false}
          animate={{ scale: shouldBounce ? 1.05 : 1 }}
          className="bg-white/80 backdrop-blur-2xl rounded-[3rem] shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden border border-white/20"
        >
          {/* ─── SUMMARY BAR ─── */}
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between px-8 py-6 cursor-pointer hover:bg-white/50 transition-colors relative z-10"
          >
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${isPublic ? 'bg-amber-500' : 'bg-slate-900'}`}>
                  <ShoppingCart size={24} />
                </div>
                <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-[10px] font-black text-white">
                  {itemCount}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-0.5">Total Pedido</p>
                <span className="font-serif text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {!isExpanded && (
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                  Ver Detalle
                  <ChevronUp size={18} className="text-slate-400" />
                </div>
              )}
              {isExpanded && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearCart(); setIsExpanded(false); }}
                  className="h-11 w-11 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                >
                  <Trash2 size={18} />
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
                className="overflow-hidden"
              >
                <div className="px-6 pb-24 pt-4 space-y-3 max-h-[50vh] overflow-y-auto">
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-4 bg-slate-50/50 rounded-[2rem] border border-white gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif italic font-bold text-slate-900 truncate">{item.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatPrice(item.price)}</p>
                      </div>

                      <div className="flex items-center gap-3 bg-white rounded-xl p-1 shadow-sm">
                        <button
                          onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-black text-slate-900 tabular-nums">{item.quantity}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); addItem(item); }}
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-black text-slate-900">{formatPrice(item.price * item.quantity)}</p>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                          className="text-[9px] font-bold text-rose-400 uppercase tracking-widest"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-white/50 backdrop-blur-md border-t border-white/20">
                  <button
                    onClick={() => (isPublic ? handlePublicOrder() : handleCheckout(false))}
                    disabled={isProcessing}
                    className="w-full h-16 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
                  >
                    {isProcessing ? (
                      <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard size={20} className="text-amber-400" />
                        <span className="font-serif italic text-lg">
                          {isPublic ? 'Enviar pedido por WhatsApp' : 'Finalizar y Fiar'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
