import type { ReactNode } from "react";
import styles from "./StatCard.module.css";

export function StatCard({
  label,
  value,
  sub,
  icon,
  children,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
  children?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`${styles.card} ${accent ? styles.accent : ""}`}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      <span className={styles.value}>{value}</span>
      {sub && <span className={styles.sub}>{sub}</span>}
      {children && <div className={styles.indicator}>{children}</div>}
    </div>
  );
}
