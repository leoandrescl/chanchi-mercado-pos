# Reset de cuenta de un deudor (SQL en Supabase)

Cuando un cliente quede con **saldo incoherente** respecto a las líneas en `debts`, o quieras **dejar solo un conjunto conocido de compras** y un saldo fijo, podés usar este flujo en **Supabase → SQL Editor**.

Antes de borrar nada: si podés, **exportá o anotá** el estado actual (`debts` + `audit_logs` de ese `debtor_id`) por si necesitás revertir a mano.

---

## Opción A — Solo alinear filas con el saldo (FIFO, no borra historial)

Si el **`debtors.balance` ya es el correcto** y solo querés que las filas `debts` sumen igual que ese saldo:

1. Ajustá el saldo si hace falta:
   ```sql
   UPDATE debtors SET balance = <MONTO_CLP> WHERE id = '<UUID_DEUDOR>';
   ```
2. Ejecutá el bloque de **`scripts/reconcile_debtor_supabase.sql`** (cambiá `d_id` dentro del `DO $$` por el UUID del cliente).

Usa `session_replication_role = replica` para no disparar triggers que rompan el `CHECK` en `debtors`.

---

## Opción B — Reset duro: borrar todo y cargar solo las compras que definas

Útil cuando querés **eliminar meses viejos, abonos viejos y auditoría** de ese cliente y dejar **solo** una lista de compras + un saldo total.

### Pasos

1. Reemplazá en todo el script:
   - `'<UUID_DEUDOR>'` → UUID del cliente (ej. desde la tabla `debtors`).
   - Los bloques `INSERT` → una fila por compra real: `description` tipo `Compra: …`, `amount` en CLP, `date` / `created_at` coherentes (orden FIFO = orden por `date`, `created_at`).

2. Calculá **`balance`** = suma de los `amount` que insertás (o el saldo oficial que quieras mostrar).

3. Ejecutá **una sola vez** el SQL completo dentro de `BEGIN` … `COMMIT`.

### Plantilla (copiar, reemplazar y pegar en Supabase)

```sql
-- === CONFIGURACIÓN (editar solo esto) ===
-- UUID del deudor:
-- Saldo final que debe quedar en pantalla (= suma de las compras que insertes, salvo que ajustes a mano):

BEGIN;

SET LOCAL session_replication_role = replica;

DELETE FROM audit_logs
WHERE entity_type = 'debtors'
  AND entity_id::text = 'REEMPLAZAR_UUID_DEUDOR';

DELETE FROM debts
WHERE debtor_id = 'REEMPLAZAR_UUID_DEUDOR'::uuid;

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
    'REEMPLAZAR_UUID_DEUDOR'::uuid,
    'Compra: Ejemplo producto',
    1000,
    (TIMESTAMP '2026-04-01 12:00:00' AT TIME ZONE 'America/Santiago'),
    (TIMESTAMP '2026-04-01 12:00:00' AT TIME ZONE 'America/Santiago'),
    1000,
    false,
    NOW()
  )
  -- Agregar más tuplas VALUES separadas por coma...
;

UPDATE debtors
SET balance = 1000, updated_at = NOW()   -- mismo total que la suma de amount insertados
WHERE id = 'REEMPLAZAR_UUID_DEUDOR'::uuid;

COMMIT;
```

**Notas:**

- Fechas: conviene usar **`AT TIME ZONE 'America/Santiago'`** para que marzo/abril y el POS coincidan con Chile.
- `remaining_amount` debe ser igual al `amount` de cada compra si todo queda pendiente; `is_paid = false`.
- Si `audit_logs.entity_id` no acepta `::text`, probá borrar con  
  `entity_id = 'REEMPLAZAR_UUID_DEUDOR'::uuid`.
- Ejemplo completo ya armado para un caso real: **`scripts/reset_rene_mar_abr_2026.sql`** (solo sirve como referencia; copiá y adaptá UUID + filas + `balance`).

---

## Comprobación rápida

```sql
SELECT balance FROM debtors WHERE id = '<UUID>'::uuid;

SELECT id, description, amount, remaining_amount, is_paid, date
FROM debts
WHERE debtor_id = '<UUID>'::uuid
ORDER BY date, created_at;
```

---

## Archivos relacionados en el repo

| Archivo | Uso |
|---------|-----|
| `scripts/reconcile_debtor_supabase.sql` | Reparte el `balance` actual en FIFO sobre `debts` (no borra historial). |
| `scripts/reset_rene_mar_abr_2026.sql` | Ejemplo de reset total + 7 compras marzo–abril 2026 (referencia). |
| `scripts/reconcile_debtor.mjs` | Misma lógica FIFO vía API (puede fallar si hay triggers; preferir SQL con `replica`). |
