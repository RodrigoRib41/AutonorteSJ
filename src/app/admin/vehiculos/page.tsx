import Link from "next/link";
import { CarFront, PencilLine, Plus } from "lucide-react";

import { DeleteVehicleButton } from "@/components/admin/delete-vehicle-button";
import { Button } from "@/components/ui/button";
import { CloudinaryVehicleImage } from "@/components/vehicles/cloudinary-vehicle-image";
import { VehicleFilters } from "@/components/vehicles/vehicle-filters";
import { requireAdminPageAccess, vehicleManagerRoles } from "@/lib/admin-auth";
import {
  hasActiveVehicleFilters,
  parseVehicleFilters,
  type VehicleSearchParams,
} from "@/lib/vehicle-filters";
import {
  getVehicleBrands,
  getVehicleCount,
  getVehicles,
} from "@/lib/vehicle-queries";
import {
  formatKilometraje,
  formatPrecio,
  getVehicleCategoryLabel,
  getVehicleConditionLabel,
  getVehicleDisplayName,
  getVehicleDisplayPrice,
  getVehiclePrimaryImage,
  hasVehiclePromotion,
  type VehiclePersisted,
} from "@/lib/vehicle-records";
import { getAdminDisplayName } from "@/lib/admin-users";

export const dynamic = "force-dynamic";

type AdminVehiclesPageProps = {
  searchParams: Promise<VehicleSearchParams>;
};

export default async function AdminVehiclesPage({
  searchParams,
}: AdminVehiclesPageProps) {
  await requireAdminPageAccess(vehicleManagerRoles);

  const filters = parseVehicleFilters(await searchParams);
  const [vehicles, brands, totalCount]: [VehiclePersisted[], string[], number] =
    await Promise.all([
      getVehicles(filters),
      getVehicleBrands(),
      getVehicleCount(),
    ]);
  const hasFilters = hasActiveVehicleFilters(filters, {
    includeAdminFields: true,
  });

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)] sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold tracking-[0.28em] text-zinc-500 uppercase">
              Gestion de stock
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Vehiculos publicados
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-600 sm:text-lg">
              Carga y edita las unidades publicadas. Tambien podes marcar
              destacados, promociones y categorias.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600">
              {hasFilters
                ? `${vehicles.length} de ${totalCount} vehiculos`
                : `${totalCount} vehiculos cargados`}
            </div>
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-zinc-950 px-6 text-white hover:bg-zinc-800"
            >
              <Link href="/admin/vehiculos/nuevo">
                <Plus className="size-4" />
                Nuevo vehiculo
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {totalCount > 0 ? (
        <VehicleFilters
          actionPath="/admin/vehiculos"
          brands={brands}
          filters={filters}
          totalCount={totalCount}
          visibleCount={vehicles.length}
          variant="admin"
        />
      ) : null}

      {vehicles.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
          <div className="mx-auto flex max-w-xl flex-col items-center">
            <div className="rounded-3xl bg-white p-4 text-zinc-950 shadow-sm">
              <CarFront className="size-6" />
            </div>
            <h3 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-950">
              {hasFilters
                ? "No encontramos vehiculos con esos criterios"
                : "Aun no hay vehiculos cargados"}
            </h3>
            <p className="mt-3 text-base leading-7 text-zinc-600">
              {hasFilters
                ? "Proba ajustar la busqueda o limpiar los filtros."
                : "Carga la primera unidad para verla en el sitio."}
            </p>
            {hasFilters ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="mt-8 h-12 rounded-full border-zinc-300 bg-white px-6 text-zinc-900 hover:bg-zinc-50"
              >
                <Link href="/admin/vehiculos">Limpiar filtros</Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="mt-8 h-12 rounded-full bg-zinc-950 px-6 text-white hover:bg-zinc-800"
              >
                <Link href="/admin/vehiculos/nuevo">Cargar primer vehiculo</Link>
              </Button>
            )}
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_24px_60px_rgba(24,24,27,0.06)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr className="text-left text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                  <th className="px-6 py-4">Vehiculo</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Año</th>
                  <th className="px-6 py-4">Kilometraje</th>
                  <th className="px-6 py-4">Precio</th>
                  <th className="px-6 py-4">Destacado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {vehicles.map((vehicle: VehiclePersisted) => {
                  const primaryImage = getVehiclePrimaryImage(vehicle);
                  const hasPromotion = hasVehiclePromotion(vehicle);
                  const displayPrice = getVehicleDisplayPrice(vehicle);

                  return (
                    <tr key={vehicle.id} className="align-top">
                      <td className="px-6 py-5">
                        <div className="flex items-start gap-4">
                          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                            {primaryImage ? (
                              <CloudinaryVehicleImage
                                publicId={primaryImage.publicId}
                                format={primaryImage.format}
                                alt={
                                  primaryImage.alt ??
                                  `${vehicle.marca} ${vehicle.modelo}`
                                }
                                variant="adminThumbnail"
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                <CarFront className="size-5" />
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                              {vehicle.marca}
                            </p>
                            <p className="mt-2 text-lg font-semibold text-zinc-950">
                              {vehicle.modelo}
                            </p>
                            <p className="mt-2 text-sm text-zinc-500">
                              {getVehicleDisplayName(vehicle)} | {vehicle.images.length} fotos
                            </p>
                            <p className="mt-1 text-sm text-zinc-500">
                              Categoria:{" "}
                              <span className="font-medium text-zinc-700">
                                {getVehicleCategoryLabel(vehicle.category)}
                              </span>
                            </p>
                            <div className="mt-3 space-y-1 text-sm text-zinc-500">
                              <p>
                                Alta:{" "}
                                <span className="font-medium text-zinc-700">
                                  {vehicle.createdBy
                                    ? getAdminDisplayName(vehicle.createdBy)
                                    : "Sin registro"}
                                </span>
                              </p>
                              <p>
                                Ultima gestion:{" "}
                                <span className="font-medium text-zinc-700">
                                  {vehicle.updatedBy
                                    ? getAdminDisplayName(vehicle.updatedBy)
                                    : "Sin registro"}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-zinc-700 uppercase">
                          {getVehicleConditionLabel(vehicle.condition)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-zinc-700">
                        {vehicle.anio}
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-zinc-700">
                        {formatKilometraje(vehicle.kilometraje)}
                      </td>
                      <td className="px-6 py-5">
                        {hasPromotion ? (
                          <div>
                            <p className="text-xs font-medium text-zinc-400 line-through">
                              {formatPrecio(vehicle.precio, vehicle.currency)}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-zinc-950">
                              {formatPrecio(displayPrice, vehicle.currency)}
                            </p>
                            <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-emerald-700 uppercase">
                              Promocion
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm font-semibold text-zinc-950">
                            {formatPrecio(vehicle.precio, vehicle.currency)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase ${
                            vehicle.destacado
                              ? "bg-zinc-950 text-white"
                              : "border border-zinc-200 bg-zinc-50 text-zinc-500"
                          }`}
                        >
                          {vehicle.destacado ? "Si" : "No"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-full border-zinc-300 bg-white px-4 text-zinc-900 hover:bg-zinc-50"
                          >
                            <Link
                              href={`/admin/vehiculos/${vehicle.id}/editar`}
                              prefetch={false}
                            >
                              <PencilLine className="size-4" />
                              Editar
                            </Link>
                          </Button>
                          <DeleteVehicleButton
                            vehicleId={vehicle.id}
                            marca={vehicle.marca}
                            modelo={vehicle.modelo}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
