import type { ComponentType, SVGProps } from "react";
import type { TeamRecord } from "@/lib/stats/aggregates";
import { TrophyIcon, HandshakeIcon, WhistleIcon } from "@/components/ui/icons";
import styles from "./RecordBadge.module.css";

type Item = {
  label: string;
  value: number;
  key: "w" | "d" | "l";
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export function RecordBadge({ record }: { record: TeamRecord }) {
  const items: Item[] = [
    { label: "Zwycięstwa", value: record.wins, key: "w", Icon: TrophyIcon },
    { label: "Remisy", value: record.draws, key: "d", Icon: HandshakeIcon },
    { label: "Porażki", value: record.losses, key: "l", Icon: WhistleIcon },
  ];
  return (
    <div className={styles.badge}>
      {items.map(({ label, value, key, Icon }) => (
        <div key={key} className={`${styles.item} ${styles[key]}`}>
          <span className={styles.icon}>
            <Icon />
          </span>
          <span className={styles.value}>{value}</span>
          <span className={styles.label}>{label}</span>
        </div>
      ))}
    </div>
  );
}
