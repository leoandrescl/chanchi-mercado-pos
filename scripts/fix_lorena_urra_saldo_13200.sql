-- Lorena urra veston → Total Fiado = 13.200 (33.200 − 20.000 abono del 27-jun-2026)
-- UUID: 29acbd27-0770-495f-b6c0-59eebd010ed4
--
-- ⚠️ NO uses el bloque DO $$ FIFO de abajo: deja el pendiente en compras viejas (nov 2025).
-- Usa en su lugar: scripts/fix_lorena_urra_historial_junio.sql
--
-- Pegar en Supabase → SQL Editor → Run

BEGIN;

SET LOCAL session_replication_role = replica;

UPDATE debtors
SET balance = 13200, updated_at = NOW()
WHERE id = '29acbd27-0770-495f-b6c0-59eebd010ed4'::uuid;

-- Ver scripts/fix_lorena_urra_historial_junio.sql para alinear filas jun-2026

COMMIT;
