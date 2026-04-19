'use client';

import React from 'react';
import { useCart } from '@/store/useCart';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, CreditCard } from 'lucide-react';
import { playPop } from '@/lib/audio';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void;
  isProcessing?: boolean;
}

export default function CartDrawer({ isOpen, onClose, onCheckout, isProcessing }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-[1000]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white/80 backdrop-blur-2xl z-[1001] shadow-2xl border-l border-white/20 flex flex-col"
          >
            {/* Header */}
            <div className="p-8 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h2 className="font-serif italic text-2xl text-slate-900">Carrito</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {items.length} {items.length === 1 ? 'producto' : 'productos'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center"
              >
                <X size={24} />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30 grayscale">
                  <ShoppingBag size={64} strokeWidth={1} />
                  <p className="font-serif italic text-xl">El carrito está vacío</p>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    layout
                    key={item.id}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                      <p className="text-sm font-black text-amber-500 tabular-nums">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                        <button
                          onClick={() => { updateQuantity(item.id, item.quantity - 1); playPop(); }}
                          className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-bold text-slate-900 text-sm tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => { updateQuantity(item.id, item.quantity + 1); playPop(); }}
                          className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => { removeItem(item.id); playPop(); }}
                        className="h-10 w-10 text-rose-100 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all flex items-center justify-center"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-8 bg-slate-50/50 backdrop-blur-md border-t border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total a pagar</span>
                  <span className="text-4xl font-black text-slate-950 tabular-nums tracking-tighter">
                    {formatPrice(total)}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  <button
                    onClick={() => { clearCart(); playPop(); }}
                    className="col-span-1 h-16 rounded-3xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all flex items-center justify-center active:scale-95 shadow-sm"
                    title="Vaciar carrito"
                  >
                    <Trash2 size={24} />
                  </button>
                  <button
                    onClick={onCheckout}
                    disabled={isProcessing}
                    className="col-span-4 h-16 rounded-3xl bg-slate-950 text-white font-bold flex items-center justify-center gap-3 active:scale-95 shadow-2xl shadow-slate-200 transition-all hover:bg-slate-900 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard size={20} className="text-amber-400" />
                        <span>Confirmar Venta</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
