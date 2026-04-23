import { type AdminRole } from "@prisma/client";

export const adminRoles = ["SUPERADMIN", "GESTOR"] as const;

export type AdminRoleValue = (typeof adminRoles)[number];

export function isAdminRole(value: unknown): value is AdminRoleValue {
  return typeof value === "string" && adminRoles.includes(value as AdminRoleValue);
}

export function getAdminRoleLabel(role: AdminRole) {
  return role === "SUPERADMIN" ? "Superadmin" : "Gestor";
}

export function getAdminRoleDescription(role: AdminRole) {
  return role === "SUPERADMIN"
    ? "Acceso total a usuarios, stock y permisos."
    : "Acceso para crear, editar y eliminar vehiculos.";
}
