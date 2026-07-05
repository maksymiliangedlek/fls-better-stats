"use client";
/**
 * FlowingMenu — vertical menu with a GSAP marquee reveal on hover.
 * Vendored from ReactBits (JS+CSS variant), ported to TS. Items can link to
 * internal routes (Next Link) or external URLs.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import "./FlowingMenu.css";

export interface FlowingMenuItem {
  link: string;
  text: string;
  image: string;
}

interface FlowingMenuProps {
  items?: FlowingMenuItem[];
  speed?: number;
  textColor?: string;
  bgColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  borderColor?: string;
}

export default function FlowingMenu({
  items = [],
  speed = 15,
  textColor = "#ffffff",
  bgColor = "#0c4563",
  marqueeBgColor = "#c9a227",
  marqueeTextColor = "#062736",
  borderColor = "rgba(255,255,255,0.14)",
}: FlowingMenuProps) {
  return (
    <div className="menu-wrap" style={{ backgroundColor: bgColor }}>
      <nav className="menu">
        {items.map((item, idx) => (
          <MenuItem
            key={idx}
            {...item}
            speed={speed}
            textColor={textColor}
            marqueeBgColor={marqueeBgColor}
            marqueeTextColor={marqueeTextColor}
            borderColor={borderColor}
          />
        ))}
      </nav>
    </div>
  );
}

interface MenuItemProps extends FlowingMenuItem {
  speed: number;
  textColor: string;
  marqueeBgColor: string;
  marqueeTextColor: string;
  borderColor: string;
}

function MenuItem({
  link,
  text,
  image,
  speed,
  textColor,
  marqueeBgColor,
  marqueeTextColor,
  borderColor,
}: MenuItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const [repetitions, setRepetitions] = useState(4);

  const animationDefaults = { duration: 0.6, ease: "expo" };
  const isInternal = link.startsWith("/");

  const distMetric = (x: number, y: number, x2: number, y2: number) => {
    const xDiff = x - x2;
    const yDiff = y - y2;
    return xDiff * xDiff + yDiff * yDiff;
  };

  const findClosestEdge = (mouseX: number, mouseY: number, width: number, height: number) => {
    const topEdgeDist = distMetric(mouseX, mouseY, width / 2, 0);
    const bottomEdgeDist = distMetric(mouseX, mouseY, width / 2, height);
    return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
  };

  useEffect(() => {
    const calc = () => {
      const content = marqueeInnerRef.current?.querySelector<HTMLElement>(".marquee__part");
      if (!content) return;
      const needed = Math.ceil(window.innerWidth / content.offsetWidth) + 2;
      setRepetitions(Math.max(4, needed));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [text, image]);

  useEffect(() => {
    const setup = () => {
      const inner = marqueeInnerRef.current;
      const content = inner?.querySelector<HTMLElement>(".marquee__part");
      if (!inner || !content) return;
      const contentWidth = content.offsetWidth;
      if (contentWidth === 0) return;
      animationRef.current?.kill();
      animationRef.current = gsap.to(inner, {
        x: -contentWidth,
        duration: speed,
        ease: "none",
        repeat: -1,
      });
    };
    const timer = setTimeout(setup, 50);
    return () => {
      clearTimeout(timer);
      animationRef.current?.kill();
    };
  }, [text, image, repetitions, speed]);

  const handleMouseEnter = (ev: React.MouseEvent) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height);
    gsap
      .timeline({ defaults: animationDefaults })
      .set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .set(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" }, 0);
  };

  const handleMouseLeave = (ev: React.MouseEvent) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height);
    gsap
      .timeline({ defaults: animationDefaults })
      .to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0);
  };

  const linkProps = {
    className: "menu__item-link",
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    style: { color: textColor },
  };

  return (
    <div className="menu__item" ref={itemRef} style={{ borderColor }}>
      {isInternal ? (
        <Link href={link} {...linkProps}>
          {text}
        </Link>
      ) : (
        <a href={link} {...linkProps}>
          {text}
        </a>
      )}
      <div className="marquee" ref={marqueeRef} style={{ backgroundColor: marqueeBgColor }}>
        <div className="marquee__inner-wrap">
          <div className="marquee__inner" ref={marqueeInnerRef} aria-hidden="true">
            {Array.from({ length: repetitions }).map((_, idx) => (
              <div className="marquee__part" key={idx} style={{ color: marqueeTextColor }}>
                <span>{text}</span>
                <div className="marquee__img" style={{ backgroundImage: `url(${image})` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
