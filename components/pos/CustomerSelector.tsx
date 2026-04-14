'use client';

import React, { useState } from 'react';
import { useCustomers } from '@/store/useCustomers';
import { Users, Search, X, UserCheck, Smartphone, History } from 'lucide-react';
import CustomerHistory from '@/components/customers/CustomerHistory';

export default function CustomerSelector() {
  const { customers, selectedCustomerId, selectCustomer } = useCustomers();
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatBalance = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  return (
    <>
      {/* ─── CUSTOMER STATUS RIBBON ─── */}
      <div className="sticky top-20 z-40 w-full bg-amber-50 border-b border-amber-100 shadow-sm">
        <button
          id="btn-customer-selector"
          onClick={() => setIsOpen(true)}
          className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5 transition-colors hover:bg-amber-100/40 active:bg-amber-100/60"
        >
          {/* Left — customer identity */}
          <div className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${selectedCustomer ? 'bg-amber-400 text-white' : 'bg-amber-200 text-amber-500'}`}>
              {selectedCustomer ? <UserCheck size={18} strokeWidth={2} /> : <Users size={18} strokeWidth={1.5} />}
            </div>
            <div className="text-left leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-500 mb-0.5">
                {selectedCustomer ? 'Sesión activa' : 'Sin cliente'}
              </p>
              <h3 className={`font-serif text-xl tracking-tight ${selectedCustomer ? 'text-slate-900' : 'text-slate-300'}`}>
                {selectedCustomer ? selectedCustomer.name : 'Seleccionar cliente'}
              </h3>
            </div>
          </div>

          {/* Right — balance + History Action */}
          {selectedCustomer ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-2">
                <button
                  id="btn-view-history"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsHistoryOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-amber-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-500 hover:bg-amber-100 transition-colors"
                >
                  <History size={14} strokeWidth={2} />
                  Historial
                </button>
                <button
                  id="btn-quick-whatsapp"
                  onClick={(e) => {
                    e.stopPropagation();
                    const link = `https://wa.me/${selectedCustomer.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${selectedCustomer.name}! 👋\n\nTu saldo actual en ChanchiMercado es de *${formatBalance(selectedCustomer.balance)}*.\n\nGracias! 🐷`)}`;
                    window.open(link, '_blank');
                  }}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-emerald-600 transition-colors shadow-sm"
                >
                  <Smartphone size={14} strokeWidth={2} />
                  Enviar Saldo
                </button>
              </div>
              <div className="text-right leading-tight">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-500 mb-0.5">Saldo fiado</p>
                <span className={`font-mono text-xl font-semibold tabular-nums ${selectedCustomer.balance < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {formatBalance(selectedCustomer.balance)}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
              <Search size={14} strokeWidth={1.5} />
              Buscar
            </span>
          )}
        </button>
      </div>

      {/* ─── FULL-SCREEN SEARCH MODAL ─── */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col animate-in fade-in duration-200">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100">
            <h2 className="font-serif text-2xl text-slate-900">Directorio</h2>
            <button
              id="btn-close-customer-modal"
              onClick={() => { setIsOpen(false); setSearch(''); }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Input */}
          <div className="px-6 py-4 border-b border-slate-50">
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3.5">
              <Search size={18} strokeWidth={1.5} className="text-slate-400 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar por nombre..."
                className="flex-1 bg-transparent font-sans text-lg text-slate-800 placeholder:text-slate-300 focus:outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

            {/* Clear selection */}
            <button
              id="btn-clear-customer"
              onClick={() => { selectCustomer(null); setIsOpen(false); setSearch(''); }}
              className="w-full flex items-center gap-3 px-5 py-4 rounded-xl border border-dashed border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-400 hover:bg-rose-50 transition-all duration-200"
            >
              <X size={16} strokeWidth={1.5} />
              <span className="font-sans text-sm font-medium">Limpiar selección</span>
            </button>

            {filteredCustomers.map((c) => (
              <button
                key={c.id}
                id={`btn-customer-${c.id}`}
                onClick={() => { selectCustomer(c.id); setIsOpen(false); setSearch(''); }}
                className={`w-full flex items-center justify-between px-5 py-5 rounded-xl border transition-all duration-200 ${
                  selectedCustomerId === c.id
                    ? 'border-amber-300 bg-amber-50 shadow-sm'
                    : 'border-slate-100 bg-white hover:border-amber-200 hover:bg-amber-50/50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${selectedCustomerId === c.id ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Users size={20} strokeWidth={1.5} />
                  </div>
                  <div className="leading-tight">
                    <p className="font-serif text-xl text-slate-900">{c.name}</p>
                    <p className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mt-0.5">
                      <Smartphone size={11} strokeWidth={1.5} />
                      {c.whatsapp}
                    </p>
                  </div>
                </div>
                <div className="text-right leading-tight">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Saldo</p>
                  <span className={`font-mono text-lg font-semibold tabular-nums ${c.balance < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {formatBalance(c.balance)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* ─── CUSTOMER HISTORY MODAL ─── */}
      {isHistoryOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in fade-in duration-200">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100">
            <div>
              <h2 className="font-serif text-2xl text-slate-900">{selectedCustomer.name}</h2>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Ficha de Cliente</p>
            </div>
            <button
              id="btn-close-history-modal"
              onClick={() => setIsHistoryOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full">
            <CustomerHistory debtorId={selectedCustomer.id} />
          </div>
        </div>
      )}
    </>
  );
}
