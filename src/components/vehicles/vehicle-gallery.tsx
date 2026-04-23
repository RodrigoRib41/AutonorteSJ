"use client";

import { useState } from "react";

import { CloudinaryVehicleImage } from "@/components/vehicles/cloudinary-vehicle-image";
import { type VehicleImageApiRecord } from "@/lib/vehicle-records";

type VehicleGalleryProps = {
  vehicleName: string;
  images: VehicleImageApiRecord[];
};

export function VehicleGallery({ vehicleName, images }: VehicleGalleryProps) {
  const [activeImageId, setActiveImageId] = useState(images[0]?.id ?? "");

  const activeImage =
    images.find((image) => image.id === activeImageId) ?? images[0] ?? null;

  if (!activeImage) {
    return (
      <div className="overflow-hidden rounded-[1.5rem] border border-zinc-950/15 bg-[linear-gradient(135deg,#f2c400_0%,#fff1a6_56%,#2b292d_56%,#2b292d_100%)] p-8">
        <div className="flex min-h-[20rem] flex-col justify-end rounded-[1.25rem] border border-white/70 bg-white/72 p-6 shadow-sm backdrop-blur">
          <p className="text-sm font-semibold tracking-[0.2em] text-zinc-500 uppercase">
            Sin fotos cargadas
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
            {vehicleName}
          </h2>
          <p className="mt-4 max-w-lg text-base leading-8 text-zinc-600">
            Consultanos y te compartimos fotos de la unidad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-zinc-950/15 bg-zinc-100 shadow-[0_24px_60px_rgba(0,0,0,0.16)]">
        <CloudinaryVehicleImage
          publicId={activeImage.publicId}
          format={activeImage.format}
          alt={activeImage.alt ?? vehicleName}
          variant="detail"
          fill
          preload={activeImage.id === images[0]?.id}
          sizes="(min-width: 1024px) 42vw, 100vw"
          className="object-cover"
        />
        <div className="absolute left-5 top-5 inline-flex rounded-full bg-[#f2c400]/95 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-zinc-950 uppercase shadow-sm">
          {activeImage.sortOrder === 0
            ? "Imagen principal"
            : `Vista ${activeImage.sortOrder + 1}`}
        </div>
      </div>

      {images.length > 1 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image) => {
            const isActive = image.id === activeImage.id;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveImageId(image.id)}
                className={`relative aspect-[4/3] overflow-hidden rounded-[1.25rem] border transition ${
                  isActive
                    ? "border-[#f2c400] shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
                    : "border-zinc-950/15 hover:border-zinc-950/40"
                }`}
              >
                <CloudinaryVehicleImage
                  publicId={image.publicId}
                  format={image.format}
                  alt={image.alt ?? `${vehicleName} vista ${image.sortOrder + 1}`}
                  variant="thumbnail"
                  fill
                  sizes="(min-width: 640px) 20vw, 30vw"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
