import type { AuthenticatedAdmin } from "@/lib/admin-auth";
import { buildVehicleAuditLogData } from "@/lib/vehicle-audit";
import { getPrismaClient } from "@/lib/prisma";
import { buildVehicleRestorePointData } from "@/lib/vehicle-restore-points";
import { vehicleWithImagesInclude } from "@/lib/vehicle-records";

export function normalizeVehicleIds(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return Array.from(
    new Set(
      input
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
    )
  );
}

export async function moveVehiclesToTrash(
  vehicleIds: string[],
  admin: AuthenticatedAdmin
) {
  const prisma = getPrismaClient();
  const ids = normalizeVehicleIds(vehicleIds);

  if (ids.length === 0) {
    return [];
  }

  const vehicles = await prisma.vehicle.findMany({
    include: vehicleWithImagesInclude,
    where: {
      id: {
        in: ids,
      },
      deletedAt: null,
    },
  });

  if (vehicles.length === 0) {
    return [];
  }

  const now = new Date();
  const deletedVehicleIds = vehicles.map((vehicle) => vehicle.id);

  await prisma.$transaction(async (tx) => {
    for (const vehicle of vehicles) {
      await tx.vehicleRestorePoint.create({
        data: buildVehicleRestorePointData(
          "DELETE",
          admin,
          vehicle,
          now,
          "Se elimino el vehiculo completo."
        ),
      });

      await tx.vehicleAuditLog.create({
        data: buildVehicleAuditLogData("DELETE", admin, vehicle),
      });
    }

    await tx.vehicle.updateMany({
      where: {
        id: {
          in: deletedVehicleIds,
        },
        deletedAt: null,
      },
      data: {
        deletedAt: now,
        deletedByUserId: admin.id,
        updatedByUserId: admin.id,
      },
    });
  });

  return vehicles;
}
