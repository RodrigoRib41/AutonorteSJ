"use client";

import type { InquiryResponse } from "@/lib/inquiry-payloads";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { callSupabaseFunction } from "@/lib/supabase-functions";
import {
  serializeAdminUser,
  type AdminUserApiRecord,
  type AdminUserDeleteResponse,
  type AdminUserItemResponse,
  type AdminUserPasswordResetPayload,
  type AdminUserPasswordResetResponse,
  type AdminUserPayload,
  type AdminUserRecord,
  type AdminUsersSummary,
  isAdminRole,
} from "@/lib/admin-users";
import {
  matchesVehicleFilters,
  sortVehicleRecords,
  type VehicleFilterValues,
} from "@/lib/vehicle-filters";
import type {
  ContactInquiryPayload,
  VehicleInquiryPayload,
} from "@/lib/inquiry-payloads";
import {
  serializeVehicle,
  type FeaturedVehicleOption,
  type VehicleApiRecord,
  type VehicleBulkDeleteResponse,
  type VehicleImageApiRecord,
  type VehicleImageDeleteResponse,
  type VehicleImagesResponse,
  type VehiclePersisted,
  type VehiclePreview,
  type VehiclePreviewImage,
  type VehicleItemResponse,
  type VehiclePayload,
} from "@/lib/vehicle-records";
import type { VehicleAuditLogRecord } from "@/lib/vehicle-audit";
import type {
  VehicleRestorePointRecord,
  VehicleRestoreResponse,
} from "@/lib/vehicle-restore-points";

type AdminUserRow = {
  id: string;
  auth_user_id: string | null;
  name: string;
  username: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AdminActorRow = Pick<
  AdminUserRow,
  "id" | "name" | "username" | "email" | "role"
>;

type VehicleImageRow = {
  id: string;
  vehicle_id: string;
  public_id: string;
  asset_id: string | null;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
  width: number | null;
  height: number | null;
  format: string | null;
  bytes: number | null;
  created_at: string;
};

type VehicleRow = {
  id: string;
  marca: string;
  modelo: string;
  condition: "ZERO_KM" | "USED";
  category:
    | "CAR"
    | "PICKUP"
    | "SUV"
    | "MOTORCYCLE"
    | "VAN"
    | "TRUCK"
    | "OTHER";
  anio: number;
  kilometraje: number;
  precio: number;
  promotional_price: number | null;
  currency: "USD" | "ARS";
  descripcion: string | null;
  destacado: boolean;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  deleted_by_user_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  images?: VehicleImageRow[] | null;
  created_by?: AdminActorRow | AdminActorRow[] | null;
  updated_by?: AdminActorRow | AdminActorRow[] | null;
};

type VehicleAuditLogRow = {
  id: string;
  vehicle_id: string;
  vehicle_label: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE";
  actor_user_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  created_at: string;
  actor?:
    | Pick<AdminUserRow, "name" | "username" | "email">
    | Pick<AdminUserRow, "name" | "username" | "email">[]
    | null;
};

type VehicleRestorePointRow = {
  id: string;
  vehicle_id: string;
  vehicle_label: string;
  action: "UPDATE" | "DELETE";
  summary: string | null;
  snapshot: unknown;
  actor_user_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  created_at: string;
  expires_at: string;
  restored_at: string | null;
  restored_by_user_id: string | null;
  restored_by_name: string | null;
  restored_by_email: string | null;
  actor?:
    | Pick<AdminUserRow, "name" | "username" | "email">
    | Pick<AdminUserRow, "name" | "username" | "email">[]
    | null;
  restored_by?:
    | Pick<AdminUserRow, "name" | "username" | "email">
    | Pick<AdminUserRow, "name" | "username" | "email">[]
    | null;
  vehicle?:
    | {
        id: string;
        marca: string;
        modelo: string;
        deleted_at: string | null;
      }
    | {
        id: string;
        marca: string;
        modelo: string;
        deleted_at: string | null;
      }[]
    | null;
};

type UploadedVehicleImageInput = {
  assetId: string | null;
  publicId: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  bytes?: number | null;
};

const adminUserSelect =
  "id, auth_user_id, name, username, email, role, is_active, created_at, updated_at";
const adminActorSelect = "id, name, username, email, role";
const vehicleImageSelect =
  "id, vehicle_id, public_id, asset_id, alt, sort_order, is_primary, width, height, format, bytes, created_at";
const publicVehicleSelect = `
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
  updated_at,
  images:vehicle_images(${vehicleImageSelect})
`;
const adminVehicleSelect = `
  ${publicVehicleSelect},
  created_by:admin_users!vehicles_created_by_user_id_fkey(${adminActorSelect}),
  updated_by:admin_users!vehicles_updated_by_user_id_fkey(${adminActorSelect})
`;
const vehicleAuditSelect = `
  id,
  vehicle_id,
  vehicle_label,
  action,
  actor_user_id,
  actor_name,
  actor_email,
  created_at,
  actor:admin_users!vehicle_audit_logs_actor_user_id_fkey(name, username, email)
`;
const vehicleRestorePointSelect = `
  id,
  vehicle_id,
  vehicle_label,
  action,
  summary,
  snapshot,
  actor_user_id,
  actor_name,
  actor_email,
  created_at,
  expires_at,
  restored_at,
  restored_by_user_id,
  restored_by_name,
  restored_by_email,
  actor:admin_users!vehicle_restore_points_actor_user_id_fkey(name, username, email),
  restored_by:admin_users!vehicle_restore_points_restored_by_user_id_fkey(name, username, email),
  vehicle:vehicles!vehicle_restore_points_vehicle_id_fkey(id, marca, modelo, deleted_at)
`;

function asRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function ensureAdminRole(value: string) {
  return isAdminRole(value) ? value : "GESTOR";
}

function mapVehicleImageRow(row: VehicleImageRow): VehiclePreviewImage {
  return {
    id: row.id,
    publicId: row.public_id,
    assetId: row.asset_id,
    alt: row.alt,
    sortOrder: row.sort_order,
    isPrimary: row.is_primary,
    width: row.width,
    height: row.height,
    format: row.format,
    bytes: row.bytes,
  };
}

function mapAdminActorRow(row: AdminActorRow | null | undefined) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    role: ensureAdminRole(row.role),
  };
}

