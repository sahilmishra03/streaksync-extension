"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

// Inertia scrolling for the landing page, the same library PortFly uses.
// Anchor links (#features, #install...) glide to their section. Off for reduced motion.
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, anchors: { offset: -72 }, lerp: 0.1 });
    return () => lenis.destroy();
  }, []);
  return null;
}
