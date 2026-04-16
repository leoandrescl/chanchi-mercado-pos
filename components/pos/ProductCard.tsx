import React, { memo } from 'react';
import { useCart } from '@/store/useCart';
import { useInventory } from '@/store/useInventory';
import { ShoppingBag, Star, Edit3, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { playPop } from '@/lib/audio';
import Image from 'next/image';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  isFavorite?: boolean;
  isBundle?: boolean;
  viewMode?: 'grid' | 'list';
  category?: string;
  isPublic?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ProductCard = memo(({ 
  id, name, price, image, isFavorite, isBundle, viewMode = 'grid',
  category, isPublic, onEdit, onDelete 
}: ProductCardProps) => {
  const addItem = useCart((state) => state.addItem);
  const toggleFavoriteStore = useInventory((state) => state.toggleFavorite);

  const isAdmin = !!(onEdit || onDelete);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  const handleClick = (e: React.MouseEvent) => {
    if (isPublic) return; // Read-only mode
    if ((e.target as HTMLElement).closest('.favorite-toggle')) return;
    addItem({ id, name, price });
    playPop();
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavoriteStore(id);
    playPop();
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        id={`product-card-${id}`}
        onClick={isAdmin ? undefined : handleClick}
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.01 }}
        className={`group flex items-center w-full bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-amber-200 h-[72px] ${!isAdmin ? 'cursor-pointer' : ''}`}
      >
        <div className="h-full w-24 bg-slate-50 relative shrink-0 overflow-hidden border-r border-slate-50">
          {image ? (
            <Image 
              src={image} 
              alt={name} 
              fill
              className="object-cover" 
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center font-serif text-amber-200 font-black italic">{name.charAt(0)}</div>
          )}
        </div>
        
        <div className="flex-1 px-4 py-2 flex items-center justify-between gap-4 min-w-0">
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors truncate">
              {name}
            </h3>
            <span className="text-base font-black text-slate-950 tabular-nums">
              {formatPrice(price)}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isPublic && (
              <button
                onClick={handleToggleFavorite}
                title="Marcar como frecuente"
                className="favorite-toggle h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 hover:text-amber-400 hover:bg-amber-50 transition-all border border-transparent hover:border-amber-100"
              >
                <Star size={16} className={isFavorite ? "text-amber-400 fill-amber-400" : ""} />
              </button>
            )}
            
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit?.(id)}
                  className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-amber-100 hover:text-amber-600 transition-colors"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => onDelete?.(id)}
                  className="h-9 w-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                <ShoppingBag size={18} />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // --- GRID VIEW (Default) ---
  return (
    <motion.div
      id={`product-card-${id}`}
      onClick={isAdmin ? undefined : handleClick}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      role={isAdmin ? "article" : "button"}
      tabIndex={0}
      className={`group flex flex-col w-full bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:border-amber-200 outline-none focus:ring-2 focus:ring-amber-200 ${!isAdmin ? 'cursor-pointer' : ''}`}
    >
      {/* Product Image / Fallback */}
      <div className="aspect-[4/3] relative w-full bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-50">
        {/* Toggleable Star Icon (Admin only) */}
        {!isPublic && (
          <button
            onClick={handleToggleFavorite}
            title="Marcar como frecuente"
            className="favorite-toggle absolute top-2 right-2 z-10 h-8 w-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-90 transition-all border border-slate-100 group-hover:bg-white"
          >
            <Star 
              size={14} 
              className={isFavorite ? "text-amber-400 fill-amber-400" : "text-slate-300"} 
            />
          </button>
        )}

        {/* Status Badge (Public mode) */}
        {isPublic && (
          <div className="absolute top-2 right-2 z-10 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full border border-emerald-100 shadow-sm backdrop-blur-md">
            Disponible
          </div>
        )}

        {/* Bundle / Promo Badge */}
        {isBundle && (
          <div className="absolute top-2 left-3 z-10 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-md animate-pulse">
            Pack
          </div>
        )}

        {image ? (
          <Image 
            src={image} 
            alt={name} 
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-2 text-center">
            <span className="font-serif text-2xl font-bold text-amber-100 uppercase tracking-tighter leading-none group-hover:text-amber-200 transition-colors">
              {name.charAt(0)}
            </span>
            <span className="text-[6px] font-bold uppercase tracking-[0.2em] text-slate-200 mt-1">
              Chanchi
            </span>
          </div>
        )}

        {/* Action Overlay for Admin — Always visible for mobile usability */}
        {isAdmin && (
          <div className="absolute bottom-2 right-2 flex items-center gap-2 z-20">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(id); }}
              className="h-9 w-9 rounded-xl bg-white text-slate-900 border border-slate-100 shadow-lg active:scale-90 transition-transform flex items-center justify-center"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(id); }}
              className="h-9 w-9 rounded-xl bg-rose-500 text-white border border-rose-600 shadow-lg active:scale-90 transition-transform flex items-center justify-center"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Info Overlay / Footer */}
      <div className="p-3 bg-white text-left space-y-0.5">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-none">
          {category || 'General'}
        </span>
        <h3 className="font-sans text-xs font-bold text-slate-800 truncate leading-tight group-hover:text-amber-600 transition-colors">
          {name}
        </h3>
        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-black text-slate-950 tabular-nums tracking-tight">
            {formatPrice(price)}
          </span>
          {!isAdmin && !isPublic && (
            <div className="h-5 w-5 rounded-full bg-amber-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ShoppingBag size={10} className="text-amber-400" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
