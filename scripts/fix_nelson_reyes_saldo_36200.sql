-- Nelson Reyes — balance muestra 75.200 y por cuenta manual debiera ser 36.200.
-- Referencia negocio (feb–mar 2026):
--   Saldo pendiente feb: 26.500
--   Marzo: 1.800 + 2.500 + 2.300 + 1.300 + 1.800 = 9.700  →  total 36.200
--
-- IMPORTANTE: no usar reconcile_debtor_supabase.sql tal cual para cuentas con mucho historial:
-- reparte sobre TODAS las compras con amount > 0 y puede “desmarcar” compras viejas ya pagadas.
-- Este script solo reparte sobre compras con is_paid = false y amount > 0 (FIFO).
--
-- UUID Nelson Reyes:
-- 8c7f98a6-a60b-42e4-a5e0-12b4bf4cd903

-- ========= DIAGNÓSTICO =========
SELECT id, name, balance
FROM debtors
WHERE id = '8c7f98a6-a60b-42e4-a5e0-12b4bf4cd903'::uuid;

-- Todas las compras aún “abiertas” según la BD (lo que debería sumar ~36.200 si los datos son correctos)
SELECT
  COALESCE(SUM(amount), 0) AS suma_amount_impagas,
  COALESCE(SUM(COALESCE(remaining_amount, amount)), 0) AS suma_remaining_impagas
FROM debts
WHERE debtor_id = '8c7f98a6-a60b-42e4-a5e0-12b4bf4cd903'::uuid
  AND amount > 0
  AND is_paid = false;

SELECT id, description, amount, remaining_amount, is_paid, date::date AS fecha, created_at
FROM debts
WHERE debtor_id = '8c7f98a6-a60b-42e4-a5e0-12b4bf4cd903'::uuid
ORDER BY date ASC, created_at ASC;

-- Patrones típicos de migración que rompen abonos / balance
SELECT id, description, amount, remaining_amount, is_paid
FROM debts
WHERE debtor_id = '8c7f98a6-a60b-42e4-a5e0-12b4bf4cd903'::uuid
  AND (
    (amount < 0 AND is_paid = false)
    OR (amount > 0 AND is_paid = false AND COALESCE(remaining_amount, amount) > amount)
    OR (amount > 0 AND COALESCE(remaining_amount, amount) < 0)
  );

-- Filas que el FIX va a re-abrir como única deuda viva (fecha local del POS + monto).
-- Debe devolver exactamente 6 filas y sumar 36.200; si hay más (duplicados), ajustá por id abajo.
SELECT id, description, amount, date::date AS fecha, is_paid
FROM debts
WHERE debtor_id = '8c7f98a6-a60b-42e4-a5e0-12b4bf4cd903'::uuid
  AND amount > 0
  AND (
    (date::date = DATE '2026-02-27' AND amount = 26500)
    OR (date::date = DATE '2026-03-11' AND amount = 1800)
    OR (date::date = DATE '2026-03-12' AND amount = 1300)
    OR (date::date = DATE '2026-03-13' AND amount = 2300)
    OR (date::date = DATE '2026-03-18' AND amount = 2500)
    OR (date::date = DATE '2026-03-19' AND amount = 1800)
  )
ORDER BY date ASC, created_at ASC;

-- ========= FIX (paso 2 — ejecutar después de revisar la consulta anterior) =========
-- Estrategia: todo el historial de COMPRAS (amount > 0) queda pagado; solo se re-abren
-- las 6 líneas feb–mar 2026 que coinciden con fecha+monto. Abonos (amount < 0) quedan cerrados.
-- Si la consulta anterior devolvió más de 6 filas, NO ejecutes esto: hay duplicados.
/*
BEGIN;

SET LOCAL session_replication_role = replica;

UPDATE debts
SET is_paid = true, remaining_amount = 0, updated_at = NOW()
WHERE debtor_id = '8c7f98a6-a60b-42e4-a5e0-12b4bf4cd903'::uuid
  AND amount < 0;

UPDATE debts
SET is_paid = true, remaining_amount = 0, updated_at = NOW()
WHERE debtor_id = '8c7f98a6-a60b-42e4-a5e0-12b4bf4cd903'::uuid
  AND amount > 0;

UPDATE debts
SET
  is_paid = false,
  remaining_amount = amount,
  updated_at = NOW()
WHERE debtor_id = '8c7f98a6-a60b-42e4-a5e0-12b4bf4cd903'::uuid
  AND amount > 0
  AND (
    (date::date = DATE '2026-02-27' AND amount = 26500)
    OR (date::date = DATE '2026-03-11' AND amount = 1800)
    OR (date::date = DATE '2026-03-12' AND amount = 1300)
    OR (date::date = DATE '2026-03-13' AND amount = 2300)
    OR (date::date = DATE '2026-03-18' AND amount = 2500)
    OR (date::date = DATE '2026-03-19' AND amount = 1800)
  );

UPDATE debtors
SET balance = 36200, updated_at = NOW()
WHERE id = '8c7f98a6-a60b-42e4-a5e0-12b4bf4cd903'::uuid;

COMMIT;
*/

-- ========= VERIFICACIÓN =========
-- SELECT balance FROM debtors WHERE id = '8c7f98a6-a60b-42e4-a5e0-12b4bf4cd903'::uuid;
-- → debe ser 36200
--
-- SELECT COUNT(*) AS filas_impagas,
--        COALESCE(SUM(COALESCE(remaining_amount, amount)), 0) AS pendiente
-- FROM debts
-- WHERE debtor_id = '8c7f98a6-a60b-42e4-a5e0-12b4bf4cd903'::uuid
--   AND amount > 0 AND is_paid = false;
-- → 6 filas y pendiente 36200
