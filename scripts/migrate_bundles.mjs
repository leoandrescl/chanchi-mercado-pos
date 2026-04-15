import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres.wucsqfryxvzuqchitjlv:b%40Y%2BR%26Bff6X%26M3h@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await client.connect();
    
    console.log('Adding is_bundle column to products...');
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT false;
    `);

    console.log('Creating product_bundles table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_bundles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bundle_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        component_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

migrate();
