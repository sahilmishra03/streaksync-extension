import type { ReactNode } from "react";
import { ScrollReveal } from "../ScrollReveal";
import { Brand, Check, Flame, Logo, WALLPAPER } from "./bits";
import { SectionHead } from "./SectionHead";
import type { BrandId } from "@/lib/brandIcons";

/*
 * One day in 12 seconds ("hw-*" classes in landing.css).
 * The bar runs from 10 AM to 10 PM. At each reminder a notification lists only what's left:
 * GitHub gets done before 2 PM, LeetCode before 6 PM, GFG never does,
 * so every selected reminder time can send an email about the unfinished platforms.
 */

const TIMES = ["10 AM", "2 PM", "6 PM", "10 PM"];

function Pill({ id, name, done }: { id: BrandId; name: string; done?: "gh" | "lc" }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border bg-[#161618] px-3 py-2 text-[12px] text-[#f4f4f0] ${
        done ? `hw-border-${done}` : "border-[#f5a524]/35"
      }`}
    >
      <Brand id={id} size={14} />
      <span className="flex-1 font-medium">{name}</span>
      {done ? (
        <span className="relative inline-grid">
          <span className={`hw-before-${done} col-start-1 row-start-1`}>
            <Flame className="h-3.5 w-3.5" />
          </span>
          <span className={`hw-after-${done} col-start-1 row-start-1`}>
            <Check className="h-3.5 w-3.5" />
          </span>
        </span>
      ) : (
        <Flame className="h-3.5 w-3.5" />
      )}
    </div>
  );
}

function Toast({
  n,
  title,
  body,
  icon,
}: {
  n: number;
  title: string;
  body: string;
  icon: ReactNode;
}) {
  return (
    <div
      className={`hw-n${n} absolute inset-x-0 top-0 flex items-center gap-3 rounded-[14px] border border-black/5 bg-[#f5f5f7] p-3 text-[#1d1d1f] shadow-[0_12px_30px_-10px_rgba(10,30,80,0.4)]`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-[#0b0b0c]">
        {icon}
      </span>
      <div className="min-w-0 text-[12px] leading-[1.35]">
        <div className="flex gap-2">
          <b className="font-semibold">{title}</b>
          <span className="text-[11px] text-[#86868b]">now</span>
        </div>
        <div className="truncate text-[#515154]">{body}</div>
      </div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </svg>
  );
}

function DayDemo() {
  return (
    <div
      className={`relative mx-auto max-w-3xl overflow-hidden rounded-[20px] border border-[#262322]/[0.08] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_50px_-24px_rgba(20,40,90,0.3)] sm:p-10 ${WALLPAPER}`}
      aria-hidden="true"
    >
      <div className="grid gap-6 sm:grid-cols-[1fr_1.15fr] sm:items-center">
        {/* What you track */}
        <div className="rounded-xl border border-white/10 bg-[#0b0b0c] p-3 shadow-[0_18px_40px_-12px_rgba(10,30,80,0.55)]">
          <div className="mb-2.5 flex items-center gap-2 px-0.5 text-[13px] font-semibold text-[#f4f4f0]">
            <Logo className="h-5 w-5" /> Today
          </div>
          <div className="flex flex-col gap-1.5">
            <Pill id="github" name="GitHub" done="gh" />
            <Pill id="leetcode" name="LeetCode" done="lc" />
            <Pill id="gfg" name="GeeksforGeeks" />
          </div>
        </div>

        {/* What you get, one at a time */}
        <div className="relative h-[66px]">
          <Toast
            n={1}
            icon={<Logo />}
            title="StreakSync · 10 AM"
            body="3 left: GitHub, LeetCode, GeeksforGeeks"
          />
          <Toast
            n={2}
            icon={<Logo />}
            title="StreakSync · 2 PM"
            body="2 left: LeetCode, GeeksforGeeks"
          />
          <Toast n={3} icon={<Logo />} title="StreakSync · 6 PM" body="1 left: GeeksforGeeks" />
          <Toast
            n={4}
            icon={<MailIcon />}
            title="Email · 10 PM"
            body="1 left today: GeeksforGeeks"
          />
        </div>
      </div>

      {/* The day */}
      <div className="mt-9">
        <div className="relative h-[6px] rounded-full bg-white/50">
          <div className="hw-fill absolute inset-y-0 left-0 rounded-full bg-[#1f5fd6]" />
          {TIMES.map((t, i) => (
            <span
              key={t}
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#1f5fd6] shadow"
              style={{ left: `${(i / 3) * 100}%` }}
            />
          ))}
        </div>
        <div className="relative mt-3 h-4 font-mono text-[11px] text-[#1d1d1f]/70">
          {TIMES.map((t, i) => (
            <span
              key={t}
              className={`absolute ${i === 0 ? "" : i === 3 ? "-translate-x-full" : "-translate-x-1/2"}`}
              style={{ left: `${(i / 3) * 100}%` }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: "Pick your platforms",
    body: "Tick GitHub, LeetCode and GeeksforGeeks, then connect each one in a click.",
  },
  {
    title: "Choose up to four times",
    body: "10 AM, 2 PM, 6 PM and 10 PM by default. Move them or remove some.",
  },
  {
    title: "Hear only about what's left",
    body: "Each reminder skips what you've finished. At the last one, an email, even with your laptop off.",
  },
];

export function HowItWorks() {
  return (
    <ScrollReveal id="how" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-28">
      <SectionHead
        label="How it works"
        title={
          <>
            A gentle nudge,
            <br />
            only <em>when</em> it&apos;s needed
          </>
        }
        body="Here's one day. Finish a platform and it drops out of the next reminder. Finish them all and the day stays quiet."
      />
      <div className="reveal mt-14" style={{ animationDelay: "0.2s" }}>
        <DayDemo />
      </div>
      <ol className="reveal-kids mx-auto mt-14 grid max-w-4xl gap-8 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <span className="font-mono text-[11px] tracking-[0.2em] text-[#262322]/45">
              0{i + 1}
            </span>
            <h3 className="mt-2 text-[15px] font-medium text-[#262322]">{s.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#262322]/60">{s.body}</p>
          </li>
        ))}
      </ol>
    </ScrollReveal>
  );
}
