"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";
import { CarFront, Loader2, Plus } from "lucide-react";

import {
  AdminVehiclesTable,
  type AdminVehiclesTableItem,
} from "@/components/admin/admin-vehicles-table";
import { Button } from "@/components/ui/button";
import { VehicleFilters } from "@/components/vehicles/vehicle-filters";
import { getAdminDisplayName } from "@/lib/admin-users";
import {
  hasActiveVehicleFilters,
  parseVehicleFilters,
} from "@/lib/vehicle-filters";
import {
  buildAdminVehicleState,
  fetchAdminVehicles,
} from "@/lib/supabase-data";
import {
  getVehiclePrimaryImage,
  type VehiclePersisted,
} from "@/lib/vehicle-records";

function searchParamsToRecord(searchParams: ReadonlyURLSearchParams) {
  const entries: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    entries[key] = value;
  }

  return entries;
}

function AdminVehiclesPageFallback() {
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
              Cargando panel...
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-10 text-center shadow-[0_24px_60px_rgba(24,24,27,0.06)]">
        <div className="inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-zinc-50 px-5 py-3 text-sm text-zinc-600">
          <Loader2 className="size-4 animate-spin" />
          Cargando stock del panel...
        </div>
      </section>
    </div>
  );
}

function AdminVehiclesPageContent() {
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState<VehiclePersisted[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const filters = useMemo(
    () => parseVehicleFilters(searchParamsToRecord(searchParams)),
    [searchParams]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadVehicles() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextVehicles = await fetchAdminVehicles();

        if (!isMounted) {
          return;
        }

        setVehicles(nextVehicles);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No pudimos cargar el stock del panel."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadVehicles();

    return () => {
      isMounted = false;
    };
  }, []);

  const catalogState = useMemo(
    () => buildAdminVehicleState(vehicles, filters),
    [filters, vehicles]
  );
  const hasFilters = hasActiveVehicleFilters(filters, {
    includeAdminFields: true,
  });
  const tableVehicles: AdminVehiclesTableItem[] = useMemo(
    () =>
      catalogState.filteredVehicles.map((vehicle) => {
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
      }),
    [catalogState.filteredVehicles]
  );

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
                ? `${catalogState.filteredVehicles.length} de ${catalogState.totalCount} vehiculos`
                : `${catalogState.totalCount} vehiculos cargados`}
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

      {catalogState.totalCount > 0 ? (
        <VehicleFilters
          actionPath="/admin/vehiculos"
          brands={catalogState.brands}
          filters={filters}
          totalCount={catalogState.totalCount}
          visibleCount={catalogState.filteredVehicles.length}
          variant="admin"
        />
      ) : null}

      {isLoading ? (
        <section className="rounded-[2rem] border border-zinc-200 bg-white p-10 text-center shadow-[0_24px_60px_rgba(24,24,27,0.06)]">
          <div className="inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-zinc-50 px-5 py-3 text-sm text-zinc-600">
            <Loader2 className="size-4 animate-spin" />
            Cargando stock del panel...
          </div>
        </section>
      ) : errorMessage ? (
        <section className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-red-700 shadow-[0_24px_60px_rgba(24,24,27,0.06)]">
          <h3 className="text-xl font-semibold text-red-900">
            No pudimos cargar los vehiculos
          </h3>
          <p className="mt-3 text-sm leading-7">{errorMessage}</p>
        </section>
      ) : catalogState.filteredVehicles.length === 0 ? (
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
        <AdminVehiclesTable
          vehicles={tableVehicles}
          onVehiclesDeleted={(deletedIds) => {
            setVehicles((current) =>
              current.filter((vehicle) => !deletedIds.includes(vehicle.id))
            );
          }}
        />
      )}
    </div>
  );
}

export default function AdminVehiclesPage() {
  return (
    <Suspense fallback={<AdminVehiclesPageFallback />}>
      <AdminVehiclesPageContent />
    </Suspense>
  );
}
