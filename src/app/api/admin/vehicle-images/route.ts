import { createHash, randomUUID } from "node:crypto";

import {
  deleteCloudinaryImage,
  isCloudinaryConfigured,
  uploadVehicleImageToCloudinary,
} from "@/lib/cloudinary";
import {
  getVehicleImagePublicId,
  validateVehicleImageBytes,
  validateVehicleImageFile,
} from "@/lib/cloudinary-images";
import { getPrismaClient } from "@/lib/prisma";
import { revalidatePublicVehiclePages } from "@/lib/revalidation";
import { requireAdminApiAccess, vehicleManagerRoles } from "@/lib/admin-auth";
import { buildVehicleAuditLogData } from "@/lib/vehicle-audit";
import {
  buildVehicleImagesAddedSummary,
  buildVehicleImagesDeletedSummary,
  buildVehicleImagesReorderedSummary,
  buildVehicleRestorePointData,
} from "@/lib/vehicle-restore-points";
import {
  getVehicleDisplayName,
  MAX_VEHICLE_IMAGES,
  type VehicleImageDeleteResponse,
  type VehicleImagesResponse,
  serializeVehicleImage,
  vehicleWithImagesInclude,
} from "@/lib/vehicle-records";

export const runtime = "nodejs";

function getVehicleImageContentHash(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function isCloudinaryDuplicateUploadError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  return message.includes("already exists") || message.includes("overwrite");
}

