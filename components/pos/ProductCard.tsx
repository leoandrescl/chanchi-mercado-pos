'use client';

import React from 'react';
import { useCart } from '@/store/useCart';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { playPop } from '@/lib/audio';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export default function ProductCard({ id, name, price, image }: ProductCardProps) {
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
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      className="group w-full flex items-center gap-5 bg-white border border-gray-100 rounded-xl shadow-sm p-4 transition-all duration-300 ease-in-out hover:shadow-md hover:border-amber-200"
    >
      {/* Product image / icon */}
      <div className="shrink-0 h-14 w-14 rounded-lg overflow-hidden bg-amber-50 flex items-center justify-center transition-colors group-hover:bg-amber-100 border border-slate-50">
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-1">
            <span className="font-serif text-lg font-bold text-amber-200 uppercase leading-none">{name.charAt(0)}</span>
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 text-left leading-tight">
        <span className="font-sans text-xl font-semibold text-slate-900 tracking-tight group-hover:text-amber-600 transition-colors duration-300">
          {name}
        </span>
      </div>

      {/* Price + chevron */}
      <div className="shrink-0 flex items-center gap-3">
        <span className="font-sans text-xl font-semibold text-slate-900 tabular-nums">
          {formatPrice(price)}
        </span>
        <ChevronRight
          size={16}
          strokeWidth={1.5}
          className="text-slate-200 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-300"
        />
      </div>
    </motion.button>
  );
}
