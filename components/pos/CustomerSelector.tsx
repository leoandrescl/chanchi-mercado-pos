'use client';

import React, { useState } from 'react';
import { useCustomers, Customer } from '@/store/useCustomers';
import { History, Wallet, Users, Search, X, ChevronDown, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import CustomerHistory from '@/components/customers/CustomerHistory';
import { motion, AnimatePresence } from 'framer-motion';
import { getDebtorFullAudit, getDebtorSummary } from '@/lib/actions/reporting';
import { generateFullAuditMessage, generateSummaryMessage } from '@/lib/whatsapp';
import CustomerCard from '@/components/customers/CustomerCard';
import HeaderPage from '@/components/ui/HeaderPage';
import InputSearch from '@/components/ui/InputSearch';
import Button from '@/components/ui/Button';
import CustomerAdminModal from '@/components/customers/CustomerAdminModal';

// WhatsApp SVG logo as a reusable component
function WhatsAppIcon({ className = 'h-4 w-4 fill-current' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

interface CustomerSelectorProps {
  onOpenAbono?: () => void;
}

export default function CustomerSelector({ onOpenAbono }: CustomerSelectorProps) {
  const { customers, selectedCustomerId, selectCustomer } = useCustomers();
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [loadingWhatsAppId, setLoadingWhatsAppId] = useState<string | null>(null);
  const [loadingSummaryId, setLoadingSummaryId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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

  const handleSummary = async (customer: Customer) => {
    if (!customer.whatsapp || loadingSummaryId) return;
    setLoadingSummaryId(customer.id);
    try {
      const result = await getDebtorSummary(customer.id);
      if (result.success && result.data) {
        const link = generateSummaryMessage({
          customerName: customer.name,
          phone: customer.whatsapp,
          pendingDebts: result.data.pendingDebts,
          payments: result.data.payments,
          totalBalance: result.data.totalBalance,
        });
        window.open(link, '_blank');
      }
    } catch (error) {
      console.error('Error WhatsApp Summary:', error);
    } finally {
      setLoadingSummaryId(null);
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
      <div className="sticky top-[60px] z-40 w-full bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.06)]">
        <div className="mx-auto w-full max-w-3xl">

          {/* Main row: name + action buttons */}
          <div className="flex items-center justify-between gap-3 px-5 py-3">
            {/* Left: identity */}
            <div className="flex flex-col min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-500 mb-0.5">
                {selectedCustomer ? 'Cliente Actual' : 'Esperando Cliente'}
              </p>
              <h3 className={`font-serif text-[1.6rem] leading-none tracking-tight truncate transition-all duration-300 ${selectedCustomer ? 'text-slate-900 italic' : 'text-slate-300'
                }`}>
                {selectedCustomer ? selectedCustomer.name : 'Sin seleccionar'}
              </h3>
            </div>

            {/* Right: primary controls */}
            {selectedCustomer ? (
              <div className="flex items-center gap-2 shrink-0">
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setIsOpen(true)}
                  className="flex flex-col items-center justify-center gap-1 h-[3.5rem] w-[3.5rem] rounded-2xl bg-slate-900 text-white shadow-md transition-all"
                  title="Cambiar cliente"
                >
                  <Users size={18} />
                  <span className="text-[7px] font-black uppercase tracking-widest leading-none">Cambiar</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                  className={`flex flex-col items-center justify-center gap-1 h-[3.5rem] w-[3.5rem] rounded-2xl transition-all ${isInfoExpanded
                      ? 'bg-amber-400 text-slate-900 shadow-lg'
                      : 'bg-slate-100 text-slate-500'
                    }`}
                  title="Ver acciones"
                >
                  <ChevronDown size={18} className={`transition-transform duration-300 ${isInfoExpanded ? 'rotate-180' : ''}`} />
                  <span className="text-[7px] font-black uppercase tracking-widest leading-none">Acciones</span>
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="h-14 px-8 rounded-2xl bg-amber-400 text-white font-bold flex items-center justify-center gap-3 shadow-lg shadow-amber-200 hover:bg-amber-500 transition-all shrink-0"
              >
                <Search size={20} />
                <span className="text-sm uppercase tracking-widest">Buscar</span>
              </motion.button>
            )}
          </div>

          {/* ─── EXPANDED ACTIONS PANEL — PREMIUM BOUTIQUE ─── */}
          <AnimatePresence>
            {selectedCustomer && isInfoExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                {/* Glassmorphism card */}
                <div className="mx-3 mb-3 rounded-3xl bg-white/80 backdrop-blur-md border border-slate-100 shadow-xl shadow-slate-900/8 overflow-hidden">
                  <div className="p-4 space-y-4">

                    {/* ── GRUPO 1: Sistema ─────────────────────── */}
                    <div className="space-y-2">

                      <div className="grid grid-cols-2 gap-2.5">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            if (selectedCustomer) handleEdit(selectedCustomer);
                            setIsInfoExpanded(false);
                          }}
                          className="flex items-center justify-center gap-2.5 h-14 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/25 transition-all"
                          title="Editar Datos"
                        >
                          <Pencil size={17} strokeWidth={2} />
                          <span className="text-[11px] font-black uppercase tracking-widest">Editar Datos</span>
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setIsInfoExpanded(false)}
                          className="flex items-center justify-center gap-2.5 h-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-500 transition-all active:bg-slate-50"
                        >
                          <X size={17} strokeWidth={2} />
                          <span className="text-[11px] font-black uppercase tracking-widest">Cerrar</span>
                        </motion.button>
                      </div>
                    </div>

                    {/* ── GRUPO 2: Cuenta ──────────────────────── */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2.5">
                        {onOpenAbono && (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { onOpenAbono(); setIsInfoExpanded(false); }}
                            className="flex flex-col items-center justify-center gap-1.5 h-16 rounded-2xl shadow-md shadow-amber-200/60 transition-all active:brightness-95"
                            style={{ background: 'linear-gradient(145deg, #fbbf24 0%, #f59e0b 100%)' }}
                          >
                            <Wallet size={20} strokeWidth={1.75} className="text-slate-900" />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none text-slate-900">Reg. Abono</span>
                          </motion.button>
                        )}
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => { setIsHistoryOpen(true); setIsInfoExpanded(false); }}
                          className={`flex flex-col items-center justify-center gap-1.5 h-16 rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-sm transition-all active:bg-slate-50 ${!onOpenAbono ? 'col-span-2' : ''}`}
                        >
                          <History size={20} strokeWidth={1.75} />
                          <span className="text-[10px] font-black uppercase tracking-widest leading-none">Historial</span>
                        </motion.button>
                      </div>
                    </div>

                    {/* ── GRUPO 3: WhatsApp ─────────────────────── */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2.5">

                        {/* Detalle Completo — sólido, protagonista */}
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleWhatsApp(selectedCustomer)}
                          disabled={!!loadingWhatsAppId}
                          title="Historial completo, incluye ítems ya pagados"
                          className={`flex flex-col items-center justify-center gap-1.5 h-16 rounded-2xl text-white shadow-md transition-all disabled:opacity-60 ${loadingWhatsAppId === selectedCustomer.id ? 'bg-slate-400' : ''
                            }`}
                          style={loadingWhatsAppId !== selectedCustomer.id
                            ? { background: 'linear-gradient(145deg, #10b981 0%, #059669 100%)' }
                            : {}
                          }
                        >
                          {loadingWhatsAppId === selectedCustomer.id ? (
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5">
                                <WhatsAppIcon className="h-[14px] w-[14px] fill-white" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Completo</span>
                              </div>
                              <span className="text-[8px] font-medium text-white/70 tracking-wide">Con pagados y abonos</span>
                            </>
                          )}
                        </motion.button>

                        {/* Detalle Resumido — outline elegante */}
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleSummary(selectedCustomer)}
                          disabled={!!loadingSummaryId}
                          title="Solo deudas pendientes, sin ítems ya pagados"
                          className={`flex flex-col items-center justify-center gap-1.5 h-16 rounded-2xl border-2 transition-all disabled:opacity-60 ${loadingSummaryId === selectedCustomer.id
                              ? 'border-slate-200 text-slate-400 bg-white'
                              : 'border-emerald-400 text-emerald-700 bg-emerald-50/80 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'
                            }`}
                        >
                          {loadingSummaryId === selectedCustomer.id ? (
                            <div className="h-4 w-4 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5">
                                <WhatsAppIcon className="h-[14px] w-[14px] fill-current" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Resumido</span>
                              </div>
                              <span className="text-[8px] font-medium opacity-60 tracking-wide">Solo pendientes</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>

                    {/* ── Balance pill ─────────────────────────────── */}
                    <div className={`flex items-center justify-between rounded-2xl px-5 py-3.5 ${selectedCustomer.balance <= 0
                        ? 'bg-emerald-50 border border-emerald-100'
                        : 'bg-rose-50 border border-rose-100'
                      }`}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full animate-pulse ${selectedCustomer.balance <= 0 ? 'bg-emerald-400' : 'bg-rose-400'
                          }`} />
                        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">Total Fiado</p>
                      </div>
                      <span className={`font-mono text-xl font-bold tabular-nums tracking-tighter ${selectedCustomer.balance <= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                        {formatBalance(selectedCustomer.balance)}
                      </span>
                    </div>

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
          <div className="px-6 py-2">
            <HeaderPage
              title="Gestión de Deudores"
              backHref="/acceso-total-chanchi"
              onBack={() => { setIsOpen(false); setSearch(''); }}
              className="flex items-center gap-4 py-4"
            />
          </div>

          <div className="bg-white border-b border-slate-100 shadow-sm z-10">
            <div className="px-6 pb-6">
              <InputSearch
                autoFocus
                placeholder="¿A quién busca?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
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

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {filteredCustomers.map((c, index) => (
              <CustomerCard
                key={c.id}
                customer={c}
                index={index}
                isSelected={selectedCustomerId === c.id}
                onCardClick={(cust) => {
                  selectCustomer(cust.id);
                  toast.success(`👤 Cliente ${cust.name} seleccionado`);
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
          <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-500">Ficha de Cliente</p>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setIsHistoryOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </motion.button>
            </div>
            <h2 className="font-serif text-3xl italic tracking-tight text-slate-900 leading-tight mb-1">
              {selectedCustomer.name}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Saldo Pendiente</span>
              <span className={`font-mono text-lg font-bold tabular-nums ${selectedCustomer.balance <= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                {formatBalance(selectedCustomer.balance)}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 max-w-3xl mx-auto w-full">
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
