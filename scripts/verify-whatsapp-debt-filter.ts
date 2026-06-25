/**
 * Local verification — run: npx tsx scripts/verify-whatsapp-debt-filter.ts
 * Uses backup JSON only; does not write to Supabase.
 */
import fs from 'fs';
import path from 'path';
import {
  getActiveMonthKeys,
  selectActiveDebtsForBalance,
} from '../lib/debt/selectActiveDebtsForBalance';
import { generateFullAuditMessage, generateSummaryMessage } from '../lib/whatsapp';

type BackupDebt = {
  description: string;
  amount: number;
  remaining_amount?: number;
  is_paid: boolean;
  date: string;
  created_at?: string;
};

type BackupCustomer = {
  id: string;
  name: string;
  phone: string;
  balance: number;
  debts: BackupDebt[];
};

const backupPath = path.join(process.cwd(), 'chanchi-respaldo-2026-06-25.json');
const raw = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
const customers: BackupCustomer[] = raw.customers ?? [];

const totalBalance = customers.reduce((s, c) => s + (c.balance || 0), 0);
console.log('=== Totales respaldo (no deben cambiar con el código) ===');
console.log('Total Fiado Acumulado:', totalBalance.toLocaleString('es-CL'));

const albeniz = customers.find((c) => c.name.toLowerCase().includes('albéniz'));
console.log('Albéniz balance:', albeniz?.balance?.toLocaleString('es-CL') ?? 'N/A');

console.log('\n=== Clientes con suma impaga > balance (caso LIFO) ===');
let shown = 0;
for (const c of customers) {
  if (c.balance <= 0) continue;
  const allUnpaid = (c.debts || [])
    .filter((d) => !d.is_paid && d.amount > 0)
    .map((d) => ({
      date: d.date,
      description: d.description,
      originalAmount: d.amount,
      remainingAmount: d.remaining_amount ?? d.amount,
      isPartial: (d.remaining_amount ?? d.amount) < d.amount,
      createdAt: d.created_at,
    }));

  if (allUnpaid.length === 0) continue;

  const sumAll = allUnpaid.reduce((s, d) => s + d.remainingAmount, 0);
  if (sumAll <= c.balance) continue;

  const active = selectActiveDebtsForBalance(allUnpaid, c.balance);
  const activeSum = active.reduce((s, d) => s + d.remainingAmount, 0);
  const months = [...getActiveMonthKeys(active.map((d) => d.date))];

  console.log(`\n${c.name}`);
  console.log(`  balance UI: ${c.balance.toLocaleString('es-CL')}`);
  console.log(`  filas impagas en BD: ${allUnpaid.length} (suman ${sumAll.toLocaleString('es-CL')})`);
  console.log(`  filas en mensaje: ${active.length} (suman ${activeSum.toLocaleString('es-CL')})`);
  console.log(`  meses: ${months.join(', ')}`);

  const summaryLink = generateSummaryMessage({
    customerName: c.name,
    phone: c.phone || '56900000000',
    pendingDebts: active,
    payments: [],
    totalBalance: c.balance,
  });
  const decoded = decodeURIComponent(summaryLink.split('text=')[1] ?? '');
  const totalLine = decoded.match(/\*TOTAL PENDIENTE: ([^*]+)\*/)?.[1];
  console.log(`  TOTAL PENDIENTE en WA: ${totalLine}`);

  if (++shown >= 5) break;
}

console.log('\n=== Albéniz (debe mantener $13.800 en pie) ===');
if (albeniz) {
  const unpaid = (albeniz.debts || [])
    .filter((d) => !d.is_paid && d.amount > 0)
    .map((d) => ({
      date: d.date,
      description: d.description,
      originalAmount: d.amount,
      remainingAmount: d.remaining_amount ?? d.amount,
      isPartial: (d.remaining_amount ?? d.amount) < d.amount,
    }));
  const active = selectActiveDebtsForBalance(unpaid, albeniz.balance);
  const link = generateSummaryMessage({
    customerName: albeniz.name,
    phone: albeniz.phone,
    pendingDebts: active,
    totalBalance: albeniz.balance,
  });
  const msg = decodeURIComponent(link.split('text=')[1] ?? '');
  console.log('Filas impagas en respaldo:', unpaid.length);
  console.log('Filas en mensaje:', active.length);
  console.log('TOTAL en mensaje:', msg.match(/\*TOTAL PENDIENTE: ([^*]+)\*/)?.[1]);
}

console.log('\n✓ Verificación local completada (solo lectura).');
