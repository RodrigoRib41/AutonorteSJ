import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { getFunctionPathParts, handleOptions, json } from "../_shared/http.ts";
import { authenticateAdminRequest } from "../_shared/supabase.ts";
import {
  buildVehiclePayloadChangeSummary,
  buildVehicleRestoreSnapshot,
  MAX_FEATURED_VEHICLES,
  parseVehiclePayload,
  serializeVehicle,
  validateVehiclePayload,
  type VehicleImageRow,
  type VehiclePayload,
  type VehicleRow,
} from "../_shared/vehicle-state.ts";

const vehicleSelect =
  "id, marca, modelo, condition, category, anio, kilometraje, precio, promotional_price, currency, descripcion, destacado, created_by_user_id, updated_by_user_id, deleted_by_user_id, deleted_at, created_at, updated_at";
const vehicleImageSelect =
  "id, vehicle_id, public_id, asset_id, alt, sort_order, is_primary, width, height, format, bytes, created_at";

type FeaturedVehicleOption = {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
};

type VehicleMutationPayload = VehiclePayload & {
  featuredReplacementVehicleId?: string | null;
};

async function loadVehicleWithImages(
  adminClient: SupabaseClient,
  vehicleId: string
) {
  const { data: vehicle, error: vehicleError } = await adminClient
    .from("vehicles")
    .select(vehicleSelect)
    .eq("id", vehicleId)
    .maybeSingle();

  if (vehicleError || !vehicle) {
    return null;
  }

  const { data: images } = await adminClient
    .from("vehicle_images")
    .select(vehicleImageSelect)
    .eq("vehicle_id", vehicleId)
    .order("sort_order", { ascending: true });

  return {
    vehicle: vehicle as VehicleRow,
    images: (images ?? []) as VehicleImageRow[],
  };
}

async function fetchFeaturedVehicles(
  adminClient: SupabaseClient,
  excludeVehicleId?: string | null
) {
  let query = adminClient
    .from("vehicles")
    .select("id, marca, modelo, anio")
    .is("deleted_at", null)
    .eq("destacado", true)
    .order("updated_at", { ascending: false })
    .limit(MAX_FEATURED_VEHICLES);

  if (excludeVehicleId) {
    query = query.neq("id", excludeVehicleId);
  }

  const { data } = await query;
  return (data ?? []) as FeaturedVehicleOption[];
}

async function maybeHandleFeaturedLimit(options: {
  adminClient: SupabaseClient;
  payload: VehicleMutationPayload;
  currentVehicle?: VehicleRow | null;
}) {
  const { adminClient, payload, currentVehicle } = options;

  if (!payload.destacado) {
    return { featuredVehicles: [] as FeaturedVehicleOption[] };
  }

  if (currentVehicle?.destacado) {
    return { featuredVehicles: [] as FeaturedVehicleOption[] };
  }

  const featuredVehicles = await fetchFeaturedVehicles(
    adminClient,
    currentVehicle?.id ?? null
  );

  if (featuredVehicles.length < MAX_FEATURED_VEHICLES) {
    return { featuredVehicles };
  }

  if (
    payload.featuredReplacementVehicleId &&
    featuredVehicles.some(
      (vehicle) => vehicle.id === payload.featuredReplacementVehicleId
    )
  ) {
    return { featuredVehicles };
  }

  return {
    response: json(
      {
        success: false,
        code: "FEATURED_LIMIT_REACHED",
        message: `Ya hay ${MAX_FEATURED_VEHICLES} vehiculos destacados.`,
        featuredVehicles,
      },
      { status: 400 }
    ),
  };
}

