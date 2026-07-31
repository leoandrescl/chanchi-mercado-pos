'use server';

import {
  getActiveMonthKeys,
  isDateInActiveMonths,
  selectActiveDebtsForBalance,
} from '@/lib/debt/selectActiveDebtsForBalance';
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

/**
 * Compras recientes que explican el Total Fiado (más nuevas primero).
 * Si julio cubre todo el saldo, junio pagado no aparece.
 */
function activePurchasesForBalance(
  debts: { date: string; description: string; amount: number; created_at?: string }[],
  totalBalance: number
) {
  const recentPurchases = debts
    .filter((d) => d.amount > 0 && isInRecentMonths(d.date))
    .map((d) => ({
      date: d.date,
      description: d.description,
      originalAmount: d.amount,
      remainingAmount: d.amount,
      isPartial: false,
      createdAt: d.created_at,
    }));

  return selectActiveDebtsForBalance(recentPurchases, totalBalance).map((d) => ({
    ...d,
    isPartial: d.remainingAmount < d.originalAmount,
  }));
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

    const debts = allDebts || [];
    let totalPurchases = 0;
    let totalAbonos = 0;
    for (const debt of debts) {
      if (debt.amount > 0) totalPurchases += debt.amount;
      else if (debt.amount < 0) totalAbonos += Math.abs(debt.amount);
    }

    const activePurchases = activePurchasesForBalance(debts, realBalance);

    // Solo compras que explican el saldo (sin mes anterior ya pagado)
    const entries: AuditEntry[] = activePurchases
      .map((d) => ({
        type: 'DEBT' as const,
        date: d.date,
        description: d.description,
        amount: d.remainingAmount,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const grouped: MonthlyAuditData[] = [];
    for (const entry of entries) {
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
 * Resumen WhatsApp: solo compras que explican el Total Fiado
 * (mes actual; mes anterior solo si hay deuda arrastrada).
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

    const totalBalance = debtor.balance || 0;
    const pendingDebts = activePurchasesForBalance(debts || [], totalBalance);
    const activeMonths = getActiveMonthKeys(pendingDebts.map((d) => d.date));

    const payments = (debts || [])
      .filter((d) => d.amount < 0 && isDateInActiveMonths(d.date, activeMonths))
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
        totalBalance,
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
