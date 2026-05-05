-- Janett Rojas — check_balance_positive al abonar SIN tocar Supabase antes.
--
-- Causa:
-- 1) Filas de ABONO (amount < 0) mal migradas con is_paid = false y remaining_amount negativo.
--    El trigger que recalcula debtors.balance las cuenta mal y el saldo puede ir < 0 → CHECK violado.
-- 2) Varios fiados viejos siguen "abiertos" (Coca + empanadas) pero debtors.balance = 1200 solo refleja
--    la última compra; FIFO intenta pagar primero la Coca y el trigger explota.
-- 3) Fila "Abono Registrado -1200" (814fcad7) probablemente quedó de un intento fallido: la compra sigue con 1200.
--
-- Resultado deseado: saldo 1200 solo en Compra Empanada Queso x2, poder abonar desde la app y quedar en 0.

BEGIN;

SET LOCAL session_replication_role = replica;

-- Deudor (por si referenciás desde otro lado)
-- aa2473ae-29b5-4091-9bea-20aa3274526c

-- Quitar abono huérfano del intento fallido (la app volverá a registrar el abono bien).
DELETE FROM debts
WHERE id = '814fcad7-c854-4eec-bf24-65322c0e3ba2'::uuid
  AND debtor_id = 'aa2473ae-29b5-4091-9bea-20aa3274526c'::uuid;

-- Todo movimiento negativo (abono / pago total en tabla debts) debe estar cerrado y sin remaining raro.
UPDATE debts
SET
  is_paid = true,
  remaining_amount = 0,
  updated_at = NOW()
WHERE debtor_id = 'aa2473ae-29b5-4091-9bea-20aa3274526c'::uuid
  AND amount < 0;

-- Cerrar fiados viejos que ya no forman parte del saldo de 1200 (solo historial).
UPDATE debts
SET
  is_paid = true,
  remaining_amount = 0,
  updated_at = NOW()
WHERE debtor_id = 'aa2473ae-29b5-4091-9bea-20aa3274526c'::uuid
  AND id IN (
    'cc170eb8-e6ed-4f88-ae4f-088d63d12a9b'::uuid,
    'ec496746-d461-4f07-98d5-d424ab7aa803'::uuid,
    '2161e308-cb4b-4e58-bd9f-0886bff4e45e'::uuid
  );

-- Única deuda abierta: compra abr 2026
UPDATE debts
SET
  remaining_amount = 1200,
  is_paid = false,
  updated_at = NOW()
WHERE id = 'dd91f444-e950-4038-93ab-5555d5a13e42'::uuid
  AND debtor_id = 'aa2473ae-29b5-4091-9bea-20aa3274526c'::uuid;

UPDATE debtors
SET balance = 1200, updated_at = NOW()
WHERE id = 'aa2473ae-29b5-4091-9bea-20aa3274526c'::uuid;

COMMIT;

-- Verificación (ejecutar después):
-- SELECT balance FROM debtors WHERE id = 'aa2473ae-29b5-4091-9bea-20aa3274526c'::uuid;
-- SELECT id, description, amount, remaining_amount, is_paid
-- FROM debts
-- WHERE debtor_id = 'aa2473ae-29b5-4091-9bea-20aa3274526c'::uuid
-- ORDER BY date, created_at;
