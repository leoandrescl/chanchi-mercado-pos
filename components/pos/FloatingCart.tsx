'use client';

import React, { useState } from 'react';
import { useCart } from '@/store/useCart';
import { useCustomers } from '@/store/useCustomers';
import { useTransactions } from '@/store/useTransactions';
import { ShoppingCart, Send, Plus, Minus, Trash2, ChevronUp, MessageCircle } from 'lucide-react';
import { addConsolidatedDebt } from '@/lib/actions/paymentLogic';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { generateWhatsAppLink, generateCustomerOrderLink } from '@/lib/whatsapp';

interface FloatingCartProps {
  isPublic?: boolean;
  onClick?: () => void;
}

export default function FloatingCart({ isPublic = false, onClick }: FloatingCartProps) {
  const { items, getTotal } = useCart();
  const total = getTotal();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  if (itemCount === 0) return null;

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] w-full max-w-lg px-6"
    >
      <button
        onClick={onClick}
        className="w-full h-20 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl shadow-slate-950/20 flex items-center justify-between px-8 group active:scale-95 transition-all"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <ShoppingCart size={24} />
            </div>
            <div className="absolute -top-2 -right-2 h-6 w-6 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-900">
              {itemCount}
            </div>
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none mb-1">Mi Pedido</p>
            <p className="text-2xl font-black tabular-nums tracking-tighter italic font-serif">
              {formatPrice(total)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">
          <span>Ver Carrito</span>
          <ChevronUp size={16} />
        </div>
      </button>
    </motion.div>
  );
}
