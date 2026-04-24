"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import type { VehicleApiRecord } from "@/lib/vehicle-records";

type VehicleInfiniteListProps = {
  initialVehicles: VehicleApiRecord[];
  pageSize: number;
  totalCount: number;
  hasFilters: boolean;
};

export function VehicleInfiniteList({
  initialVehicles,
  pageSize,
  totalCount,
  hasFilters,
}: VehicleInfiniteListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(
    Math.min(initialVehicles.length, pageSize)
  );
  const [isLoading, setIsLoading] = useState(false);
  const unitLabel = totalCount === 1 ? "unidad" : "unidades";
  const visibleVehicles = initialVehicles.slice(0, visibleCount);
  const hasMore = visibleCount < initialVehicles.length;

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);

    window.requestAnimationFrame(() => {
      setVisibleCount((currentCount) =>
        Math.min(initialVehicles.length, currentCount + pageSize)
      );
      setIsLoading(false);
    });
  }, [hasMore, initialVehicles.length, isLoading, pageSize]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
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
    <section className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.24em] text-zinc-700 uppercase">
            {hasFilters ? "Resultados" : "Stock disponible"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            Unidades disponibles
          </h2>
        </div>
        <p className="w-fit rounded-full border border-zinc-950/10 bg-white/80 px-3 py-2 text-sm text-zinc-600">
          Mostrando {visibleVehicles.length} de {totalCount} {unitLabel}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {visibleVehicles.map((vehicle, index) => (
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
              onClick={loadMore}
              className="h-12 rounded-full border-zinc-950 bg-zinc-950 px-6 text-[var(--brand-primary)] hover:bg-zinc-900 disabled:cursor-not-allowed"
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
        ) : initialVehicles.length > 0 ? (
          <p className="rounded-full border border-zinc-950/20 bg-white px-4 py-2 text-sm text-zinc-600">
            Ya estas viendo todo el stock disponible.
          </p>
        ) : null}
      </div>
    </section>
  );
}