async function demoteReplacementVehicle(options: {
  adminClient: SupabaseClient;
  adminId: string;
  replacementVehicleId?: string | null;
}) {
  const { adminClient, adminId, replacementVehicleId } = options;

  if (!replacementVehicleId) {
    return;
  }

  await adminClient
    .from("vehicles")
    .update({
      destacado: false,
      updated_by_user_id: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", replacementVehicleId)
    .is("deleted_at", null);
}

async function insertAuditLog(options: {
  adminClient: SupabaseClient;
  admin: { id: string; name: string; username: string };
  vehicle: { id: string; marca: string; modelo: string };
  action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE";
}) {
  const { adminClient, admin, vehicle, action } = options;

  await adminClient.from("vehicle_audit_logs").insert({
    vehicle_id: vehicle.id,
    vehicle_label: `${vehicle.marca} ${vehicle.modelo}`.trim(),
    action,
    actor_user_id: admin.id,
    actor_name: admin.name,
    actor_email: admin.username,
  });
}

async function insertRestorePoint(options: {
  adminClient: SupabaseClient;
  admin: { id: string; name: string; email: string | null };
  vehicle: VehicleRow;
  images: VehicleImageRow[];
  action: "UPDATE" | "DELETE";
  summary: string;
}) {
  const { adminClient, admin, vehicle, images, action, summary } = options;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await adminClient.from("vehicle_restore_points").insert({
    vehicle_id: vehicle.id,
    vehicle_label: `${vehicle.marca} ${vehicle.modelo}`.trim(),
    action,
    summary,
    snapshot: buildVehicleRestoreSnapshot(vehicle, images),
    actor_user_id: admin.id,
    actor_name: admin.name,
    actor_email: admin.email,
    expires_at: expiresAt,
  });
}

function parseMutationPayload(input: unknown): VehicleMutationPayload {
  const payload = parseVehiclePayload(input);
  const data =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  return {
    ...payload,
    featuredReplacementVehicleId:
      typeof data.featuredReplacementVehicleId === "string" &&
      data.featuredReplacementVehicleId.trim().length > 0
        ? data.featuredReplacementVehicleId.trim()
        : null,
  };
}

async function createVehicle(request: Request) {
  const auth = await authenticateAdminRequest(request, ["SUPERADMIN", "GESTOR"]);

  if (auth instanceof Response) {
    return auth;
  }

  const payload = parseMutationPayload(await request.json().catch(() => null));
  const fieldErrors = validateVehiclePayload(payload);

  if (Object.keys(fieldErrors).length > 0) {
    return json(
      {
        success: false,
        message: "Revisa los datos del vehiculo.",
        fieldErrors,
      },
      { status: 400 }
    );
  }

  const limitState = await maybeHandleFeaturedLimit({
    adminClient: auth.adminClient,
    payload,
  });

  if ("response" in limitState) {
    return limitState.response;
  }

  await demoteReplacementVehicle({
    adminClient: auth.adminClient,
    adminId: auth.admin.id,
    replacementVehicleId: payload.featuredReplacementVehicleId,
  });

  const { data: createdVehicle, error: createError } = await auth.adminClient
    .from("vehicles")
    .insert({
      marca: payload.marca,
      modelo: payload.modelo,
      condition: payload.condition,
      category: payload.category,
      anio: payload.anio,
      kilometraje: payload.kilometraje,
      precio: payload.precio,
      promotional_price: payload.promotionalPrice,
      currency: payload.currency,
      descripcion: payload.descripcion,
      destacado: payload.destacado,
      created_by_user_id: auth.admin.id,
      updated_by_user_id: auth.admin.id,
    })
    .select(vehicleSelect)
    .single();

  if (createError || !createdVehicle) {
    return json(
      {
        success: false,
        message: "No pudimos guardar el vehiculo en este momento.",
      },
      { status: 400 }
    );
  }

  await insertAuditLog({
    adminClient: auth.adminClient,
    admin: {
      id: auth.admin.id,
      name: auth.admin.name,
      username: auth.admin.username,
    },
    vehicle: createdVehicle,
    action: "CREATE",
  });

  return json(
    {
      success: true,
      vehicle: serializeVehicle(createdVehicle as VehicleRow, []),
      message: "Vehiculo creado correctamente.",
    },
    { status: 201 }
  );
}

async function updateVehicle(request: Request, vehicleId: string) {
  const auth = await authenticateAdminRequest(request, ["SUPERADMIN", "GESTOR"]);

  if (auth instanceof Response) {
    return auth;
  }

  const current = await loadVehicleWithImages(
    auth.adminClient,
    vehicleId
  );

  if (!current) {
    return json(
      { success: false, message: "No encontramos esa unidad." },
      { status: 404 }
    );
  }

  const payload = parseMutationPayload(await request.json().catch(() => null));
  const fieldErrors = validateVehiclePayload(payload);

  if (Object.keys(fieldErrors).length > 0) {
    return json(
      {
        success: false,
        message: "Revisa los datos del vehiculo.",
        fieldErrors,
      },
      { status: 400 }
    );
  }

  const limitState = await maybeHandleFeaturedLimit({
    adminClient: auth.adminClient,
    payload,
    currentVehicle: current.vehicle,
  });

  if ("response" in limitState) {
    return limitState.response;
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
    action: "UPDATE",
    summary: buildVehiclePayloadChangeSummary(current.vehicle, payload),
  });

  await demoteReplacementVehicle({
    adminClient: auth.adminClient,
    adminId: auth.admin.id,
    replacementVehicleId:
      current.vehicle.destacado || !payload.destacado
        ? null
        : payload.featuredReplacementVehicleId,
  });

  const { data: updatedVehicle, error: updateError } = await auth.adminClient
    .from("vehicles")
    .update({
      marca: payload.marca,
      modelo: payload.modelo,
      condition: payload.condition,
      category: payload.category,
      anio: payload.anio,
      kilometraje: payload.kilometraje,
      precio: payload.precio,
      promotional_price: payload.promotionalPrice,
      currency: payload.currency,
      descripcion: payload.descripcion,
      destacado: payload.destacado,
      updated_by_user_id: auth.admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vehicleId)
    .select(vehicleSelect)
    .single();

  if (updateError || !updatedVehicle) {
    return json(
      {
        success: false,
        message: "No pudimos guardar el vehiculo en este momento.",
      },
      { status: 400 }
    );
  }

  await insertAuditLog({
    adminClient: auth.adminClient,
    admin: {
      id: auth.admin.id,
      name: auth.admin.name,
      username: auth.admin.username,
    },
    vehicle: updatedVehicle,
    action: "UPDATE",
  });

  return json({
    success: true,
    vehicle: serializeVehicle(updatedVehicle as VehicleRow, current.images),
    message: "Vehiculo actualizado correctamente.",
  });
}

async function deleteSingleVehicle(request: Request, vehicleId: string) {
  const auth = await authenticateAdminRequest(request, ["SUPERADMIN", "GESTOR"]);

  if (auth instanceof Response) {
    return auth;
  }

  const current = await loadVehicleWithImages(
    auth.adminClient,
    vehicleId
  );

  if (!current) {
    return json(
      { success: false, message: "No encontramos esa unidad." },
      { status: 404 }
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
    action: "DELETE",
    summary: "Se elimino el vehiculo completo.",
  });

  const { error: deleteError } = await auth.adminClient
    .from("vehicles")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by_user_id: auth.admin.id,
      updated_by_user_id: auth.admin.id,
      updated_at: new Date().toISOString(),
      destacado: false,
    })
    .eq("id", vehicleId);

  if (deleteError) {
    return json(
      {
        success: false,
        message: "No pudimos eliminar el vehiculo en este momento.",
      },
      { status: 400 }
    );
  }

  await insertAuditLog({
    adminClient: auth.adminClient,
    admin: {
      id: auth.admin.id,
      name: auth.admin.name,
      username: auth.admin.username,
    },
    vehicle: current.vehicle,
    action: "DELETE",
  });

  return json({
    success: true,
    message: "Vehiculo eliminado correctamente.",
  });
}

