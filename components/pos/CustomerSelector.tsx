'use client';

import React, { useState } from 'react';
import { useCustomers } from '@/store/useCustomers';
import { Users, Search, X, UserCheck, Smartphone, History, Wallet } from 'lucide-react';
import CustomerHistory from '@/components/customers/CustomerHistory';
import { motion, AnimatePresence } from 'framer-motion';
import { getDebtorFullAudit } from '@/lib/actions/reporting';
import { generateFullAuditMessage } from '@/lib/whatsapp';

interface CustomerSelectorProps {
  onOpenAbono?: () => void;
}

export default function CustomerSelector({ onOpenAbono }: CustomerSelectorProps) {
  const { customers, selectedCustomerId, selectCustomer } = useCustomers();
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
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
      <div className="sticky top-20 z-40 w-full bg-white border-b border-slate-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]">
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-between px-6 py-5 md:py-6 gap-4 md:gap-0 transition-colors">
              {/* Left — Huge Name & Identity */}
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
                <div className={`flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-2xl md:rounded-[1.5rem] transition-all duration-500 shadow-inner shrink-0 ${selectedCustomer ? 'bg-amber-400 text-white rotate-3' : 'bg-slate-100 text-slate-300'}`}>
                  {selectedCustomer ? <UserCheck size={selectedCustomer ? 24 : 20} strokeWidth={2.5} /> : <Users size={24} strokeWidth={1.5} />}
                </div>
                <div className="flex flex-col leading-none">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500/60 mb-2 md:mb-3">
                    {selectedCustomer ? 'Cliente Actual' : 'Esperando Cliente'}
                  </p>
                  <h3 className={`font-serif text-2xl md:text-4xl tracking-tight transition-all duration-300 ${selectedCustomer ? 'text-slate-900 italic' : 'text-slate-400/50'}`}>
                    {selectedCustomer ? selectedCustomer.name : 'Nadie seleccionado'}
                  </h3>

                  {selectedCustomer && (
                    <div className="flex items-center justify-center md:justify-start gap-3 mt-3">
                      <button
                        onClick={() => setIsOpen(true)}
                        className="px-6 py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center gap-2"
                      >
                        <Users size={14} />
                        Cambiar
                      </button>

                      <button
                        onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                        className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${isInfoExpanded ? 'bg-amber-400 text-slate-900 shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                        {isInfoExpanded ? <X size={14} /> : <Search size={14} />}
                        {isInfoExpanded ? 'Cerrar' : 'Info'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right — Big Search Trigger when no customer */}
              {!selectedCustomer && (
                <button
                  onClick={() => setIsOpen(true)}
                  className="w-full md:w-auto h-14 px-8 rounded-2xl bg-amber-400 text-white font-bold flex items-center justify-center gap-3 shadow-lg shadow-amber-200 hover:bg-amber-500 transition-all active:scale-95 group"
                >
                  <Search size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm uppercase tracking-widest">Buscar</span>
                </button>
              )}
            </div>

          {/* Collapsible Info Panel */}
          <AnimatePresence>
            {selectedCustomer && isInfoExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-slate-50 bg-slate-50/50"
              >
                <div className="px-6 py-6 flex flex-col gap-4">
                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {onOpenAbono && (
                      <button
                        onClick={onOpenAbono}
                        className="col-span-2 flex items-center justify-center gap-3 rounded-2xl bg-slate-900 px-6 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-[0.98]"
                      >
                        <Wallet size={18} className="text-amber-400" />
                        Registrar Abono
                      </button>
                    )}
                    
                    <button
                      onClick={() => setIsHistoryOpen(true)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-all shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] active:scale-[0.98]"
                    >
                      <History size={20} strokeWidth={2} />
                      Historial
                    </button>

                    <button
                      onClick={async () => {
                        if (isGeneratingReport) return;
                        setIsGeneratingReport(true);
                        try {
                          const result = await getDebtorFullAudit(selectedCustomer.id);
                          if (result.success && result.data) {
                            const link = generateFullAuditMessage({
                              customerName: selectedCustomer.name,
                              phone: selectedCustomer.whatsapp,
                              ...result.data
                            });
                            window.open(link, '_blank');
                          }
                        } catch (error) {
                          console.error('Error generating report:', error);
                        } finally {
                          setIsGeneratingReport(false);
                        }
                      }}
                      disabled={isGeneratingReport}
                      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-white transition-all shadow-md active:scale-[0.98] ${isGeneratingReport ? 'bg-slate-400' : 'bg-green-500 hover:bg-green-600'}`}
                    >
                      <Smartphone size={20} strokeWidth={2} className={isGeneratingReport ? 'animate-bounce' : ''} />
                      {isGeneratingReport ? '...' : 'Enviar Detalle'}
                    </button>
                  </div>

                  {/* Financial Summary */}
                  <div className="flex flex-col border-t border-slate-100 pt-3 items-center text-center">
                    <div className="flex items-center gap-2 mb-1 justify-center">
                      <div className={`h-1.5 w-1.5 rounded-full ${selectedCustomer.balance < 0 ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Total Fiado</p>
                    </div>
                    <span className={`font-mono text-3xl font-bold tabular-nums tracking-tighter ${selectedCustomer.balance < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatBalance(selectedCustomer.balance)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

            {/* Clear selection */}
            <button
              id="btn-clear-customer"
              onClick={() => { selectCustomer(null); setIsOpen(false); setSearch(''); }}
              className="w-full flex items-center justify-center gap-4 px-6 py-6 rounded-2xl border border-dashed border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-400 hover:bg-rose-50 transition-all duration-200 shadow-sm"
            >
              <X size={20} strokeWidth={1.5} />
              <span className="font-sans text-base font-bold uppercase tracking-widest">Limpiar selección / Volver al Inicio</span>
            </button>

            {filteredCustomers.map((c) => (
              <button
                key={c.id}
                id={`btn-customer-${c.id}`}
                onClick={() => { selectCustomer(c.id); setIsOpen(false); setSearch(''); }}
                className={`w-full flex items-center justify-between px-6 py-8 rounded-3xl border transition-all duration-200 ${selectedCustomerId === c.id
                  ? 'border-amber-300 bg-amber-50 shadow-lg scale-[1.02]'
                  : 'border-slate-100 bg-white hover:border-amber-200 hover:bg-amber-50/50 hover:shadow-md'
                  }`}
              >
                <div className="flex items-center gap-6 text-left">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${selectedCustomerId === c.id ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Users size={24} strokeWidth={1.5} />
                  </div>
                  <div className="leading-tight">
                    <p className="font-serif text-2xl text-slate-900 font-bold">{c.name}</p>
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-400 mt-1">
                      <Smartphone size={14} strokeWidth={1.5} />
                      {c.whatsapp}
                    </p>
                  </div>
                </div>
                <div className="text-right leading-tight">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Fiado</p>
                  <span className={`font-mono text-xl font-bold tabular-nums ${c.balance < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
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
