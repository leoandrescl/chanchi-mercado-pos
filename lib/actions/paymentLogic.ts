import { supabase } from '@/lib/supabase';
import { logAuditAction } from '@/app/actions/audit';

export interface Debt {
  id: string;
  debtor_id: string;
  description: string;
  amount: number;
  date: string;
  is_paid: boolean;
  created_at?: string;
}

/**
 * Allocates a payment to the oldest unpaid debts first (FIFO).
 * Replicates the logic from the legacy database.py
 */
export async function processPayment(debtorId: string, amountPaid: number, dateStr?: string) {
  if (amountPaid <= 0) return { success: false, message: 'El monto debe ser mayor a cero.' };

  const timestamp = dateStr || new Date().toISOString();

  // 1. First, validate if amountPaid exceeds total balance
  const { data: debtsRaw, error: balanceError } = await supabase
    .from('debts')
    .select('amount, remaining_amount, is_paid')
    .eq('debtor_id', debtorId)
    .eq('is_paid', false);

  if (balanceError) throw balanceError;
  const totalBalance = (debtsRaw || []).reduce((sum, d) => sum + (d.remaining_amount ?? d.amount), 0);

  if (amountPaid > totalBalance) {
    return { 
      success: false, 
      message: `El abono no puede superar la deuda total ($${totalBalance.toLocaleString('es-CL')}).` 
    };
  }

  // 2. Fetch unpaid debts sorted by date (FIFO)
  const { data: debts, error: fetchError } = await supabase
    .from('debts')
    .select('*')
    .eq('debtor_id', debtorId)
    .eq('is_paid', false)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  if (fetchError) throw fetchError;
  if (!debts || debts.length === 0) return { success: true, logs: [] };

  let remainingToApply = amountPaid;
  const liquidatedItems: string[] = [];
  const logs: string[] = [];

  for (const debt of debts) {
    if (remainingToApply <= 0) break;

    const currentRemaining = debt.remaining_amount ?? debt.amount;
    const amountToApply = Math.min(remainingToApply, currentRemaining);
    const newRemainingAmount = currentRemaining - amountToApply;
    const isNowPaid = newRemainingAmount === 0;

    // Update the debt record
    const { error: updateError } = await supabase
      .from('debts')
      .update({ 
        remaining_amount: newRemainingAmount,
        is_paid: isNowPaid 
      })
      .eq('id', debt.id);

    if (updateError) throw updateError;

    remainingToApply -= amountToApply;
    
    // For the note, we simplify the description (remove "Compra: ")
    const shortDesc = debt.description.replace(/^Compra: /, '').substring(0, 20);
    liquidatedItems.push(`${shortDesc} ($${amountToApply})`);
    logs.push(`${debt.description} (-$${amountToApply}${isNowPaid ? ' ✅' : ''})`);
  }

  // 3. Record the ABONO in audit_logs with a liquidation note
  const liquidationNote = liquidatedItems.length > 0 
    ? `Liquidó: ${liquidatedItems.join(', ')}`
    : '';

  await logAuditAction({
    actionType: 'ABONO',
    entityType: 'debtors',
    entityId: debtorId,
    details: { 
      amount: amountPaid, 
      timestamp,
      liquidationNote // This will be used in the WhatsApp report
    }
  });

  return { success: true, logs };
}

/**
 * Consolidates a cart into a single debt record.
 */
export async function addConsolidatedDebt(debtorId: string, items: { name: string; quantity: number }[], total: number) {
  const itemDescription = items.map(i => `${i.name} x${i.quantity}`).join(', ');
  const description = `Compra: ${itemDescription.length > 50 ? itemDescription.substring(0, 47) + '...' : itemDescription}`;

  const timestamp = new Date().toISOString();
  const { error } = await supabase
    .from('debts')
    .insert({
      debtor_id: debtorId,
      description,
      amount: total,
      remaining_amount: total, // Initialize remaining amount
      date: timestamp,
      is_paid: false,
    });

  if (error) throw error;

  // AUDIT LOG
  await logAuditAction({
    actionType: 'FIADO',
    entityType: 'debtors',
    entityId: debtorId,
    details: { amount: total, description, items, timestamp }
  });

  return { success: true };
}
