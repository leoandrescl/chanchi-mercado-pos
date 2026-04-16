'use client';

import React, { useState } from 'react';
import { useCustomers } from '@/store/useCustomers';
import { useTransactions } from '@/store/useTransactions';
import { Wallet, Loader2 } from 'lucide-react';
import { registerAbono } from '@/app/actions/payments';
import { toast } from 'sonner';
import AdaptiveDialog from '@/components/ui/AdaptiveDialog';
import Button from '@/components/ui/Button';

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

  const amountInt = parseInt(amount || '0');
  const isExcessive = amountInt > customer.balance;
  const newBalance = customer.balance - amountInt;

  return (
    <AdaptiveDialog
      isOpen={true}
      onClose={onClose}
      title="Registrar Abono"
    >
      <div className="pb-6">
        <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Deuda Actual</span>
          <span className="text-2xl font-black text-slate-950 tabular-nums">{formatBalance(customer.balance)}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-4">Monto a abonar (CLP)</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                autoFocus
                required
                type="number"
                placeholder="0"
                className={`w-full h-14 pl-12 pr-6 rounded-xl border transition-all shadow-sm font-bold text-slate-950 tabular-nums text-sm ${
                  isExcessive 
                  ? 'border-rose-200 bg-rose-50 focus:border-rose-300' 
                  : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-50 focus:outline-none'
                }`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            {isExcessive && (
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-2 px-1 text-center leading-none">
                ⚠️ El abono supera la deuda
              </p>
            )}
          </div>

          <div className={`p-6 rounded-2xl border transition-all flex items-center justify-between shadow-sm ${isExcessive ? 'bg-slate-50/50 border-slate-100 opacity-30 grayscale' : 'bg-amber-50/20 border-amber-100/50'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Saldo Restante</span>
            <span className={`text-2xl font-black tabular-nums tracking-tighter ${newBalance <= 0 && !isExcessive ? 'text-emerald-600 font-black' : 'text-slate-950'}`}>
              {formatBalance(isExcessive ? 0 : newBalance)}
            </span>
          </div>

          <div className="pt-2 sticky bottom-0 bg-white">
            <Button
              type="submit"
              disabled={isSubmitting || !amount || isExcessive}
              size="large"
              fullWidth
              icon={!isSubmitting ? <Wallet size={20} /> : undefined}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Confirmar Abono'}
            </Button>
          </div>
        </form>
      </div>
    </AdaptiveDialog>
  );
}
