# AutonorteSJ

Proyecto Next.js preparado para desplegar la UI en Cloudflare Pages y usar
Supabase como backend externo.

## Stack actual

- Next.js 16
- Supabase
  - Auth para acceso al panel
  - Postgres como base de datos
  - Edge Functions para operaciones privilegiadas del admin
- Cloudinary para imagenes

## Variables de entorno del frontend

Copiar `.env.example` y completar:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

## Supabase

El repo incluye:

- `supabase/migrations/20260423223000_cloudflare_pages_supabase.sql`
- `supabase/functions/admin-users`
- `supabase/functions/admin-vehicles`
- `supabase/functions/vehicle-images`
- `supabase/functions/vehicle-restore-points`

### Secrets esperados en Edge Functions

Configurar en Supabase Functions:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Desarrollo local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Con `output: "export"`, Next genera el sitio listo para hosting estatico en:

```bash
out/
```

## Flujo de deploy recomendado

1. Deploy del frontend en Cloudflare Pages.
2. Ejecutar la migracion SQL en Supabase.
3. Deploy de las Edge Functions de Supabase.
4. Cargar variables del frontend en Cloudflare Pages.

### Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `out`

### Supabase CLI

```bash
supabase db push
supabase functions deploy admin-users
supabase functions deploy admin-vehicles
supabase functions deploy vehicle-images
supabase functions deploy vehicle-restore-points
```

## Nota de arquitectura

La app ya no usa Prisma, NextAuth ni API routes de Next. Las consultas publicas
y del panel leen desde Supabase, y las operaciones privilegiadas del admin se
resuelven con Edge Functions.
