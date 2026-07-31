'use server';

import { supabase } from '@/lib/supabase';
import { ABONO_MOTIVO_MAX_LENGTH } from '@/lib/constants/abono';
import { setDebtorBalance } from '@/lib/debt/adjustDebtorBalance';
import { logAuditAction } from './audit';
import { revalidatePath } from 'next/cache';

/**
 * Abono simple: Total Fiado = saldo − abono. Solo historial + balance.
 * No FIFO ni remaining_amount por compra.
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

    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: 'El monto del abono debe ser mayor a cero.' };
    }

    const description =
      motivoTrimmed.length > 0
        ? `Abono Registrado — ${motivoTrimmed}`
        : 'Abono Registrado';

    const { data: debtor, error: fetchError } = await supabase
      .from('debtors')
      .select('balance, name')
      .eq('id', debtorId)
      .single();

    if (fetchError || !debtor) {
      return { success: false, error: 'No se pudo encontrar al cliente.' };
    }

    const currentBalance = debtor.balance || 0;

    if (currentBalance === 0) {
      return { success: false, error: 'El cliente no tiene deuda pendiente.' };
    }

    if (amount > currentBalance) {
      const formatPrice = (val: number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
      return {
        success: false,
        error: `El abono no puede ser mayor al Total Fiado (${formatPrice(currentBalance)}).`,
      };
    }

    const timestamp = date || new Date().toISOString();
    const newBalance = Math.max(0, currentBalance - amount);

    const { error: insertError } = await supabase.from('debts').insert({
      debtor_id: debtorId,
      description,
      amount: -amount,
      date: timestamp,
      created_at: timestamp,
      is_paid: true,
      remaining_amount: 0,
    });

    if (insertError) {
      console.error('Error inserting abono record:', insertError);
      return { success: false, error: 'Error al registrar el abono en la base de datos.' };
    }

    const sync = await setDebtorBalance(debtorId, newBalance);
    if (!sync.success) {
      return {
        success: false,
        error: sync.error || 'Abono registrado pero no se pudo actualizar el saldo.',
      };
    }

    await logAuditAction({
      actionType: 'ABONO',
      entityType: 'debtors',
      entityId: debtorId,
      details: {
        amount,
        previousBalance: currentBalance,
        newBalance,
        customerName: debtor.name,
        timestamp,
        ...(motivoTrimmed.length > 0 ? { motivo: motivoTrimmed } : {}),
      },
    });

    revalidatePath('/');
    return { success: true, balance: newBalance };
  } catch (err) {
    console.error('Unexpected error in registerAbono:', err);
    return { success: false, error: 'Error inesperado del servidor.' };
  }
}
