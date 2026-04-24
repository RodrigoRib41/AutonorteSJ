"use client";

import Link from "next/link";
import { LayoutGrid, ShieldCheck, Trash2 } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { AdminGuard } from "@/components/auth/admin-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { allAdminRoles } from "@/lib/admin-auth";
import { getAdminRoleLabel } from "@/lib/admin-users";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { admin } = useAuth();

  return (
    <AdminGuard allowedRoles={allAdminRoles}>
      <div className="min-h-screen bg-[var(--brand-canvas)] text-zinc-950">
        <header className="border-b border-zinc-950 bg-zinc-950 text-white">
          <div className="h-2 bg-[var(--brand-primary)]" />
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-[var(--brand-primary)] p-3 text-zinc-950 shadow-sm">
                <LayoutGrid className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.22em] text-[var(--brand-primary)] uppercase">
                  TestAutomotores
                </p>
                <h1 className="text-lg font-semibold tracking-tight text-white">
                  Panel administrativo
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <nav className="hidden items-center gap-2 md:flex">
                <Link
                  href="/admin"
                  className="rounded-full px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Resumen
                </Link>
                <Link
                  href="/admin/vehiculos"
                  className="rounded-full px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Vehiculos
                </Link>
                <Link
                  href="/admin/papelera"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Trash2 className="size-4" />
                  Papelera
                </Link>
                {admin?.role === "SUPERADMIN" ? (
                  <Link
                    href="/admin/usuarios"
                    className="rounded-full px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Usuarios
                  </Link>
                ) : null}
              </nav>
              {admin ? (
                <div className="hidden items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-zinc-200 xl:flex">
                  <span className="font-medium text-white">{admin.name}</span>
                  <span className="text-zinc-500">|</span>
                  <span>{admin.username}</span>
                  <span className="rounded-full bg-[var(--brand-primary)] px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-zinc-950 uppercase">
                    {getAdminRoleLabel(admin.role)}
                  </span>
                </div>
              ) : null}
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {children}
        </main>

        <footer className="border-t border-zinc-950 bg-zinc-950">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 text-sm text-zinc-300 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[var(--brand-primary)]" />
              Acceso protegido para el equipo autorizado.
            </div>
            <Link
              href="/"
              className="transition-colors hover:text-[var(--brand-primary)]"
            >
              Volver al sitio
            </Link>
          </div>
        </footer>
      </div>
    </AdminGuard>
  );
}
