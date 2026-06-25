export interface DebtWithRemaining {
  date: string;
  remainingAmount: number;
  createdAt?: string;
}

function compareByDateAsc(a: DebtWithRemaining, b: DebtWithRemaining): number {
  const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
  if (dateDiff !== 0) return dateDiff;
  if (a.createdAt && b.createdAt) {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }
  return 0;
}

/**
 * Selects the unpaid debts whose remaining amounts explain `totalBalance`,
 * walking from newest to oldest (LIFO tail). Read-only — does not mutate data.
 */
export function selectActiveDebtsForBalance<T extends DebtWithRemaining>(
  debts: T[],
  totalBalance: number
): T[] {
  if (totalBalance <= 0) return [];

  const unpaid = debts
    .filter((d) => d.remainingAmount > 0)
    .sort(compareByDateAsc);

  if (unpaid.length === 0) return [];

  let acc = 0;
  const selected: T[] = [];

  for (let i = unpaid.length - 1; i >= 0 && acc < totalBalance; i--) {
    const debt = unpaid[i];
    const needed = totalBalance - acc;

    if (debt.remainingAmount <= needed) {
      selected.unshift(debt);
      acc += debt.remainingAmount;
    } else {
      selected.unshift({
        ...debt,
        remainingAmount: needed,
      } as T);
      acc = totalBalance;
    }
  }

  return selected;
}

const MONTH_FORMATTER = new Intl.DateTimeFormat('es-CL', {
  month: 'long',
  year: 'numeric',
});

export function getMonthKeyFromDate(dateStr: string): string {
  return MONTH_FORMATTER.format(new Date(dateStr));
}

export function getActiveMonthKeys(dates: string[]): Set<string> {
  return new Set(dates.map(getMonthKeyFromDate));
}

export function isDateInActiveMonths(dateStr: string, activeMonths: Set<string>): boolean {
  return activeMonths.has(getMonthKeyFromDate(dateStr));
}
