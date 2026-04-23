"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";

export type LoginFormState = {
  error: string;
};

export async function authenticate(
  _previousState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const username = formData.get("username");
  const password = formData.get("password");

  if (!process.env.AUTH_SECRET) {
    return {
      error:
        "Falta configurar el acceso. Define AUTH_SECRET para continuar.",
    };
  }

  if (typeof username !== "string" || !username.trim()) {
    return {
      error: "Ingresa un usuario valido.",
    };
  }

  if (typeof password !== "string" || password.trim().length < 4) {
    return {
      error: "Ingresa una contrasena valida.",
    };
  }

  try {
    await signIn("credentials", {
      username: username.trim(),
      password,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          error: "Credenciales invalidas. Revisa el usuario y la contrasena.",
        };
      }

      return {
        error:
          "No pudimos iniciar sesion en este momento. Intenta nuevamente.",
      };
    }

    throw error;
  }

  return { error: "" };
}
