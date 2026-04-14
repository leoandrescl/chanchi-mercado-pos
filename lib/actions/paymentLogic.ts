import { supabase } from '@/lib/supabase';

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

  // 1. Fetch all unpaid debts sorted by date ASC (Oldest first)
  const { data: debts, error: fetchError } = await supabase
    .from('debts')
    .select('*')
    .eq('debtor_id', debtorId)
    .eq('is_paid', false)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true }); // Tie-breaker for identical dates

  if (fetchError) throw fetchError;
  if (!debts) return { success: true, logs: [] };

  const logs: string[] = [];
  let remaining = amountPaid;

  for (const debt of debts) {
    if (remaining <= 0) break;

    const debtId = debt.id;
    const debtAmount = debt.amount;

    if (remaining >= debtAmount) {
      // Fully pay this debt
      const { error: updateError } = await supabase
        .from('debts')
        .update({ is_paid: true })
        .eq('id', debtId);

      if (updateError) throw updateError;

      remaining -= debtAmount;
      logs.push(`${debt.description} ($${debtAmount})`);
    } else {
      // Partially pay this debt
      // 1. Reduce original debt to (Amount - Paid)
      const newAmount = debtAmount - remaining;
      const { error: updateError } = await supabase
        .from('debts')
        .update({ amount: newAmount })
        .eq('id', debtId);

      if (updateError) throw updateError;

      // 2. Create a "Paid Slice" record for the amount paid
      const { error: insertError } = await supabase
        .from('debts')
        .insert({
          debtor_id: debtorId,
          description: `${debt.description} (Pagado)`,
          amount: remaining,
          date: debt.date, // keep original date for history accuracy
          is_paid: true,
        });

      if (insertError) throw insertError;

      logs.push(`${debt.description} ($${remaining})`);
      remaining = 0;
    }
  }

  // Calculate used vs surplus
  const used = amountPaid - remaining;

  // 1. Record the "Used" portion as a PAID payment (negative amount to balance)
  if (used !== 0) {
    const { error: usedError } = await supabase
      .from('debts')
      .insert({
        debtor_id: debtorId,
        description: 'Abono',
        amount: -used,
        date: timestamp,
        is_paid: true,
      });
    if (usedError) throw usedError;
  }

  // 2. Record the "Surplus" portion as an UNPAID credit (Saldo a Favor)
  if (remaining > 0) {
    const { error: surplusError } = await supabase
      .from('debts')
      .insert({
        debtor_id: debtorId,
        description: 'Saldo a Favor',
        amount: -remaining,
        date: timestamp,
        is_paid: false,
      });
    if (surplusError) throw surplusError;

    if (used === 0) {
      logs.push('Saldo a Favor');
    } else {
      logs.push(`Saldo a Favor ($${remaining})`);
    }
  }

  return { success: true, logs };
}

/**
 * Consolidates a cart into a single debt record.
 */
export async function addConsolidatedDebt(debtorId: string, items: { name: string; quantity: number }[], total: number) {
  const itemDescription = items.map(i => `${i.name} x${i.quantity}`).join(', ');
  const description = `Compra: ${itemDescription.length > 50 ? itemDescription.substring(0, 47) + '...' : itemDescription}`;

  const { error } = await supabase
    .from('debts')
    .insert({
      debtor_id: debtorId,
      description,
      amount: total,
      date: new Date().toISOString(), // Explicitly set current date
      is_paid: false,
    });

  if (error) throw error;
  return { success: true };
}
