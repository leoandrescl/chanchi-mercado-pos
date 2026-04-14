import React, { memo } from 'react';
import { useCart } from '@/store/useCart';
import { ShoppingBag, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { playPop } from '@/lib/audio';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  isFavorite?: boolean;
}

const ProductCard = memo(({ id, name, price, image, isFavorite }: ProductCardProps) => {
  const addItem = useCart((state) => state.addItem);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  const handleClick = () => {
    addItem({ id, name, price });
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
        {isFavorite && (
          <div className="absolute top-2 right-2 z-10 h-6 w-6 bg-amber-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-amber-200">
            <Star size={12} fill="currentColor" />
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
      <div className="p-1.5 bg-white text-left space-y-0">
        <h3 className="font-sans text-[9px] font-bold text-slate-800 truncate leading-tight group-hover:text-amber-600 transition-colors">
          {name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="font-serif text-[10px] font-bold text-slate-900 italic tracking-tight">
            {formatPrice(price)}
          </span>
          <div className="h-3 w-3 rounded-full bg-amber-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ShoppingBag size={6} className="text-amber-400" />
          </div>
        </div>
      </div>
    </motion.button>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
