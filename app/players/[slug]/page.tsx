import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayerDetail } from "@/lib/data/queries";
import { PlayerCharts } from "@/components/charts/PlayerCharts";
import { GameLogList } from "@/components/stats/GameLogList";
import { SectionShell } from "@/components/stats/SectionShell";
import { SectionHeading } from "@/components/stats/SectionHeading";
import { LinkButton } from "@/components/ui/Button";
import { ageFrom } from "@/lib/client/format";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPlayerDetail(slug);
  const name = result?.data.profile.summary.name ?? "Zawodnik";
  return { title: `${name} — Ogniwo Bielany` };
}

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPlayerDetail(slug);
  if (!result) notFound();

  const { profile, stats } = result.data;
  const s = profile.summary;
  const age = ageFrom(s.dateOfBirth);

  const groups = [
    {
      label: "Dorobek",
      stats: [
        { label: "Mecze", value: s.games },
        { label: "Bramki", value: s.goals },
        { label: "Asysty", value: s.assists },
        { label: "G+A", value: s.goalContributions },
      ],
    },
    {
      label: "Forma",
      stats: [
        { label: "MVP", value: s.mvp },
        { label: "Gole/mecz", value: s.goalsPerGame.toFixed(2) },
      ],
    },
    {
      label: "Dyscyplina",
      stats: [
        { label: "Żółte", value: s.yellowCards },
        { label: "Czerwone", value: s.redCards },
      ],
    },
  ];

  return (
    <>
      <section className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.avatar}
            src={s.avatar ?? "/crest.png"}
            alt={s.name}
          />
          <div className={styles.identity}>
            <nav className={styles.crumb} aria-label="Okruszki">
              <Link href="/players">Skład</Link>
              <span aria-hidden="true">/</span>
              <span>{s.name}</span>
            </nav>
            <h1 className={styles.name}>{s.name}</h1>
            <p className={styles.meta}>
              {age ? `${age} lat · ` : ""}
              {profile.seasons.length} sezonów w bazie
            </p>
            <div className={styles.groups}>
              {groups.map((g) => (
                <div key={g.label} className={styles.group}>
                  <span className={styles.groupLabel}>{g.label}</span>
                  <div className={styles.totals}>
                    {g.stats.map((t) => (
                      <div key={t.label} className={styles.stat}>
                        <span className={styles.statValue}>{t.value}</span>
                        <span className={styles.statLabel}>{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.actions}>
              <LinkButton href={`/compare?a=${profile.slug}`} variant="gold">
                Porównaj z…
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      <section className="section container">
        <SectionHeading eyebrow="Analiza" title="Wykresy" />
        <PlayerCharts stats={stats} />
      </section>

      {profile.games.length > 0 && (
        <section className="section container">
          <SectionHeading eyebrow="Historia" title="Mecze" />
          <SectionShell blur={profile.games.length > 8}>
            <GameLogList games={profile.games} />
          </SectionShell>
        </section>
      )}
    </>
  );
}
