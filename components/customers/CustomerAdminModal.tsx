'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Trash2, AlertTriangle, Save, Loader2 } from 'lucide-react';
import { useCustomers, Customer } from '@/store/useCustomers';
import { toast } from 'sonner';

interface CustomerAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null; // null for creation
  mode: 'edit' | 'delete' | 'create';
}

export default function CustomerAdminModal({ isOpen, onClose, customer, mode }: CustomerAdminModalProps) {
  const { addCustomerSupabase, updateCustomerSupabase, deleteCustomerSupabase } = useCustomers();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer && (mode === 'edit' || mode === 'delete')) {
      setName(customer.name);
      setPhone(customer.whatsapp);
    } else {
      setName('');
      setPhone('');
    }
  }, [customer, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'delete' || isSubmitting) return;

    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await addCustomerSupabase(name, phone);
        toast.success('Cliente añadido con éxito ✅');
      } else if (mode === 'edit' && customer) {
        await updateCustomerSupabase(customer.id, name, phone);
        toast.success('Datos actualizados ✅');
      }
      onClose();
    } catch (error: any) {
      console.error('Customer action error:', error);
      toast.error('Error al guardar: ' + (error.message || 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!customer || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await deleteCustomerSupabase(customer.id);
      toast.success('Cliente y deudas eliminados correctamente 🗑️');
      onClose();
    } catch (error: any) {
      console.error('Delete customer error:', error);
      toast.error('Error al eliminar: ' + (error.message || 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-serif text-2xl italic text-slate-900">
                {mode === 'create' ? 'Nuevo Deudor' : mode === 'edit' ? 'Editar Perfil' : 'Eliminar Registro'}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                {mode === 'delete' ? 'Acción Crítica' : 'Gestión de Cliente'}
              </p>
            </div>
            <button onClick={onClose} className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
              <X size={20} />
            </button>
          </div>

          <div className="p-8">
            {mode === 'delete' ? (
              <div className="space-y-6">
                <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 flex gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-200">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-rose-900 text-lg">¿Estás seguro?</h4>
                    <p className="text-sm text-rose-700/80 leading-relaxed mt-1">
                      Se eliminarán también **todas sus deudas y abonos asociados**. Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 h-14 rounded-2xl font-sans font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex-[2] h-14 rounded-2xl bg-rose-500 text-white font-sans font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                    Eliminar Permanentemente
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {customer?.legacy_id && (
                  <div className="hidden p-4 bg-amber-50 rounded-2xl border border-amber-100 items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">ID de Notebook (Legacy)</span>
                    <span className="font-mono text-sm font-bold text-amber-700">#{customer.legacy_id}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">Nombre Completo</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                      <User size={18} />
                    </div>
                    <input
                      autoFocus
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Nombre Apellido"
                      className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:ring-0 transition-all font-sans font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">WhatsApp / Teléfono</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej: 56912345678"
                      className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:ring-0 transition-all font-sans font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 h-14 rounded-2xl font-sans font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] h-14 rounded-2xl bg-slate-900 text-white font-sans font-bold shadow-xl hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {mode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
