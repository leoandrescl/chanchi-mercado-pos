-- Carla Contreras — Total Fiado fantasma $750 (debería ser $0)
-- UUID: cfab64ea-da22-4404-9309-0de9d445d065
--
-- Causa típica: debtors.balance quedó desfasado del trigger legacy vs
-- remaining_amount / is_paid tras abonos o borrados del historial.
--
-- Supabase → SQL Editor → ejecutar DIAGNÓSTICO, luego FIX.

-- ========== DIAGNÓSTICO ==========
SELECT id, name, phone, balance, updated_at
FROM debtors
WHERE id = 'cfab64ea-da22-4404-9309-0de9d445d065'::uuid
   OR (name ILIKE '%carla%' AND name ILIKE '%contreras%');

SELECT
  d.balance AS balance_ui,
  COALESCE(SUM(COALESCE(dt.remaining_amount, dt.amount)) FILTER (
    WHERE dt.amount > 0 AND dt.is_paid = false
  ), 0) AS suma_remaining_impagas,
  d.balance - COALESCE(SUM(COALESCE(dt.remaining_amount, dt.amount)) FILTER (
    WHERE dt.amount > 0 AND dt.is_paid = false
  ), 0) AS diferencia
FROM debtors d
LEFT JOIN debts dt ON dt.debtor_id = d.id
WHERE d.id = 'cfab64ea-da22-4404-9309-0de9d445d065'::uuid
GROUP BY d.id, d.balance;

SELECT id, date::date, description, amount, remaining_amount, is_paid, created_at
FROM debts
WHERE debtor_id = 'cfab64ea-da22-4404-9309-0de9d445d065'::uuid
ORDER BY date ASC, created_at ASC;

-- ========== FIX: historial cerrado + saldo 0 ==========
BEGIN;

SET LOCAL session_replication_role = replica;

UPDATE debts
SET
  is_paid = true,
  remaining_amount = 0,
  updated_at = NOW()
WHERE debtor_id = 'cfab64ea-da22-4404-9309-0de9d445d065'::uuid
  AND (
    amount < 0
    OR is_paid = false
    OR COALESCE(remaining_amount, 0) <> 0
  );

UPDATE debtors
SET
  balance = 0,
  updated_at = NOW()
WHERE id = 'cfab64ea-da22-4404-9309-0de9d445d065'::uuid;

COMMIT;

-- Verificación:
-- SELECT name, balance FROM debtors WHERE id = 'cfab64ea-da22-4404-9309-0de9d445d065'::uuid;
-- → Carla Contreras, 0
