import {
  type InquiryResponse,
  type VehicleInquiryPayload,
  parseVehicleInquiryPayload,
  validateVehicleInquiry,
} from "@/lib/inquiry-payloads";
import { getPrismaClient } from "@/lib/prisma";

export const runtime = "nodejs";

type VehicleInquiryApiResponse = InquiryResponse<keyof VehicleInquiryPayload>;

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      {
        success: false,
        message:
          "El servidor todavia no tiene la base de datos configurada. Define DATABASE_URL para activar las consultas.",
      } satisfies VehicleInquiryApiResponse,
      { status: 500 }
    );
  }

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return Response.json(
      {
        success: false,
        message: "No pudimos interpretar la consulta enviada.",
      } satisfies VehicleInquiryApiResponse,
      { status: 400 }
    );
  }

  const payload = parseVehicleInquiryPayload(rawBody);
  const fieldErrors = validateVehicleInquiry(payload);

  if (Object.keys(fieldErrors).length > 0) {
    return Response.json(
      {
        success: false,
        message: "Revisa los campos obligatorios e intenta nuevamente.",
        fieldErrors,
      } satisfies VehicleInquiryApiResponse,
      { status: 400 }
    );
  }

  try {
    const prisma = getPrismaClient();

    await prisma.vehicleInquiry.create({
      data: payload,
    });

    return Response.json(
      {
        success: true,
        message: "Gracias por tu consulta. Te contactaremos a la brevedad.",
      } satisfies VehicleInquiryApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving vehicle inquiry", error);

    return Response.json(
      {
        success: false,
        message:
          "No pudimos guardar tu consulta en este momento. Intenta nuevamente.",
      } satisfies VehicleInquiryApiResponse,
      { status: 500 }
    );
  }
}
