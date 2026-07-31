-- Marcelo — diagnóstico saldo tras abono de $15.000
-- UUID: 7cd98059-0d1f-4bd9-bb48-6b1f5de4f5c9
-- Esperado (negocio): ~$33.xxx − $15.000 ≈ $18.000
-- UI reportada: $29.950
--
-- Supabase → SQL Editor → correr TODO este archivo y pegar resultados.

-- 1) Cliente
SELECT id, name, phone, balance, updated_at
FROM debtors
WHERE id = '7cd98059-0d1f-4bd9-bb48-6b1f5de4f5c9'::uuid
   OR name ILIKE '%marcelo%'
ORDER BY name;

-- 2) Balance vs suma real pendiente
SELECT
  d.balance AS balance_ui,
  COALESCE(SUM(COALESCE(dt.remaining_amount, dt.amount)) FILTER (
    WHERE dt.amount > 0 AND dt.is_paid = false
  ), 0) AS suma_remaining_impagas,
  d.balance - COALESCE(SUM(COALESCE(dt.remaining_amount, dt.amount)) FILTER (
    WHERE dt.amount > 0 AND dt.is_paid = false
  ), 0) AS diferencia
FROM debtors d
LEFT JOIN debts dt ON dt.debtor_id = d.id
WHERE d.id = '7cd98059-0d1f-4bd9-bb48-6b1f5de4f5c9'::uuid
GROUP BY d.id, d.balance;

-- 3) Abonos recientes (hoy / últimos)
SELECT id, date, description, amount, remaining_amount, is_paid, created_at
FROM debts
WHERE debtor_id = '7cd98059-0d1f-4bd9-bb48-6b1f5de4f5c9'::uuid
  AND amount < 0
ORDER BY date DESC, created_at DESC
LIMIT 10;

-- 4) Compras IMPAGAS (lo que debería explicar el Total Fiado)
SELECT id, date::date, description, amount, remaining_amount, is_paid, created_at
FROM debts
WHERE debtor_id = '7cd98059-0d1f-4bd9-bb48-6b1f5de4f5c9'::uuid
  AND amount > 0
  AND is_paid = false
ORDER BY date ASC, created_at ASC;

-- 5) Últimos 30 movimientos (completo)
SELECT id, date::date, description, amount, remaining_amount, is_paid, created_at
FROM debts
WHERE debtor_id = '7cd98059-0d1f-4bd9-bb48-6b1f5de4f5c9'::uuid
ORDER BY date DESC, created_at DESC
LIMIT 30;
