"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crest } from "./Crest";
import styles from "./SiteHeader.module.css";

const NAV = [
  { href: "/", label: "Start" },
  { href: "/players", label: "Skład" },
  { href: "/compare", label: "Porównaj" },
];

export function SiteHeader() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand}>
          <Crest size={40} priority />
          <span className={styles.wordmark}>
            Ogniwo <span className={styles.gold}>Bielany</span>
          </span>
        </Link>
        <nav className={styles.nav}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.link} ${isActive(item.href) ? styles.active : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
