import sqlite3 from 'sqlite3';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../libreta.db');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function sync() {
  const db = new sqlite3.Database(DB_PATH);

  try {
    console.log("🚀 Iniciando Sincronización Total (Supabase Client)...");

    // 1. LIMPIEZA TOTAL (Flush)
    console.log("🧹 Vaciando tablas en Supabase...");
    
    // Eliminamos deudas primero por FKs
    const { error: errDebts } = await supabase.from('debts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errDebts) console.error("⚠️ Error vaciando deudas:", errDebts.message);
    
    // Eliminamos deudores
    const { error: errDebtors } = await supabase.from('debtors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errDebtors) console.error("⚠️ Error vaciando deudores:", errDebtors.message);

    console.log("✅ Supabase preparado para carga limpia.");

    // 2. OBTENER DATOS DE SQLITE
    const debtors = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM debtors", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const debts = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM debts", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`📦 Datos cargados: ${debtors.length} clientes, ${debts.length} transacciones.`);

    // 3. MIGRAR CLIENTES
    const debtorMap = new Map();
    for (const d of debtors) {
      const { data, error } = await supabase
        .from('debtors')
        .insert({
          name: d.name,
          phone: d.phone,
          created_at: d.created_at
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error insertando cliente ${d.name}:`, error.message);
      } else {
        debtorMap.set(d.id, data.id);
      }
    }
    console.log("✅ Clientes sincronizados.");

    // 4. MIGRAR DEUDAS
    let successCount = 0;
    const batchSize = 50;
    for (let i = 0; i < debts.length; i += batchSize) {
      const batch = debts.slice(i, i + batchSize);
      const insertData = batch.map(b => {
        const supabaseDebtorId = debtorMap.get(b.debtor_id);
        if (!supabaseDebtorId) return null;

        const isPaid = b.is_paid === 1;
        return {
          debtor_id: supabaseDebtorId,
          description: b.description,
          amount: b.amount,
          date: b.date,
          is_paid: isPaid,
          remaining_amount: isPaid ? 0 : b.amount
        };
      }).filter(Boolean);

      if (insertData.length > 0) {
        const { error } = await supabase.from('debts').insert(insertData);
        if (error) {
          console.error(`❌ Error insertando lote de deudas ${i}:`, error.message);
        } else {
          successCount += insertData.length;
        }
      }
    }

    console.log(`\n✨ REPORT FINAL ✨`);
    console.log(`📊 Clientes procesados: ${debtors.length} (Mapeados: ${debtorMap.size})`);
    console.log(`📊 Deudas sincronizadas: ${successCount} / ${debts.length}`);

  } catch (err) {
    console.error("💥 Error fatal:", err);
  } finally {
    db.close();
  }
}

sync();
