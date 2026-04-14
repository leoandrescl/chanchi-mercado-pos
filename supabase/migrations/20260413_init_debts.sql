-- Create Debtors table
CREATE TABLE IF NOT EXISTS debtors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Debts table
CREATE TABLE IF NOT EXISTS debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debtor_id UUID NOT NULL REFERENCES debtors(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL, -- amount in CLP
    date TIMESTAMPTZ DEFAULT NOW(),
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_debts_debtor_id ON debts(debtor_id);
CREATE INDEX IF NOT EXISTS idx_debts_is_paid ON debts(is_paid);
CREATE INDEX IF NOT EXISTS idx_debts_date ON debts(date);

-- Enable RLS (Row Level Security) - Basic Setup
-- Since we use a PIN for the entire app, we'll keep RLS open for authenticated-like access or just disable it for simplicity if the user owns the instance.
-- For now, let's enable it and allow all access (can be refined later).
ALTER TABLE debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for now" ON debtors FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON debts FOR ALL USING (true);
