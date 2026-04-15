'use client';

import React, { useState, useRef } from 'react';
import { useInventory, Product } from '@/store/useInventory';
import { X, Plus, UploadCloud, Package, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { addBundleWithImage } from '@/app/actions/products';

interface AddBundleModalProps {
  onClose: () => void;
}

interface BundleComponent {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function AddBundleModal({ onClose }: AddBundleModalProps) {
  const { products, fetchProducts } = useInventory();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [components, setComponents] = useState<BundleComponent[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [componentQuantity, setComponentQuantity] = useState(1);

  const baseProducts = products.filter(p => !p.is_bundle); // solo productos normales

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen es muy pesada. Máximo 5MB.');
        return;
      }
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleAddComponent = () => {
    if (!selectedProductId) {
      toast.error('Selecciona un producto primero.');
      return;
    }
    const product = baseProducts.find(p => p.id === selectedProductId);
    if (!product) return;

    if (componentQuantity < 1) {
      toast.error('La cantidad debe ser al menos 1.');
      return;
    }

    setComponents(prev => {
      const existing = prev.find(c => c.id === product.id);
      if (existing) {
        return prev.map(c => c.id === product.id ? { ...c, quantity: c.quantity + componentQuantity } : c);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: componentQuantity }];
    });

    setSelectedProductId('');
    setComponentQuantity(1);
  };

  const removeComponent = (id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
  };

  const calculateSuggestedPrice = () => {
    return components.reduce((acc, comp) => acc + (comp.price * comp.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (components.length === 0) {
      setError('Debes añadir al menos un producto al Pack.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('price', price || calculateSuggestedPrice().toString());
      formData.append('category', 'Pack Promocional');
      formData.append('components', JSON.stringify(components.map(c => ({ id: c.id, quantity: c.quantity }))));
      
      if (imageFile) {
        formData.append('imageFile', imageFile);
      }

      const res = await addBundleWithImage(formData);

      if (!res.success) {
        setError(res.error || 'Error al guardar el pack.');
        setIsSubmitting(false);
        return;
      }
      
      await fetchProducts();
      toast.success("Pack añadido al menú 🎁");
      onClose();
    } catch (err: any) {
      console.error('Error adding bundle:', err);
      setError('Error inesperado. Verifica tu conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-4 shrink-0">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-500 mb-1.5">
              <Package size={12} />
              Administración
            </p>
            <h2 className="font-serif text-3xl text-slate-900 leading-tight">Nuevo Pack</h2>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-2 overflow-y-auto hidden-scrollbar flex-1 space-y-6">
          
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-2">Nombre del Pack</label>
              <input
                autoFocus
                required
                type="text"
                placeholder="Ej. Promo Sopaipillas x3"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-sans text-lg font-medium text-slate-900 placeholder:text-slate-300 focus:border-emerald-300 focus:bg-white focus:outline-none transition-all duration-300"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Añadir Componentes */}
            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                Productos del Pack
              </label>
              
              <div className="flex items-center gap-2">
                <select 
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="" disabled>Selecciona un producto...</option>
                  {baseProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({formatPrice(p.price)})</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  min="1"
                  className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-center tabular-nums outline-none focus:border-emerald-400"
                  value={componentQuantity}
                  onChange={(e) => setComponentQuantity(parseInt(e.target.value))}
                />
                <button 
                  type="button"
                  onClick={handleAddComponent}
                  className="bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl h-10 w-10 flex items-center justify-center transition-all"
                >
                  <Plus size={18} />
                </button>
              </div>

              {components.length > 0 && (
                <div className="space-y-2 mt-4">
                  {components.map((c) => (
                    <div key={c.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{c.quantity}x a {formatPrice(c.price)} /u</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm tracking-tight">{formatPrice(c.price * c.quantity)}</span>
                        <button type="button" onClick={() => removeComponent(c.id)} className="text-rose-400 hover:text-rose-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price input */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Precio Final del Pack (CLP)</label>
                {components.length > 0 && (
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                    Sugerido: {formatPrice(calculateSuggestedPrice())}
                  </span>
                )}
              </div>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xl">$</span>
                <input
                  required
                  type="number"
                  placeholder={calculateSuggestedPrice().toString() || '0'}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 pl-10 font-sans text-xl font-semibold text-slate-900 tabular-nums placeholder:text-slate-300 focus:border-emerald-300 focus:bg-white focus:outline-none transition-all duration-300 shadow-sm"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Image */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-2">Foto Promocional (Opcional)</label>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden relative ${
                  imagePreview ? 'border-transparent bg-slate-900' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-300'
                }`}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-white font-bold uppercase tracking-widest text-xs bg-slate-900/50 px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2">
                        <UploadCloud size={16} /> Cambiar Foto
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <UploadCloud size={24} className="text-slate-300 mb-1" />
                    <p className="text-xs font-semibold text-slate-500">Toca para seleccionar imagen (Máx 5MB)</p>
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
            disabled={isSubmitting}
            className="w-full h-16 mt-2 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center gap-3 font-semibold tracking-tight hover:bg-slate-800 active:scale-[0.98] transition-all duration-300 shadow-2xl disabled:opacity-50 group"
          >
            {isSubmitting ? (
              <div className="h-6 w-6 border-3 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
            ) : (
              <>
                <Package size={22} className="text-emerald-400" />
                <span className="font-serif text-xl italic">Crear Pack</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
