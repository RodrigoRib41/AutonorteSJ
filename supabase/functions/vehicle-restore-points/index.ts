import { getFunctionPathParts, handleOptions, json } from "../_shared/http.ts";
import { authenticateAdminRequest } from "../_shared/supabase.ts";
import {
  parseVehicleRestoreSnapshot,
  type VehicleImageRow,
} from "../_shared/vehicle-state.ts";

async function restoreVehicle(request: Request, restorePointId: string) {
  const auth = await authenticateAdminRequest(request, ["SUPERADMIN", "GESTOR"]);

  if (auth instanceof Response) {
    return auth;
  }

  if (!restorePointId) {
    return json(
      { success: false, message: "Falta el movimiento a restaurar." },
      { status: 400 }
    );
  }

  const { data: restorePoint, error: restorePointError } = await auth.adminClient
    .from("vehicle_restore_points")
    .select(
      "id, vehicle_id, vehicle_label, action, snapshot, restored_at, expires_at"
    )
    .eq("id", restorePointId)
    .is("restored_at", null)
    .maybeSingle();

  if (restorePointError || !restorePoint) {
    return json(
      { success: false, message: "No encontramos ese movimiento." },
      { status: 404 }
    );
  }

  if (new Date(restorePoint.expires_at).getTime() < Date.now()) {
    return json(
      { success: false, message: "Este punto de restauracion ya vencio." },
      { status: 400 }
    );
  }

  const snapshot = parseVehicleRestoreSnapshot(restorePoint.snapshot);

  if (!snapshot) {
    return json(
      { success: false, message: "No pudimos leer la version guardada de la unidad." },
      { status: 400 }
    );
  }

  const vehicleRow = {
    id: snapshot.vehicle.id,
    marca: snapshot.vehicle.marca,
    modelo: snapshot.vehicle.modelo,
    condition: snapshot.vehicle.condition,
    category: snapshot.vehicle.category,
    anio: snapshot.vehicle.anio,
    kilometraje: snapshot.vehicle.kilometraje,
    precio: snapshot.vehicle.precio,
    promotional_price: snapshot.vehicle.promotionalPrice,
    currency: snapshot.vehicle.currency,
    descripcion: snapshot.vehicle.descripcion,
    destacado: snapshot.vehicle.destacado,
    created_by_user_id: snapshot.vehicle.createdByUserId,
    updated_by_user_id: auth.admin.id,
    deleted_by_user_id:
      restorePoint.action === "DELETE" ? null : snapshot.vehicle.deletedByUserId,
    deleted_at: restorePoint.action === "DELETE" ? null : snapshot.vehicle.deletedAt,
    created_at: snapshot.vehicle.createdAt,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertVehicleError } = await auth.adminClient
    .from("vehicles")
    .upsert(vehicleRow, { onConflict: "id" });

  if (upsertVehicleError) {
    return json(
      { success: false, message: "No pudimos restaurar la unidad." },
      { status: 400 }
    );
  }

  await auth.adminClient.from("vehicle_images").delete().eq("vehicle_id", snapshot.vehicle.id);

  if (snapshot.images.length > 0) {
    const imageRows = snapshot.images.map((image) => ({
      id: image.id,
      vehicle_id: snapshot.vehicle.id,
      public_id: image.publicId,
      asset_id: image.assetId,
      alt: image.alt,
      sort_order: image.sortOrder,
      is_primary: image.isPrimary,
      width: image.width,
      height: image.height,
      format: image.format,
      bytes: image.bytes,
      created_at: image.createdAt,
    }));

    const { error: imageError } = await auth.adminClient
      .from("vehicle_images")
      .insert(imageRows as VehicleImageRow[]);

    if (imageError) {
      return json(
        { success: false, message: "No pudimos restaurar las imagenes de la unidad." },
        { status: 400 }
      );
    }
  }

  await auth.adminClient
    .from("vehicle_restore_points")
    .update({
      restored_at: new Date().toISOString(),
      restored_by_user_id: auth.admin.id,
      restored_by_name: auth.admin.name,
      restored_by_email: auth.admin.email,
    })
    .eq("id", restorePointId);

  await auth.adminClient.from("vehicle_audit_logs").insert({
    vehicle_id: snapshot.vehicle.id,
    vehicle_label: `${snapshot.vehicle.marca} ${snapshot.vehicle.modelo}`.trim(),
    action: "RESTORE",
    actor_user_id: auth.admin.id,
    actor_name: auth.admin.name,
    actor_email: auth.admin.username,
  });

  return json({
    success: true,
    message: "Movimiento restaurado correctamente.",
  });
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);

  if (optionsResponse) {
    return optionsResponse;
  }

  const pathParts = getFunctionPathParts(request, "vehicle-restore-points");
  const [restorePointId, action] = pathParts;

  if (
    request.method === "POST" &&
    pathParts.length === 2 &&
    action === "restore"
  ) {
    return restoreVehicle(request, restorePointId ?? "");
  }

  return json(
    { success: false, message: "Metodo no soportado." },
    { status: 405 }
  );
});
