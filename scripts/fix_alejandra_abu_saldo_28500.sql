-- Alejandra Abu — caso real (may 2026)
--
-- Qué muestra tu export:
-- - Suma de `amount` de compras con is_paid = false ≈ 29.100 (bruto de esas líneas).
-- - Suma de `remaining_amount` de las mismas ≈ 28.500 (600 ya descontados en la línea
--   "Score+ 2 empanadas": amount 2500 → remaining 1900).
-- - El abono `Abono Registrado — Abono al mes de abril` = -20.000 está bien.
--
-- Si en la app ves 29.100, casi seguro `debtors.balance` quedó igual a la suma de *amount*
-- abiertos o desincronizado; no hace falta retocar compras ni el abono.
--
-- Supabase → SQL Editor: primero diagnóstico, después FIX (solo si debtors.balance ≠ saldo real).
--
-- OJO: ver dos números distintos (29100 vs 28500) en el diagnóstico NO es un bug de datos.
-- - 29100 = suma de `amount` de compras abiertas (valor “de ticket”, sin reflejar abonos parciales).
-- - 28500 = suma de `remaining_amount` = lo que realmente debe el cliente = lo que debe mostrar la app.
-- No intentes “igualar” el 29100 al 28500 tocando `amount` de las compras: romperías el historial.
-- La diferencia (600) es la línea parcial Score+ 2 empanadas (2500 de monto, 1900 pendientes).

-- ========= DIAGNÓSTICO (cualquier id de una fila de este cliente sirve de ancla) =========
-- Ancla: primera compra abierta del listado original
-- 9930b423-56f8-4c11-ad4a-04fbd3b669ef

SELECT d.id AS debtor_id, d.name, d.balance AS balance_en_debtors
FROM debtors d
WHERE d.id = (SELECT debtor_id FROM debts WHERE id = '9930b423-56f8-4c11-ad4a-04fbd3b669ef'::uuid);

-- Esta es la única suma que importa para fiado / POS (comparala con debtors.balance):
SELECT
  SUM(COALESCE(remaining_amount, amount)) FILTER (
    WHERE amount > 0 AND is_paid = false
  ) AS saldo_pendiente_real_debe_coincidir_con_app
FROM debts
WHERE debtor_id = (SELECT debtor_id FROM debts WHERE id = '9930b423-56f8-4c11-ad4a-04fbd3b669ef'::uuid);

-- Opcional (dejar comentado): suma de `amount` abierto — NO es el fiado; la app usa remaining/balance.
-- Si lo corrés y da 29100 con la app en 28500, está bien (abono parcial en una línea).
/*
SELECT
  SUM(amount) FILTER (WHERE amount > 0 AND is_paid = false) AS solo_curiosidad_no_comparar_con_la_app
FROM debts
WHERE debtor_id = (SELECT debtor_id FROM debts WHERE id = '9930b423-56f8-4c11-ad4a-04fbd3b669ef'::uuid);
*/

-- ========= FIX: alinear debtors.balance al total real pendiente (suma remaining) =========
BEGIN;

SET LOCAL session_replication_role = replica;

UPDATE debtors d
SET
  balance = sub.saldo,
  updated_at = NOW()
FROM (
  SELECT
    debtor_id,
    SUM(COALESCE(remaining_amount, amount))::integer AS saldo
  FROM debts
  WHERE debtor_id = (SELECT debtor_id FROM debts WHERE id = '9930b423-56f8-4c11-ad4a-04fbd3b669ef'::uuid)
    AND amount > 0
    AND is_paid = false
  GROUP BY debtor_id
) sub
WHERE d.id = sub.debtor_id;

-- Opcional: el abono del 4 may tiene remaining_amount NULL; dejarlo en 0 por consistencia.
UPDATE debts
SET remaining_amount = 0, updated_at = NOW()
WHERE id = 'eff454a1-7761-4544-b593-33500e79edc7'::uuid
  AND amount < 0
  AND remaining_amount IS NULL;

COMMIT;

-- ========= VERIFICACIÓN =========
-- SELECT balance FROM debtors
-- WHERE id = (SELECT debtor_id FROM debts WHERE id = '9930b423-56f8-4c11-ad4a-04fbd3b669ef'::uuid);
