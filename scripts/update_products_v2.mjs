import pkg from 'pg';
const { Client } = pkg;

// Trying standard port 5432 and no pgbouncer flag
const connectionString = 'postgresql://postgres.wucsqfryxvzuqchitjlv:b%40Y%2BR%26Bff6X%26M3h@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

async function updateSchema() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log('Connected to database (Standard Port)');

    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
      
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

      CREATE INDEX IF NOT EXISTS idx_products_is_favorite ON products(is_favorite DESC);
      CREATE INDEX IF NOT EXISTS idx_products_sales_count ON products(sales_count DESC);
    `);
    console.log('Schema updated successfully');
  } catch (err) {
    console.error('Error updating schema:', err.message);
  } finally {
    await client.end();
  }
}

updateSchema();
