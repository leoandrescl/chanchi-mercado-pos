/**
 * Live Supabase read-only check — run: npx tsx scripts/verify-whatsapp-live.ts
 */
import 'dotenv/config';
import { config } from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  getActiveMonthKeys,
  isDateInActiveMonths,
  selectActiveDebtsForBalance,
} from '../lib/debt/selectActiveDebtsForBalance';
import { generateSummaryMessage } from '../lib/whatsapp';

config({ path: path.join(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Faltan variables Supabase en .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function checkCustomer(namePart: string) {
  const { data: debtor, error } = await supabase
    .from('debtors')
    .select('id, name, balance, phone')
    .ilike('name', `%${namePart}%`)
    .limit(1)
    .single();

  if (error || !debtor) {
    console.log(`No encontrado: ${namePart}`, error?.message);
    return;
  }

  const { data: debts } = await supabase
    .from('debts')
    .select('*')
    .eq('debtor_id', debtor.id)
    .eq('is_paid', false)
    .gt('amount', 0)
    .order('date', { ascending: true });

  const allPending = (debts || []).map((d) => ({
    date: d.date,
    description: d.description,
    originalAmount: d.amount,
    remainingAmount: d.remaining_amount ?? d.amount,
    isPartial: (d.remaining_amount ?? d.amount) < d.amount,
    createdAt: d.created_at,
  }));

  const balance = debtor.balance || 0;
  const active = selectActiveDebtsForBalance(allPending, balance).map((d) => ({
    ...d,
    isPartial: d.isPartial || d.remainingAmount < d.originalAmount,
  }));
  const sumAll = allPending.reduce((s, d) => s + d.remainingAmount, 0);
  const sumActive = active.reduce((s, d) => s + d.remainingAmount, 0);
  const months = [...getActiveMonthKeys(active.map((d) => d.date))];

  const link = generateSummaryMessage({
    customerName: debtor.name,
    phone: debtor.phone || '56900000000',
    pendingDebts: active,
    totalBalance: balance,
  });
  const msg = decodeURIComponent(link.split('text=')[1] ?? '');

  console.log(`\n=== ${debtor.name} ===`);
  console.log(`Total Fiado (BD): $${balance.toLocaleString('es-CL')}`);
  console.log(`Filas impagas en BD: ${allPending.length} (suman $${sumAll.toLocaleString('es-CL')})`);
  console.log(`Filas en mensaje: ${active.length} (suman $${sumActive.toLocaleString('es-CL')})`);
  console.log(`Meses en mensaje: ${months.join(' | ') || '(ninguno)'}`);
  console.log(`TOTAL PENDIENTE WA: ${msg.match(/\*TOTAL PENDIENTE: ([^*]+)\*/)?.[1]}`);
  console.log('--- Vista previa (primeras líneas) ---');
  console.log(msg.split('\n').slice(0, 18).join('\n'));
}

async function main() {
  const { data: debtors } = await supabase.from('debtors').select('balance');
  const globalTotal = (debtors || []).reduce((s, d) => s + (d.balance || 0), 0);
  console.log('Total Fiado Acumulado (live):', globalTotal.toLocaleString('es-CL'));

  await checkCustomer('Albéniz');
  await checkCustomer('Gina');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
