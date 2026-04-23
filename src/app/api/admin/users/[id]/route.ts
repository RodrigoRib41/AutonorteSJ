import { Prisma } from "@prisma/client";

import {
  type AdminUserDeleteResponse,
  type AdminUserPasswordResetResponse,
  adminUserSelect,
  parseAdminUserPasswordResetPayload,
  serializeAdminUser,
  validateAdminUserPasswordResetPayload,
} from "@/lib/admin-users";
import { requireAdminApiAccess, superadminOnlyRoles } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/password";
import { getPrismaClient } from "@/lib/prisma";

export const runtime = "nodejs";

type AdminUserRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: AdminUserRouteContext) {
  const { admin, response } = await requireAdminApiAccess(superadminOnlyRoles);

  if (response) {
    return response;
  }

  const { id } = await context.params;

  if (!id) {
    return Response.json(
      {
        success: false,
        message: "Usuario administrador invalido.",
      } satisfies AdminUserPasswordResetResponse,
      { status: 400 }
    );
  }

  if (admin.id === id) {
    return Response.json(
      {
        success: false,
        message: "No podes resetear tu propia contrasena desde esta accion.",
      } satisfies AdminUserPasswordResetResponse,
      { status: 400 }
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
      } satisfies AdminUserPasswordResetResponse,
      { status: 400 }
    );
  }

  const payload = parseAdminUserPasswordResetPayload(rawBody);
  const fieldErrors = validateAdminUserPasswordResetPayload(payload);

  if (Object.keys(fieldErrors).length > 0) {
    return Response.json(
      {
        success: false,
        message: "Revisa la contrasena nueva e intenta nuevamente.",
        fieldErrors,
      } satisfies AdminUserPasswordResetResponse,
      { status: 400 }
    );
  }

  try {
    const prisma = getPrismaClient();
    const user = await prisma.adminUser.findUnique({
      where: {
        id,
      },
      select: adminUserSelect,
    });

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "El usuario administrador no existe.",
        } satisfies AdminUserPasswordResetResponse,
        { status: 404 }
      );
    }

    if (user.role !== "GESTOR") {
      return Response.json(
        {
          success: false,
          message: "Solo podes resetear la contrasena de usuarios gestores.",
        } satisfies AdminUserPasswordResetResponse,
        { status: 400 }
      );
    }

    const updatedUser = await prisma.adminUser.update({
      where: {
        id,
      },
      data: {
        passwordHash: await hashPassword(payload.password),
      },
      select: adminUserSelect,
    });

    return Response.json(
      {
        success: true,
        user: serializeAdminUser(updatedUser),
        message: `Contraseña de ${updatedUser.username ?? updatedUser.name} actualizada correctamente.`,
      } satisfies AdminUserPasswordResetResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resetting admin user password", error);

    const notFound =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025";

    return Response.json(
      {
        success: false,
        message: notFound
          ? "El usuario administrador no existe."
          : "No pudimos resetear la contrasena del usuario gestor.",
      } satisfies AdminUserPasswordResetResponse,
      { status: notFound ? 404 : 500 }
    );
  }
}

export async function DELETE(_request: Request, context: AdminUserRouteContext) {
  const { admin, response } = await requireAdminApiAccess(superadminOnlyRoles);

  if (response) {
    return response;
  }

  const { id } = await context.params;

  if (!id) {
    return Response.json(
      {
        success: false,
        message: "Usuario administrador invalido.",
      } satisfies AdminUserDeleteResponse,
      { status: 400 }
    );
  }

  if (admin.id === id) {
    return Response.json(
      {
        success: false,
        message: "No podes eliminar tu propio usuario.",
      } satisfies AdminUserDeleteResponse,
      { status: 400 }
    );
  }

  try {
    const prisma = getPrismaClient();
    const user = await prisma.adminUser.findUnique({
      where: {
        id,
      },
      select: adminUserSelect,
    });

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "El usuario administrador no existe.",
        } satisfies AdminUserDeleteResponse,
        { status: 404 }
      );
    }

    if (user.role !== "GESTOR") {
      return Response.json(
        {
          success: false,
          message: "Solo podes eliminar usuarios gestores.",
        } satisfies AdminUserDeleteResponse,
        { status: 400 }
      );
    }

    await prisma.adminUser.delete({
      where: {
        id,
      },
    });

    const deletedUser = serializeAdminUser(user);

    return Response.json(
      {
        success: true,
        message: `Usuario ${deletedUser.username} eliminado correctamente.`,
      } satisfies AdminUserDeleteResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting admin user", error);

    const notFound =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025";

    return Response.json(
      {
        success: false,
        message: notFound
          ? "El usuario administrador no existe."
          : "No pudimos eliminar el usuario gestor.",
      } satisfies AdminUserDeleteResponse,
      { status: notFound ? 404 : 500 }
    );
  }
}
