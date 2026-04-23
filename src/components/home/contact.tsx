import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
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

export function Contact() {
  return (
    <section id="contacto" className="bg-[#f2c400] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <div className="rounded-[2rem] border border-zinc-950/15 bg-white/92 p-8 shadow-[0_24px_60px_rgba(0,0,0,0.14)] sm:p-10">
            <p className="text-sm font-semibold tracking-[0.28em] text-zinc-700 uppercase">
              Contacto
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Hablemos de tu proximo auto.
            </h2>
            <p className="mt-5 text-base leading-8 text-zinc-600 sm:text-lg">
              Escribinos o llamanos. Te respondemos con disponibilidad, precios
              y opciones de financiacion.
            </p>

            <div className="mt-8 grid gap-4">
              {contactItems.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-[1.5rem] border border-zinc-950/10 bg-[#fff8d6] p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-[#f2c400] p-3 text-zinc-950 shadow-sm">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                          {item.title}
                        </h3>
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

          <div className="relative overflow-hidden rounded-[2rem] bg-zinc-950 p-8 text-white shadow-[0_28px_70px_rgba(0,0,0,0.22)] sm:p-10">
            <div className="absolute -right-16 bottom-0 h-44 w-32 skew-x-[-16deg] bg-[#f2c400]" />
            <div className="relative">
              <p className="text-sm font-semibold tracking-[0.28em] text-[#f2c400] uppercase">
                Asesoramiento
              </p>
              <h3 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Atencion directa para comprar, vender o permutar.
              </h3>
              <p className="mt-5 max-w-xl text-base leading-8 text-zinc-300 sm:text-lg">
                Contanos que estas buscando y un asesor se comunica con vos.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full bg-[#f2c400] px-6 text-zinc-950 hover:bg-yellow-300"
                >
                  <Link href="/contacto">Ir a contacto</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-white/20 bg-white/8 px-6 text-white hover:bg-white/12"
                >
                  <a href={`tel:${siteConfig.contact.phoneTel}`}>
                    Llamar ahora
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
