'use client';

import React, { useState } from 'react';
import { useCustomers } from '@/store/useCustomers';
import { TrendingUp, Clock, ArrowUpRight, ArrowDownRight, Wallet, UserPlus, Eye, EyeOff, Package, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { generateBackup } from '@/app/actions/backup';
import { toast } from 'sonner';
import PWAInstallButton from '@/components/pwa/PWAInstallButton';

interface GlobalDashboardProps {
  onAddCustomer: () => void;
}

export default function GlobalDashboard({ onAddCustomer }: GlobalDashboardProps) {
  const { globalTotal, lastMovements, isFetchingMetrics, showGlobalBalance, toggleGlobalBalance } = useCustomers();
  const [isExporting, setIsExporting] = useState(false);

  const handleBackup = async () => {
    setIsExporting(true);
    try {
      const result = await generateBackup();
      if (!result.success) {
        toast.error('Error al generar el respaldo: ' + result.error);
        return;
      }

      const { data } = result;
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const date = new Date().toISOString().slice(0, 10);
      const filename = `chanchi-respaldo-${date}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(
        `✅ Respaldo generado: ${data.metadata.totalCustomers} clientes, ${data.metadata.totalDebts} movimientos, ${data.metadata.totalProducts} productos`
      );
    } catch (err: any) {
      toast.error('Error inesperado: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  const formatMovementTime = (item: { date?: string; created_at?: string }) => {
    const raw = item.date || item.created_at;
    if (!raw) return '—';
    return new Date(raw).toLocaleString('es-CL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* Onboarding Greeting */}
      <div className="px-2 pt-0.5">
        <h1 className="font-serif text-2xl text-slate-900 italic leading-tight">
          ¡Hola Viejita! 🎃👋
        </h1>
        <p className="text-slate-400 font-sans text-[11px] mt-1 leading-relaxed">
          Para empezar a fiar, haga clic en el botón <strong className="text-amber-500 font-bold underline decoration-amber-200 underline-offset-4 uppercase">buscar</strong> que está arriba para seleccionar un cliente.
        </p>
      </div>

      {/* ─── MASTER METRIC CARD (Collapsible) ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-5 text-white shadow-2xl border border-white/5 group">
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
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
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
            lastMovements.map((item: any) => {
              const isAbono = item.amount < 0;
              const moveLabel = isAbono ? 'Abono registrado' : 'Compra';
              const moveAmount = formatPrice(Math.abs(item.amount));
              const totalFiado = formatPrice(item.balance_after ?? item.debtors?.balance ?? 0);

              return (
              <div key={item.id} className="flex items-center justify-between p-5 hover:bg-white/80 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isAbono ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                    {isAbono ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div className="leading-tight min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">
                      {item.debtors?.name || 'Desconocido'}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter mt-1">
                      {moveLabel} {moveAmount}
                      <span className="text-slate-300"> — </span>
                      <span className="text-slate-600">Total Fiado {totalFiado}</span>
                      <span className="text-slate-300"> • </span>
                      {formatMovementTime(item)}
                    </p>
                    {item.description && !isAbono && (
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate normal-case tracking-normal font-medium">
                        {String(item.description).replace(/^Compra:\s*/i, '')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 pl-3">
                  <p className={`font-mono font-bold ${isAbono ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {moveAmount}
                  </p>
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── BACKUP SECTION ─── */}
      <div className="mt-2 px-1">
        <button
          onClick={handleBackup}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-4 text-slate-400 transition-all hover:border-slate-400 hover:bg-white hover:text-slate-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
            {isExporting ? 'Generando respaldo...' : 'Descargar Respaldo Completo'}
          </span>
        </button>
      </div>

      {/* ─── PWA INSTALL ─── */}
      <div className="px-1">
        <PWAInstallButton />
      </div>

      {/* ─── DASHBOARD FOOTER ─── */}
      <div className="flex flex-col items-center pt-8 opacity-20">
        <Wallet size={20} strokeWidth={1} className="text-slate-900 mb-2" />
        <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-slate-900 italic font-serif">
          ChanchiMercado | Hecho con infinito Amor por su hijo 🦇
        </p>
      </div>
    </div>
  );
}
