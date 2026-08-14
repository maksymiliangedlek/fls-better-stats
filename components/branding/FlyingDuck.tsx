"use client";
import { useRef } from "react";
import { motion } from "motion/react";
import styles from "./FlyingDuck.module.css";

export const FLY_DURATION = 2.2;

/** Steady glide with a soft deceleration into the crest — no snap at either end. */
const flyEase = [0.36, 0.06, 0.22, 1] as const;

export function FlyingDuck({
  originX,
  originY,
  startX,
  onLanded,
}: {
  originX: number;
  originY: number;
  startX: number;
  onLanded: () => void;
}) {
  const done = useRef(false);

  return (
    <motion.div
      className={styles.flyer}
      style={{ left: originX, top: originY }}
      initial={{ x: startX, y: -10, scale: 2.85, rotate: -5 }}
      animate={{
        x: 0,
        y: [-10, -16, -6, -12, -3, 0],
        scale: 1,
        rotate: [-5, -6, -3, -4, -1, 0],
      }}
      transition={{
        duration: FLY_DURATION,
        ease: flyEase,
        y: { duration: FLY_DURATION, ease: "easeInOut" },
        rotate: { duration: FLY_DURATION, ease: "easeInOut" },
      }}
      onAnimationComplete={() => {
        if (done.current) return;
        done.current = true;
        onLanded();
      }}
      aria-hidden
    >
      <div className={styles.duck}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={`${styles.wing} ${styles.wingFar}`} src="/duck-wing-left.png" alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.body} src="/duck-body.png" alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={`${styles.wing} ${styles.wingNear}`} src="/duck-wing-right.png" alt="" />
      </div>
    </motion.div>
  );
}
