import {
  type ContactInquiryPayload,
  type InquiryResponse,
  parseContactInquiryPayload,
  validateContactInquiry,
} from "@/lib/inquiry-payloads";
import { getPrismaClient } from "@/lib/prisma";

export const runtime = "nodejs";

type ContactInquiryApiResponse = InquiryResponse<keyof ContactInquiryPayload>;

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      {
        success: false,
        message:
          "El servidor todavia no tiene la base de datos configurada. Define DATABASE_URL para activar las consultas.",
      } satisfies ContactInquiryApiResponse,
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
      } satisfies ContactInquiryApiResponse,
      { status: 400 }
    );
  }

  const payload = parseContactInquiryPayload(rawBody);
  const fieldErrors = validateContactInquiry(payload);

  if (Object.keys(fieldErrors).length > 0) {
    return Response.json(
      {
        success: false,
        message: "Revisa los campos obligatorios e intenta nuevamente.",
        fieldErrors,
      } satisfies ContactInquiryApiResponse,
      { status: 400 }
    );
  }

  try {
    const prisma = getPrismaClient();

    await prisma.contactInquiry.create({
      data: payload,
    });

    return Response.json(
      {
        success: true,
        message: "Gracias por tu consulta. Te contactaremos a la brevedad.",
      } satisfies ContactInquiryApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving contact inquiry", error);

    return Response.json(
      {
        success: false,
        message:
          "No pudimos guardar tu consulta en este momento. Intenta nuevamente.",
      } satisfies ContactInquiryApiResponse,
      { status: 500 }
    );
  }
}
