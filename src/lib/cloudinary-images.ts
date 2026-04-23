export const CLOUDINARY_VEHICLE_FOLDER = "autos";
export const VEHICLE_IMAGE_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const VEHICLE_IMAGE_UPLOAD_MAX_WIDTH = 2400;
export const VEHICLE_IMAGE_UPLOAD_MAX_HEIGHT = 3200;
const VEHICLE_IMAGE_DELIVERY_CACHE_FLAG = "fl_immutable_cache";
export const VEHICLE_IMAGE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;
export const VEHICLE_IMAGE_ACCEPT = VEHICLE_IMAGE_ALLOWED_MIME_TYPES.join(",");

export type VehicleImageAllowedMimeType =
  (typeof VEHICLE_IMAGE_ALLOWED_MIME_TYPES)[number];

export type VehicleImageVariant =
  | "adminThumbnail"
  | "adminPreview"
  | "thumbnail"
  | "card"
  | "detail"
  | "lightbox";

type VehicleImageVariantConfig = {
  crop: "fill" | "limit";
  aspectRatio?: number;
  maxWidth: number;
  quality: "q_auto" | "q_auto:best";
  widths: number[];
};

const vehicleImageVariantConfig: Record<
  VehicleImageVariant,
  VehicleImageVariantConfig
> = {
  adminThumbnail: {
    crop: "fill",
    aspectRatio: 5 / 4,
    maxWidth: 160,
    quality: "q_auto",
    widths: [80, 160],
  },
  adminPreview: {
    crop: "fill",
    aspectRatio: 4 / 3,
    maxWidth: 640,
    quality: "q_auto",
    widths: [320, 480, 640],
  },
  thumbnail: {
    crop: "fill",
    aspectRatio: 4 / 3,
    maxWidth: 480,
    quality: "q_auto",
    widths: [160, 240, 320, 480],
  },
  card: {
    crop: "fill",
    aspectRatio: 5 / 4,
    maxWidth: 1280,
    quality: "q_auto",
    widths: [360, 414, 640, 768, 1024, 1280],
  },
  detail: {
    crop: "fill",
    aspectRatio: 4 / 3,
    maxWidth: 1600,
    quality: "q_auto:best",
    widths: [640, 768, 1024, 1280, 1600],
  },
  lightbox: {
    crop: "limit",
    maxWidth: 2400,
    quality: "q_auto:best",
    widths: [1024, 1280, 1600, 1920, 2400],
  },
};

function getCloudinaryCloudName() {
  return (
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME ||
    ""
  ).trim();
}

function sanitizeCloudinaryPathSegment(segment: string) {
  return segment.trim().replace(/[^a-zA-Z0-9_-]/g, "-");
}

function encodeCloudinaryPublicId(publicId: string) {
  return publicId
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function isVehicleImageAllowedMimeType(
  mimeType: string
): mimeType is VehicleImageAllowedMimeType {
  return VEHICLE_IMAGE_ALLOWED_MIME_TYPES.includes(
    mimeType as VehicleImageAllowedMimeType
  );
}

function formatMegabytes(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

export function getVehicleImageFolder(vehicleId: string) {
  return `${CLOUDINARY_VEHICLE_FOLDER}/${sanitizeCloudinaryPathSegment(
    vehicleId
  )}`;
}

export function getVehicleImagePublicId(vehicleId: string, imageId: string) {
  return `${getVehicleImageFolder(vehicleId)}/${sanitizeCloudinaryPathSegment(
    imageId
  )}`;
}

function getCanonicalVehicleImageWidth(
  variant: VehicleImageVariant,
  requestedWidth: number
) {
  const config = vehicleImageVariantConfig[variant];
  const safeWidth = Math.max(1, Math.round(requestedWidth));
  const cappedWidth = Math.min(safeWidth, config.maxWidth);

  return (
    config.widths.find((width) => width >= cappedWidth) ??
    config.widths[config.widths.length - 1] ??
    cappedWidth
  );
}

export function validateVehicleImageFile(
  file: Pick<File, "name" | "size" | "type">
) {
  if (!isVehicleImageAllowedMimeType(file.type)) {
    return `La imagen "${file.name}" no tiene un formato permitido. Usa JPG, PNG, WebP o AVIF.`;
  }

  if (file.size > VEHICLE_IMAGE_MAX_FILE_SIZE_BYTES) {
    return `La imagen "${file.name}" supera el maximo de ${formatMegabytes(
      VEHICLE_IMAGE_MAX_FILE_SIZE_BYTES
    )}.`;
  }

  return null;
}

export function detectVehicleImageMimeType(
  bytes: Uint8Array
): VehicleImageAllowedMimeType | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(4, 8)) === "ftyp"
  ) {
    const brand = String.fromCharCode(...bytes.subarray(8, 12));

    if (brand === "avif" || brand === "avis") {
      return "image/avif";
    }
  }

  return null;
}

export function validateVehicleImageBytes(bytes: Uint8Array) {
  if (!detectVehicleImageMimeType(bytes)) {
    return "El archivo no parece ser una imagen valida JPG, PNG, WebP o AVIF.";
  }

  return null;
}

export function buildVehicleImageTransformation(
  variant: VehicleImageVariant,
  width: number
) {
  const config = vehicleImageVariantConfig[variant];
  const safeWidth = getCanonicalVehicleImageWidth(variant, width);

  if (config.crop === "limit") {
    return `c_limit,${VEHICLE_IMAGE_DELIVERY_CACHE_FLAG},w_${safeWidth}/f_auto/${config.quality}`;
  }

  const height = Math.max(1, Math.round(safeWidth / (config.aspectRatio ?? 1)));

  return `c_fill,${VEHICLE_IMAGE_DELIVERY_CACHE_FLAG},g_auto,h_${height},w_${safeWidth}/f_auto/${config.quality}`;
}

export function buildVehicleImageUrl(
  publicId: string,
  options: {
    variant?: VehicleImageVariant;
    width: number;
  }
) {
  const cloudName = getCloudinaryCloudName();
  const variant = options.variant ?? "card";
  const transformation = buildVehicleImageTransformation(
    variant,
    options.width
  );

  if (!cloudName) {
    return `/missing-cloudinary-cloud-name/${encodeURIComponent(publicId)}`;
  }

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${encodeCloudinaryPublicId(
    publicId
  )}`;
}

export function getVehicleImageVariantWidths(variant: VehicleImageVariant) {
  return vehicleImageVariantConfig[variant].widths;
}

export function getVehicleImageVariantMaxWidth(variant: VehicleImageVariant) {
  return vehicleImageVariantConfig[variant].maxWidth;
}

export function buildVehicleImageSrcSet(
  publicId: string,
  options: {
    variant?: VehicleImageVariant;
    widths?: number[];
  } = {}
) {
  const variant = options.variant ?? "card";
  const widths = options.widths ?? getVehicleImageVariantWidths(variant);

  return widths
    .map((width) => {
      const safeWidth = getCanonicalVehicleImageWidth(variant, width);

      return `${buildVehicleImageUrl(publicId, {
        variant,
        width: safeWidth,
      })} ${safeWidth}w`;
    })
    .filter((entry, index, entries) => entries.indexOf(entry) === index)
    .join(", ");
}
