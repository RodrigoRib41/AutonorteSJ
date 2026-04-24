create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  username text not null unique,
  email text unique,
  role text not null default 'GESTOR' check (role in ('SUPERADMIN', 'GESTOR')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_users_role_idx on public.admin_users (role);
create index if not exists admin_users_auth_user_id_idx on public.admin_users (auth_user_id);

drop trigger if exists set_admin_users_updated_at on public.admin_users;
create trigger set_admin_users_updated_at
before update on public.admin_users
for each row
execute function public.set_updated_at();

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  marca text not null,
  modelo text not null,
  condition text not null default 'USED' check (condition in ('ZERO_KM', 'USED')),
  category text not null default 'CAR' check (category in ('CAR', 'PICKUP', 'SUV', 'MOTORCYCLE', 'VAN', 'TRUCK', 'OTHER')),
  anio integer not null,
  kilometraje integer not null default 0,
  precio integer not null,
  promotional_price integer,
  currency text not null default 'USD' check (currency in ('USD', 'ARS')),
  descripcion text,
  destacado boolean not null default false,
  created_by_user_id uuid references public.admin_users (id) on delete set null,
  updated_by_user_id uuid references public.admin_users (id) on delete set null,
  deleted_by_user_id uuid references public.admin_users (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicles_deleted_at_updated_at_idx on public.vehicles (deleted_at, updated_at desc);
create index if not exists vehicles_category_deleted_at_idx on public.vehicles (category, deleted_at);
create index if not exists vehicles_destacado_deleted_at_idx on public.vehicles (destacado, deleted_at);

drop trigger if exists set_vehicles_updated_at on public.vehicles;
create trigger set_vehicles_updated_at
before update on public.vehicles
for each row
execute function public.set_updated_at();

create table if not exists public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  public_id text not null,
  asset_id text unique,
  alt text,
  sort_order integer not null,
  is_primary boolean not null default false,
  width integer,
  height integer,
  format text,
  bytes integer,
  created_at timestamptz not null default now()
);

create index if not exists vehicle_images_vehicle_sort_idx on public.vehicle_images (vehicle_id, sort_order);
create index if not exists vehicle_images_vehicle_primary_idx on public.vehicle_images (vehicle_id, is_primary);

create table if not exists public.vehicle_audit_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  vehicle_label text not null,
  action text not null check (action in ('CREATE', 'UPDATE', 'DELETE', 'RESTORE')),
  actor_user_id uuid references public.admin_users (id) on delete set null,
  actor_name text,
  actor_email text,
  created_at timestamptz not null default now()
);

create index if not exists vehicle_audit_logs_vehicle_created_idx on public.vehicle_audit_logs (vehicle_id, created_at desc);
create index if not exists vehicle_audit_logs_actor_created_idx on public.vehicle_audit_logs (actor_user_id, created_at desc);

create table if not exists public.vehicle_restore_points (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  vehicle_label text not null,
  action text not null check (action in ('UPDATE', 'DELETE')),
  summary text,
  snapshot jsonb not null,
  actor_user_id uuid references public.admin_users (id) on delete set null,
  actor_name text,
  actor_email text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  restored_at timestamptz,
  restored_by_user_id uuid references public.admin_users (id) on delete set null,
  restored_by_name text,
  restored_by_email text
);

create index if not exists vehicle_restore_points_vehicle_created_idx on public.vehicle_restore_points (vehicle_id, created_at desc);
create index if not exists vehicle_restore_points_restored_expires_idx on public.vehicle_restore_points (restored_at, expires_at);

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicle_inquiries (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  vehicle_name text not null,
  name text not null,
  email text not null,
  phone text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create or replace function public.current_admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.admin_users
  where auth_user_id = auth.uid()
    and is_active = true
  limit 1;
$$;

grant execute on function public.current_admin_role() to anon, authenticated;

alter table public.admin_users enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_images enable row level security;
alter table public.vehicle_audit_logs enable row level security;
alter table public.vehicle_restore_points enable row level security;
alter table public.contact_inquiries enable row level security;
alter table public.vehicle_inquiries enable row level security;

drop policy if exists "admin users readable by active admins" on public.admin_users;
create policy "admin users readable by active admins"
on public.admin_users
for select
to authenticated
using (public.current_admin_role() in ('SUPERADMIN', 'GESTOR'));

drop policy if exists "vehicles readable publicly when published" on public.vehicles;
create policy "vehicles readable publicly when published"
on public.vehicles
for select
to anon, authenticated
using (deleted_at is null);

drop policy if exists "vehicles readable by admins" on public.vehicles;
create policy "vehicles readable by admins"
on public.vehicles
for select
to authenticated
using (public.current_admin_role() in ('SUPERADMIN', 'GESTOR'));

drop policy if exists "vehicle images readable publicly when vehicle is published" on public.vehicle_images;
create policy "vehicle images readable publicly when vehicle is published"
on public.vehicle_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.vehicles
    where public.vehicles.id = vehicle_images.vehicle_id
      and public.vehicles.deleted_at is null
  )
);

drop policy if exists "vehicle images readable by admins" on public.vehicle_images;
create policy "vehicle images readable by admins"
on public.vehicle_images
for select
to authenticated
using (public.current_admin_role() in ('SUPERADMIN', 'GESTOR'));

drop policy if exists "vehicle audit logs readable by admins" on public.vehicle_audit_logs;
create policy "vehicle audit logs readable by admins"
on public.vehicle_audit_logs
for select
to authenticated
using (public.current_admin_role() in ('SUPERADMIN', 'GESTOR'));

drop policy if exists "vehicle restore points readable by admins" on public.vehicle_restore_points;
create policy "vehicle restore points readable by admins"
on public.vehicle_restore_points
for select
to authenticated
using (public.current_admin_role() in ('SUPERADMIN', 'GESTOR'));

drop policy if exists "contact inquiries insertable publicly" on public.contact_inquiries;
create policy "contact inquiries insertable publicly"
on public.contact_inquiries
for insert
to anon, authenticated
with check (true);

drop policy if exists "vehicle inquiries insertable publicly" on public.vehicle_inquiries;
create policy "vehicle inquiries insertable publicly"
on public.vehicle_inquiries
for insert
to anon, authenticated
with check (true);
