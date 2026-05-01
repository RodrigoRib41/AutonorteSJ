import { getPrismaClient } from "@/lib/prisma";
import {
  defaultVehicleSort,
  getVehicleOrderBy,
  getVehicleWhereInput,
  type VehicleFilterValues,
} from "@/lib/vehicle-filters";
import {
  vehicleWithImagesInclude,
  type VehiclePersisted,
} from "@/lib/vehicle-records";
import {
  vehicleAuditLogInclude,
  type VehicleAuditLogRecord,
} from "@/lib/vehicle-audit";

const activeVehicleWhere = {
  deletedAt: null,
};

export async function getVehicles(
  filters?: VehicleFilterValues
): Promise<VehiclePersisted[]> {
  return getPaginatedVehicles(filters);
}

export async function getPaginatedVehicles(
  filters?: VehicleFilterValues,
  options?: {
    skip?: number;
    take?: number;
  }
): Promise<VehiclePersisted[]> {
  return getPrismaClient().vehicle.findMany({
    include: vehicleWithImagesInclude,
    where: filters ? getVehicleWhereInput(filters) : activeVehicleWhere,
    orderBy: getVehicleOrderBy(filters?.sort ?? defaultVehicleSort),
    ...(options?.skip ? { skip: options.skip } : {}),
    ...(options?.take ? { take: options.take } : {}),
  });
}

export async function getFeaturedVehicles(
  limit = 3
): Promise<VehiclePersisted[]> {
  return getPrismaClient().vehicle.findMany({
    include: vehicleWithImagesInclude,
    where: {
      destacado: true,
      deletedAt: null,
    },
    orderBy: [{ updatedAt: "desc" }],
    take: limit,
  });
}

export async function getVehicleById(
  id: string
): Promise<VehiclePersisted | null> {
  return getPrismaClient().vehicle.findFirst({
    include: vehicleWithImagesInclude,
    where: {
      id,
      deletedAt: null,
    },
  });
}

export async function getVehiclesByIds(ids: string[]): Promise<VehiclePersisted[]> {
  if (ids.length === 0) {
    return [];
  }

  const vehicles = await getPrismaClient().vehicle.findMany({
    include: vehicleWithImagesInclude,
    where: {
      id: {
        in: ids,
      },
      deletedAt: null,
    },
  });
  const order = new Map(ids.map((id, index) => [id, index]));

  return vehicles.sort(
    (firstVehicle, secondVehicle) =>
      (order.get(firstVehicle.id) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(secondVehicle.id) ?? Number.MAX_SAFE_INTEGER)
  );
}

export async function getVehicleCount(filters?: VehicleFilterValues) {
  return getPrismaClient().vehicle.count({
    where: filters ? getVehicleWhereInput(filters) : activeVehicleWhere,
  });
}

export async function getVehicleBrands() {
  const vehicles = await getPrismaClient().vehicle.findMany({
    select: {
      marca: true,
    },
    where: activeVehicleWhere,
    orderBy: {
      marca: "asc",
    },
  });

  return Array.from(
    new Set(
      vehicles
        .map((vehicle) => vehicle.marca.trim())
        .filter((marca) => marca.length > 0)
    )
  );
}

export async function getRecentVehicleAuditLogs(
  limit = 8
): Promise<VehicleAuditLogRecord[]> {
  return getPrismaClient().vehicleAuditLog.findMany({
    include: vehicleAuditLogInclude,
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}
