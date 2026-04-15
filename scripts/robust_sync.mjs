import sqlite3 from 'sqlite3';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Need to use custom fetch with keepalive and timeout handling
const customFetch = async (url, options) => {
  let retries = 3;
  while (retries > 0) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      retries--;
      if (retries === 0) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
};

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch: customFetch }
});

const DB_PATH = path.join(__dirname, '../libreta.db');
const db = new sqlite3.Database(DB_PATH);

async function run() {
  console.log("🚀 [SYNC] Sincronización Robusta Inicializada...");
  try {
    // 1. Wipe EVERYTHING manually
    console.log("🧹 Limpiando base de datos online...");
    const { data: allDebtors } = await supabase.from('debtors').select('id');
    if (allDebtors && allDebtors.length > 0) {
      for (const d of allDebtors) {
         // REST cascade doesn't always perform implicitly if not setup properly, but Supabase SDK handles rows easily
         await supabase.from('debtors').delete().eq('id', d.id);
      }
    }
    console.log("🧹 Limpieza terminada.");
    
    // 2. Fetch SQLite
    const debtors = await new Promise((res, rej) => db.all("SELECT * FROM debtors", (err, r) => err ? rej(err) : res(r)));
    const debts = await new Promise((res, rej) => db.all("SELECT * FROM debts", (err, r) => err ? rej(err) : res(r)));
    
    console.log(`📦 Encontrados ${debtors.length} deudores y ${debts.length} deudas.`);
    
    const debtorLegacyToUuidMap = new Map();
    let dCount = 0;
    
    for (const debtor of debtors) {
      const payload = {
        legacy_id: debtor.id,
        name: debtor.name,
        phone: debtor.phone,
        created_at: debtor.created_at
      };
      
      const { data, error } = await supabase.from('debtors').insert(payload).select().single();
      if (error) {
        console.error(`❌ Error con ${debtor.name}:`, error.message);
      } else {
        debtorLegacyToUuidMap.set(debtor.id, data.id);
        dCount++;
        if (dCount % 20 === 0) console.log(`⏳ Insertados ${dCount}...`);
      }
    }
    console.log(`✅ Deudores listos: ${dCount}`);
    
    let dbCount = 0;
    for (const debt of debts) {
      const supabaseDebtorId = debtorLegacyToUuidMap.get(debt.debtor_id);
      if (!supabaseDebtorId) continue;
      
      const { error } = await supabase.from('debts').insert({
        legacy_id: debt.id,
        debtor_id: supabaseDebtorId,
        description: debt.description,
        amount: debt.amount,
        date: debt.date,
        is_paid: debt.is_paid === 1
      });
      if (!error) {
        dbCount++;
        if (dbCount % 50 === 0) console.log(`⏳ Deudas insertadas ${dbCount}...`);
      }
    }
    console.log(`✅ Deudas listas: ${dbCount}`);
    console.log("✨ MIGRACION EXITOSA!");

  } catch (err) {
    console.error("💥 ERROR FATAL:", err);
  } finally {
    db.close();
  }
}
run();
