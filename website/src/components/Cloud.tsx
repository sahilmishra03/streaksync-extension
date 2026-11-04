// Soft illustrated cloud: overlapping circles on a flat base, with a light shaded underside
export function Cloud({ className = "", width = 320 }: { className?: string; width?: number }) {
  return (
    <svg
      viewBox="0 0 320 140"
      width={width}
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cloud-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dbe9fb" />
        </linearGradient>
      </defs>
      <g fill="url(#cloud-shade)">
        <circle cx="92" cy="86" r="38" />
        <circle cx="140" cy="62" r="48" />
        <circle cx="196" cy="70" r="40" />
        <circle cx="240" cy="92" r="28" />
        <circle cx="58" cy="104" r="24" />
        <rect x="34" y="96" width="236" height="32" rx="16" />
        <path d="M10 126 Q 150 116 312 128 Q 160 134 10 126 Z" opacity="0.9" />
      </g>
    </svg>
  );
}
