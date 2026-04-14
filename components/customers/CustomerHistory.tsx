'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Debt } from '@/lib/actions/paymentLogic';
import { Calendar, CheckCircle2, Circle, Clock, History, Search } from 'lucide-react';

interface CustomerHistoryProps {
  debtorId: string;
}

export default function CustomerHistory({ debtorId }: CustomerHistoryProps) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('debtor_id', debtorId)
        .order('date', { ascending: false });

      if (!error && data) {
        setDebts(data);
      }
      setLoading(false);
    }

    if (debtorId) {
      fetchHistory();
    }
  }, [debtorId]);

  const filteredDebts = debts.filter(d => {
    if (filter === 'unpaid') return !d.is_paid;
    if (filter === 'paid') return d.is_paid;
    return true;
  });

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-10 w-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        <p className="text-slate-400 font-serif italic">Cargando libreta...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
            <History size={20} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-serif text-xl italic text-slate-900">Historial de Cuentas</h3>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Detalle de fiados y abonos</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'all' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
          >
            Todo
          </button>
          <button
            onClick={() => setFilter('unpaid')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'unpaid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
          >
            Pendientes
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredDebts.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-serif italic text-lg">No hay registros para mostrar</p>
          </div>
        ) : (
          filteredDebts.map((debt) => (
            <div
              key={debt.id}
              className={`group relative overflow-hidden bg-white border rounded-2xl p-5 transition-all duration-300 hover:shadow-md ${
                debt.is_paid ? 'border-slate-100 opacity-80' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {debt.is_paid ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <Clock size={14} className="text-amber-500" />
                    )}
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${debt.is_paid ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {debt.is_paid ? 'Saldado' : 'Pendiente'}
                    </span>
                  </div>
                  <p className="text-slate-900 font-medium leading-tight">{debt.description}</p>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar size={12} />
                    <span className="text-[11px] font-medium">{formatDate(debt.date)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-xl font-bold font-sans tracking-tight ${debt.amount < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {formatPrice(Math.abs(debt.amount))}
                  </p>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter">
                    {debt.amount < 0 ? 'Abono / Crédito' : 'Deuda'}
                  </span>
                </div>
              </div>
              
              {/* Decorative line for unpaid items */}
              {!debt.is_paid && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400/30" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
