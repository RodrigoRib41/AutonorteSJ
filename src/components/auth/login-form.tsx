"use client";

import { type FormEvent, useState } from "react";
import { LockKeyhole, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { toAdminAuthEmail } from "@/lib/admin-auth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/providers/auth-provider";

const inputClassName =
  "h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/60";

export function LoginForm() {
  const router = useRouter();
  const { refreshAdmin } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const email = toAdminAuthEmail(username);

    if (!email || password.trim().length === 0) {
      setErrorMessage("Ingresa tu usuario y contrasena.");
      setIsSubmitting(false);
      return;
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage("Credenciales invalidas o acceso no habilitado.");
      setIsSubmitting(false);
      return;
    }

    const admin = await refreshAdmin();

    if (!admin?.isActive) {
      await supabase.auth.signOut();
      setErrorMessage("Tu acceso admin no esta habilitado.");
      setIsSubmitting(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <label className="space-y-2">
        <span className="text-sm font-medium text-zinc-700">Usuario</span>
        <div className="relative">
          <UserRound className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            name="username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setErrorMessage("");
            }}
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
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrorMessage("");
            }}
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
          disabled={isSubmitting}
          className="h-12 w-full rounded-full bg-zinc-950 px-6 text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
        >
          {isSubmitting ? "Ingresando..." : "Ingresar al panel"}
        </Button>

        <p aria-live="polite" className="min-h-5 text-sm text-red-600">
          {errorMessage}
        </p>
      </div>
    </form>
  );
}
