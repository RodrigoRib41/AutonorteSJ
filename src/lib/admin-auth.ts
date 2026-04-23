import { type AdminRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  adminUserSelect,
  ensureBootstrapSuperadmin,
  normalizeAdminUsername,
} from "@/lib/admin-users";
import { getPrismaClient } from "@/lib/prisma";

export const allAdminRoles: AdminRole[] = ["SUPERADMIN", "GESTOR"];
export const superadminOnlyRoles: AdminRole[] = ["SUPERADMIN"];
export const vehicleManagerRoles: AdminRole[] = ["SUPERADMIN", "GESTOR"];

export type AuthenticatedAdmin = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: AdminRole;
};

function isAuthenticatedAdmin(user: unknown): user is AuthenticatedAdmin {
  if (!user || typeof user !== "object") {
    return false;
  }

  const admin = user as Partial<AuthenticatedAdmin>;

  return (
    typeof admin.id === "string" &&
    admin.id.length > 0 &&
    typeof admin.name === "string" &&
    admin.name.length > 0 &&
    typeof admin.username === "string" &&
    admin.username.length > 0 &&
    (admin.role === "SUPERADMIN" || admin.role === "GESTOR")
  );
}

export function hasRequiredRole(
  role: AdminRole,
  allowedRoles: readonly AdminRole[]
) {
  return allowedRoles.includes(role);
}

export async function getAuthenticatedAdmin() {
  const session = await auth();

  if (!isAuthenticatedAdmin(session?.user)) {
    return null;
  }

  await ensureBootstrapSuperadmin();

  const sessionAdmin = session.user;
  const username = normalizeAdminUsername(sessionAdmin.username);
  const admin = await getPrismaClient().adminUser.findFirst({
    where: {
      OR: [
        {
          id: sessionAdmin.id,
        },
        ...(username
          ? [
              {
                username,
              },
            ]
          : []),
      ],
    },
    select: adminUserSelect,
  });

  if (!admin || !hasRequiredRole(admin.role, allAdminRoles)) {
    return null;
  }

  return {
    id: admin.id,
    name: admin.name,
    username: admin.username ?? username,
    email: admin.email ?? "",
    role: admin.role,
  };
}

export async function requireAdminPageAccess(
  allowedRoles: readonly AdminRole[] = allAdminRoles
) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect("/login");
  }

  if (!hasRequiredRole(admin.role, allowedRoles)) {
    redirect("/admin");
  }

  return admin;
}

export async function requireAdminApiAccess(
  allowedRoles: readonly AdminRole[] = allAdminRoles
) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return {
      admin: null,
      response: Response.json(
        {
          success: false,
          message: "No autorizado.",
        },
        { status: 401 }
      ),
    };
  }

  if (!hasRequiredRole(admin.role, allowedRoles)) {
    return {
      admin: null,
      response: Response.json(
        {
          success: false,
          message: "No tienes permisos para realizar esta accion.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    admin,
    response: null,
  };
}
