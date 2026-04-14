'use client';

import React from 'react';
import { useCustomers } from '@/store/useCustomers';
import { TrendingUp, Clock, ArrowUpRight, ArrowDownRight, Wallet, UserPlus, Eye, EyeOff, Package } from 'lucide-react';
import Link from 'next/link';

interface GlobalDashboardProps {
  onAddCustomer: () => void;
}

export default function GlobalDashboard({ onAddCustomer }: GlobalDashboardProps) {
  const { globalTotal, lastMovements, isFetchingMetrics, showGlobalBalance, toggleGlobalBalance } = useCustomers();

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('es-CL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* ─── MASTER METRIC CARD ─── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 px-8 py-8 text-white shadow-xl">
        {/* Decorative Background Elements */}
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-emerald-500/5 blur-[80px]" />

        <div className="relative flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-serif text-lg italic tracking-tight text-slate-400">
              Resumen de Libretas
            </h2>
            <button 
              onClick={toggleGlobalBalance}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-500 transition-colors"
              title={showGlobalBalance ? "Ocultar Saldo" : "Mostrar Saldo"}
            >
              {showGlobalBalance ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>

          <div className="flex items-baseline gap-2">
            {isFetchingMetrics ? (
              <div className="h-10 w-32 rounded-xl bg-white/5 animate-pulse" />
            ) : (
              <>
                <span className="text-4xl font-medium tracking-tighter text-white tabular-nums">
                  {showGlobalBalance 
                    ? formatPrice(globalTotal).replace('$', '').trim() 
                    : '••••••'
                  }
                </span>
                <span className="text-xl font-light text-slate-500 font-serif italic">$</span>
              </>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              id="btn-add-customer-main"
              onClick={onAddCustomer}
              className="flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md px-4 py-1.5 border border-white/10 transition-all active:scale-[0.98]"
            >
              <UserPlus size={14} className="text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                Nuevo Cliente
              </span>
            </button>

            <Link
              href="/inventario"
              className="flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md px-4 py-1.5 border border-white/10 transition-all active:scale-[0.98]"
            >
              <Package size={14} className="text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                Inventario
              </span>
            </Link>
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
