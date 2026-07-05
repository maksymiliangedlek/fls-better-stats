"use client";
/**
 * GhostCursor — ambient WebGL cursor trail (three.js).
 * A transparent full-viewport canvas renders a soft glowing trail that smoothly
 * follows the pointer. Rendered as a background layer (pointer-events: none),
 * so pointer position is read from window events. Tinted via the `color` prop.
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./GhostCursor.css";

export interface GhostCursorProps {
  color?: string;
  /** Number of trailing nodes. Lower for weaker devices. */
  trailLength?: number;
  /** Base radius of each node in px. */
  size?: number;
  /** Max device pixel ratio (perf cap). */
  maxDpr?: number;
}

export default function GhostCursor({
  color = "#0c4563",
  trailLength = 22,
  size = 26,
  maxDpr = 2,
}: GhostCursorProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    renderer.setPixelRatio(dpr);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // Orthographic camera in pixel space (origin center).
    let w = window.innerWidth;
    let h = window.innerHeight;
    const camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, -100, 100);

    // Soft radial sprite texture for each node.
    const tex = makeGlowTexture(color);
    const nodes: THREE.Sprite[] = [];
    for (let i = 0; i < trailLength; i++) {
      const material = new THREE.SpriteMaterial({
        map: tex,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: (1 - i / trailLength) * 0.5,
      });
      const sprite = new THREE.Sprite(material);
      const scale = size * (1 - (i / trailLength) * 0.6);
      sprite.scale.set(scale, scale, 1);
      scene.add(sprite);
      nodes.push(sprite);
    }

    const pointer = new THREE.Vector2(0, 0);
    const trail = nodes.map(() => new THREE.Vector2(0, 0));

    const onPointerMove = (e: PointerEvent) => {
      pointer.set(e.clientX - w / 2, -(e.clientY - h / 2));
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      camera.left = -w / 2;
      camera.right = w / 2;
      camera.top = h / 2;
      camera.bottom = -h / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const animate = () => {
      // Head chases pointer; each node eases toward the one ahead of it.
      trail[0].lerp(pointer, 0.2);
      for (let i = 1; i < trail.length; i++) {
        trail[i].lerp(trail[i - 1], 0.35);
      }
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].position.set(trail[i].x, trail[i].y, 0);
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", resize);
      tex.dispose();
      nodes.forEach((n) => (n.material as THREE.SpriteMaterial).dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [color, trailLength, size, maxDpr]);

  return <div ref={mountRef} className="ghost-cursor" aria-hidden />;
}

/** Build a soft radial-gradient sprite texture in the given color. */
function makeGlowTexture(color: string): THREE.Texture {
  const s = 128;
  const canvas = document.createElement("canvas");
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  const c = new THREE.Color(color);
  const r = Math.round(c.r * 255);
  const g = Math.round(c.g * 255);
  const b = Math.round(c.b * 255);
  const grd = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, `rgba(${r},${g},${b},0.9)`);
  grd.addColorStop(0.4, `rgba(${r},${g},${b},0.35)`);
  grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, s, s);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
