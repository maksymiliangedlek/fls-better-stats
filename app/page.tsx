import { getTeamOverview } from "@/lib/data/queries";
import { RecordBadge } from "@/components/stats/RecordBadge";
import { FormGuide } from "@/components/stats/FormGuide";
import { StatCard } from "@/components/stats/StatCard";
import { RosterGrid } from "@/components/roster/RosterGrid";
import { MatchList } from "@/components/stats/MatchList";
import { SectionShell } from "@/components/stats/SectionShell";
import { SectionHeading } from "@/components/stats/SectionHeading";
import { ProgressMeter } from "@/components/stats/ProgressMeter";
import { ProgressBar } from "@/components/stats/ProgressBar";
import { Sparkline } from "@/components/charts/Sparkline";
import { LinkButton } from "@/components/ui/Button";
import { HeroBadge } from "@/components/branding/HeroBadge";
import { FlowingMenuSection } from "@/components/effects/FlowingMenuSection";
import { BootIcon, BalanceIcon, TargetIcon, MatchBallIcon } from "@/components/ui/icons";
import GradualBlur from "@/components/effects/gradual-blur/GradualBlur";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data } = await getTeamOverview();
  const { team, record, rosterSize, topScorers, recentMatches, goalsTimeline } = data;

  const pointsTarget = record ? Math.max(30, Math.ceil((record.points + 5) / 5) * 5) : 30;
  const gdRange = record
    ? Math.max(15, Math.ceil((Math.abs(record.goalDifference) + 5) / 5) * 5)
    : 15;
  const goalsSeries = goalsTimeline.map((p) => p.gf);

  return (
    <>
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroText}>
            <span className="eyebrow">
              {team?.league ?? "FLS Kraków"} · {team?.season ?? "Sezon"}
            </span>
            <h1>
              Ogniwo <span className={styles.gold}>Bielany</span>
            </h1>
            <p className={styles.lead}>
              Statystyki, forma i porównania zawodników klubu — zaawansowana
              analityka w jednym miejscu, na podstawie danych z rozgrywek FLS.
            </p>

            {record && (
              <div className={styles.heroMeta}>
                <RecordBadge record={record} />
                <div className={styles.formRow}>
                  <span className={styles.formLabel}>Ostatnia forma</span>
                  <FormGuide guide={record.formGuide} max={8} />
                </div>
              </div>
            )}

            <div className={styles.ctaRow}>
              <LinkButton href="/players" variant="gold">
                Zobacz skład
              </LinkButton>
              <LinkButton href="/compare" variant="ghost">
                Porównaj zawodników
              </LinkButton>
            </div>
          </div>

          <div className={styles.heroArt}>
            <HeroBadge size={280} />
          </div>
        </div>
        <GradualBlur position="bottom" strength={2.5} height="6rem" divCount={6} curve="bezier" />
      </section>

      <FlowingMenuSection />

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
            <StatCard label="Punkty" value={record.points} icon={<TargetIcon />}>
              <ProgressBar
                value={record.points}
                target={pointsTarget}
                caption={
                  <>
                    <strong>{record.points}</strong> / {pointsTarget} pkt do awansu
                  </>
                }
              />
            </StatCard>
          </div>
          <p className={styles.rosterNote}>{rosterSize} zawodników w bazie</p>
        </section>
      )}

      {topScorers.length > 0 && (
        <section className="section container">
          <SectionHeading
            eyebrow="Skład"
            title="Najlepsi strzelcy"
            action={<LinkButton href="/players" variant="navy">Cały skład</LinkButton>}
          />
          <RosterGrid players={topScorers} />
        </section>
      )}

      {recentMatches.length > 0 && (
        <section id="terminarz" className="section container">
          <SectionHeading eyebrow="Terminarz" title="Ostatnie mecze" />
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