async function bulkDeleteVehicles(request: Request) {
  const auth = await authenticateAdminRequest(request, ["SUPERADMIN", "GESTOR"]);

  if (auth instanceof Response) {
    return auth;
  }

  const body = await request.json().catch(() => null);
  const ids = Array.isArray((body as { ids?: unknown[] } | null)?.ids)
    ? Array.from(
        new Set(
          ((body as { ids: unknown[] }).ids ?? []).filter(
            (value): value is string =>
              typeof value === "string" && value.trim().length > 0
          )
        )
      )
    : [];

  if (ids.length === 0) {
    return json(
      { success: false, message: "No recibimos vehiculos para eliminar." },
      { status: 400 }
    );
  }

  let deletedCount = 0;

  for (const vehicleId of ids) {
    const current = await loadVehicleWithImages(
      auth.adminClient,
      vehicleId
    );

    if (!current) {
      continue;
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
      action: "DELETE",
      summary: "Se elimino el vehiculo completo.",
    });

    const { error: deleteError } = await auth.adminClient
      .from("vehicles")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by_user_id: auth.admin.id,
        updated_by_user_id: auth.admin.id,
        updated_at: new Date().toISOString(),
        destacado: false,
      })
      .eq("id", vehicleId);

    if (!deleteError) {
      deletedCount += 1;
      await insertAuditLog({
        adminClient: auth.adminClient,
        admin: {
          id: auth.admin.id,
          name: auth.admin.name,
          username: auth.admin.username,
        },
        vehicle: current.vehicle,
        action: "DELETE",
      });
    }
  }

  if (deletedCount === 0) {
    return json(
      {
        success: false,
        message: "No pudimos eliminar los vehiculos seleccionados.",
      },
      { status: 400 }
    );
  }

  return json({
    success: true,
    deletedCount,
    message:
      deletedCount === 1
        ? "Se elimino 1 vehiculo."
        : `Se eliminaron ${deletedCount} vehiculos.`,
  });
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);

  if (optionsResponse) {
    return optionsResponse;
  }

  const pathParts = getFunctionPathParts(request, "admin-vehicles");
  const [vehicleId] = pathParts;

  if (request.method === "POST" && pathParts.length === 0) {
    return createVehicle(request);
  }

  if (request.method === "PUT" && pathParts.length === 1) {
    return updateVehicle(request, vehicleId ?? "");
  }

  if (request.method === "DELETE" && pathParts.length === 1) {
    return deleteSingleVehicle(request, vehicleId ?? "");
  }

  if (request.method === "DELETE" && pathParts.length === 0) {
    return bulkDeleteVehicles(request);
  }

  return json(
    { success: false, message: "Metodo no soportado." },
    { status: 405 }
  );
});
