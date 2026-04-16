'use client';

import React, { useState, useEffect } from 'react';
import { useCustomers } from '@/store/useCustomers';
import { Phone, Check, AlertCircle, Loader2 } from 'lucide-react';
import AdaptiveDialog from '@/components/ui/AdaptiveDialog';
import Button from '@/components/ui/Button';

interface AddCustomerModalProps {
  onClose: () => void;
}

export default function AddCustomerModal({ onClose }: AddCustomerModalProps) {
  const { addCustomerSupabase, customers } = useCustomers();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    if (name.trim().length > 2) {
      const exists = customers.find(c => 
        c.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
      if (exists) {
        setDuplicateWarning(`Ya tienes un cliente llamado "${exists.name}"`);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [name, customers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await addCustomerSupabase(name.trim(), phone);
      onClose(); // Form clears automatically on modal unmount
    } catch (err: any) {
      console.error('Error adding customer:', err);
      setError(err.message || 'Error al guardar el cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdaptiveDialog
      isOpen={true}
      onClose={onClose}
      title="Nuevo Cliente"
    >
      <div className="pb-6">
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-4">Nombre Completo</label>
            <div className="relative">
              <input
                autoFocus
                required
                type="text"
                placeholder="Ej. Juan Pérez"
                className={`w-full h-14 px-6 rounded-xl border transition-all shadow-sm font-medium text-slate-900 text-sm ${
                  duplicateWarning 
                  ? 'border-amber-200 bg-amber-50/30' 
                  : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-50 focus:outline-none'
                }`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {duplicateWarning && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 animate-in fade-in zoom-in-95">
                  <AlertCircle size={20} />
                </div>
              )}
            </div>
            {duplicateWarning && (
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest px-4 flex items-center gap-1">
                ⚠️ {duplicateWarning}
              </p>
            )}
          </div>

          {/* Phone Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-4">WhatsApp / Teléfono</label>
            <div className="relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone size={18} strokeWidth={1.5} />
              </div>
              <input
                type="tel"
                placeholder="569 1234 5678"
                className="w-full h-14 pl-12 pr-6 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-50 focus:outline-none transition-all shadow-sm font-medium text-slate-900 text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-slate-400 italic px-4 leading-none mt-2">Formato WhatsApp se limpiará automáticamente.</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="pt-2 sticky bottom-0 bg-white">
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              size="large"
              fullWidth
              icon={!isSubmitting ? <Check size={20} /> : undefined}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Guardar Cliente'}
            </Button>
          </div>
        </form>
      </div>
    </AdaptiveDialog>
  );
}
