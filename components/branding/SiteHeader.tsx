"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crest } from "./Crest";
import styles from "./SiteHeader.module.css";

const NAV = [
  { href: "/mecze", label: "Mecze" },
  { href: "/players", label: "Zawodnicy" },
  { href: "/compare", label: "Porównaj" },
  { href: "/zdjecia", label: "Zdjęcia" },
];

export function SiteHeader() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />
      <header className={styles.island}>
        <Link href="/" className={styles.crest} aria-label="Ogniwo Bielany — drużyna">
          <Crest size={28} priority />
        </Link>
        <nav className={styles.nav} aria-label="Główne">
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
      </header>
    </>
  );
}
