-- Add columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_is_favorite ON products(is_favorite DESC);
CREATE INDEX IF NOT EXISTS idx_products_sales_count ON products(sales_count DESC);
