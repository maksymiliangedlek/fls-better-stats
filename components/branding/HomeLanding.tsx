"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Crest } from "./Crest";
import { FlowingMenuSection } from "@/components/effects/FlowingMenuSection";
import { usePrefersReducedMotion } from "@/lib/client/useMediaQuery";
import styles from "./HomeLanding.module.css";

const duckSpring = { type: "spring" as const, bounce: 0.18, duration: 0.85 };
const crestSpring = { type: "spring" as const, bounce: 0, duration: 0.45 };
const titleSpring = { type: "spring" as const, bounce: 0, duration: 0.5 };

export function HomeLanding() {
  const reduced = usePrefersReducedMotion();
  const [crestIn, setCrestIn] = useState(reduced);
  const [duckGone, setDuckGone] = useState(reduced);
  const [titleIn, setTitleIn] = useState(reduced);

  return (
    <section className={styles.landing}>
      <div className={styles.brand}>
        <div className={styles.emblem}>
          <AnimatePresence>
            {!duckGone && (
              <motion.img
                key="duck"
                src="/duck.png"
                alt=""
                className={styles.duck}
                initial={reduced ? false : { x: "42vw", y: "-18vh", rotate: -22, scale: 0.45, opacity: 0 }}
                animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: crestIn ? 0 : 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={reduced ? { duration: 0 } : duckSpring}
                onAnimationComplete={() => {
                  if (!crestIn) setCrestIn(true);
                }}
              />
            )}
          </AnimatePresence>
          <motion.div
            className={styles.crest}
            initial={reduced ? false : { opacity: 0, scale: 0.86 }}
            animate={crestIn ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.86 }}
            transition={reduced ? { duration: 0 } : crestSpring}
            onAnimationComplete={() => {
              if (crestIn) {
                setDuckGone(true);
                setTitleIn(true);
              }
            }}
          >
            <Crest size={118} priority />
          </motion.div>
        </div>
        <motion.h1
          className={styles.title}
          initial={reduced ? false : { opacity: 0, y: 32 }}
          animate={titleIn ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
          transition={reduced ? { duration: 0.2 } : titleSpring}
        >
          OGNIWO BIELANY
        </motion.h1>
      </div>
      <div className={styles.menu}>
        <FlowingMenuSection fill />
      </div>
    </section>
  );
}
