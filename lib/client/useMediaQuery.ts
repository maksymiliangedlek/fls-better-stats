"use client";
import { useEffect, useState } from "react";

/** Subscribe to a CSS media query. Returns false during SSR / first paint. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** True on devices with a precise pointer (mouse/trackpad), i.e. not touch. */
export function usePointerFine(): boolean {
  return useMediaQuery("(pointer: fine)");
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 639px)");
}

export function useIsTabletDown(): boolean {
  return useMediaQuery("(max-width: 1023px)");
}
