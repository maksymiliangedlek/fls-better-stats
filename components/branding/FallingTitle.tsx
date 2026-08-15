"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { motion, type Easing } from "motion/react";
import { FLY_DURATION } from "./FlyingDuck";
import styles from "./FallingTitle.module.css";

const WORDS = ["OGNIWO", "BIELANY"] as const;
/** arrive → contact → bounce apart → settle, ending with the duck. */
const TIMES = [0, 0.5, 0.62, 1];
const EASE: Easing[] = ["easeIn", "easeOut", "easeInOut"];
/** How far letters collapse toward their word's centre while travelling. */
const SQUEEZE_EM = 0.45;

type Geo = {
  start: [number, number];
  knock: number;
  rebound: number;
  squeeze: number;
};

export function FallingTitle({ active, reduced }: { active: boolean; reduced: boolean }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const wordRefs = [useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null)];
  const [geo, setGeo] = useState<Geo | null>(null);

  useLayoutEffect(() => {
    const h1 = titleRef.current;
    const [a, b] = wordRefs.map((r) => r.current);
    if (!h1 || !a || !b) return;

    // Shrink the type until the whole line fits, then measure the collision.
    h1.style.setProperty("--fit", "1");
    const cs = getComputedStyle(h1);
    const available =
      h1.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const natural = b.getBoundingClientRect().right - a.getBoundingClientRect().left;
    const fit = natural > 0 ? Math.min(1, (available * 0.98) / natural) : 1;
    h1.style.setProperty("--fit", String(fit));

    const fontSize = parseFloat(getComputedStyle(a).fontSize);
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    const squeeze = SQUEEZE_EM * fontSize;
    // Collapsing letters inward widens the gap, so the words must travel past
    // their resting spot by that much again to actually touch.
    const midA = (WORDS[0].length - 1) / 2;
    const midB = (WORDS[1].length - 1) / 2;
    const close = rb.left - ra.right + (midA + midB) * squeeze;
    setGeo({
      start: [-(ra.right + 80), window.innerWidth - rb.left + 80],
      knock: close / 2,
      rebound: close * 0.14,
      squeeze,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = active && geo && !reduced;

  return (
    <h1
      ref={titleRef}
      className={styles.title}
      data-ready={geo ? "" : undefined}
      aria-label="OGNIWO BIELANY"
    >
      {WORDS.map((word, w) => {
          const letters = word.split("");
          const mid = (letters.length - 1) / 2;
          const inward = w === 0 ? 1 : -1;

          return (
            <motion.span
              key={word}
              ref={wordRefs[w]}
              className={styles.word}
              animate={
                run
                  ? {
                      x: [geo.start[w], inward * geo.knock, -inward * geo.rebound, 0],
                      rotate: [0, inward * -1.2, inward * 0.5, 0],
                    }
                  : undefined
              }
              transition={run ? { duration: FLY_DURATION, times: TIMES, ease: EASE } : { duration: 0 }}
            >
              {letters.map((ch, i) => {
                const off = geo ? (mid - i) * geo.squeeze : 0;
                const contact = w === 0 ? i === letters.length - 1 : i === 0;
                return (
                  <motion.span
                    key={`${ch}${i}`}
                    className={styles.letter}
                    animate={
                      run
                        ? {
                            x: [off, off, off * 0.5, 0],
                            scaleX: contact ? [1, 1, 0.84, 1] : [1, 1, 0.95, 1],
                            scaleY: contact ? [1, 1, 1.1, 1] : [1, 1, 1, 1],
                          }
                        : undefined
                    }
                    transition={
                      run ? { duration: FLY_DURATION, times: TIMES, ease: EASE } : { duration: 0 }
                    }
                  >
                    {ch}
                  </motion.span>
                );
            })}
          </motion.span>
        );
      })}
    </h1>
  );
}
