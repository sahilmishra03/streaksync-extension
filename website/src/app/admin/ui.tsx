// Shared pieces for the admin pages. Dark TailAdmin style: #0b0b0c page, #131315 cards, #232326 borders.
import type { DayPoint } from "./types";

export const sum = (rows: DayPoint[], key: keyof DayPoint) =>
  rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);

export const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

// Last 7 days against the 7 days before. null when there's nothing to compare against yet.
export function weekChange(series: DayPoint[], key: keyof DayPoint): number | null {
  const last = sum(series.slice(-7), key);
  const prev = sum(series.slice(-14, -7), key);
  if (prev === 0) return null;
  return Math.round(((last - prev) / prev) * 100);
}

export function formatTime(t: string) {
  if (!t) return "-";
  const [h, m] = t.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDay(d: string, withWeekday = false) {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", {
    ...(withWeekday ? { weekday: "short" as const } : {}),
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PageHead({
  title,
  desc,
  right,
}: {
  title: string;
  desc: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[30px] leading-tight text-white">{title}</h1>
        <p className="mt-1 text-[14px] text-[#9a9aa2]">{desc}</p>
      </div>
      {right}
    </div>
  );
}

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-[#232326] bg-[#131315] p-5 sm:p-6 ${className}`}>
      {children}
    </section>
  );
}

export function CardHead({
  title,
  desc,
  right,
}: {
  title: string;
  desc?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="font-geist text-[17px] font-semibold tracking-[-0.01em] text-white/90">
          {title}
        </h3>
        {desc && <p className="mt-1 text-[14px] text-[#9a9aa2]">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

export function Badge({ value }: { value: number | null }) {
  if (value === null)
    return (
      <span className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[12px] font-medium text-[#9a9aa2]">
        No prior week
      </span>
    );
  const up = value >= 0;
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${up ? "bg-[#12b76a]/15 text-[#32d583]" : "bg-[#f04438]/15 text-[#f97066]"}`}
    >
      {up ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  );
}

export function Pill({
  tone,
  children,
}: {
  tone: "green" | "blue" | "amber" | "red" | "gray";
  children: React.ReactNode;
}) {
  const tones = {
    green: "bg-[#12b76a]/15 text-[#32d583]",
    blue: "bg-[#1f5fd6]/20 text-[#84adff]",
    amber: "bg-[#f79009]/15 text-[#fdb022]",
    red: "bg-[#f04438]/15 text-[#f97066]",
    gray: "bg-white/[0.05] text-[#9a9aa2]",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  change,
  sub,
}: {
  icon: (p: IconProps) => React.ReactElement;
  label: string;
  value: number | string;
  change?: number | null;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-[#232326] bg-[#131315] p-5 md:p-6">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#232326]">
        <Icon className="h-6 w-6 text-white/90" />
      </div>
      <div className="mt-5 flex items-end justify-between gap-2">
        <div>
          <p className="text-[14px] text-[#9a9aa2]">{label}</p>
          <p className="mt-2 text-[30px] leading-none font-semibold text-white tabular-nums">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        {change !== undefined && <Badge value={change} />}
      </div>
      <p className="mt-3 text-[13px] text-[#6b6b73]">{sub}</p>
    </div>
  );
}

export function Bar({ value, total }: { value: number; total: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#232326]">
      <div
        className="h-full rounded-full bg-[#1f5fd6]"
        style={{ width: `${pct(value, total)}%` }}
      />
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-[14px] text-[#6b6b73]">{children}</p>;
}

// ---------- Icons (24px line icons) ----------

export type IconProps = { className?: string };
const Svg = ({ className, children }: IconProps & { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);
export const GridIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </Svg>
);
export const UsersIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M3 19.5c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M15.5 5.2a3.5 3.5 0 0 1 0 6.6M17.5 14.3c2 .7 3.5 2.6 3.5 5.2" />
  </Svg>
);
export const ChartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 19h16M7 15l3.5-4 3 2.5L18 8" />
  </Svg>
);
export const LayersIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 4 8 4-8 4-8-4 8-4Z" />
    <path d="m4 12 8 4 8-4M4 16l8 4 8-4" />
  </Svg>
);
export const MailIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </Svg>
);
export const HomeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 11 12 4l8 7M6 9.5V20h12V9.5" />
  </Svg>
);
export const CodeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4" />
  </Svg>
);
export const PulseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12h4l2.5-6 5 12 2.5-6H21" />
  </Svg>
);
export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);
export const DeviceIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="4.5" width="17" height="12" rx="2" />
    <path d="M8 20h8M12 16.5V20" />
  </Svg>
);
export const RefreshIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4" />
  </Svg>
);
export const MenuIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);
export const ExternalIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Svg>
);
export const LogoutIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10" />
  </Svg>
);
