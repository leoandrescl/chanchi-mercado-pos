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
    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* Onboarding Greeting */}
      <div className="px-2 pt-1">
        <h1 className="font-serif text-2xl text-slate-900 italic leading-tight">
          ¡Hola Viejita! 👋
        </h1>
        <p className="text-slate-400 font-sans text-xs mt-2 leading-relaxed">
          Para empezar a fiar, haga clic en el botón <strong className="text-amber-500 font-bold underline decoration-amber-200 underline-offset-4 uppercase">buscar</strong> que está arriba para seleccionar un cliente.
        </p>
      </div>

      {/* ─── MASTER METRIC CARD (Collapsible) ─── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 px-8 py-6 text-white shadow-2xl border border-white/5 group">
        {/* Decorative Background Elements */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-[100px] group-hover:bg-amber-500/20 transition-all duration-700" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/5 blur-[100px]" />

        <div className="relative flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-serif text-xl italic tracking-tight text-slate-500">
              Estado Global
            </h2>
            <button
              onClick={toggleGlobalBalance}
              className={`p-2 rounded-full transition-all duration-300 ${showGlobalBalance ? 'bg-amber-400 text-slate-900' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
              title={showGlobalBalance ? "Ocultar Total Fiado" : "Mostrar Total Fiado"}
            >
              {showGlobalBalance ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          <div className="flex flex-col items-center">
            {isFetchingMetrics ? (
              <div className="h-12 w-48 rounded-2xl bg-white/5 animate-pulse" />
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-medium tracking-tighter tabular-nums transition-all duration-500 ${showGlobalBalance ? 'text-white' : 'text-slate-800'}`}>
                    {showGlobalBalance
                      ? formatPrice(globalTotal).replace('$', '').trim()
                      : '••••••'
                    }
                  </span>
                  <span className="text-2xl font-light text-slate-600 font-serif italic">$</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500 mt-4">
                  {showGlobalBalance ? 'Total Fiado Acumulado' : 'Total Oculto'}
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions - Only visible if expanded or hover? Let's keep them clean */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              id="btn-add-customer-main"
              onClick={onAddCustomer}
              className="flex items-center gap-3 rounded-2xl bg-white text-slate-900 px-6 py-3 shadow-lg hover:bg-slate-50 transition-all active:scale-95"
            >
              <UserPlus size={16} className="text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                Nuevo Cliente
              </span>
            </button>

            <Link
              href="/historial"
              className="flex items-center gap-3 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-md px-6 py-3 border border-white/10 transition-all active:scale-95"
            >
              <Clock size={16} className="text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 leading-none">
                Libreta Global
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
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.amount < 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
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
          ChanchiMercado | Hecho con infinito Amor por su hijo
        </p>
      </div>
    </div>
  );
}
