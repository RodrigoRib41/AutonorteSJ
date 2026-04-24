"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { type AdminRoleValue } from "@/lib/admin-auth";
import { useRequireAdmin } from "@/components/providers/auth-provider";

type AdminGuardProps = {
  allowedRoles: readonly AdminRoleValue[];
  redirectTo?: string;
  children: React.ReactNode;
};

export function AdminGuard({
  allowedRoles,
  redirectTo = "/login",
  children,
}: AdminGuardProps) {
  const router = useRouter();
  const { isAuthorized, isLoading } = useRequireAdmin(allowedRoles);

  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      router.replace(redirectTo);
    }
  }, [isAuthorized, isLoading, redirectTo, router]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm text-zinc-600 shadow-sm">
          <Loader2 className="size-4 animate-spin" />
          Verificando acceso...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
