import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { getFunctionPathParts, handleOptions, json } from "../_shared/http.ts";
import { authenticateAdminRequest } from "../_shared/supabase.ts";
import {
  buildVehicleImagesAddedSummary,
  buildVehicleImagesDeletedSummary,
  buildVehicleImagesReorderedSummary,
  buildVehicleRestoreSnapshot,
  MAX_VEHICLE_IMAGES,
  serializeVehicleImage,
  type VehicleImageRow,
  type VehicleRow,
} from "../_shared/vehicle-state.ts";

const vehicleSelect =
  "id, marca, modelo, condition, category, anio, kilometraje, precio, promotional_price, currency, descripcion, destacado, created_by_user_id, updated_by_user_id, deleted_by_user_id, deleted_at, created_at, updated_at";
const imageSelect =
  "id, vehicle_id, public_id, asset_id, alt, sort_order, is_primary, width, height, format, bytes, created_at";

async function loadVehicleWithImages(
  adminClient: SupabaseClient,
  vehicleId: string
) {
  const { data: vehicle, error: vehicleError } = await adminClient
    .from("vehicles")
    .select(vehicleSelect)
    .eq("id", vehicleId)
    .is("deleted_at", null)
    .maybeSingle();

  if (vehicleError || !vehicle) {
    return null;
  }

  const { data: images } = await adminClient
    .from("vehicle_images")
    .select(imageSelect)
    .eq("vehicle_id", vehicleId)
    .order("sort_order", { ascending: true });

  return {
    vehicle: vehicle as VehicleRow,
    images: (images ?? []) as VehicleImageRow[],
  };
}

