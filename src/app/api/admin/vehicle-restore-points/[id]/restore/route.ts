import { getPrismaClient } from "@/lib/prisma";
import { requireAdminApiAccess, vehicleManagerRoles } from "@/lib/admin-auth";
import { buildVehicleAuditLogData } from "@/lib/vehicle-audit";
import { revalidatePublicVehiclePages } from "@/lib/revalidation";
import {
  purgeExpiredVehicleRestorePoints,
  restoreVehicleFromSnapshot,
  type VehicleRestoreResponse,
} from "@/lib/vehicle-restore-points";

export const runtime = "nodejs";

type VehicleRestoreRouteProps = {
  params: Promise<{ id: string }>;
};

type RestoreResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      status: number;
      message: string;
    };

export async function POST(
  _request: Request,
  { params }: VehicleRestoreRouteProps
) {
  const { admin, response } = await requireAdminApiAccess(vehicleManagerRoles);

  if (response) {
    return response;
  }

  if (!admin) {
    return Response.json(
      { success: false, message: "No autorizado." } satisfies VehicleRestoreResponse,
      { status: 401 }
    );
  }

  const { id } = await params;
  const now = new Date();

  try {
    await purgeExpiredVehicleRestorePoints(now);

    const prisma = getPrismaClient();
    let restoredVehicleId: string | null = null;
    const result = await prisma.$transaction<RestoreResult>(async (tx) => {
      const restorePoint = await tx.vehicleRestorePoint.findUnique({
        include: {
          vehicle: {
            select: {
              deletedAt: true,
            },
          },
        },
        where: {
          id,
        },
      });

      if (!restorePoint) {
        return {
          success: false,
          status: 404,
          message: "Este punto de restauracion ya no esta disponible.",
        };
      }

      if (restorePoint.restoredAt) {
        return {
          success: false,
          status: 409,
          message: "Este punto de restauracion ya fue usado.",
        };
      }

      if (restorePoint.expiresAt <= now) {
        return {
          success: false,
          status: 410,
          message: "Este punto de restauracion ya vencio.",
        };
      }

      if (restorePoint.action === "UPDATE" && restorePoint.vehicle.deletedAt) {
        return {
          success: false,
          status: 409,
          message:
            "Esta unidad esta en papelera. Restaura primero la baja para volver a editar su historial.",
        };
      }

      const restoredVehicle = await restoreVehicleFromSnapshot(
        tx,
        restorePoint,
        admin
      );
      restoredVehicleId = restoredVehicle.id;

      await tx.vehicleRestorePoint.update({
        where: {
          id: restorePoint.id,
        },
        data: {
          restoredAt: now,
          restoredByUserId: admin.id,
          restoredByName: admin.name,
          restoredByEmail: admin.username,
        },
      });

      await tx.vehicleAuditLog.create({
        data: buildVehicleAuditLogData("RESTORE", admin, restoredVehicle),
      });

      return {
        success: true,
        message: "Vehiculo restaurado correctamente.",
      };
    });

    if (!result.success) {
      return Response.json(
        {
          success: false,
          message: result.message,
        } satisfies VehicleRestoreResponse,
        { status: result.status }
      );
    }

    revalidatePublicVehiclePages(restoredVehicleId ?? undefined);

    return Response.json(
      {
        success: true,
        message: result.message,
      } satisfies VehicleRestoreResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error restoring vehicle", error);

    return Response.json(
      {
        success: false,
        message: "No pudimos restaurar el vehiculo en este momento.",
      } satisfies VehicleRestoreResponse,
      { status: 500 }
    );
  }
}
