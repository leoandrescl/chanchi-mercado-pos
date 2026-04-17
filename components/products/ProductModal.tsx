'use client';

import React, { useState, useRef } from 'react';
import { Product } from '@/store/useInventory';
import { Package, Upload, Link as LinkIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import AdaptiveDialog from '@/components/ui/AdaptiveDialog';
import Button from '@/components/ui/Button';
import { addProductWithImage, updateProductWithImage } from '@/app/actions/products';

interface ProductModalProps {
  product?: Product;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

export default function ProductModal({ product, onClose, onRefresh }: ProductModalProps) {
  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [category, setCategory] = useState(product?.category || '');
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageType, setImageType] = useState<'url' | 'file'>(imagePreview?.startsWith('data:') ? 'file' : 'url');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error("La imagen es muy pesada (máx 5MB)");
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setImageType('file');
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
      const formData = new FormData();
      if (product) formData.append('id', product.id);
      formData.append('name', name.trim());
      formData.append('price', priceNum.toString());
      formData.append('category', category.trim() || 'General');
      
      if (imageFile) {
        formData.append('imageFile', imageFile);
      } else if (imagePreview) {
        formData.append('imagePreview', imagePreview);
      }

      const res = product 
        ? await updateProductWithImage(formData)
        : await addProductWithImage(formData);

      if (!res.success) {
        throw new Error(res.error || 'Error al guardar el producto.');
      }
      
      await onRefresh();
      toast.success(product ? "Cambios guardados con éxito ✨" : "Producto añadido al menú 🍔");
      onClose();
    } catch (err: any) {
      console.error('Error saving product:', err);
      if (err.message?.includes('duplicate key')) {
        setError('Este producto ya existe en tu lista');
      } else {
        setError(err.message || 'Error al guardar el producto.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdaptiveDialog
      isOpen={true}
      onClose={onClose}
      title={product ? 'Editar Ítem' : 'Nuevo Producto'}
    >
      <form onSubmit={handleSubmit} className="space-y-8 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-4">Nombre del Ítem</label>
              <input
                required
                autoFocus
                type="text"
                placeholder="Ej. Sopaipilla Pasada"
                className="w-full h-14 rounded-xl border border-slate-100 bg-slate-50 px-6 text-slate-900 text-sm font-bold focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-50 focus:outline-none transition-all shadow-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-4">Precio (CLP)</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  required
                  type="number"
                  placeholder="0"
                  className="w-full h-14 rounded-xl border border-slate-100 bg-slate-50 pl-12 pr-6 text-slate-950 text-sm font-black tabular-nums focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-50 focus:outline-none transition-all shadow-sm"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-4">Categoría</label>
              <input
                type="text"
                placeholder="Ej. Frituras"
                className="w-full h-14 rounded-xl border border-slate-100 bg-slate-50 px-6 text-slate-900 text-sm font-bold focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-50 focus:outline-none transition-all shadow-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-4">Imagen (Opcional)</label>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative group aspect-square rounded-[2rem] bg-white border border-slate-100 overflow-hidden flex items-center justify-center p-4 transition-all hover:bg-slate-50 cursor-pointer"
            >
              <AnimatePresence mode="wait">
                {imagePreview ? (
                  <motion.img
                    key={imagePreview}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    src={imagePreview}
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
                    <Package size={40} strokeWidth={1.5} className="text-slate-200 mb-3" />
                    <p className="text-[10px] font-bold uppercase text-slate-300 tracking-[0.2em]">Añadir Foto</p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center gap-3">
                <div className="h-10 w-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-900 shadow-xl">
                  <Upload size={18} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = prompt('Ingrese URL de la imagen:');
                    if (url) {
                      setImagePreview(url);
                      setImageFile(null);
                      setImageType('url');
                    }
                  }}
                  className="h-10 w-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-900 shadow-xl"
                >
                  <LinkIcon size={18} />
                </button>
              </div>
            </div>

            {imageType === 'url' && imagePreview?.startsWith('http') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="px-4 text-[9px] font-bold text-emerald-600 uppercase tracking-widest">URL Vinculada correctamente</p>
              </motion.div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 text-[10px] font-bold uppercase tracking-widest text-center">
            {error}
          </div>
        )}

        <div className="pt-2 sticky bottom-0 bg-white">
          <Button
            type="submit"
            disabled={isSaving}
            size="large"
            fullWidth
            icon={!isSaving && !product ? <Package size={20} /> : undefined}
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : (product ? 'Guardar Cambios' : 'Registrar Ítem')}
          </Button>
        </div>
      </form>
    </AdaptiveDialog>
  );
}
