"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Holds the `.reveal` animations inside it paused until the block scrolls into view,
// then plays them once. Without JavaScript the content is shown as normal.
export function ScrollReveal({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in-view");
          io.disconnect();
        }
      },
      // Start just before the block scrolls in, so it's already showing when it arrives
      { rootMargin: "0px 0px 10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} id={id} className={`scroll-reveal ${className}`}>
      {children}
    </div>
  );
}
