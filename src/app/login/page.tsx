import Link from "next/link";
import { ShieldCheck, TimerReset, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";

const trustPoints = [
  {
    title: "Acceso protegido",
    description:
      "Ingreso reservado para el equipo autorizado.",
    icon: ShieldCheck,
  },
  {
    title: "Usuarios y roles",
    description:
      "Permisos para administradores y gestores.",
    icon: Users,
  },
  {
    title: "Primer acceso",
    description:
      "El superadmin inicial permite cargar nuevos usuarios.",
    icon: TimerReset,
  },
];

export default async function LoginPage() {
  const admin = await getAuthenticatedAdmin();

  if (admin) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-[#f5f1df] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <section className="relative overflow-hidden rounded-[2rem] border border-zinc-950/15 bg-[#f2c400] p-8 text-zinc-950 shadow-[0_32px_80px_rgba(0,0,0,0.18)] sm:p-10 lg:p-12">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(0,0,0,.12)_1px,transparent_1px)] [background-size:18px_100%]" />
          <div className="absolute -right-16 bottom-0 h-64 w-44 skew-x-[-16deg] bg-zinc-950" />
          <div className="absolute right-32 bottom-0 h-64 w-16 skew-x-[-16deg] bg-white/90" />
          <Link
            href="/"
            className="relative text-xs font-semibold tracking-[0.28em] text-zinc-900 uppercase transition-colors hover:text-zinc-950"
          >
            TestAutomotores
          </Link>

          <div className="relative mt-8 max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.28em] text-zinc-800 uppercase">
              Panel administrativo
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Acceso seguro al panel.
            </h1>
            <p className="mt-6 text-base leading-8 text-zinc-900 sm:text-lg">
              Inicia sesion para administrar stock, usuarios y consultas.
            </p>
          </div>

          <div className="relative mt-10 grid gap-4">
            {trustPoints.map((point) => {
              const Icon = point.icon;

              return (
                <article
                  key={point.title}
                  className="rounded-[1.5rem] border border-zinc-950/10 bg-white/86 p-5 shadow-sm backdrop-blur-sm"
                >
                  <div className="w-fit rounded-2xl bg-zinc-950 p-3 text-[#f2c400]">
                    <Icon className="size-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold">{point.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-zinc-700">
                    {point.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2rem] border border-zinc-950/15 bg-white p-8 shadow-[0_24px_60px_rgba(0,0,0,0.12)] sm:p-10">
          <div className="max-w-md">
            <p className="text-sm font-semibold tracking-[0.28em] text-zinc-500 uppercase">
              Inicio de sesion
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Bienvenido al panel
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-600">
              Usa tus credenciales para ingresar.
            </p>
          </div>

          <div className="mt-8">
            <LoginForm />
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-zinc-950/10 bg-[#fff8d6] p-5">
            <p className="text-xs font-semibold tracking-[0.18em] text-zinc-600 uppercase">
              Acceso institucional
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              Para el primer acceso completa{" "}
              <span className="font-medium text-zinc-950">AUTH_SECRET</span>,{" "}
              <span className="font-medium text-zinc-950">
                AUTH_ADMIN_USER
              </span>{" "}
              y{" "}
              <span className="font-medium text-zinc-950">
                AUTH_ADMIN_PASSWORD
              </span>{" "}
              en tu entorno. Luego podes crear mas usuarios desde el panel.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
