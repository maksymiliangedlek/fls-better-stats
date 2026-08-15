import Link from "next/link";
import type { PlayerBuddies } from "@/lib/stats/chemistry";
import styles from "./BestBuddies.module.css";

function goalsWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) return "gol";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "gole";
  return "goli";
}

function BuddyList({
  label,
  empty,
  buddies,
}: {
  label: string;
  empty: string;
  buddies: PlayerBuddies["to"];
}) {
  return (
    <div className={styles.card}>
      <span className={styles.label}>{label}</span>
      {buddies.length > 0 ? (
        <ol className={styles.list}>
          {buddies.map((buddy) => (
            <li key={buddy.slug} className={styles.row}>
              <Link href={`/players/${buddy.slug}`} className={styles.name}>
                {buddy.name}
              </Link>
              <span className={styles.count}>
                {buddy.count}
                <span className={styles.countLabel}> {goalsWord(buddy.count)}</span>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <span className={styles.empty}>{empty}</span>
      )}
    </div>
  );
}

export function BestBuddies({ buddies }: { buddies: PlayerBuddies }) {
  return (
    <div className={styles.grid}>
      <BuddyList
        label="Komu najczęściej asystował"
        empty="Brak powiązanych asyst"
        buddies={buddies.to}
      />
      <BuddyList
        label="Od kogo najczęściej dostawał"
        empty="Brak asyst od kolegów"
        buddies={buddies.from}
      />
    </div>
  );
}
