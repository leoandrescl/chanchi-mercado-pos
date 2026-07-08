'use server';

import { supabase } from '@/lib/supabase';
import { saleDateInputToIso } from '@/lib/date/saleCalendar';
import { logAuditAction } from './audit';
import { revalidatePath } from 'next/cache';

function balanceAdjustForDelete(debt: {
  amount: number;
  remaining_amount?: number | null;
  is_paid?: boolean;
}): number {
  const amt = Number(debt.amount);
  if (!Number.isFinite(amt)) return 0;

  if (amt > 0) {
    if (debt.is_paid) return 0;
    const rem = debt.remaining_amount ?? amt;
    return -Math.max(0, Number(rem) || 0);
  }

  // Quitar un abono devuelve deuda al cliente
  return Math.abs(amt);
}

/**
 * Elimina un movimiento del historial y ajusta debtors.balance según lo que realmente impactaba.
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
      .select('amount, remaining_amount, is_paid')
      .eq('id', debtId)
      .single();

    if (fetchError || !debt) {
      throw fetchError ?? new Error('Registro no encontrado.');
    }

    const { data: debtor, error: debtorError } = await supabase
      .from('debtors')
      .select('balance')
      .eq('id', debtorId)
      .single();

    if (debtorError || !debtor) {
      throw debtorError ?? new Error('Cliente no encontrado.');
    }

    const balanceAdjust = balanceAdjustForDelete(debt);

    const { error: deleteError } = await supabase.from('debts').delete().eq('id', debtId);
    if (deleteError) throw deleteError;

    if (balanceAdjust !== 0) {
      const newBalance = Math.max(0, (debtor.balance || 0) + balanceAdjust);
      const { error: updateError } = await supabase
        .from('debtors')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', debtorId);
      if (updateError) throw updateError;
    }

    await logAuditAction({
      actionType: 'DELETE_DEBT',
      entityType: 'debtors',
      entityId: debtorId,
      details: {
        debtId,
        amount,
        description,
        balanceAdjust,
        timestamp: new Date().toISOString(),
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al eliminar';
    console.error('Error deleting debt:', err);
    return { success: false, error: message };
  }
}

/**
 * Updates the amount or description of a debt record.
 */
export async function updateDebtAction(
  debtId: string,
  debtorId: string,
  newAmount: number,
  oldAmount: number,
  newDescription: string,
  newDateInput?: string
) {
  try {
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      amount: newAmount,
      remaining_amount: newAmount,
      description: newDescription,
      updated_at: now,
    };

    if (newDateInput) {
      const ts = saleDateInputToIso(newDateInput);
      payload.date = ts;
      payload.created_at = ts;
    }

    const { error } = await supabase.from('debts').update(payload).eq('id', debtId);
    if (error) throw error;

    const { data: debtor, error: debtorError } = await supabase
      .from('debtors')
      .select('balance')
      .eq('id', debtorId)
      .single();

    if (debtorError || !debtor) {
      throw debtorError ?? new Error('Cliente no encontrado.');
    }

    const newBalance = Math.max(0, (debtor.balance || 0) + (newAmount - oldAmount));
    const { error: balanceError } = await supabase
      .from('debtors')
      .update({ balance: newBalance, updated_at: now })
      .eq('id', debtorId);
    if (balanceError) throw balanceError;

    await logAuditAction({
      actionType: 'UPDATE_DEBT',
      entityType: 'debtors',
      entityId: debtorId,
      details: {
        debtId,
        oldAmount,
        newAmount,
        diff: newAmount - oldAmount,
        newDescription,
        newDateInput: newDateInput ?? null,
        timestamp: now,
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al actualizar';
    console.error('Error updating debt:', err);
    return { success: false, error: message };
  }
}
