'use server';

import { supabase } from '@/lib/supabase';
import { setDebtorBalance } from '@/lib/debt/adjustDebtorBalance';
import { logAuditAction } from './audit';
import { revalidatePath } from 'next/cache';

/**
 * Elimina un movimiento y deshace su efecto en el Total Fiado:
 * - compra (+N): balance -= N
 * - abono (-N): balance += N
 */
export async function deleteDebtAction(
  debtId: string,
  debtorId: string,
  amount: number,
  description: string
) {
  try {
    const { data: debt, error: fetchError } = await supabase
      .from('debts')
      .select('amount, description')
      .eq('id', debtId)
      .single();

    if (fetchError || !debt) {
      throw fetchError ?? new Error('Registro no encontrado.');
    }

    const rowAmount = Number(debt.amount);
    if (!Number.isFinite(rowAmount)) {
      throw new Error('Monto de registro inválido.');
    }

    const { data: debtor, error: debtorError } = await supabase
      .from('debtors')
      .select('balance')
      .eq('id', debtorId)
      .single();

    if (debtorError || !debtor) {
      throw debtorError ?? new Error('Cliente no encontrado.');
    }

    const previousBalance = debtor.balance || 0;
    const newBalance = Math.max(0, previousBalance - rowAmount);

    const { error: deleteError } = await supabase.from('debts').delete().eq('id', debtId);
    if (deleteError) throw deleteError;

    const sync = await setDebtorBalance(debtorId, newBalance);
    if (!sync.success) {
      throw new Error(sync.error || 'No se pudo actualizar el saldo del cliente.');
    }

    await logAuditAction({
      actionType: 'DELETE_DEBT',
      entityType: 'debtors',
      entityId: debtorId,
      details: {
        debtId,
        amount: rowAmount,
        description: debt.description || description,
        previousBalance,
        newBalance,
        timestamp: new Date().toISOString(),
      },
    });

    revalidatePath('/');
    return { success: true, balance: newBalance };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al eliminar';
    console.error('Error deleting debt:', err);
    return { success: false, error: message };
  }
}
