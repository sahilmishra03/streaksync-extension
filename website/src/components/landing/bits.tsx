import { BRAND_ICONS, type BrandId } from "@/lib/brandIcons";

// Small pieces shared by the landing-page clips

export function Brand({ id, size = 16, color }: { id: BrandId; size?: number; color?: string }) {
  const { d, viewBox } = BRAND_ICONS[id];
  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      fill={color ?? BRAND_ICONS[id].color}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export function Flame({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`shrink-0 ${className}`} aria-hidden="true">
      <path
        d="M8 2c2.5 3 4 4.8 4 7.2A4 4 0 0 1 4 9.2C4 7.5 5 6.2 6 5c.3 1.3 1 2 2 2.2C8 5.5 7.6 3.8 8 2Z"
        fill="#f5a524"
      />
    </svg>
  );
}

export function Check({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`shrink-0 ${className}`} aria-hidden="true">
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        fill="none"
        stroke="#4ade80"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className = "h-5 w-5" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo-mark.png" alt="" className={className} />;
}

// The soft wallpaper used inside the MacBook, reused behind every clip
export const WALLPAPER =
  "bg-[radial-gradient(90%_70%_at_18%_12%,#d6ebff_0%,transparent_60%),radial-gradient(80%_70%_at_88%_92%,#ffd9a3_0%,transparent_62%),linear-gradient(160deg,#4f97f0_0%,#86bfff_48%,#f1c38f_100%)]";

// Thin macOS menu bar across the top of a clip
export function MiniMenuBar({ app }: { app: string }) {
  return (
    <div className="absolute inset-x-0 top-0 flex h-[22px] items-center gap-3 bg-white/45 px-3 text-[11px] text-[#1d1d1f]">
      <svg viewBox="0 0 384 512" className="h-[11px] w-auto fill-current" aria-hidden="true">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
      </svg>
      <b className="font-semibold">{app}</b>
      <span>File</span>
      <span>Edit</span>
      <span>View</span>
    </div>
  );
}

// Arrow cursor; the tip is at (3, 2)
export function Cursor({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] ${className}`} aria-hidden="true">
      <path
        d="M4 2.5v17l4.6-4.3 3 6.6 2.8-1.3-3-6.4H18L4 2.5Z"
        fill="#000"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
