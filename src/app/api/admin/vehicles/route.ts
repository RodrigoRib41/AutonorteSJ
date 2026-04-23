import { Prisma } from "@prisma/client";

import { getPrismaClient } from "@/lib/prisma";
import { requireAdminApiAccess, vehicleManagerRoles } from "@/lib/admin-auth";
import { buildVehicleAuditLogData } from "@/lib/vehicle-audit";
import { revalidatePublicVehiclePages } from "@/lib/revalidation";
import {
  buildFeaturedVehicleLimitMessage,
  FeaturedVehicleLimitError,
  parseFeaturedReplacementVehicleId,
  replaceFeaturedVehicleIfNeeded,
} from "@/lib/vehicle-featured";
import {
  type VehicleItemResponse,
  type VehicleListResponse,
  parseVehiclePayload,
  serializeVehicle,
  validateVehiclePayload,
  vehicleWithImagesInclude,
} from "@/lib/vehicle-records";

export const runtime = "nodejs";

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

export async function GET() {
  const { response } = await requireAdminApiAccess(vehicleManagerRoles);

  if (response) {
    return response;
  }

  try {
    const vehicles = await getPrismaClient().vehicle.findMany({
      include: vehicleWithImagesInclude,
      where: {
        deletedAt: null,
      },
      orderBy: [{ destacado: "desc" }, { updatedAt: "desc" }],
    });

    return Response.json(
      {
        success: true,
        vehicles: vehicles.map(serializeVehicle),
      } satisfies VehicleListResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error listing vehicles", error);

    return Response.json(
      {
        success: false,
        message: "No pudimos cargar los vehiculos en este momento.",
      } satisfies VehicleListResponse,
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    const vehicle = await getPrismaClient().$transaction(async (tx) => {
      await replaceFeaturedVehicleIfNeeded({
        tx,
        admin,
        shouldBeFeatured: payload.destacado,
        replacementVehicleId: featuredReplacementVehicleId,
        summary: "Se quito de destacados para publicar otra unidad destacada.",
      });

      const createdVehicle = await tx.vehicle.create({
        data: {
          ...payload,
          createdByUserId: admin.id,
          updatedByUserId: admin.id,
        },
        include: vehicleWithImagesInclude,
      });

      await tx.vehicleAuditLog.create({
        data: buildVehicleAuditLogData("CREATE", admin, createdVehicle),
      });

      return createdVehicle;
    });

    revalidatePublicVehiclePages(vehicle.id);

    return Response.json(
      {
        success: true,
        message: "Vehículo creado correctamente.",
        vehicle: serializeVehicle(vehicle),
      } satisfies VehicleItemResponse,
      { status: 201 }
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

    console.error("Error creating vehicle", error);

    const duplicatedVehicle =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002";

    return Response.json(
      {
        success: false,
        message: duplicatedVehicle
          ? "Ya existe un registro con esos datos clave."
          : getVehiclePersistenceErrorMessage(error) ??
            "No pudimos guardar el vehículo en este momento.",
      } satisfies VehicleItemResponse,
      { status: duplicatedVehicle ? 409 : 500 }
    );
  }
}
