import { getPrismaClient } from "@/lib/prisma";
import { requireAdminApiAccess, vehicleManagerRoles } from "@/lib/admin-auth";
import { buildVehicleAuditLogData } from "@/lib/vehicle-audit";
import { revalidatePublicVehiclePages } from "@/lib/revalidation";
import {
  buildVehicleImagesDeletedSummary,
  buildVehicleRestorePointData,
} from "@/lib/vehicle-restore-points";
import {
  type VehicleImageDeleteResponse,
  serializeVehicleImage,
  vehicleWithImagesInclude,
} from "@/lib/vehicle-records";

export const runtime = "nodejs";

type VehicleImageRouteProps = {
  params: Promise<{ imageId: string }>;
};

export async function DELETE(
  _request: Request,
  { params }: VehicleImageRouteProps
) {
  const { admin, response } = await requireAdminApiAccess(vehicleManagerRoles);

  if (response) {
    return response;
  }

  if (!admin) {
    return Response.json(
      {
        success: false,
        message: "No autorizado.",
      } satisfies VehicleImageDeleteResponse,
      { status: 401 }
    );
  }

  const { imageId } = await params;

  try {
    const prisma = getPrismaClient();
    const image = await prisma.vehicleImage.findUnique({
      include: {
        vehicle: {
          select: {
            id: true,
            marca: true,
            modelo: true,
          },
        },
      },
      where: {
        id: imageId,
      },
    });

    if (!image) {
      return Response.json(
        {
          success: false,
          message: "Imagen no encontrada.",
        } satisfies VehicleImageDeleteResponse,
        { status: 404 }
      );
    }

    const vehicle = await prisma.vehicle.findFirst({
      include: vehicleWithImagesInclude,
      where: {
        id: image.vehicleId,
        deletedAt: null,
      },
    });

    if (!vehicle) {
      return Response.json(
        {
          success: false,
          message: "Vehículo no encontrado.",
        } satisfies VehicleImageDeleteResponse,
        { status: 404 }
      );
    }

    const remainingImages = await prisma.$transaction(async (tx) => {
      await tx.vehicleRestorePoint.create({
        data: buildVehicleRestorePointData(
          "UPDATE",
          admin,
          vehicle,
          new Date(),
          buildVehicleImagesDeletedSummary(1)
        ),
      });

      await tx.vehicleImage.delete({
        where: {
          id: imageId,
        },
      });

      const imagesAfterDelete = await tx.vehicleImage.findMany({
        where: {
          vehicleId: image.vehicleId,
        },
        orderBy: {
          sortOrder: "asc",
        },
      });

      for (const [index, currentImage] of imagesAfterDelete.entries()) {
        const isPrimary = index === 0;

        if (
          currentImage.sortOrder !== index ||
          currentImage.isPrimary !== isPrimary
        ) {
          await tx.vehicleImage.update({
            where: {
              id: currentImage.id,
            },
            data: {
              sortOrder: index,
              isPrimary,
            },
          });
        }
      }

      await tx.vehicle.update({
        where: {
          id: image.vehicleId,
        },
        data: {
          updatedByUserId: admin.id,
        },
      });

      await tx.vehicleAuditLog.create({
        data: buildVehicleAuditLogData("UPDATE", admin, image.vehicle),
      });

      return tx.vehicleImage.findMany({
        where: {
          vehicleId: image.vehicleId,
        },
        orderBy: {
          sortOrder: "asc",
        },
      });
    });

    revalidatePublicVehiclePages(image.vehicleId);

    return Response.json(
      {
        success: true,
        deletedImageId: imageId,
        deletedImageIds: [imageId],
        message:
          "Imagen quitada correctamente. El cambio queda disponible en papelera por 7 dias.",
        images: remainingImages.map(serializeVehicleImage),
      } satisfies VehicleImageDeleteResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting vehicle image", error);

    return Response.json(
      {
        success: false,
        message: "No pudimos eliminar la imagen en este momento.",
      } satisfies VehicleImageDeleteResponse,
      { status: 500 }
    );
  }
}