function mapVehicleRow(row: VehicleRow): VehiclePersisted {
  const createdBy = mapAdminActorRow(asRelation(row.created_by));
  const updatedBy = mapAdminActorRow(asRelation(row.updated_by));

  return {
    id: row.id,
    marca: row.marca,
    modelo: row.modelo,
    condition: row.condition,
    category: row.category,
    anio: row.anio,
    kilometraje: row.kilometraje,
    precio: row.precio,
    promotionalPrice: row.promotional_price,
    currency: row.currency,
    descripcion: row.descripcion,
    destacado: row.destacado,
    createdByUserId: row.created_by_user_id,
    updatedByUserId: row.updated_by_user_id,
    deletedByUserId: row.deleted_by_user_id,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    images: (row.images ?? []).map((image) => ({
      ...mapVehicleImageRow(image),
      vehicleId: image.vehicle_id,
      createdAt: image.created_at,
    })),
    createdBy,
    updatedBy,
  };
}

function mapAdminUserRow(row: AdminUserRow): AdminUserRecord {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    name: row.name,
    username: row.username ?? row.email ?? row.name,
    email: row.email,
    role: ensureAdminRole(row.role),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVehicleAuditLogRow(row: VehicleAuditLogRow): VehicleAuditLogRecord {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    vehicleLabel: row.vehicle_label,
    action: row.action,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    createdAt: row.created_at,
    actor: asRelation(row.actor) ?? null,
  };
}

function mapVehicleRestorePointRow(
  row: VehicleRestorePointRow
): VehicleRestorePointRecord {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    vehicleLabel: row.vehicle_label,
    action: row.action,
    summary: row.summary,
    snapshot: row.snapshot,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    restoredAt: row.restored_at,
    restoredByUserId: row.restored_by_user_id,
    restoredByName: row.restored_by_name,
    restoredByEmail: row.restored_by_email,
    actor: asRelation(row.actor) ?? null,
    restoredBy: asRelation(row.restored_by) ?? null,
    vehicle: asRelation(row.vehicle)
      ? {
          id: asRelation(row.vehicle)!.id,
          marca: asRelation(row.vehicle)!.marca,
          modelo: asRelation(row.vehicle)!.modelo,
          deletedAt: asRelation(row.vehicle)!.deleted_at,
        }
      : null,
  };
}

