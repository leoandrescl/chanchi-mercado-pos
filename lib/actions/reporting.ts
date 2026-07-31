'use server';

import { supabase } from '@/lib/supabase';

export interface AuditEntry {
  type: 'DEBT' | 'PAYMENT';
  date: string;
  description: string;
  amount: number;
  items?: { name: string; quantity: number }[];
}

export interface MonthlyAuditData {
  monthName: string;
  entries: AuditEntry[];
}

function monthKey(dateStr: string) {
  return new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(
    new Date(dateStr)
  );
}

/** From the start of the previous calendar month (current + previous). */
function isInRecentMonths(dateStr: string): boolean {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return d >= cutoff;
}

export async function getDebtorFullAudit(debtorId: string) {
  try {
    const { data: debtor, error: debtorFetchError } = await supabase
      .from('debtors')
      .select('balance')
      .eq('id', debtorId)
      .single();

    if (debtorFetchError) throw debtorFetchError;
    const realBalance = debtor.balance || 0;

    const { data: allDebts, error: debtError } = await supabase
      .from('debts')
      .select('*')
      .eq('debtor_id', debtorId)
      .order('date', { ascending: true });

    if (debtError) throw debtError;

    const entries: AuditEntry[] = [];
    let totalPurchases = 0;
    let totalAbonos = 0;

    for (const debt of allDebts || []) {
      if (debt.amount > 0) {
        totalPurchases += debt.amount;
        entries.push({
          type: 'DEBT',
          date: debt.date,
          description: debt.description,
          amount: debt.amount,
        });
      } else if (debt.amount < 0) {
        const absAmount = Math.abs(debt.amount);
        totalAbonos += absAmount;
        entries.push({
          type: 'PAYMENT',
          date: debt.date,
          description: debt.description.includes('Favor')
            ? 'Saldo a Favor'
            : debt.description,
          amount: absAmount,
        });
      }
    }

    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const recent = entries.filter((e) => isInRecentMonths(e.date));

    const grouped: MonthlyAuditData[] = [];
    for (const entry of recent) {
      const name = monthKey(entry.date);
      let monthGroup = grouped.find((g) => g.monthName === name);
      if (!monthGroup) {
        monthGroup = { monthName: name, entries: [] };
        grouped.push(monthGroup);
      }
      monthGroup.entries.push(entry);
    }

    return {
      success: true,
      data: {
        monthsData: grouped,
        totalPurchases,
        totalAbonos,
        finalBalance: realBalance,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error fetching audit data:', message);
    return { success: false, error: message };
  }
}

/**
 * Resumen WhatsApp: compras y abonos recientes + Total Fiado (debtors.balance).
 */
export async function getDebtorSummary(debtorId: string) {
  try {
    const { data: debtor, error: debtorError } = await supabase
      .from('debtors')
      .select('balance, name, phone')
      .eq('id', debtorId)
      .single();

    if (debtorError) throw debtorError;

    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('debtor_id', debtorId)
      .order('date', { ascending: true });

    if (debtsError) throw debtsError;

    const recent = (debts || []).filter((d) => isInRecentMonths(d.date));

    const pendingDebts = recent
      .filter((d) => d.amount > 0)
      .map((d) => ({
        date: d.date,
        description: d.description,
        originalAmount: d.amount,
        remainingAmount: d.amount,
        isPartial: false,
      }));

    const payments = recent
      .filter((d) => d.amount < 0)
      .map((d) => ({
        date: d.date,
        description: typeof d.description === 'string' ? d.description : 'Abono Registrado',
        amount: Math.abs(d.amount || 0),
      }));

    return {
      success: true,
      data: {
        pendingDebts,
        payments,
        totalBalance: debtor.balance || 0,
        name: debtor.name,
        phone: debtor.phone || '',
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error fetching summary:', message);
    return { success: false, error: message };
  }
}
