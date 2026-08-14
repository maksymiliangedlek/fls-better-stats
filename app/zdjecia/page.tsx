import type { Metadata } from "next";
import { SectionHeading } from "@/components/stats/SectionHeading";

export const metadata: Metadata = {
  title: "Zdjęcia — Ogniwo Bielany",
  description: "Galeria zdjęć Ogniwo Bielany.",
};

export default function ZdjeciaPage() {
  return (
    <section className="section container">
      <SectionHeading eyebrow="Klub" title="Zdjęcia" />
      <p style={{ color: "var(--c-muted)" }}>Galeria wkrótce.</p>
    </section>
  );
}
