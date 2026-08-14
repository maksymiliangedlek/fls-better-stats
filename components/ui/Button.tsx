import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "gold" | "ghost" | "navy";

function classNameFor(variant: Variant) {
  return `${styles.btn} ${styles[variant]}`;
}

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
    <Link href={href} className={classNameFor(variant)}>
      {children}
    </Link>
  );
}

export function Button({
  children,
  variant = "navy",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button className={`${classNameFor(variant)} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
