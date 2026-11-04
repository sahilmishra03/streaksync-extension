"use client";

import { useState } from "react";
import type { DayPoint } from "./types";

const W = 800;
const H = 260;
const PAD = { l: 36, r: 12, t: 16, b: 30 };

const fmtDay = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

type Series = { key: "active" | "new"; label: string; color: string };
const SERIES: Series[] = [
  { key: "active", label: "Active people", color: "#528bff" },
  { key: "new", label: "New people", color: "#32d583" },
];

// Dark area chart with a hover crosshair (TailAdmin style)
export function AreaChart({ data, label }: { data: DayPoint[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(4, ...data.map((d) => Math.max(d.active, d.new)));
  const step = Math.ceil(max / 4);
  const top = step * 4;
  const x = (i: number) => PAD.l + (i * (W - PAD.l - PAD.r)) / Math.max(1, data.length - 1);
  const y = (v: number) => PAD.t + (1 - v / top) * (H - PAD.t - PAD.b);
  const ticks = [0, 1, 2, 3, 4].map((k) => k * step);
  const labelEvery = Math.ceil(data.length / 6);

  const line = (key: Series["key"]) =>
    data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(" ");

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  }

  const h = hover !== null ? data[hover] : null;

  return (
    <div>
      <div className="mb-3 flex gap-5 text-[13px] text-[#9a9aa2]">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={label}
        >
          <defs>
            {SERIES.map((s) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={s.color} stopOpacity="0.28" />
                <stop offset="1" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#232326" />
              <text x={PAD.l - 10} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#6b6b73">
                {t}
              </text>
            </g>
          ))}
          {SERIES.map((s) => (
            <g key={s.key}>
              <path
                d={`${line(s.key)} L${x(data.length - 1)},${H - PAD.b} L${x(0)},${H - PAD.b} Z`}
                fill={`url(#fill-${s.key})`}
              />
              <path
                d={line(s.key)}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </g>
          ))}
          {data.map((d, i) =>
            i % labelEvery === 0 || i === data.length - 1 ? (
              <text
                key={d.day}
                x={x(i)}
                y={H - 8}
                textAnchor={i === data.length - 1 ? "end" : i === 0 ? "start" : "middle"}
                fontSize="11"
                fill="#6b6b73"
              >
                {fmtDay(d.day)}
              </text>
            ) : null,
          )}
          {h && hover !== null && (
            <g>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD.t}
                y2={H - PAD.b}
                stroke="#c9c9cf"
                strokeDasharray="4 4"
              />
              {SERIES.map((s) => (
                <circle
                  key={s.key}
                  cx={x(hover)}
                  cy={y(h[s.key])}
                  r="4.5"
                  fill="#131315"
                  stroke={s.color}
                  strokeWidth="2"
                />
              ))}
            </g>
          )}
        </svg>
        {h && hover !== null && (
          <div
            className="pointer-events-none absolute top-0 rounded-lg border border-[#2e2e33] bg-[#232326] px-3 py-2 text-xs shadow-lg"
            style={{ left: `${Math.min(76, (x(hover) / W) * 100 + 1)}%` }}
          >
            <div className="font-medium text-white">{fmtDay(h.day)}</div>
            {SERIES.map((s) => (
              <div key={s.key} className="mt-1 flex items-center gap-2 text-[#9a9aa2]">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label} <b className="text-white">{h[s.key]}</b>
              </div>
            ))}
            <div className="mt-1 text-[#9a9aa2]">Emails sent {h.emails}</div>
          </div>
        )}
      </div>
    </div>
  );
}
