import type { Product } from '@/store/useInventory';
import {
  CHEESE_PRODUCT_NAME,
  productsExcludingCheese,
  resolveCheeseProduct,
} from '@/lib/constants/cheeseProduct';

/** Lista de inventario: Queso arriba (desde BD) + resto filtrado por búsqueda. */
export function mergeCheeseIntoInventoryList(
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

  const showCheese =
    !q ||
    cheeseName.includes(q) ||
    CHEESE_PRODUCT_NAME.toLowerCase().includes(q) ||
    (cheese.category?.toLowerCase().includes(q) ?? false);

  return showCheese ? [cheese, ...filtered] : filtered;
}
