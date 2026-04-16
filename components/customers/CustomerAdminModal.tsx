'use client';

import React, { useState, useEffect } from 'react';
import { User, Phone, Trash2, AlertTriangle, Save, Loader2 } from 'lucide-react';
import { useCustomers, Customer } from '@/store/useCustomers';
import { toast } from 'sonner';
import AdaptiveDialog from '@/components/ui/AdaptiveDialog';
import Button from '@/components/ui/Button';

interface CustomerAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
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
    <AdaptiveDialog
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Deudor' : mode === 'edit' ? 'Editar Perfil' : 'Eliminar Registro'}
    >
      <div className="pb-6">
        {mode === 'delete' ? (
          <div className="space-y-6 pt-4">
            <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-200">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-rose-900 text-lg tracking-tight leading-none">¿Estás seguro?</h4>
                <p className="text-sm text-rose-700/80 leading-relaxed">
                  Se eliminarán también todas sus deudas y abonos asociados. Esta acción es irrevocable.
                </p>
              </div>
            </div>

            <Button
              onClick={handleDelete}
              disabled={isSubmitting}
              variant="primary"
              size="large"
              fullWidth
              className="bg-rose-600 hover:bg-rose-700"
              icon={!isSubmitting ? <Trash2 size={20} /> : undefined}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Confirmar Eliminación'}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-4">Nombre Completo</label>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300">
                  <User size={18} />
                </div>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Nombre Apellido"
                  className="w-full h-14 pl-14 pr-6 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-50 focus:outline-none transition-all shadow-sm font-medium text-slate-900 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-4">WhatsApp / Teléfono</label>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: 56912345678"
                  className="w-full h-14 pl-14 pr-6 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-50 focus:outline-none transition-all shadow-sm font-medium text-slate-900 text-sm"
                />
              </div>
            </div>

            <div className="pt-2 sticky bottom-0 bg-white">
              <Button
                type="submit"
                disabled={isSubmitting}
                size="large"
                fullWidth
                icon={!isSubmitting && mode === 'create' ? <Save size={20} /> : undefined}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (mode === 'create' ? 'Crear Cliente' : 'Guardar Cambios')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AdaptiveDialog>
  );
}
