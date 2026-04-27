/**
 * Helpers for `<input type="date" />` (YYYY-MM-DD) used in POS cart and debt rows.
 */

/** Local calendar date as YYYY-MM-DD (not UTC midnight). */
export function localDateKeyFromDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Timestamp for a new debt from the cart's "Fecha de la venta".
 * If the user picked today's local date, use the real clock so each venta has a distinct time.
 * If they picked another day (backdating), use noon local on that day (stable vs DST).
 */
export function debtTimestampForSaleDate(saleDateInput: string): string {
  const parts = saleDateInput.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (!y || !m || !d) return new Date().toISOString();

  if (saleDateInput === localDateKeyFromDate()) {
    return new Date().toISOString();
  }
  return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString();
}

/** Converts YYYY-MM-DD from `<input type="date" />` to ISO for timestamptz (noon local, stable vs DST). */
export function saleDateInputToIso(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  const y = parts[0];
  const mo = parts[1];
  const d = parts[2];
  if (!y || !mo || !d) return new Date().toISOString();
  return new Date(y, mo - 1, d, 12, 0, 0, 0).toISOString();
}
