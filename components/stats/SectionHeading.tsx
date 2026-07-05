import type { ReactNode } from "react";
import styles from "./SectionHeading.module.css";

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.wrap}>
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className={styles.title}>{title}</h2>
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
