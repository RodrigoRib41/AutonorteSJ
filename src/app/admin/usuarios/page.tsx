import { ShieldCheck, UserCog, Users } from "lucide-react";

import { DeleteAdminUserButton } from "@/components/admin/delete-admin-user-button";
import { ResetAdminUserPasswordForm } from "@/components/admin/reset-admin-user-password-form";
import { UserForm } from "@/components/admin/user-form";
import {
  getAdminDisplayName,
  getAdminRoleDescription,
  getAdminRoleLabel,
  getAdminUsername,
  getAdminUsers,
  getAdminUsersSummary,
} from "@/lib/admin-users";
import { requireAdminPageAccess, superadminOnlyRoles } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminUsersPage() {
  const currentAdmin = await requireAdminPageAccess(superadminOnlyRoles);

  const [users, summary] = await Promise.all([
    getAdminUsers(),
    getAdminUsersSummary(),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)] sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold tracking-[0.28em] text-zinc-500 uppercase">
              Permisos internos
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Usuarios del panel
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-600 sm:text-lg">
              Crea gestores, actualiza contrasenas y elimina accesos.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-5 py-4">
              <p className="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                Total
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">
                {summary.totalUsers}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-5 py-4">
              <p className="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                Superadmin
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">
                {summary.superadminCount}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-5 py-4">
              <p className="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                Gestores
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">
                {summary.gestorCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)] sm:p-10">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-zinc-950 p-3 text-white shadow-sm">
              <UserCog className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.28em] text-zinc-500 uppercase">
                Nuevo acceso
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
                Crear usuario gestor
              </h3>
              <p className="mt-3 text-sm leading-7 text-zinc-600">
                Carga los datos del nuevo usuario gestor.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <UserForm />
          </div>
        </div>

        <div className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)] sm:p-10">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-zinc-100 p-3 text-zinc-950">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.28em] text-zinc-500 uppercase">
                Equipo habilitado
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
                Usuarios actuales
              </h3>
              <p className="mt-3 text-sm leading-7 text-zinc-600">
                Revisa quienes tienen acceso y que permisos usan.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {users.map((user) => {
              const username = getAdminUsername(user);

              return (
                <article
                  key={user.id}
                  className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5"
                >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-zinc-950">
                      {getAdminDisplayName(user)}
                    </p>
                    <p className="mt-1 break-all text-sm text-zinc-500">
                      @{username}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-zinc-600">
                      {getAdminRoleDescription(user.role)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase ${
                        user.role === "SUPERADMIN"
                          ? "bg-zinc-950 text-white"
                          : "border border-zinc-200 bg-white text-zinc-700"
                      }`}
                    >
                      {getAdminRoleLabel(user.role)}
                    </span>

                    {user.id === currentAdmin.id ? (
                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500">
                        Tu usuario
                      </span>
                    ) : user.role === "GESTOR" ? (
                      <DeleteAdminUserButton
                        userId={user.id}
                        userUsername={username}
                        userName={getAdminDisplayName(user)}
                      />
                    ) : (
                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500">
                        Superadmin inicial
                      </span>
                    )}
                  </div>
                </div>

                {user.role === "GESTOR" && user.id !== currentAdmin.id ? (
                  <ResetAdminUserPasswordForm
                    userId={user.id}
                    userUsername={username}
                  />
                ) : null}

                <div className="mt-4 flex flex-col gap-2 text-sm text-zinc-500">
                  <span>Alta: {formatDate(user.createdAt)}</span>
                  <span>Ultima actualizacion: {formatDate(user.updatedAt)}</span>
                </div>
                </article>
              );
            })}
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-5 py-4 text-sm leading-7 text-zinc-600">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 size-4 shrink-0 text-zinc-950" />
              <p>
                El superadmin administra los usuarios gestores. Para el primer
                acceso usa{" "}
                <span className="font-medium text-zinc-950">
                  AUTH_ADMIN_USER
                </span>{" "}
                y{" "}
                <span className="font-medium text-zinc-950">
                  AUTH_ADMIN_PASSWORD
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
