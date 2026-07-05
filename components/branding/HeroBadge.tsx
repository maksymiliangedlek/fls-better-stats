import Image from "next/image";
import styles from "./HeroBadge.module.css";

/**
 * Sculpted metal badge housing the club crest — polished navy/gold rings with
 * beveled edges, integrated into the hero panel.
 */
export function HeroBadge({ size = 260 }: { size?: number }) {
  return (
    <div className={styles.badge} style={{ width: size, height: size }}>
      <div className={styles.ringOuter} />
      <div className={styles.ringGold} />
      <div className={styles.ringInner} />
      <div className={styles.face}>
        <Image
          src="/crest.png"
          alt="Herb Ogniwo Bielany"
          width={Math.round(size * 0.6)}
          height={Math.round(size * 0.6)}
          priority
          className={styles.crest}
        />
      </div>
      <div className={styles.sheen} />
    </div>
  );
}
