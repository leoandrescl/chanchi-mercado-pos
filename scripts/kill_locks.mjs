import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres.wucsqfryxvzuqchitjlv:b%40Y%2BR%26Bff6X%26M3h@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Connecting...');
    await client.connect();
    console.log('Connected. Finding locks...');
    const { rows } = await client.query(`
      SELECT pid, state, query 
      FROM pg_stat_activity 
      WHERE state != 'idle' AND pid <> pg_backend_pid();
    `);
    console.log('Active queries:', rows);

    console.log('Terminating them...');
    await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE state != 'idle' AND pid <> pg_backend_pid();
    `);
    console.log('Locks killed.');
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
    process.exit(0);
  }
}
run();
