'use client';

import React, { useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import AdminNavbar from '@/components/navigation/AdminNavbar';
import ProductModal from '@/components/products/ProductModal';
import { useInventory } from '@/store/useInventory';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const { fetchProducts } = useInventory();

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        <AdminNavbar onAddProduct={() => setIsProductModalOpen(true)} />
        <main className="flex-1">
          {children}
        </main>
        
        {isProductModalOpen && (
          <ProductModal 
            onClose={() => setIsProductModalOpen(false)} 
            onRefresh={fetchProducts} 
          />
        )}
      </div>
    </AuthGuard>
  );
}
