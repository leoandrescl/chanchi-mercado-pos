'use client';

import React, { useState, useEffect } from 'react';
import { useInventory, Product } from '@/store/useInventory';
import { Package, LayoutGrid, List as ListIcon, GripVertical } from 'lucide-react';
import ProductModal from '@/components/products/ProductModal';
import ConfirmDeleteModal from '@/components/products/ConfirmDeleteModal';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import HeaderPage from '@/components/ui/HeaderPage';
import InputSearch from '@/components/ui/InputSearch';
import ProductCard from '@/components/pos/ProductCard';

// DND Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  product: Product;
  viewMode: 'grid' | 'list';
  onEdit: () => void;
  onDelete: () => void;
}

const SortableProductItem = ({ product, viewMode, onEdit, onDelete }: SortableItemProps) => {
  const isList = viewMode === 'list';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: product.id,
    disabled: !isList // Disable DND completely in grid mode
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-stretch gap-2 w-full ${isDragging ? 'z-50' : ''}`}
    >
      {/* ─── EL ESPINAZO (Grip Strip) ─── */}
      {isList && (
        <div
          {...attributes}
          {...listeners}
          className={`
            w-10 rounded-2xl flex items-center justify-center transition-all shrink-0 cursor-grab active:cursor-grabbing touch-none
            ${isDragging
              ? 'bg-amber-400 text-white shadow-lg shadow-amber-200'
              : 'bg-slate-50 border border-slate-100 text-slate-300 hover:bg-amber-50 hover:border-amber-100 hover:text-amber-400'}
          `}
          title="Arrastre para reordenar"
        >
          <GripVertical size={20} />
        </div>
      )}

      {/* ─── PRODUCT CONTENT ─── */}
      <div className="flex-1 min-w-0">
        <ProductCard
          id={product.id}
          name={product.name}
          price={product.price}
          image={product.image}
          category={product.category}
          isVisible={product.is_visible}
          viewMode={viewMode}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};

export default function InventoryPage() {
  const { products, fetchProducts, removeProduct, isFetching, updateProductsOrder } = useInventory();
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Responsive but prevents accidental shakes
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 5, // Better feel: start moving after 5px of finger movement
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const sortedAndFilteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex((p) => p.id === active.id);
      const newIndex = products.findIndex((p) => p.id === over.id);

      const newOrder = arrayMove(products, oldIndex, newIndex);

      try {
        await updateProductsOrder(newOrder);
        toast.success("Orden actualizado correctamente");
      } catch (err) {
        toast.error("Error al guardar el nuevo orden");
      }
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await removeProduct(productToDelete.id);
      toast.success("Producto eliminado del catálogo 🗑️");
      setProductToDelete(null);
    } catch (err) {
      toast.error("Error al eliminar el producto");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-50">
        <div className="mx-auto w-full max-w-5xl px-6 py-3">
          <HeaderPage
            title="Gestión de Inventario"
            backHref="/acceso-total-chanchi"
            primaryAction={{
              label: "Agregar Nuevo",
              onClick: () => setIsAdding(true)
            }}
          />

          <div className="mt-2 flex items-center gap-4">
            <div className="flex-1">
              <InputSearch
                placeholder="Buscar en el catálogo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Vista Lista"
              >
                <ListIcon size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Vista Grilla"
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-4 pb-32">
        {/* Instruction Banner for Mom */}
        <div className="mb-6 bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-500 shadow-sm">
            <GripVertical size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Tip de Organización</h4>
            <p className="text-sm text-slate-700 font-medium leading-tight">
              Viejita: Para ordenar, arrastre desde la <strong>franja gris de la izquierda</strong> de cada producto hacia arriba o abajo donde quiera posicionarlo.
            </p>
          </div>
        </div>

        {isFetching && products.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="h-8 w-8 border-2 border-slate-100 border-t-amber-400 rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accediendo a bodega...</p>
          </div>
        ) : sortedAndFilteredProducts.length === 0 ? (
          <div className="py-24 text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-200 mx-auto mb-6">
              <Package size={32} strokeWidth={1.5} />
            </div>
            <p className="font-serif italic text-slate-300 text-lg">No encontramos productos...</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedAndFilteredProducts.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <motion.div
                layout
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                className={viewMode === 'grid'
                  ? "grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6"
                  : "flex flex-col gap-3"
                }
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {sortedAndFilteredProducts.map((p) => (
                    <SortableProductItem
                      key={p.id}
                      product={p}
                      viewMode={viewMode}
                      onEdit={() => setEditingProduct(p)}
                      onDelete={() => setProductToDelete(p)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isAdding && (
          <ProductModal
            onClose={() => setIsAdding(false)}
            onRefresh={fetchProducts}
          />
        )}

        {editingProduct && (
          <ProductModal
            product={editingProduct}
            onClose={() => setEditingProduct(null)}
            onRefresh={fetchProducts}
          />
        )}

        {productToDelete && (
          <ConfirmDeleteModal
            productName={productToDelete.name}
            onCancel={() => setProductToDelete(null)}
            onConfirm={handleDelete}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
