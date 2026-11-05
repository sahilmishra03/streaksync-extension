"use client";

import { useEffect } from "react";

/*
 * A crisp, clean UI click sound (inspired by modern developer sites).
 * Synthesized using Web Audio API for fast, zero-latency response without static assets.
 */
const CLICKABLE = "a, button, summary, label, [role='button'], input[type='checkbox']";

export function ClickSound() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ctx: AudioContext | null = null;

    const play = () => {
      ctx ??= new AudioContext();
      if (ctx.state === "suspended") {
        void ctx.resume();
      }
      const t = ctx.currentTime;

      // Soft mechanical tactile click tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      // Fast frequency slide down from 2200Hz to 600Hz in 15ms for a crisp bubble-pop click
      osc.frequency.setValueAtTime(2200, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.015);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.018);
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if ((e.target as Element | null)?.closest?.(CLICKABLE)) {
        try {
          play();
        } catch {
          // Audio blocked or unsupported: clicks still work, just silently
        }
      }
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onDown);
      void ctx?.close();
    };
  }, []);
  return null;
}
