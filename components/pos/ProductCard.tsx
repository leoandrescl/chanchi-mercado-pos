import React, { memo } from 'react';
import { useCart } from '@/store/useCart';
import { useInventory } from '@/store/useInventory';
import { ShoppingBag, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { playPop } from '@/lib/audio';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  isFavorite?: boolean;
  isBundle?: boolean;
}

const ProductCard = memo(({ id, name, price, image, isFavorite, isBundle }: ProductCardProps) => {
  const addItem = useCart((state) => state.addItem);
  const toggleFavoriteStore = useInventory((state) => state.toggleFavorite);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  const handleClick = (e: React.MouseEvent) => {
    // If we click the star, don't trigger add item
    if ((e.target as HTMLElement).closest('.favorite-toggle')) return;
    
    addItem({ id, name, price });
    playPop();
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavoriteStore(id);
    playPop();
  };

  return (
    <motion.button
      id={`product-card-${id}`}
      onClick={handleClick}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      className="group flex flex-col w-full bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:border-amber-200"
    >
      {/* Product Image / Fallback */}
      <div className="aspect-[4/3] relative w-full bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-50">
        {/* Toggleable Star Icon */}
        <button
          onClick={handleToggleFavorite}
          className="favorite-toggle absolute top-2 right-2 z-10 h-8 w-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-90 transition-all border border-slate-100 group-hover:bg-white"
        >
          <Star 
            size={14} 
            className={isFavorite ? "text-amber-400 fill-amber-400" : "text-slate-300"} 
          />
        </button>

        {/* Bundle / Promo Badge */}
        {isBundle && (
          <div className="absolute top-2 left-3 z-10 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-md animate-pulse">
            Pack
          </div>
        )}

        {image ? (
          <img 
            src={image} 
            alt={name} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
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
      </div>

      {/* Info Overlay / Footer */}
      <div className="p-2.5 bg-white text-left space-y-0.5">
        <h3 className="font-sans text-[10px] font-black text-slate-800 truncate leading-tight group-hover:text-amber-600 transition-colors uppercase tracking-tighter">
          {name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="font-serif text-xs font-black text-slate-900 italic tracking-tight underline decoration-amber-200 underline-offset-2">
            {formatPrice(price)}
          </span>
          <div className="h-4 w-4 rounded-full bg-amber-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ShoppingBag size={8} className="text-amber-400" />
          </div>
        </div>
      </div>
    </motion.button>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
