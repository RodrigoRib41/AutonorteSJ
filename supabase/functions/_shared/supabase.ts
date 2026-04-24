import {
  createClient,
  type SupabaseClient,
  type User,
} from "npm:@supabase/supabase-js@2";

import { json } from "./http.ts";

export type AdminRole = "SUPERADMIN" | "GESTOR";

export type AuthenticatedAdmin = {
  id: string;
  auth_user_id: string | null;
  name: string;
  username: string;
  email: string | null;
  role: AdminRole;
  is_active: boolean;
};

export type AdminContext = {
  adminClient: SupabaseClient;
  authUser: User;
  admin: AuthenticatedAdmin;
};

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();

  if (!value) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

function getSupabaseUrl() {
  return (
    Deno.env.get("SUPABASE_URL")?.trim() ??
    Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")?.trim() ??
    ""
  );
}

function getSupabaseAnonKey() {
  return (
    Deno.env.get("SUPABASE_ANON_KEY")?.trim() ??
    Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")?.trim() ??
    ""
  );
}

export function createAdminClient() {
  return createClient(
    getSupabaseUrl() || getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function createUserClient(authorization: string) {
  return createClient(
    getSupabaseUrl() || getRequiredEnv("SUPABASE_URL"),
    getSupabaseAnonKey() || getRequiredEnv("SUPABASE_ANON_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    }
  );
}

export async function authenticateAdminRequest(
  request: Request,
  allowedRoles: readonly AdminRole[] = ["SUPERADMIN", "GESTOR"]
): Promise<AdminContext | Response> {
  const authorization = request.headers.get("Authorization");

  if (!authorization) {
    return json(
      { success: false, message: "No autorizado." },
      { status: 401 }
    );
  }

  const userClient = createUserClient(authorization);
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return json(
      { success: false, message: "Sesion invalida o vencida." },
      { status: 401 }
    );
  }

  const { data: admin, error: adminError } = await adminClient
    .from("admin_users")
    .select("id, auth_user_id, name, username, email, role, is_active")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError || !admin) {
    return json(
      { success: false, message: "Tu usuario no tiene acceso habilitado." },
      { status: 403 }
    );
  }

  if (!allowedRoles.includes(admin.role as AdminRole)) {
    return json(
      { success: false, message: "No tienes permisos para esta accion." },
      { status: 403 }
    );
  }

  return {
    adminClient,
    authUser: user,
    admin: admin as AuthenticatedAdmin,
  };
}
