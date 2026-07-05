import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Archivo } from "next/font/google";
import "../styles/globals.css";
import { SiteHeader } from "@/components/branding/SiteHeader";
import { SiteFooter } from "@/components/branding/SiteFooter";
import { GhostCursorBackground } from "@/components/effects/GhostCursorBackground";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ogniwo Bielany — Statystyki",
  description: "Statystyki drużyny Ogniwo Bielany — FLS Kraków",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl" className={`${inter.variable} ${archivo.variable}`}>
      <body>
        <GhostCursorBackground />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <SiteHeader />
          <main style={{ flex: 1 }}>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
