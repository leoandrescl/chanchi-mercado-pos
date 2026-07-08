import { config } from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: path.join(process.cwd(), '.env.local') });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const { data: debtor, error } = await sb
    .from('debtors')
    .select('id, name, balance, phone')
    .ilike('name', '%Lorena%urra%')
    .limit(1)
    .single();

  if (error || !debtor) {
    console.error(error);
    return;
  }

  const { data: debts } = await sb
    .from('debts')
    .select('id, description, amount, remaining_amount, is_paid, date, created_at')
    .eq('debtor_id', debtor.id)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  const rows = debts || [];
  const unpaidPos = rows.filter((d) => d.amount > 0 && !d.is_paid);
  const sumRemaining = unpaidPos.reduce(
    (s, d) => s + (d.remaining_amount ?? d.amount),
    0
  );
  const abonos = rows.filter((d) => d.amount < 0);

  console.log('UUID:', debtor.id);
  console.log('Nombre:', debtor.name);
  console.log('debtors.balance (UI):', debtor.balance);
  console.log('Suma remaining compras impagas:', sumRemaining);
  console.log('Diferencia balance vs suma:', debtor.balance - sumRemaining);
  console.log('\n--- Abonos (amount < 0) ---');
  for (const a of abonos.slice(-5)) {
    console.log(a.date, a.amount, a.description?.slice(0, 60), 'is_paid:', a.is_paid, 'rem:', a.remaining_amount);
  }
  console.log('\n--- Compras impagas ---');
  for (const d of unpaidPos) {
    console.log(d.id, d.date?.slice(0, 10), d.amount, d.remaining_amount, d.description?.slice(0, 50));
  }

  console.log('\n--- Compras junio 2026 (todas) ---');
  for (const d of rows.filter((x) => x.date?.startsWith('2026-06') && x.amount > 0)) {
    console.log(d.id, d.amount, d.remaining_amount, d.is_paid, d.description?.slice(0, 50));
  }

  console.log('\n--- Noviembre 2025 varios ---');
  for (const d of rows.filter((x) => x.description?.toLowerCase().includes('varios mes'))) {
    console.log(d.id, d.date?.slice(0, 10), d.amount, d.remaining_amount, d.is_paid);
  }
  console.log('\n--- Últimos 10 movimientos ---');
  for (const d of rows.slice(-10)) {
    console.log(
      d.date?.slice(0, 10),
      d.amount,
      'rem:',
      d.remaining_amount,
      'paid:',
      d.is_paid,
      d.description?.slice(0, 40)
    );
  }

  const { data: logs } = await sb
    .from('audit_logs')
    .select('created_at, details')
    .eq('entity_id', debtor.id)
    .eq('action_type', 'ABONO')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\n--- Últimos abonos (audit_logs) ---');
  for (const l of logs || []) {
    const d = l.details as Record<string, unknown>;
    console.log(l.created_at, 'monto:', d?.amount, 'prev:', d?.prevBalance ?? d?.previousBalance, 'new:', d?.newBalance);
  }
}

main();
