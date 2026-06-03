-- Queso: producto de precio libre en POS (una sola fila, id fijo).
-- Ejecutar en Supabase si ensureCheeseProduct desde la app no creó la fila.

INSERT INTO products (id, name, price, category, is_visible, order_index)
VALUES (
  'c9e4b8a2-7f3d-4e2a-9b1c-6d5e8f0a1b2c'::uuid,
  'Queso',
  0,
  'Queso',
  true,
  0
)
ON CONFLICT (id) DO NOTHING;
