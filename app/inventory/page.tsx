'use client';

import React, { useState, useEffect } from 'react';
import { useInventory, Product } from '@/store/useInventory';
import { 
  Package, 
  Plus, 
  Pencil, 
  Trash2, 
  ArrowLeft, 
  Search,
  Filter,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import ProductModal from '@/components/inventory/ProductModal';
import ConfirmDeleteModal from '@/components/inventory/ConfirmDeleteModal';

export default function InventoryPage() {
  const { products, fetchProducts, addProduct, updateProduct, removeProduct, isFetching } = useInventory();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setSelectedProduct(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Omit<Product, 'id' | 'created_at'>) => {
    if (selectedProduct) {
      await updateProduct(selectedProduct.id, data);
    } else {
      await addProduct(data);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await removeProduct(productToDelete.id);
      setProductToDelete(null);
    } catch (err) {
      alert('Error al eliminar producto');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header Sticky */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-6 shadow-sm">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all active:scale-95"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-serif text-2xl text-slate-900 italic">Gestión de Inventario</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Catálogo de productos</p>
            </div>
          </div>
          
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-full bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
          >
            <Plus size={18} />
            <span>Agregar Producto</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Search & Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={18} />
            </div>
            <input 
              type="text"
              placeholder="Buscar por nombre o categoría..."
              className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-5 py-2 pl-12 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-3 px-2">
             <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Items</p>
                <p className="font-serif text-xl italic text-slate-900">{products.length} productos</p>
             </div>
             <div className="h-10 w-[1px] bg-slate-200 mx-2" />
             <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                <Package size={20} />
             </div>
          </div>
        </div>

        {/* Product List */}
        <div className="space-y-4">
          {isFetching ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="h-10 w-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
              <p className="text-slate-400 font-serif italic">Cargando catálogo...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
              <div className="h-16 w-16 mx-auto rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                <Search size={32} />
              </div>
              <p className="font-serif text-lg text-slate-400 italic">No se encontraron productos</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div 
                key={product.id}
                className="group relative overflow-hidden bg-white border border-slate-100 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                      <Package size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-serif text-slate-900 italic leading-none">{product.name}</h3>
                        {product.category && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                            {product.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <DollarSign size={14} className="text-emerald-500" />
                        <span className="font-sans font-semibold text-lg text-emerald-600 tracking-tight">
                          {formatPrice(product.price).replace('$', '').trim()}
                          <span className="ml-1 text-xs opacity-50">$</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenEdit(product)}
                      className="h-11 w-11 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-500 transition-all active:scale-95"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => setProductToDelete(product)}
                      className="h-11 w-11 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="h-11 w-11 flex items-center justify-center rounded-xl text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modals */}
      {isModalOpen && (
        <ProductModal 
          product={selectedProduct}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {productToDelete && (
        <ConfirmDeleteModal 
          productName={productToDelete.name}
          onConfirm={handleDelete}
          onCancel={() => setProductToDelete(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
