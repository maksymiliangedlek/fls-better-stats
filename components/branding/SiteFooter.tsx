import { Crest } from "./Crest";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <Crest size={32} />
          <span>Ogniwo Bielany</span>
        </div>
        <p className={styles.note}>
          Nieoficjalne statystyki · dane z{" "}
          <a
            href="https://rozgrywki.krakow.liga-fls.pl"
            target="_blank"
            rel="noreferrer"
            className={styles.link}
          >
            FLS Kraków
          </a>
        </p>
      </div>
    </footer>
  );
}
