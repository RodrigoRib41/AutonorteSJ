import type { Prisma } from "@prisma/client";

export const MAX_VEHICLE_IMAGES = 5;
export const MAX_FEATURED_VEHICLES = 3;
export const VEHICLE_CATALOG_PAGE_SIZE = 12;
export const vehicleCurrencies = ["USD", "ARS"] as const;
export const vehicleConditions = ["ZERO_KM", "USED"] as const;
export const vehicleCategories = [
  "CAR",
  "PICKUP",
  "SUV",
  "MOTORCYCLE",
  "VAN",
  "TRUCK",
  "OTHER",
] as const;

export type VehicleCurrency = (typeof vehicleCurrencies)[number];
export type VehicleCondition = (typeof vehicleConditions)[number];
export type VehicleCategory = (typeof vehicleCategories)[number];

export const vehicleCategoryOptions: Array<{
  label: string;
  value: VehicleCategory;
}> = [
  { value: "CAR", label: "Auto" },
  { value: "PICKUP", label: "Pick-up" },
  { value: "SUV", label: "SUV" },
  { value: "MOTORCYCLE", label: "Moto" },
  { value: "VAN", label: "Utilitario" },
  { value: "TRUCK", label: "Camion" },
  { value: "OTHER", label: "Otro" },
];

export const vehicleWithImagesInclude = {
  images: {
    orderBy: {
      sortOrder: "asc",
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
    },
  },
  updatedBy: {
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.VehicleInclude;

export type VehiclePersisted = Prisma.VehicleGetPayload<{
  include: typeof vehicleWithImagesInclude;
}>;

export type VehicleImagePersisted = VehiclePersisted["images"][number];

export type VehiclePayload = {
  marca: string;
  modelo: string;
  condition: VehicleCondition;
  category: VehicleCategory;
  anio: number;
  kilometraje: number;
  precio: number;
  promotionalPrice: number | null;
  currency: VehicleCurrency;
  descripcion: string | null;
  destacado: boolean;
};

export type VehiclePreviewImage = Pick<
  VehicleImagePersisted,
  | "id"
  | "publicId"
  | "assetId"
  | "alt"
  | "sortOrder"
  | "isPrimary"
  | "width"
  | "height"
  | "format"
  | "bytes"
>;

export type VehiclePreview = Pick<
  VehiclePersisted,
  | "id"
  | "marca"
  | "modelo"
  | "condition"
  | "category"
  | "anio"
  | "kilometraje"
  | "precio"
  | "promotionalPrice"
  | "currency"
  | "descripcion"
  | "destacado"
> & {
  images: VehiclePreviewImage[];
};

export type VehicleImageApiRecord = {
  id: string;
  publicId: string;
  assetId: string | null;
  alt: string | null;
  sortOrder: number;
  isPrimary: boolean;
  width: number | null;
  height: number | null;
  format: string | null;
  bytes: number | null;
  createdAt: string;
};

export type VehicleApiRecord = VehiclePayload & {
  id: string;
  images: VehicleImageApiRecord[];
  createdAt: string;
  updatedAt: string;
};

export type VehicleFormValues = {
  marca: string;
  modelo: string;
  condition: VehicleCondition;
  category: VehicleCategory;
  anio: string;
  kilometraje: string;
  precio: string;
  promotionalPrice: string;
  currency: VehicleCurrency;
  descripcion: string;
  destacado: boolean;
};

export type VehicleFieldErrors = Partial<Record<keyof VehiclePayload, string>>;

export type FeaturedVehicleOption = {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
};

export type VehicleListResponse =
  | {
      success: true;
      vehicles: VehicleApiRecord[];
      message?: string;
    }
  | {
      success: false;
      message: string;
      fieldErrors?: VehicleFieldErrors;
    };

export type VehicleCatalogPageResponse =
  | {
      success: true;
      vehicles: VehicleApiRecord[];
      totalCount: number;
      nextOffset: number;
      hasMore: boolean;
    }
  | {
      success: false;
      message: string;
    };

export type VehicleItemResponse =
  | {
      success: true;
      vehicle?: VehicleApiRecord;
      message?: string;
    }
  | {
      success: false;
      message: string;
      code?: "FEATURED_LIMIT_REACHED";
      featuredVehicles?: FeaturedVehicleOption[];
      fieldErrors?: VehicleFieldErrors;
    };

export type VehicleImagesResponse =
  | {
      success: true;
      images: VehicleImageApiRecord[];
      uploadedImages?: VehicleImageApiRecord[];
      message?: string;
    }
  | {
      success: false;
      message: string;
    };

export type VehicleImageDeleteResponse =
  | {
      success: true;
      deletedImageId: string;
      deletedImageIds?: string[];
      images: VehicleImageApiRecord[];
      message?: string;
    }
  | {
      success: false;
      message: string;
    };

export type VehicleBulkDeleteResponse =
  | {
      success: true;
      deletedCount: number;
      message: string;
    }
  | {
      success: false;
      message: string;
    };

export const emptyVehicleFormValues: VehicleFormValues = {
  marca: "",
  modelo: "",
  condition: "USED",
  category: "CAR",
  anio: "",
  kilometraje: "",
  precio: "",
  promotionalPrice: "",
  currency: "USD",
  descripcion: "",
  destacado: false,
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asInteger(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value !== "string") {
    return Number.NaN;
  }

  const normalized = value.trim().replace(/\./g, "").replace(/,/g, "");

  if (!normalized) {
    return Number.NaN;
  }

  return Number.parseInt(normalized, 10);
}

function asOptionalInteger(value: unknown) {
  const parsedValue = asInteger(value);
  return Number.isInteger(parsedValue) ? parsedValue : null;
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "on" || normalized === "1";
  }

  return false;
}

function asCurrency(value: unknown): VehicleCurrency {
  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();

    if (vehicleCurrencies.includes(normalized as VehicleCurrency)) {
      return normalized as VehicleCurrency;
    }
  }

  return "USD";
}

