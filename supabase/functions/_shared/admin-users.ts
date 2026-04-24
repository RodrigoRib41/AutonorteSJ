export type AdminUserPayload = {
  name: string;
  username: string;
  password: string;
};

export type AdminUserPasswordResetPayload = {
  password: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

const adminAuthEmailDomain =
  Deno.env.get("ADMIN_AUTH_EMAIL_DOMAIN")?.trim() ||
  Deno.env.get("NEXT_PUBLIC_ADMIN_AUTH_EMAIL_DOMAIN")?.trim() ||
  "autonortesj-admin.com";

export function normalizeAdminUsername(value: unknown) {
  return asString(value).toLowerCase();
}

export function toAdminAuthEmail(username: string) {
  return username ? `${username}@${adminAuthEmailDomain}` : "";
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

export function validateAdminUserPayload(payload: AdminUserPayload) {
  const fieldErrors: Partial<Record<keyof AdminUserPayload, string>> = {};

  if (payload.name.length < 2) {
    fieldErrors.name = "Ingresa un nombre valido.";
  }

  if (
    payload.username.length < 3 ||
    payload.username.length > 50 ||
    /\s/.test(payload.username)
  ) {
    fieldErrors.username = "Ingresa un usuario valido, sin espacios.";
  }

  if (payload.password.trim().length < 8) {
    fieldErrors.password = "La contrasena debe tener al menos 8 caracteres.";
  }

  return fieldErrors;
}

export function parsePasswordResetPayload(
  input: unknown
): AdminUserPasswordResetPayload {
  const data =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  return {
    password: typeof data.password === "string" ? data.password : "",
  };
}

export function validatePasswordResetPayload(
  payload: AdminUserPasswordResetPayload
) {
  const fieldErrors: Partial<
    Record<keyof AdminUserPasswordResetPayload, string>
  > = {};

  if (payload.password.trim().length < 8) {
    fieldErrors.password = "La contrasena debe tener al menos 8 caracteres.";
  }

  return fieldErrors;
}

export function serializeAdminUser(user: {
  id: string;
  auth_user_id: string | null;
  name: string;
  username: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: user.id,
    authUserId: user.auth_user_id,
    name: user.name,
    username: user.username ?? user.email ?? user.name,
    email: user.email,
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}
