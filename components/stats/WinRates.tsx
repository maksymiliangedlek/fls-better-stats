import type { PlayerWinRates, WinRate } from "@/lib/stats/winrate";
import styles from "./WinRates.module.css";

function formatRate(rate: WinRate): string {
  return `${rate.winRate.toFixed(1).replace(".", ",")}%`;
}

function WinRateCard({
  label,
  rate,
  baseline,
}: {
  label: string;
  rate: WinRate;
  baseline?: WinRate;
}) {
  const diff = baseline ? Math.round((rate.winRate - baseline.winRate) * 10) / 10 : null;

  return (
    <div className={styles.card}>
      <span className={styles.label}>{label}</span>
      {rate.games > 0 ? (
        <>
          <span className={styles.value}>{formatRate(rate)}</span>
          <div className={styles.bar} role="presentation">
            <span className={styles.win} style={{ width: `${(rate.wins / rate.games) * 100}%` }} />
            <span className={styles.draw} style={{ width: `${(rate.draws / rate.games) * 100}%` }} />
            <span className={styles.loss} style={{ width: `${(rate.losses / rate.games) * 100}%` }} />
          </div>
          <span className={styles.record}>
            {rate.wins}Z · {rate.draws}R · {rate.losses}P
            <span className={styles.sample}> z {rate.games} meczów</span>
          </span>
          {diff !== null && diff !== 0 && (
            <span className={diff > 0 ? styles.up : styles.down}>
              {diff > 0 ? "+" : "−"}
              {Math.abs(diff).toFixed(1).replace(".", ",")} pkt proc. względem wszystkich meczów
            </span>
          )}
        </>
      ) : (
        <span className={styles.empty}>Brak takich meczów</span>
      )}
    </div>
  );
}

export function WinRates({ rates }: { rates: PlayerWinRates }) {
  return (
    <div className={styles.grid}>
      <WinRateCard label="Gdy grał" rate={rates.played} />
      <WinRateCard label="Gdy strzelał" rate={rates.scored} baseline={rates.played} />
      <WinRateCard label="Gdy asystował" rate={rates.assisted} baseline={rates.played} />
    </div>
  );
}
