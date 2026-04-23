import { type Prisma, type VehicleRestoreAction } from "@prisma/client";

import type { AuthenticatedAdmin } from "@/lib/admin-auth";
import { deleteCloudinaryImage, isCloudinaryConfigured } from "@/lib/cloudinary";
import { getPrismaClient } from "@/lib/prisma";
import { vehicleAuditActorSelect } from "@/lib/vehicle-audit";
import {
  getVehicleDisplayName,
  type VehicleCategory,
  type VehiclePersisted,
  type VehiclePayload,
} from "@/lib/vehicle-records";

export const VEHICLE_RESTORE_RETENTION_DAYS = 7;
const VEHICLE_RESTORE_RETENTION_MS =
  VEHICLE_RESTORE_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export const vehicleRestorePointInclude = {
  actor: {
    select: vehicleAuditActorSelect,
  },
  restoredBy: {
    select: vehicleAuditActorSelect,
  },
  vehicle: {
    select: {
      id: true,
      marca: true,
      modelo: true,
      deletedAt: true,
    },
  },
} satisfies Prisma.VehicleRestorePointInclude;

export type VehicleRestorePointRecord = Prisma.VehicleRestorePointGetPayload<{
  include: typeof vehicleRestorePointInclude;
}>;

export type VehicleSnapshotImage = {
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

export type VehicleRestoreSnapshot = {
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
  images: VehicleSnapshotImage[];
};

export type VehicleRestoreResponse =
  | {
      success: true;
      message?: string;
    }
  | {
      success: false;
      message: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readNullableString(value: unknown) {
  return value === null ? null : typeof value === "string" ? value : undefined;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readNullableNumber(value: unknown) {
  if (value === null) {
    return null;
  }

  const number = readNumber(value);
  return number === null ? undefined : number;
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function readVehicleCategory(value: unknown): VehicleCategory {
  return typeof value === "string" &&
    ["CAR", "PICKUP", "SUV", "MOTORCYCLE", "VAN", "TRUCK", "OTHER"].includes(
      value
    )
    ? (value as VehicleCategory)
    : "CAR";
}

function formatChangedFieldList(fields: string[]) {
  if (fields.length === 0) {
    return "";
  }

  if (fields.length === 1) {
    return fields[0] ?? "";
  }

  const lastField = fields.at(-1);

  return `${fields.slice(0, -1).join(", ")} y ${lastField}`;
}

function parseSnapshotImage(value: unknown): VehicleSnapshotImage | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const publicId = readString(value.publicId);
  const assetId =
    "assetId" in value ? readNullableString(value.assetId) : null;
  const alt = readNullableString(value.alt);
  const sortOrder = readNumber(value.sortOrder);
  const isPrimary = readBoolean(value.isPrimary);
  const width = "width" in value ? readNullableNumber(value.width) : null;
  const height = "height" in value ? readNullableNumber(value.height) : null;
  const format = "format" in value ? readNullableString(value.format) : null;
  const bytes = "bytes" in value ? readNullableNumber(value.bytes) : null;
  const createdAt = readString(value.createdAt);

  if (
    !id ||
    !publicId ||
    assetId === undefined ||
    alt === undefined ||
    sortOrder === null ||
    width === undefined ||
    height === undefined ||
    format === undefined ||
    bytes === undefined ||
    !createdAt
  ) {
    return null;
  }

  return {
    id,
    publicId,
    assetId,
    alt,
    sortOrder,
    isPrimary: isPrimary ?? (sortOrder === 0),
    width,
    height,
    format,
    bytes,
    createdAt,
  };
}

export function getVehicleRestoreExpiresAt(baseDate = new Date()) {
  return new Date(baseDate.getTime() + VEHICLE_RESTORE_RETENTION_MS);
}

export function buildVehicleRestoreSnapshot(
  vehicle: VehiclePersisted
): Prisma.InputJsonObject {
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
      promotionalPrice: vehicle.promotionalPrice,
      currency: vehicle.currency,
      descripcion: vehicle.descripcion,
      destacado: vehicle.destacado,
      createdByUserId: vehicle.createdByUserId,
      updatedByUserId: vehicle.updatedByUserId,
      deletedByUserId: vehicle.deletedByUserId,
      deletedAt: vehicle.deletedAt?.toISOString() ?? null,
      createdAt: vehicle.createdAt.toISOString(),
      updatedAt: vehicle.updatedAt.toISOString(),
    },
    images: vehicle.images.map((image) => ({
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
      createdAt: image.createdAt.toISOString(),
    })),
  };
}

export function parseVehicleRestoreSnapshot(
  snapshot: Prisma.JsonValue
): VehicleRestoreSnapshot | null {
  if (!isRecord(snapshot) || snapshot.version !== 1) {
    return null;
  }

  const vehicle = isRecord(snapshot.vehicle) ? snapshot.vehicle : null;
  const images = Array.isArray(snapshot.images)
    ? snapshot.images.map(parseSnapshotImage)
    : null;

  if (!vehicle || !images || images.some((image) => image === null)) {
    return null;
  }

  const id = readString(vehicle.id);
  const marca = readString(vehicle.marca);
  const modelo = readString(vehicle.modelo);
  const condition = readString(vehicle.condition);
  const category = readVehicleCategory(vehicle.category);
  const anio = readNumber(vehicle.anio);
  const kilometraje = readNumber(vehicle.kilometraje);
  const precio = readNumber(vehicle.precio);
  const promotionalPrice = readNullableNumber(vehicle.promotionalPrice);
  const currency = readString(vehicle.currency);
  const descripcion = readNullableString(vehicle.descripcion);
  const destacado = readBoolean(vehicle.destacado);
  const createdByUserId = readNullableString(vehicle.createdByUserId);
  const updatedByUserId = readNullableString(vehicle.updatedByUserId);
  const deletedByUserId = readNullableString(vehicle.deletedByUserId);
  const deletedAt = readNullableString(vehicle.deletedAt);
  const createdAt = readString(vehicle.createdAt);
  const updatedAt = readString(vehicle.updatedAt);

  if (
    !id ||
    !marca ||
    !modelo ||
    (condition !== "ZERO_KM" && condition !== "USED") ||
    anio === null ||
    kilometraje === null ||
    precio === null ||
    promotionalPrice === undefined ||
    (currency !== "USD" && currency !== "ARS") ||
    descripcion === undefined ||
    destacado === null ||
    createdByUserId === undefined ||
    updatedByUserId === undefined ||
    deletedByUserId === undefined ||
    deletedAt === undefined ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    version: 1,
    vehicle: {
      id,
      marca,
      modelo,
      condition,
      category,
      anio,
      kilometraje,
      precio,
      promotionalPrice,
      currency,
      descripcion,
      destacado,
      createdByUserId,
      updatedByUserId,
      deletedByUserId,
      deletedAt,
      createdAt,
      updatedAt,
    },
    images: images as VehicleSnapshotImage[],
  };
}

export function buildVehicleRestorePointData(
  action: VehicleRestoreAction,
  admin: AuthenticatedAdmin,
  vehicle: VehiclePersisted,
  now = new Date(),
  summary?: string
) {
  return {
    vehicleId: vehicle.id,
    vehicleLabel: getVehicleDisplayName(vehicle),
    action,
    summary:
      summary ??
      (action === "DELETE"
        ? "Se elimino el vehiculo completo."
        : "Se guardo el estado anterior de la unidad."),
    snapshot: buildVehicleRestoreSnapshot(vehicle),
    actorUserId: admin.id,
    actorName: admin.name,
    actorEmail: admin.username,
    expiresAt: getVehicleRestoreExpiresAt(now),
  };
}

export function buildVehiclePayloadChangeSummary(
  vehicle: VehiclePersisted,
  payload: VehiclePayload
) {
  const changedFields: string[] = [];

  if (vehicle.marca !== payload.marca) changedFields.push("marca");
  if (vehicle.modelo !== payload.modelo) changedFields.push("modelo");
  if (vehicle.category !== payload.category) changedFields.push("categoria");
  if (vehicle.condition !== payload.condition) changedFields.push("tipo");
  if (vehicle.anio !== payload.anio) changedFields.push("anio");
  if (vehicle.kilometraje !== payload.kilometraje) {
    changedFields.push("kilometraje");
  }
  if (vehicle.precio !== payload.precio) changedFields.push("precio");
  if (vehicle.promotionalPrice !== payload.promotionalPrice) {
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

export function getVehicleRestoreActionLabel(action: VehicleRestoreAction) {
  switch (action) {
    case "UPDATE":
      return "Edicion";
    case "DELETE":
      return "Baja";
    default:
      return action;
  }
}

export function getVehicleRestoreActionDescription(action: VehicleRestoreAction) {
  switch (action) {
    case "UPDATE":
      return "Restaura el estado anterior a esta modificacion.";
    case "DELETE":
      return "Vuelve a publicar esta unidad y la quita de la papelera.";
    default:
      return "Restaura este movimiento.";
  }
}

export function getVehicleRestoreActorLabel(log: {
  actorName?: string | null;
  actorEmail?: string | null;
  actor?: {
    name?: string | null;
    username?: string | null;
    email?: string | null;
  } | null;
}) {
  return (
    log.actorName?.trim() ||
    log.actor?.name?.trim() ||
    log.actor?.username?.trim() ||
    log.actorEmail?.trim() ||
    log.actor?.email?.trim() ||
    "Usuario no disponible"
  );
}

export async function getActiveVehicleRestorePoints(
  now = new Date()
): Promise<VehicleRestorePointRecord[]> {
  return getPrismaClient().vehicleRestorePoint.findMany({
    include: vehicleRestorePointInclude,
    where: {
      restoredAt: null,
      expiresAt: {
        gt: now,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getActiveVehicleRestorePointCount(now = new Date()) {
  return getPrismaClient().vehicleRestorePoint.count({
    where: {
      restoredAt: null,
      expiresAt: {
        gt: now,
      },
    },
  });
}

export async function restoreVehicleFromSnapshot(
  tx: Prisma.TransactionClient,
  restorePoint: {
    vehicleId: string;
    snapshot: Prisma.JsonValue;
  },
  admin: AuthenticatedAdmin
) {
  const snapshot = parseVehicleRestoreSnapshot(restorePoint.snapshot);

  if (!snapshot) {
    throw new Error("Invalid vehicle restore snapshot.");
  }

  const restoredVehicle = await tx.vehicle.update({
    where: {
      id: restorePoint.vehicleId,
    },
    data: {
      marca: snapshot.vehicle.marca,
      modelo: snapshot.vehicle.modelo,
      condition: snapshot.vehicle.condition,
      category: snapshot.vehicle.category,
      anio: snapshot.vehicle.anio,
      kilometraje: snapshot.vehicle.kilometraje,
      precio: snapshot.vehicle.precio,
      promotionalPrice: snapshot.vehicle.promotionalPrice,
      currency: snapshot.vehicle.currency,
      descripcion: snapshot.vehicle.descripcion,
      destacado: snapshot.vehicle.destacado,
      createdByUserId: snapshot.vehicle.createdByUserId,
      updatedByUserId: admin.id,
      deletedByUserId: null,
      deletedAt: null,
    },
  });

  await tx.vehicleImage.deleteMany({
    where: {
      vehicleId: restorePoint.vehicleId,
    },
  });

  if (snapshot.images.length > 0) {
    await tx.vehicleImage.createMany({
      data: snapshot.images.map((image) => ({
        id: image.id,
        vehicleId: restorePoint.vehicleId,
        publicId: image.publicId,
        assetId: image.assetId,
        alt: image.alt,
        sortOrder: image.sortOrder,
        isPrimary: image.isPrimary,
        width: image.width,
        height: image.height,
        format: image.format,
        bytes: image.bytes,
        createdAt: new Date(image.createdAt),
      })),
    });
  }

  return restoredVehicle;
}

export async function purgeExpiredVehicleRestorePoints(now = new Date()) {
  const prisma = getPrismaClient();
  const [expiredDeletedVehicles, expiredUpdateRestorePoints] =
    await Promise.all([
      prisma.vehicleRestorePoint.findMany({
        where: {
          action: "DELETE",
          restoredAt: null,
          expiresAt: {
            lte: now,
          },
          vehicle: {
            deletedAt: {
              not: null,
            },
          },
        },
        select: {
          vehicleId: true,
          vehicle: {
            select: {
              images: {
                select: {
                  publicId: true,
                },
              },
            },
          },
        },
      }),
      prisma.vehicleRestorePoint.findMany({
        where: {
          action: "UPDATE",
          restoredAt: null,
          expiresAt: {
            lte: now,
          },
        },
        select: {
          snapshot: true,
        },
      }),
    ]);

  const expiredSnapshotPublicIds = Array.from(
    new Set(
      expiredUpdateRestorePoints.flatMap((point) => {
        const snapshot = parseVehicleRestoreSnapshot(point.snapshot);

        return snapshot ? snapshot.images.map((image) => image.publicId) : [];
      })
    )
  );

  const stillReferencedImages =
    expiredSnapshotPublicIds.length > 0
      ? await prisma.vehicleImage.findMany({
          where: {
            publicId: {
              in: expiredSnapshotPublicIds,
            },
          },
          select: {
            publicId: true,
          },
        })
      : [];
  const stillReferencedPublicIds = new Set(
    stillReferencedImages.map((image) => image.publicId)
  );
  const orphanSnapshotPublicIds = expiredSnapshotPublicIds.filter(
    (publicId) => !stillReferencedPublicIds.has(publicId)
  );

  const vehicleIdsToDelete = Array.from(
    new Set(expiredDeletedVehicles.map((point) => point.vehicleId))
  );

  if (isCloudinaryConfigured()) {
    const publicIds = Array.from(
      new Set([
        ...expiredDeletedVehicles.flatMap((point) =>
          point.vehicle.images.map((image) => image.publicId)
        ),
        ...orphanSnapshotPublicIds,
      ])
    );
    const destroyResults = await Promise.allSettled(
      publicIds.map((publicId) => deleteCloudinaryImage(publicId))
    );

    const failedDeletion = destroyResults.find(
      (result) => result.status === "rejected"
    );

    if (failedDeletion) {
      console.error(
        "Error deleting expired vehicle images from Cloudinary",
        failedDeletion
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    if (vehicleIdsToDelete.length > 0) {
      await tx.vehicle.deleteMany({
        where: {
          id: {
            in: vehicleIdsToDelete,
          },
          deletedAt: {
            not: null,
          },
        },
      });
    }

    await tx.vehicleRestorePoint.deleteMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    });
  });
}
