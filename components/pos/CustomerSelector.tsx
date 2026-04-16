'use client';

import React, { useState } from 'react';
import { useCustomers, Customer } from '@/store/useCustomers';
import { Users, Search, X, UserCheck, Smartphone, History, Wallet, ArrowLeft } from 'lucide-react';
import CustomerHistory from '@/components/customers/CustomerHistory';
import { motion, AnimatePresence } from 'framer-motion';
import { getDebtorFullAudit } from '@/lib/actions/reporting';
import { generateFullAuditMessage } from '@/lib/whatsapp';
import CustomerCard from '@/components/customers/CustomerCard';
import HeaderPage from '@/components/ui/HeaderPage';
import InputSearch from '@/components/ui/InputSearch';
import Button from '@/components/ui/Button';
import CustomerAdminModal from '@/components/customers/CustomerAdminModal';

interface CustomerSelectorProps {
  onOpenAbono?: () => void;
}

export default function CustomerSelector({ onOpenAbono }: CustomerSelectorProps) {
  const { customers, selectedCustomerId, selectCustomer } = useCustomers();
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [loadingWhatsAppId, setLoadingWhatsAppId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete'>('edit');

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatBalance = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  const handleWhatsApp = async (customer: Customer) => {
    if (!customer.whatsapp || loadingWhatsAppId) return;

    setLoadingWhatsAppId(customer.id);
    try {
      const result = await getDebtorFullAudit(customer.id);
      if (result.success && result.data) {
        const link = generateFullAuditMessage({
          customerName: customer.name,
          phone: customer.whatsapp,
          totalPurchases: result.data.totalPurchases,
          totalAbonos: result.data.totalAbonos,
          finalBalance: result.data.finalBalance,
          monthsData: result.data.monthsData
        });
        window.open(link, '_blank');
      }
    } catch (error) {
      console.error('Error WhatsApp Detail:', error);
    } finally {
      setLoadingWhatsAppId(null);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setModalMode('edit');
    setIsEditModalOpen(true);
  };

  return (
    <>
      {/* ─── CUSTOMER STATUS RIBBON ─── */}
      <div className="sticky top-[60px] z-40 w-full bg-white border-b border-slate-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-between px-6 py-6 md:py-8 gap-4 md:gap-0 transition-colors">
            {/* Left — Huge Name & Identity */}
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">

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
                      Cambiar cliente
                    </button>

                    <button
                      onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                      className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${isInfoExpanded ? 'bg-amber-400 text-slate-900 shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {isInfoExpanded ? <X size={14} /> : <Search size={14} />}
                      {isInfoExpanded ? 'Cerrar' : 'Acciones'}
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
                      onClick={() => handleWhatsApp(selectedCustomer)}
                      disabled={!!loadingWhatsAppId}
                      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-white transition-all shadow-md active:scale-[0.98] ${loadingWhatsAppId === selectedCustomer.id ? 'bg-slate-400' : 'bg-green-500 hover:bg-green-600'}`}
                    >
                      <Smartphone size={20} strokeWidth={2} className={loadingWhatsAppId === selectedCustomer.id ? 'animate-bounce' : ''} />
                      {loadingWhatsAppId === selectedCustomer.id ? '...' : 'Enviar Detalle'}
                    </button>
                  </div>

                  {/* Financial Summary */}
                  <div className="flex flex-col border-t border-slate-100 pt-3 items-center text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-1">Total Fiado</p>
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

          {/* Modal Header — Compact Standardized */}
          <div className="px-6 py-2">
            <HeaderPage 
              title="Gestión de Deudores"
              onBack={() => { setIsOpen(false); setSearch(''); }}
              className="flex items-center gap-4 py-4"
            />
          </div>

          {/* Search Input & Persistent Actions */}
          <div className="bg-white border-b border-slate-100 shadow-sm z-10">
            <div className="px-6 pb-6">
              <InputSearch
                autoFocus
                placeholder="¿A quién busca?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Clear selection (Persistent) */}
            <div className="px-6 pb-6 mt-[-8px]">
              <Button
                variant="outline"
                className="w-full h-14 rounded-2xl border-dashed border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50"
                onClick={() => { selectCustomer(null); setIsOpen(false); setSearch(''); }}
                icon={<X size={18} />}
              >
                Limpiar selección / Ir a Inicio
              </Button>
            </div>
          </div>

          {/* Results List (Scrollable) */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

            {filteredCustomers.map((c, index) => (
              <CustomerCard
                key={c.id}
                customer={c}
                index={index}
                isSelected={selectedCustomerId === c.id}
                onCardClick={(cust) => {
                  selectCustomer(cust.id);
                  setIsOpen(false);
                  setSearch('');
                }}
                onWhatsAppClick={handleWhatsApp}
                onEditClick={handleEdit}
                loadingWhatsApp={loadingWhatsAppId === c.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── CUSTOMER HISTORY MODAL ─── */}
      {isHistoryOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-serif text-xl text-slate-900">{selectedCustomer.name}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ficha de Cliente</p>
            </div>
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl mx-auto w-full">
            <CustomerHistory debtorId={selectedCustomer.id} />
          </div>
        </div>
      )}

      {/* ─── CUSTOMER ADMIN MODAL (EDIT) ─── */}
      <CustomerAdminModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        customer={editingCustomer}
        mode={modalMode}
      />
    </>
  );
}
