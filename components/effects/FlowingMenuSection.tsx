"use client";
import dynamic from "next/dynamic";
import type { FlowingMenuItem } from "./flowing-menu/FlowingMenu";
import styles from "./FlowingMenuSection.module.css";

const FlowingMenu = dynamic(() => import("./flowing-menu/FlowingMenu"), { ssr: false });

const ITEMS: FlowingMenuItem[] = [
  { link: "/players", text: "Skład", image: "/duck.png" },
  { link: "/compare", text: "Porównaj", image: "/duck.png" },
  { link: "#terminarz", text: "Terminarz", image: "/duck.png" },
];

export function FlowingMenuSection({ fill = false }: { fill?: boolean }) {
  return (
    <div className={`${styles.wrap} ${fill ? styles.fill : ""}`}>
      <FlowingMenu
        items={ITEMS}
        speed={14}
        textColor="#ffffff"
        bgColor="#0c4563"
        marqueeBgColor="#c9a227"
        marqueeTextColor="#062736"
        borderColor="rgba(255,255,255,0.14)"
      />
    </div>
  );
}
