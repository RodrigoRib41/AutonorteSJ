"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type {
  AdminUserFieldErrors,
  AdminUserItemResponse,
} from "@/lib/admin-users";

const inputClassName =
  "h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/60";

type UserFormValues = {
  name: string;
  username: string;
  password: string;
};

const initialValues: UserFormValues = {
  name: "",
  username: "",
  password: "",
};

export function UserForm() {
  const router = useRouter();
  const [values, setValues] = useState<UserFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<AdminUserFieldErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof UserFormValues>(
    field: K,
    value: UserFormValues[K]
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const result = (await response
        .json()
        .catch(() => null)) as AdminUserItemResponse | null;

      if (!response.ok || !result || !result.success) {
        setFieldErrors(result && !result.success ? result.fieldErrors ?? {} : {});
        setErrorMessage(
          result?.message ??
            "No pudimos crear el usuario gestor en este momento."
        );
        return;
      }

      setValues(initialValues);
      setSuccessMessage("Usuario gestor creado correctamente.");
      router.refresh();
    } catch {
      setErrorMessage(
        "No pudimos crear el usuario gestor en este momento."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">
            Nombre del usuario
          </span>
          <input
            type="text"
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            className={inputClassName}
            placeholder="Juan Perez"
            required
          />
          {fieldErrors.name ? (
            <p className="text-sm text-red-600">{fieldErrors.name}</p>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">Usuario</span>
          <input
            type="text"
            value={values.username}
            onChange={(event) => updateField("username", event.target.value)}
            className={inputClassName}
            placeholder="gestor01"
            autoComplete="username"
            required
          />
          {fieldErrors.username ? (
            <p className="text-sm text-red-600">{fieldErrors.username}</p>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">
            Contrasena inicial
          </span>
          <input
            type="password"
            value={values.password}
            onChange={(event) => updateField("password", event.target.value)}
            className={inputClassName}
            placeholder="Minimo 8 caracteres"
            autoComplete="new-password"
            required
          />
          {fieldErrors.password ? (
            <p className="text-sm text-red-600">{fieldErrors.password}</p>
          ) : (
            <p className="text-sm text-zinc-500">
              El usuario va a ingresar con esta contrasena.
            </p>
          )}
        </label>

        <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-5 py-4 text-sm leading-7 text-zinc-600">
          Este formulario crea usuarios gestores.
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-5 py-4 text-sm leading-7 text-zinc-600">
        Los gestores pueden trabajar sobre el stock. El superadmin puede
        actualizar contrasenas o eliminar accesos.
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className={
            errorMessage
              ? "text-sm text-red-600"
              : successMessage
                ? "text-sm text-emerald-700"
                : "text-sm text-zinc-500"
          }
        >
          {errorMessage ||
            successMessage ||
            "Cada gestor queda habilitado apenas se crea."}
        </p>

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="h-12 rounded-full bg-zinc-950 px-6 text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
        >
          {isSubmitting ? "Creando..." : "Crear gestor"}
        </Button>
      </div>
    </form>
  );
}
