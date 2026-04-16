'use client';

import React, { useState, useRef } from 'react';
import { useInventory } from '@/store/useInventory';
import { Plus, UploadCloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { addProductWithImage } from '@/app/actions/products';
import AdaptiveDialog from '@/components/ui/AdaptiveDialog';
import Button from '@/components/ui/Button';

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
    <AdaptiveDialog
      isOpen={true}
      onClose={onClose}
      title="Nuevo Producto"
    >
      <form onSubmit={handleSubmit} className="space-y-8 pb-6">
        <div className="space-y-6 pt-4">
          {/* Name input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-4">Nombre del Ítem</label>
            <input
              autoFocus
              required
              type="text"
              placeholder="Ej. Sopaipilla Pasada"
              className="w-full h-14 px-6 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-50 focus:outline-none transition-all shadow-sm font-medium text-slate-900 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Price input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-4">Precio (CLP)</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                required
                type="number"
                placeholder="0"
                className="w-full h-14 pl-12 pr-6 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-50 focus:outline-none transition-all shadow-sm font-bold text-slate-950 tabular-nums text-sm"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-4">Imagen (Opcional)</label>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`w-full aspect-video rounded-3xl border border-slate-100 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative ${
                imagePreview 
                  ? 'bg-slate-900 shadow-xl' 
                  : 'bg-slate-50 hover:bg-slate-100/50'
              }`}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-60 transition-opacity hover:opacity-100" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white font-bold uppercase tracking-[0.2em] text-[9px] bg-slate-950/50 px-5 py-2.5 rounded-full backdrop-blur-md flex items-center gap-2 border border-white/20">
                      <UploadCloud size={14} />
                      Cambiar Imagen
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <UploadCloud size={32} strokeWidth={1.5} className="text-slate-200 mb-2" />
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Añadir Foto</p>
                </>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 text-[10px] font-bold uppercase text-center tracking-widest">
            {error}
          </div>
        )}

        <div className="pt-2 sticky bottom-0 bg-white">
          <Button
            type="submit"
            disabled={isSubmitting}
            size="large"
            fullWidth
            icon={!isSubmitting ? <Plus size={20} /> : undefined}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Registrar Ítem'}
          </Button>
        </div>
      </form>
    </AdaptiveDialog>
  );
}
