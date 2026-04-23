import type { Prisma } from "@prisma/client";

import type { AuthenticatedAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";
import { buildVehicleAuditLogData } from "@/lib/vehicle-audit";
import { buildVehicleRestorePointData } from "@/lib/vehicle-restore-points";
import {
  MAX_FEATURED_VEHICLES,
  type FeaturedVehicleOption,
  vehicleWithImagesInclude,
} from "@/lib/vehicle-records";

const featuredVehicleOptionSelect = {
  id: true,
  marca: true,
  modelo: true,
  anio: true,
} satisfies Prisma.VehicleSelect;

type FeaturedVehicleClient =
  | ReturnType<typeof getPrismaClient>
  | Prisma.TransactionClient;

export class FeaturedVehicleLimitError extends Error {
  constructor(readonly featuredVehicles: FeaturedVehicleOption[]) {
    super("Featured vehicle limit reached.");
    this.name = "FeaturedVehicleLimitError";
  }
}

function getFeaturedVehicleWhere(
  excludeVehicleId?: string
): Prisma.VehicleWhereInput {
  return {
    destacado: true,
    deletedAt: null,
    ...(excludeVehicleId ? { id: { not: excludeVehicleId } } : {}),
  };
}

export function parseFeaturedReplacementVehicleId(input: unknown) {
  const data =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const replacementId = data.featuredReplacementVehicleId;

  return typeof replacementId === "string" && replacementId.trim()
    ? replacementId.trim()
    : null;
}

export async function getFeaturedVehicleReplacementOptions(
  excludeVehicleId?: string,
  client: FeaturedVehicleClient = getPrismaClient()
) {
  return client.vehicle.findMany({
    select: featuredVehicleOptionSelect,
    where: getFeaturedVehicleWhere(excludeVehicleId),
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    take: MAX_FEATURED_VEHICLES,
  });
}

export function buildFeaturedVehicleLimitMessage() {
  return `Solo podes tener ${MAX_FEATURED_VEHICLES} vehiculos destacados. Elegi cual quitar de destacados para continuar.`;
}

export async function replaceFeaturedVehicleIfNeeded({
  tx,
  admin,
  shouldBeFeatured,
  currentVehicleId,
  currentVehicleIsFeatured = false,
  replacementVehicleId,
  summary,
  now = new Date(),
}: {
  tx: Prisma.TransactionClient;
  admin: AuthenticatedAdmin;
  shouldBeFeatured: boolean;
  currentVehicleId?: string;
  currentVehicleIsFeatured?: boolean;
  replacementVehicleId: string | null;
  summary: string;
  now?: Date;
}) {
  if (!shouldBeFeatured || currentVehicleIsFeatured) {
    return null;
  }

  const featuredVehicles = await getFeaturedVehicleReplacementOptions(
    currentVehicleId,
    tx
  );

  if (featuredVehicles.length < MAX_FEATURED_VEHICLES) {
    return null;
  }

  if (
    !replacementVehicleId ||
    !featuredVehicles.some((vehicle) => vehicle.id === replacementVehicleId)
  ) {
    throw new FeaturedVehicleLimitError(featuredVehicles);
  }

  const vehicleToReplace = await tx.vehicle.findFirst({
    include: vehicleWithImagesInclude,
    where: {
      ...getFeaturedVehicleWhere(currentVehicleId),
      id: replacementVehicleId,
    },
  });

  if (!vehicleToReplace) {
    throw new FeaturedVehicleLimitError(featuredVehicles);
  }

  await tx.vehicleRestorePoint.create({
    data: buildVehicleRestorePointData(
      "UPDATE",
      admin,
      vehicleToReplace,
      now,
      summary
    ),
  });

  const replacedVehicle = await tx.vehicle.update({
    include: vehicleWithImagesInclude,
    where: {
      id: replacementVehicleId,
    },
    data: {
      destacado: false,
      updatedByUserId: admin.id,
    },
  });

  await tx.vehicleAuditLog.create({
    data: buildVehicleAuditLogData("UPDATE", admin, replacedVehicle),
  });

  return replacedVehicle;
}
