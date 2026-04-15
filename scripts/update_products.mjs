import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres.wucsqfryxvzuqchitjlv:b%40Y%2BR%26Bff6X%26M3h@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

async function updateSchema() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // 1. Add columns
    console.log('Adding columns to products table...');
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;
    `);
    console.log('Columns added successfully');

    // 2. Initialize sales_count if possible (optional logic)
    // We could count debts here, but let's keep it simple as requested.
    
    console.log('Schema updated successfully');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    await client.end();
  }
}

updateSchema();
