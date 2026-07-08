'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Debt } from '@/lib/actions/paymentLogic';
import { Calendar, CheckCircle2, Clock, History, Trash2, Pencil, Check, Loader2 } from 'lucide-react';
import { useCustomers } from '@/store/useCustomers';
import { toast } from 'sonner';
import AdaptiveDialog from '@/components/ui/AdaptiveDialog';
import Button from '@/components/ui/Button';

interface CustomerHistoryProps {
  debtorId: string;
}

interface GroupedDebts {
  [key: string]: {
    label: string;
    items: Debt[];
    subtotal: number;
  };
}

function debtDateToInputValue(iso: string | undefined): string {
  if (!iso) return new Date().toISOString().split('T')[0];
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CustomerHistory({ debtorId }: CustomerHistoryProps) {
  const { deleteDebtSupabase, updateDebtSupabase } = useCustomers();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'currentMonth'>('currentMonth');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('debtor_id', debtorId)
      .order('date', { ascending: false });

    if (!error && data) {
      setDebts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (debtorId) {
      fetchHistory();
    }
  }, [debtorId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (debt: Debt) => {
    const isAbono = debt.amount < 0;
    const remaining =
      debt.amount > 0 && !debt.is_paid
        ? debt.remaining_amount ?? debt.amount
        : 0;

    const impactMsg = isAbono
      ? `Se sumará ${Math.abs(debt.amount).toLocaleString('es-CL')} al Total Fiado (se anula el abono).`
      : remaining > 0
        ? `Se restará ${remaining.toLocaleString('es-CL')} del Total Fiado.`
        : 'Este registro ya estaba pagado; el total no debería cambiar.';

    if (!confirm(`¿Eliminar este registro?\n\n${impactMsg}`)) return;

    setIsDeleting(debt.id);
    try {
      await deleteDebtSupabase(debt.id, debt.debtor_id, debt.amount, debt.description);
      toast.success('Registro eliminado');
      await fetchHistory();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error('Error al eliminar: ' + message);
    } finally {
      setIsDeleting(null);
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  const getMonthLabel = (dateStr: string) => {
    return new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(new Date(dateStr));
  };

  const groupedData: GroupedDebts = debts.reduce((acc: GroupedDebts, debt: Debt) => {
    const label = getMonthLabel(debt.date);
    const key = label.toLowerCase().replace(/\s/g, '-');
    if (!acc[key]) {
      acc[key] = { label, items: [], subtotal: 0 };
    }
    acc[key].items.push(debt);
    acc[key].subtotal += debt.amount;
    return acc;
  }, {});

  const currentMonthKey = getMonthLabel(new Date().toISOString()).toLowerCase().replace(/\s/g, '-');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-10 w-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        <p className="text-slate-400 font-serif italic">Cargando libreta...</p>
      </div>
    );
  }

  const sortedKeys = Object.keys(groupedData).sort((a, b) => {
    const dateA = new Date(groupedData[a].items[0].date);
    const dateB = new Date(groupedData[b].items[0].date);
    return dateB.getTime() - dateA.getTime();
  });

  const displayKeys = viewMode === 'currentMonth' ? sortedKeys.filter(k => k === currentMonthKey) : sortedKeys;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white shrink-0">
            <History size={20} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-sans text-xl font-black text-slate-900">Estado de Cuenta</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-0.5">
              Consulta · editar o eliminar registros
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1.5 rounded-full">
            <button
              onClick={() => setViewMode('currentMonth')}
              className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${viewMode === 'currentMonth' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Mes Actual
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${viewMode === 'all' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Ver Todo
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {displayKeys.length === 0 ? (
          <div className="text-center py-16 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
            <p className="text-slate-300 font-serif italic text-lg">No hay movimientos en este periodo</p>
          </div>
        ) : (
          displayKeys.map((key) => {
            const group = groupedData[key];

            return (
              <div key={key} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 px-1">
                  <h4 className="font-sans text-lg font-black capitalize text-slate-900">{group.label}</h4>
                </div>

                <div className="grid gap-4">
                  {group.items.map((debt) => {
                    const isCharge = debt.amount > 0;
                    const remainingAmount = debt.remaining_amount ?? (debt.is_paid ? 0 : debt.amount);
                    const isPartial = isCharge && !debt.is_paid && remainingAmount < debt.amount;

                    return (
                      <div
                        key={debt.id}
                        className={`overflow-hidden bg-white border rounded-[1.25rem] p-5 transition-all duration-300 hover:shadow-lg hover:border-slate-300 ${
                          debt.is_paid ? 'border-slate-50 opacity-60' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-slate-900 font-bold text-sm leading-snug">
                              {debt.description}
                            </p>
                            {isCharge && (
                              <div className="flex items-center gap-2 mt-1.5">
                                {debt.is_paid ? (
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                                    <CheckCircle2 size={10} />
                                    Pagado
                                  </div>
                                ) : (
                                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isPartial ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Clock size={10} />
                                    {isPartial ? 'Pago Parcial' : 'Pendiente'}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <p className={`text-lg font-black tabular-nums tracking-tighter ${debt.amount < 0 ? 'text-emerald-600' : 'text-slate-950'}`}>
                              {debt.amount < 0 ? '+' : ''}{formatPrice(Math.abs(debt.amount)).replace('$', '').trim()}
                              <span className="text-xs ml-0.5 opacity-50">$</span>
                            </p>
                            {isCharge && !debt.is_paid && (
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                                Restan: <span className="text-slate-900">{formatPrice(remainingAmount)}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Calendar size={12} className="text-slate-300 shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">
                              {formatDate(debt.date).split(',')[0]}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-slate-200 shrink-0" />
                            <span className="text-[10px] font-medium text-slate-400 truncate">
                              {formatDate(debt.date).split(',')[1]}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => { setEditingDebt(debt); setIsEditModalOpen(true); }}
                              className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center active:scale-95 transition-all hover:bg-slate-200"
                              title="Editar"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(debt)}
                              disabled={isDeleting === debt.id}
                              className="h-10 w-10 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center active:scale-95 transition-all hover:bg-rose-200 disabled:opacity-50"
                              title="Eliminar registro"
                            >
                              {isDeleting === debt.id
                                ? <Loader2 size={14} className="animate-spin" />
                                : <Trash2 size={15} />
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {isEditModalOpen && editingDebt && (
        <EditDebtModal
          debt={editingDebt}
          onClose={() => { setIsEditModalOpen(false); setEditingDebt(null); }}
          onSuccess={() => { fetchHistory(); setIsEditModalOpen(false); setEditingDebt(null); }}
        />
      )}
    </div>
  );
}

function EditDebtModal({ debt, onClose, onSuccess }: { debt: Debt; onClose: () => void; onSuccess: () => void }) {
  const { updateDebtSupabase } = useCustomers();
  const [description, setDescription] = useState(debt.description);
  const [amount, setAmount] = useState(debt.amount.toString());
  const [dateInput, setDateInput] = useState(() => debtDateToInputValue(debt.date ?? debt.created_at));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAmount = parseInt(amount, 10);
    if (Number.isNaN(newAmount)) return;

    setIsSubmitting(true);
    try {
      await updateDebtSupabase(debt.id, debt.debtor_id, newAmount, debt.amount, description, dateInput);
      toast.success('Registro actualizado');
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error('Error al actualizar: ' + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdaptiveDialog isOpen={true} onClose={onClose} title="Editar Registro">
      <form onSubmit={handleSubmit} className="space-y-6 pb-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-4">Descripción</label>
          <input
            autoFocus
            required
            type="text"
            className="w-full h-14 px-6 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-50 focus:outline-none transition-all font-bold text-slate-950 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-4">Monto (CLP)</label>
          <div className="relative">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
            <input
              required
              type="number"
              className="w-full h-14 pl-12 pr-6 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-50 focus:outline-none transition-all font-bold text-slate-950 text-sm"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-debt-date" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-4">
            Fecha del movimiento
          </label>
          <input
            id="edit-debt-date"
            type="date"
            required
            className="w-full h-14 px-6 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-50 focus:outline-none transition-all font-bold text-slate-950 text-sm"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="ghost" onClick={onClose} fullWidth>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} fullWidth icon={isSubmitting ? <Loader2 className="animate-spin" /> : <Check />}>
            Guardar Cambios
          </Button>
        </div>
      </form>
    </AdaptiveDialog>
  );
}
