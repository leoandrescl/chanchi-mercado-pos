'use client';

import React from 'react';
import { Customer } from '@/store/useCustomers';
import { Phone, Edit2, Loader2 } from 'lucide-react';
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
      whileHover={{ scale: 1.01 }}
      onClick={() => onCardClick(customer)}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={`group bg-white rounded-3xl p-2.5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer ${
        isSelected 
          ? 'border-amber-400 bg-amber-50 shadow-lg scale-[1.01]' 
          : 'border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200'
      }`}
    >
      {/* Left: Info */}
      <div className="flex items-center gap-3.5">
        <div className={`h-10 w-10 rounded-2xl border flex items-center justify-center transition-all duration-500 shadow-inner shrink-0 ${
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
          <p className="text-[13px] font-medium leading-none mt-1">
            <span className={customer.whatsapp ? 'text-emerald-600' : 'text-slate-300'}>
              {customer.whatsapp || 'Sin Teléfono'}
            </span>
          </p>
        </div>
      </div>

      {/* Right: Balance & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-5">
        <div className="text-left sm:text-right">
          <span className={`text-lg font-black tabular-nums tracking-tighter ${customer.balance > 0 ? 'text-slate-950' : 'text-emerald-600'}`}>
            {formatPrice(customer.balance)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={customer.whatsapp ? { scale: 1.1, backgroundColor: '#059669', color: '#ffffff' } : {}}
            whileTap={customer.whatsapp ? { scale: 0.9 } : {}}
            onClick={(e) => {
              e.stopPropagation();
              onWhatsAppClick(customer);
            }}
            disabled={!customer.whatsapp || loadingWhatsApp}
            className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all duration-200 shadow-sm ${
              customer.whatsapp 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-slate-50 text-slate-200 cursor-not-allowed'
            }`}
            title="Enviar Detalle WhatsApp"
          >
            {loadingWhatsApp ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Phone size={16} strokeWidth={2.5} />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: '#0f172a', color: '#ffffff' }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(customer);
            }}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-900 transition-colors duration-200 shadow-sm"
            title="Editar Datos"
          >
            <Edit2 size={16} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
