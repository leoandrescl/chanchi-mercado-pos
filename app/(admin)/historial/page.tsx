'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, History, Receipt, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type DebtMovement = {
  id: string;
  amount: number;
  description: string;
  date: string;
  created_at?: string;
  debtors?: { name: string } | null;
};

const LEDGER_LIMIT = 500;

export default function Historial() {
  const [rows, setRows] = useState<DebtMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLedger = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: qError } = await supabase
      .from('debts')
      .select('id, amount, description, date, created_at, debtors(name)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(LEDGER_LIMIT);

    if (qError) {
      setError(qError.message);
      setRows([]);
    } else {
      setRows((data as unknown as DebtMovement[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadLedger();
  }, [loadLedger]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
    const time = date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return { day, time };
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFCF9] text-slate-900 font-sans antialiased">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-6 shadow-sm">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/acceso-total-chanchi"
              className="group flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all duration-300"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <div>
              <h1 className="font-serif text-2xl italic tracking-tight text-slate-900 leading-none">
                Historial de Movimientos
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mt-1.5">
                Libreta global (base de datos)
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
            <History size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500">
              {loading ? '…' : `${rows.length} movimientos`}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-10 pb-24">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 px-8 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-slate-300" />
              <p className="font-serif text-slate-400 italic">Cargando libreta…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center gap-3">
              <p className="text-rose-600 text-sm font-medium">{error}</p>
              <button
                type="button"
                onClick={() => void loadLedger()}
                className="text-xs font-bold uppercase tracking-widest text-slate-500 underline"
              >
                Reintentar
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 px-8 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-4">
                <Receipt size={32} strokeWidth={1.5} />
              </div>
              <p className="font-serif text-lg text-slate-400 italic">No hay movimientos registrados</p>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex w-full bg-slate-50/50 px-8 py-4 border-b border-slate-100">
                <span className="w-32 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Fecha y Hora
                </span>
                <span className="flex-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Cliente / Detalle
                </span>
                <span className="w-32 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Monto
                </span>
              </div>

              <div className="divide-y divide-slate-50">
                {rows.map((tx) => {
                  const isCharge = tx.amount > 0;
                  const at = tx.date || tx.created_at || '';
                  const { day, time } = formatDate(at);
                  const label = isCharge ? 'Venta' : 'Abono';
                  return (
                    <div
                      key={tx.id}
                      className="group flex w-full items-center px-8 py-7 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="w-32 flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">{day}</span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase">{time}</span>
                      </div>

                      <div className="flex flex-1 flex-col truncate pl-2">
                        <span className="text-base font-medium text-slate-900">
                          {tx.debtors?.name || 'Cliente'}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                          <span
                            className={`h-1 w-1 rounded-full shrink-0 ${isCharge ? 'bg-rose-400' : 'bg-emerald-400'}`}
                          />
                          <span className="text-[11px] font-medium text-slate-400 lowercase first-letter:uppercase truncate">
                            {label} • {tx.description || 'sin detalle'}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-32 text-right tabular-nums font-medium text-xl ${
                          isCharge ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        <span className="text-sm mr-1 opacity-50">{isCharge ? '−' : '+'}</span>
                        {formatPrice(Math.abs(tx.amount)).replace('$', '').trim()}
                        <span className="text-xs ml-0.5 opacity-40">$</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="h-px w-8 bg-slate-200" />
          <p className="font-serif italic text-xs text-slate-400">Fin del registro maestro</p>
          <div className="h-px w-8 bg-slate-200" />
        </div>
      </main>
    </div>
  );
}
