"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import type { VehicleFilterValues } from "@/lib/vehicle-filters";
import type {
  VehicleApiRecord,
  VehicleCatalogPageResponse,
} from "@/lib/vehicle-records";

type VehicleInfiniteListProps = {
  initialVehicles: VehicleApiRecord[];
  filters: VehicleFilterValues;
  pageSize: number;
  totalCount: number;
  hasFilters: boolean;
};

function buildCatalogUrl(
  filters: VehicleFilterValues,
  offset: number,
  limit: number
) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  params.set("offset", String(offset));
  params.set("limit", String(limit));

  return `/api/vehicles?${params.toString()}`;
}

export function VehicleInfiniteList({
  initialVehicles,
  filters,
  pageSize,
  totalCount,
  hasFilters,
}: VehicleInfiniteListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [nextOffset, setNextOffset] = useState(initialVehicles.length);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const hasMore = nextOffset < totalCount;

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || nextOffset >= totalCount) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        buildCatalogUrl(filters, nextOffset, pageSize)
      );
      const result = (await response
        .json()
        .catch(() => null)) as VehicleCatalogPageResponse | null;

      if (!response.ok || !result) {
        throw new Error("No pudimos cargar mas vehiculos.");
      }

      if (!result.success) {
        throw new Error(result.message);
      }

      setVehicles((currentVehicles) => {
        const existingIds = new Set(
          currentVehicles.map((vehicle) => vehicle.id)
        );
        const nextVehicles = result.vehicles.filter(
          (vehicle) => !existingIds.has(vehicle.id)
        );

        return [...currentVehicles, ...nextVehicles];
      });
      setNextOffset(result.nextOffset);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No pudimos cargar mas vehiculos."
      );
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [filters, nextOffset, pageSize, totalCount]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      {
        rootMargin: "400px 0px",
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.24em] text-zinc-700 uppercase">
            {hasFilters ? "Resultados" : "Stock disponible"}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            Unidades disponibles
          </h2>
        </div>
        <p className="text-sm text-zinc-600">
          Mostrando {vehicles.length} de {totalCount} unidad
          {totalCount === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {vehicles.map((vehicle, index) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            preload={index === 0}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="flex min-h-16 justify-center">
        {hasMore ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <Button
              type="button"
              size="lg"
              variant="outline"
              disabled={isLoading}
              onClick={() => void loadMore()}
              className="h-12 rounded-full border-zinc-950 bg-zinc-950 px-6 text-[#f2c400] hover:bg-zinc-900 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                "Ver mas unidades"
              )}
            </Button>
            <p className="text-sm text-zinc-600">
              Hay mas unidades para ver.
            </p>
          </div>
        ) : vehicles.length > 0 ? (
          <p className="rounded-full border border-zinc-950/20 bg-white px-4 py-2 text-sm text-zinc-600">
            Ya estas viendo todo el stock disponible.
          </p>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-5 py-4 text-center text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
    </section>
  );
}
