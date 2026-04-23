import Link from "next/link";
import { ArrowRight, CalendarDays, Gauge, ImageIcon, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CloudinaryVehicleImage } from "@/components/vehicles/cloudinary-vehicle-image";
import {
  formatKilometraje,
  formatPrecio,
  getVehicleCategoryLabel,
  getVehicleConditionLabel,
  getVehicleDisplayPrice,
  getVehiclePrimaryImage,
  hasVehiclePromotion,
  type VehiclePreview,
} from "@/lib/vehicle-records";

type VehicleCardProps = {
  imageSizes?: string;
  vehicle: VehiclePreview;
  preload?: boolean;
};

export function VehicleCard({
  imageSizes = "(min-width: 1024px) 33vw, 100vw",
  vehicle,
  preload = false,
}: VehicleCardProps) {
  const primaryImage = getVehiclePrimaryImage(vehicle);
  const hasPromotion = hasVehiclePromotion(vehicle);
  const displayPrice = getVehicleDisplayPrice(vehicle);

  return (
    <article className="group overflow-hidden rounded-[1.1rem] border border-zinc-950/15 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(0,0,0,0.18)] sm:rounded-[1.25rem]">
      <div className="relative border-b-4 border-[#f2c400]">
        {primaryImage ? (
          <div className="relative aspect-[5/4] overflow-hidden bg-zinc-100">
            <CloudinaryVehicleImage
              publicId={primaryImage.publicId}
              format={primaryImage.format}
              alt={primaryImage.alt ?? `${vehicle.marca} ${vehicle.modelo}`}
              variant="card"
              fill
              preload={preload}
              sizes={imageSizes}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-zinc-950/14 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <h3 className="text-xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-2xl">
                {vehicle.marca} {vehicle.modelo}
              </h3>
            </div>
          </div>
        ) : (
          <div className="flex aspect-[5/4] items-end bg-[linear-gradient(135deg,#f2c400_0%,#fff1a6_58%,#2b292d_58%,#2b292d_100%)] p-4 sm:p-5">
            <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
                Sin imagenes
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
                {vehicle.marca} {vehicle.modelo}
              </h3>
              <p className="mt-1 text-sm font-medium text-zinc-700">
                Consultanos por fotos.
              </p>
            </div>
          </div>
        )}

        <div className="absolute top-3 right-3 left-3 flex min-w-0 items-start justify-between gap-3 sm:top-4 sm:right-4 sm:left-4">
          <div className="flex min-w-0 flex-wrap gap-2">
            <div className="rounded-full bg-[#f2c400]/95 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-zinc-950 uppercase shadow-sm backdrop-blur sm:text-[11px]">
              {getVehicleCategoryLabel(vehicle.category)}
            </div>
            <div className="rounded-full bg-zinc-950/92 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-white uppercase shadow-sm backdrop-blur sm:text-[11px]">
              {getVehicleConditionLabel(vehicle.condition)}
            </div>
            {hasPromotion ? (
              <div className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-zinc-950 uppercase shadow-sm backdrop-blur sm:text-[11px]">
                Promocion
              </div>
            ) : null}
          </div>
          <div className="hidden gap-2 sm:flex">
            {vehicle.images.length > 1 ? (
              <span className="inline-flex rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-zinc-700 uppercase shadow-sm backdrop-blur">
                {vehicle.images.length} fotos
              </span>
            ) : null}
            <span className="inline-flex rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-zinc-700 uppercase shadow-sm backdrop-blur">
              {vehicle.anio}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 bg-white p-3 sm:p-4">
        <div className="rounded-[1rem] border border-zinc-950/10 bg-[#fff8d6] p-3">
          <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-zinc-500 uppercase">
              <Tag className="size-4" />
              {hasPromotion ? "Precio promocional" : "Precio"}
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-zinc-500 uppercase">
              <ImageIcon className="size-4" />
              {vehicle.images.length > 0 ? "Fotos" : "Sin fotos"}
            </div>
          </div>
          {hasPromotion ? (
            <p className="mt-2 text-xs font-medium text-zinc-400 line-through">
              {formatPrecio(vehicle.precio, vehicle.currency)}
            </p>
          ) : null}
          <p className="mt-1 text-lg font-semibold tracking-tight text-zinc-950 sm:text-xl">
            {formatPrecio(displayPrice, vehicle.currency)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[0.9rem] border border-zinc-950/10 bg-white px-3 py-2">
            <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] text-zinc-500 uppercase">
              <CalendarDays className="size-3.5" />
              Año
            </div>
            <p className="mt-1 text-sm font-semibold text-zinc-950">
              {vehicle.anio}
            </p>
          </div>

          <div className="rounded-[0.9rem] border border-zinc-950/10 bg-white px-3 py-2">
            <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] text-zinc-500 uppercase">
              <Gauge className="size-3.5" />
              Km
            </div>
            <p className="mt-1 text-sm font-semibold text-zinc-950">
              {formatKilometraje(vehicle.kilometraje)}
            </p>
          </div>
        </div>

        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-10 w-full rounded-full border-zinc-950 bg-zinc-950 text-[#f2c400] hover:bg-zinc-900"
        >
          <Link href={`/vehiculos/${vehicle.id}`} prefetch={false}>
            Ver detalle
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
