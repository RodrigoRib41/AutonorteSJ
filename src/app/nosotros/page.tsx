import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, BadgeCheck, Handshake, Shield } from "lucide-react";

import { BrandLogo } from "@/components/layout/brand-logo";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Quienes somos | TestAutomotores",
  description:
    "Conoce nuestro equipo, stock y forma de trabajo.",
};

const pillars = [
  {
    title: "Confianza en cada operacion",
    description:
      "Trabajamos con informacion clara y trato directo.",
    icon: Shield,
  },
  {
    title: "Trayectoria",
    description:
      "Seleccionamos unidades y cuidamos cada operacion.",
    icon: Award,
  },
  {
    title: "Atencion personalizada",
    description:
      "Te ayudamos a elegir segun tu presupuesto y necesidad.",
    icon: Handshake,
  },
];

const steps = [
  "Escuchamos que estas buscando.",
  "Te mostramos opciones concretas.",
  "Te acompanamos hasta cerrar la operacion.",
];

export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="bg-[#f5f1df]">
        <section className="relative overflow-hidden border-b border-zinc-950/15 bg-[#f2c400]">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(0,0,0,.12)_1px,transparent_1px)] [background-size:18px_100%]" />
          <div className="absolute -right-20 bottom-0 hidden h-64 w-56 skew-x-[-16deg] bg-zinc-950 lg:block" />
          <div className="absolute right-44 bottom-0 hidden h-64 w-20 skew-x-[-16deg] bg-white/90 lg:block" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-8">
            <div className="max-w-3xl space-y-6">
              <p className="text-sm font-semibold tracking-[0.28em] text-zinc-900 uppercase">
                Quienes somos
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
                Compra, venta y permuta de vehiculos con trato directo.
              </h1>
              <p className="text-base leading-8 text-zinc-900 sm:text-lg">
                Somos una concesionaria multimarcas con stock seleccionado,
                atencion personalizada y opciones de financiacion.
              </p>

              <div className="flex flex-col gap-4 pt-2 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full bg-zinc-950 px-6 text-[#f2c400] hover:bg-zinc-900"
                >
                  <Link href="/vehiculos">
                    Ver vehiculos
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-zinc-950/25 bg-white/88 px-6 text-zinc-950 hover:bg-white"
                >
                  <Link href="/contacto">Contactar asesor</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-zinc-950/15 bg-white/90 p-6 shadow-[0_32px_90px_rgba(0,0,0,0.16)] sm:p-8">
              <BrandLogo
                className="aspect-[4/3] w-full"
              />
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {["Trayectoria", "Seleccion", "Respaldo"].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1rem] border border-zinc-950/12 bg-[#fff8d6] p-4"
                  >
                    <BadgeCheck className="size-5 text-zinc-950" />
                    <p className="mt-3 text-sm font-semibold text-zinc-950">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold tracking-[0.28em] text-zinc-700 uppercase">
                Como trabajamos
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                Atencion clara de principio a fin.
              </h2>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;

                return (
                  <article
                    key={pillar.title}
                    className="rounded-[1.5rem] border border-zinc-950/12 bg-white p-6 shadow-[0_18px_48px_rgba(0,0,0,0.1)]"
                  >
                    <div className="rounded-2xl bg-[#f2c400] p-3 text-zinc-950">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-zinc-950">
                      {pillar.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-zinc-600 sm:text-base">
                      {pillar.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-zinc-950 py-16 text-white sm:py-20">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 skew-x-[-16deg] bg-[#f2c400] lg:block" />
          <div className="absolute inset-y-0 right-[28%] hidden w-24 skew-x-[-16deg] bg-white/90 lg:block" />
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:px-8">
            <div>
              <p className="text-sm font-semibold tracking-[0.28em] text-[#f2c400] uppercase">
                Como acompanamos
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Te acompanamos en cada paso.
              </h2>
            </div>

            <div className="grid gap-4">
              {steps.map((step, index) => (
                <article
                  key={step}
                  className="rounded-[1.25rem] border border-white/10 bg-white/8 p-5"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f2c400] text-sm font-semibold text-zinc-950">
                      {index + 1}
                    </span>
                    <p className="text-base leading-7 text-zinc-200">{step}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
