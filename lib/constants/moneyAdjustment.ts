import type { Product } from '@/store/useInventory';

/** Id fijo en UI (no existe en `products` de Supabase). */
export const MONEY_ADJUSTMENT_PRODUCT_ID = '__ajuste_dinero__';

export const MONEY_ADJUSTMENT_PRODUCT_NAME = 'Ajuste de dinero';

export function isMoneyAdjustmentProductId(id: string): boolean {
  return id === MONEY_ADJUSTMENT_PRODUCT_ID;
}

/** Producto virtual que se muestra como uno más en el catálogo. */
export const MONEY_ADJUSTMENT_VIRTUAL_PRODUCT: Product = {
  id: MONEY_ADJUSTMENT_PRODUCT_ID,
  name: MONEY_ADJUSTMENT_PRODUCT_NAME,
  price: 0,
  is_visible: true,
  category: 'Ajuste',
};

/**
 * Inserta el ajuste al inicio si no hay búsqueda o si coincide con el nombre del ajuste.
 */
export function mergeMoneyAdjustmentIntoCatalog(
  products: Product[],
  searchTerm: string
): Product[] {
  const q = searchTerm.toLowerCase().trim();
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.category?.toLowerCase().includes(q) ?? false)
  );
  const showAdjustment =
    !q || MONEY_ADJUSTMENT_PRODUCT_NAME.toLowerCase().includes(q);
  return showAdjustment ? [MONEY_ADJUSTMENT_VIRTUAL_PRODUCT, ...filtered] : filtered;
}
