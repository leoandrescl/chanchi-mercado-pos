-- Limpia cuenta de Rene y deja SOLO estas compras (marzo + abril 2026). Total = 7100.
-- Pegar y ejecutar en Supabase → SQL Editor (una vez).
--
-- Borra: debts del deudor + audit_logs de ese cliente (FIADO/ABONOS en historial).
-- Inserta: 7 compras con remaining = amount, is_paid = false.
-- Si un trigger rompe al insertar, esta sesión desactiva triggers con replica (igual que reconcile).

BEGIN;

SET LOCAL session_replication_role = replica;

DELETE FROM audit_logs
WHERE entity_type = 'debtors'
  AND entity_id::text = 'fb511669-ff0a-4e4d-86cc-2a3f1bf2b7db';

DELETE FROM debts
WHERE debtor_id = 'fb511669-ff0a-4e4d-86cc-2a3f1bf2b7db';

INSERT INTO debts (
  debtor_id,
  description,
  amount,
  date,
  created_at,
  remaining_amount,
  is_paid,
  updated_at
)
VALUES
  (
    'fb511669-ff0a-4e4d-86cc-2a3f1bf2b7db',
    'Compra: Frac',
    1200,
    (TIMESTAMP '2026-03-31 12:00:00' AT TIME ZONE 'America/Santiago'),
    (TIMESTAMP '2026-03-31 12:00:00' AT TIME ZONE 'America/Santiago'),
    1200,
    false,
    NOW()
  ),
  (
    'fb511669-ff0a-4e4d-86cc-2a3f1bf2b7db',
    'Compra: Winergy',
    1000,
    (TIMESTAMP '2026-04-02 12:00:00' AT TIME ZONE 'America/Santiago'),
    (TIMESTAMP '2026-04-02 12:00:00' AT TIME ZONE 'America/Santiago'),
    1000,
    false,
    NOW()
  ),
  (
    'fb511669-ff0a-4e4d-86cc-2a3f1bf2b7db',
    'Compra: Turron',
    500,
    (TIMESTAMP '2026-04-06 12:00:00' AT TIME ZONE 'America/Santiago'),
    (TIMESTAMP '2026-04-06 12:00:00' AT TIME ZONE 'America/Santiago'),
    500,
    false,
    NOW()
  ),
  (
    'fb511669-ff0a-4e4d-86cc-2a3f1bf2b7db',
    'Compra: Winergy',
    1000,
    (TIMESTAMP '2026-04-10 12:00:00' AT TIME ZONE 'America/Santiago'),
    (TIMESTAMP '2026-04-10 12:00:00' AT TIME ZONE 'America/Santiago'),
    1000,
    false,
    NOW()
  ),
  (
    'fb511669-ff0a-4e4d-86cc-2a3f1bf2b7db',
    'Compra: Frac',
    1200,
    (TIMESTAMP '2026-04-15 12:00:00' AT TIME ZONE 'America/Santiago'),
    (TIMESTAMP '2026-04-15 12:00:00' AT TIME ZONE 'America/Santiago'),
    1200,
    false,
    NOW()
  ),
  (
    'fb511669-ff0a-4e4d-86cc-2a3f1bf2b7db',
    'Compra: Winergy x1',
    1000,
    (TIMESTAMP '2026-04-21 12:00:00' AT TIME ZONE 'America/Santiago'),
    (TIMESTAMP '2026-04-21 12:00:00' AT TIME ZONE 'America/Santiago'),
    1000,
    false,
    NOW()
  ),
  (
    'fb511669-ff0a-4e4d-86cc-2a3f1bf2b7db',
    'Compra: Frac x1',
    1200,
    (TIMESTAMP '2026-04-22 12:00:00' AT TIME ZONE 'America/Santiago'),
    (TIMESTAMP '2026-04-22 12:00:00' AT TIME ZONE 'America/Santiago'),
    1200,
    false,
    NOW()
  );

UPDATE debtors
SET balance = 7100, updated_at = NOW()
WHERE id = 'fb511669-ff0a-4e4d-86cc-2a3f1bf2b7db';

COMMIT;
