import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

/** Trophy — wins */
export function TrophyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v1a3 3 0 0 0 3 3" />
      <path d="M17 6h3v1a3 3 0 0 1-3 3" />
    </svg>
  );
}

/** Handshake — draws */
export function HandshakeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a2 2 0 0 0-2.8 0l-.8.8a1 1 0 0 1-1.4 0l-2-2a1 1 0 0 0-1.4 0L3 9" />
      <path d="m21 4-1.5 1.5" />
      <path d="M3 4l4 4" />
    </svg>
  );
}

/** Broken whistle — losses */
export function WhistleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 11a5 5 0 0 0 5 5h4l3.5 3.5a1 1 0 0 0 1.7-.7V16a5 5 0 0 0 0-10H8" />
      <path d="M3 11V7" />
      <path d="m7 9 2 3-2 2" opacity="0.5" />
    </svg>
  );
}

/** Football boot with ball — goals */
export function BootIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 6v7a3 3 0 0 0 3 3h9a5 5 0 0 0 5-5c0-2-1.5-3-3.5-3.5S13 8 12 6.5 10 4 8 4H3Z" />
      <path d="M3 16h17" />
      <circle cx="18.5" cy="17.5" r="1.5" />
    </svg>
  );
}

/** Balance scale — goal difference */
export function BalanceIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v18" />
      <path d="M7 21h10" />
      <path d="m3 8 4-4 4 4" />
      <path d="M3 8a2 2 0 0 0 4 0" />
      <path d="m13 8 4-4 4 4" />
      <path d="M13 8a2 2 0 0 0 4 0" />
    </svg>
  );
}

/** Target — points / promotion goal */
export function TargetIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Flag ball — matches / calendar accent */
export function MatchBallIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 3 2-1 3.5h-4L9 9l3-2Z" fill="currentColor" stroke="none" opacity="0.85" />
      <path d="M12 3v2M4.5 9l2 1M19.5 9l-2 1M7.5 20l1-2M16.5 20l-1-2" />
    </svg>
  );
}
