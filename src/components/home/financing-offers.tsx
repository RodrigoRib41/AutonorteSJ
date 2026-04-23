import Link from "next/link";
import {
  BadgeDollarSign,
  Calculator,
  Car,
  ClipboardCheck,
  MessageCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const offers = [
  {
    title: "Entrega y cuotas",
    description:
      "Alternativas para combinar anticipo y cuotas segun la unidad elegida.",
    icon: BadgeDollarSign,
  },
  {
    title: "Toma de usado",
    description:
      "Podes consultar la entrega de tu vehiculo actual como parte de pago.",
    icon: Car,
  },
  {
    title: "Planes a medida",
    description:
      "Evaluamos opciones de financiacion segun perfil, presupuesto y plazo.",
    icon: Calculator,
  },
];

export function FinancingOffers() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 py-16 text-white sm:py-20 lg:py-24">
      <div className="absolute inset-y-0 right-0 hidden w-1/3 skew-x-[-16deg] bg-[var(--brand-primary)] lg:block" />
      <div className="absolute inset-y-0 right-[28%] hidden w-24 skew-x-[-16deg] bg-white/90 lg:block" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="relative max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.24em] text-[var(--brand-primary)] uppercase sm:text-sm sm:tracking-[0.28em]">
              Financiacion
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Financiacion y permutas para tu proximo vehiculo.
            </h2>
            <p className="mt-5 text-sm leading-7 text-zinc-300 sm:text-base lg:text-lg">
              Consultanos por cuotas, entrega inicial y toma de usado.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 w-full rounded-full bg-[var(--brand-primary)] px-6 text-zinc-950 shadow-[0_16px_34px_rgba(221,210,51,0.2)] hover:bg-[var(--brand-primary-hover)] sm:w-auto"
              >
                <Link href="/contacto">
                  Consultar financiacion
                  <MessageCircle className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-full border-white/20 bg-white/8 px-6 text-white hover:bg-white/12 sm:w-auto"
              >
                <Link href="/vehiculos">Ver stock</Link>
              </Button>
            </div>
          </div>

          <div className="relative grid gap-4">
            {offers.map((offer) => {
              const Icon = offer.icon;

              return (
                <article
                  key={offer.title}
                  className="rounded-[1.5rem] border border-white/12 bg-white/92 p-5 text-zinc-950 shadow-[0_20px_50px_rgba(0,0,0,0.16)] sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-[1.15rem] bg-[var(--brand-primary)] p-3 text-zinc-950">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-zinc-950 sm:text-xl">
                        {offer.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-zinc-700 sm:text-base">
                        {offer.description}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}

            <div className="rounded-[1.5rem] border border-[var(--brand-border-strong)] bg-[var(--brand-primary)] p-5 text-zinc-950 shadow-[0_20px_50px_rgba(0,0,0,0.16)] sm:p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-[1.15rem] bg-zinc-950 p-3 text-[var(--brand-primary)] shadow-sm">
                  <ClipboardCheck className="size-5" />
                </div>
                <p className="min-w-0 text-sm leading-7 text-zinc-950 sm:text-base">
                  La aprobacion y las condiciones pueden variar segun la unidad
                  y el perfil crediticio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
