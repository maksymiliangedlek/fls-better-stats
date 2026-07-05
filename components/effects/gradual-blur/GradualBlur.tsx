"use client";
/**
 * GradualBlur — progressive (layered) blur overlay.
 * Vendored from ReactBits (TS-CSS variant), refactored to use native Math
 * instead of mathjs. Renders a stack of blurred slices masked with gradients
 * to create a smooth clear -> blur reveal at an edge of its parent.
 */
import React, { useMemo, type CSSProperties, type PropsWithChildren } from "react";
import "./GradualBlur.css";

type Position = "top" | "bottom" | "left" | "right";
type Curve = "linear" | "bezier" | "ease-in" | "ease-out" | "ease-in-out";

export interface GradualBlurProps {
  position?: Position;
  strength?: number;
  height?: string;
  width?: string;
  divCount?: number;
  exponential?: boolean;
  zIndex?: number;
  opacity?: number;
  curve?: Curve;
  target?: "parent" | "page";
  className?: string;
  style?: CSSProperties;
  responsive?: boolean;
  mobileHeight?: string;
  tabletHeight?: string;
}

const CURVE_FACTORS: Record<Curve, (p: number) => number> = {
  linear: (p) => p,
  bezier: (p) => p * p * (3 - 2 * p),
  "ease-in": (p) => p * p,
  "ease-out": (p) => 1 - (1 - p) * (1 - p),
  "ease-in-out": (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
};

function GradualBlur(props: PropsWithChildren<GradualBlurProps>) {
  const {
    position = "bottom",
    strength = 2,
    height = "6rem",
    width,
    divCount = 5,
    exponential = false,
    zIndex = 5,
    opacity = 1,
    curve = "linear",
    target = "parent",
    className = "",
    style,
    children,
  } = props;

  const isVertical = position === "top" || position === "bottom";
  const curveFn = CURVE_FACTORS[curve] ?? CURVE_FACTORS.linear;

  const layers = useMemo(() => {
    const increment = 100 / divCount;
    const nodes: React.ReactNode[] = [];

    for (let i = 1; i <= divCount; i++) {
      const rawProgress = i / divCount;
      const progress = curveFn(rawProgress);

      const blurValue = exponential
        ? Math.pow(2, progress * 4) * 0.0625 * strength
        : 0.0625 * (progress * divCount + 1) * strength;

      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      const direction = {
        top: "to top",
        bottom: "to bottom",
        left: "to left",
        right: "to right",
      }[position];

      const maskImage = `linear-gradient(${direction}, ${gradient})`;

      nodes.push(
        <div
          key={i}
          className="gb-layer"
          style={{
            position: "absolute",
            inset: 0,
            backdropFilter: `blur(${blurValue.toFixed(3)}px)`,
            WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}px)`,
            maskImage,
            WebkitMaskImage: maskImage,
            opacity,
          }}
        />,
      );
    }
    return nodes;
  }, [curveFn, divCount, exponential, opacity, position, strength]);

  const containerStyle: CSSProperties = {
    position: target === "page" ? "fixed" : "absolute",
    zIndex,
    pointerEvents: "none",
    ...(isVertical
      ? { left: 0, right: 0, height, [position]: 0 }
      : { top: 0, bottom: 0, width: width ?? height, [position]: 0 }),
    ...style,
  };

  return (
    <div
      className={`gradual-blur gradual-blur-${position} ${className}`.trim()}
      style={containerStyle}
      aria-hidden
    >
      <div className="gradual-blur-inner" style={{ position: "relative", width: "100%", height: "100%" }}>
        {layers}
      </div>
      {children}
    </div>
  );
}

export default GradualBlur;
