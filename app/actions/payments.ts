'use server';

import { supabase } from '@/lib/supabase';
import { logAuditAction } from './audit';
import { revalidatePath } from 'next/cache';

/**
 * Registers a payment (Abono) for a debtor.
 * Strictly validates that the amount does not exceed the current balance.
 */
export async function registerAbono(debtorId: string, amount: number) {
  try {
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

    // 3. Register the payment as a negative debt record
    // This will trigger the DB synchronization to update the balance
    const timestamp = new Date().toISOString();
    const { error: insertError } = await supabase
      .from('debts')
      .insert({
        debtor_id: debtorId,
        description: 'Abono Registrado',
        amount: -amount,
        date: timestamp,
        is_paid: true,
      });

    if (insertError) {
      console.error('Error inserting abono record:', insertError);
      return { success: false, error: 'Error al registrar el abono en la base de datos.' };
    }

    // 4. Log Audit Action
    await logAuditAction({
      actionType: 'ABONO',
      entityType: 'debtors',
      entityId: debtorId,
      details: { 
        amount, 
        previousBalance: currentBalance, 
        newBalance: currentBalance - amount,
        customerName: debtor.name,
        timestamp 
      }
    });

    revalidatePath('/');
    return { success: true };
    
  } catch (err) {
    console.error('Unexpected error in registerAbono:', err);
    return { success: false, error: 'Error inesperado del servidor.' };
  }
}
