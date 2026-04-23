"use client";

import { useActionState } from "react";
import { LockKeyhole, UserRound } from "lucide-react";

import {
  authenticate,
  type LoginFormState,
} from "@/app/login/actions";
import { Button } from "@/components/ui/button";

const inputClassName =
  "h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/60";

const initialLoginFormState: LoginFormState = {
  error: "",
};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    authenticate,
    initialLoginFormState
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <label className="space-y-2">
        <span className="text-sm font-medium text-zinc-700">Usuario</span>
        <div className="relative">
          <UserRound className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            name="username"
            className={inputClassName}
            placeholder="admin"
            autoComplete="username"
            required
          />
        </div>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-zinc-700">Contrasena</span>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="password"
            name="password"
            className={inputClassName}
            placeholder="Tu contrasena"
            autoComplete="current-password"
            required
          />
        </div>
      </label>

      <div className="space-y-3">
        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="h-12 w-full rounded-full bg-zinc-950 px-6 text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
        >
          {isPending ? "Ingresando..." : "Ingresar al panel"}
        </Button>

        <p aria-live="polite" className="min-h-5 text-sm text-red-600">
          {state.error}
        </p>
      </div>
    </form>
  );
}
