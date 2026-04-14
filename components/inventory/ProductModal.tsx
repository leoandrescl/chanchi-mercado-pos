'use client';

import React, { useState } from 'react';
import { Product } from '@/store/useInventory';
import { X, Check, Package, Upload, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductModalProps {
  product?: Product;
  onClose: () => void;
  onSave: (data: Omit<Product, 'id' | 'created_at'>) => Promise<void>;
}

export default function ProductModal({ product, onClose, onSave }: ProductModalProps) {
  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [category, setCategory] = useState(product?.category || '');
  const [image, setImage] = useState(product?.image || '');
  const [imageType, setImageType] = useState<'url' | 'file'>(product?.image?.startsWith('data:') ? 'file' : 'url');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return toast.error("La imagen es muy pesada (máx 2MB)");
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setImageType('file');
      };
      reader.readAsDataURL(file);
    }
  };

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
        image: image || undefined,
      });
      
      toast.success(product ? "Cambios guardados con éxito ✨" : "Producto añadido al catálogo 🍔");
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
      <div className="w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-500 overflow-hidden">
        
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

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 block px-1">Nombre</label>
                <input
                  required
                  autoFocus
                  type="text"
                  placeholder="Ej. Sopaipilla"
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3 font-sans text-lg text-slate-900 focus:bg-white focus:border-amber-200 focus:outline-none transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 block px-1">Precio</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    required
                    type="number"
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3 pl-8 font-sans text-lg text-slate-900 focus:bg-white focus:border-amber-200 focus:outline-none transition-all"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 block px-1">Categoría</label>
                <input
                  type="text"
                  placeholder="Ej. Masas"
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3 font-sans text-lg text-slate-900 focus:bg-white focus:border-amber-200 focus:outline-none transition-all"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-5">
              <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 block px-1">Imagen Editorial</label>
              
              <div className="relative group aspect-square rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-100 overflow-hidden flex items-center justify-center p-4 transition-all hover:border-amber-200">
                <AnimatePresence mode="wait">
                  {image ? (
                    <motion.img
                      key={image}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      src={image}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <motion.div
                      key="fallback"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center text-center p-4"
                    >
                      <h3 className="font-serif text-3xl text-slate-300 leading-tight uppercase tracking-tighter">
                        {name || 'Producto'}
                      </h3>
                      <p className="text-[9px] font-bold uppercase text-slate-200 mt-2 tracking-widest">Sin imagen asignada</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                  <label className="cursor-pointer h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-lg hover:scale-110 transition-transform">
                    <Upload size={18} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                  <button
                    type="button"
                    onClick={() => setImageType('url')}
                    className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-lg hover:scale-110 transition-transform"
                  >
                    <LinkIcon size={18} />
                  </button>
                  {image && (
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="h-10 w-10 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>

              {imageType === 'url' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <input
                    type="url"
                    placeholder="URL de la imagen..."
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 font-sans text-xs text-slate-600 focus:bg-white focus:outline-none transition-all"
                    value={image.startsWith('data:') ? '' : image}
                    onChange={(e) => {
                      setImage(e.target.value);
                      setImageType('url');
                    }}
                  />
                </motion.div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 text-xs text-center border-dashed font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-14 rounded-2xl border border-slate-100 font-bold uppercase text-[10px] tracking-[0.2em] text-slate-400 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-[2] h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center gap-3 font-semibold shadow-xl transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
            >
              {isSaving ? (
                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={18} strokeWidth={2} />
                  <span className="font-serif text-lg italic tracking-tight">{product ? 'Confirmar Cambios' : 'Registrar Ítem'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
