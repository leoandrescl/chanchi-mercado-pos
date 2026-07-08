-- Clara — alinear Total Fiado con deuda real tras abono de $20.000
-- UUID: d770488d-a87a-45cd-84ed-38f798535bb4
--
-- Situación (07-jul-2026):
--   Tenía ~$58.750 → abonó $20.000 → debe quedar $38.750
--   debtors.balance muestra $40.850 (+$2.100 de más)
--   Suma remaining en compras impagas = $38.750 (correcto)
--
-- Causa: mismo desfase trigger vs registerAbono que Lorena (solo balance, filas OK).
-- Supabase → SQL Editor → Run

BEGIN;

SET LOCAL session_replication_role = replica;

UPDATE debtors
SET
  balance = (
    SELECT COALESCE(SUM(COALESCE(remaining_amount, amount)), 0)
    FROM debts
    WHERE debtor_id = 'd770488d-a87a-45cd-84ed-38f798535bb4'::uuid
      AND amount > 0
      AND is_paid = false
  ),
  updated_at = NOW()
WHERE id = 'd770488d-a87a-45cd-84ed-38f798535bb4'::uuid;

COMMIT;

-- Verificación:
-- SELECT name, balance FROM debtors WHERE id = 'd770488d-a87a-45cd-84ed-38f798535bb4'::uuid;
--   → Clara, 38750
--
-- SELECT COALESCE(SUM(COALESCE(remaining_amount, amount)), 0) AS suma
-- FROM debts
-- WHERE debtor_id = 'd770488d-a87a-45cd-84ed-38f798535bb4'::uuid
--   AND amount > 0 AND is_paid = false;
--   → 38750
