"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { fetchFeaturedVehicles } from "@/lib/supabase-data";
import type { VehiclePreview } from "@/lib/vehicle-records";

export function FeaturedVehicles() {
  const [featuredVehicles, setFeaturedVehicles] = useState<VehiclePreview[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    fetchFeaturedVehicles(3)
      .then((vehicles) => {
        if (!isCancelled) {
          setFeaturedVehicles(vehicles);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setHasLoaded(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <section
      id="vehiculos"
      className="relative overflow-hidden bg-[var(--brand-canvas)] py-16 sm:py-20 lg:py-24"
    >
      <div className="absolute inset-x-0 top-0 h-2 bg-[var(--brand-primary)]" />
      <div className="absolute -left-16 top-16 hidden h-40 w-28 skew-x-[-16deg] bg-zinc-950/90 lg:block" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.24em] text-zinc-700 uppercase sm:text-sm sm:tracking-[0.28em]">
              Destacados de la semana
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
              Oportunidades destacadas para ver hoy.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-zinc-700 sm:text-base">
            Unidades seleccionadas con precio, fotos y disponibilidad para
            consultar.
          </p>
        </div>

        {featuredVehicles.length > 0 ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featuredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                imageSizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
              />
            ))}
          </div>
        ) : hasLoaded ? (
          <div className="mt-10 rounded-[1.5rem] border border-dashed border-zinc-950/30 bg-white/85 p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.08)] sm:p-10">
            <h3 className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
              Pronto vamos a publicar nuevos destacados
            </h3>
            <p className="mt-3 text-base leading-7 text-zinc-600">
              Mientras tanto, podes consultar el stock completo.
            </p>
          </div>
        ) : (
          <div className="mt-10 h-[28rem] animate-pulse rounded-[1.5rem] border border-zinc-200 bg-white/80" />
        )}

        <div className="mt-10 flex justify-center">
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 w-full rounded-full border-zinc-950 bg-zinc-950 px-6 text-[var(--brand-primary)] hover:bg-zinc-900 sm:w-auto"
          >
            <Link href="/vehiculos">Ver stock completo</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
