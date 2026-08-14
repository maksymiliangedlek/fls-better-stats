import { getTeamOverview } from "@/lib/data/queries";
import { StatCard } from "@/components/stats/StatCard";
import { RosterGrid } from "@/components/roster/RosterGrid";
import { MatchList } from "@/components/stats/MatchList";
import { SectionShell } from "@/components/stats/SectionShell";
import { SectionHeading } from "@/components/stats/SectionHeading";
import { ProgressMeter } from "@/components/stats/ProgressMeter";
import { Sparkline } from "@/components/charts/Sparkline";
import { LinkButton } from "@/components/ui/Button";
import { HomeLanding } from "@/components/branding/HomeLanding";
import { BootIcon, BalanceIcon, MatchBallIcon } from "@/components/ui/icons";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data } = await getTeamOverview();
  const { record, rosterSize, topScorers, recentMatches, goalsTimeline } = data;

  const gdRange = record
    ? Math.max(15, Math.ceil((Math.abs(record.goalDifference) + 5) / 5) * 5)
    : 15;
  const goalsSeries = goalsTimeline.map((p) => p.gf);

  return (
    <>
      <HomeLanding />

      {record && (
        <section className="section container">
          <div className={styles.statGrid}>
            <StatCard label="Mecze" value={record.played} icon={<MatchBallIcon />} accent />
            <StatCard label="Bramki" value={record.goalsFor} sub={`${record.goalsAgainst} straconych`} icon={<BootIcon />}>
              {goalsSeries.length > 1 && (
                <div className={styles.spark}>
                  <Sparkline data={goalsSeries} />
                </div>
              )}
            </StatCard>
            <StatCard
              label="Bilans bramek"
              value={record.goalDifference > 0 ? `+${record.goalDifference}` : record.goalDifference}
              icon={<BalanceIcon />}
            >
              <ProgressMeter value={record.goalDifference} range={gdRange} />
            </StatCard>
          </div>
          <p className={styles.rosterNote}>{rosterSize} zawodników w bazie</p>
        </section>
      )}

      {topScorers.length > 0 && (
        <section className="section container">
          <SectionHeading
            eyebrow="Zawodnicy"
            title="Najlepsi strzelcy"
            action={<LinkButton href="/players" variant="navy">Wszyscy zawodnicy</LinkButton>}
          />
          <RosterGrid players={topScorers} />
        </section>
      )}

      {recentMatches.length > 0 && (
        <section className="section container">
          <SectionHeading
            eyebrow="Mecze"
            title="Ostatnie mecze"
            action={<LinkButton href="/mecze" variant="navy">Wszystkie mecze</LinkButton>}
          />
          <SectionShell blur={recentMatches.length > 4}>
            <MatchList matches={recentMatches} />
          </SectionShell>
        </section>
      )}

      {!record && topScorers.length === 0 && (
        <section className="section container">
          <p className={styles.empty}>
            Brak danych w pamięci podręcznej. Uruchom synchronizację, aby wczytać
            statystyki drużyny.
          </p>
        </section>
      )}
    </>
  );
}
