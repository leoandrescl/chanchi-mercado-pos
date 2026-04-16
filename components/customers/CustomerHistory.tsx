'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Debt } from '@/lib/actions/paymentLogic';
import { Calendar, CheckCircle2, Clock, History, Send } from 'lucide-react';
import { useCustomers } from '@/store/useCustomers';
import { generateMonthlyReport } from '@/lib/whatsapp';
import { toast } from 'sonner';

interface CustomerHistoryProps {
  debtorId: string;
}

interface GroupedDebts {
  [key: string]: {
    label: string;
    items: Debt[];
    subtotal: number;
  };
}

export default function CustomerHistory({ debtorId }: CustomerHistoryProps) {
  const { customers } = useCustomers();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [viewMode, setViewMode] = useState<'all' | 'currentMonth'>('currentMonth');

  const customer = customers.find(c => c.id === debtorId);

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

  const getMonthLabel = (dateStr: string) => {
    return new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(new Date(dateStr));
  };

  // Grouping logic
  const groupedData: GroupedDebts = debts.reduce((acc: GroupedDebts, debt: Debt) => {
    const label = getMonthLabel(debt.date);
    const key = label.toLowerCase().replace(/\s/g, '-');
    
    if (!acc[key]) {
      acc[key] = { label, items: [], subtotal: 0 };
    }
    
    acc[key].items.push(debt);
    acc[key].subtotal += debt.amount; // amount is positive for debt, negative for payment
    return acc;
  }, {});

  const currentMonthKey = getMonthLabel(new Date().toISOString()).toLowerCase().replace(/\s/g, '-');

  const handleSendReport = (label: string, items: Debt[], subtotal: number) => {
    if (!customer) return;
    
    const reportLink = generateMonthlyReport({
      customerName: customer.name,
      phone: customer.whatsapp,
      monthName: label.charAt(0).toUpperCase() + label.slice(1),
      monthlyTotal: subtotal,
      historicalBalance: customer.balance,
      items: items.map(i => ({
        date: i.date,
        description: i.description,
        amount: i.amount
      }))
    });
    
    window.open(reportLink, '_blank');
    toast.success("Preparando reporte mensual... 🐷");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-10 w-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        <p className="text-slate-400 font-serif italic">Cargando libreta...</p>
      </div>
    );
  }

  const sortedKeys = Object.keys(groupedData).sort((a, b) => {
    const dateA = new Date(groupedData[a].items[0].date);
    const dateB = new Date(groupedData[b].items[0].date);
    return dateB.getTime() - dateA.getTime();
  });

  const displayKeys = viewMode === 'currentMonth' ? sortedKeys.filter(k => k === currentMonthKey) : sortedKeys;

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
              <History size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-sans text-xl font-bold text-slate-900">Estado de Cuenta</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">Detalle de movimientos</p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-full">
            <button
              onClick={() => setViewMode('currentMonth')}
              className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${viewMode === 'currentMonth' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Mes Actual
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${viewMode === 'all' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Ver Todo
            </button>
          </div>

          {/* Global Enviar Todo - Discreto */}
          {customer && (
            <button
              onClick={() => {
                const reportLink = generateMonthlyReport({
                  customerName: customer.name,
                  phone: customer.whatsapp,
                  monthName: "Todo el historial",
                  monthlyTotal: customer.balance,
                  historicalBalance: customer.balance,
                  items: debts.slice(0, 15).map(i => ({
                    date: i.date,
                    description: i.description,
                    amount: i.amount
                  }))
                });
                window.open(reportLink, '_blank');
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all border border-slate-100"
              title="Enviar historial completo"
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Grouped List */}
      <div className="space-y-10">
        {displayKeys.length === 0 ? (
          <div className="text-center py-16 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
            <p className="text-slate-300 font-serif italic text-lg">No hay movimientos en este periodo</p>
          </div>
        ) : (
          displayKeys.map((key) => {
            const group = groupedData[key];
            const filteredItems = group.items.filter(d => {
              if (filter === 'unpaid') return !d.is_paid;
              if (filter === 'paid') return d.is_paid;
              return true;
            });

            if (filteredItems.length === 0 && filter !== 'all') return null;

            return (
              <div key={key} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Month Header - Compact & Clean */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 px-1">
                  <div>
                    <h4 className="font-sans text-lg font-black capitalize text-slate-900">{group.label}</h4>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Balance:</span>
                      <span className={`text-sm font-bold tabular-nums ${group.subtotal > 0 ? 'text-slate-950' : 'text-emerald-600'}`}>
                        {formatPrice(group.subtotal)}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleSendReport(group.label, group.items, group.subtotal)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest border border-emerald-100 shadow-sm shadow-emerald-100/50"
                  >
                    <Send size={14} />
                    Reporte
                  </button>
                </div>

                {/* Items - Spaced Grid */}
                <div className="grid gap-4">
                  {filteredItems.map((debt: any) => {
                    const isCharge = debt.amount > 0;
                    const remainingAmount = debt.remaining_amount ?? (debt.is_paid ? 0 : debt.amount);
                    const isPartial = isCharge && !debt.is_paid && remainingAmount < debt.amount;
                    
                    return (
                      <div
                        key={debt.id}
                        className={`group overflow-hidden bg-white border rounded-[1.25rem] p-5 transition-all duration-300 hover:shadow-lg hover:border-slate-300 ${
                          debt.is_paid ? 'border-slate-50 opacity-40' : 'border-slate-200'
                        }`}
                      >
                        {/* Top Row: Desc & Amount */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-slate-900 font-bold text-sm leading-snug">
                              {debt.description}
                            </p>
                            {isCharge && (
                              <div className="flex items-center gap-2 mt-1.5">
                                {debt.is_paid ? (
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                                    <CheckCircle2 size={10} />
                                    Pagado
                                  </div>
                                ) : (
                                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isPartial ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Clock size={10} />
                                    {isPartial ? 'Pago Parcial' : 'Pendiente'}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right shrink-0">
                            <p className={`text-lg font-black tabular-nums tracking-tighter ${debt.amount < 0 ? 'text-emerald-600' : 'text-slate-950'}`}>
                              {debt.amount < 0 ? '+' : ''}{formatPrice(Math.abs(debt.amount)).replace('$', '').trim()}
                              <span className="text-xs ml-0.5 opacity-50">$</span>
                            </p>
                            {isCharge && !debt.is_paid && (
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                                Restan: <span className="text-slate-900">{formatPrice(remainingAmount)}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Bottom Row: Metadata */}
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                          <Calendar size={12} className="text-slate-300" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {formatDate(debt.date).split(',')[0]}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-slate-200 mx-1" />
                          <span className="text-[10px] font-medium text-slate-400">
                            {formatDate(debt.date).split(',')[1]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
