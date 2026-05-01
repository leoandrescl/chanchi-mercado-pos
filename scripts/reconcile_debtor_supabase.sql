-- Reconciliar filas debts (FIFO) con debtors.balance SIN disparar triggers de fiado.
-- Pegá esto en Supabase → SQL Editor (suele correr como postgres).
-- 1) Cambiá el UUID si es otro cliente.
-- 2) Asegurate antes: UPDATE debtors SET balance = 7100 WHERE id = '...';

BEGIN;

SET LOCAL session_replication_role = replica;

DO $$
DECLARE
  d_id uuid := 'fb511669-ff0a-4e4d-86cc-2a3f1bf2b7db';
  pool integer;
  r record;
  new_r integer;
BEGIN
  SELECT COALESCE(balance, 0) INTO pool FROM debtors WHERE id = d_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deudor % no existe', d_id;
  END IF;
  pool := GREATEST(0, pool);

  FOR r IN
    SELECT id, amount
    FROM debts
    WHERE debtor_id = d_id AND amount > 0
    ORDER BY date ASC, created_at ASC
  LOOP
    IF pool <= 0 THEN
      UPDATE debts SET remaining_amount = 0, is_paid = true WHERE id = r.id;
    ELSE
      new_r := LEAST(r.amount, pool);
      pool := pool - new_r;
      UPDATE debts SET remaining_amount = new_r, is_paid = (new_r = 0) WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

COMMIT;

-- session_replication_role vuelve al valor por defecto al terminar la sesión/transacción según versión;
-- Si tu rol no permite SET session_replication_role, en Dashboard → Database → Triggers
-- deshabilitá temporalmente el trigger en `debts` que actualiza `debtors`, ejecutá la lógica del DO
-- (sin las dos líneas SET LOCAL / BEGIN relacionadas a replica) y volvé a habilitar el trigger.
