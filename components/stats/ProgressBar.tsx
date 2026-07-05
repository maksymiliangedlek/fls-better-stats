import type { ReactNode } from "react";
import styles from "./ProgressBar.module.css";

/** Linear progress toward a target (e.g. points needed for promotion). */
export function ProgressBar({
  value,
  target,
  caption,
}: {
  value: number;
  target: number;
  caption?: ReactNode;
}) {
  const pct = Math.max(0, Math.min(100, (value / target) * 100));
  return (
    <div className={styles.wrap}>
      <div className={styles.track}>
        <span className={styles.fill} style={{ width: `${pct}%` }} />
        <span className={styles.marker} style={{ left: "100%" }} />
      </div>
      <div className={styles.caption}>
        {caption ?? (
          <>
            <strong>{value}</strong> / {target} pkt
          </>
        )}
      </div>
    </div>
  );
}
