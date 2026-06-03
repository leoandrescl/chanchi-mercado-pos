import type { Product } from '@/store/useInventory';

/**
 * UUID fijo en Supabase (`products`). Ejecutar scripts/seed_queso_product.sql una vez si no existe la fila.
 */
export const CHEESE_PRODUCT_ID = 'c9e4b8a2-7f3d-4e2a-9b1c-6d5e8f0a1b2c';

export const CHEESE_PRODUCT_NAME = 'Queso';

export const CHEESE_DEFAULT_CATEGORY = 'Queso';

/** Compatibilidad con líneas de carrito creadas antes del UUID fijo. */
const LEGACY_CHEESE_PREFIX = '__queso__';

export function isCheeseProductId(id: string): boolean {
  return (
    id === CHEESE_PRODUCT_ID ||
    id.startsWith(`${CHEESE_PRODUCT_ID}_`) ||
    id === LEGACY_CHEESE_PREFIX ||
    id.startsWith(`${LEGACY_CHEESE_PREFIX}_`)
  );
}

export function isCheeseCatalogProductId(id: string): boolean {
  return id === CHEESE_PRODUCT_ID;
}

export function findCheeseProduct(products: Product[]): Product | undefined {
  return products.find((p) => p.id === CHEESE_PRODUCT_ID);
}

/** Producto para catálogo POS / inventario (BD o valores por defecto). */
export function resolveCheeseProduct(products: Product[]): Product {
  const fromDb = findCheeseProduct(products);
  if (fromDb) {
    return {
      ...fromDb,
      price: 0,
      is_visible: fromDb.is_visible ?? true,
      category: fromDb.category ?? CHEESE_DEFAULT_CATEGORY,
    };
  }
  return {
    id: CHEESE_PRODUCT_ID,
    name: CHEESE_PRODUCT_NAME,
    price: 0,
    is_visible: true,
    category: CHEESE_DEFAULT_CATEGORY,
  };
}

export function productsExcludingCheese(products: Product[]): Product[] {
  return products.filter((p) => p.id !== CHEESE_PRODUCT_ID);
}
