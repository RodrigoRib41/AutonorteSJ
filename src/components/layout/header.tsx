import Link from "next/link";

import { Button } from "@/components/ui/button";

const navigation = [
  { href: "/", label: "Inicio" },
  { href: "/vehiculos", label: "Vehiculos" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 overflow-hidden border-b border-yellow-400/20 bg-zinc-950/96 text-white shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="h-1 bg-[#f2c400]" />
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" className="min-w-0 flex-1 md:flex-none">
          <div className="flex flex-col border-l-4 border-[#f2c400] pl-3">
            <span className="truncate text-base font-semibold tracking-tight text-white sm:text-xl">
              TestAutomotores
            </span>
            <span className="hidden text-[11px] font-medium tracking-[0.28em] text-yellow-300 uppercase sm:block">
              Concesionaria multimarcas
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-200 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-[#f2c400]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Button
          asChild
          className="hidden h-10 rounded-full border border-yellow-300/30 bg-[#f2c400] px-3 text-xs font-semibold text-zinc-950 shadow-[0_10px_24px_rgba(242,196,0,0.22)] hover:bg-yellow-300 sm:inline-flex sm:h-11 sm:px-5 sm:text-sm"
        >
          <Link href="/contacto">Consultar</Link>
        </Button>
      </div>

      <nav className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-4 pb-3 text-sm font-medium text-zinc-100 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-6 md:hidden [&::-webkit-scrollbar]:hidden">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-center transition-colors hover:border-yellow-300/50 hover:text-[#f2c400]"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
