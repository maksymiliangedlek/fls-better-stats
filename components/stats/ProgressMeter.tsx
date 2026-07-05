import styles from "./ProgressMeter.module.css";

/**
 * Diverging meter centered on a neutral point (0). Positive fills gold to the
 * right, negative fills red to the left. `range` sets the absolute max extent.
 */
export function ProgressMeter({ value, range }: { value: number; range: number }) {
  const clamped = Math.max(-range, Math.min(range, value));
  const pct = (Math.abs(clamped) / range) * 50;
  const positive = clamped >= 0;

  return (
    <div className={styles.meter}>
      <div className={styles.track}>
        <span className={styles.center} />
        <span
          className={`${styles.fill} ${positive ? styles.pos : styles.neg}`}
          style={positive ? { left: "50%", width: `${pct}%` } : { right: "50%", width: `${pct}%` }}
        />
      </div>
      <div className={styles.scale}>
        <span>-{range}</span>
        <span>0</span>
        <span>+{range}</span>
      </div>
    </div>
  );
}
