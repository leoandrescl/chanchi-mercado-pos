'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export default function ConfirmDeleteModal({ productName, onConfirm, onCancel, isDeleting }: ConfirmDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-6">
            <AlertTriangle size={32} strokeWidth={1.5} />
          </div>
          
          <h3 className="font-serif text-2xl text-slate-900 mb-2">¿Eliminar producto?</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Estás a punto de eliminar <span className="font-bold text-slate-800">"{productName}"</span>. Esta acción no se puede deshacer y el producto ya no estará disponible para fiar.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 h-12 rounded-xl border border-slate-100 font-semibold text-slate-400 hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 h-12 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 active:scale-[0.98] flex items-center justify-center"
            >
              {isDeleting ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sí, eliminar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
