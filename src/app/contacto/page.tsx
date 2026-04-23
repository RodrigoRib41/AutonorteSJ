import {
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  TimerReset,
  Users,
} from "lucide-react";

import { ContactForm } from "@/components/forms/contact-form";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { siteConfig } from "@/lib/site-config";

const contactItems = [
  {
    icon: Phone,
    title: "Telefono",
    value: siteConfig.contact.phoneDisplay,
  },
  {
    icon: Mail,
    title: "Email",
    value: siteConfig.contact.email,
  },
  {
    icon: MapPin,
    title: "Ubicacion",
    value: siteConfig.contact.address,
  },
];

const trustItems = [
  {
    icon: Users,
    title: "Atencion personalizada",
    description: "Te atiende un asesor del equipo.",
  },
  {
    icon: TimerReset,
    title: "Respuesta rapida",
    description: "Respondemos lo antes posible.",
  },
  {
    icon: ShieldCheck,
    title: "Asesoramiento comercial",
    description: "Te ayudamos con compra, venta o permuta.",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="bg-[var(--brand-canvas)]">
        <section className="relative overflow-hidden border-b border-zinc-950/15 bg-[var(--brand-primary)]">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(0,0,0,.12)_1px,transparent_1px)] [background-size:18px_100%]" />
          <div className="absolute -right-20 bottom-0 hidden h-56 w-56 skew-x-[-16deg] bg-zinc-950 lg:block" />
          <div className="absolute right-44 bottom-0 hidden h-56 w-20 skew-x-[-16deg] bg-white/90 lg:block" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-3xl space-y-5">
              <p className="text-sm font-semibold tracking-[0.28em] text-zinc-900 uppercase">
                Contacto
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
                Contactanos
              </h1>
              <p className="text-base leading-8 text-zinc-900 sm:text-lg">
                Consultanos por stock, precios, financiacion o permutas. Te
                respondemos a la brevedad.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
            <div className="space-y-6">
              <div className="rounded-[1.5rem] border border-zinc-950/15 bg-white p-8 shadow-[0_24px_60px_rgba(0,0,0,0.12)] sm:p-10">
                <p className="text-sm font-semibold tracking-[0.28em] text-zinc-700 uppercase">
                  Datos de contacto
                </p>

                <div className="mt-8 grid gap-4">
                  {contactItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <article
                        key={item.title}
                        className="rounded-[1.25rem] border border-zinc-950/10 bg-[var(--brand-soft)] p-5"
                      >
                        <div className="flex items-start gap-4">
                          <div className="rounded-2xl bg-[var(--brand-primary)] p-3 text-zinc-950 shadow-sm">
                            <Icon className="size-5" />
                          </div>
                          <div>
                            <h2 className="text-sm font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                              {item.title}
                            </h2>
                            <p className="mt-2 text-base leading-7 text-zinc-950">
                              {item.value}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-zinc-950 p-8 text-white shadow-[0_28px_70px_rgba(0,0,0,0.22)] sm:p-10">
                <p className="text-sm font-semibold tracking-[0.28em] text-[var(--brand-primary)] uppercase">
                  Atencion
                </p>

                <div className="mt-8 grid gap-4">
                  {trustItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <article
                        key={item.title}
                        className="rounded-[1.25rem] border border-white/10 bg-white/8 p-5"
                      >
                        <div className="flex items-start gap-4">
                          <div className="rounded-2xl bg-[var(--brand-primary)] p-3 text-zinc-950">
                            <Icon className="size-5" />
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold text-white">
                              {item.title}
                            </h2>
                            <p className="mt-2 text-sm leading-7 text-zinc-300">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-zinc-950/15 bg-white p-8 shadow-[0_24px_60px_rgba(0,0,0,0.12)] sm:p-10">
              <p className="text-sm font-semibold tracking-[0.28em] text-zinc-700 uppercase">
                Escribinos
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                Dejanos tu consulta
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">
                Contanos que estas buscando y como podemos contactarte.
              </p>

              <div className="mt-8">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
