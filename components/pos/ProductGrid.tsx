'use client';

import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface ProductGridProps {
  products: any[];
  viewMode: 'grid' | 'list';
  isAdmin?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function ProductGrid({ products, viewMode, isAdmin, onEdit, onDelete }: ProductGridProps) {
  const [flyingItems, setFlyingItems] = useState<any[]>([]);

  useEffect(() => {
    const handleProductAdded = (e: any) => {
      const { id, image, rect } = e.detail;
      const flyingId = Math.random().toString(36).substring(7);
      
      // We aim for the cart icon position (center bottom)
      const targetX = window.innerWidth / 2 - 25; // Centered
      const targetY = window.innerHeight - 80;

      setFlyingItems(prev => [...prev, {
        id: flyingId,
        image,
        startX: rect.left,
        startY: rect.top,
        targetX,
        targetY,
        width: rect.width,
        height: rect.height
      }]);

      // Remove after animation
      setTimeout(() => {
        setFlyingItems(prev => prev.filter(item => item.id !== flyingId));
      }, 800);
    };

    window.addEventListener('product-added', handleProductAdded);
    return () => window.removeEventListener('product-added', handleProductAdded);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {viewMode === 'list' ? (
          <motion.div
            key="catalog-list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col gap-3"
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.image}
                isVisible={product.is_visible}
                viewMode="list"
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="catalog-grid"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6"
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.image}
                isVisible={product.is_visible}
                viewMode="grid"
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portal for flying items */}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 pointer-events-none z-[9999]">
          <AnimatePresence>
            {flyingItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ 
                  x: item.startX, 
                  y: item.startY, 
                  scale: 1, 
                  opacity: 1,
                  borderRadius: '2rem'
                }}
                animate={{ 
                  x: item.targetX, 
                  y: item.targetY, 
                  scale: 0.1, 
                  opacity: 0.5,
                  borderRadius: '50%'
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="fixed bg-white border border-amber-200 overflow-hidden shadow-2xl"
                style={{ width: item.width, height: item.height }}
              >
                {item.image && (
                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </>
  );
}
