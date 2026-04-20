'use server';

import { supabase } from '@/lib/supabase';

export interface AuditEntry {
  type: 'DEBT' | 'PAYMENT';
  date: string;
  description: string;
  amount: number;
  remaining_amount?: number;
  is_paid?: boolean;
  items?: { name: string; quantity: number }[];
  liquidationNote?: string;
}

export interface MonthlyAuditData {
  monthName: string;
  entries: AuditEntry[];
}

export async function getDebtorFullAudit(debtorId: string) {
  try {
    // 1. Fetch the DEBTOR truth (real balance)
    const { data: debtor, error: debtorFetchError } = await supabase
      .from('debtors')
      .select('balance')
      .eq('id', debtorId)
      .single();

    if (debtorFetchError) throw debtorFetchError;
    const realBalance = debtor.balance || 0;

    // 2. Fetch ALL debts (paid and unpaid)
    const { data: allDebts, error: debtError } = await supabase
      .from('debts')
      .select('*')
      .eq('debtor_id', debtorId)
      .order('date', { ascending: true });

    if (debtError) throw debtError;

    // 2. Fetch ALL audit logs for this debtor (FIADO and ABONO)
    const { data: logs, error: logError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_id', debtorId)
      .in('action_type', ['FIADO', 'ABONO'])
      .order('created_at', { ascending: true });

    if (logError) throw logError;

    const entries: AuditEntry[] = [];
    let totalPurchases = 0;
    let totalAbonos = 0;

    // 3. Process ALL debts into entries
    for (const debt of (allDebts || [])) {
      if (debt.amount > 0) {
        // It's a real purchase
        totalPurchases += debt.amount;
        
        const matchingLog = logs?.find(l => 
          l.action_type === 'FIADO' && 
          (Math.abs(new Date(l.created_at).getTime() - new Date(debt.date).getTime()) < 5000)
        );

        entries.push({
          type: 'DEBT',
          date: debt.date,
          description: debt.description,
          amount: debt.amount,
          remaining_amount: debt.remaining_amount ?? (debt.is_paid ? 0 : debt.amount),
          is_paid: debt.is_paid,
          items: matchingLog?.details?.items || []
        });
      } else if (debt.amount < 0) {
        // It's a legacy abono/credit stored in debts table
        const absAmount = Math.abs(debt.amount);
        totalAbonos += absAmount;
        entries.push({
          type: 'PAYMENT',
          date: debt.date,
          description: debt.description.includes('Favor') ? 'Saldo a Favor' : 'Abono Registrado',
          amount: absAmount
        });
      }
    }

    // 4. Process ALL ABONOS (from logs) into entries
    for (const log of (logs || [])) {
      if (log.action_type === 'ABONO') {
        const amount = log.details?.amount || 0;
        totalAbonos += amount;
        entries.push({
          type: 'PAYMENT',
          date: log.created_at,
          description: log.details?.type === 'Surplus/Credit' ? 'Saldo a Favor' : 'Abono Recibido',
          amount: amount,
          liquidationNote: log.details?.liquidationNote
        });
      }
    }

    // 5. Sort all entries by date
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 6. Group by month
    const grouped: MonthlyAuditData[] = [];
    const monthFormatter = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' });

    for (const entry of entries) {
      const monthKey = monthFormatter.format(new Date(entry.date));
      let monthGroup = grouped.find(g => g.monthName === monthKey);
      
      if (!monthGroup) {
        monthGroup = { monthName: monthKey, entries: [] };
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
        finalBalance: realBalance
      }
    };

  } catch (error: any) {
    console.error('Error fetching audit data:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches only UNPAID debts for a debtor, formatted for the summary WhatsApp report.
 * Includes partial payment info when a debt has been partially covered.
 */
export async function getDebtorSummary(debtorId: string) {
  try {
    const { data: debtor, error: debtorError } = await supabase
      .from('debtors')
      .select('balance, name, phone')
      .eq('id', debtorId)
      .single();

    if (debtorError) throw debtorError;

    // Only fetch unpaid debts with positive amounts (real purchases)
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('debtor_id', debtorId)
      .eq('is_paid', false)
      .gt('amount', 0)
      .order('date', { ascending: true });

    if (debtsError) throw debtsError;

    const pendingDebts = (debts || []).map((d: any) => {
      const remaining = d.remaining_amount ?? d.amount;
      const isPartial = remaining < d.amount;
      return {
        date: d.date,
        description: d.description,
        originalAmount: d.amount,
        remainingAmount: remaining,
        isPartial,
      };
    });

    return {
      success: true,
      data: {
        pendingDebts,
        totalBalance: debtor.balance || 0,
        name: debtor.name,
        phone: debtor.phone || '',
      }
    };
  } catch (error: any) {
    console.error('Error fetching summary:', error.message);
    return { success: false, error: error.message };
  }
}