function buildAdminUsersSummary(users: AdminUserRecord[]): AdminUsersSummary {
  return {
    totalUsers: users.length,
    superadminCount: users.filter((user) => user.role === "SUPERADMIN").length,
    gestorCount: users.filter((user) => user.role === "GESTOR").length,
  };
}

function dedupeBrands(vehicles: VehiclePreview[]) {
  return Array.from(
    new Set(
      vehicles
        .map((vehicle) => vehicle.marca.trim())
        .filter((marca) => marca.length > 0)
    )
  ).sort((left, right) => left.localeCompare(right, "es"));
}

function getFunctionErrorMessage(error: unknown, fallbackMessage: string) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return error instanceof Error && error.message ? error.message : fallbackMessage;
}

export async function fetchPublishedVehicles() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(publicVehicleSelect)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("No pudimos cargar el stock publicado.");
  }

  return sortVehicleRecords((data ?? []).map(mapVehicleRow));
}

export async function fetchFeaturedVehicles(limit = 3) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(publicVehicleSelect)
    .is("deleted_at", null)
    .eq("destacado", true)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("No pudimos cargar los vehiculos destacados.");
  }

  return sortVehicleRecords((data ?? []).map(mapVehicleRow)).slice(0, limit);
}

export async function fetchPublishedVehicleById(id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(publicVehicleSelect)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error("No pudimos cargar la ficha de la unidad.");
  }

  return data ? mapVehicleRow(data) : null;
}

export async function fetchAdminVehicles() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(adminVehicleSelect)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("No pudimos cargar el stock del panel.");
  }

  return sortVehicleRecords((data ?? []).map(mapVehicleRow));
}

export async function fetchAdminVehicleById(id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(adminVehicleSelect)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error("No pudimos cargar la unidad del panel.");
  }

  return data ? mapVehicleRow(data) : null;
}

export async function fetchFeaturedVehicleReplacementOptions(
  excludeVehicleId?: string
) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("vehicles")
    .select("id, marca, modelo, anio")
    .is("deleted_at", null)
    .eq("destacado", true)
    .order("updated_at", { ascending: false })
    .limit(3);

  if (excludeVehicleId) {
    query = query.neq("id", excludeVehicleId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("No pudimos cargar los destacados actuales.");
  }

  return (data ?? []) as FeaturedVehicleOption[];
}

export async function fetchAdminUsers() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select(adminUserSelect)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("No pudimos cargar los usuarios del panel.");
  }

  return (data ?? []).map(mapAdminUserRow);
}

export async function fetchAdminUsersSummary() {
  return buildAdminUsersSummary(await fetchAdminUsers());
}

export async function fetchRecentVehicleAuditLogs(limit = 8) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("vehicle_audit_logs")
    .select(vehicleAuditSelect)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("No pudimos cargar la actividad reciente.");
  }

  return (data ?? []).map(mapVehicleAuditLogRow);
}

export async function fetchActiveVehicleRestorePoints(now = new Date()) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("vehicle_restore_points")
    .select(vehicleRestorePointSelect)
    .is("restored_at", null)
    .gt("expires_at", now.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("No pudimos cargar la papelera.");
  }

  return (data ?? []).map(mapVehicleRestorePointRow);
}

export async function fetchActiveVehicleRestorePointCount(now = new Date()) {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from("vehicle_restore_points")
    .select("id", { count: "exact", head: true })
    .is("restored_at", null)
    .gt("expires_at", now.toISOString());

  if (error) {
    throw new Error("No pudimos contar los movimientos disponibles.");
  }

  return count ?? 0;
}

export async function submitContactInquiry(
  payload: ContactInquiryPayload
): Promise<InquiryResponse<keyof ContactInquiryPayload>> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("contact_inquiries").insert({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    message: payload.message,
  });

  if (error) {
    return {
      success: false,
      message:
        "No pudimos enviar tu consulta en este momento. Intenta nuevamente.",
    };
  }

  return {
    success: true,
    message: "Recibimos tu consulta. Te vamos a responder a la brevedad.",
  };
}

