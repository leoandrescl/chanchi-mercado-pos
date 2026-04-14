'use client';

import React from 'react';
import { useCustomers } from '@/store/useCustomers';
import { TrendingUp, Clock, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

export default function GlobalDashboard() {
  const { globalTotal, lastMovements, isFetchingMetrics } = useCustomers();

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* ─── MASTER METRIC CARD ─── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-10 text-white shadow-2xl">
        {/* Decorative Background Elements */}
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-amber-500/5 blur-[80px]" />

        <div className="relative flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
            <TrendingUp size={24} className="text-emerald-400" />
          </div>
          
          <h2 className="font-serif text-2xl italic tracking-tight text-slate-300">
            Capital Total en Libretas
          </h2>

          <div className="mt-4 flex items-baseline gap-2">
            {isFetchingMetrics ? (
              <div className="h-16 w-48 rounded-2xl bg-white/5 animate-pulse" />
            ) : (
              <>
                <span className="text-6xl font-medium tracking-tighter text-white tabular-nums">
                  {formatPrice(globalTotal).replace('$', '').trim()}
                </span>
                <span className="text-2xl font-light text-emerald-400 font-serif italic">$</span>
              </>
            )}
          </div>

          <div className="mt-8 flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 border border-emerald-500/20">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
              Saldo Activo en la Nube
            </span>
          </div>
        </div>
      </div>

      {/* ─── LAST MOVEMENTS SECTION ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock size={16} strokeWidth={1.5} />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Últimos Movimientos</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 rounded-3xl bg-white/50 backdrop-blur-md border border-slate-100 overflow-hidden shadow-sm">
          {lastMovements.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-serif italic text-slate-400">No hay actividad reciente</p>
            </div>
          ) : (
            lastMovements.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-5 hover:bg-white/80 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    item.amount < 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {item.amount < 0 ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div className="leading-tight">
                    <p className="font-medium text-slate-900 text-sm">
                      {item.debtors?.name || 'Desconocido'}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter mt-1">
                      {item.description} • {formatDate(item.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-bold ${item.amount < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {formatPrice(Math.abs(item.amount))}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── DASHBOARD FOOTER ─── */}
      <div className="flex flex-col items-center pt-8 opacity-20">
         <Wallet size={20} strokeWidth={1} className="text-slate-900 mb-2" />
         <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-slate-900 italic font-serif">
           ChanchiMercado Intelligence
         </p>
      </div>
    </div>
  );
}
