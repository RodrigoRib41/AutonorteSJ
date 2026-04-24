"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { VehicleForm } from "@/components/admin/vehicle-form";
import { fetchFeaturedVehicleReplacementOptions } from "@/lib/supabase-data";
import type { FeaturedVehicleOption } from "@/lib/vehicle-records";

export default function NewVehiclePage() {
  const [featuredVehicles, setFeaturedVehicles] = useState<
    FeaturedVehicleOption[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedVehicles() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextFeaturedVehicles =
          await fetchFeaturedVehicleReplacementOptions();

        if (!isMounted) {
          return;
        }

        setFeaturedVehicles(nextFeaturedVehicles);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No pudimos preparar el formulario de alta."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFeaturedVehicles();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.28em] text-zinc-500 uppercase">
          Alta de vehiculo
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Cargar nueva unidad
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-600 sm:text-lg">
          Carga los datos principales. Despues podes sumar hasta 5 fotos.
        </p>
      </section>

      {errorMessage ? (
        <section className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm leading-7 text-red-700">
          {errorMessage}
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)] sm:p-10">
        {isLoading ? (
          <div className="flex min-h-[18rem] items-center justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-zinc-50 px-5 py-3 text-sm text-zinc-600">
              <Loader2 className="size-4 animate-spin" />
              Preparando formulario...
            </div>
          </div>
        ) : (
          <VehicleForm mode="create" featuredVehicles={featuredVehicles} />
        )}
      </section>
    </div>
  );
}
