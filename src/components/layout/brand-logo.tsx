import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  href?: string;
};

export function BrandLogo({ className, href }: BrandLogoProps) {
  const logo = (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-[1.35rem] border border-black/15 bg-[var(--brand-primary)] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] sm:p-6",
        className
      )}
    >
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(90deg,rgba(0,0,0,.12)_1px,transparent_1px)] [background-size:12px_100%]" />
      <div className="absolute -right-12 bottom-0 h-28 w-32 skew-x-[-16deg] bg-zinc-950/90 sm:h-36 sm:w-40" />
      <div className="absolute right-12 bottom-0 h-28 w-16 skew-x-[-16deg] bg-white/85 sm:h-36 sm:w-20" />
      <div className="relative text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[1.1rem] bg-zinc-950 text-xl font-semibold tracking-tight text-[var(--brand-primary)] shadow-[0_12px_28px_rgba(0,0,0,0.24)] sm:size-16 sm:rounded-[1.25rem] sm:text-2xl">
          TA
        </div>
        <p className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
          TestAutomotores
        </p>
        <p className="mt-2 text-[10px] font-semibold tracking-[0.2em] text-zinc-800 uppercase sm:text-xs sm:tracking-[0.24em]">
          Concesionaria multimarcas
        </p>
      </div>
    </div>
  );

  if (!href) {
    return logo;
  }

  return (
    <Link href={href} aria-label="TestAutomotores" className="block">
      {logo}
    </Link>
  );
}