function asCondition(value: unknown): VehicleCondition {
  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();

    if (vehicleConditions.includes(normalized as VehicleCondition)) {
      return normalized as VehicleCondition;
    }
  }

  return "USED";
}

function asCategory(value: unknown): VehicleCategory {
  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase().replace("-", "_");

    if (vehicleCategories.includes(normalized as VehicleCategory)) {
      return normalized as VehicleCategory;
    }
  }

  return "CAR";
}

export function parseVehiclePayload(input: unknown): VehiclePayload {
  const data =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const descripcion = asString(data.descripcion);

  return {
    marca: asString(data.marca),
    modelo: asString(data.modelo),
    condition: asCondition(data.condition),
    category: asCategory(data.category),
    anio: asInteger(data.anio),
    kilometraje: asInteger(data.kilometraje),
    precio: asInteger(data.precio),
    promotionalPrice: asOptionalInteger(data.promotionalPrice),
    currency: asCurrency(data.currency),
    descripcion: descripcion || null,
    destacado: asBoolean(data.destacado),
  };
}

export function validateVehiclePayload(
  payload: VehiclePayload
): VehicleFieldErrors {
  const errors: VehicleFieldErrors = {};
  const currentYear = new Date().getFullYear() + 1;

  if (payload.marca.length < 2) {
    errors.marca = "Ingresa una marca valida.";
  }

  if (payload.modelo.length < 2) {
    errors.modelo = "Ingresa un modelo valido.";
  }

  if (!vehicleConditions.includes(payload.condition)) {
    errors.condition = "Selecciona si la unidad es 0 km o usada.";
  }

  if (!vehicleCategories.includes(payload.category)) {
    errors.category = "Selecciona una categoria valida.";
  }

  if (
    !Number.isInteger(payload.anio) ||
    payload.anio < 1900 ||
    payload.anio > currentYear
  ) {
    errors.anio = "Ingresa un año válido.";
  }

  if (!Number.isInteger(payload.kilometraje) || payload.kilometraje < 0) {
    errors.kilometraje = "Ingresa un kilometraje valido.";
  }

  if (!Number.isInteger(payload.precio) || payload.precio <= 0) {
    errors.precio = "Ingresa un precio valido.";
  }

  if (
    payload.promotionalPrice !== null &&
    (!Number.isInteger(payload.promotionalPrice) ||
      payload.promotionalPrice <= 0)
  ) {
    errors.promotionalPrice = "Ingresa un precio promocional valido.";
  }

  if (
    payload.promotionalPrice !== null &&
    Number.isInteger(payload.precio) &&
    payload.precio > 0 &&
    payload.promotionalPrice >= payload.precio
  ) {
    errors.promotionalPrice =
      "El precio promocional debe ser menor al precio de lista.";
  }

  if (!vehicleCurrencies.includes(payload.currency)) {
    errors.currency = "Selecciona una moneda valida.";
  }

  if (payload.descripcion && payload.descripcion.length < 20) {
    errors.descripcion =
      "Si agregas una descripcion, intenta que tenga al menos 20 caracteres.";
  }

  return errors;
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

export function serializeVehicleImage(
  image: Pick<
    VehicleImagePersisted,
    | "id"
    | "publicId"
    | "assetId"
    | "alt"
    | "sortOrder"
    | "isPrimary"
    | "width"
    | "height"
    | "format"
    | "bytes"
    | "createdAt"
  >
): VehicleImageApiRecord {
  return {
    id: image.id,
    publicId: image.publicId,
    assetId: image.assetId,
    alt: image.alt,
    sortOrder: image.sortOrder,
    isPrimary: image.isPrimary,
    width: image.width,
    height: image.height,
    format: image.format,
    bytes: image.bytes,
    createdAt: toIsoString(image.createdAt),
  };
}

export function serializeVehicle(vehicle: VehiclePersisted): VehicleApiRecord {
  return {
    id: vehicle.id,
    marca: vehicle.marca,
    modelo: vehicle.modelo,
    condition: vehicle.condition,
    category: vehicle.category,
    anio: vehicle.anio,
    kilometraje: vehicle.kilometraje,
    precio: vehicle.precio,
    promotionalPrice: vehicle.promotionalPrice,
    currency: vehicle.currency,
    descripcion: vehicle.descripcion,
    destacado: vehicle.destacado,
    images: vehicle.images.map(serializeVehicleImage),
    createdAt: toIsoString(vehicle.createdAt),
    updatedAt: toIsoString(vehicle.updatedAt),
  };
}

export function vehicleToFormValues(
  vehicle: Pick<
    VehiclePreview,
    | "marca"
    | "modelo"
    | "condition"
    | "category"
    | "anio"
    | "kilometraje"
    | "precio"
    | "promotionalPrice"
    | "currency"
    | "descripcion"
    | "destacado"
  >
): VehicleFormValues {
  return {
    marca: vehicle.marca,
    modelo: vehicle.modelo,
    condition: vehicle.condition,
    category: vehicle.category,
    anio: String(vehicle.anio),
    kilometraje: String(vehicle.kilometraje),
    precio: String(vehicle.precio),
    promotionalPrice: vehicle.promotionalPrice
      ? String(vehicle.promotionalPrice)
      : "",
    currency: vehicle.currency,
    descripcion: vehicle.descripcion ?? "",
    destacado: vehicle.destacado,
  };
}

export function getVehicleDisplayName(
  vehicle: Pick<VehiclePreview, "marca" | "modelo">
) {
  return `${vehicle.marca} ${vehicle.modelo}`;
}

export function getVehiclePrimaryImage(
  vehicle: Pick<VehiclePreview, "images">
) {
  return (
    vehicle.images.find((image) => image.isPrimary) ?? vehicle.images[0] ?? null
  );
}

export function getVehicleConditionLabel(condition: VehicleCondition) {
  return condition === "ZERO_KM" ? "0 km" : "Usado";
}

export function getVehicleCategoryLabel(category: VehicleCategory) {
  return (
    vehicleCategoryOptions.find((option) => option.value === category)?.label ??
    "Auto"
  );
}

export function hasVehiclePromotion(
  vehicle: Pick<VehiclePreview, "precio" | "promotionalPrice">
) {
  return (
    vehicle.promotionalPrice !== null &&
    vehicle.promotionalPrice > 0 &&
    vehicle.promotionalPrice < vehicle.precio
  );
}

export function getVehicleDisplayPrice(
  vehicle: Pick<VehiclePreview, "precio" | "promotionalPrice">
) {
  return hasVehiclePromotion(vehicle)
    ? (vehicle.promotionalPrice ?? vehicle.precio)
    : vehicle.precio;
}

export function formatKilometraje(kilometraje: number) {
  return `${new Intl.NumberFormat("es-AR").format(kilometraje)} km`;
}

export function formatPrecio(precio: number, currency: VehicleCurrency) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(precio);
}
