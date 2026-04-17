import sqlite3 from 'sqlite3';
import pkg from 'pg';
const { Client } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../libreta.db');

// Direct Supabase Connection (ASCII Safe)
const PG_CONNECTION_STRING = 'postgresql://postgres.wucsqfryxvzuqchitjlv:b%40Y%2BR%26Bff6X%26M3h@db.wucsqfryxvzuqchitjlv.supabase.co:5432/postgres';

async function fullSync() {
  const db = new sqlite3.Database(DB_PATH);
  const pgClient = new Client({
    connectionString: PG_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("🚀 Iniciando Migración Relámpago (Flush & Sync)...");
    await pgClient.connect();
    console.log("✅ Conectado a Supabase (Postgres).");

    // 1. LIMPIEZA TOTAL
    console.log("🧹 Vaciando tablas en Supabase...");
    await pgClient.query('TRUNCATE TABLE debts, debtors RESTART IDENTITY CASCADE;');
    console.log("✅ Tablas vaciadas (Clean Slate).");

    // 2. MIGRAR DEUDORES (CUSTOMERS)
    console.log("📦 Leyendo deudores de SQLite...");
    const debtors = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM debtors", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const debtorMap = new Map(); // Old ID -> New UUID

    console.log(`👤 Sincronizando ${debtors.length} clientes...`);
    for (const d of debtors) {
      const res = await pgClient.query(
        'INSERT INTO debtors (name, phone, created_at) VALUES ($1, $2, $3) RETURNING id',
        [d.name, d.phone, d.created_at]
      );
      debtorMap.set(d.id, res.rows[0].id);
    }
    console.log("✅ Clientes migrados.");

    // 3. MIGRAR DEUDAS
    console.log("📦 Leyendo deudas de SQLite...");
    const debts = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM debts", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`💸 Sincronizando ${debts.length} transacciones...`);
    let successCount = 0;
    for (const b of debts) {
      const supabaseDebtorId = debtorMap.get(b.debtor_id);
      if (!supabaseDebtorId) {
        console.warn(`⚠️ Saltando deuda ID ${b.id}: Deudor original ${b.debtor_id} no encontrado.`);
        continue;
      }

      // Lógica de remaining_amount para sistema FIFO
      const isPaid = b.is_paid === 1;
      const remainingAmount = isPaid ? 0 : b.amount;

      await pgClient.query(
        'INSERT INTO debts (debtor_id, description, amount, date, is_paid, remaining_amount) VALUES ($1, $2, $3, $4, $5, $6)',
        [supabaseDebtorId, b.description, b.amount, b.date, isPaid, remainingAmount]
      );
      successCount++;
    }

    console.log(`\n✨ MIGRACIÓN COMPLETADA EXITOSAMENTE ✨`);
    console.log(`📊 Clientes: ${debtors.length}`);
    console.log(`📊 Deudas: ${successCount}`);

  } catch (err) {
    console.error("💥 ERROR FATAL DURANTE LA MIGRACIÓN:", err);
  } finally {
    db.close();
    await pgClient.end();
  }
}

fullSync();
