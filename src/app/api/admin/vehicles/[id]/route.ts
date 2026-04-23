import { getPrismaClient } from "@/lib/prisma";
import { requireAdminApiAccess, vehicleManagerRoles } from "@/lib/admin-auth";
import { revalidatePublicVehiclePages } from "@/lib/revalidation";
import {
  buildFeaturedVehicleLimitMessage,
  FeaturedVehicleLimitError,
  parseFeaturedReplacementVehicleId,
  replaceFeaturedVehicleIfNeeded,
} from "@/lib/vehicle-featured";
import {
  buildVehiclePayloadChangeSummary,
  buildVehicleRestorePointData,
} from "@/lib/vehicle-restore-points";
import { buildVehicleAuditLogData } from "@/lib/vehicle-audit";
import { moveVehiclesToTrash } from "@/lib/vehicle-trash";
import {
  type VehicleItemResponse,
  parseVehiclePayload,
  serializeVehicle,
  validateVehiclePayload,
  vehicleWithImagesInclude,
} from "@/lib/vehicle-records";

export const runtime = "nodejs";

type VehicleAdminRouteProps = {
  params: Promise<{ id: string }>;
};

function getVehiclePersistenceErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (
    message.includes("Unknown argument `condition`") ||
    message.includes("Unknown argument `category`") ||
    message.includes("Unknown argument `promotionalPrice`") ||
    message.includes("The column") ||
    message.includes("does not exist")
  ) {
    return "El servidor necesita reiniciarse para tomar los últimos cambios de Prisma. Reinicia `npm run dev` e intenta nuevamente.";
  }

  return null;
}

export async function GET(
  _request: Request,
  { params }: VehicleAdminRouteProps
) {
  const { response } = await requireAdminApiAccess(vehicleManagerRoles);

  if (response) {
    return response;
  }

  const { id } = await params;

  try {
    const vehicle = await getPrismaClient().vehicle.findFirst({
      include: vehicleWithImagesInclude,
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!vehicle) {
      return Response.json(
        {
          success: false,
          message: "Vehículo no encontrado.",
        } satisfies VehicleItemResponse,
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        vehicle: serializeVehicle(vehicle),
      } satisfies VehicleItemResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error loading vehicle", error);

    return Response.json(
      {
        success: false,
        message: "No pudimos cargar el vehículo.",
      } satisfies VehicleItemResponse,
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: VehicleAdminRouteProps
) {
  const { admin, response } = await requireAdminApiAccess(vehicleManagerRoles);

  if (response) {
    return response;
  }

  if (!admin) {
    return Response.json(
      { success: false, message: "No autorizado." } satisfies VehicleItemResponse,
      { status: 401 }
    );
  }

  const { id } = await params;

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return Response.json(
      {
        success: false,
        message: "No pudimos interpretar los datos enviados.",
      } satisfies VehicleItemResponse,
      { status: 400 }
    );
  }

  const payload = parseVehiclePayload(rawBody);
  const featuredReplacementVehicleId =
    parseFeaturedReplacementVehicleId(rawBody);
  const fieldErrors = validateVehiclePayload(payload);

  if (Object.keys(fieldErrors).length > 0) {
    return Response.json(
      {
        success: false,
        message: "Revisa los campos obligatorios e intenta nuevamente.",
        fieldErrors,
      } satisfies VehicleItemResponse,
      { status: 400 }
    );
  }

  try {
    const existingVehicle = await getPrismaClient().vehicle.findFirst({
      include: vehicleWithImagesInclude,
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingVehicle) {
      return Response.json(
        {
          success: false,
          message: "Vehículo no encontrado.",
        } satisfies VehicleItemResponse,
        { status: 404 }
      );
    }

    const vehicle = await getPrismaClient().$transaction(async (tx) => {
      await tx.vehicleRestorePoint.create({
        data: buildVehicleRestorePointData(
          "UPDATE",
          admin,
          existingVehicle,
          new Date(),
          buildVehiclePayloadChangeSummary(existingVehicle, payload)
        ),
      });

      await replaceFeaturedVehicleIfNeeded({
        tx,
        admin,
        shouldBeFeatured: payload.destacado,
        currentVehicleId: existingVehicle.id,
        currentVehicleIsFeatured: existingVehicle.destacado,
        replacementVehicleId: featuredReplacementVehicleId,
        summary: `Se quito de destacados para destacar ${payload.marca} ${payload.modelo}.`,
      });

      const updatedVehicle = await tx.vehicle.update({
        include: vehicleWithImagesInclude,
        where: {
          id,
        },
        data: {
          ...payload,
          updatedByUserId: admin.id,
        },
      });

      await tx.vehicleAuditLog.create({
        data: buildVehicleAuditLogData("UPDATE", admin, updatedVehicle),
      });

      return updatedVehicle;
    });

    revalidatePublicVehiclePages(vehicle.id);

    return Response.json(
      {
        success: true,
        message: "Vehículo actualizado correctamente.",
        vehicle: serializeVehicle(vehicle),
      } satisfies VehicleItemResponse,
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof FeaturedVehicleLimitError) {
      return Response.json(
        {
          success: false,
          code: "FEATURED_LIMIT_REACHED",
          message: buildFeaturedVehicleLimitMessage(),
          featuredVehicles: error.featuredVehicles,
        } satisfies VehicleItemResponse,
        { status: 409 }
      );
    }

    console.error("Error updating vehicle", error);

    return Response.json(
      {
        success: false,
        message:
          getVehiclePersistenceErrorMessage(error) ??
          "No pudimos actualizar el vehículo.",
      } satisfies VehicleItemResponse,
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: VehicleAdminRouteProps
) {
  const { admin, response } = await requireAdminApiAccess(vehicleManagerRoles);

  if (response) {
    return response;
  }

  if (!admin) {
    return Response.json(
      { success: false, message: "No autorizado." } satisfies VehicleItemResponse,
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const deletedVehicles = await moveVehiclesToTrash([id], admin);

    if (deletedVehicles.length === 0) {
      return Response.json(
        {
          success: false,
          message: "Vehículo no encontrado.",
        } satisfies VehicleItemResponse,
        { status: 404 }
      );
    }

    revalidatePublicVehiclePages(id);

    return Response.json(
      {
        success: true,
        message:
          "Vehículo movido a papelera. Podés restaurarlo durante los próximos 7 días.",
      } satisfies VehicleItemResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting vehicle", error);

    return Response.json(
      {
        success: false,
        message: "No pudimos eliminar el vehículo.",
      } satisfies VehicleItemResponse,
      { status: 500 }
    );
  }
}
