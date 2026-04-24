import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "TestAutomotores",
  description:
    "Compra, venta y financiacion de vehiculos 0 km y usados seleccionados.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} scroll-smooth`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>
          {children}
          <WhatsAppButton />
        </AuthProvider>
      </body>
    </html>
  );
}
