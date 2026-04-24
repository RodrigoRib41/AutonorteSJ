import {
  type AdminRoleValue,
  adminRoles,
  getAdminRoleDescription,
  getAdminRoleLabel,
  isAdminRole,
} from "@/lib/admin-role-utils";

export { adminRoles, getAdminRoleDescription, getAdminRoleLabel, isAdminRole };
export type { AdminRoleValue };

export type AdminUserRecord = {
  id: string;
  authUserId: string | null;
  name: string;
  username: string;
  email: string | null;
  role: AdminRoleValue;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

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
  authUserId: string | null;
  name: string;
  username: string;
  email: string | null;
  role: AdminRoleValue;
  isActive: boolean;
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

export function serializeAdminUser(user: AdminUserRecord): AdminUserApiRecord {
  return {
    id: user.id,
    authUserId: user.authUserId,
    name: user.name,
    username: user.username ?? user.email ?? user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
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
    errors.name = "Ingresa un nombre valido.";
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
