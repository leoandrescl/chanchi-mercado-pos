'use client';

import React, { useState } from 'react';
import { useInventory } from '@/store/useInventory';
import { X, Plus, Image as ImageIcon, Check } from 'lucide-react';

interface AddProductModalProps {
  onClose: () => void;
}

export default function AddProductModal({ onClose }: AddProductModalProps) {
  const { addProduct } = useInventory();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    addProduct({ name, price: parseInt(price), image: image || undefined, category: 'Nuevo' });
    setIsSuccess(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

        {isSuccess ? (
          <div className="flex h-72 flex-col items-center justify-center p-10 text-center">
            <div className="h-20 w-20 rounded-full bg-emerald-500 flex items-center justify-center text-white mb-5 shadow-lg shadow-emerald-500/25">
              <Check size={36} strokeWidth={2} />
            </div>
            <h3 className="font-serif text-2xl text-slate-900 mb-1">¡Añadido al menú!</h3>
            <p className="text-sm text-slate-400 font-medium">El producto ya está disponible</p>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-7 pt-7 pb-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-500 mb-1">Gestión de Menú</p>
                <h2 className="font-serif text-2xl text-slate-900">Nuevo Alimento</h2>
              </div>
              <button
                id="btn-close-add-product"
                onClick={onClose}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-7 pb-7 space-y-5">
              {/* Image upload zone */}
              <div className="relative h-36 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center group hover:border-amber-300 hover:bg-amber-50/30 transition-all duration-200 cursor-pointer">
                {image ? (
                  <img src={image} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-300 group-hover:text-amber-400 transition-colors">
                    <ImageIcon size={28} strokeWidth={1.5} />
                    <span className="text-xs font-semibold uppercase tracking-widest mt-2">Añadir foto</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
              </div>

              {/* Name input */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400 block mb-2">Nombre</label>
                <input
                  autoFocus
                  required
                  type="text"
                  placeholder="Ej: Sopaipilla con pebre"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-sans text-lg text-slate-900 placeholder:text-slate-300 focus:border-amber-300 focus:bg-white focus:outline-none transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Price input */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400 block mb-2">Precio (CLP)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                  <input
                    required
                    type="number"
                    placeholder="500"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pl-8 font-sans text-lg font-semibold text-slate-900 tabular-nums placeholder:text-slate-300 focus:border-amber-300 focus:bg-white focus:outline-none transition-all"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                id="btn-submit-product"
                className="w-full h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center gap-3 font-semibold tracking-tight hover:bg-slate-800 active:scale-[0.99] transition-all duration-200 shadow-lg mt-2"
              >
                <Plus size={18} strokeWidth={2} />
                <span className="font-serif text-lg italic">Guardar en el Menú</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
