'use client';

import React, { memo } from 'react';
import { useCart } from '@/store/useCart';
import { useInventory } from '@/store/useInventory';
import { ShoppingBag, Eye, EyeOff, Edit3, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playPop } from '@/lib/audio';
import Image from 'next/image';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  isPublic?: boolean;
  isVisible?: boolean;
  isBundle?: boolean;
  viewMode?: 'grid' | 'list';
  category?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ProductCard = memo(({
  id, name, price, image, isVisible, isBundle, viewMode = 'grid',
  category, isPublic, onEdit, onDelete
}: ProductCardProps) => {
  const addItem = useCart((state) => state.addItem);
  const toggleVisibilityStore = useInventory((state) => state.toggleVisibility);

  const isAdmin = !!(onEdit || onDelete);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  const handleClick = (e: React.MouseEvent) => {
    // Prevent adding to cart if clicking an action button or if it's an out-of-stock public item
    if ((e.target as HTMLElement).closest('.action-button')) return;
    if (isPublic && !isVisible) return;

    addItem({ id, name, price });
    playPop();
  };

  const handleToggleVisibility = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleVisibilityStore(id);
    playPop();
  };

  const isList = viewMode === 'list';

  return (
    <motion.div
      layout
      transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
      id={`product-card-${id}`}
      onClick={!isAdmin ? handleClick : undefined}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.01 }}
      role={!isAdmin ? "button" : "article"}
      tabIndex={0}
      className={`
        group relative flex bg-white border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-amber-200 outline-none focus:ring-2 focus:ring-amber-200
        ${isList ? 'flex-row items-center w-full h-[82px] rounded-2xl p-1' : 'flex-col w-full rounded-3xl'}
        ${!isAdmin && (isVisible || !isPublic) ? 'cursor-pointer' : 'cursor-default'}
        ${isPublic && !isVisible ? 'grayscale opacity-70 cursor-not-allowed' : ''}
        ${!isVisible && isAdmin ? 'opacity-60 grayscale-[0.5]' : ''}
      `}
    >
      {/* ─── PRODUCT IMAGE / FALLBACK ─── */}
      <motion.div
        layout
        className={`
          relative bg-white flex items-center justify-center overflow-hidden shrink-0
          ${isList ? 'h-full aspect-square rounded-xl' : 'aspect-square w-full border-b border-slate-50'}
        `}
      >
        <AnimatePresence mode="popLayout">
          {image ? (
            <motion.div
              key="image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <Image
                src={image}
                alt={name}
                fill
                sizes={isList ? "100px" : "(max-width: 768px) 50vw, 33vw"}
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </motion.div>
          ) : (
            <motion.div
              key="fallback"
              className="flex flex-col items-center justify-center p-2 text-center"
            >
              <span className="font-serif text-2xl font-bold text-amber-100 uppercase tracking-tighter leading-none group-hover:text-amber-200 transition-colors">
                {name.charAt(0)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Badge (Public mode) - only for Grid */}
        {isPublic && !isList && (
          isVisible ? (
            <div className="absolute top-2 right-2 z-10 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full border border-emerald-100 shadow-sm backdrop-blur-md">
              Disponible
            </div>
          ) : (
            <div className="absolute top-2 right-2 z-10 bg-slate-900/90 text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-xl backdrop-blur-md border border-white/20 whitespace-nowrap">
              Vuelve pronto 🔥
            </div>
          )
        )}

        {/* Visibility Badge (Admin mode) */}
        {!isPublic && isAdmin && !isVisible && (
          <div className="absolute top-2 left-2 z-10 bg-rose-500 text-white text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full shadow-lg">
            Oculto
          </div>
        )}

        {/* Bundle / Promo Badge */}
        {isBundle && (
          <div className={`absolute z-10 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-md animate-pulse ${isList ? 'top-1 left-1 px-1.5 py-1 text-[7px]' : 'top-2 left-3'}`}>
            Pack
          </div>
        )}
      </motion.div>

      {/* ─── CONTENT AREA ─── */}
      <div className={`
        flex flex-1 flex-col min-w-0
        ${isList ? 'px-4 py-2 justify-center' : 'p-4 space-y-1'}
      `}>
        <motion.div layout className="flex flex-col min-w-0">
          <h3 className={`font-sans font-bold text-slate-800 truncate leading-tight group-hover:text-amber-600 transition-colors ${isList ? 'text-sm' : 'text-xs'}`}>
            {name}
          </h3>
        </motion.div>

        <motion.div layout className="flex items-center pt-1 gap-2">
          <span className="text-base font-black text-slate-950 tabular-nums tracking-tight">
            {formatPrice(price)}
          </span>
        </motion.div>
      </div>

      {/* ─── UNIFIED ACTIONS ZONE ─── */}
      <div className={`
        flex items-center justify-end
        ${isList ? 'w-[140px] px-2 md:px-4 gap-2 shrink-0' : 'absolute top-2 right-2 z-20 gap-2'}
      `}>
        {/* PUBLIC: Shopping Cart Button */}
        {isPublic && !isAdmin && isVisible && (
          <div className={`rounded-xl bg-amber-50 flex items-center justify-center transition-all shrink-0 ${isList ? 'h-9 w-9 border border-amber-100' : 'h-6 w-6 opacity-0 group-hover:opacity-100'}`}>
            <ShoppingBag size={isList ? 16 : 12} className="text-amber-500" />
          </div>
        )}

        {/* ADMIN (or Internal POS): Visibility + Admin Actions */}
        {!isPublic && (
          <button
            onClick={handleToggleVisibility}
            onPointerDown={(e) => e.stopPropagation()}
            title={isVisible ? "Ocultar del catálogo" : "Mostrar en el catálogo"}
            className={`action-button h-10 w-10 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm hover:scale-110 active:scale-90 transition-all border shrink-0 ${isVisible ? 'bg-white border-slate-100 text-slate-400' : 'bg-amber-400 border-amber-500 text-white shadow-amber-200'}`}
          >
            {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        )}

        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(id); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="action-button h-10 w-10 rounded-xl bg-white text-slate-900 border border-slate-100 shadow-sm active:scale-95 transition-transform flex items-center justify-center hover:bg-slate-50 shrink-0"
              title="Editar"
            >
              <Edit3 size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(id); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="action-button h-10 w-10 rounded-xl bg-rose-500 text-white border border-rose-600 shadow-sm active:scale-95 transition-transform flex items-center justify-center shrink-0"
              title="Eliminar"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
