'use server';

import { supabase } from '@/lib/supabase';
import { logAuditAction } from './audit';
import { revalidatePath } from 'next/cache';
import { saleDateInputToIso } from '@/lib/date/saleCalendar';

/**
 * Deletes a specific debt record.
 * The DB trigger should handle updating the debtor's balance.
 */
export async function deleteDebtAction(debtId: string, debtorId: string, amount: number, description: string) {
  try {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', debtId);

    if (error) throw error;

    await logAuditAction({
      actionType: 'DELETE_DEBT',
      entityType: 'debtors',
      entityId: debtorId,
      details: { debtId, amount, description, timestamp: new Date().toISOString() }
    });

    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting debt:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Marks a specific debt as paid by inserting a corresponding abono record
 * and updating the original debt status.
 */
export async function quickPayDebtAction(debtId: string, debtorId: string, amount: number, description: string) {
  try {
    const timestamp = new Date().toISOString();

    // 1. Mark original debt as paid
    const { error: updateError } = await supabase
      .from('debts')
      .update({ 
        is_paid: true, 
        remaining_amount: 0 
      })
      .eq('id', debtId);

    if (updateError) throw updateError;

    // 2. Insert a negative record (Abono) to reflect the payment in the history
    const { error: insertError } = await supabase
      .from('debts')
      .insert({
        debtor_id: debtorId,
        description: `Pago: ${description}`,
        amount: -amount,
        date: timestamp,
        is_paid: true,
      });

    if (insertError) throw insertError;

    await logAuditAction({
      actionType: 'QUICK_PAY',
      entityType: 'debtors',
      entityId: debtorId,
      details: { debtId, amount, description, timestamp }
    });

    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('Error in quick pay:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Updates the amount or description of a debt.
 * The DB trigger should handle updating the debtor's balance if the amount changes.
 */
export async function updateDebtAction(
  debtId: string,
  debtorId: string,
  newAmount: number,
  oldAmount: number,
  newDescription: string,
  /** `YYYY-MM-DD` from date input; updates `date` and `created_at` when set. */
  newDateInput?: string
) {
  try {
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      amount: newAmount,
      remaining_amount: newAmount, // Reset remaining if it was unpaid
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
        timestamp: now 
      }
    });

    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('Error updating debt:', err);
    return { success: false, error: err.message };
  }
}
