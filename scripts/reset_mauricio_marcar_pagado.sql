-- Mauricio: saldo 0, todo marcado pagado. No borra filas.
-- id: b75d65c4-ec32-4484-88d7-f7a44bc14d7e

SELECT id, name, balance
FROM debtors
WHERE id = 'b75d65c4-ec32-4484-88d7-f7a44bc14d7e'::uuid;

BEGIN;

SET LOCAL session_replication_role = replica;

UPDATE debts
SET
  is_paid = true,
  remaining_amount = CASE WHEN amount > 0 THEN 0 ELSE remaining_amount END,
  updated_at = NOW()
WHERE debtor_id = 'b75d65c4-ec32-4484-88d7-f7a44bc14d7e'::uuid;

UPDATE debtors
SET balance = 0, updated_at = NOW()
WHERE id = 'b75d65c4-ec32-4484-88d7-f7a44bc14d7e'::uuid;

COMMIT;

