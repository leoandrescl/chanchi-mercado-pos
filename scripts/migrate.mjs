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

async function sync() {
  try {
    console.log("\n🚀 [SYNC] Iniciando sincronización de datos legacy...");

    // 1. Obtener Deudores de SQLite
    const debtors = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM debtors", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`📦 [SYNC] ${(debtors as any[]).length} clientes encontrados en SQLite.`);

    const debtorLegacyToUuidMap = new Map();

    for (const debtor of (debtors as any[])) {
      process.stdout.write(`⏳ [SYNC] Sincronizando Deudor: [${debtor.name}]... `);
      
      const { data, error } = await supabase
        .from('debtors')
        .upsert({
          legacy_id: debtor.id,
          name: debtor.name,
          phone: debtor.phone,
          created_at: debtor.created_at
        }, { onConflict: 'legacy_id' })
        .select()
        .single();

      if (error) {
        console.log(`❌ Error: ${error.message}`);
        continue;
      }
      
      debtorLegacyToUuidMap.set(debtor.id, data.id);
      console.log(`✅ (UUID: ${data.id})`);
    }

    // 2. Obtener Deudas de SQLite
    const debts = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM debts", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`\n📦 [SYNC] ${(debts as any[]).length} registros de deuda encontrados en SQLite.`);

    let successCount = 0;
    for (const debt of (debts as any[])) {
      const supabaseDebtorId = debtorLegacyToUuidMap.get(debt.debtor_id);
      
      if (!supabaseDebtorId) {
        console.warn(`⚠️ [SYNC] Saltando deuda ID ${debt.id}: No se encontró deudor UUID para legacy_id ${debt.debtor_id}`);
        continue;
      }

      const { error } = await supabase
        .from('debts')
        .upsert({
          legacy_id: debt.id,
          debtor_id: supabaseDebtorId,
          description: debt.description,
          amount: debt.amount,
          date: debt.date,
          is_paid: debt.is_paid === 1
        }, { onConflict: 'legacy_id' });

      if (error) {
        console.error(`❌ [SYNC] Error en deuda legacy_id ${debt.id}:`, error.message);
      } else {
        successCount++;
      }
    }

    console.log(`\n✨ [SYNC] Proceso finalizado con éxito.`);
    console.log(`📊 Deudores procesados: ${(debtors as any[]).length}`);
    console.log(`📊 Deudas sincronizadas (Upsert): ${successCount}`);
    
  } catch (err) {
    console.error("\n💥 [SYNC] Error fatal durante la sincronización:", err);
  } finally {
    db.close();
  }
}

sync();
