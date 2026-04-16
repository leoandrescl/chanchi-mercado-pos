'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDeleteModalProps {
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export default function ConfirmDeleteModal({ productName, onConfirm, onCancel, isDeleting }: ConfirmDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 relative"
      >
        {/* Close Button */}
        <button 
          onClick={onCancel}
          className="absolute top-6 right-6 h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="p-8 pb-10 text-center">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 mb-8 border border-rose-100/50">
            <AlertTriangle size={36} strokeWidth={1.5} />
          </div>
          
          <h3 className="font-serif text-2xl text-slate-900 mb-3 italic">¿Eliminar producto?</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-10 px-2">
            Estás a punto de eliminar <span className="font-bold text-slate-900 tracking-tight">"{productName}"</span>. Esta acción no se puede deshacer y desaparecerá de tu inventario.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={isDeleting}
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isDeleting}
              fullWidth
              className="bg-rose-500 hover:bg-rose-600 text-white border-0 shadow-lg shadow-rose-200"
            >
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
