import type { Product } from '@/store/useInventory';
import {
  CHEESE_PRODUCT_NAME,
  productsExcludingCheese,
  resolveCheeseProduct,
} from '@/lib/constants/cheeseProduct';
import {
  MONEY_ADJUSTMENT_PRODUCT_NAME,
  MONEY_ADJUSTMENT_VIRTUAL_PRODUCT,
} from '@/lib/constants/moneyAdjustment';

/**
 * Catálogo POS admin: productos virtuales + filtro por búsqueda.
 * No usar en catálogo público.
 */
export function mergePosVirtualProductsIntoCatalog(
  products: Product[],
  searchTerm: string
): Product[] {
  const q = searchTerm.toLowerCase().trim();
  const cheese = resolveCheeseProduct(products);
  const cheeseName = cheese.name.toLowerCase();

  const filtered = productsExcludingCheese(products).filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.category?.toLowerCase().includes(q) ?? false)
  );

  const prefix: Product[] = [];
  if (!q || MONEY_ADJUSTMENT_PRODUCT_NAME.toLowerCase().includes(q)) {
    prefix.push(MONEY_ADJUSTMENT_VIRTUAL_PRODUCT);
  }
  if (!q || cheeseName.includes(q) || CHEESE_PRODUCT_NAME.toLowerCase().includes(q)) {
    prefix.push(cheese);
  }

  return [...prefix, ...filtered];
}
