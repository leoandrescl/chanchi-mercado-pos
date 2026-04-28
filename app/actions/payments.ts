'use server';

import { supabase } from '@/lib/supabase';
import { ABONO_MOTIVO_MAX_LENGTH } from '@/lib/constants/abono';
import { logAuditAction } from './audit';
import { revalidatePath } from 'next/cache';

/**
 * Registers a payment (Abono) for a debtor.
 * Strictly validates that the amount does not exceed the current balance.
 */
export async function registerAbono(
  debtorId: string,
  amount: number,
  date?: string,
  motivo?: string | null
) {
  try {
    const motivoTrimmed = (motivo ?? '').trim();
    if (motivoTrimmed.length > ABONO_MOTIVO_MAX_LENGTH) {
      return {
        success: false,
        error: `El motivo no puede superar ${ABONO_MOTIVO_MAX_LENGTH} caracteres.`,
      };
    }

    const description =
      motivoTrimmed.length > 0
        ? `Abono Registrado — ${motivoTrimmed}`
        : 'Abono Registrado';

    // 1. Fetch current balance to validate
    const { data: debtor, error: fetchError } = await supabase
      .from('debtors')
      .select('balance, name')
      .eq('id', debtorId)
      .single();

    if (fetchError || !debtor) {
      return { success: false, error: 'No se pudo encontrar al cliente.' };
    }

    const currentBalance = debtor.balance || 0;

    // 2. Strict Validations
    if (currentBalance === 0) {
      return { success: false, error: 'El cliente no tiene deuda pendiente.' };
    }

    if (amount > currentBalance) {
      const formatPrice = (val: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
      return { success: false, error: `El abono no puede ser mayor al Total Fiado (${formatPrice(currentBalance)}).` };
    }

    const timestamp = date || new Date().toISOString();

    // 3. Apply payment FIFO to unpaid positive debts (oldest first)
    const { data: unpaidDebts, error: unpaidDebtsError } = await supabase
      .from('debts')
      .select('id, amount, remaining_amount, is_paid')
      .eq('debtor_id', debtorId)
      .eq('is_paid', false)
      .gt('amount', 0)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

    if (unpaidDebtsError) {
      console.error('Error fetching unpaid debts for FIFO allocation:', unpaidDebtsError);
      return { success: false, error: 'Error al aplicar el abono sobre las deudas pendientes.' };
    }

    let remainingToApply = amount;
    for (const debt of unpaidDebts || []) {
      if (remainingToApply <= 0) break;

      const currentRemaining = debt.remaining_amount ?? debt.amount;
      if (currentRemaining <= 0) continue;

      const applied = Math.min(remainingToApply, currentRemaining);
      const newRemaining = currentRemaining - applied;

      const { error: updateError } = await supabase
        .from('debts')
        .update({
          remaining_amount: newRemaining,
          is_paid: newRemaining === 0,
        })
        .eq('id', debt.id);

      if (updateError) {
        console.error('Error updating debt during FIFO allocation:', updateError);
        return { success: false, error: 'Error al actualizar deudas con el abono parcial.' };
      }

      remainingToApply -= applied;
    }

    // 4. Register the payment as a negative debt record
    // This keeps an explicit "abono" movement in history.
    const { error: insertError } = await supabase
      .from('debts')
      .insert({
        debtor_id: debtorId,
        description,
        amount: -amount,
        date: timestamp,
        created_at: timestamp,
        is_paid: true,
      });

    if (insertError) {
      console.error('Error inserting abono record:', insertError);
      return { success: false, error: 'Error al registrar el abono en la base de datos.' };
    }

    // 5. Log Audit Action
    await logAuditAction({
      actionType: 'ABONO',
      entityType: 'debtors',
      entityId: debtorId,
      details: {
        amount,
        previousBalance: currentBalance,
        newBalance: currentBalance - amount,
        customerName: debtor.name,
        timestamp,
        ...(motivoTrimmed.length > 0 ? { motivo: motivoTrimmed } : {}),
      },
    });

    revalidatePath('/');
    return { success: true };
    
  } catch (err) {
    console.error('Unexpected error in registerAbono:', err);
    return { success: false, error: 'Error inesperado del servidor.' };
  }
}
