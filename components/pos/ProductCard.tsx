'use client';

import React from 'react';
import { useCart } from '@/store/useCart';
import { ShoppingBag, ChevronRight } from 'lucide-react';

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

  return (
    <button
      id={`product-card-${id}`}
      onClick={() => addItem({ id, name, price })}
      className="group w-full flex items-center gap-5 bg-white border border-gray-100 rounded-xl shadow-sm p-5 transition-all duration-300 ease-in-out hover:scale-[1.025] hover:shadow-md hover:border-amber-200 active:scale-[0.99]"
    >
      {/* Product image / icon */}
      <div className="shrink-0 h-16 w-16 rounded-lg overflow-hidden bg-amber-50 flex items-center justify-center transition-colors group-hover:bg-amber-100">
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <ShoppingBag size={24} strokeWidth={1.5} className="text-amber-300 group-hover:text-amber-400 transition-colors" />
        )}
      </div>

      {/* Name */}
      <div className="flex-1 text-left leading-tight">
        <span className="font-sans text-2xl font-semibold text-slate-900 tracking-tight group-hover:text-amber-600 transition-colors duration-300">
          {name}
        </span>
      </div>

      {/* Price + chevron */}
      <div className="shrink-0 flex items-center gap-3">
        <span className="font-sans text-2xl font-semibold text-slate-900 tabular-nums">
          {formatPrice(price)}
        </span>
        <ChevronRight
          size={18}
          strokeWidth={1.5}
          className="text-slate-200 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-300"
        />
      </div>
    </button>
  );
}
