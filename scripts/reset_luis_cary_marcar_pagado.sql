-- Luis Cary: dejar cuenta en 0 manteniendo historial (no borra filas).
-- Caso: abonó total (32100) pero quedó saldo 3300.
--
-- Flujo recomendado en Supabase SQL Editor:
-- 1) Ejecutá primero los SELECT de diagnóstico.
-- 2) Confirmá UUID correcto (si hay más de un "Luis"/"Cary").
-- 3) Reemplazá UUID_LUIS_CARY en el bloque BEGIN...COMMIT y ejecutá.

-- ========== DIAGNÓSTICO ==========
SELECT id, name, balance
FROM debtors
WHERE name ILIKE '%luis%'
  AND name ILIKE '%cary%'
ORDER BY name;

-- Reemplazá UUID_LUIS_CARY para revisar su historial:
-- SELECT id, description, amount, remaining_amount, is_paid, date, created_at
-- FROM debts
-- WHERE debtor_id = 'UUID_LUIS_CARY'::uuid
-- ORDER BY date ASC, created_at ASC;

-- Saldo pendiente real según FIFO (debería ser 0 tras el fix):
-- SELECT COALESCE(SUM(COALESCE(remaining_amount, amount)),0) AS saldo_real
-- FROM debts
-- WHERE debtor_id = 'UUID_LUIS_CARY'::uuid
--   AND amount > 0
--   AND is_paid = false;

/*
-- ========== FIX: TODO PAGADO + SALDO 0 ==========
BEGIN;

SET LOCAL session_replication_role = replica;

UPDATE debts
SET
  is_paid = true,
  remaining_amount = CASE WHEN amount > 0 THEN 0 ELSE 0 END,
  updated_at = NOW()
WHERE debtor_id = 'UUID_LUIS_CARY'::uuid;

UPDATE debtors
SET balance = 0, updated_at = NOW()
WHERE id = 'UUID_LUIS_CARY'::uuid;

COMMIT;
*/

-- ========== VERIFICACIÓN FINAL ==========
-- SELECT id, name, balance FROM debtors WHERE id = 'UUID_LUIS_CARY'::uuid;
-- SELECT id, description, amount, remaining_amount, is_paid
-- FROM debts
-- WHERE debtor_id = 'UUID_LUIS_CARY'::uuid
-- ORDER BY date ASC, created_at ASC;
