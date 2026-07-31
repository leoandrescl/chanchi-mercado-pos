'use server';

import { supabase } from '@/lib/supabase';
import { saleDateInputToIso } from '@/lib/date/saleCalendar';
import { recalculateDebtorBalance } from '@/lib/debt/recalculateDebtorBalance';
import { logAuditAction } from './audit';
import { revalidatePath } from 'next/cache';

/**
 * Elimina un movimiento del historial y recalcula el saldo del mismo cliente
 * desde compras impagas (evita desfase con el trigger legacy).
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

    const { error: deleteError } = await supabase.from('debts').delete().eq('id', debtId);
    if (deleteError) throw deleteError;

    const sync = await recalculateDebtorBalance(debtorId);
    if (!sync.success) {
      throw new Error(sync.error || 'No se pudo recalcular el saldo del cliente.');
    }

    await logAuditAction({
      actionType: 'DELETE_DEBT',
      entityType: 'debtors',
      entityId: debtorId,
      details: {
        debtId,
        amount,
        description,
        previousAmount: debt.amount,
        previousRemaining: debt.remaining_amount,
        previousIsPaid: debt.is_paid,
        newBalance: sync.balance,
        timestamp: new Date().toISOString(),
      },
    });

    revalidatePath('/');
    return { success: true, balance: sync.balance };
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

    if (newAmount < 0) {
      payload.is_paid = true;
      payload.remaining_amount = 0;
    } else if (newAmount > 0) {
      payload.is_paid = false;
    }

    const { error } = await supabase.from('debts').update(payload).eq('id', debtId);
    if (error) throw error;

    const sync = await recalculateDebtorBalance(debtorId);
    if (!sync.success) {
      throw new Error(sync.error || 'No se pudo recalcular el saldo del cliente.');
    }

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
        newBalance: sync.balance,
        timestamp: now,
      },
    });

    revalidatePath('/');
    return { success: true, balance: sync.balance };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al actualizar';
    console.error('Error updating debt:', err);
    return { success: false, error: message };
  }
}
