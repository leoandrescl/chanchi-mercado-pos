'use client';

import React, { useState, useEffect } from 'react';
import { useCustomers } from '@/store/useCustomers';
import { X, UserPlus, Phone, Check, AlertCircle } from 'lucide-react';

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

  // Simple duplicate detection as user types
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
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-500 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
              <UserPlus size={24} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-500 mb-1">Onboarding</p>
              <h2 className="font-serif text-2xl text-slate-900">Nuevo Cliente</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 block px-1">Nombre Completo</label>
            <div className="relative">
              <input
                autoFocus
                required
                type="text"
                placeholder="Ej. Juan Pérez"
                className={`w-full rounded-2xl border bg-slate-50 px-5 py-4 font-sans text-lg text-slate-900 placeholder:text-slate-300 focus:bg-white focus:outline-none transition-all duration-300 ${
                  duplicateWarning ? 'border-amber-200 focus:border-amber-400' : 'border-slate-100 focus:border-slate-300'
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
              <p className="text-[10px] text-amber-600 font-medium px-1 flex items-center gap-1">
                <span>⚠️</span> {duplicateWarning}
              </p>
            )}
          </div>

          {/* Phone Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 block px-1">WhatsApp / Teléfono</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone size={18} strokeWidth={1.5} />
              </div>
              <input
                type="tel"
                placeholder="569 1234 5678"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 pl-12 font-sans text-lg text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-slate-300 focus:outline-none transition-all duration-300"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <p className="text-[9px] text-slate-400 italic px-1">Se limpiará el formato automáticamente para WhatsApp.</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-14 rounded-2xl border border-slate-100 font-semibold text-slate-400 hover:bg-slate-50 active:scale-[0.98] transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-[2] h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center gap-2 font-semibold hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
            >
              {isSubmitting ? (
                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={20} strokeWidth={2} />
                  <span>Guardar Cliente</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
