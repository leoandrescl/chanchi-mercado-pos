-- Add legacy_id to debtors
ALTER TABLE debtors ADD COLUMN IF NOT EXISTS legacy_id INTEGER UNIQUE;

-- Add legacy_id to debts
ALTER TABLE debts ADD COLUMN IF NOT EXISTS legacy_id INTEGER UNIQUE;

-- We don't need a specific sync for logs yet as we'll mostly use logs for historical audit
-- But we can add it to activity_logs too if needed in the future.
