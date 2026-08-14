import type { Metadata } from "next";
import { getTeamMatches } from "@/lib/data/queries";
import { groupMatchesBySeason } from "@/lib/stats/matches";
import { MatchList } from "@/components/stats/MatchList";
import { SectionHeading } from "@/components/stats/SectionHeading";
import { SectionShell } from "@/components/stats/SectionShell";
import { formatSeasonSlug } from "@/lib/client/format";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mecze — Ogniwo Bielany",
  description: "Wszystkie mecze Ogniwo Bielany — wszystkie sezony.",
};

export default async function MeczePage() {
  const { data } = await getTeamMatches();
  const groups = groupMatchesBySeason(data.matches);

  return (
    <section className="section container">
      <SectionHeading eyebrow="Klub" title="Mecze" />
      {groups.length > 0 ? (
        groups.map((group) => (
          <div key={group.season} className={styles.group}>
            <h3 className={styles.season}>{formatSeasonSlug(group.season)}</h3>
            <SectionShell blur={false}>
              <MatchList matches={group.matches} />
            </SectionShell>
          </div>
        ))
      ) : (
        <p style={{ color: "var(--c-muted)" }}>
          Brak danych w pamięci podręcznej. Uruchom synchronizację, aby wczytać mecze.
        </p>
      )}
    </section>
  );
}
