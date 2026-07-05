import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "gold" | "ghost" | "navy";

export function LinkButton({
  href,
  children,
  variant = "gold",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <Link href={href} className={`${styles.btn} ${styles[variant]}`}>
      {children}
    </Link>
  );
}