export async function submitVehicleInquiry(
  payload: VehicleInquiryPayload
): Promise<InquiryResponse<keyof VehicleInquiryPayload>> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("vehicle_inquiries").insert({
    vehicle_id: payload.vehicleId,
    vehicle_name: payload.vehicleName,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    message: payload.message,
  });

  if (error) {
    return {
      success: false,
      message:
        "No pudimos enviar tu consulta en este momento. Intenta nuevamente.",
    };
  }

  return {
    success: true,
    message: "Recibimos tu consulta. Te vamos a responder a la brevedad.",
  };
}

export async function createAdminUser(payload: AdminUserPayload) {
  const result = await callSupabaseFunction<AdminUserItemResponse>("admin-users", {
    method: "POST",
    body: payload,
  });

  if (result.data) {
    return result.data;
  }

  if (!result.ok || !result.data) {
    return {
      success: false,
      message: getFunctionErrorMessage(
        result.data,
        "No pudimos crear el usuario gestor en este momento."
      ),
    } satisfies AdminUserItemResponse;
  }

  return result.data;
}

export async function deleteAdminUser(userId: string) {
  const result = await callSupabaseFunction<AdminUserDeleteResponse>("admin-users", {
    method: "DELETE",
    path: userId,
  });

  if (result.data) {
    return result.data;
  }

  if (!result.ok || !result.data) {
    return {
      success: false,
      message: "No pudimos eliminar el usuario gestor en este momento.",
    } satisfies AdminUserDeleteResponse;
  }

  return result.data;
}

export async function resetAdminUserPassword(
  userId: string,
  payload: AdminUserPasswordResetPayload
) {
  const result = await callSupabaseFunction<AdminUserPasswordResetResponse>(
    "admin-users",
    {
      method: "PATCH",
      path: userId,
      body: payload,
    }
  );

  if (result.data) {
    return result.data;
  }

  if (!result.ok || !result.data) {
    return {
      success: false,
      message:
        "No pudimos resetear la password del gestor en este momento.",
    } satisfies AdminUserPasswordResetResponse;
  }

  return result.data;
}

export async function createVehicle(payload: VehiclePayload & {
  featuredReplacementVehicleId?: string | null;
}) {
  const result = await callSupabaseFunction<VehicleItemResponse>(
    "admin-vehicles",
    {
      method: "POST",
      body: payload,
    }
  );

  if (result.data) {
    return result.data;
  }

  if (!result.ok || !result.data) {
    return {
      success: false,
      message: "No pudimos guardar el vehiculo en este momento.",
    } satisfies VehicleItemResponse;
  }

  return result.data;
}

export async function updateVehicle(
  vehicleId: string,
  payload: VehiclePayload & {
    featuredReplacementVehicleId?: string | null;
  }
) {
  const result = await callSupabaseFunction<VehicleItemResponse>(
    "admin-vehicles",
    {
      method: "PUT",
      path: vehicleId,
      body: payload,
    }
  );

  if (result.data) {
    return result.data;
  }

  if (!result.ok || !result.data) {
    return {
      success: false,
      message: "No pudimos guardar el vehiculo en este momento.",
    } satisfies VehicleItemResponse;
  }

  return result.data;
}

export async function deleteVehicle(vehicleId: string) {
  const result = await callSupabaseFunction<{ success?: boolean; message?: string }>(
    "admin-vehicles",
    {
      method: "DELETE",
      path: vehicleId,
    }
  );

  if (result.data) {
    return result.data;
  }

  if (!result.ok || !result.data) {
    return {
      success: false,
      message: "No pudimos eliminar el vehiculo en este momento.",
    };
  }

  return result.data;
}

export async function bulkDeleteVehicles(ids: string[]) {
  const result = await callSupabaseFunction<VehicleBulkDeleteResponse>(
    "admin-vehicles",
    {
      method: "DELETE",
      body: { ids },
    }
  );

  if (result.data) {
    return result.data;
  }

  if (!result.ok || !result.data) {
    return {
      success: false,
      message: "No pudimos eliminar los vehiculos seleccionados.",
    } satisfies VehicleBulkDeleteResponse;
  }

  return result.data;
}

