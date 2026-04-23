import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  ClipboardCheck,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";

import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";

const presentationPoints = [
  {
    title: "Stock seleccionado",
    description: "0 km, usados y oportunidades listas para consultar.",
    icon: CarFront,
  },
  {
    title: "Compra simple",
    description: "Te asesoramos para elegir y avanzar con confianza.",
    icon: ClipboardCheck,
  },
  {
    title: "Financiacion y permutas",
    description: "Consultanos por cuotas, entrega y toma de usado.",
    icon: ShieldCheck,
  },
];

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden border-b border-black/15 bg-[#f2c400]"
    >
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(0,0,0,.12)_1px,transparent_1px)] [background-size:18px_100%]" />
      <div className="absolute -right-20 bottom-0 hidden h-72 w-64 skew-x-[-16deg] bg-zinc-950 lg:block" />
      <div className="absolute right-44 bottom-0 hidden h-72 w-24 skew-x-[-16deg] bg-white/90 lg:block" />
      <div className="absolute right-16 top-12 hidden size-44 rounded-full border border-black/10 bg-zinc-950/10 shadow-[0_18px_48px_rgba(0,0,0,0.14)] md:block" />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:px-8">
        <div className="min-w-0 max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-zinc-950/20 bg-white/85 px-3 py-2 text-[11px] font-semibold tracking-[0.22em] text-zinc-900 uppercase shadow-sm sm:px-4 sm:text-xs sm:tracking-[0.28em]">
            Concesionaria multimarcas
          </div>

          <div className="mt-6 space-y-5 sm:mt-8 sm:space-y-6">
            <h1 className="break-words text-4xl leading-tight font-semibold tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
              TestAutomotores
            </h1>
            <p className="max-w-2xl break-words text-base leading-8 text-zinc-900 sm:text-lg lg:text-xl">
              Encontra 0 km, usados seleccionados y oportunidades con precio
              promocional.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-full bg-zinc-950 px-6 text-[#f2c400] shadow-[0_16px_34px_rgba(0,0,0,0.22)] hover:bg-zinc-900 sm:w-auto"
            >
              <Link href="#vehiculos">
                Ver destacados
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-full border-zinc-950/25 bg-white/88 px-6 text-zinc-950 hover:bg-white sm:w-auto"
            >
              <Link href="/contacto">
                Consultar ahora
                <PhoneCall className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative min-w-0 overflow-hidden rounded-[1.5rem] border border-black/15 bg-white shadow-[0_26px_70px_rgba(0,0,0,0.18)] sm:rounded-[1.75rem]">
          <div className="grid gap-0 sm:grid-cols-[0.82fr_1.18fr] lg:grid-cols-1 xl:grid-cols-[0.82fr_1.18fr]">
            <BrandLogo
              className="min-h-40 w-full rounded-none border-0 sm:min-h-48 lg:min-h-40 xl:min-h-48"
            />

            <div className="min-w-0 border-t border-zinc-200 bg-zinc-950 p-5 sm:border-t-0 sm:border-l sm:border-zinc-800 sm:p-6 lg:border-t lg:border-l-0 xl:border-t-0 xl:border-l">
              <p className="text-xs font-semibold tracking-[0.26em] text-[#f2c400] uppercase">
                Stock y financiacion
              </p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                Autos disponibles para consultar hoy.
              </h2>
              <p className="mt-4 text-sm leading-7 text-zinc-300">
                Te ayudamos con opciones de compra, financiacion y permuta.
              </p>
            </div>
          </div>

          <div className="border-t border-zinc-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold tracking-[0.26em] text-zinc-700 uppercase">
                Servicios
              </p>
              <div className="rounded-2xl bg-[#f2c400] p-3 text-zinc-950 shadow-sm">
                <BadgeCheck className="size-5" />
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {presentationPoints.map((point) => {
                const Icon = point.icon;

                return (
                  <article
                    key={point.title}
                    className="rounded-[1.25rem] border border-zinc-200 bg-[#fff8d6] p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1 rounded-full bg-zinc-950 p-2 text-[#f2c400]">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-zinc-950">
                          {point.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-zinc-600">
                          {point.description}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
