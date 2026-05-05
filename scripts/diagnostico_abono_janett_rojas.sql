-- Janett Rojas — abono falla con "check_balance_positive" / error al actualizar deudas.
-- Caso ya armado con UUIDs reales: **`scripts/fix_janett_rojas_abono_y_trigger.sql`**
-- (corregir abonos negativos mal marcados, cerrar fiados viejos y dejar solo la compra de $1200).
--
-- Pasos en Supabase → SQL Editor:

-- 1) Ubicar deudor
SELECT id, name, balance
FROM debtors
WHERE name ILIKE '%janett%' AND name ILIKE '%rojas%';

-- 2) Reemplazar UUID y revisar compras "abiertas" según la app (FIFO usa estas filas):
-- SELECT id, description, amount, remaining_amount, is_paid, date, created_at
-- FROM debts
-- WHERE debtor_id = 'UUID_DEUDOR'::uuid
-- ORDER BY date ASC, created_at ASC;

-- 3) Buscar inconsistencias típicas que rompen UPDATE o triggers:
--    - is_paid = false pero remaining_amount = 0 (debería ser amount o is_paid = true)
--    - remaining_amount > amount
--    - amount > 0 e is_paid = false inexistente pero debtors.balance > 0

-- ========= Arreglo dato típico (remaining en 0 pero aún "impaga") =========
-- Solo si el paso 2 mostró esa situación en la fila de los $1.200:
/*
BEGIN;
SET LOCAL session_replication_role = replica;

UPDATE debts
SET
  remaining_amount = amount,
  is_paid = false,
  updated_at = NOW()
WHERE id = 'UUID_FILA_COMPRA_1200'::uuid
  AND debtor_id = 'UUID_DEUDOR'::uuid
  AND amount > 0
  AND is_paid = false
  AND (remaining_amount IS NULL OR remaining_amount = 0);

COMMIT;
*/

-- ========= Abono manual (si el trigger sigue bloqueando la app) =========
-- Ajustá UUIDs, monto y fecha. Deja balance en 0 si pagó todo el fiado.
/*
BEGIN;
SET LOCAL session_replication_role = replica;

UPDATE debts
SET remaining_amount = 0, is_paid = true, updated_at = NOW()
WHERE id = 'UUID_FILA_COMPRA_1200'::uuid AND debtor_id = 'UUID_DEUDOR'::uuid;

INSERT INTO debts (debtor_id, description, amount, date, created_at, is_paid, updated_at)
VALUES (
  'UUID_DEUDOR'::uuid,
  'Abono Registrado (ajuste manual SQL)',
  -1200,
  NOW(),
  NOW(),
  true,
  NOW()
);

UPDATE debtors SET balance = 0, updated_at = NOW() WHERE id = 'UUID_DEUDOR'::uuid;

COMMIT;
*/