export async function restoreVehicle(restorePointId: string) {
  const result = await callSupabaseFunction<VehicleRestoreResponse>(
    "vehicle-restore-points",
    {
      method: "POST",
      path: `${restorePointId}/restore`,
    }
  );

  if (result.data) {
    return result.data;
  }

  if (!result.ok || !result.data) {
    return {
      success: false,
      message: "No pudimos restaurar este movimiento.",
    } satisfies VehicleRestoreResponse;
  }

  return result.data;
}

export async function registerUploadedVehicleImages(options: {
  vehicleId: string;
  images: UploadedVehicleImageInput[];
}) {
  const result = await callSupabaseFunction<VehicleImagesResponse>(
    "vehicle-images",
    {
      method: "POST",
      body: options,
    }
  );

  if (result.data) {
    return result.data;
  }

  if (!result.ok || !result.data) {
    return {
      success: false,
      message: "No pudimos registrar las imagenes del vehiculo.",
    } satisfies VehicleImagesResponse;
  }

  return result.data;
}

export async function reorderVehicleImages(options: {
  vehicleId: string;
  orderedImageIds: string[];
}) {
  const result = await callSupabaseFunction<VehicleImagesResponse>(
    "vehicle-images",
    {
      method: "PATCH",
      body: options,
    }
  );

  if (result.data) {
    return result.data;
  }

  if (!result.ok || !result.data) {
    return {
      success: false,
      message: "No pudimos reordenar las imagenes del vehiculo.",
    } satisfies VehicleImagesResponse;
  }

  return result.data;
}

export async function deleteVehicleImages(options: {
  vehicleId: string;
  imageIds: string[];
}) {
  const result = await callSupabaseFunction<VehicleImageDeleteResponse>(
    "vehicle-images",
    {
      method: "DELETE",
      body: options,
    }
  );

  if (result.data) {
    return result.data;
  }

  if (!result.ok || !result.data) {
    return {
      success: false,
      message: "No pudimos eliminar las imagenes seleccionadas.",
    } satisfies VehicleImageDeleteResponse;
  }

  return result.data;
}

export function buildPublicCatalogState(
  vehicles: VehiclePersisted[],
  filters: VehicleFilterValues
) {
  const filteredVehicles = sortVehicleRecords(
    vehicles.filter((vehicle) => matchesVehicleFilters(vehicle, filters))
  );

  return {
    brands: dedupeBrands(vehicles),
    filteredVehicles,
    serializedVehicles: filteredVehicles.map(serializeVehicle),
    totalCount: vehicles.length,
    filteredCount: filteredVehicles.length,
    hasFilters: Boolean(
      filters.q ||
        filters.marca ||
        filters.condition ||
        filters.category ||
        filters.currency ||
        filters.anioMin ||
        filters.anioMax ||
        filters.kilometrajeMin ||
        filters.kilometrajeMax ||
        filters.hasPromotion ||
        filters.sort !== "updated-desc"
    ),
  };
}

export function buildAdminVehicleState(
  vehicles: VehiclePersisted[],
  filters: VehicleFilterValues
) {
  const filteredVehicles = sortVehicleRecords(
    vehicles.filter((vehicle) =>
      matchesVehicleFilters(vehicle, filters, { includeAdminFields: true })
    ),
    filters.sort
  );

  return {
    brands: dedupeBrands(vehicles),
    totalCount: vehicles.length,
    filteredVehicles,
  };
}

export function toVehicleApiRecord(vehicle: VehiclePersisted): VehicleApiRecord {
  return serializeVehicle(vehicle);
}

export function toAdminUserApiRecord(user: AdminUserRecord): AdminUserApiRecord {
  return serializeAdminUser(user);
}

export function toVehicleImagesApiRecord(images: VehiclePersisted["images"]) {
  return images.map((image): VehicleImageApiRecord => ({
    id: image.id,
    publicId: image.publicId,
    assetId: image.assetId,
    alt: image.alt,
    sortOrder: image.sortOrder,
    isPrimary: image.isPrimary,
    width: image.width,
    height: image.height,
    format: image.format,
    bytes: image.bytes,
    createdAt:
      image.createdAt instanceof Date
        ? image.createdAt.toISOString()
        : image.createdAt,
  }));
}
