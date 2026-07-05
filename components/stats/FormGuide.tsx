import styles from "./FormGuide.module.css";

type Result = "W" | "D" | "L";

const LABEL: Record<Result, string> = { W: "Z", D: "R", L: "P" };

/** Glowing LED-bar form strip. Input is oldest->newest; shows the last `max`. */
export function FormGuide({ guide, max = 8 }: { guide: Result[]; max?: number }) {
  const recent = [...guide].slice(-max);
  return (
    <div className={styles.row} aria-label="Forma">
      {recent.map((r, i) => (
        <span key={i} className={`${styles.led} ${styles[r]}`} title={r}>
          <span className={styles.tag}>{LABEL[r]}</span>
        </span>
      ))}
    </div>
  );
}
