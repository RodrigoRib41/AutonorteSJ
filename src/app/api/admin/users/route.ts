import { Prisma } from "@prisma/client";

import {
  adminUserSelect,
  type AdminUserItemResponse,
  type AdminUsersListResponse,
  parseAdminUserPayload,
  serializeAdminUser,
  validateAdminUserPayload,
} from "@/lib/admin-users";
import { getPrismaClient } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { requireAdminApiAccess, superadminOnlyRoles } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  const { response } = await requireAdminApiAccess(superadminOnlyRoles);

  if (response) {
    return response;
  }

  try {
    const users = await getPrismaClient().adminUser.findMany({
      select: adminUserSelect,
      orderBy: [{ role: "asc" }, { name: "asc" }, { createdAt: "asc" }],
    });

    return Response.json(
      {
        success: true,
        users: users.map(serializeAdminUser),
      } satisfies AdminUsersListResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error listing admin users", error);

    return Response.json(
      {
        success: false,
        message: "No pudimos cargar los usuarios administradores.",
      } satisfies AdminUsersListResponse,
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { response } = await requireAdminApiAccess(superadminOnlyRoles);

  if (response) {
    return response;
  }

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return Response.json(
      {
        success: false,
        message: "No pudimos interpretar los datos enviados.",
      } satisfies AdminUserItemResponse,
      { status: 400 }
    );
  }

  const payload = parseAdminUserPayload(rawBody);
  const fieldErrors = validateAdminUserPayload(payload);

  if (Object.keys(fieldErrors).length > 0) {
    return Response.json(
      {
        success: false,
        message: "Revisa los campos obligatorios e intenta nuevamente.",
        fieldErrors,
      } satisfies AdminUserItemResponse,
      { status: 400 }
    );
  }

  try {
    const user = await getPrismaClient().adminUser.create({
      data: {
        name: payload.name,
        username: payload.username,
        email: null,
        passwordHash: await hashPassword(payload.password),
        role: "GESTOR",
      },
      select: adminUserSelect,
    });

    return Response.json(
      {
        success: true,
        user: serializeAdminUser(user),
        message: "Usuario gestor creado correctamente.",
      } satisfies AdminUserItemResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin user", error);

    const duplicatedUsername =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002";

    return Response.json(
      {
        success: false,
        message: duplicatedUsername
          ? "Ya existe un usuario con ese nombre de usuario."
          : "No pudimos crear el usuario gestor.",
      } satisfies AdminUserItemResponse,
      { status: duplicatedUsername ? 409 : 500 }
    );
  }
}
