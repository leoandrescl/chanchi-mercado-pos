CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    price INTEGER NOT NULL, -- amount in CLP
    category TEXT,
    image TEXT, -- Base64 or URL
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Explicit access policies for public access (Anon Key)
CREATE POLICY "Enable SELECT for anon" ON products FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anon" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anon" ON products FOR UPDATE USING (true);
CREATE POLICY "Enable DELETE for anon" ON products FOR DELETE USING (true);
