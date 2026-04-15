'use client';

import React, { useState, useRef } from 'react';
import { useInventory } from '@/store/useInventory';
import { X, Plus, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { addProductWithImage } from '@/app/actions/products';

interface AddProductModalProps {
  onClose: () => void;
}

export default function AddProductModal({ onClose }: AddProductModalProps) {
  const fetchProducts = useInventory((state) => state.fetchProducts);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('La imagen es muy pesada. Máximo 5MB.');
        return;
      }
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('price', price);
      formData.append('category', 'Nuevo');
      if (imageFile) {
        formData.append('imageFile', imageFile);
      }

      const res = await addProductWithImage(formData);

      if (!res.success) {
        setError(res.error || 'Error al guardar el producto.');
        setIsSubmitting(false);
        return;
      }
      
      await fetchProducts(); // Refresh local list
      toast.success("Producto añadido al menú 🍔");
      onClose();
    } catch (err: any) {
      console.error('Error adding product:', err);
      setError('Error inesperado. Verifica tu conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-500 mb-1.5">Administración</p>
            <h2 className="font-serif text-3xl text-slate-900 leading-tight">Nuevo Producto</h2>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-7">
          <div className="space-y-6">
            {/* Name input */}
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 block mb-3">Nombre del Ítem</label>
              <input
                autoFocus
                required
                type="text"
                placeholder="Ej. Sopaipilla Pasada"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-sans text-xl font-medium text-slate-900 placeholder:text-slate-300 focus:border-amber-300 focus:bg-white focus:outline-none transition-all duration-300 shadow-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Price input */}
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 block mb-3">Precio de Venta (CLP)</label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xl">$</span>
                <input
                  required
                  type="number"
                  placeholder="0"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 pl-10 font-sans text-xl font-semibold text-slate-900 tabular-nums placeholder:text-slate-300 focus:border-amber-300 focus:bg-white focus:outline-none transition-all duration-300 shadow-sm"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Native Image Upload */}
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 block mb-3">Foto del Producto (Opcional)</label>
              
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageChange}
              />

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden relative ${
                  imagePreview 
                    ? 'border-transparent bg-slate-900' 
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-amber-300'
                }`}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-white font-bold uppercase tracking-widest text-xs bg-slate-900/50 px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2">
                        <UploadCloud size={16} />
                        Cambiar Foto
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <UploadCloud size={32} className="text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-500">Toca para seleccionar imagen</p>
                    <p className="text-xs font-medium text-slate-400 mt-1">Máx 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 text-xs font-medium text-center animate-pulse">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            id="btn-submit-product"
            disabled={isSubmitting}
            className="w-full h-16 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center gap-3 font-semibold tracking-tight hover:bg-slate-800 active:scale-[0.98] transition-all duration-300 shadow-2xl disabled:opacity-50 overflow-hidden group"
          >
            {isSubmitting ? (
              <div className="h-6 w-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <div className="relative flex items-center justify-center">
                  <Plus size={22} strokeWidth={2} className="group-hover:rotate-90 transition-transform duration-500" />
                </div>
                <span className="font-serif text-xl italic">Guardar en el Menú</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
