do $$
begin
  if to_regclass('public."Vehicle"') is null then
    raise notice 'Legacy table public."Vehicle" not found. Skipping legacy import.';
    return;
  end if;

  if exists (select 1 from public.vehicles limit 1) then
    raise notice 'Target table public.vehicles already has rows. Skipping legacy import.';
    return;
  end if;

  create temporary table legacy_vehicle_map on commit drop as
  select
    legacy.id::text as old_id,
    gen_random_uuid()::uuid as new_id
  from public."Vehicle" as legacy;

  insert into public.vehicles (
    id,
    marca,
    modelo,
    condition,
    category,
    anio,
    kilometraje,
    precio,
    promotional_price,
    currency,
    descripcion,
    destacado,
    created_by_user_id,
    updated_by_user_id,
    deleted_by_user_id,
    deleted_at,
    created_at,
    updated_at
  )
  select
    map.new_id::uuid,
    legacy.marca::text,
    legacy.modelo::text,
    legacy.condition::text,
    coalesce(legacy.category::text, 'CAR'::text),
    legacy.anio::integer,
    coalesce(legacy.kilometraje, 0)::integer,
    legacy.precio::integer,
    legacy."promotionalPrice"::integer,
    coalesce(legacy.currency::text, 'USD'::text),
    legacy.descripcion::text,
    coalesce(legacy.destacado, false)::boolean,
    null::uuid,
    null::uuid,
    null::uuid,
    legacy."deletedAt"::timestamptz,
    legacy."createdAt"::timestamptz,
    legacy."updatedAt"::timestamptz
  from public."Vehicle" as legacy
  join legacy_vehicle_map as map
    on map.old_id = legacy.id::text;

  if to_regclass('public."VehicleImage"') is null then
    raise notice 'Legacy table public."VehicleImage" not found. Vehicle rows imported without images.';
    return;
  end if;

  create temporary table legacy_vehicle_image_map on commit drop as
  select
    legacy.id::text as old_id,
    gen_random_uuid()::uuid as new_id
  from public."VehicleImage" as legacy;

  insert into public.vehicle_images (
    id,
    vehicle_id,
    public_id,
    asset_id,
    alt,
    sort_order,
    is_primary,
    width,
    height,
    format,
    bytes,
    created_at
  )
  select
    image_map.new_id::uuid,
    vehicle_map.new_id::uuid,
    legacy."publicId"::text,
    legacy."assetId"::text,
    legacy.alt::text,
    coalesce(legacy."sortOrder", 0)::integer,
    coalesce(legacy."isPrimary", false)::boolean,
    legacy.width::integer,
    legacy.height::integer,
    legacy.format::text,
    legacy.bytes::integer,
    legacy."createdAt"::timestamptz
  from public."VehicleImage" as legacy
  join legacy_vehicle_map as vehicle_map
    on vehicle_map.old_id = legacy."vehicleId"::text
  join legacy_vehicle_image_map as image_map
    on image_map.old_id = legacy.id::text;
end
$$;
