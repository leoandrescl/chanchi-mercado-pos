-- Ocho clientes que YA PAGARON: saldo 0, historial de compras y abonos INTACTO.
-- - No borra debts ni audit_logs.
-- - Compras (amount > 0): is_paid = true, remaining_amount = 0 (siguen viéndose en historial).
-- - Movimientos negativos (abonos en tabla debts): is_paid = true.
-- - debtors.balance = 0
--
-- 1) Ejecutá el SELECT de verificación.
-- 2) Si coincide, descomentá BEGIN … COMMIT y ejecutá.

-- ========== Verificación ==========
SELECT id, name, balance
FROM debtors
WHERE id IN (
  '164f58d8-68d2-42ef-9455-8ab257df02c2'::uuid,
  'c85f62aa-4add-4c21-b50e-3a0b7c3ae466'::uuid,
  '93d3f9b7-1326-4c41-82f5-3a4524a5658e'::uuid,
  '9d9cbc5b-bd3e-4aca-a1e3-8a3764a963cb'::uuid,
  '9ff87f4a-b2a3-45e3-a702-05cb358f0446'::uuid,
  'c39d0a26-aceb-44bb-91f8-c9504be0bd8f'::uuid,
  '3d290231-cdc3-41fe-81f9-2af4fc7a6f78'::uuid,
  'ddcce19c-1b1f-4953-9c2d-f9cde64133f5'::uuid
)
ORDER BY name;

/*
-- ========== Marcar todo pagado + saldo 0 (descomentá y ejecutá) ==========

BEGIN;

SET LOCAL session_replication_role = replica;

UPDATE debts
SET
  is_paid = true,
  remaining_amount = CASE WHEN amount > 0 THEN 0 ELSE remaining_amount END,
  updated_at = NOW()
WHERE debtor_id IN (
  '164f58d8-68d2-42ef-9455-8ab257df02c2'::uuid,
  'c85f62aa-4add-4c21-b50e-3a0b7c3ae466'::uuid,
  '93d3f9b7-1326-4c41-82f5-3a4524a5658e'::uuid,
  '9d9cbc5b-bd3e-4aca-a1e3-8a3764a963cb'::uuid,
  '9ff87f4a-b2a3-45e3-a702-05cb358f0446'::uuid,
  'c39d0a26-aceb-44bb-91f8-c9504be0bd8f'::uuid,
  '3d290231-cdc3-41fe-81f9-2af4fc7a6f78'::uuid,
  'ddcce19c-1b1f-4953-9c2d-f9cde64133f5'::uuid
);

UPDATE debtors
SET balance = 0, updated_at = NOW()
WHERE id IN (
  '164f58d8-68d2-42ef-9455-8ab257df02c2'::uuid,
  'c85f62aa-4add-4c21-b50e-3a0b7c3ae466'::uuid,
  '93d3f9b7-1326-4c41-82f5-3a4524a5658e'::uuid,
  '9d9cbc5b-bd3e-4aca-a1e3-8a3764a963cb'::uuid,
  '9ff87f4a-b2a3-45e3-a702-05cb358f0446'::uuid,
  'c39d0a26-aceb-44bb-91f8-c9504be0bd8f'::uuid,
  '3d290231-cdc3-41fe-81f9-2af4fc7a6f78'::uuid,
  'ddcce19c-1b1f-4953-9c2d-f9cde64133f5'::uuid
);

COMMIT;

*/
