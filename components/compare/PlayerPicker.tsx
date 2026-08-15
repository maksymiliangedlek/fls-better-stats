"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { LeaderboardEntry } from "@/lib/stats/leaderboards";
import { usePrefersReducedMotion } from "@/lib/client/useMediaQuery";
import styles from "./PlayerPicker.module.css";

const SPRING = { type: "spring" as const, bounce: 0, duration: 0.3 };

export function PlayerPicker({
  players,
  value,
  onChange,
  label,
  accent,
  excludeSlugs,
}: {
  players: LeaderboardEntry[];
  value: string | null;
  onChange: (slug: string) => void;
  label: string;
  accent: "gold" | "navy" | "wine";
  excludeSlugs?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();
  const reduced = usePrefersReducedMotion();

  const selected = players.find((p) => p.slug === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players
      .filter((p) => !excludeSlugs?.includes(p.slug))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .slice(0, 60);
  }, [players, query, excludeSlugs]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const commit = (slug: string) => {
    onChange(slug);
    setOpen(false);
    setQuery("");
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      commit(filtered[activeIndex].slug);
    }
  };

  const activeId = filtered[activeIndex] ? `${listId}-${filtered[activeIndex].slug}` : undefined;

  return (
    <div className={`${styles.picker} ${styles[accent]}`} ref={ref}>
      <span className={styles.label}>{label}</span>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
      >
        {selected ? (
          <span className={styles.selectedName}>{selected.name}</span>
        ) : (
          <span className={styles.placeholder}>Wybierz zawodnika…</span>
        )}
        <span className={styles.chevron} aria-hidden="true">
          ▾
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.dropdown}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
            transition={reduced ? { duration: 0.2 } : SPRING}
            style={{ transformOrigin: "top center" }}
            onKeyDown={onListKeyDown}
          >
            <input
              autoFocus
              className={styles.search}
              placeholder="Szukaj…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-controls={listId}
              aria-activedescendant={activeId}
            />
            <ul className={styles.options} role="listbox" id={listId}>
              {filtered.map((p, i) => (
                <li key={p.slug} role="presentation">
                  <button
                    type="button"
                    id={`${listId}-${p.slug}`}
                    role="option"
                    aria-selected={p.slug === value}
                    className={`${styles.option} ${p.slug === value ? styles.optionActive : ""} ${
                      i === activeIndex ? styles.optionFocus : ""
                    }`}
                    onClick={() => commit(p.slug)}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <span>{p.name}</span>
                    <span className={styles.optMeta}>
                      {p.goals}G · {p.assists}A
                    </span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className={styles.noResults} role="option" aria-selected={false}>
                  Brak wyników
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
