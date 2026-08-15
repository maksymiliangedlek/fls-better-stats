import type { Metadata } from "next";
import { Suspense } from "react";
import { getRosterBoard } from "@/lib/data/queries";
import { CompareView } from "@/components/compare/CompareView";
import { SectionHeading } from "@/components/stats/SectionHeading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Porównaj zawodników — Ogniwo Bielany",
  description: "Porównanie dwóch lub trzech zawodników Ogniwo Bielany.",
};

export default async function ComparePage() {
  const { data } = await getRosterBoard("all", "goals");

  return (
    <section className="section container">
      <SectionHeading eyebrow="Head-to-head" title="Porównaj zawodników" />
      {data.players.length > 0 ? (
        <Suspense fallback={<p style={{ color: "var(--c-muted)" }}>Ładowanie…</p>}>
          <CompareView roster={data.players} />
        </Suspense>
      ) : (
        <p style={{ color: "var(--c-muted)" }}>
          Brak danych w pamięci podręcznej. Uruchom synchronizację, aby wczytać zawodników.
        </p>
      )}
    </section>
  );
}
