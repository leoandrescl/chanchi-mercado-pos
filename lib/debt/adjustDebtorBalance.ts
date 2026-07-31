import { supabase } from '@/lib/supabase';

/**
 * Simple fiado ledger: debtors.balance is the only source of truth.
 * Sets an absolute balance (overwrites legacy DB triggers that recompute from remainings).
 */
export async function setDebtorBalance(
  debtorId: string,
  balance: number
): Promise<{ success: boolean; balance?: number; error?: string }> {
  const newBalance = Math.max(0, Math.round(balance));
  const { error: updateError } = await supabase
    .from('debtors')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', debtorId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, balance: newBalance };
}
