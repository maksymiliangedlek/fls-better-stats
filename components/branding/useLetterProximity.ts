"use client";
import { useEffect, useRef, type RefObject } from "react";

const RADIUS = 130;
const MAX_SCALE = 0.16;
const MAX_LIFT_EM = 0.05;

function falloff(distance: number): number {
  if (distance >= RADIUS) return 0;
  // Gaussian: soft peak right under the cursor, fading smoothly to the edge.
  return Math.exp(-((distance / (RADIUS / 2)) ** 2) / 2);
}

function useMousePositionRef(containerRef: RefObject<HTMLElement | null>) {
  const positionRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const updatePosition = (x: number, y: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      positionRef.current = rect ? { x: x - rect.left, y: y - rect.top } : { x, y };
    };
    const handleMouseMove = (ev: MouseEvent) => updatePosition(ev.clientX, ev.clientY);
    const handleTouchMove = (ev: TouchEvent) => {
      const touch = ev.touches[0];
      if (touch) updatePosition(touch.clientX, touch.clientY);
    };
    const handleLeave = () => {
      positionRef.current = { x: -9999, y: -9999 };
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseleave", handleLeave);
    };
  }, [containerRef]);

  return positionRef;
}

/**
 * Adapted from React Bits' VariableProximity for a display font (Anton) that
 * has no variable axes: instead of interpolating font-variation-settings,
 * each letter gets a `--prox` custom property (drives color/glow in CSS)
 * plus a direct scale/lift transform, updated on a rAF loop by cursor
 * distance — same proximity-radius-falloff idea, different output channel.
 */
export function useLetterProximity(
  containerRef: RefObject<HTMLElement | null>,
  letterRefs: RefObject<(HTMLElement | null)[]>,
  enabled: boolean,
) {
  const mousePositionRef = useMousePositionRef(containerRef);

  useEffect(() => {
    if (!enabled) {
      for (const el of letterRefs.current) {
        if (!el) continue;
        el.style.removeProperty("--prox");
        el.style.transform = "";
      }
      return;
    }

    let frameId: number;
    const loop = () => {
      const container = containerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const { x, y } = mousePositionRef.current;
        for (const el of letterRefs.current) {
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2 - containerRect.left;
          const cy = rect.top + rect.height / 2 - containerRect.top;
          const value = falloff(Math.hypot(x - cx, y - cy));
          el.style.setProperty("--prox", value.toFixed(3));
          const scale = 1 + value * MAX_SCALE;
          const lift = -value * MAX_LIFT_EM;
          el.style.transform = `scale(${scale.toFixed(3)}) translateY(${lift.toFixed(3)}em)`;
        }
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [containerRef, letterRefs, enabled, mousePositionRef]);
}
