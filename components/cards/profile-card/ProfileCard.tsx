"use client";
/**
 * ProfileCard — holographic tilt/shine profile card.
 * Vendored from ReactBits (JS+CSS variant), ported to TS. Adapted for this app:
 * the avatar photo sits ABOVE the name, no image renders when avatarUrl is empty,
 * and the hover shimmer is intensified.
 *
 * Tilt is interruptible: springs from the live presentation value, 1:1 with the
 * pointer after a short hysteresis so vertical scroll still wins on touch.
 */
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import "./ProfileCard.css";

const DEFAULT_INNER_GRADIENT = "linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)";
const HYSTERESIS_PX = 10;
const FLICK_VELOCITY = 800;

const ANIMATION_CONFIG = {
  INITIAL_DURATION: 1200,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
  DEVICE_BETA_OFFSET: 20,
} as const;

const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v: number, precision = 3) => parseFloat(v.toFixed(precision));
const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) =>
  round(tMin + ((v - fMin) * (tMax - tMin)) / (fMax - fMin));

export interface ProfileCardProps {
  avatarUrl?: string | null;
  iconUrl?: string;
  grainUrl?: string;
  innerGradient?: string;
  behindGlowEnabled?: boolean;
  behindGlowColor?: string;
  behindGlowSize?: string;
  className?: string;
  enableTilt?: boolean;
  enableMobileTilt?: boolean;
  mobileTiltSensitivity?: number;
  miniAvatarUrl?: string | null;
  name?: string;
  title?: string;
  handle?: string;
  status?: string;
  contactText?: string;
  showUserInfo?: boolean;
  href?: string;
  onContactClick?: () => void;
}

