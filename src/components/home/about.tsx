import { Award, Handshake, Shield } from "lucide-react";

const pillars = [
  {
    title: "Informacion clara",
    description:
      "Te mostramos cada unidad con datos concretos y asesoramiento directo.",
    icon: Shield,
  },
  {
    title: "Trayectoria",
    description:
      "Trabajamos con unidades seleccionadas y operaciones cuidadas.",
    icon: Award,
  },
  {
    title: "Atencion personalizada",
    description:
      "Te ayudamos a elegir segun tu presupuesto y necesidad.",
    icon: Handshake,
  },
];

export function About() {
  return (
    <section id="nosotros" className="relative overflow-hidden bg-white py-20 sm:py-24">
      <div className="absolute inset-x-0 top-0 h-2 bg-zinc-950" />
      <div className="absolute -right-20 top-12 hidden h-56 w-40 skew-x-[-16deg] bg-[#f2c400] lg:block" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="max-w-2xl space-y-6">
            <p className="text-sm font-semibold tracking-[0.28em] text-zinc-700 uppercase">
              Quienes somos
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Atencion cercana para comprar o vender con confianza.
            </h2>
            <p className="text-base leading-8 text-zinc-600 sm:text-lg">
              Somos una concesionaria multimarcas con stock seleccionado,
              atencion directa y asesoramiento para cada operacion.
            </p>
            <p className="text-base leading-8 text-zinc-600 sm:text-lg">
              Tambien recibimos permutas y consultas por financiacion.
            </p>
          </div>

          <div className="grid gap-4">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;

              return (
                <article
                  key={pillar.title}
                  className="rounded-[1.5rem] border border-zinc-950/12 bg-[#fff8d6] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-zinc-950 p-3 text-[#f2c400]">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-zinc-950">
                        {pillar.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-zinc-600 sm:text-base">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
