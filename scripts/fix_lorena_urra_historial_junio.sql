-- Lorena urra veston — mover los $13.200 pendientes de nov-2025 → compras jun-2026
-- UUID deudor: 29acbd27-0770-495f-b6c0-59eebd010ed4
--
-- Problema: el script anterior repartió el saldo desde la compra MÁS ANTIGUA (nov 2025),
-- por eso en historial aparece "Varios mes de noviembre" con Pago Parcial.
-- Solución: cerrar noviembre y dejar el pendiente en las compras reales de junio 2026.
--
-- Supabase → SQL Editor → Run

BEGIN;

SET LOCAL session_replication_role = replica;

-- Saldo en pantalla (sin cambio)
UPDATE debtors
SET balance = 13200, updated_at = NOW()
WHERE id = '29acbd27-0770-495f-b6c0-59eebd010ed4'::uuid;

-- 1) Cerrar noviembre 2025 (ya no debe aparecer como pendiente)
UPDATE debts
SET remaining_amount = 0, is_paid = true, updated_at = NOW()
WHERE id = '0c3324f8-ef44-46f8-a26c-660b6e6f7e2a'::uuid
  AND debtor_id = '29acbd27-0770-495f-b6c0-59eebd010ed4'::uuid;

-- 2) Abrir compras de junio 2026 (cola real del fiado: 10.500 + 1.000 + 1.200 + 500 = 13.200)
UPDATE debts
SET remaining_amount = 10500, is_paid = false, updated_at = NOW()
WHERE id = 'b0a16e55-8467-4e19-8e85-210e875dbe0e'::uuid
  AND debtor_id = '29acbd27-0770-495f-b6c0-59eebd010ed4'::uuid;

UPDATE debts
SET remaining_amount = 1000, is_paid = false, updated_at = NOW()
WHERE id = '02d6a1e4-13b5-4684-8521-1da8dc12b705'::uuid
  AND debtor_id = '29acbd27-0770-495f-b6c0-59eebd010ed4'::uuid;

UPDATE debts
SET remaining_amount = 1200, is_paid = false, updated_at = NOW()
WHERE id = '2f6bbd34-d984-43a9-87b5-6320014ab07e'::uuid
  AND debtor_id = '29acbd27-0770-495f-b6c0-59eebd010ed4'::uuid;

UPDATE debts
SET remaining_amount = 500, is_paid = false, updated_at = NOW()
WHERE id = '58c1ea97-9cc6-496a-a393-012aad5fc664'::uuid
  AND debtor_id = '29acbd27-0770-495f-b6c0-59eebd010ed4'::uuid;

COMMIT;

-- Verificación:
-- SELECT balance FROM debtors WHERE id = '29acbd27-0770-495f-b6c0-59eebd010ed4'::uuid;
--   → 13200
--
-- SELECT date::date, amount, remaining_amount, is_paid, description
-- FROM debts
-- WHERE debtor_id = '29acbd27-0770-495f-b6c0-59eebd010ed4'::uuid
--   AND amount > 0 AND is_paid = false
-- ORDER BY date;
--   → 4 filas de junio 2026, suma remaining = 13200
--
-- SELECT amount, remaining_amount, is_paid FROM debts
-- WHERE id = '0c3324f8-ef44-46f8-a26c-660b6e6f7e2a'::uuid;
--   → remaining 0, is_paid true
