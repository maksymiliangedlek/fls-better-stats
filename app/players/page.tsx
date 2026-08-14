import type { Metadata } from "next";
import { getRosterBoard } from "@/lib/data/queries";
import { RosterGrid } from "@/components/roster/RosterGrid";
import { LeaderboardTable } from "@/components/stats/LeaderboardTable";
import { SectionHeading } from "@/components/stats/SectionHeading";
import { LinkButton } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Zawodnicy — Ogniwo Bielany",
  description: "Zawodnicy i ranking Ogniwo Bielany.",
};

export default async function PlayersPage() {
  const { data } = await getRosterBoard("all", "goals");

  return (
    <>
      <section className="section container">
        <SectionHeading
          eyebrow="Klub"
          title="Zawodnicy"
          action={<LinkButton href="/compare" variant="navy">Porównaj zawodników</LinkButton>}
        />
        {data.players.length > 0 ? (
          <RosterGrid players={data.players} />
        ) : (
          <p style={{ color: "var(--c-muted)" }}>
            Brak danych w pamięci podręcznej. Uruchom synchronizację, aby wczytać skład.
          </p>
        )}
      </section>

      {data.players.length > 0 && (
        <section className="section container">
          <SectionHeading eyebrow="Ranking" title="Tabela statystyk" />
          <LeaderboardTable initial={data} />
        </section>
      )}
    </>
  );
}
