"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { VehicleFilters } from "@/components/vehicles/vehicle-filters";
import { VehicleInfiniteList } from "@/components/vehicles/vehicle-infinite-list";
import {
  parseVehicleFilters,
  type VehicleFilterValues,
} from "@/lib/vehicle-filters";
import {
  buildPublicCatalogState,
  fetchPublishedVehicles,
} from "@/lib/supabase-data";
import { VEHICLE_CATALOG_PAGE_SIZE, type VehiclePersisted } from "@/lib/vehicle-records";

function normalizeFilters(searchParams: ReturnType<typeof useSearchParams>) {
  const params = Object.fromEntries(searchParams.entries());

  return {
    ...parseVehicleFilters(params),
    destacado: "",
    hasImages: "",
  } satisfies VehicleFilterValues;
}

function VehiclesPageFallback() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-zinc-950/15 bg-[var(--brand-primary)]">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(0,0,0,.12)_1px,transparent_1px)] [background-size:18px_100%]" />
          <div className="absolute -right-20 bottom-0 hidden h-56 w-56 skew-x-[-16deg] bg-zinc-950 lg:block" />
          <div className="absolute right-44 bottom-0 hidden h-56 w-20 skew-x-[-16deg] bg-white/90 lg:block" />
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-20 lg:px-8">
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold tracking-[0.28em] text-zinc-900 uppercase">
                  Stock
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                  Vehiculos disponibles
                </h1>
              </div>
              <p className="max-w-xl text-sm leading-7 text-zinc-900 sm:text-base">
                Encontra 0 km, usados seleccionados y oportunidades con precio
                promocional.
              </p>
            </div>

            <div className="relative mt-6 inline-flex w-full justify-center rounded-full border border-zinc-950/20 bg-white/88 px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm sm:mt-8 sm:w-auto">
              Cargando stock publicado...
            </div>
          </div>
        </section>

        <section className="bg-[var(--brand-canvas)] py-10 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[28rem] animate-pulse rounded-[1.25rem] border border-zinc-200 bg-white/80"
                />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function VehiclesPageContent() {
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState<VehiclePersisted[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const filters = useMemo(
    () => normalizeFilters(searchParams),
    [searchParams]
  );
  const catalogState = useMemo(
    () => buildPublicCatalogState(vehicles, filters),
    [filters, vehicles]
  );
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    let isCancelled = false;

    setIsLoading(true);
    setErrorMessage("");

    fetchPublishedVehicles()
      .then((nextVehicles) => {
        if (!isCancelled) {
          setVehicles(nextVehicles);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "No pudimos cargar el stock publicado."
          );
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-zinc-950/15 bg-[var(--brand-primary)]">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(0,0,0,.12)_1px,transparent_1px)] [background-size:18px_100%]" />
          <div className="absolute -right-20 bottom-0 hidden h-56 w-56 skew-x-[-16deg] bg-zinc-950 lg:block" />
          <div className="absolute right-44 bottom-0 hidden h-56 w-20 skew-x-[-16deg] bg-white/90 lg:block" />
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-20 lg:px-8">
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold tracking-[0.28em] text-zinc-900 uppercase">
                  Stock
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                  Vehiculos disponibles
                </h1>
              </div>
              <p className="max-w-xl text-sm leading-7 text-zinc-900 sm:text-base">
                Encontra 0 km, usados seleccionados y oportunidades con precio
                promocional.
              </p>
            </div>

            <div className="relative mt-6 inline-flex w-full justify-center rounded-full border border-zinc-950/20 bg-white/88 px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm sm:mt-8 sm:w-auto">
              {catalogState.hasFilters
                ? `${catalogState.filteredCount} resultados de ${catalogState.totalCount} vehiculos`
                : `${catalogState.totalCount} vehiculos publicados`}
            </div>

            <div className="relative mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                size="lg"
                variant={
                  filters.condition === "ZERO_KM" ? "default" : "outline"
                }
                className={
                  filters.condition === "ZERO_KM"
                    ? "h-12 w-full rounded-full bg-zinc-950 px-6 text-[var(--brand-primary)] hover:bg-zinc-900 sm:w-auto"
                    : "h-12 w-full rounded-full border-zinc-950/25 bg-white/88 px-6 text-zinc-950 hover:bg-white sm:w-auto"
                }
              >
                <Link href="/vehiculos?condition=ZERO_KM">Ver 0 km</Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant={filters.condition === "USED" ? "default" : "outline"}
                className={
                  filters.condition === "USED"
                    ? "h-12 w-full rounded-full bg-zinc-950 px-6 text-[var(--brand-primary)] hover:bg-zinc-900 sm:w-auto"
                    : "h-12 w-full rounded-full border-zinc-950/25 bg-white/88 px-6 text-zinc-950 hover:bg-white sm:w-auto"
                }
              >
                <Link href="/vehiculos?condition=USED">Ver usados</Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant={
                  filters.hasPromotion === "true" ? "default" : "outline"
                }
                className={
                  filters.hasPromotion === "true"
                    ? "h-12 w-full rounded-full bg-zinc-950 px-6 text-[var(--brand-primary)] hover:bg-zinc-900 sm:w-auto"
                    : "h-12 w-full rounded-full border-zinc-950/25 bg-white/88 px-6 text-zinc-950 hover:bg-white sm:w-auto"
                }
              >
                <Link href="/vehiculos?hasPromotion=true">Ver promociones</Link>
              </Button>

              {catalogState.hasFilters ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 w-full rounded-full border-zinc-950/25 bg-white/88 px-6 text-zinc-950 hover:bg-white sm:w-auto"
                >
                  <Link href="/vehiculos">Ver todo el stock</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="bg-[var(--brand-canvas)] py-10 sm:py-20">
          <div className="mx-auto max-w-7xl space-y-8 px-4 sm:space-y-10 sm:px-6 lg:px-8">
            {catalogState.totalCount > 0 ? (
              <VehicleFilters
                actionPath="/vehiculos"
                brands={catalogState.brands}
                filters={filters}
                totalCount={catalogState.filteredCount}
                visibleCount={catalogState.filteredCount}
                variant="public"
              />
            ) : null}

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[28rem] animate-pulse rounded-[1.25rem] border border-zinc-200 bg-white/80"
                  />
                ))}
              </div>
            ) : errorMessage ? (
              <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-5 py-4 text-center text-sm text-red-700">
                {errorMessage}
              </div>
            ) : catalogState.filteredVehicles.length > 0 ? (
              <VehicleInfiniteList
                key={filterKey}
                initialVehicles={catalogState.serializedVehicles}
                pageSize={VEHICLE_CATALOG_PAGE_SIZE}
                totalCount={catalogState.filteredCount}
                hasFilters={catalogState.hasFilters}
              />
            ) : (
              <div className="rounded-[2rem] border border-dashed border-zinc-950/30 bg-white/90 p-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                  {catalogState.hasFilters
                    ? "No encontramos vehiculos con esos filtros"
                    : "No hay vehiculos publicados por el momento"}
                </h2>
                <p className="mt-3 text-base leading-7 text-zinc-600">
                  {catalogState.hasFilters
                    ? "Proba con otros filtros o volve al stock completo."
                    : "Consultanos y te contamos las opciones disponibles."}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={<VehiclesPageFallback />}>
      <VehiclesPageContent />
    </Suspense>
  );
}
