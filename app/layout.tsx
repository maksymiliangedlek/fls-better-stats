import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../styles/globals.css";
import { SiteHeader } from "@/components/branding/SiteHeader";
import { SiteFooter } from "@/components/branding/SiteFooter";

export const metadata: Metadata = {
  title: "Ogniwo Bielany — Statystyki",
  description: "Statystyki drużyny Ogniwo Bielany — FLS Kraków",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
        >
          <SiteHeader />
          <main style={{ flex: 1 }}>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
