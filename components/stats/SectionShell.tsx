import type { CSSProperties, ReactNode } from "react";
import GradualBlur from "../effects/gradual-blur/GradualBlur";

/**
 * A rounded surface panel that hosts a GradualBlur fade at its bottom edge,
 * giving tall data sections (tables, match lists) a glass/depth reveal.
 */
export function SectionShell({
  children,
  blur = true,
  maxHeight,
  className = "",
}: {
  children: ReactNode;
  blur?: boolean;
  maxHeight?: number;
  className?: string;
}) {
  const style: CSSProperties = {
    position: "relative",
    overflow: "hidden",
    borderRadius: "var(--radius)",
    background: "var(--surface)",
    border: "1px solid var(--c-line)",
    boxShadow: "var(--shadow-sm)",
    maxHeight,
  };

  return (
    <div style={style} className={className}>
      {children}
      {blur && (
        <GradualBlur
          position="bottom"
          strength={2}
          height="5rem"
          divCount={5}
          curve="bezier"
          opacity={1}
          zIndex={4}
          responsive
          mobileHeight="3.5rem"
        />
      )}
    </div>
  );
}
