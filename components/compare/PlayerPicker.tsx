"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LeaderboardEntry } from "@/lib/stats/leaderboards";
import styles from "./PlayerPicker.module.css";

export function PlayerPicker({
  players,
  value,
  onChange,
  label,
  accent,
  excludeSlug,
}: {
  players: LeaderboardEntry[];
  value: string | null;
  onChange: (slug: string) => void;
  label: string;
  accent: "gold" | "navy";
  excludeSlug?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = players.find((p) => p.slug === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players
      .filter((p) => p.slug !== excludeSlug)
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .slice(0, 60);
  }, [players, query, excludeSlug]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className={`${styles.picker} ${styles[accent]}`} ref={ref}>
      <span className={styles.label}>{label}</span>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <span className={styles.selectedName}>{selected.name}</span>
        ) : (
          <span className={styles.placeholder}>Wybierz zawodnika…</span>
        )}
        <span className={styles.chevron}>▾</span>
      </button>

      {open && (
        <div className={styles.dropdown}>
          <input
            autoFocus
            className={styles.search}
            placeholder="Szukaj…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul className={styles.options} role="listbox">
            {filtered.map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  className={`${styles.option} ${p.slug === value ? styles.optionActive : ""}`}
                  onClick={() => {
                    onChange(p.slug);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <span>{p.name}</span>
                  <span className={styles.optMeta}>
                    {p.goals}G · {p.assists}A
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className={styles.noResults}>Brak wyników</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
