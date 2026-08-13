# Chanchi Mercado POS

Sistema web para un comercio de comida: **catálogo público, pedidos, fiados, inventario y panel admin**.

Los clientes pueden pedir desde la web y retirar en el local. La dueña administra ventas, deudas (fiados), abonos y stock sin llevar todo en papel. Incluye mensajes de WhatsApp para pedidos y estados de cuenta.

**Demo:** [chanchi-mercado-pos.vercel.app](https://chanchi-mercado-pos.vercel.app)

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS
- **Supabase** (Postgres + API)
- **Zustand**, Framer Motion, @dnd-kit

## Funcionalidades

- Catálogo público y flujo de pedido
- Admin: inventario, historial, clientes / fiados y abonos
- Checkout con fiado y conciliación de deudas
- Mensajes WhatsApp (pedido / estado de cuenta)
- Auth por PIN de acceso admin

## Requisitos

- Node.js 20+
- Proyecto Supabase (o variables apuntando a uno existente)

## Setup

```bash
npm install
cp .env.example .env.local
# Completa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Ver [`.env.example`](./.env.example).

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `NEXT_PUBLIC_APP_PIN` | PIN del panel admin (opcional; default de desarrollo) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo scripts de migración/admin (no exponer al cliente) |

## Estructura (resumen)

- `app/` — catálogo público y rutas admin
- `components/` — UI, auth, PWA
- `lib/supabase.ts` — cliente Supabase
- `scripts/` — utilidades de sync / diagnóstico (requieren env)

## Nota

Proyecto de producto real orientado a operación de un negocio local. No subas dumps ni backups con datos de clientes al repositorio.
