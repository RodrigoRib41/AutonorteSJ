import Link from "next/link";
import { ArchiveRestore, Clock3, History, Trash2 } from "lucide-react";

import { RestoreVehicleButton } from "@/components/admin/restore-vehicle-button";
import { Button } from "@/components/ui/button";
import { requireAdminPageAccess, vehicleManagerRoles } from "@/lib/admin-auth";
import {
  formatKilometraje,
  formatPrecio,
  getVehicleCategoryLabel,
  getVehicleConditionLabel,
} from "@/lib/vehicle-records";
import {
  getActiveVehicleRestorePoints,
  getVehicleRestoreActionDescription,
  getVehicleRestoreActionLabel,
  getVehicleRestoreActorLabel,
  parseVehicleRestoreSnapshot,
  purgeExpiredVehicleRestorePoints,
  type VehicleRestorePointRecord,
  VEHICLE_RESTORE_RETENTION_DAYS,
} from "@/lib/vehicle-restore-points";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getDaysUntilExpiry(expiresAt: Date, now: Date) {
  return Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_MS));
}

export default async function AdminTrashPage() {
  await requireAdminPageAccess(vehicleManagerRoles);

  const now = new Date();
  await purgeExpiredVehicleRestorePoints(now);

  const restorePoints: VehicleRestorePointRecord[] =
    await getActiveVehicleRestorePoints(now);
  const deletedCount = restorePoints.filter(
    (point) => point.action === "DELETE"
  ).length;
  const updateCount = restorePoints.filter(
    (point) => point.action === "UPDATE"
  ).length;

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)] sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="w-fit rounded-2xl bg-zinc-950 p-3 text-white shadow-sm">
              <Trash2 className="size-5" />
            </div>
            <p className="mt-6 text-sm font-semibold tracking-[0.28em] text-zinc-500 uppercase">
              Papelera
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Papelera de vehiculos
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-600 sm:text-lg">
              Podes restaurar bajas y cambios recientes durante{" "}
              {VEHICLE_RESTORE_RETENTION_DAYS} dias.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600">
              {restorePoints.length} puntos disponibles
            </div>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full border-zinc-300 bg-white px-6 text-zinc-900 hover:bg-zinc-50"
            >
              <Link href="/admin/vehiculos">Volver a vehiculos</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <article className="rounded-[1.5rem] border border-zinc-200 bg-white p-6 shadow-[0_20px_50px_rgba(24,24,27,0.05)]">
          <div className="w-fit rounded-2xl bg-red-50 p-3 text-red-700">
            <Trash2 className="size-5" />
          </div>
          <p className="mt-5 text-3xl font-semibold text-zinc-950">
            {deletedCount}
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-600">
            Vehiculos dados de baja
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-zinc-200 bg-white p-6 shadow-[0_20px_50px_rgba(24,24,27,0.05)]">
          <div className="w-fit rounded-2xl bg-zinc-100 p-3 text-zinc-950">
            <History className="size-5" />
          </div>
          <p className="mt-5 text-3xl font-semibold text-zinc-950">
            {updateCount}
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-600">
            Modificaciones reversibles
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-zinc-200 bg-white p-6 shadow-[0_20px_50px_rgba(24,24,27,0.05)]">
          <div className="w-fit rounded-2xl bg-emerald-50 p-3 text-emerald-700">
            <Clock3 className="size-5" />
          </div>
          <p className="mt-5 text-3xl font-semibold text-zinc-950">
            {VEHICLE_RESTORE_RETENTION_DAYS}
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-600">
            Dias maximos de retencion
          </p>
        </article>
      </section>

      {restorePoints.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
          <div className="mx-auto flex max-w-xl flex-col items-center">
            <div className="rounded-3xl bg-white p-4 text-zinc-950 shadow-sm">
              <ArchiveRestore className="size-6" />
            </div>
            <h3 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-950">
              No hay cambios recientes para restaurar
            </h3>
            <p className="mt-3 text-base leading-7 text-zinc-600">
              Las bajas y modificaciones van a aparecer aca durante 7 dias.
            </p>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          {restorePoints.map((point) => {
            const snapshot = parseVehicleRestoreSnapshot(point.snapshot);
            const snapshotVehicle = snapshot?.vehicle;
            const daysUntilExpiry = getDaysUntilExpiry(point.expiresAt, now);
            const canRestore = point.action === "DELETE" || !point.vehicle.deletedAt;

            return (
              <article
                key={point.id}
                className="rounded-[1.75rem] border border-zinc-200 bg-white p-6 shadow-[0_20px_50px_rgba(24,24,27,0.05)] sm:p-7"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase ${
                          point.action === "DELETE"
                            ? "bg-red-100 text-red-700"
                            : "bg-zinc-950 text-white"
                        }`}
                      >
                        {getVehicleRestoreActionLabel(point.action)}
                      </span>
                      <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-zinc-600 uppercase">
                        Vence en {daysUntilExpiry} dia
                        {daysUntilExpiry === 1 ? "" : "s"}
                      </span>
                    </div>

                    <h3 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950">
                      {point.vehicleLabel}
                    </h3>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600">
                      {point.summary ??
                        getVehicleRestoreActionDescription(point.action)}
                    </p>

                    {snapshotVehicle ? (
                      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 p-4">
                          <p className="text-xs font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                            Estado anterior
                          </p>
                          <p className="mt-2 font-semibold text-zinc-950">
                            {snapshotVehicle.marca} {snapshotVehicle.modelo}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 p-4">
                          <p className="text-xs font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                            Tipo / año
                          </p>
                          <p className="mt-2 font-semibold text-zinc-950">
                            {getVehicleCategoryLabel(snapshotVehicle.category)} /{" "}
                            {getVehicleConditionLabel(snapshotVehicle.condition)} /{" "}
                            {snapshotVehicle.anio}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 p-4">
                          <p className="text-xs font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                            Kilometraje
                          </p>
                          <p className="mt-2 font-semibold text-zinc-950">
                            {formatKilometraje(snapshotVehicle.kilometraje)}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 p-4">
                          <p className="text-xs font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                            Precio
                          </p>
                          <p className="mt-2 font-semibold text-zinc-950">
                            {formatPrecio(
                              snapshotVehicle.promotionalPrice ??
                                snapshotVehicle.precio,
                              snapshotVehicle.currency
                            )}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        No pudimos leer el detalle guardado de este movimiento.
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-4 text-sm text-zinc-500">
                      <span>
                        Movimiento:{" "}
                        <span className="font-medium text-zinc-700">
                          {formatDate(point.createdAt)}
                        </span>
                      </span>
                      <span>
                        Vencimiento:{" "}
                        <span className="font-medium text-zinc-700">
                          {formatDate(point.expiresAt)}
                        </span>
                      </span>
                      <span>
                        Usuario:{" "}
                        <span className="font-medium text-zinc-700">
                          {getVehicleRestoreActorLabel(point)}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 lg:items-end">
                    {canRestore ? (
                      <RestoreVehicleButton
                        restorePointId={point.id}
                        action={point.action}
                        vehicleLabel={point.vehicleLabel}
                      />
                    ) : (
                      <div className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-600">
                        Restaura primero la baja mas reciente de esta unidad.
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
