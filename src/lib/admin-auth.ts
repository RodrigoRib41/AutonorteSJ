"use client";

import { type Session, type User } from "@supabase/supabase-js";

import { type AdminRoleValue } from "@/lib/admin-role-utils";
import { normalizeAdminUsername } from "@/lib/admin-users";

export type { AdminRoleValue } from "@/lib/admin-role-utils";

export const allAdminRoles: AdminRoleValue[] = ["SUPERADMIN", "GESTOR"];
export const superadminOnlyRoles: AdminRoleValue[] = ["SUPERADMIN"];
export const vehicleManagerRoles: AdminRoleValue[] = ["SUPERADMIN", "GESTOR"];

export type AuthenticatedAdmin = {
  id: string;
  authUserId: string;
  name: string;
  username: string;
  email: string;
  role: AdminRoleValue;
  isActive: boolean;
};

export function hasRequiredRole(
  role: AdminRoleValue,
  allowedRoles: readonly AdminRoleValue[]
) {
  return allowedRoles.includes(role);
}

export function toAdminAuthEmail(username: string) {
  const normalized = normalizeAdminUsername(username);
  return normalized ? `${normalized}@admin.autonorte.local` : "";
}

export function getAdminUsernameFromUser(user: User | null | undefined) {
  const username =
    typeof user?.user_metadata?.username === "string"
      ? user.user_metadata.username
      : typeof user?.app_metadata?.username === "string"
        ? user.app_metadata.username
        : user?.email?.split("@")[0] ?? "";

  return normalizeAdminUsername(username);
}

export function isAuthenticatedAdmin(user: unknown): user is AuthenticatedAdmin {
  if (!user || typeof user !== "object") {
    return false;
  }

  const admin = user as Partial<AuthenticatedAdmin>;

  return (
    typeof admin.id === "string" &&
    admin.id.length > 0 &&
    typeof admin.authUserId === "string" &&
    admin.authUserId.length > 0 &&
    typeof admin.name === "string" &&
    admin.name.length > 0 &&
    typeof admin.username === "string" &&
    admin.username.length > 0 &&
    typeof admin.email === "string" &&
    typeof admin.isActive === "boolean" &&
    (admin.role === "SUPERADMIN" || admin.role === "GESTOR")
  );
}

export function getSessionAccessToken(session: Session | null) {
  return session?.access_token ?? "";
}
