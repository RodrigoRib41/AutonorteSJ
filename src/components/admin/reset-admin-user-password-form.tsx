"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AdminUserPasswordResetResponse } from "@/lib/admin-users";

const inputClassName =
  "h-10 w-full rounded-full border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/60";

type ResetAdminUserPasswordFormProps = {
  userId: string;
  userUsername: string;
};

export function ResetAdminUserPasswordForm({
  userId,
  userUsername,
}: ResetAdminUserPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setPasswordError("");
    setStatusMessage("");
    setHasError(false);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      });

      const result = (await response
        .json()
        .catch(() => null)) as AdminUserPasswordResetResponse | null;

      if (!response.ok || !result || !result.success) {
        const fieldError =
          result && !result.success ? result.fieldErrors?.password : undefined;

        setPasswordError(fieldError ?? "");
        setHasError(true);
        setStatusMessage(
          result?.message ??
            "No pudimos resetear la password del gestor en este momento."
        );
        return;
      }

      setPassword("");
      setHasError(false);
      setStatusMessage("Password actualizada correctamente.");
      router.refresh();
    } catch {
      setHasError(true);
      setStatusMessage(
        "No pudimos resetear la password del gestor en este momento."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 border-t border-zinc-200 pt-4"
      noValidate
    >
      <label className="space-y-2">
        <span className="text-sm font-medium text-zinc-700">
          Resetear password
        </span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setPasswordError("");
              setStatusMessage("");
              setHasError(false);
            }}
            className={inputClassName}
            placeholder="Minimo 8 caracteres"
            autoComplete="new-password"
            aria-label={`Nueva password para ${userUsername}`}
            required
          />
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={isSubmitting}
            className="h-10 shrink-0 rounded-full border border-zinc-200 bg-white px-4 text-zinc-950 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-500"
          >
            <KeyRound className="size-4" />
            {isSubmitting ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>
      </label>

      <p
        aria-live="polite"
        className={`mt-2 text-sm ${
          passwordError || hasError
            ? "text-red-600"
            : statusMessage
              ? "text-emerald-700"
              : "text-zinc-500"
        }`}
      >
        {passwordError ||
          statusMessage ||
          "La nueva password reemplaza la anterior apenas se confirma."}
      </p>
    </form>
  );
}
