import pkg from 'pg';
const { Client } = pkg;

async function migrate() {
  const client = new Client({
    // Using direct host (5432) instead of pooler (6543)
    connectionString: 'postgresql://postgres.wucsqfryxvzuqchitjlv:b%40Y%2BR%26Bff6X%26M3h@db.wucsqfryxvzuqchitjlv.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database (DIRECT). Starting migration...");

    await client.query(`
      ALTER TABLE debts 
      ADD COLUMN IF NOT EXISTS remaining_amount INTEGER;
    `);
    console.log("Column 'remaining_amount' handled.");

    await client.query(`
      UPDATE debts 
      SET remaining_amount = amount 
      WHERE remaining_amount IS NULL;
    `);
    console.log("Existing records updated.");

  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
