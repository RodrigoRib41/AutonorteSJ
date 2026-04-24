import type { AuthenticatedAdmin } from "@/lib/admin-auth";
import type { VehicleAuditAction } from "@/lib/vehicle-records";

export type VehicleAuditLogRecord = {
  id: string;
  vehicleId: string;
  vehicleLabel: string;
  action: VehicleAuditAction;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actor?: {
    name?: string | null;
    username?: string | null;
    email?: string | null;
  } | null;
  createdAt: string;
};

export function getVehicleAuditActionLabel(action: VehicleAuditAction) {
  switch (action) {
    case "CREATE":
      return "Alta";
    case "UPDATE":
      return "Edicion";
    case "DELETE":
      return "Baja";
    case "RESTORE":
      return "Restauracion";
    default:
      return action;
  }
}

export function getVehicleAuditActionSentence(action: VehicleAuditAction) {
  switch (action) {
    case "CREATE":
      return "creo";
    case "UPDATE":
      return "actualizo";
    case "DELETE":
      return "elimino";
    case "RESTORE":
      return "restauro";
    default:
      return "gestiono";
  }
}

export function getVehicleAuditActorLabel(log: {
  actorName?: string | null;
  actorEmail?: string | null;
  actor?: {
    name?: string | null;
    username?: string | null;
    email?: string | null;
  } | null;
}) {
  return (
    log.actorName?.trim() ||
    log.actor?.name?.trim() ||
    log.actor?.username?.trim() ||
    log.actorEmail?.trim() ||
    log.actor?.email?.trim() ||
    "Usuario no disponible"
  );
}

export function buildVehicleAuditLogData(
  action: VehicleAuditAction,
  admin: AuthenticatedAdmin,
  vehicle: {
    id: string;
    marca: string;
    modelo: string;
  }
) {
  return {
    vehicle_id: vehicle.id,
    vehicle_label: `${vehicle.marca} ${vehicle.modelo}`.trim(),
    action,
    actor_user_id: admin.id,
    actor_name: admin.name,
    actor_email: admin.username,
  };
}
