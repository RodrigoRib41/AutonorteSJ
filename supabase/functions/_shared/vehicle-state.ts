export const MAX_FEATURED_VEHICLES = 3;
export const MAX_VEHICLE_IMAGES = 5;

export type VehiclePayload = {
  marca: string;
  modelo: string;
  condition: "ZERO_KM" | "USED";
  category:
    | "CAR"
    | "PICKUP"
    | "SUV"
    | "MOTORCYCLE"
    | "VAN"
    | "TRUCK"
    | "OTHER";
  anio: number;
  kilometraje: number;
  precio: number;
  promotionalPrice: number | null;
  currency: "USD" | "ARS";
  descripcion: string | null;
  destacado: boolean;
};

export type VehicleRow = {
  id: string;
  marca: string;
  modelo: string;
  condition: VehiclePayload["condition"];
  category: VehiclePayload["category"];
  anio: number;
  kilometraje: number;
  precio: number;
  promotional_price: number | null;
  currency: VehiclePayload["currency"];
  descripcion: string | null;
  destacado: boolean;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  deleted_by_user_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VehicleImageRow = {
  id: string;
  vehicle_id: string;
  public_id: string;
  asset_id: string | null;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
  width: number | null;
  height: number | null;
  format: string | null;
  bytes: number | null;
  created_at: string;
};

type VehicleRestoreSnapshot = {
  version: 1;
  vehicle: VehiclePayload & {
    id: string;
    createdByUserId: string | null;
    updatedByUserId: string | null;
    deletedByUserId: string | null;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  images: Array<{
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
  }>;
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
  return normalized ? Number.parseInt(normalized, 10) : Number.NaN;
}

function asOptionalInteger(value: unknown) {
  const parsed = asInteger(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "on";
  }

  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseVehiclePayload(input: unknown): VehiclePayload {
  const data = isRecord(input) ? input : {};
  const descripcion = asString(data.descripcion);

  return {
    marca: asString(data.marca),
    modelo: asString(data.modelo),
    condition:
      asString(data.condition).toUpperCase() === "ZERO_KM" ? "ZERO_KM" : "USED",
    category: (
      [
        "CAR",
        "PICKUP",
        "SUV",
        "MOTORCYCLE",
        "VAN",
        "TRUCK",
        "OTHER",
      ] as const
    ).includes(asString(data.category).toUpperCase() as VehiclePayload["category"])
      ? (asString(data.category).toUpperCase() as VehiclePayload["category"])
      : "CAR",
    anio: asInteger(data.anio),
    kilometraje: asInteger(data.kilometraje),
    precio: asInteger(data.precio),
    promotionalPrice: asOptionalInteger(data.promotionalPrice),
    currency: asString(data.currency).toUpperCase() === "ARS" ? "ARS" : "USD",
    descripcion: descripcion || null,
    destacado: asBoolean(data.destacado),
  };
}

export function validateVehiclePayload(payload: VehiclePayload) {
  const fieldErrors: Partial<Record<keyof VehiclePayload, string>> = {};
  const currentYear = new Date().getFullYear() + 1;

  if (payload.marca.length < 2) {
    fieldErrors.marca = "Ingresa una marca valida.";
  }

  if (payload.modelo.length < 2) {
    fieldErrors.modelo = "Ingresa un modelo valido.";
  }

  if (!Number.isInteger(payload.anio) || payload.anio < 1900 || payload.anio > currentYear) {
    fieldErrors.anio = "Ingresa un ano valido.";
  }

  if (!Number.isInteger(payload.kilometraje) || payload.kilometraje < 0) {
    fieldErrors.kilometraje = "Ingresa un kilometraje valido.";
  }

  if (!Number.isInteger(payload.precio) || payload.precio <= 0) {
    fieldErrors.precio = "Ingresa un precio valido.";
  }

  if (
    payload.promotionalPrice !== null &&
    (!Number.isInteger(payload.promotionalPrice) || payload.promotionalPrice <= 0)
  ) {
    fieldErrors.promotionalPrice =
      "Ingresa un precio promocional valido.";
  }

  if (
    payload.promotionalPrice !== null &&
    payload.promotionalPrice >= payload.precio
  ) {
    fieldErrors.promotionalPrice =
      "El precio promocional debe ser menor al precio de lista.";
  }

  if (payload.descripcion && payload.descripcion.length < 20) {
    fieldErrors.descripcion =
      "Si agregas una descripcion, intenta que tenga al menos 20 caracteres.";
  }

  return fieldErrors;
}

export function serializeVehicleImage(image: VehicleImageRow) {
  return {
    id: image.id,
    publicId: image.public_id,
    assetId: image.asset_id,
    alt: image.alt,
    sortOrder: image.sort_order,
    isPrimary: image.is_primary,
    width: image.width,
    height: image.height,
    format: image.format,
    bytes: image.bytes,
    createdAt: image.created_at,
  };
}

export function serializeVehicle(vehicle: VehicleRow, images: VehicleImageRow[]) {
  return {
    id: vehicle.id,
    marca: vehicle.marca,
    modelo: vehicle.modelo,
    condition: vehicle.condition,
    category: vehicle.category,
    anio: vehicle.anio,
    kilometraje: vehicle.kilometraje,
    precio: vehicle.precio,
    promotionalPrice: vehicle.promotional_price,
    currency: vehicle.currency,
    descripcion: vehicle.descripcion,
    destacado: vehicle.destacado,
    images: images.map(serializeVehicleImage),
    createdAt: vehicle.created_at,
    updatedAt: vehicle.updated_at,
  };
}

export function buildVehicleRestoreSnapshot(
  vehicle: VehicleRow,
  images: VehicleImageRow[]
): VehicleRestoreSnapshot {
  return {
    version: 1,
    vehicle: {
      id: vehicle.id,
      marca: vehicle.marca,
      modelo: vehicle.modelo,
      condition: vehicle.condition,
      category: vehicle.category,
      anio: vehicle.anio,
      kilometraje: vehicle.kilometraje,
      precio: vehicle.precio,
      promotionalPrice: vehicle.promotional_price,
      currency: vehicle.currency,
      descripcion: vehicle.descripcion,
      destacado: vehicle.destacado,
      createdByUserId: vehicle.created_by_user_id,
      updatedByUserId: vehicle.updated_by_user_id,
      deletedByUserId: vehicle.deleted_by_user_id,
      deletedAt: vehicle.deleted_at,
      createdAt: vehicle.created_at,
      updatedAt: vehicle.updated_at,
    },
    images: images.map((image) => ({
      id: image.id,
      publicId: image.public_id,
      assetId: image.asset_id,
      alt: image.alt,
      sortOrder: image.sort_order,
      isPrimary: image.is_primary,
      width: image.width,
      height: image.height,
      format: image.format,
      bytes: image.bytes,
      createdAt: image.created_at,
    })),
  };
}

export function parseVehicleRestoreSnapshot(
  snapshot: unknown
): VehicleRestoreSnapshot | null {
  if (!isRecord(snapshot) || snapshot.version !== 1) {
    return null;
  }

  const vehicle = isRecord(snapshot.vehicle) ? snapshot.vehicle : null;
  const images = Array.isArray(snapshot.images) ? snapshot.images : null;

  if (!vehicle || !images) {
    return null;
  }

  const parsed = {
    version: 1 as const,
    vehicle: {
      id: asString(vehicle.id),
      marca: asString(vehicle.marca),
      modelo: asString(vehicle.modelo),
      condition:
        asString(vehicle.condition).toUpperCase() === "ZERO_KM"
          ? "ZERO_KM"
          : "USED",
      category: (
        [
          "CAR",
          "PICKUP",
          "SUV",
          "MOTORCYCLE",
          "VAN",
          "TRUCK",
          "OTHER",
        ] as const
      ).includes(asString(vehicle.category).toUpperCase() as VehiclePayload["category"])
        ? (asString(vehicle.category).toUpperCase() as VehiclePayload["category"])
        : "CAR",
      anio: Number(vehicle.anio ?? 0),
      kilometraje: Number(vehicle.kilometraje ?? 0),
      precio: Number(vehicle.precio ?? 0),
      promotionalPrice:
        vehicle.promotionalPrice === null ? null : Number(vehicle.promotionalPrice ?? 0),
      currency: asString(vehicle.currency).toUpperCase() === "ARS" ? "ARS" : "USD",
      descripcion:
        vehicle.descripcion === null ? null : asString(vehicle.descripcion) || null,
      destacado: Boolean(vehicle.destacado),
      createdByUserId:
        vehicle.createdByUserId === null ? null : asString(vehicle.createdByUserId) || null,
      updatedByUserId:
        vehicle.updatedByUserId === null ? null : asString(vehicle.updatedByUserId) || null,
      deletedByUserId:
        vehicle.deletedByUserId === null ? null : asString(vehicle.deletedByUserId) || null,
      deletedAt:
        vehicle.deletedAt === null ? null : asString(vehicle.deletedAt) || null,
      createdAt: asString(vehicle.createdAt),
      updatedAt: asString(vehicle.updatedAt),
    },
    images: images
      .filter(isRecord)
      .map((image) => ({
        id: asString(image.id),
        publicId: asString(image.publicId),
        assetId: image.assetId === null ? null : asString(image.assetId) || null,
        alt: image.alt === null ? null : asString(image.alt) || null,
        sortOrder: Number(image.sortOrder ?? 0),
        isPrimary: Boolean(image.isPrimary),
        width: image.width === null ? null : Number(image.width ?? 0),
        height: image.height === null ? null : Number(image.height ?? 0),
        format: image.format === null ? null : asString(image.format) || null,
        bytes: image.bytes === null ? null : Number(image.bytes ?? 0),
        createdAt: asString(image.createdAt),
      })),
  });

  return parsed.vehicle.id && parsed.vehicle.marca && parsed.vehicle.modelo
    ? parsed
    : null;
}

function formatChangedFieldList(fields: string[]) {
  if (fields.length === 0) {
    return "";
  }

  if (fields.length === 1) {
    return fields[0] ?? "";
  }

  return `${fields.slice(0, -1).join(", ")} y ${fields.at(-1)}`;
}

export function buildVehiclePayloadChangeSummary(
  vehicle: VehicleRow,
  payload: VehiclePayload
) {
  const changedFields: string[] = [];

  if (vehicle.marca !== payload.marca) changedFields.push("marca");
  if (vehicle.modelo !== payload.modelo) changedFields.push("modelo");
  if (vehicle.condition !== payload.condition) changedFields.push("tipo");
  if (vehicle.category !== payload.category) changedFields.push("categoria");
  if (vehicle.anio !== payload.anio) changedFields.push("anio");
  if (vehicle.kilometraje !== payload.kilometraje) changedFields.push("kilometraje");
  if (vehicle.precio !== payload.precio) changedFields.push("precio");
  if (vehicle.promotional_price !== payload.promotionalPrice) {
    changedFields.push("precio promocional");
  }
  if (vehicle.currency !== payload.currency) changedFields.push("moneda");
  if ((vehicle.descripcion ?? null) !== payload.descripcion) {
    changedFields.push("descripcion");
  }
  if (vehicle.destacado !== payload.destacado) changedFields.push("destacado");

  if (changedFields.length === 0) {
    return "Se guardo la ficha sin cambios visibles.";
  }

  return `Se modifico ${formatChangedFieldList(changedFields)}.`;
}

export function buildVehicleImagesAddedSummary(count: number) {
  return count === 1
    ? "Se agrego 1 imagen a la galeria."
    : `Se agregaron ${count} imagenes a la galeria.`;
}

export function buildVehicleImagesDeletedSummary(count: number) {
  return count === 1
    ? "Se elimino 1 imagen de la galeria."
    : `Se eliminaron ${count} imagenes de la galeria.`;
}

export function buildVehicleImagesReorderedSummary() {
  return "Se modifico el orden de la galeria de imagenes.";
}
