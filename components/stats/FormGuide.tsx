import styles from "./FormGuide.module.css";

type Result = "W" | "D" | "L";

const LABEL: Record<Result, string> = { W: "Z", D: "R", L: "P" };

/** Renders the most-recent `max` results (newest first). Input is oldest->newest. */
export function FormGuide({ guide, max = 8 }: { guide: Result[]; max?: number }) {
  const recent = [...guide].slice(-max).reverse();
  return (
    <div className={styles.row} aria-label="Forma">
      {recent.map((r, i) => (
        <span key={i} className={`${styles.pill} ${styles[r]}`} title={r}>
          {LABEL[r]}
        </span>
      ))}
    </div>
  );
}
