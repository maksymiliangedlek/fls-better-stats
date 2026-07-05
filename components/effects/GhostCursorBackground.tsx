"use client";
import dynamic from "next/dynamic";
import { usePointerFine, usePrefersReducedMotion } from "@/lib/client/useMediaQuery";

const GhostCursor = dynamic(() => import("./ghost-cursor/GhostCursor"), { ssr: false });

/**
 * Fixed, full-viewport ambient background layer sitting behind all content.
 * Only mounts the WebGL cursor on precise-pointer devices without reduced-motion;
 * otherwise falls back to a static navy gradient wash.
 */
export function GhostCursorBackground() {
  const pointerFine = usePointerFine();
  const reducedMotion = usePrefersReducedMotion();
  const showCursor = pointerFine && !reducedMotion;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background:
          "radial-gradient(1200px 800px at 80% -10%, rgba(12,69,99,0.10), transparent 60%), radial-gradient(900px 600px at -10% 20%, rgba(201,162,39,0.06), transparent 55%)",
      }}
    >
      {showCursor && <GhostCursor color="#0c4563" />}
    </div>
  );
}
