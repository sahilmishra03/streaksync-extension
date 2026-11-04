"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

// Lays children out at a fixed width x height and zooms them to fit the container's width.
// zoom (not transform: scale) keeps text crisp.
export function FitStage({
  width,
  height,
  className = "",
  children,
}: {
  width: number;
  height: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <div
        className="absolute top-0 left-0"
        style={{
          width,
          height,
          zoom: scale ?? 1,
          visibility: scale === null ? "hidden" : "visible",
        }}
      >
        {children}
      </div>
    </div>
  );
}
