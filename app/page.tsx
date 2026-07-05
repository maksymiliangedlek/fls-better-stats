import Image from "next/image";
import { getTeamOverview } from "@/lib/data/queries";
import { RecordBadge } from "@/components/stats/RecordBadge";
import { FormGuide } from "@/components/stats/FormGuide";
import { StatCard } from "@/components/stats/StatCard";
import { RosterGrid } from "@/components/roster/RosterGrid";
import { MatchList } from "@/components/stats/MatchList";
import { SectionShell } from "@/components/stats/SectionShell";
import { SectionHeading } from "@/components/stats/SectionHeading";
import { LinkButton } from "@/components/ui/Button";
import GradualBlur from "@/components/effects/gradual-blur/GradualBlur";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data } = await getTeamOverview();
  const { team, record, rosterSize, topScorers, recentMatches } = data;

  return (
    <>
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroText}>
            <span className="eyebrow">{team?.league ?? "FLS Kraków"} · {team?.season ?? "Sezon"}</span>
            <h1>
              Ogniwo <span className={styles.gold}>Bielany</span>
            </h1>
            <p className={styles.lead}>
              Statystyki, forma i porównania zawodników klubu — wszystko w jednym
              miejscu, aktualizowane na podstawie danych z rozgrywek FLS.
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
            <div className={styles.crestWrap}>
              <Image src="/crest.png" alt="Herb Ogniwo Bielany" width={260} height={260} priority />
            </div>
          </div>
        </div>
        <GradualBlur position="bottom" strength={2.5} height="5rem" divCount={6} curve="bezier" />
      </section>

      {record && (
        <section className="section container">
          <div className={styles.statGrid}>
            <StatCard label="Mecze" value={record.played} accent />
            <StatCard
              label="Bramki"
              value={record.goalsFor}
              sub={`${record.goalsAgainst} straconych`}
            />
            <StatCard
              label="Bilans bramek"
              value={record.goalDifference > 0 ? `+${record.goalDifference}` : record.goalDifference}
            />
            <StatCard label="Punkty" value={record.points} sub={`${rosterSize} zawodników`} accent />
          </div>
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
        <section className="section container">
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
