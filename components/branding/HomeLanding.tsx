"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Crest } from "./Crest";
import { FlyingDuck } from "./FlyingDuck";
import { FlowingMenuSection } from "@/components/effects/FlowingMenuSection";
import { usePrefersReducedMotion } from "@/lib/client/useMediaQuery";
import styles from "./HomeLanding.module.css";

/** The duck's last frame equals the crest's duck, so the swap is a hard cut. */
const instant = { duration: 0 };
const titleReveal = { type: "spring" as const, bounce: 0, duration: 0.75 };

export function HomeLanding() {
  const reduced = usePrefersReducedMotion();
  const [crestIn, setCrestIn] = useState(reduced);
  const [titleIn, setTitleIn] = useState(reduced);
  const [flyDone, setFlyDone] = useState(reduced);
  const landingRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [pin, setPin] = useState<{ x: number; y: number; startX: number } | null>(null);

  const finishFly = () => {
    setFlyDone(true);
    setCrestIn(true);
    setTitleIn(true);
  };

  useLayoutEffect(() => {
    const landing = landingRef.current;
    const stage = stageRef.current;
    if (!landing || !stage) return;
    const lb = landing.getBoundingClientRect();
    const sb = stage.getBoundingClientRect();
    const crestCenterX = sb.left + sb.width / 2;
    setPin({
      x: crestCenterX - lb.left,
      y: sb.top + sb.height / 2 - lb.top,
      // Clear the right edge by a full duck width so it enters from off-screen.
      startX: window.innerWidth - crestCenterX + 240,
    });
  }, []);

  useEffect(() => {
    if (!reduced) return;
    setFlyDone(true);
    setCrestIn(true);
    setTitleIn(true);
  }, [reduced]);

  return (
    <section ref={landingRef} className={styles.landing}>
      {!reduced && pin && (
        <motion.div
          className={styles.duckFlyWrap}
          initial={{ opacity: 1 }}
          animate={{ opacity: flyDone ? 0 : 1 }}
          transition={instant}
        >
          <FlyingDuck originX={pin.x} originY={pin.y} startX={pin.startX} onLanded={finishFly} />
        </motion.div>
      )}
      <div className={styles.brand}>
        <div ref={stageRef} className={styles.stage}>
          {/* Empty ring waits for the duck, then the full crest takes over. */}
          <div className={styles.crest} data-hidden={crestIn || undefined}>
            <Crest size={118} src="/crest-ring.png" priority />
          </div>
          <div className={styles.crest} data-hidden={!crestIn || undefined}>
            <Crest size={118} src="/crest.png" priority />
          </div>
        </div>
        <div className={styles.titleMask}>
          <motion.h1
            className={styles.title}
            initial={reduced ? false : { y: "115%" }}
            animate={titleIn ? { y: "0%" } : { y: "115%" }}
            transition={reduced ? { duration: 0 } : titleReveal}
          >
            OGNIWO BIELANY
          </motion.h1>
        </div>
      </div>
      <div className={styles.menu}>
        <FlowingMenuSection fill />
      </div>
    </section>
  );
}
