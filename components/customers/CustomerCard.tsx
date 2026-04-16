'use client';

import React from 'react';
import { Customer } from '@/store/useCustomers';
import { User, MessageCircle, Pencil, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface CustomerCardProps {
  customer: Customer;
  isSelected?: boolean;
  onCardClick: (customer: Customer) => void;
  onWhatsAppClick: (customer: Customer) => void;
  onEditClick: (customer: Customer) => void;
  loadingWhatsApp?: boolean;
  index?: number;
}

export default function CustomerCard({
  customer,
  isSelected = false,
  onCardClick,
  onWhatsAppClick,
  onEditClick,
  loadingWhatsApp = false,
  index = 0
}: CustomerCardProps) {
  
  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005 }}
      onClick={() => onCardClick(customer)}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={`group bg-white rounded-xl p-3 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
        isSelected 
          ? 'border-amber-400 bg-amber-50 shadow-md' 
          : 'border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200'
      }`}
    >
      {/* Left: Info */}
      <div className="flex items-center gap-4">
        <div className={`h-11 w-11 rounded-xl border flex items-center justify-center transition-all duration-500 shadow-inner shrink-0 ${
          isSelected 
            ? 'bg-amber-400 border-amber-400 text-white' 
            : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-amber-400 group-hover:border-amber-400 group-hover:text-white'
        }`}>
          <span className="text-lg font-black italic">
            {customer.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <h3 className={`text-[15px] font-bold tracking-tight leading-tight transition-colors truncate ${
            isSelected ? 'text-amber-600' : 'text-slate-950 group-hover:text-amber-600'
          }`}>
            {customer.name}
          </h3>
          <p className="text-[13px] font-medium leading-none mt-1.5">
            <span className={customer.whatsapp ? 'text-emerald-600' : 'text-slate-300'}>
              {customer.whatsapp || 'Sin Teléfono'}
            </span>
          </p>
        </div>
      </div>

      {/* Right: Balance & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-6">
        <div className="text-left sm:text-right">
          <span className={`text-lg font-black tabular-nums tracking-tighter ${customer.balance > 0 ? 'text-slate-950' : 'text-emerald-600'}`}>
            {formatPrice(customer.balance)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Perfil */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCardClick(customer);
            }}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-950 transition-all duration-200"
            title="Ver Perfil"
          >
            <User size={18} strokeWidth={2} />
          </button>

          {/* WhatsApp */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWhatsAppClick(customer);
            }}
            disabled={!customer.whatsapp || loadingWhatsApp}
            className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all duration-200 ${
              customer.whatsapp 
                ? 'bg-transparent text-emerald-500 hover:bg-emerald-50' 
                : 'text-slate-200 opacity-50 cursor-not-allowed'
            }`}
            title="Enviar WhatsApp"
          >
            {loadingWhatsApp ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <MessageCircle size={18} strokeWidth={2} />
            )}
          </button>

          {/* Editar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(customer);
            }}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-950 transition-all duration-200"
            title="Editar Datos"
          >
            <Pencil size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