function ProfileCardComponent({
  avatarUrl,
  iconUrl,
  grainUrl,
  innerGradient,
  behindGlowEnabled = true,
  behindGlowColor,
  behindGlowSize,
  className = "",
  enableTilt = true,
  enableMobileTilt = false,
  mobileTiltSensitivity = 5,
  miniAvatarUrl,
  name = "Player",
  title = "",
  handle = "player",
  status = "",
  contactText = "Contact",
  showUserInfo = true,
  href,
  onContactClick,
}: ProfileCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const leaveRafRef = useRef<number | null>(null);
  const gestureRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    mode: "undecided" | "tilt" | "scroll" | "press";
    moved: boolean;
    history: { x: number; y: number; t: number }[];
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    mode: "undecided",
    moved: false,
    history: [],
  });

  const tiltEngine = useMemo(() => {
    if (!enableTilt) return null;

    let rafId: number | null = null;
    let running = false;
    let lastTs = 0;

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let velX = 0;
    let velY = 0;
    let settling = false;
    let dampingRatio = 1;

    const DEFAULT_TAU = 0.14;
    const INITIAL_TAU = 0.6;
    let initialUntil = 0;

    const setVarsFromXY = (x: number, y: number) => {
      const shell = shellRef.current;
      const wrap = wrapRef.current;
      if (!shell || !wrap) return;

      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;

      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);

      const centerX = percentX - 50;
      const centerY = percentY - 50;

      const properties: Record<string, string> = {
        "--pointer-x": `${percentX}%`,
        "--pointer-y": `${percentY}%`,
        "--background-x": `${adjust(percentX, 0, 100, 35, 65)}%`,
        "--background-y": `${adjust(percentY, 0, 100, 35, 65)}%`,
        "--pointer-from-center": `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        "--pointer-from-top": `${percentY / 100}`,
        "--pointer-from-left": `${percentX / 100}`,
        "--rotate-x": `${round(-(centerX / 5))}deg`,
        "--rotate-y": `${round(centerY / 4)}deg`,
      };

      for (const [k, v] of Object.entries(properties)) wrap.style.setProperty(k, v);
    };

    const step = (ts: number) => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 1000, 0.032);
      lastTs = ts;

      if (settling) {
        const response = 0.35;
        const stiffness = (2 * Math.PI) / response;
        const k = stiffness * stiffness;
        const c = 2 * stiffness * dampingRatio;
        const ax = k * (targetX - currentX) - c * velX;
        const ay = k * (targetY - currentY) - c * velY;
        velX += ax * dt;
        velY += ay * dt;
        currentX += velX * dt;
        currentY += velY * dt;
      } else {
        const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
        const k = 1 - Math.exp(-dt / tau);
        currentX += (targetX - currentX) * k;
        currentY += (targetY - currentY) * k;
      }

      setVarsFromXY(currentX, currentY);

      const stillFar =
        Math.abs(targetX - currentX) > 0.05 ||
        Math.abs(targetY - currentY) > 0.05 ||
        Math.hypot(velX, velY) > 8;

      if (stillFar || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTs = 0;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTs = 0;
      rafId = requestAnimationFrame(step);
    };

    return {
      setImmediate(x: number, y: number) {
        currentX = x;
        currentY = y;
        targetX = x;
        targetY = y;
        velX = 0;
        velY = 0;
        settling = false;
        setVarsFromXY(currentX, currentY);
      },
      setTarget(x: number, y: number) {
        settling = false;
        targetX = x;
        targetY = y;
        start();
      },
      setVelocity(vx: number, vy: number) {
        velX = vx;
        velY = vy;
      },
      toCenter(releaseVx = 0, releaseVy = 0) {
        const shell = shellRef.current;
        if (!shell) return;
        settling = true;
        velX = releaseVx;
        velY = releaseVy;
        dampingRatio = Math.hypot(releaseVx, releaseVy) > FLICK_VELOCITY ? 0.8 : 1;
        targetX = shell.clientWidth / 2;
        targetY = shell.clientHeight / 2;
        start();
      },
      beginInitial(durationMs: number) {
        initialUntil = performance.now() + durationMs;
        start();
      },
      getCurrent() {
        return { x: currentX, y: currentY, tx: targetX, ty: targetY };
      },
      cancel() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        running = false;
        lastTs = 0;
      },
    };
  }, [enableTilt]);

  const getOffsets = (evt: PointerEvent, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  };

  const releaseVelocity = () => {
    const hist = gestureRef.current.history;
    if (hist.length < 2) return { vx: 0, vy: 0 };
    const a = hist[hist.length - 1];
    const b = hist[Math.max(0, hist.length - 3)];
    const dt = Math.max((a.t - b.t) / 1000, 0.008);
    return { vx: (a.x - b.x) / dt, vy: (a.y - b.y) / dt };
  };

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      const wrap = wrapRef.current;
      const shell = shellRef.current;
      if (!shell || !wrap) return;
      wrap.classList.add("pressed");
      gestureRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        mode: "undecided",
        moved: false,
        history: [],
      };
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const shell = shellRef.current;
      const wrap = wrapRef.current;
      if (!shell || !tiltEngine) return;
      const g = gestureRef.current;
      const { x, y } = getOffsets(event, shell);
      g.history.push({ x, y, t: performance.now() });
      if (g.history.length > 5) g.history.shift();

      if (g.pointerId === event.pointerId && g.mode !== "tilt") {
        const dx = event.clientX - g.startX;
        const dy = event.clientY - g.startY;
        const dist = Math.hypot(dx, dy);
        if (dist < HYSTERESIS_PX) return;
        g.moved = true;
        wrap?.classList.remove("pressed");
        const isCoarse = event.pointerType === "touch";
        if (isCoarse && Math.abs(dy) > Math.abs(dx) * 1.15) {
          g.mode = "scroll";
          return;
        }
        g.mode = "tilt";
        try {
          shell.setPointerCapture(event.pointerId);
        } catch {
          /* capture can fail if the element is gone */
        }
      }

      if (g.mode === "scroll") return;

      shell.classList.add("active");
      tiltEngine.setTarget(x, y);
    },
    [tiltEngine],
  );

  const handlePointerEnter = useCallback(
    (event: PointerEvent) => {
      const shell = shellRef.current;
      if (!shell || !tiltEngine) return;
      if (event.pointerType === "touch") return;
      shell.classList.add("active");
      const { x, y } = getOffsets(event, shell);
      tiltEngine.setTarget(x, y);
    },
    [tiltEngine],
  );

  const settle = useCallback(() => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;
    const { vx, vy } = releaseVelocity();
    tiltEngine.toCenter(vx, vy);

    const checkSettle = () => {
      const { x, y, tx, ty } = tiltEngine.getCurrent();
      const settled = Math.hypot(tx - x, ty - y) < 0.6;
      if (settled) {
        shell.classList.remove("active");
        leaveRafRef.current = null;
      } else {
        leaveRafRef.current = requestAnimationFrame(checkSettle);
      }
    };
    if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
    leaveRafRef.current = requestAnimationFrame(checkSettle);
  }, [tiltEngine]);

  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      const wrap = wrapRef.current;
      wrap?.classList.remove("pressed");
      const g = gestureRef.current;
      if (g.pointerId === event.pointerId) {
        const shell = shellRef.current;
        if (shell && g.mode === "tilt") {
          try {
            shell.releasePointerCapture(event.pointerId);
          } catch {
            /* ignore */
          }
        }
        g.pointerId = null;
        g.mode = "undecided";
      }
      settle();
    },
    [settle],
  );

  const handlePointerLeave = useCallback(() => {
    wrapRef.current?.classList.remove("pressed");
    settle();
  }, [settle]);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (gestureRef.current.moved) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [],
  );

  const handleDeviceOrientation = useCallback(
    (event: DeviceOrientationEvent) => {
      const shell = shellRef.current;
      if (!shell || !tiltEngine) return;

      const { beta, gamma } = event;
      if (beta == null || gamma == null) return;

      const centerX = shell.clientWidth / 2;
      const centerY = shell.clientHeight / 2;
      const x = clamp(centerX + gamma * mobileTiltSensitivity, 0, shell.clientWidth);
      const y = clamp(
        centerY + (beta - ANIMATION_CONFIG.DEVICE_BETA_OFFSET) * mobileTiltSensitivity,
        0,
        shell.clientHeight,
      );

      tiltEngine.setTarget(x, y);
    },
    [tiltEngine, mobileTiltSensitivity],
  );

  useEffect(() => {
    if (!enableTilt || !tiltEngine) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const shell = shellRef.current;
    if (!shell) return;

    shell.addEventListener("pointerenter", handlePointerEnter);
    shell.addEventListener("pointerdown", handlePointerDown);
    shell.addEventListener("pointermove", handlePointerMove);
    shell.addEventListener("pointerup", handlePointerUp);
    shell.addEventListener("pointercancel", handlePointerUp);
    shell.addEventListener("pointerleave", handlePointerLeave);

    const handleMotionPermission = () => {
      if (!enableMobileTilt || location.protocol !== "https:") return;
      const anyMotion = window.DeviceMotionEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (anyMotion && typeof anyMotion.requestPermission === "function") {
        anyMotion
          .requestPermission()
          .then((state) => {
            if (state === "granted") {
              window.addEventListener("deviceorientation", handleDeviceOrientation);
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener("deviceorientation", handleDeviceOrientation);
      }
    };
    shell.addEventListener("click", handleMotionPermission);

    const initialX = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    tiltEngine.setImmediate(initialX, initialY);
    tiltEngine.toCenter();
    tiltEngine.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);

    return () => {
      shell.removeEventListener("pointerenter", handlePointerEnter);
      shell.removeEventListener("pointerdown", handlePointerDown);
      shell.removeEventListener("pointermove", handlePointerMove);
      shell.removeEventListener("pointerup", handlePointerUp);
      shell.removeEventListener("pointercancel", handlePointerUp);
      shell.removeEventListener("pointerleave", handlePointerLeave);
      shell.removeEventListener("click", handleMotionPermission);
      window.removeEventListener("deviceorientation", handleDeviceOrientation);
      if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
      tiltEngine.cancel();
    };
  }, [
    enableTilt,
    enableMobileTilt,
    tiltEngine,
    handlePointerMove,
    handlePointerEnter,
    handlePointerLeave,
    handlePointerDown,
    handlePointerUp,
    handleDeviceOrientation,
  ]);

  const cardStyle = useMemo(
    () =>
      ({
        "--icon": iconUrl ? `url(${iconUrl})` : "none",
        "--grain": grainUrl ? `url(${grainUrl})` : "none",
        "--inner-gradient": innerGradient ?? DEFAULT_INNER_GRADIENT,
        "--behind-glow-color": behindGlowColor ?? "rgba(125, 190, 255, 0.67)",
        "--behind-glow-size": behindGlowSize ?? "50%",
      }) as React.CSSProperties,
    [iconUrl, grainUrl, innerGradient, behindGlowColor, behindGlowSize],
  );

  const hasAvatar = Boolean(avatarUrl);
  const inner = (
    <section className={`pc-card ${hasAvatar ? "" : "pc-no-avatar"}`}>
      <div className="pc-inside">
        <div className="pc-shine" />
        <div className="pc-glare" />
        <div className="pc-content pc-avatar-content">
          {hasAvatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="avatar"
              src={avatarUrl as string}
              alt={`${name} avatar`}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
        </div>
        <div className="pc-content pc-text-content">
          <div className="pc-details">
            <h3>{name}</h3>
            {title && <p>{title}</p>}
          </div>
        </div>
        {showUserInfo && (
          <div className="pc-content pc-userinfo-content">
            <div className="pc-user-info">
              <div className="pc-user-details">
                {hasAvatar && (
                  <div className="pc-mini-avatar">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={(miniAvatarUrl || avatarUrl) as string}
                      alt=""
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="pc-user-text">
                  <div className="pc-handle">@{handle}</div>
                  {status && <div className="pc-status">{status}</div>}
                </div>
              </div>
              <span className="pc-contact-btn">{contactText}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div ref={wrapRef} className={`pc-card-wrapper ${className}`.trim()} style={cardStyle}>
      {behindGlowEnabled && <div className="pc-behind" />}
      <div ref={shellRef} className="pc-card-shell">
        {href ? (
          <Link href={href} className="pc-card-link" onClick={handleClick} aria-label={`${contactText}: ${name}`}>
            {inner}
          </Link>
        ) : (
          <div
            className="pc-card-link"
            onClick={() => onContactClick?.()}
            role={onContactClick ? "button" : undefined}
          >
            {inner}
          </div>
        )}
      </div>
    </div>
  );
}

const ProfileCard = React.memo(ProfileCardComponent);
export default ProfileCard;