async function insertRestorePoint(options: {
  adminClient: SupabaseClient;
  admin: { id: string; name: string; email: string | null };
  vehicle: VehicleRow;
  images: VehicleImageRow[];
  summary: string;
}) {
  const { adminClient, admin, vehicle, images, summary } = options;

  await adminClient.from("vehicle_restore_points").insert({
    vehicle_id: vehicle.id,
    vehicle_label: `${vehicle.marca} ${vehicle.modelo}`.trim(),
    action: "UPDATE",
    summary,
    snapshot: buildVehicleRestoreSnapshot(vehicle, images),
    actor_user_id: admin.id,
    actor_name: admin.name,
    actor_email: admin.email,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
}

async function insertAuditLog(options: {
  adminClient: SupabaseClient;
  admin: { id: string; name: string; username: string };
  vehicle: VehicleRow;
}) {
  await options.adminClient.from("vehicle_audit_logs").insert({
    vehicle_id: options.vehicle.id,
    vehicle_label: `${options.vehicle.marca} ${options.vehicle.modelo}`.trim(),
    action: "UPDATE",
    actor_user_id: options.admin.id,
    actor_name: options.admin.name,
    actor_email: options.admin.username,
  });
}

async function fetchImages(
  adminClient: SupabaseClient,
  vehicleId: string
) {
  const { data: images } = await adminClient
    .from("vehicle_images")
    .select(imageSelect)
    .eq("vehicle_id", vehicleId)
    .order("sort_order", { ascending: true });

  return (images ?? []) as VehicleImageRow[];
}

async function registerImages(request: Request) {
  const auth = await authenticateAdminRequest(request, ["SUPERADMIN", "GESTOR"]);

  if (auth instanceof Response) {
    return auth;
  }

  const body = await request.json().catch(() => null);
  const vehicleId =
    body && typeof body === "object" && typeof (body as { vehicleId?: unknown }).vehicleId === "string"
      ? ((body as { vehicleId: string }).vehicleId)
      : "";
  const imagesInput = Array.isArray((body as { images?: unknown[] } | null)?.images)
    ? ((body as { images: unknown[] }).images)
    : [];

  if (!vehicleId || imagesInput.length === 0) {
    return json(
      { success: false, message: "Faltan imagenes para registrar." },
      { status: 400 }
    );
  }

  const current = await loadVehicleWithImages(
    auth.adminClient,
    vehicleId
  );

  if (!current) {
    return json(
      { success: false, message: "No encontramos la unidad." },
      { status: 404 }
    );
  }

  if (current.images.length + imagesInput.length > MAX_VEHICLE_IMAGES) {
    return json(
      {
        success: false,
        message: `Este vehiculo ya alcanzo el maximo de ${MAX_VEHICLE_IMAGES} imagenes.`,
      },
      { status: 400 }
    );
  }

  await insertRestorePoint({
    adminClient: auth.adminClient,
    admin: {
      id: auth.admin.id,
      name: auth.admin.name,
      email: auth.admin.email,
    },
    vehicle: current.vehicle,
    images: current.images,
    summary: buildVehicleImagesAddedSummary(imagesInput.length),
  });

  const uploadRows = imagesInput.map((image, index) => {
    const input =
      image && typeof image === "object" ? (image as Record<string, unknown>) : {};

    return {
      vehicle_id: vehicleId,
      public_id: typeof input.publicId === "string" ? input.publicId : "",
      asset_id: typeof input.assetId === "string" ? input.assetId : null,
      alt: typeof input.alt === "string" ? input.alt : null,
      sort_order: current.images.length + index,
      is_primary: current.images.length === 0 && index === 0,
      width: typeof input.width === "number" ? input.width : null,
      height: typeof input.height === "number" ? input.height : null,
      format: typeof input.format === "string" ? input.format : null,
      bytes: typeof input.bytes === "number" ? input.bytes : null,
    };
  });

  const { data: createdImages, error: insertError } = await auth.adminClient
    .from("vehicle_images")
    .insert(uploadRows)
    .select(imageSelect);

  if (insertError) {
    return json(
      { success: false, message: "No pudimos registrar las imagenes del vehiculo." },
      { status: 400 }
    );
  }

  const images = await fetchImages(
    auth.adminClient,
    vehicleId
  );

  await insertAuditLog({
    adminClient: auth.adminClient,
    admin: {
      id: auth.admin.id,
      name: auth.admin.name,
      username: auth.admin.username,
    },
    vehicle: current.vehicle,
  });

  return json({
    success: true,
    images: images.map(serializeVehicleImage),
    uploadedImages: ((createdImages ?? []) as VehicleImageRow[]).map(serializeVehicleImage),
    message: "Las imagenes se cargaron correctamente.",
  });
}

async function reorderImages(request: Request) {
  const auth = await authenticateAdminRequest(request, ["SUPERADMIN", "GESTOR"]);

  if (auth instanceof Response) {
    return auth;
  }

  const body = await request.json().catch(() => null);
  const vehicleId =
    body && typeof body === "object" && typeof (body as { vehicleId?: unknown }).vehicleId === "string"
      ? ((body as { vehicleId: string }).vehicleId)
      : "";
  const orderedImageIds = Array.isArray((body as { orderedImageIds?: unknown[] } | null)?.orderedImageIds)
    ? ((body as { orderedImageIds: unknown[] }).orderedImageIds).filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0
      )
    : [];

  const current = await loadVehicleWithImages(
    auth.adminClient,
    vehicleId
  );

  if (!current) {
    return json(
      { success: false, message: "No encontramos la unidad." },
      { status: 404 }
    );
  }

  const currentIds = current.images.map((image) => image.id).sort();
  const nextIds = [...orderedImageIds].sort();

  if (
    orderedImageIds.length !== current.images.length ||
    JSON.stringify(currentIds) !== JSON.stringify(nextIds)
  ) {
    return json(
      { success: false, message: "El orden enviado no coincide con la galeria actual." },
      { status: 400 }
    );
  }

  await insertRestorePoint({
    adminClient: auth.adminClient,
    admin: {
      id: auth.admin.id,
      name: auth.admin.name,
      email: auth.admin.email,
    },
    vehicle: current.vehicle,
    images: current.images,
    summary: buildVehicleImagesReorderedSummary(),
  });

  for (const [index, imageId] of orderedImageIds.entries()) {
    await auth.adminClient
      .from("vehicle_images")
      .update({
        sort_order: index,
        is_primary: index === 0,
      })
      .eq("id", imageId)
      .eq("vehicle_id", vehicleId);
  }

  const images = await fetchImages(
    auth.adminClient,
    vehicleId
  );

  await insertAuditLog({
    adminClient: auth.adminClient,
    admin: {
      id: auth.admin.id,
      name: auth.admin.name,
      username: auth.admin.username,
    },
    vehicle: current.vehicle,
  });

  return json({
    success: true,
    images: images.map(serializeVehicleImage),
    message: "Orden de imagenes actualizado correctamente.",
  });
}

async function removeImages(request: Request) {
  const auth = await authenticateAdminRequest(request, ["SUPERADMIN", "GESTOR"]);

  if (auth instanceof Response) {
    return auth;
  }

  const body = await request.json().catch(() => null);
  const vehicleId =
    body && typeof body === "object" && typeof (body as { vehicleId?: unknown }).vehicleId === "string"
      ? ((body as { vehicleId: string }).vehicleId)
      : "";
  const imageIds = Array.isArray((body as { imageIds?: unknown[] } | null)?.imageIds)
    ? Array.from(
        new Set(
          ((body as { imageIds: unknown[] }).imageIds).filter(
            (value): value is string => typeof value === "string" && value.trim().length > 0
          )
        )
      )
    : [];

  const current = await loadVehicleWithImages(
    auth.adminClient,
    vehicleId
  );

  if (!current) {
    return json(
      { success: false, message: "No encontramos la unidad." },
      { status: 404 }
    );
  }

  const existingIds = new Set(current.images.map((image) => image.id));

  if (imageIds.length === 0 || imageIds.some((imageId) => !existingIds.has(imageId))) {
    return json(
      { success: false, message: "Las imagenes seleccionadas no son validas." },
      { status: 400 }
    );
  }

  await insertRestorePoint({
    adminClient: auth.adminClient,
    admin: {
      id: auth.admin.id,
      name: auth.admin.name,
      email: auth.admin.email,
    },
    vehicle: current.vehicle,
    images: current.images,
    summary: buildVehicleImagesDeletedSummary(imageIds.length),
  });

  const { error: deleteError } = await auth.adminClient
    .from("vehicle_images")
    .delete()
    .eq("vehicle_id", vehicleId)
    .in("id", imageIds);

  if (deleteError) {
    return json(
      { success: false, message: "No pudimos eliminar las imagenes seleccionadas." },
      { status: 400 }
    );
  }

  const images = await fetchImages(
    auth.adminClient,
    vehicleId
  );

  for (const [index, image] of images.entries()) {
    await auth.adminClient
      .from("vehicle_images")
      .update({
        sort_order: index,
        is_primary: index === 0,
      })
      .eq("id", image.id);
  }

  const normalizedImages = await fetchImages(
    auth.adminClient,
    vehicleId
  );

  await insertAuditLog({
    adminClient: auth.adminClient,
    admin: {
      id: auth.admin.id,
      name: auth.admin.name,
      username: auth.admin.username,
    },
    vehicle: current.vehicle,
  });

  return json({
    success: true,
    deletedImageId: imageIds[0] ?? null,
    deletedImageIds: imageIds,
    images: normalizedImages.map(serializeVehicleImage),
    message:
      imageIds.length === 1
        ? "La imagen se elimino correctamente."
        : "Las imagenes se eliminaron correctamente.",
  });
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);

  if (optionsResponse) {
    return optionsResponse;
  }

  const pathParts = getFunctionPathParts(request, "vehicle-images");

  if (request.method === "POST" && pathParts.length === 0) {
    return registerImages(request);
  }

  if (request.method === "PATCH" && pathParts.length === 0) {
    return reorderImages(request);
  }

  if (request.method === "DELETE" && pathParts.length === 0) {
    return removeImages(request);
  }

  return json(
    { success: false, message: "Metodo no soportado." },
    { status: 405 }
  );
});
