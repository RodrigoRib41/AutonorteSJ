import { type Prisma } from "@prisma/client";

import {
  type AdminRoleValue,
  adminRoles,
  getAdminRoleDescription,
  getAdminRoleLabel,
  isAdminRole,
} from "@/lib/admin-role-utils";
import { getPrismaClient } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

export { adminRoles, getAdminRoleDescription, getAdminRoleLabel, isAdminRole };
export type { AdminRoleValue };

export const adminUserSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AdminUserSelect;

const bootstrapAdminUserSelect = {
  ...adminUserSelect,
  passwordHash: true,
} satisfies Prisma.AdminUserSelect;

export type AdminUserRecord = Prisma.AdminUserGetPayload<{
  select: typeof adminUserSelect;
}>;

export type AdminUsersSummary = {
  totalUsers: number;
  superadminCount: number;
  gestorCount: number;
};

export type AdminUserPayload = {
  name: string;
  username: string;
  password: string;
};

export type AdminUserFieldErrors = Partial<Record<keyof AdminUserPayload, string>>;

export type AdminUserPasswordResetPayload = {
  password: string;
};

export type AdminUserPasswordResetFieldErrors = Partial<
  Record<keyof AdminUserPasswordResetPayload, string>
>;

export type AdminUserApiRecord = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: AdminRoleValue;
  createdAt: string;
  updatedAt: string;
};

export type AdminUsersListResponse =
  | {
      success: true;
      users: AdminUserApiRecord[];
      message?: string;
    }
  | {
      success: false;
      message: string;
      fieldErrors?: AdminUserFieldErrors;
    };

export type AdminUserItemResponse =
  | {
      success: true;
      user: AdminUserApiRecord;
      message?: string;
    }
  | {
      success: false;
      message: string;
      fieldErrors?: AdminUserFieldErrors;
    };

export type AdminUserDeleteResponse =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
    };

export type AdminUserPasswordResetResponse =
  | {
      success: true;
      message: string;
      user: AdminUserApiRecord;
    }
  | {
      success: false;
      message: string;
      fieldErrors?: AdminUserPasswordResetFieldErrors;
    };

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeAdminEmail(value: unknown) {
  return asString(value).toLowerCase();
}

export function normalizeAdminUsername(value: unknown) {
  return asString(value).toLowerCase();
}

export function parseAdminUserPayload(input: unknown): AdminUserPayload {
  const data =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  return {
    name: asString(data.name),
    username: normalizeAdminUsername(data.username),
    password: typeof data.password === "string" ? data.password : "",
  };
}

export function validateAdminUserPayload(
  payload: AdminUserPayload
): AdminUserFieldErrors {
  const errors: AdminUserFieldErrors = {};

  if (payload.name.length < 2) {
    errors.name = "Ingresa un nombre válido.";
  }

  const isValidUsername =
    payload.username.length >= 3 &&
    payload.username.length <= 50 &&
    !/\s/.test(payload.username);

  if (!isValidUsername) {
    errors.username = "Ingresa un usuario valido, sin espacios.";
  }

  if (payload.password.trim().length < 8) {
    errors.password = "La contrasena debe tener al menos 8 caracteres.";
  }

  return errors;
}

export function parseAdminUserPasswordResetPayload(
  input: unknown
): AdminUserPasswordResetPayload {
  const data =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  return {
    password: typeof data.password === "string" ? data.password : "",
  };
}

export function validateAdminUserPasswordResetPayload(
  payload: AdminUserPasswordResetPayload
): AdminUserPasswordResetFieldErrors {
  const errors: AdminUserPasswordResetFieldErrors = {};

  if (payload.password.trim().length < 8) {
    errors.password = "La contrasena debe tener al menos 8 caracteres.";
  }

  return errors;
}

export function serializeAdminUser(user: AdminUserRecord): AdminUserApiRecord {
  return {
    id: user.id,
    name: user.name,
    username: user.username ?? user.email ?? user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function getAdminDisplayName(user: {
  name?: string | null;
  username?: string | null;
  email?: string | null;
}) {
  return (
    user.name?.trim() ||
    user.username?.trim() ||
    user.email?.trim() ||
    "Usuario sin nombre"
  );
}

export function getAdminUsername(user: {
  name?: string | null;
  username?: string | null;
  email?: string | null;
}) {
  return (
    user.username?.trim() ||
    user.email?.trim() ||
    user.name?.trim() ||
    "usuario"
  );
}

export async function ensureBootstrapSuperadmin() {
  const username = normalizeAdminUsername(
    process.env.AUTH_ADMIN_USER ??
      process.env.AUTH_ADMIN_USERNAME ??
      process.env.AUTH_ADMIN_EMAIL
  );
  const legacyEmail = normalizeAdminEmail(process.env.AUTH_ADMIN_EMAIL);
  const password =
    typeof process.env.AUTH_ADMIN_PASSWORD === "string"
      ? process.env.AUTH_ADMIN_PASSWORD
      : "";

  if (!username || password.trim().length < 8) {
    return null;
  }

  const prisma = getPrismaClient();
  const lookupConditions: Prisma.AdminUserWhereInput[] = [
    {
      username,
    },
  ];

  if (legacyEmail) {
    lookupConditions.push({
      email: legacyEmail,
    });
  }

  let existingUser = await prisma.adminUser.findFirst({
    where: {
      OR: lookupConditions,
    },
    select: bootstrapAdminUserSelect,
  });
  const superadminCount = await prisma.adminUser.count({
    where: {
      role: "SUPERADMIN",
    },
  });

  if (!existingUser && superadminCount === 1) {
    existingUser = await prisma.adminUser.findFirst({
      where: {
        role: "SUPERADMIN",
      },
      select: bootstrapAdminUserSelect,
    });
  }

  if (existingUser) {
    if (existingUser.role !== "SUPERADMIN" && superadminCount > 0) {
      return null;
    }

    const passwordMatches = await verifyPassword(
      password,
      existingUser.passwordHash
    );

    return prisma.adminUser.update({
      where: {
        id: existingUser.id,
      },
      data: {
        name: existingUser.name || "Superadmin",
        username,
        email: null,
        passwordHash: passwordMatches
          ? existingUser.passwordHash
          : await hashPassword(password),
        role: "SUPERADMIN",
      },
      select: adminUserSelect,
    });
  }

  if (superadminCount > 0) {
    return null;
  }

  const passwordHash = await hashPassword(password);

  return prisma.adminUser.create({
    data: {
      name: "Superadmin",
      username,
      email: null,
      passwordHash,
      role: "SUPERADMIN",
    },
    select: adminUserSelect,
  });
}

export async function getAdminUsers(): Promise<AdminUserRecord[]> {
  const users = await getPrismaClient().adminUser.findMany({
    select: adminUserSelect,
    orderBy: [{ role: "asc" }, { name: "asc" }, { createdAt: "asc" }],
  });

  return users.sort((left, right) => {
    if (left.role === right.role) {
      return left.name.localeCompare(right.name, "es");
    }

    return left.role === "SUPERADMIN" ? -1 : 1;
  });
}

export async function getAdminUsersSummary(): Promise<AdminUsersSummary> {
  const prisma = getPrismaClient();
  const [totalUsers, superadminCount, gestorCount] = await Promise.all([
    prisma.adminUser.count(),
    prisma.adminUser.count({
      where: {
        role: "SUPERADMIN",
      },
    }),
    prisma.adminUser.count({
      where: {
        role: "GESTOR",
      },
    }),
  ]);

  return {
    totalUsers,
    superadminCount,
    gestorCount,
  };
}
