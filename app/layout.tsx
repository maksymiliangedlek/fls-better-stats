import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Anton } from "next/font/google";
import "../styles/globals.css";
import { SiteHeader } from "@/components/branding/SiteHeader";
import { SiteFooter } from "@/components/branding/SiteFooter";
import { SocialIsland } from "@/components/branding/SocialIsland";

const monument = Anton({
  subsets: ["latin-ext"],
  weight: "400",
  display: "swap",
  variable: "--font-monument",
});

export const metadata: Metadata = {
  title: "Ogniwo Bielany — Statystyki",
  description: "Statystyki drużyny Ogniwo Bielany — FLS Kraków",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl" className={monument.variable}>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
        >
          <SiteHeader />
          <SocialIsland />
          <main style={{ flex: 1 }}>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
