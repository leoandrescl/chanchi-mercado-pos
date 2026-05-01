/**
 * Lee debtors.balance y reparte ese monto en FIFO sobre filas debts con amount > 0
 * (actualiza remaining_amount e is_paid). No modifica debtors.balance.
 *
 * Uso:
 *   1) En Supabase SQL: UPDATE debtors SET balance = 7100 WHERE id = '<uuid>';
 *   2) node scripts/reconcile_debtor.mjs <uuid>
 *
 * Si aparece: check_balance_positive en "debtors" → un TRIGGER en `debts` está
 * recalculando `debtors.balance` al actualizar cada fila y rompe el CHECK.
 * En ese caso NO uses este script; ejecutá en SQL Editor:
 *   scripts/reconcile_debtor_supabase.sql
 *
 * Requiere .env.local: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (recomendado) o anon.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const debtorId = process.argv[2];

if (!url || !key) {
  console.error('Falta NEXT_PUBLIC_SUPABASE_URL o clave Supabase en .env.local');
  process.exit(1);
}
if (!debtorId) {
  console.error('Uso: node scripts/reconcile_debtor.mjs <debtor_uuid>');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const { data: debtor, error: derr } = await supabase
    .from('debtors')
    .select('id, name, balance')
    .eq('id', debtorId)
    .single();

  if (derr || !debtor) {
    console.error('Deudor no encontrado:', derr?.message);
    process.exit(1);
  }

  let pool = Math.max(0, debtor.balance ?? 0);
  console.log('Deudor:', debtor.name, '| balance en BD (pool):', pool);

  const { data: debts, error: err } = await supabase
    .from('debts')
    .select('id, amount')
    .eq('debtor_id', debtorId)
    .gt('amount', 0)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  if (err) {
    console.error(err.message);
    process.exit(1);
  }

  for (const d of debts || []) {
    if (pool <= 0) {
      const { error: uerr } = await supabase
        .from('debts')
        .update({ remaining_amount: 0, is_paid: true })
        .eq('id', d.id);
      if (uerr) throw uerr;
    } else {
      const r = Math.min(d.amount, pool);
      pool -= r;
      const { error: uerr } = await supabase
        .from('debts')
        .update({ remaining_amount: r, is_paid: r === 0 })
        .eq('id', d.id);
      if (uerr) throw uerr;
    }
  }

  console.log('Listo. Compras (amount>0) tocadas:', (debts || []).length, '| pool restante:', pool);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
