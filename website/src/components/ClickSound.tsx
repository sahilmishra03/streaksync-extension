"use client";

import { useEffect } from "react";

/*
 * A soft trackpad-style "tick" when a link, button, toggle or summary is clicked.
 * Synthesized with the Web Audio API (a 30 ms filtered noise burst plus a short sine tap),
 * so there is no audio file to download or license. Silent for users who prefer reduced motion,
 * and the AudioContext is only created on the first click (browsers require a user gesture).
 */
const CLICKABLE = "a, button, summary, label, [role='button'], input[type='checkbox']";

export function ClickSound() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ctx: AudioContext | null = null;
    let noise: AudioBuffer | null = null;

    const play = () => {
      ctx ??= new AudioContext();
      if (!noise) {
        noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
        const ch = noise.getChannelData(0);
        for (let i = 0; i < ch.length; i++)
          ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length) ** 4;
      }
      const t = ctx.currentTime;

      const src = ctx.createBufferSource();
      src.buffer = noise;
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 3200;
      band.Q.value = 1.2;
      const g1 = ctx.createGain();
      g1.gain.value = 0.22;
      src.connect(band).connect(g1).connect(ctx.destination);
      src.start(t);

      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(1500, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.02);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.08, t);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      osc.connect(g2).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.035);
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
