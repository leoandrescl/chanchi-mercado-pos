-- Lorena urra veston — diagnóstico y corrección de saldo
-- UUID: 29acbd27-0770-495f-b6c0-59eebd010ed4
--
-- Síntoma: Total Fiado en app ≠ lo que debería quedar tras abono.
-- Ejemplo: tenía ~33.200, abonó 20.000 → debería ~13.200, app muestra 22.100.
--
-- Causa habitual (NO es el filtro WhatsApp — ese solo cambia el texto del mensaje):
--   debtors.balance desincronizado vs suma real de remaining en compras impagas (trigger legacy).

-- ========= 1) UUID y saldo en pantalla =========
SELECT id, name, phone, balance, updated_at
FROM debtors
WHERE id = '29acbd27-0770-495f-b6c0-59eebd010ed4'::uuid;

-- ========= 2) Saldo REAL (suma remaining de compras abiertas) =========
SELECT
  COALESCE(SUM(COALESCE(remaining_amount, amount)), 0) AS saldo_real_pendiente,
  COUNT(*) AS filas_impagas
FROM debts
WHERE debtor_id = '29acbd27-0770-495f-b6c0-59eebd010ed4'::uuid
  AND amount > 0
  AND is_paid = false;

-- ========= 3) Comparar balance vs saldo real =========
SELECT
  d.balance AS balance_en_ui,
  COALESCE(SUM(COALESCE(dt.remaining_amount, dt.amount)), 0) AS suma_remaining_impagas,
  d.balance - COALESCE(SUM(COALESCE(dt.remaining_amount, dt.amount)), 0) AS diferencia
FROM debtors d
LEFT JOIN debts dt
  ON dt.debtor_id = d.id
  AND dt.amount > 0
  AND dt.is_paid = false
WHERE d.id = '29acbd27-0770-495f-b6c0-59eebd010ed4'::uuid
GROUP BY d.id, d.balance;

-- ========= 4) Compras impagas (FIFO las usa al abonar) =========
SELECT
  id,
  date::date AS fecha,
  amount,
  remaining_amount,
  is_paid,
  LEFT(description, 60) AS descripcion
FROM debts
WHERE debtor_id = '29acbd27-0770-495f-b6c0-59eebd010ed4'::uuid
  AND amount > 0
  AND is_paid = false
ORDER BY date ASC, created_at ASC;

-- ========= 5) Abonos registrados =========
SELECT
  id,
  date::date AS fecha,
  amount,
  remaining_amount,
  is_paid,
  description
FROM debts
WHERE debtor_id = '29acbd27-0770-495f-b6c0-59eebd010ed4'::uuid
  AND amount < 0
ORDER BY date DESC, created_at DESC
LIMIT 10;

-- ========= 6) Inconsistencias típicas =========
SELECT id, description, amount, remaining_amount, is_paid, date
FROM debts
WHERE debtor_id = '29acbd27-0770-495f-b6c0-59eebd010ed4'::uuid
  AND (
    (amount > 0 AND is_paid = false AND COALESCE(remaining_amount, amount) <= 0)
    OR (amount > 0 AND remaining_amount > amount)
    OR (amount < 0 AND is_paid = false)
    OR (amount < 0 AND remaining_amount IS NOT NULL AND remaining_amount <> 0)
  );

-- ========= FIX (solo si diferencia ≠ 0 y el paso 4 cuadra con lo que debe deber) =========
-- Al 27-jun-2026 el saldo real por remaining era ~12.850 (4 compras de junio).
-- Ajustá el número si tu paso 2 da otro valor hoy.
/*
BEGIN;
SET LOCAL session_replication_role = replica;

UPDATE debtors
SET
  balance = (
    SELECT COALESCE(SUM(COALESCE(remaining_amount, amount)), 0)
    FROM debts
    WHERE debtor_id = '29acbd27-0770-495f-b6c0-59eebd010ed4'::uuid
      AND amount > 0
      AND is_paid = false
  ),
  updated_at = NOW()
WHERE id = '29acbd27-0770-495f-b6c0-59eebd010ed4'::uuid;

COMMIT;
*/

-- Verificación post-fix:
-- SELECT balance FROM debtors WHERE id = '29acbd27-0770-495f-b6c0-59eebd010ed4'::uuid;
