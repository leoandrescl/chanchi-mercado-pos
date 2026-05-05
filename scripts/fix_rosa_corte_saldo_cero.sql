-- Rosa Corte: debía 7.400, abonó 7.400, pero quedó saldo 200.
-- Objetivo: dejar saldo en 0 y TODO el historial marcado pagado (sin borrar filas).
--
-- Uso en Supabase SQL Editor:
-- 1) Ejecutar DIAGNÓSTICO para obtener UUID correcto.
-- 2) Reemplazar UUID_ROSA_CORTE en el bloque FIX.
-- 3) Ejecutar bloque FIX completo.

-- ========== DIAGNÓSTICO ==========
SELECT id, name, balance, updated_at
FROM debtors
WHERE name ILIKE '%rosa%'
  AND name ILIKE '%corte%'
ORDER BY name;

-- Revisar historial del cliente (reemplazar UUID_ROSA_CORTE):
-- SELECT id, description, amount, remaining_amount, is_paid, date, created_at
-- FROM debts
-- WHERE debtor_id = 'UUID_ROSA_CORTE'::uuid
-- ORDER BY date ASC, created_at ASC;

-- Ver pendientes reales (si todo está bien tras el fix, debe dar 0):
-- SELECT COALESCE(SUM(COALESCE(remaining_amount, amount)), 0) AS saldo_real_pendiente
-- FROM debts
-- WHERE debtor_id = 'UUID_ROSA_CORTE'::uuid
--   AND amount > 0
--   AND is_paid = false;

/*
-- ========== FIX: TODO PAGADO + SALDO 0 ==========
BEGIN;

SET LOCAL session_replication_role = replica;

-- Historial consistente:
-- - compras (amount > 0): pagadas y remaining=0
-- - abonos/movimientos negativos (amount < 0): cerrados y remaining=0
UPDATE debts
SET
  is_paid = true,
  remaining_amount = 0,
  updated_at = NOW()
WHERE debtor_id = 'UUID_ROSA_CORTE'::uuid;

UPDATE debtors
SET
  balance = 0,
  updated_at = NOW()
WHERE id = 'UUID_ROSA_CORTE'::uuid;

COMMIT;
*/

-- ========== VERIFICACIÓN FINAL ==========
-- SELECT id, name, balance, updated_at
-- FROM debtors
-- WHERE id = 'UUID_ROSA_CORTE'::uuid;
--
-- SELECT
--   COALESCE(SUM(COALESCE(remaining_amount, amount)), 0) AS saldo_real_pendiente
-- FROM debts
-- WHERE debtor_id = 'UUID_ROSA_CORTE'::uuid
--   AND amount > 0
--   AND is_paid = false;
--
-- SELECT id, description, amount, remaining_amount, is_paid
-- FROM debts
-- WHERE debtor_id = 'UUID_ROSA_CORTE'::uuid
-- ORDER BY date ASC, created_at ASC;
