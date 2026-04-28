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
  priority?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ProductCard = memo(({
  id, name, price, image, isVisible, isBundle, viewMode = 'grid',
  category, isPublic, priority, onEdit, onDelete
}: ProductCardProps) => {
  const addItem = useCart((state) => state.addItem);
  const toggleVisibilityStore = useInventory((state) => state.toggleVisibility);

  const isAdmin = !!(onEdit || onDelete);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPublic && !isVisible) return;
    
    // Trigger animation via event or global state if needed, but for now we just add
    addItem({ id, name, price });
    playPop();

    // Find the image element to get its position for the animation
    const card = document.getElementById(`product-card-${id}`);
    if (card) {
      const rect = card.getBoundingClientRect();
      const event = new CustomEvent('product-added', {
        detail: {
          id,
          name,
          image,
          rect
        }
      });
      window.dispatchEvent(event);
    }
  };

  const handleToggleVisibility = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleVisibilityStore(id);
    playPop();
  };

  const isList = viewMode === 'list';
  const actionButtonClass = isList
    ? 'h-9 w-9 rounded-lg'
    : 'h-10 w-10 rounded-xl';
  const actionIconSize = isList ? 16 : 18;

  return (
    <motion.div
      transition={{ duration: 0.18 }}
      id={`product-card-${id}`}
      onClick={!isAdmin ? handleAdd : undefined}
      whileTap={{ scale: 0.98 }}
      className={`
        group relative flex bg-white border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-amber-200 outline-none focus:ring-4 focus:ring-amber-100
        ${isList ? 'flex-row items-center w-full min-h-[6.5rem] rounded-3xl p-2.5 sm:p-3 shadow-sm' : 'flex-col w-full rounded-[2.5rem]'}
        ${!isAdmin && (isVisible || !isPublic) ? 'cursor-pointer' : 'cursor-default'}
        ${isPublic && !isVisible ? 'grayscale opacity-70 cursor-not-allowed' : ''}
      `}
    >
      {/* ─── PRODUCT IMAGE ─── */}
      <div
        className={`
          relative bg-slate-50 flex items-center justify-center overflow-hidden shrink-0
          ${isList ? 'h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border border-slate-100' : 'aspect-square w-full'}
        `}
      >
        <AnimatePresence mode="popLayout">
          {image ? (
            <motion.div
              key="image"
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0"
            >
              <Image
                src={image}
                alt={name}
                fill
                sizes={isList ? "80px" : "400px"}
                priority={priority}
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </motion.div>
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-amber-50/30">
              <span className="font-serif text-4xl font-black text-amber-100/50 uppercase italic">
                {name.charAt(0)}
              </span>
            </div>
          )}
        </AnimatePresence>

        {/* Gradient Overlay for better text legibility if needed, but here it's below */}
        {!isList && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
        )}
      </div>

      {/* ─── CONTENT ─── */}
      <div className={`
        flex flex-1 flex-col min-w-0
        ${isList ? 'px-3 py-1.5 justify-center' : 'p-6 space-y-2 text-center'}
      `}>
        <h3 className={`font-serif italic font-bold text-slate-900 leading-tight group-hover:text-amber-600 transition-colors ${isList ? 'text-base sm:text-lg line-clamp-2' : 'text-sm truncate'}`}>
          {name}
        </h3>

        <div className={`flex items-center gap-2 ${isList ? '' : 'justify-center'}`}>
          <span className={`${isList ? 'text-xl sm:text-2xl' : 'text-xl'} font-black text-slate-950 tabular-nums tracking-tight whitespace-nowrap leading-none`}>
            {formatPrice(price)}
          </span>
        </div>
      </div>

      {/* ─── FLOATING ADD BUTTON (Mobile/Grid optimized) ─── */}
      {!isAdmin && !isList && (
        <button
          onClick={handleAdd}
          className="absolute bottom-4 right-4 h-12 w-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200 active:scale-90 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
        >
          <ShoppingBag size={20} />
        </button>
      )}

      {/* ─── ADMIN ACTIONS ─── */}
      {isAdmin && (
        <div className={`flex items-center gap-1.5 ${isList ? 'pr-1 pl-1 py-1 rounded-xl bg-slate-50/70 border border-slate-100' : 'absolute top-4 right-4'}`}>
          <button
            onClick={handleToggleVisibility}
            className={`${actionButtonClass} flex items-center justify-center transition-all ${isVisible ? 'bg-white/80 backdrop-blur-md text-slate-400 border border-slate-100' : 'bg-amber-400 text-white shadow-lg shadow-amber-100 border border-amber-500'}`}
          >
            {isVisible ? <Eye size={actionIconSize} /> : <EyeOff size={actionIconSize} />}
          </button>
          <button
            onClick={() => onEdit?.(id)}
            className={`${actionButtonClass} bg-white/80 backdrop-blur-md text-slate-900 border border-slate-100 shadow-sm flex items-center justify-center hover:bg-white`}
          >
            <Edit3 size={actionIconSize} />
          </button>
          <button
            onClick={() => onDelete?.(id)}
            className={`${actionButtonClass} bg-rose-500 text-white shadow-lg shadow-rose-100 flex items-center justify-center hover:bg-rose-600`}
          >
            <Trash2 size={actionIconSize} />
          </button>
        </div>
      )}
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
