import { supabase } from '@/lib/supabase';
import { logAuditAction } from '@/app/actions/audit';
import { debtTimestampForSaleDate } from '@/lib/date/saleCalendar';
import { setDebtorBalance } from '@/lib/debt/adjustDebtorBalance';

export { saleDateInputToIso } from '@/lib/date/saleCalendar';

export interface Debt {
  id: string;
  debtor_id: string;
  description: string;
  amount: number;
  date: string;
  is_paid: boolean;
  remaining_amount?: number | null;
  created_at?: string;
}

/**
 * Registra una compra fiada: historial + suma al Total Fiado.
 */
export async function addConsolidatedDebt(
  debtorId: string,
  items: { name: string; quantity: number }[],
  total: number,
  /** `YYYY-MM-DD` from cart; sets both `date` and `created_at` instead of server defaults. */
  saleDateInput?: string
) {
  const itemDescription = items.map((i) => `${i.name} x${i.quantity}`).join(', ');
  const description = `Compra: ${
    itemDescription.length > 50 ? itemDescription.substring(0, 47) + '...' : itemDescription
  }`;

  const timestamp = saleDateInput
    ? debtTimestampForSaleDate(saleDateInput)
    : new Date().toISOString();

  const { data: debtor, error: debtorError } = await supabase
    .from('debtors')
    .select('balance')
    .eq('id', debtorId)
    .single();

  if (debtorError || !debtor) {
    throw debtorError ?? new Error('Cliente no encontrado.');
  }

  const previousBalance = debtor.balance || 0;
  const newBalance = previousBalance + total;

  const { error } = await supabase.from('debts').insert({
    debtor_id: debtorId,
    description,
    amount: total,
    remaining_amount: total,
    date: timestamp,
    created_at: timestamp,
    is_paid: false,
  });

  if (error) throw error;

  const sync = await setDebtorBalance(debtorId, newBalance);
  if (!sync.success) {
    throw new Error(sync.error || 'Compra registrada pero no se pudo actualizar el saldo.');
  }

  await logAuditAction({
    actionType: 'FIADO',
    entityType: 'debtors',
    entityId: debtorId,
    details: { amount: total, description, items, timestamp, newBalance },
  });

  return { success: true, balance: newBalance };
}
