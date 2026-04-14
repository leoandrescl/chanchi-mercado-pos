'use client';

import React from 'react';
import { useTransactions } from '@/store/useTransactions';
import Link from 'next/link';

export default function Historial() {
  const { transactions, clearHistory } = useTransactions();

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans">
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between bg-black px-8 py-4 text-white">
        <h1 className="tactical-font text-2xl tracking-widest uppercase">Historial Táctico</h1>
        <Link 
          href="/"
          className="border-2 border-white px-6 py-2 tactical-font text-xl active:bg-white active:text-black"
        >
          VOLVER
        </Link>
      </nav>

      <main className="w-full pt-24 pb-12">
        <div className="flex flex-col">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center bg-zinc-50">
              <span className="tactical-font text-2xl opacity-20 uppercase tracking-widest">Sin Movimientos</span>
            </div>
          ) : (
            <div className="flex flex-col divide-y-4 divide-black dark:divide-white">
              <div className="flex w-full bg-zinc-100 px-8 py-4 tactical-font text-xs uppercase tracking-[0.2em] opacity-50">
                <span className="w-24">Fecha</span>
                <span className="flex-1">Cliente / Detalle</span>
                <span className="w-32 text-right">Monto</span>
              </div>
              
              {transactions.map((tx) => (
                <div key={tx.id} className="flex w-full items-center px-8 py-6 active:bg-zinc-50 transition-colors">
                  <div className="w-24 flex flex-col">
                    <span className="font-mono text-[10px] font-bold">{formatDate(tx.date).split(',')[0]}</span>
                    <span className="font-mono text-xs font-black">{formatDate(tx.date).split(',')[1].trim()}</span>
                  </div>
                  
                  <div className="flex flex-1 flex-col truncate">
                    <span className="tactical-font text-xl">{tx.customerName?.toUpperCase() || 'SISTEMA'}</span>
                    <span className="text-[10px] font-black uppercase opacity-50 truncate mt-1">
                      {tx.type} • {tx.items || 'SIN DETALLE'}
                    </span>
                  </div>
                  
                  <div className={`w-32 text-right font-mono text-2xl font-black ${
                    tx.type === 'Venta' ? 'text-red-600' : 'text-green-700'
                  }`}>
                    {tx.type === 'Venta' ? '-' : '+'}{formatPrice(tx.amount).replace('CLP', '').trim()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-8 mt-12 mb-24">
          <button
            onClick={() => {
              if (confirm('¿BORRAR TODO EL HISTORIAL?')) clearHistory();
            }}
            className="w-full border-4 border-red-600 p-6 tactical-font text-xl text-red-600 active:bg-red-600 active:text-white"
          >
            VACIAR BASE DE DATOS ×
          </button>
        </div>
      </main>
    </div>
  );
}
