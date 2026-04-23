"use client";

import { MessageCircle } from "lucide-react";

import { siteConfig } from "@/lib/site-config";

export function WhatsAppButton() {
  return (
    <a
      href={siteConfig.social.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-4 right-4 z-[60] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_18px_40px_rgba(37,211,102,0.35)] transition-transform duration-300 hover:scale-[1.03] hover:bg-[#21bd5b] sm:bottom-6 sm:right-6 sm:h-[3.75rem] sm:w-[3.75rem]"
    >
      <MessageCircle className="size-6" />
    </a>
  );
}
