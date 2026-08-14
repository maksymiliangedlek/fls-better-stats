"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Crest } from "./Crest";
import { FlyingDuck } from "./FlyingDuck";
import { FallingTitle } from "./FallingTitle";
import { FlowingMenuSection } from "@/components/effects/FlowingMenuSection";
import { usePrefersReducedMotion } from "@/lib/client/useMediaQuery";
import styles from "./HomeLanding.module.css";

export function HomeLanding() {
  const reduced = usePrefersReducedMotion();
  const [titleIn, setTitleIn] = useState(reduced);
  const landingRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [pin, setPin] = useState<{ x: number; y: number; startX: number } | null>(null);

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
      startX: window.innerWidth - crestCenterX + 280,
    });
    setTitleIn(true);
  }, []);

  useEffect(() => {
    if (!reduced) return;
    setTitleIn(true);
  }, [reduced]);

  return (
    <section ref={landingRef} className={styles.landing}>
      {!reduced && pin && (
        <div className={styles.duckFlyWrap}>
          <FlyingDuck originX={pin.x} originY={pin.y} startX={pin.startX} />
        </div>
      )}
      <div className={styles.brand}>
        <div ref={stageRef} className={styles.stage}>
          <div className={styles.crest}>
            <Crest size={176} src="/crest-ring.png" priority />
          </div>
        </div>
        <FallingTitle active={titleIn} reduced={reduced} />
      </div>
      <div className={styles.menu}>
        <FlowingMenuSection fill />
      </div>
    </section>
  );
}
