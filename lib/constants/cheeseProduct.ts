import type { Product } from '@/store/useInventory';

/** Id fijo en UI (no existe en `products` de Supabase). */
export const CHEESE_PRODUCT_ID = '__queso__';

export const CHEESE_PRODUCT_NAME = 'Queso';

export function isCheeseProductId(id: string): boolean {
  return id === CHEESE_PRODUCT_ID || id.startsWith(`${CHEESE_PRODUCT_ID}_`);
}

export function isCheeseCatalogProductId(id: string): boolean {
  return id === CHEESE_PRODUCT_ID;
}

export const CHEESE_VIRTUAL_PRODUCT: Product = {
  id: CHEESE_PRODUCT_ID,
  name: CHEESE_PRODUCT_NAME,
  price: 0,
  is_visible: true,
  category: 'Queso',
};
