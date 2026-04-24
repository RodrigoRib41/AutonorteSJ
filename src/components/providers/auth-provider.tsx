"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";

import {
  type AuthenticatedAdmin,
  getAdminUsernameFromUser,
  hasRequiredRole,
  isAuthenticatedAdmin,
  type AdminRoleValue,
} from "@/lib/admin-auth";
import { getSupabaseClient } from "@/lib/supabaseClient";

type AuthContextValue = {
  session: Session | null;
  admin: AuthenticatedAdmin | null;
  isLoading: boolean;
  refreshAdmin: () => Promise<AuthenticatedAdmin | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadAdminProfile(session: Session | null) {
  if (!session?.user) {
    return null;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, auth_user_id, name, username, email, role, is_active, created_at, updated_at")
    .eq("auth_user_id", session.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const admin: AuthenticatedAdmin = {
    id: data.id,
    authUserId: data.auth_user_id,
    name: data.name,
    username: data.username || getAdminUsernameFromUser(session.user),
    email: data.email ?? session.user.email ?? "",
    role: data.role,
    isActive: data.is_active,
  };

  return isAuthenticatedAdmin(admin) ? admin : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [admin, setAdmin] = useState<AuthenticatedAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshAdmin() {
    const supabase = getSupabaseClient();
    const {
      data: { session: nextSession },
    } = await supabase.auth.getSession();
    const nextAdmin = await loadAdminProfile(nextSession);
    setSession(nextSession);
    setAdmin(nextAdmin);
    return nextAdmin;
  }

  async function signOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setSession(null);
    setAdmin(null);
  }

  useEffect(() => {
    const supabase = getSupabaseClient();

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setAdmin(await loadAdminProfile(data.session));
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setAdmin(await loadAdminProfile(nextSession));
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      admin,
      isLoading,
      refreshAdmin,
      signOut,
    }),
    [admin, isLoading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}

export function useRequireAdmin(allowedRoles: readonly AdminRoleValue[]) {
  const { admin, isLoading } = useAuth();

  return {
    admin,
    isLoading,
    isAuthorized:
      Boolean(admin?.isActive) &&
      Boolean(admin?.role && hasRequiredRole(admin.role, allowedRoles)),
  };
}
