"use client";
import { motion } from "motion/react";
import { FLY_DURATION } from "./FlyingDuck";
import styles from "./FallingTitle.module.css";

const times = [0, 0.52, 0.7, 1];
const ease = ["easeIn", "easeOut", [0.22, 1, 0.36, 1]] as const;

export function FallingTitle({ active, reduced }: { active: boolean; reduced: boolean }) {
  return (
    <h1 className={styles.title} aria-label="OGNIWO BIELANY">
      <Word
        reduced={reduced}
        active={active}
        from="-78vw"
        collide="5vw"
        rebound="-1vw"
        tilt={[-1.5, 2, -0.4, 0]}
      >
        OGNIWO
      </Word>
      <span className={styles.space} aria-hidden>
        {"\u00A0"}
      </span>
      <Word
        reduced={reduced}
        active={active}
        from="78vw"
        collide="-5vw"
        rebound="1vw"
        tilt={[1.5, -2, 0.4, 0]}
      >
        BIELANY
      </Word>
    </h1>
  );
}

function Word({
  children,
  from,
  collide,
  rebound,
  tilt,
  active,
  reduced,
}: {
  children: string;
  from: string;
  collide: string;
  rebound: string;
  tilt: number[];
  active: boolean;
  reduced: boolean;
}) {
  return (
    <motion.span
      className={styles.word}
      initial={reduced ? false : { x: from, rotate: tilt[0], letterSpacing: "0.08em" }}
      animate={
        active
          ? {
              x: [from, collide, rebound, "0vw"],
              rotate: tilt,
              letterSpacing: ["0.08em", "0.1em", "0.28em", "0.5em"],
            }
          : reduced
            ? undefined
            : { x: from, rotate: tilt[0], letterSpacing: "0.08em" }
      }
      transition={
        reduced
          ? { duration: 0 }
          : { duration: FLY_DURATION, times, ease }
      }
    >
      {children}
    </motion.span>
  );
}
