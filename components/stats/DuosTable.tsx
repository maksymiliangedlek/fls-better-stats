import Link from "next/link";
import type { Duo } from "@/lib/stats/chemistry";
import styles from "./DuosTable.module.css";

export function DuosTable({ duos }: { duos: Duo[] }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.rankCol}>#</th>
              <th className={styles.nameCol}>Zawodnik</th>
              <th className={styles.nameCol}>Partner</th>
              <th>Wspólne gole</th>
            </tr>
          </thead>
          <tbody>
            {duos.map((duo, i) => (
              <tr key={`${duo.a.slug}-${duo.b.slug}`}>
                <td className={styles.rankCol}>{i + 1}</td>
                <td className={styles.nameCol}>
                  <Link href={`/players/${duo.a.slug}`} className={styles.playerLink}>
                    {duo.a.name}
                  </Link>
                </td>
                <td className={styles.nameCol}>
                  <Link href={`/players/${duo.b.slug}`} className={styles.playerLink}>
                    {duo.b.name}
                  </Link>
                </td>
                <td className={styles.strong}>{duo.goals}</td>
              </tr>
            ))}
            {duos.length === 0 && (
              <tr>
                <td colSpan={4} className={styles.empty}>
                  Brak wspólnych goli w bazie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
