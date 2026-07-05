import type { TeamRecord } from "@/lib/stats/aggregates";
import styles from "./RecordBadge.module.css";

export function RecordBadge({ record }: { record: TeamRecord }) {
  const items: { label: string; value: number; key: string }[] = [
    { label: "Zwycięstwa", value: record.wins, key: "w" },
    { label: "Remisy", value: record.draws, key: "d" },
    { label: "Porażki", value: record.losses, key: "l" },
  ];
  return (
    <div className={styles.badge}>
      {items.map((it) => (
        <div key={it.key} className={`${styles.item} ${styles[it.key]}`}>
          <span className={styles.value}>{it.value}</span>
          <span className={styles.label}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}
