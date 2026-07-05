"use client";
/**
 * ProfileCard — interactive tilt/shine profile card.
 * Vendored from ReactBits (TS-CSS variant). Pointer position drives CSS custom
 * properties for a 3D tilt + holographic shine; theming is done via CSS vars.
 */
import React, { useCallback, useEffect, useMemo, useRef, type CSSProperties } from "react";
import "./ProfileCard.css";

export interface ProfileCardProps {
  avatarUrl: string;
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
  miniAvatarUrl?: string;
  name?: string;
  title?: string;
  handle?: string;
  status?: string;
  contactText?: string;
  showUserInfo?: boolean;
  onContactClick?: () => void;
}

const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v: number, p = 3) => parseFloat(v.toFixed(p));

function ProfileCard({
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
  title,
  handle,
  status,
  contactText = "Contact",
  showUserInfo = true,
  onContactClick,
}: ProfileCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const updateVars = useCallback((px: number, py: number, card: HTMLDivElement, wrap: HTMLDivElement) => {
    const width = card.clientWidth;
    const height = card.clientHeight;
    const percentX = clamp((100 / width) * px);
    const percentY = clamp((100 / height) * py);
    const centerX = percentX - 50;
    const centerY = percentY - 50;

    wrap.style.setProperty("--pointer-x", `${percentX}%`);
    wrap.style.setProperty("--pointer-y", `${percentY}%`);
    wrap.style.setProperty("--background-x", `${clamp(50 + centerX / 4)}%`);
    wrap.style.setProperty("--background-y", `${clamp(50 + centerY / 4)}%`);
    wrap.style.setProperty("--pointer-from-center", `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`);
    wrap.style.setProperty("--pointer-from-top", `${percentY / 100}`);
    wrap.style.setProperty("--pointer-from-left", `${percentX / 100}`);
    wrap.style.setProperty("--rotate-x", `${round(-centerX / 5)}deg`);
    wrap.style.setProperty("--rotate-y", `${round(centerY / 4)}deg`);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      const wrap = wrapRef.current;
      if (!card || !wrap || !enableTilt) return;
      const rect = card.getBoundingClientRect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() =>
        updateVars(e.clientX - rect.left, e.clientY - rect.top, card, wrap),
      );
    },
    [enableTilt, updateVars],
  );

  const handlePointerEnter = useCallback(() => {
    wrapRef.current?.classList.add("pc-active");
  }, []);

  const handlePointerLeave = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    wrap.classList.remove("pc-active");
    wrap.style.setProperty("--rotate-x", "0deg");
    wrap.style.setProperty("--rotate-y", "0deg");
    wrap.style.setProperty("--pointer-from-center", "0");
  }, []);

  // Optional device-orientation tilt on mobile.
  useEffect(() => {
    if (!enableMobileTilt) return;
    const card = cardRef.current;
    const wrap = wrapRef.current;
    if (!card || !wrap) return;
    const handler = (e: DeviceOrientationEvent) => {
      const { beta, gamma } = e;
      if (beta == null || gamma == null) return;
      updateVars(
        card.clientWidth / 2 + gamma * mobileTiltSensitivity,
        card.clientHeight / 2 + (beta - 20) * mobileTiltSensitivity,
        card,
        wrap,
      );
    };
    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, [enableMobileTilt, mobileTiltSensitivity, updateVars]);

  const wrapStyle = useMemo(() => {
    const s: CSSProperties & Record<string, string> = {} as never;
    if (innerGradient) s["--inner-gradient"] = innerGradient;
    if (behindGlowColor) s["--behind-glow-color"] = behindGlowColor;
    if (behindGlowSize) s["--behind-glow-size"] = behindGlowSize;
    if (iconUrl) s["--icon"] = `url(${iconUrl})`;
    if (grainUrl) s["--grain"] = `url(${grainUrl})`;
    return s;
  }, [behindGlowColor, behindGlowSize, grainUrl, iconUrl, innerGradient]);

  return (
    <div
      ref={wrapRef}
      className={`pc-wrap ${behindGlowEnabled ? "pc-glow" : ""} ${className}`.trim()}
      style={wrapStyle}
    >
      <section
        ref={cardRef}
        className="pc-card"
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <div className="pc-inside">
          <div className="pc-shine" />
          <div className="pc-glare" />
          <div className="pc-content pc-avatar-content">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="pc-avatar" src={avatarUrl} alt={`${name} avatar`} loading="lazy" />
            {showUserInfo && (
              <div className="pc-user-info">
                <div className="pc-user-details">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="pc-mini-avatar"
                    src={miniAvatarUrl || avatarUrl}
                    alt={`${name} mini`}
                    loading="lazy"
                  />
                  <div className="pc-user-text">
                    {handle && <div className="pc-handle">@{handle}</div>}
                    {status && <div className="pc-status">{status}</div>}
                  </div>
                </div>
                {contactText && (
                  <button type="button" className="pc-contact-btn" onClick={onContactClick}>
                    {contactText}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="pc-content">
            <div className="pc-details">
              <h3 className="pc-name">{name}</h3>
              {title && <p className="pc-title">{title}</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProfileCard;
