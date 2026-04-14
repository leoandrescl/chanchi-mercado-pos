'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/store/useInventory';
import { X, Check, Tag, DollarSign, Package } from 'lucide-react';

interface ProductModalProps {
  product?: Product; // If provided, we are editing
  onClose: () => void;
  onSave: (data: Omit<Product, 'id' | 'created_at'>) => Promise<void>;
}

export default function ProductModal({ product, onClose, onSave }: ProductModalProps) {
  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [category, setCategory] = useState(product?.category || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceNum = parseInt(price);
    if (!name.trim()) return setError('El nombre es obligatorio.');
    if (isNaN(priceNum) || priceNum <= 0) return setError('El precio debe ser mayor a $0.');

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        price: priceNum,
        category: category.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      console.error('Error saving product:', err);
      if (err.code === '23505') {
        setError('Este producto ya existe en tu lista');
      } else {
        setError(err.message || 'Error al guardar el producto.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-500 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
              <Package size={24} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-500 mb-1">Catálogo</p>
              <h2 className="font-serif text-2xl text-slate-900">{product ? 'Editar ítem' : 'Nuevo ítem'}</h2>
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
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 block px-1">Nombre del Producto</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Tag size={18} strokeWidth={1.5} />
                </div>
                <input
                  required
                  autoFocus
                  type="text"
                  placeholder="Ej. Empanada de Pino"
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 pl-12 font-sans text-lg text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-slate-300 focus:outline-none transition-all duration-300"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 block px-1">Precio (CLP)</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                  <DollarSign size={18} strokeWidth={1.5} />
                </div>
                <input
                  required
                  type="number"
                  placeholder="1500"
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 pl-12 font-sans text-lg text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-slate-300 focus:outline-none transition-all duration-300"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 block px-1">Categoría (Opcional)</label>
              <input
                type="text"
                placeholder="Ej. Masas, Bebidas..."
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-sans text-lg text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-slate-300 focus:outline-none transition-all duration-300"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 text-xs text-center">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-14 rounded-2xl border border-slate-100 font-semibold text-slate-400 hover:bg-slate-50 active:scale-[0.98] transition-all duration-200"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-[2] h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center gap-2 font-semibold hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 transition-all duration-200 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
            >
              {isSaving ? (
                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={20} strokeWidth={2} />
                  <span>{product ? 'Actualizar' : 'Guardar Ítem'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
