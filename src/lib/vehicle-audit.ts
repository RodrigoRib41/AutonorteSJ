import { type Prisma, type VehicleAuditAction } from "@prisma/client";

import type { AuthenticatedAdmin } from "@/lib/admin-auth";

export const vehicleAuditActorSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  role: true,
} satisfies Prisma.AdminUserSelect;

export const vehicleAuditLogInclude = {
  actor: {
    select: vehicleAuditActorSelect,
  },
} satisfies Prisma.VehicleAuditLogInclude;

export type VehicleAuditLogRecord = Prisma.VehicleAuditLogGetPayload<{
  include: typeof vehicleAuditLogInclude;
}>;

export function getVehicleAuditActionLabel(action: VehicleAuditAction) {
  switch (action) {
    case "CREATE":
      return "Alta";
    case "UPDATE":
      return "Edición";
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
      return "creó";
    case "UPDATE":
      return "actualizó";
    case "DELETE":
      return "eliminó";
    case "RESTORE":
      return "restauró";
    default:
      return "gestionó";
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
    version?: string | null;
  }
) {
  return {
    vehicleId: vehicle.id,
    vehicleLabel: [vehicle.marca, vehicle.modelo, vehicle.version]
      .filter(Boolean)
      .join(" "),
    action,
    actorUserId: admin.id,
    actorName: admin.name,
    actorEmail: admin.username,
  };
}
