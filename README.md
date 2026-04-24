# AutonorteSJ

Proyecto Next.js 16 preparado para desplegarse como sitio estatico en
Cloudflare Pages y usar Supabase como backend externo.

## Stack actual

- Next.js 16
- Supabase
  - Auth para acceso al panel
  - Postgres como base de datos
  - Edge Functions para operaciones privilegiadas del admin
- Cloudinary para imagenes

## Objetivo de deploy

Este repo esta configurado para `output: "export"`, asi que el target correcto
es Cloudflare Pages con el preset `Next.js (Static HTML Export)`.

Si mas adelante necesitas SSR, middleware, server actions o cualquier feature
que requiera servidor, ahi conviene migrar a Cloudflare Workers con OpenNext.
Con la configuracion actual no hace falta.

## Variables de entorno del frontend

Copiar `.env.example` y completar como minimo:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ADMIN_AUTH_EMAIL_DOMAIN=autonortesj-admin.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

Tambien puedes definir las variables publicas de contacto, horarios y redes
sociales incluidas en `.env.example`. Si faltan, el sitio usa valores fallback.

## Bootstrap del superadmin

Las variables `AUTH_ADMIN_USER` y `AUTH_ADMIN_PASSWORD` no las usa el frontend.
Sirven para crear o reparar el superadmin inicial dentro de Supabase Auth y la
tabla `admin_users`.

`NEXT_PUBLIC_ADMIN_AUTH_EMAIL_DOMAIN` define el dominio sintetico que el login
usa para transformar `usuario -> usuario@dominio`. Debe ser un dominio con
formato valido para que Supabase Auth acepte el email.

Si el login admin no funciona o la tabla `admin_users` esta vacia:

```bash
npm run bootstrap:admin
```

Este script:

- usa `DATABASE_URL` para conectarse a Supabase con una conexion de sesion
- crea o actualiza el usuario `usuario@NEXT_PUBLIC_ADMIN_AUTH_EMAIL_DOMAIN` en `auth.users`
- confirma el email y sincroniza los metadatos del usuario en Auth
- crea o reactiva el perfil `SUPERADMIN` en `public.admin_users`
- valida el acceso real contra `auth/v1/token`

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

## Preview estatico local

```bash
npm run build
npm run preview
```

`npm start` ahora usa ese mismo preview estatico. Esto evita el error de
`next start` con `output: "export"` y replica mejor el tipo de hosting que usa
Cloudflare Pages.

## Build de produccion

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

- Framework preset: `Next.js (Static HTML Export)`
- Build command: `npm run build`
- Build output directory: `out`
- Variables de entorno: replicar las de `.env.example` que correspondan al
  frontend publico.

El repo incluye `public/_headers`, que se copia a `out/_headers` durante el
build para que Cloudflare Pages aplique los headers de seguridad en produccion.

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
