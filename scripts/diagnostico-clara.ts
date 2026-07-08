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
    .ilike('name', '%clara%')
    .limit(5);

  if (error) {
    console.error(error);
    return;
  }

  console.log('Deudores encontrados:', debtor?.length);
  for (const d of debtor || []) {
    console.log('\n===', d.name, '===');
    console.log('UUID:', d.id);
    console.log('balance UI:', d.balance);

    const { data: debts } = await sb
      .from('debts')
      .select('id, date, description, amount, remaining_amount, is_paid, created_at')
      .eq('debtor_id', d.id)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

    const unpaid = (debts || []).filter((x) => x.amount > 0 && !x.is_paid);
    const sumRemaining = unpaid.reduce(
      (s, x) => s + (x.remaining_amount ?? x.amount),
      0
    );
    console.log('Suma remaining impagas:', sumRemaining);
    console.log('Diferencia balance vs suma:', (d.balance || 0) - sumRemaining);

    console.log('\nCompras impagas:');
    for (const u of unpaid) {
      console.log(
        u.date?.slice(0, 10),
        u.amount,
        'rem:',
        u.remaining_amount,
        u.description?.slice(0, 50)
      );
    }

    console.log('\nÚltimos abonos:');
    for (const a of (debts || []).filter((x) => x.amount < 0).slice(-5)) {
      console.log(a.date?.slice(0, 10), a.amount, a.description?.slice(0, 50));
    }

    console.log('\nÚltimos 8 movimientos:');
    for (const m of (debts || []).slice(-8)) {
      console.log(
        m.date?.slice(0, 10),
        m.amount,
        'rem:',
        m.remaining_amount,
        'paid:',
        m.is_paid,
        m.description?.slice(0, 40)
      );
    }
  }
}

main();
