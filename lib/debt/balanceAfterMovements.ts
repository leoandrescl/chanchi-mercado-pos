export type LedgerMovement = {
  id: string;
  debtor_id: string;
  amount: number;
  date: string;
  created_at?: string | null;
};

function compareNewestFirst(a: LedgerMovement, b: LedgerMovement): number {
  const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
  if (dateDiff !== 0) return dateDiff;
  const ca = a.created_at ? new Date(a.created_at).getTime() : 0;
  const cb = b.created_at ? new Date(b.created_at).getTime() : 0;
  if (cb !== ca) return cb - ca;
  return b.id.localeCompare(a.id);
}

/**
 * For each movement, the Total Fiado that remained AFTER that movement.
 * Walks newest→oldest from each debtor's current balance so manual fixes stay consistent.
 */
export function balanceAfterByMovementId(
  movements: LedgerMovement[],
  currentBalanceByDebtor: Record<string, number>
): Map<string, number> {
  const byDebtor = new Map<string, LedgerMovement[]>();
  for (const m of movements) {
    const list = byDebtor.get(m.debtor_id) || [];
    list.push(m);
    byDebtor.set(m.debtor_id, list);
  }

  const result = new Map<string, number>();

  for (const [debtorId, list] of byDebtor) {
    list.sort(compareNewestFirst);
    let bal = currentBalanceByDebtor[debtorId] || 0;
    for (const m of list) {
      result.set(m.id, Math.max(0, bal));
      bal = bal - Number(m.amount || 0);
    }
  }

  return result;
}
