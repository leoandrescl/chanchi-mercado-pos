-- Add is_favorite column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Add an index for performance since we'll be sorting by this column
CREATE INDEX IF NOT EXISTS idx_products_is_favorite ON products(is_favorite DESC);
