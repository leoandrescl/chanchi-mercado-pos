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

export async function getDebtorFullAudit(debtorId: string) {
  try {
    // 1. Fetch unpaid debts
    const { data: unpaidDebts, error: debtError } = await supabase
      .from('debts')
      .select('*')
      .eq('debtor_id', debtorId)
      .eq('is_paid', false)
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
    let totalDebts = 0;
    let totalAbonos = 0;

    // 3. Process unpaid debts into entries
    // We try to match each unpaid debt with its detailed audit log to get the items
    for (const debt of (unpaidDebts || [])) {
      totalDebts += debt.amount;
      
      // Look for a matching FIADO log (approximate by timestamp or description prefix)
      // Since debt.description is often "Compra: [Items...]" and logs have details.items
      const matchingLog = logs?.find(l => 
        l.action_type === 'FIADO' && 
        (Math.abs(new Date(l.created_at).getTime() - new Date(debt.date).getTime()) < 5000) // 5s window
      );

      entries.push({
        type: 'DEBT',
        date: debt.date,
        description: debt.description,
        amount: debt.amount,
        items: matchingLog?.details?.items || []
      });
    }

    // 4. Process ALL ABONOS into entries
    for (const log of (logs || [])) {
      if (log.action_type === 'ABONO') {
        const amount = log.details?.amount || 0;
        totalAbonos += amount;
        entries.push({
          type: 'PAYMENT',
          date: log.created_at,
          description: log.details?.type === 'Surplus/Credit' ? 'Saldo a Favor' : 'Abono Recibido',
          amount: amount
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
        totalDebts,
        totalAbonos,
        finalBalance: totalDebts // Sum of unpaid is current balance
      }
    };

  } catch (error: any) {
    console.error('Error fetching audit data:', error.message);
    return { success: false, error: error.message };
  }
}
