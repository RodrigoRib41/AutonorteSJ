import Link from "next/link";
import { CarFront, Plus } from "lucide-react";

import {
  AdminVehiclesTable,
  type AdminVehiclesTableItem,
} from "@/components/admin/admin-vehicles-table";
import { Button } from "@/components/ui/button";
import { VehicleFilters } from "@/components/vehicles/vehicle-filters";
import { requireAdminPageAccess, vehicleManagerRoles } from "@/lib/admin-auth";
import { getAdminDisplayName } from "@/lib/admin-users";
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
  getVehiclePrimaryImage,
  type VehiclePersisted,
} from "@/lib/vehicle-records";

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
  const tableVehicles: AdminVehiclesTableItem[] = vehicles.map((vehicle) => {
    const primaryImage = getVehiclePrimaryImage(vehicle);

    return {
      id: vehicle.id,
      marca: vehicle.marca,
      modelo: vehicle.modelo,
      condition: vehicle.condition,
      category: vehicle.category,
      anio: vehicle.anio,
      kilometraje: vehicle.kilometraje,
      precio: vehicle.precio,
      promotionalPrice: vehicle.promotionalPrice,
      currency: vehicle.currency,
      destacado: vehicle.destacado,
      imageCount: vehicle.images.length,
      primaryImage: primaryImage
        ? {
            publicId: primaryImage.publicId,
            format: primaryImage.format,
            alt: primaryImage.alt,
          }
        : null,
      createdByLabel: vehicle.createdBy
        ? getAdminDisplayName(vehicle.createdBy)
        : null,
      updatedByLabel: vehicle.updatedBy
        ? getAdminDisplayName(vehicle.updatedBy)
        : null,
    };
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
        <AdminVehiclesTable vehicles={tableVehicles} />
      )}
    </div>
  );
}
