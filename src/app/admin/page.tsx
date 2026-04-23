import Link from "next/link";
import {
  CarFront,
  FileText,
  LayoutDashboard,
  Shield,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAdminRoleLabel } from "@/lib/admin-users";
import { requireAdminPageAccess } from "@/lib/admin-auth";
import {
  getRecentVehicleAuditLogs,
  getVehicleCount,
} from "@/lib/vehicle-queries";
import { getPrismaClient } from "@/lib/prisma";
import {
  getVehicleAuditActionLabel,
  getVehicleAuditActionSentence,
  getVehicleAuditActorLabel,
  type VehicleAuditLogRecord,
} from "@/lib/vehicle-audit";
import {
  getActiveVehicleRestorePointCount,
  purgeExpiredVehicleRestorePoints,
} from "@/lib/vehicle-restore-points";

const highlights = [
  {
    title: "Acceso protegido",
    description:
      "El panel queda reservado para usuarios autorizados.",
    icon: Shield,
  },
  {
    title: "Historial de cambios",
    description:
      "Las altas, ediciones y bajas quedan registradas.",
    icon: Sparkles,
  },
  {
    title: "Gestion por roles",
    description:
      "Administradores y gestores trabajan con permisos definidos.",
    icon: FileText,
  },
];

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminPage() {
  const admin = await requireAdminPageAccess();
  const prisma = getPrismaClient();
  const now = new Date();

  await purgeExpiredVehicleRestorePoints(now);

  const [vehicleCount, usersCount, restorePointCount, recentActivity] =
    await Promise.all([
      getVehicleCount(),
      prisma.adminUser.count(),
      getActiveVehicleRestorePointCount(now),
      getRecentVehicleAuditLogs(8),
    ]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)] sm:p-10">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-zinc-950 p-3 text-white shadow-sm">
            <LayoutDashboard className="size-5" />
          </div>
          <div className="max-w-4xl">
            <p className="text-sm font-semibold tracking-[0.28em] text-zinc-500 uppercase">
              Admin
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Stock, usuarios y movimientos recientes.
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-600 sm:text-lg">
              Ingresaste como{" "}
              <span className="font-medium text-zinc-950">{admin.name}</span> y
              tu perfil actual es{" "}
              <span className="font-medium text-zinc-950">
                {getAdminRoleLabel(admin.role)}
              </span>
              . Desde aca podes seguir la actividad del stock y administrar el
              panel.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600">
                {vehicleCount} vehiculos cargados
              </div>
              <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600">
                {usersCount} usuarios admin activos
              </div>
              <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600">
                {restorePointCount} movimientos en papelera
              </div>
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-zinc-950 px-6 text-white hover:bg-zinc-800"
              >
                <Link href="/admin/vehiculos">
                  <CarFront className="size-4" />
                  Gestionar vehiculos
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-zinc-300 bg-white px-6 text-zinc-900 hover:bg-zinc-50"
              >
                <Link href="/admin/papelera">
                  <Trash2 className="size-4" />
                  Papelera
                </Link>
              </Button>
              {admin.role === "SUPERADMIN" ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-zinc-300 bg-white px-6 text-zinc-900 hover:bg-zinc-50"
                >
                  <Link href="/admin/usuarios">
                    <Users className="size-4" />
                    Gestionar usuarios
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="rounded-[1.75rem] border border-zinc-200 bg-white p-6 shadow-[0_20px_50px_rgba(24,24,27,0.05)]"
            >
              <div className="w-fit rounded-2xl bg-zinc-100 p-3 text-zinc-950">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-zinc-950">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-zinc-600">
                {item.description}
              </p>
            </article>
          );
        })}
      </section>

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)] sm:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.28em] text-zinc-500 uppercase">
              Actividad reciente
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
              Ultimos movimientos sobre las unidades
            </h3>
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              Revisa las altas, ediciones y bajas mas recientes.
            </p>
          </div>
        </div>

        {recentActivity.length === 0 ? (
          <div className="mt-8 rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm text-zinc-600">
            Aun no hay movimientos sobre las unidades.
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {recentActivity.map((log: VehicleAuditLogRecord) => (
              <article
                key={log.id}
                className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase ${
                          log.action === "DELETE"
                            ? "bg-red-100 text-red-700"
                            : log.action === "CREATE"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-zinc-950 text-white"
                        }`}
                      >
                        {getVehicleAuditActionLabel(log.action)}
                      </span>
                      <p className="text-base font-semibold text-zinc-950">
                        {log.vehicleLabel}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-zinc-600">
                      <span className="font-medium text-zinc-950">
                        {getVehicleAuditActorLabel(log)}
                      </span>{" "}
                      {getVehicleAuditActionSentence(log.action)} esta unidad.
                    </p>
                  </div>

                  <div className="text-sm text-zinc-500">
                    {formatDate(log.createdAt)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
