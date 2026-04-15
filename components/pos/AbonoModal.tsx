'use client';

import React, { useState } from 'react';
import { useCustomers } from '@/store/useCustomers';
import { useTransactions } from '@/store/useTransactions';
import { X } from 'lucide-react';
import { registerAbono } from '@/app/actions/payments';
import { toast } from 'sonner';

interface AbonoModalProps {
  onClose: () => void;
}

export default function AbonoModal({ onClose }: AbonoModalProps) {
  const { customers, selectedCustomerId, updateBalance, fetchGlobalMetrics } = useCustomers();
  const { addTransaction } = useTransactions();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const customer = customers.find((c) => c.id === selectedCustomerId);
  if (!customer) return null;

  const formatBalance = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(amount);
    if (isNaN(val) || val <= 0) return;

    setIsSubmitting(true);
    try {
      const res = await registerAbono(customer.id, val);
      
      if (!res.success) {
        toast.error(res.error || 'Error al procesar el abono. ❌');
        setIsSubmitting(false);
        return;
      }

      await fetchGlobalMetrics();

      updateBalance(customer.id, -val);
      addTransaction({
        customerId: customer.id,
        customerName: customer.name,
        type: 'Abono',
        amount: val,
      });

      toast.success("Abono procesado correctamente 💰");
      onClose();
    } catch (err) {
      console.error('Error processing payment:', err);
      toast.error('Error de conexión. Inténtalo de nuevo ❌');
    } finally {
      setIsSubmitting(false);
    }
  };

  const newBalance = amount ? customer.balance - parseInt(amount || '0') : customer.balance;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-500 mb-1">Tesorería</p>
            <h2 className="font-serif text-2xl text-slate-900">Registrar Abono</h2>
            <p className="text-sm text-slate-400 mt-1">Cuenta de {customer.name}</p>
          </div>
          <button
            id="btn-close-abono"
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-7 pb-7 space-y-5">
          {/* Amount input */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400 block mb-2">Monto del abono (CLP)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
              <input
                autoFocus
                required
                type="number"
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pl-8 font-sans text-3xl font-semibold text-slate-900 tabular-nums placeholder:text-slate-300 focus:border-amber-300 focus:bg-white focus:outline-none transition-all"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Balance preview */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-5 py-4 animate-in fade-in duration-200">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Queda por pagar</span>
            <span className={`font-mono text-lg font-semibold tabular-nums ${newBalance <= 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
              {formatBalance(newBalance)}
            </span>
          </div>

          {/* Confirm button */}
          <button
            type="submit"
            id="btn-submit-abono"
            disabled={isSubmitting || !amount}
            className="w-full h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-semibold hover:bg-slate-800 active:scale-[0.99] transition-all duration-200 shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="font-serif text-lg italic">Confirmar Pago</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