export async function POST(request: Request) {
  const { admin, response } = await requireAdminApiAccess(vehicleManagerRoles);

  if (response) {
    return response;
  }

  if (!admin) {
    return Response.json(
      { success: false, message: "No autorizado." } satisfies VehicleImagesResponse,
      { status: 401 }
    );
  }

  if (!isCloudinaryConfigured()) {
    return Response.json(
      {
        success: false,
        message:
          "Falta configurar la carga de imagenes. Revisa las variables de entorno.",
      } satisfies VehicleImagesResponse,
      { status: 500 }
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      {
        success: false,
        message: "No pudimos interpretar los archivos enviados.",
      } satisfies VehicleImagesResponse,
      { status: 400 }
    );
  }

  const vehicleIdEntry = formData.get("vehicleId");
  const vehicleId =
    typeof vehicleIdEntry === "string" ? vehicleIdEntry.trim() : "";
  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (!vehicleId) {
    return Response.json(
      {
        success: false,
        message: "Falta identificar el vehículo al que pertenecen las fotos.",
      } satisfies VehicleImagesResponse,
      { status: 400 }
    );
  }

  if (files.length === 0) {
    return Response.json(
      {
        success: false,
        message: "Selecciona al menos una imagen para subir.",
      } satisfies VehicleImagesResponse,
      { status: 400 }
    );
  }

  const invalidFileMessage = files
    .map((file) => validateVehicleImageFile(file))
    .find((message): message is string => Boolean(message));

  if (invalidFileMessage) {
    return Response.json(
      {
        success: false,
        message: invalidFileMessage,
      } satisfies VehicleImagesResponse,
      { status: 400 }
    );
  }

  try {
    const prisma = getPrismaClient();
    const vehicle = await prisma.vehicle.findFirst({
      include: vehicleWithImagesInclude,
      where: {
        id: vehicleId,
        deletedAt: null,
      },
    });

    if (!vehicle) {
      return Response.json(
        {
          success: false,
          message: "Vehículo no encontrado.",
        } satisfies VehicleImagesResponse,
        { status: 404 }
      );
    }

    const availableSlots = MAX_VEHICLE_IMAGES - vehicle.images.length;

    if (availableSlots <= 0) {
      return Response.json(
        {
          success: false,
          message: `Cada vehiculo puede tener hasta ${MAX_VEHICLE_IMAGES} imagenes.`,
        } satisfies VehicleImagesResponse,
        { status: 400 }
      );
    }

    if (files.length > availableSlots) {
      return Response.json(
        {
          success: false,
          message: `Podes subir ${availableSlots} imagenes mas para esta unidad.`,
        } satisfies VehicleImagesResponse,
        { status: 400 }
      );
    }

    const preparedFiles: Array<{
      buffer: Buffer;
      id: string;
      originalName: string;
      publicId: string;
    }> = [];
    const currentUploadHashes = new Map<string, string>();

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const invalidBytesMessage = validateVehicleImageBytes(buffer);

      if (invalidBytesMessage) {
        return Response.json(
          {
            success: false,
            message: invalidBytesMessage,
          } satisfies VehicleImagesResponse,
          { status: 400 }
        );
      }

      const sourceHash = getVehicleImageContentHash(buffer);
      const duplicateFileName = currentUploadHashes.get(sourceHash);

      if (duplicateFileName) {
        return Response.json(
          {
            success: false,
            message: `La imagen "${file.name}" ya esta en esta tanda como "${duplicateFileName}".`,
          } satisfies VehicleImagesResponse,
          { status: 400 }
        );
      }

      currentUploadHashes.set(sourceHash, file.name);

      const id = randomUUID();

      preparedFiles.push({
        buffer,
        id,
        originalName: file.name,
        publicId: getVehicleImagePublicId(vehicleId, sourceHash),
      });
    }

    const duplicateImages = await prisma.vehicleImage.findMany({
      select: {
        publicId: true,
      },
      where: {
        vehicleId,
        publicId: {
          in: preparedFiles.map((file) => file.publicId),
        },
      },
    });

    if (duplicateImages.length > 0) {
      const duplicatePublicIds = new Set(
        duplicateImages.map((image) => image.publicId)
      );
      const duplicateFile = preparedFiles.find((file) =>
        duplicatePublicIds.has(file.publicId)
      );

      return Response.json(
        {
          success: false,
          message: duplicateFile
            ? `La imagen "${duplicateFile.originalName}" ya esta cargada en este vehiculo.`
            : "Una de las imagenes seleccionadas ya esta cargada en este vehiculo.",
        } satisfies VehicleImagesResponse,
        { status: 409 }
      );
    }

    const uploadedAssets: Array<{
      id: string;
      publicId: string;
      assetId: string | null;
      width: number | null;
      height: number | null;
      format: string | null;
      bytes: number | null;
    }> = [];

    try {
      for (const preparedFile of preparedFiles) {
        const uploadResult = await uploadVehicleImageToCloudinary({
          buffer: preparedFile.buffer,
          publicId: preparedFile.publicId,
          vehicleId,
        });

        uploadedAssets.push({
          id: preparedFile.id,
          publicId: uploadResult.public_id,
          assetId: uploadResult.asset_id ?? null,
          width: uploadResult.width ?? null,
          height: uploadResult.height ?? null,
          format: uploadResult.format ?? null,
          bytes: uploadResult.bytes ?? null,
        });
      }

      const allImages = await prisma.$transaction(async (tx) => {
        await tx.vehicleRestorePoint.create({
          data: buildVehicleRestorePointData(
            "UPDATE",
            admin,
            vehicle,
            new Date(),
            buildVehicleImagesAddedSummary(uploadedAssets.length)
          ),
        });

        await Promise.all(
          uploadedAssets.map((asset, index) =>
            tx.vehicleImage.create({
              data: {
                id: asset.id,
                vehicleId,
                publicId: asset.publicId,
                assetId: asset.assetId,
                alt: getVehicleDisplayName(vehicle),
                sortOrder: vehicle.images.length + index,
                isPrimary: vehicle.images.length + index === 0,
                width: asset.width,
                height: asset.height,
                format: asset.format,
                bytes: asset.bytes,
              },
            })
          )
        );

        await tx.vehicle.update({
          where: {
            id: vehicleId,
          },
          data: {
            updatedByUserId: admin.id,
          },
        });

        await tx.vehicleAuditLog.create({
          data: buildVehicleAuditLogData("UPDATE", admin, vehicle),
        });

        return tx.vehicleImage.findMany({
          where: {
            vehicleId,
          },
          orderBy: {
            sortOrder: "asc",
          },
        });
      });

      revalidatePublicVehiclePages(vehicleId);

      return Response.json(
        {
          success: true,
          message: "Imágenes cargadas correctamente.",
          images: allImages.map(serializeVehicleImage),
          uploadedImages: allImages
            .slice(vehicle.images.length)
            .map(serializeVehicleImage),
        } satisfies VehicleImagesResponse,
        { status: 201 }
      );
    } catch (error) {
      console.error("Error uploading vehicle images", error);

      await Promise.allSettled(
        uploadedAssets.map((asset) => deleteCloudinaryImage(asset.publicId))
      );

      if (isCloudinaryDuplicateUploadError(error)) {
        return Response.json(
          {
            success: false,
            message:
              "Una de las imagenes seleccionadas ya existe en Cloudinary para este vehiculo.",
          } satisfies VehicleImagesResponse,
          { status: 409 }
        );
      }

      return Response.json(
        {
          success: false,
          message:
            "No pudimos subir las imagenes en este momento. Intenta nuevamente.",
        } satisfies VehicleImagesResponse,
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error preparing vehicle image upload", error);

    return Response.json(
      {
        success: false,
        message: "No pudimos preparar la carga de imagenes en este momento.",
      } satisfies VehicleImagesResponse,
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { admin, response } = await requireAdminApiAccess(vehicleManagerRoles);

  if (response) {
    return response;
  }

  if (!admin) {
    return Response.json(
      { success: false, message: "No autorizado." } satisfies VehicleImagesResponse,
      { status: 401 }
    );
  }

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return Response.json(
      {
        success: false,
        message: "No pudimos interpretar el nuevo orden de las imagenes.",
      } satisfies VehicleImagesResponse,
      { status: 400 }
    );
  }

  const data =
    rawBody && typeof rawBody === "object"
      ? (rawBody as {
          vehicleId?: unknown;
          orderedImageIds?: unknown;
        })
      : {};

  const vehicleId =
    typeof data.vehicleId === "string" ? data.vehicleId.trim() : "";
  const orderedImageIds = Array.isArray(data.orderedImageIds)
    ? data.orderedImageIds.filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0
      )
    : [];

  if (!vehicleId) {
    return Response.json(
      {
        success: false,
        message: "Falta identificar el vehículo al que pertenecen las fotos.",
      } satisfies VehicleImagesResponse,
      { status: 400 }
    );
  }

  try {
    const prisma = getPrismaClient();
    const vehicle = await prisma.vehicle.findFirst({
      include: vehicleWithImagesInclude,
      where: {
        id: vehicleId,
        deletedAt: null,
      },
    });

    if (!vehicle) {
      return Response.json(
        {
          success: false,
          message: "Vehículo no encontrado.",
        } satisfies VehicleImagesResponse,
        { status: 404 }
      );
    }

    const currentImageIds = vehicle.images.map((image) => image.id);

    if (orderedImageIds.length !== currentImageIds.length) {
      return Response.json(
        {
          success: false,
          message:
            "El nuevo orden no coincide con las imagenes actuales de la unidad.",
        } satisfies VehicleImagesResponse,
        { status: 400 }
      );
    }

    const uniqueIds = new Set(orderedImageIds);

    if (
      uniqueIds.size !== orderedImageIds.length ||
      orderedImageIds.some((imageId) => !currentImageIds.includes(imageId))
    ) {
      return Response.json(
        {
          success: false,
          message:
            "El nuevo orden incluye imagenes invalidas para este vehiculo.",
        } satisfies VehicleImagesResponse,
        { status: 400 }
      );
    }

    const reorderedImages = await prisma.$transaction(async (tx) => {
      await tx.vehicleRestorePoint.create({
        data: buildVehicleRestorePointData(
          "UPDATE",
          admin,
          vehicle,
          new Date(),
          buildVehicleImagesReorderedSummary()
        ),
      });

      for (const [index, imageId] of orderedImageIds.entries()) {
        await tx.vehicleImage.update({
          where: {
            id: imageId,
          },
          data: {
            sortOrder: index,
            isPrimary: index === 0,
          },
        });
      }

      await tx.vehicle.update({
        where: {
          id: vehicleId,
        },
        data: {
          updatedByUserId: admin.id,
        },
      });

      await tx.vehicleAuditLog.create({
        data: buildVehicleAuditLogData("UPDATE", admin, vehicle),
      });

      return tx.vehicleImage.findMany({
        where: {
          vehicleId,
        },
        orderBy: {
          sortOrder: "asc",
        },
      });
    });

    revalidatePublicVehiclePages(vehicleId);

    return Response.json(
      {
        success: true,
        message: "Orden de imagenes actualizado correctamente.",
        images: reorderedImages.map(serializeVehicleImage),
      } satisfies VehicleImagesResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error reordering vehicle images", error);

    return Response.json(
      {
        success: false,
        message:
          "No pudimos actualizar el orden de las imagenes en este momento.",
      } satisfies VehicleImagesResponse,
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return Response.json(
      {
        success: false,
        message: "No pudimos interpretar las imagenes a eliminar.",
      } satisfies VehicleImageDeleteResponse,
      { status: 400 }
    );
  }

  const data =
    rawBody && typeof rawBody === "object"
      ? (rawBody as {
          vehicleId?: unknown;
          imageIds?: unknown;
        })
      : {};
  const vehicleId =
    typeof data.vehicleId === "string" ? data.vehicleId.trim() : "";
  const imageIds = Array.isArray(data.imageIds)
    ? data.imageIds.filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0
      )
    : [];
  const uniqueImageIds = Array.from(new Set(imageIds));

  if (!vehicleId || uniqueImageIds.length === 0) {
    return Response.json(
      {
        success: false,
        message: "Selecciona al menos una imagen valida para eliminar.",
      } satisfies VehicleImageDeleteResponse,
      { status: 400 }
    );
  }

  try {
    const prisma = getPrismaClient();
    const vehicle = await prisma.vehicle.findFirst({
      include: vehicleWithImagesInclude,
      where: {
        id: vehicleId,
        deletedAt: null,
      },
    });

    if (!vehicle) {
      return Response.json(
        {
          success: false,
          message: "Vehiculo no encontrado.",
        } satisfies VehicleImageDeleteResponse,
        { status: 404 }
      );
    }

    const currentImageIds = new Set(vehicle.images.map((image) => image.id));

    if (uniqueImageIds.some((imageId) => !currentImageIds.has(imageId))) {
      return Response.json(
        {
          success: false,
          message: "La seleccion incluye imagenes invalidas para este vehiculo.",
        } satisfies VehicleImageDeleteResponse,
        { status: 400 }
      );
    }

    const remainingImages = await prisma.$transaction(async (tx) => {
      await tx.vehicleRestorePoint.create({
        data: buildVehicleRestorePointData(
          "UPDATE",
          admin,
          vehicle,
          new Date(),
          buildVehicleImagesDeletedSummary(uniqueImageIds.length)
        ),
      });

      await tx.vehicleImage.deleteMany({
        where: {
          id: {
            in: uniqueImageIds,
          },
          vehicleId,
        },
      });

      const imagesAfterDelete = await tx.vehicleImage.findMany({
        where: {
          vehicleId,
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
          id: vehicleId,
        },
        data: {
          updatedByUserId: admin.id,
        },
      });

      await tx.vehicleAuditLog.create({
        data: buildVehicleAuditLogData("UPDATE", admin, vehicle),
      });

      return tx.vehicleImage.findMany({
        where: {
          vehicleId,
        },
        orderBy: {
          sortOrder: "asc",
        },
      });
    });

    revalidatePublicVehiclePages(vehicleId);

    return Response.json(
      {
        success: true,
        deletedImageIds: uniqueImageIds,
        deletedImageId: uniqueImageIds[0] ?? "",
        message:
          uniqueImageIds.length === 1
            ? "Imagen quitada correctamente. El cambio queda disponible en papelera por 7 dias."
            : "Imagenes quitadas correctamente. El cambio queda disponible en papelera por 7 dias.",
        images: remainingImages.map(serializeVehicleImage),
      } satisfies VehicleImageDeleteResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting vehicle images", error);

    return Response.json(
      {
        success: false,
        message: "No pudimos eliminar las imagenes en este momento.",
      } satisfies VehicleImageDeleteResponse,
      { status: 500 }
    );
  }
}
