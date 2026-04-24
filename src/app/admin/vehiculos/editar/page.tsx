"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { VehicleForm } from "@/components/admin/vehicle-form";
import { VehicleImageUploader } from "@/components/admin/vehicle-image-uploader";
import { getAdminDisplayName } from "@/lib/admin-users";
import {
  fetchAdminVehicleById,
  fetchFeaturedVehicleReplacementOptions,
  toVehicleImagesApiRecord,
} from "@/lib/supabase-data";
import type {
  FeaturedVehicleOption,
  VehiclePersisted,
} from "@/lib/vehicle-records";

function EditVehiclePageFallback() {
  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-10 text-center shadow-[0_24px_60px_rgba(24,24,27,0.06)]">
      <div className="inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-zinc-50 px-5 py-3 text-sm text-zinc-600">
        <Loader2 className="size-4 animate-spin" />
        Cargando unidad...
      </div>
    </section>
  );
}

function EditVehiclePageContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("id")?.trim() ?? "";
  const wasJustCreated = searchParams.get("created") === "1";
  const [vehicle, setVehicle] = useState<VehiclePersisted | null>(null);
  const [featuredVehicles, setFeaturedVehicles] = useState<
    FeaturedVehicleOption[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    if (!vehicleId) {
      setVehicle(null);
      setFeaturedVehicles([]);
      setErrorMessage("Falta indicar la unidad a editar.");
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    async function loadVehicle() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [nextVehicle, nextFeaturedVehicles] = await Promise.all([
          fetchAdminVehicleById(vehicleId),
          fetchFeaturedVehicleReplacementOptions(vehicleId),
        ]);

        if (!isMounted) {
          return;
        }

        setVehicle(nextVehicle);
        setFeaturedVehicles(nextFeaturedVehicles);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No pudimos cargar la unidad del panel."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadVehicle();

    return () => {
      isMounted = false;
    };
  }, [vehicleId]);

  if (isLoading) {
    return (
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-10 text-center shadow-[0_24px_60px_rgba(24,24,27,0.06)]">
        <div className="inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-zinc-50 px-5 py-3 text-sm text-zinc-600">
          <Loader2 className="size-4 animate-spin" />
          Cargando unidad...
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-red-700 shadow-[0_24px_60px_rgba(24,24,27,0.06)]">
        <h2 className="text-2xl font-semibold text-red-900">
          No pudimos cargar la unidad
        </h2>
        <p className="mt-3 text-sm leading-7">{errorMessage}</p>
      </section>
    );
  }

  if (!vehicle) {
    return (
      <section className="rounded-[2rem] border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
          Esta unidad ya no esta disponible en el panel
        </h2>
        <p className="mt-3 text-base leading-7 text-zinc-600">
          Puede haber sido eliminada o restaurada desde otro usuario.
        </p>
      </section>
    );
  }

  const auditItems = [
    {
      label: "Creado por",
      value: vehicle.createdBy
        ? getAdminDisplayName(vehicle.createdBy)
        : "Sin registro",
    },
    {
      label: "Ultima gestion",
      value: vehicle.updatedBy
        ? getAdminDisplayName(vehicle.updatedBy)
        : "Sin registro",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.28em] text-zinc-500 uppercase">
          Edicion de vehiculo
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          {vehicle.marca} {vehicle.modelo}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-600 sm:text-lg">
          Edita los datos, fotos y precio de la unidad.
        </p>
        {wasJustCreated ? (
          <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-7 text-emerald-900">
            La unidad ya se creo correctamente. Ahora podes cargar las fotos y,
            cuando termines, pasar directo a la siguiente.
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {auditItems.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-5 py-4"
            >
              <p className="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                {item.label}
              </p>
              <p className="mt-2 text-base font-semibold text-zinc-950">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)] sm:p-10">
        <VehicleForm
          mode="edit"
          vehicle={vehicle}
          featuredVehicles={featuredVehicles}
        />
      </section>

      <section
        id="imagenes"
        className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)] sm:p-10"
      >
        <VehicleImageUploader
          key={`${vehicle.id}-${String(vehicle.updatedAt)}`}
          vehicleId={vehicle.id}
          vehicleName={`${vehicle.marca} ${vehicle.modelo}`}
          initialImages={toVehicleImagesApiRecord(vehicle.images)}
          showCreateAnotherAction={wasJustCreated}
        />
      </section>
    </div>
  );
}

export default function EditVehiclePage() {
  return (
    <Suspense fallback={<EditVehiclePageFallback />}>
      <EditVehiclePageContent />
    </Suspense>
  );
}
