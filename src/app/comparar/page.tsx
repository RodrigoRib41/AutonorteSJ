import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Scale } from "lucide-react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { CloudinaryVehicleImage } from "@/components/vehicles/cloudinary-vehicle-image";
import { getPublicVehiclesByIds } from "@/lib/public-vehicle-queries";
import {
  formatKilometraje,
  formatPrecio,
  getVehicleCategoryLabel,
  getVehicleConditionLabel,
  getVehicleDisplayName,
  getVehicleDisplayPrice,
  getVehiclePrimaryImage,
  hasVehiclePromotion,
  serializeVehicle,
  type VehicleApiRecord,
} from "@/lib/vehicle-records";

export const metadata: Metadata = {
  title: "Comparador de autos | TestAutomotores",
  description: "Compara hasta cuatro vehiculos del stock disponible.",
};

export const revalidate = 300;

const MAX_COMPARE_VEHICLES = 4;

type ComparePageProps = {
  searchParams: Promise<{
    ids?: string;
  }>;
};

type ComparisonRow = {
  label: string;
  getValue: (vehicle: VehicleApiRecord) => string;
  highlight?: boolean;
};

function parseCompareIds(ids: string | undefined) {
  if (!ids) {
    return [];
  }

  return Array.from(
    new Set(
      ids
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    )
  ).slice(0, MAX_COMPARE_VEHICLES);
}

function getPromotionLabel(vehicle: VehicleApiRecord) {
  return hasVehiclePromotion(vehicle)
    ? formatPrecio(vehicle.promotionalPrice ?? vehicle.precio, vehicle.currency)
    : "Sin promocion";
}

const comparisonRows: ComparisonRow[] = [
  {
    label: "Precio publicado",
    getValue: (vehicle) =>
      formatPrecio(getVehicleDisplayPrice(vehicle), vehicle.currency),
    highlight: true,
  },
  {
    label: "Precio de lista",
    getValue: (vehicle) => formatPrecio(vehicle.precio, vehicle.currency),
  },
  {
    label: "Precio promocional",
    getValue: getPromotionLabel,
  },
  {
    label: "Anio",
    getValue: (vehicle) => String(vehicle.anio),
  },
  {
    label: "Kilometraje",
    getValue: (vehicle) => formatKilometraje(vehicle.kilometraje),
  },
  {
    label: "Tipo",
    getValue: (vehicle) => getVehicleConditionLabel(vehicle.condition),
  },
  {
    label: "Categoria",
    getValue: (vehicle) => getVehicleCategoryLabel(vehicle.category),
  },
  {
    label: "Version",
    getValue: (vehicle) => vehicle.version ?? "Sin version",
  },
];

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const selectedIds = parseCompareIds((await searchParams).ids);
  const vehicles = (await getPublicVehiclesByIds(selectedIds)).map(serializeVehicle);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="bg-[var(--brand-canvas)]">
        <section className="relative overflow-hidden border-b border-zinc-950/15 bg-[var(--brand-primary)]">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(0,0,0,.12)_1px,transparent_1px)] [background-size:18px_100%]" />
          <div className="absolute -right-20 bottom-0 hidden h-56 w-56 skew-x-[-16deg] bg-zinc-950 lg:block" />
          <div className="absolute right-44 bottom-0 hidden h-56 w-20 skew-x-[-16deg] bg-white/90 lg:block" />
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-3xl">
              <p className="flex items-center gap-2 text-sm font-semibold tracking-[0.28em] text-zinc-900 uppercase">
                <Scale className="size-4" />
                Comparador
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
                Compara autos lado a lado.
              </h1>
              <p className="mt-5 text-base leading-8 text-zinc-900 sm:text-lg">
                Revisa precios, kilometraje, categoria y condicion de hasta{" "}
                {MAX_COMPARE_VEHICLES} unidades seleccionadas.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {vehicles.length >= 2 ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="rounded-full border border-zinc-950/10 bg-white px-4 py-2 text-sm text-zinc-600">
                    Comparando {vehicles.length} unidades.
                  </p>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-full border-zinc-950 bg-zinc-950 px-6 text-[var(--brand-primary)] hover:bg-zinc-900"
                  >
                    <Link href="/vehiculos">Cambiar seleccion</Link>
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-[1.5rem] border border-zinc-950/15 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-zinc-950/10 bg-zinc-950 text-white">
                        <th className="w-44 px-5 py-4 text-sm font-semibold">
                          Diferencia
                        </th>
                        {vehicles.map((vehicle) => {
                          const primaryImage = getVehiclePrimaryImage(vehicle);

                          return (
                            <th
                              key={vehicle.id}
                              className="min-w-52 px-5 py-4 align-top"
                            >
                              <div className="space-y-3">
                                <div className="relative aspect-[4/3] overflow-hidden rounded-[1rem] bg-zinc-800">
                                  {primaryImage ? (
                                    <CloudinaryVehicleImage
                                      publicId={primaryImage.publicId}
                                      format={primaryImage.format}
                                      alt={
                                        primaryImage.alt ??
                                        getVehicleDisplayName(vehicle)
                                      }
                                      variant="card"
                                      fill
                                      sizes="220px"
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center bg-[var(--brand-primary)] px-4 text-center text-sm font-semibold text-zinc-950">
                                      Sin imagenes
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-base font-semibold text-white">
                                    {getVehicleDisplayName(vehicle)}
                                  </p>
                                  <Link
                                    href={`/vehiculos/${vehicle.id}`}
                                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-primary)]"
                                  >
                                    Ver detalle
                                    <ArrowRight className="size-4" />
                                  </Link>
                                </div>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((row) => (
                        <tr
                          key={row.label}
                          className="border-b border-zinc-950/10 last:border-b-0"
                        >
                          <th className="bg-[var(--brand-soft)] px-5 py-4 text-sm font-semibold text-zinc-700">
                            {row.label}
                          </th>
                          {vehicles.map((vehicle) => (
                            <td
                              key={`${vehicle.id}-${row.label}`}
                              className={
                                row.highlight
                                  ? "px-5 py-4 text-lg font-semibold text-zinc-950"
                                  : "px-5 py-4 text-sm font-medium text-zinc-700"
                              }
                            >
                              {row.getValue(vehicle)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-zinc-950/30 bg-white p-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                <Scale className="mx-auto size-10 text-zinc-500" />
                <h2 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-950">
                  Selecciona al menos dos autos para comparar
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-zinc-600">
                  Desde el stock podes marcar hasta {MAX_COMPARE_VEHICLES}{" "}
                  unidades y volver aca para ver las diferencias.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="mt-6 h-12 rounded-full bg-zinc-950 px-6 text-[var(--brand-primary)] hover:bg-zinc-900"
                >
                  <Link href="/vehiculos">Ir al stock</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
