import Link from "next/link";
import type { SVGProps } from "react";
import {
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import { siteConfig } from "@/lib/site-config";

const footerLinks = [
  { href: "/", label: "Inicio" },
  { href: "/vehiculos", label: "Vehiculos" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect width="16" height="16" x="4" y="4" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17" cy="7" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14.5 8.75V7.2c0-.74.49-.92.84-.92h2.13V3.15L14.53 3.14c-3.26 0-4 2.44-4 4v1.61H8v3.23h2.53v8.88h3.97v-8.88h2.68l.36-3.23H14.5Z" />
    </svg>
  );
}

const socialLinks = [
  {
    href: siteConfig.social.instagramUrl,
    label: "Instagram",
    icon: InstagramIcon,
  },
  {
    href: siteConfig.social.facebookUrl,
    label: "Facebook",
    icon: FacebookIcon,
  },
  {
    href: siteConfig.social.whatsappUrl,
    label: "WhatsApp",
    icon: MessageCircle,
  },
];

export function Footer() {
  return (
    <footer className="border-t border-yellow-400/25 bg-zinc-950 text-white">
      <div className="h-1 bg-[#f2c400]" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-10 md:grid-cols-2 lg:grid-cols-[1.15fr_0.75fr_1fr_0.8fr] lg:px-8">
        <div className="max-w-xl space-y-4">
          <p className="text-lg font-semibold tracking-tight text-white">
            {siteConfig.name}
          </p>
          <p className="text-sm leading-7 text-zinc-300">
            {siteConfig.description}
          </p>
          <div className="flex flex-wrap gap-3">
            {socialLinks.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="inline-flex size-11 items-center justify-center rounded-full border border-white/12 bg-white/8 text-zinc-100 transition-colors hover:border-[#f2c400]/70 hover:bg-[#f2c400] hover:text-zinc-950"
                >
                  <Icon className="size-5" />
                </a>
              );
            })}
          </div>
        </div>

        <nav className="space-y-4 text-sm text-zinc-300">
          <p className="text-xs font-semibold tracking-[0.24em] text-[#f2c400] uppercase">
            Sitio
          </p>
          <div className="grid gap-3">
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-[#f2c400]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="space-y-4 text-sm text-zinc-300">
          <p className="text-xs font-semibold tracking-[0.24em] text-[#f2c400] uppercase">
            Contacto
          </p>
          <div className="grid gap-3">
            <a
              href={`tel:${siteConfig.contact.phoneTel}`}
              className="flex items-start gap-3 transition-colors hover:text-[#f2c400]"
            >
              <Phone className="mt-0.5 size-4 shrink-0 text-[#f2c400]" />
              <span>{siteConfig.contact.phoneDisplay}</span>
            </a>
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="flex items-start gap-3 transition-colors hover:text-[#f2c400]"
            >
              <Mail className="mt-0.5 size-4 shrink-0 text-[#f2c400]" />
              <span>{siteConfig.contact.email}</span>
            </a>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[#f2c400]" />
              <span>{siteConfig.contact.address}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-sm text-zinc-300">
          <p className="text-xs font-semibold tracking-[0.24em] text-[#f2c400] uppercase">
            Horarios
          </p>
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-[#f2c400]" />
              <span>{siteConfig.businessHours.weekdays}</span>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-[#f2c400]" />
              <span>{siteConfig.businessHours.saturday}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs tracking-wide text-zinc-500 uppercase sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Copyright 2026 {siteConfig.name}. Todos los derechos reservados.</p>
          <Link href="/contacto" className="transition-colors hover:text-[#f2c400]">
            Consultas y financiacion
          </Link>
        </div>
      </div>
    </footer>
  );
}
