/* eslint-disable @next/next/no-img-element */
import { forwardRef, type ImgHTMLAttributes } from "react";

import {
  buildVehicleImageSrcSet,
  buildVehicleImageUrl,
  getVehicleImageVariantMaxWidth,
  type VehicleImageVariant,
} from "@/lib/cloudinary-images";
import { cn } from "@/lib/utils";

type CloudinaryVehicleImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "alt" | "fetchPriority" | "loading" | "src" | "srcSet"
> & {
  alt: string;
  fill?: boolean;
  format?: string | null;
  preload?: boolean;
  publicId: string;
  variant?: VehicleImageVariant;
};

export const CloudinaryVehicleImage = forwardRef<
  HTMLImageElement,
  CloudinaryVehicleImageProps
>(function CloudinaryVehicleImage(
  {
    alt,
    className,
    fill = false,
    format,
    preload = false,
    publicId,
    variant = "card",
    ...imageProps
  },
  ref
) {
  const src = format ? `${publicId}.${format.replace(/^\./, "")}` : publicId;
  const fallbackWidth = getVehicleImageVariantMaxWidth(variant);

  return (
    <img
      {...imageProps}
      ref={ref}
      alt={alt}
      className={cn(fill ? "absolute inset-0 h-full w-full" : "", className)}
      decoding="async"
      fetchPriority={preload ? "high" : "auto"}
      loading={preload ? "eager" : "lazy"}
      sizes={imageProps.sizes}
      src={buildVehicleImageUrl(src, {
        variant,
        width: fallbackWidth,
      })}
      srcSet={buildVehicleImageSrcSet(src, {
        variant,
      })}
    />
  );
});
