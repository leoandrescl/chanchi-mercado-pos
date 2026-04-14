import sqlite3 from 'sqlite3';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../libreta.db');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: Faltan variables de entorno en .env.local (URL o Key)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌ ERROR: No se pudo conectar a SQLite:", err.message);
    process.exit(1);
  }
  console.log("✅ Conectado a la base de datos legacy (libreta.db)");
});

async function migrate() {
  try {
    console.log("\n🚀 [MIGRACIÓN] Iniciando proceso de importación...");

    // 1. Obtener Deudores
    const debtors = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM debtors", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`📦 [MIGRACIÓN] ${(debtors).length} clientes encontrados.`);

    const debtorIdMap = new Map();

    for (const debtor of (debtors)) {
      process.stdout.write(`⏳ [MIGRACIÓN] Procesando: [${debtor.name}]... `);
      
      const { data, error } = await supabase
        .from('debtors')
        .insert({
          name: debtor.name,
          phone: debtor.phone,
          created_at: debtor.created_at
        })
        .select()
        .single();

      if (error) {
        console.log(`❌ (Error: ${error.message})`);
        continue;
      }
      
      debtorIdMap.set(debtor.id, data.id);
      console.log(`✅ (ID: ${data.id})`);
    }

    // 2. Obtener Deudas
    const debts = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM debts", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`\n📦 [MIGRACIÓN] ${(debts).length} registros de deuda encontrados.`);

    let successCount = 0;
    for (const debt of (debts)) {
      const newDebtorId = debtorIdMap.get(debt.debtor_id);
      if (!newDebtorId) {
        continue;
      }

      const { error } = await supabase
        .from('debts')
        .insert({
          debtor_id: newDebtorId,
          description: debt.description,
          amount: debt.amount,
          date: debt.date,
          is_paid: debt.is_paid === 1
        });

      if (error) {
        console.error(`❌ [MIGRACIÓN] Error en deuda ID ${debt.id}:`, error.message);
      } else {
        successCount++;
      }
    }

    console.log(`\n✨ [MIGRACIÓN] Proceso finalizado.`);
    console.log(`📊 Clientes migrados: ${debtorIdMap.size}`);
    console.log(`📊 Deudas migradas: ${successCount}`);
    
  } catch (err) {
    console.error("\n💥 [MIGRACIÓN] Error fatal:", err);
  } finally {
    db.close();
  }
}

migrate();
