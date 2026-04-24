"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Gauge,
  ShieldCheck,
  Tag,
  TimerReset,
  Users,
} from "lucide-react";

import { VehicleInquiryForm } from "@/components/forms/vehicle-inquiry-form";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { VehicleGallery } from "@/components/vehicles/vehicle-gallery";
import { fetchPublishedVehicleById } from "@/lib/supabase-data";
import {
  formatKilometraje,
  formatPrecio,
  getVehicleCategoryLabel,
  getVehicleConditionLabel,
  getVehicleDisplayPrice,
  hasVehiclePromotion,
  serializeVehicleImage,
  type VehiclePersisted,
} from "@/lib/vehicle-records";

function VehicleDetailPageFallback() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="bg-[var(--brand-canvas)]">
        <section className="relative overflow-hidden border-b border-zinc-950/15">
          <div className="absolute inset-x-0 top-0 h-[28rem] bg-[var(--brand-primary)]" />
          <div className="absolute inset-x-0 top-0 h-[28rem] opacity-20 [background-image:linear-gradient(90deg,rgba(0,0,0,.12)_1px,transparent_1px)] [background-size:18px_100%]" />
          <div className="absolute -right-20 top-32 hidden h-72 w-60 skew-x-[-16deg] bg-zinc-950 lg:block" />
          <div className="absolute right-44 top-32 hidden h-72 w-20 skew-x-[-16deg] bg-white/90 lg:block" />

          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div className="h-[34rem] animate-pulse rounded-[2rem] border border-zinc-200 bg-white/85" />
              <div className="h-[40rem] animate-pulse rounded-[2rem] border border-zinc-200 bg-white/85" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function VehicleDetailPageContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("id")?.trim() ?? "";
  const [vehicle, setVehicle] = useState<VehiclePersisted | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    if (!vehicleId) {
      setVehicle(null);
      setErrorMessage("Falta indicar la unidad que quieres ver.");
      setIsLoading(false);
      return () => {
        isCancelled = true;
      };
    }

    setIsLoading(true);
    setErrorMessage("");

    fetchPublishedVehicleById(vehicleId)
      .then((nextVehicle) => {
        if (!isCancelled) {
          setVehicle(nextVehicle);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "No pudimos cargar esta unidad."
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
  }, [vehicleId]);

  const hasPromotion = vehicle ? hasVehiclePromotion(vehicle) : false;
  const displayPrice = vehicle ? getVehicleDisplayPrice(vehicle) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="bg-[var(--brand-canvas)]">
        <section className="relative overflow-hidden border-b border-zinc-950/15">
          <div className="absolute inset-x-0 top-0 h-[28rem] bg-[var(--brand-primary)]" />
          <div className="absolute inset-x-0 top-0 h-[28rem] opacity-20 [background-image:linear-gradient(90deg,rgba(0,0,0,.12)_1px,transparent_1px)] [background-size:18px_100%]" />
          <div className="absolute -right-20 top-32 hidden h-72 w-60 skew-x-[-16deg] bg-zinc-950 lg:block" />
          <div className="absolute right-44 top-32 hidden h-72 w-20 skew-x-[-16deg] bg-white/90 lg:block" />

          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <Button
              asChild
              variant="ghost"
              className="mb-6 -ml-3 h-auto rounded-full border border-zinc-950/20 bg-white/88 px-3 py-2 text-zinc-950 shadow-sm hover:bg-white hover:text-zinc-950"
            >
              <Link href="/vehiculos">
                <ArrowLeft className="size-4" />
                Volver al stock
              </Link>
            </Button>

            {isLoading ? (
              <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                <div className="h-[34rem] animate-pulse rounded-[2rem] border border-zinc-200 bg-white/85" />
                <div className="h-[40rem] animate-pulse rounded-[2rem] border border-zinc-200 bg-white/85" />
              </div>
            ) : errorMessage ? (
              <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : !vehicle ? (
              <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-white/88 p-10 text-center shadow-sm">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                  Esta unidad no esta disponible
                </h2>
                <p className="mt-3 text-base leading-7 text-zinc-600">
                  Puede que se haya dado de baja o que el enlace ya no exista.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="mt-8 h-12 rounded-full bg-zinc-950 px-6 text-white hover:bg-zinc-800"
                >
                  <Link href="/vehiculos">Volver al stock</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                <div className="rounded-[2rem] border border-zinc-950/15 bg-white p-6 shadow-[0_28px_70px_rgba(0,0,0,0.16)] sm:p-8">
                  <VehicleGallery
                    vehicleName={`${vehicle.marca} ${vehicle.modelo}`}
                    images={vehicle.images.map(serializeVehicleImage)}
                  />

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-zinc-950/10 bg-[var(--brand-soft)] p-5">
                      <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-zinc-600 uppercase">
                        <CalendarDays className="size-4" />
                        Ano
                      </div>
                      <p className="mt-3 text-2xl font-semibold text-zinc-950">
                        {vehicle.anio}
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-zinc-950/10 bg-[var(--brand-soft)] p-5">
                      <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-zinc-600 uppercase">
                        <Gauge className="size-4" />
                        Kilometraje
                      </div>
                      <p className="mt-3 text-2xl font-semibold text-zinc-950">
                        {formatKilometraje(vehicle.kilometraje)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <p className="text-sm font-semibold tracking-[0.28em] text-zinc-900 uppercase">
                      Ficha tecnica
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <div className="inline-flex rounded-full bg-zinc-950 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-[var(--brand-primary)] uppercase">
                        {getVehicleConditionLabel(vehicle.condition)}
                      </div>
                      {hasPromotion ? (
                        <div className="inline-flex rounded-full bg-white/92 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-zinc-950 uppercase shadow-sm">
                          Promocion vigente
                        </div>
                      ) : null}
                    </div>
                    <h2 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
                      {vehicle.marca} {vehicle.modelo}
                    </h2>
                    {vehicle.descripcion ? (
                      <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-900 sm:text-lg">
                        {vehicle.descripcion}
                      </p>
                    ) : (
                      <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-900 sm:text-lg">
                        Consultanos por disponibilidad, financiacion y permuta.
                      </p>
                    )}
                  </div>

                  <div className="rounded-[2rem] border border-zinc-950/15 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.12)] sm:p-8">
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-zinc-600 uppercase">
                      <Tag className="size-4" />
                      {hasPromotion ? "Precio promocional" : "Precio"}
                    </div>
                    {hasPromotion ? (
                      <p className="mt-4 text-base font-medium text-zinc-400 line-through">
                        {formatPrecio(vehicle.precio, vehicle.currency)}
                      </p>
                    ) : null}
                    <p className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">
                      {displayPrice
                        ? formatPrecio(displayPrice, vehicle.currency)
                        : "-"}
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-zinc-950/10 bg-[var(--brand-soft)] p-5">
                        <p className="text-xs font-semibold tracking-[0.18em] text-zinc-600 uppercase">
                          Tipo de unidad
                        </p>
                        <p className="mt-3 text-lg font-semibold text-zinc-950">
                          {getVehicleConditionLabel(vehicle.condition)}
                        </p>
                      </div>

                      <div className="rounded-[1.5rem] border border-zinc-950/10 bg-[var(--brand-soft)] p-5">
                        <p className="text-xs font-semibold tracking-[0.18em] text-zinc-600 uppercase">
                          Marca
                        </p>
                        <p className="mt-3 text-lg font-semibold text-zinc-950">
                          {vehicle.marca}
                        </p>
                      </div>

                      <div className="rounded-[1.5rem] border border-zinc-950/10 bg-[var(--brand-soft)] p-5">
                        <p className="text-xs font-semibold tracking-[0.18em] text-zinc-600 uppercase">
                          Categoria
                        </p>
                        <p className="mt-3 text-lg font-semibold text-zinc-950">
                          {getVehicleCategoryLabel(vehicle.category)}
                        </p>
                      </div>

                      <div className="rounded-[1.5rem] border border-zinc-950/10 bg-[var(--brand-soft)] p-5">
                        <p className="text-xs font-semibold tracking-[0.18em] text-zinc-600 uppercase">
                          Modelo
                        </p>
                        <p className="mt-3 text-lg font-semibold text-zinc-950">
                          {vehicle.modelo}
                        </p>
                      </div>

                      {hasPromotion ? (
                        <div className="rounded-[1.5rem] border border-zinc-950/15 bg-[var(--brand-primary)] p-5 sm:col-span-2">
                          <p className="text-xs font-semibold tracking-[0.18em] text-zinc-800 uppercase">
                            Promocion
                          </p>
                          <p className="mt-3 text-lg font-semibold text-zinc-950">
                            Precio promocional vigente.
                          </p>
                        </div>
                      ) : null}

                      <div className="rounded-[1.5rem] border border-zinc-950/10 bg-[var(--brand-soft)] p-5 sm:col-span-2">
                        <p className="text-xs font-semibold tracking-[0.18em] text-zinc-600 uppercase">
                          Moneda de publicacion
                        </p>
                        <p className="mt-3 text-lg font-semibold text-zinc-950">
                          {vehicle.currency === "USD"
                            ? "USD"
                            : "Pesos argentinos"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-zinc-950/15 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.12)] sm:p-8">
                    <p className="text-sm font-semibold tracking-[0.28em] text-zinc-700 uppercase">
                      Consulta directa
                    </p>
                    <h3 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                      Consulta por esta unidad
                    </h3>
                    <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">
                      Dejanos tus datos y te respondemos por esta unidad.
                    </p>

                    <div className="mt-8">
                      <VehicleInquiryForm
                        vehicleId={vehicle.id}
                        vehicleName={`${vehicle.marca} ${vehicle.modelo}`}
                      />
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                      <article className="rounded-[1.5rem] border border-zinc-950/10 bg-[var(--brand-soft)] p-5">
                        <div className="w-fit rounded-2xl bg-[var(--brand-primary)] p-3 text-zinc-950 shadow-sm">
                          <Users className="size-5" />
                        </div>
                        <h4 className="mt-4 text-lg font-semibold text-zinc-950">
                          Atencion personalizada
                        </h4>
                        <p className="mt-2 text-sm leading-7 text-zinc-600">
                          Un asesor te acompana en la consulta.
                        </p>
                      </article>

                      <article className="rounded-[1.5rem] border border-zinc-950/10 bg-[var(--brand-soft)] p-5">
                        <div className="w-fit rounded-2xl bg-[var(--brand-primary)] p-3 text-zinc-950 shadow-sm">
                          <TimerReset className="size-5" />
                        </div>
                        <h4 className="mt-4 text-lg font-semibold text-zinc-950">
                          Respuesta rapida
                        </h4>
                        <p className="mt-2 text-sm leading-7 text-zinc-600">
                          Respondemos lo antes posible.
                        </p>
                      </article>

                      <article className="rounded-[1.5rem] border border-zinc-950/10 bg-[var(--brand-soft)] p-5">
                        <div className="w-fit rounded-2xl bg-[var(--brand-primary)] p-3 text-zinc-950 shadow-sm">
                          <ShieldCheck className="size-5" />
                        </div>
                        <h4 className="mt-4 text-lg font-semibold text-zinc-950">
                          Asesoramiento comercial
                        </h4>
                        <p className="mt-2 text-sm leading-7 text-zinc-600">
                          Te contamos disponibilidad, precio y opciones de pago.
                        </p>
                      </article>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function VehicleDetailPage() {
  return (
    <Suspense fallback={<VehicleDetailPageFallback />}>
      <VehicleDetailPageContent />
    </Suspense>
  );
}
