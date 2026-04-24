import {
  parseAdminUserPayload,
  parsePasswordResetPayload,
  serializeAdminUser,
  toAdminAuthEmail,
  validateAdminUserPayload,
  validatePasswordResetPayload,
} from "../_shared/admin-users.ts";
import { getFunctionPathParts, handleOptions, json } from "../_shared/http.ts";
import { authenticateAdminRequest } from "../_shared/supabase.ts";

const adminUserSelect =
  "id, auth_user_id, name, username, email, role, is_active, created_at, updated_at";

async function createAdminUser(request: Request) {
  const auth = await authenticateAdminRequest(request, ["SUPERADMIN"]);

  if (auth instanceof Response) {
    return auth;
  }

  const payload = parseAdminUserPayload(await request.json().catch(() => null));
  const fieldErrors = validateAdminUserPayload(payload);

  if (Object.keys(fieldErrors).length > 0) {
    return json(
      {
        success: false,
        message: "Revisa los datos del nuevo gestor.",
        fieldErrors,
      },
      { status: 400 }
    );
  }

  const email = toAdminAuthEmail(payload.username);
  const { adminClient } = auth;

  const { data: existingByUsername } = await adminClient
    .from("admin_users")
    .select("id")
    .eq("username", payload.username)
    .maybeSingle();

  if (existingByUsername) {
    return json(
      {
        success: false,
        message: "Ese usuario ya existe.",
        fieldErrors: { username: "Ese usuario ya existe." },
      },
      { status: 409 }
    );
  }

  const { data: authResult, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        name: payload.name,
        username: payload.username,
      },
    });

  if (authError || !authResult.user) {
    return json(
      {
        success: false,
        message: "No pudimos crear el usuario gestor en este momento.",
      },
      { status: 400 }
    );
  }

  const { data: createdUser, error: insertError } = await adminClient
    .from("admin_users")
    .insert({
      auth_user_id: authResult.user.id,
      name: payload.name,
      username: payload.username,
      email,
      role: "GESTOR",
      is_active: true,
    })
    .select(adminUserSelect)
    .single();

  if (insertError || !createdUser) {
    await adminClient.auth.admin.deleteUser(authResult.user.id);

    return json(
      {
        success: false,
        message: "No pudimos crear el usuario gestor en este momento.",
      },
      { status: 400 }
    );
  }

  return json(
    {
      success: true,
      user: serializeAdminUser(createdUser),
      message: "Usuario gestor creado correctamente.",
    },
    { status: 201 }
  );
}

async function deleteAdminUser(request: Request, userId: string) {
  const auth = await authenticateAdminRequest(request, ["SUPERADMIN"]);

  if (auth instanceof Response) {
    return auth;
  }

  if (!userId) {
    return json(
      { success: false, message: "Falta el usuario a eliminar." },
      { status: 400 }
    );
  }

  const { adminClient, admin } = auth;
  const { data: targetUser, error: targetError } = await adminClient
    .from("admin_users")
    .select(adminUserSelect)
    .eq("id", userId)
    .maybeSingle();

  if (targetError || !targetUser) {
    return json(
      { success: false, message: "No encontramos ese usuario." },
      { status: 404 }
    );
  }

  if (targetUser.id === admin.id) {
    return json(
      { success: false, message: "No puedes eliminar tu propio acceso." },
      { status: 400 }
    );
  }

  if (targetUser.role !== "GESTOR") {
    return json(
      { success: false, message: "Solo se pueden eliminar usuarios gestores." },
      { status: 400 }
    );
  }

  const { error: updateError } = await adminClient
    .from("admin_users")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetUser.id);

  if (updateError) {
    return json(
      {
        success: false,
        message: "No pudimos eliminar el usuario gestor en este momento.",
      },
      { status: 400 }
    );
  }

  if (targetUser.auth_user_id) {
    await adminClient.auth.admin.deleteUser(targetUser.auth_user_id);
  }

  return json({
    success: true,
    message: "Acceso gestor eliminado correctamente.",
  });
}

async function resetPassword(request: Request, userId: string) {
  const auth = await authenticateAdminRequest(request, ["SUPERADMIN"]);

  if (auth instanceof Response) {
    return auth;
  }

  const payload = parsePasswordResetPayload(await request.json().catch(() => null));
  const fieldErrors = validatePasswordResetPayload(payload);

  if (Object.keys(fieldErrors).length > 0) {
    return json(
      {
        success: false,
        message: "Revisa la nueva contrasena.",
        fieldErrors,
      },
      { status: 400 }
    );
  }

  const { adminClient, admin } = auth;
  const { data: targetUser, error: targetError } = await adminClient
    .from("admin_users")
    .select(adminUserSelect)
    .eq("id", userId)
    .maybeSingle();

  if (targetError || !targetUser) {
    return json(
      { success: false, message: "No encontramos ese usuario." },
      { status: 404 }
    );
  }

  if (targetUser.id === admin.id) {
    return json(
      { success: false, message: "No puedes resetear tu propia contrasena desde aqui." },
      { status: 400 }
    );
  }

  if (targetUser.role !== "GESTOR" || !targetUser.auth_user_id) {
    return json(
      {
        success: false,
        message: "Solo se puede resetear la contrasena de gestores activos.",
      },
      { status: 400 }
    );
  }

  const { error: passwordError } = await adminClient.auth.admin.updateUserById(
    targetUser.auth_user_id,
    {
      password: payload.password,
    }
  );

  if (passwordError) {
    return json(
      {
        success: false,
        message: "No pudimos resetear la password del gestor en este momento.",
      },
      { status: 400 }
    );
  }

  const { data: refreshedUser, error: refreshError } = await adminClient
    .from("admin_users")
    .select(adminUserSelect)
    .eq("id", targetUser.id)
    .single();

  if (refreshError || !refreshedUser) {
    return json(
      {
        success: false,
        message: "La password se actualizo, pero no pudimos devolver el usuario.",
      },
      { status: 500 }
    );
  }

  return json({
    success: true,
    message: "Password actualizada correctamente.",
    user: serializeAdminUser(refreshedUser),
  });
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);

  if (optionsResponse) {
    return optionsResponse;
  }

  const pathParts = getFunctionPathParts(request, "admin-users");
  const [userId] = pathParts;

  if (request.method === "POST" && pathParts.length === 0) {
    return createAdminUser(request);
  }

  if (request.method === "DELETE" && pathParts.length === 1) {
    return deleteAdminUser(request, userId ?? "");
  }

  if (request.method === "PATCH" && pathParts.length === 1) {
    return resetPassword(request, userId ?? "");
  }

  return json(
    { success: false, message: "Metodo no soportado." },
    { status: 405 }
  );
});
