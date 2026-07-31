import { supabase } from '@/lib/supabase';

/**
 * Effective pending for one unpaid purchase.
 * Migrated junk: is_paid=false but remaining<=0 → use amount.
 */
export function effectiveRemaining(debt: {
  amount: number;
  remaining_amount?: number | null;
  is_paid?: boolean;
}): number {
  const amt = Number(debt.amount);
  if (!Number.isFinite(amt) || amt <= 0) return 0;

  const raw =
    debt.remaining_amount == null ? null : Number(debt.remaining_amount);

  if (raw == null || Number.isNaN(raw)) return amt;
  if (raw <= 0 && !debt.is_paid) return amt;
  return Math.min(Math.max(raw, 0), amt);
}

/**
 * Sets debtors.balance from unpaid purchase remainings for ONE debtor.
 * Call after venta / abono / editar / eliminar historial of that client only.
 */
export async function recalculateDebtorBalance(debtorId: string): Promise<{
  success: boolean;
  balance?: number;
  error?: string;
}> {
  const { data: unpaid, error: fetchError } = await supabase
    .from('debts')
    .select('amount, remaining_amount, is_paid')
    .eq('debtor_id', debtorId)
    .eq('is_paid', false)
    .gt('amount', 0);

  if (fetchError) {
    console.error('recalculateDebtorBalance fetch:', fetchError);
    return { success: false, error: fetchError.message };
  }

  const balance = (unpaid || []).reduce((sum, d) => sum + effectiveRemaining(d), 0);

  const { error: updateError } = await supabase
    .from('debtors')
    .update({ balance, updated_at: new Date().toISOString() })
    .eq('id', debtorId);

  if (updateError) {
    console.error('recalculateDebtorBalance update:', updateError);
    return { success: false, error: updateError.message };
  }

  return { success: true, balance };
}
