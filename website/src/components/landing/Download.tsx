import type { CSSProperties, ReactNode } from "react";
import type { BrandId } from "@/lib/brandIcons";
import { SITE } from "@/lib/site";
import { ScrollReveal } from "../ScrollReveal";
import { Brand, Check, Flame } from "./bits";
import { SectionHead } from "./SectionHead";

// Download section: one "Free" card with the one-click zip, PortFly style,
// with platform logos popping up around it ("pop-tile" in landing.css)

type Tile = { x: string; y: string; d: number; r: number; size: number; icon: ReactNode };
const brand = (id: BrandId, color?: string) => <Brand id={id} size={40} color={color} />;
const TILES: Tile[] = [
  { x: "8%", y: "12%", d: 0, r: -8, size: 87, icon: brand("leetcode") },
  { x: "20%", y: "58%", d: 1.2, r: 6, size: 99, icon: brand("github", "#1f2328") },
  { x: "4%", y: "82%", d: 3.1, r: -4, size: 74, icon: <Flame className="h-10 w-10" /> },
  { x: "26%", y: "24%", d: 4.4, r: 10, size: 68, icon: brand("gfg") },
  { x: "80%", y: "10%", d: 0.6, r: 7, size: 93, icon: brand("gfg") },
  { x: "90%", y: "46%", d: 2.2, r: -6, size: 81, icon: brand("leetcode") },
  { x: "74%", y: "70%", d: 3.6, r: 5, size: 99, icon: brand("github", "#1f2328") },
  { x: "93%", y: "86%", d: 5, r: -10, size: 71, icon: <Check className="h-10 w-10" /> },
  { x: "68%", y: "30%", d: 1.8, r: -5, size: 65, icon: <Flame className="h-9 w-9" /> },
];

function PoppingLogos() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
      {TILES.map((t, i) => (
        <span
          key={i}
          className="pop-tile absolute grid place-items-center rounded-[22px] border border-[#262322]/[0.06] bg-white shadow-[0_8px_24px_-10px_rgba(20,40,90,0.3)]"
          style={
            {
              left: t.x,
              top: t.y,
              width: t.size,
              height: t.size,
              "--d": `${t.d}s`,
              "--r": `${t.r}deg`,
            } as CSSProperties
          }
        >
          {t.icon}
        </span>
      ))}
    </div>
  );
}

function Tick() {
  return (
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#1f5fd6]/10">
      <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
        <path
          d="M3.5 8.5 6.5 11.5 12.5 4.5"
          fill="none"
          stroke="#1f5fd6"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

const PERKS = [
  "Every feature, nothing locked",
  "No account, no API keys",
  "Email reminders, even with your laptop off",
];

function DownloadCard() {
  return (
    <div className="mx-auto w-full max-w-[380px] rounded-[22px] border border-[#262322]/[0.06] bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-30px_rgba(20,40,90,0.35)]">
      <div className="flex items-baseline gap-2">
        <span className="text-[46px] leading-none font-semibold tracking-[-0.04em] text-[#262322]">
          Free
        </span>
        <span className="text-[13px] text-[#262322]/55">forever</span>
      </div>
      <ul className="mt-6 space-y-3 border-t border-[#262322]/[0.08] pt-6 text-[14px] text-[#262322]/75">
        {PERKS.map((p) => (
          <li key={p} className="flex items-center gap-3">
            <Tick />
            {p}
          </li>
        ))}
      </ul>
      <a
        href={SITE.downloadUrl}
        download
        className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-[#1f5fd6] via-[#3d86ee] to-[#6aafff] text-[14px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(31,95,214,0.25),0_4px_12px_rgba(61,134,238,0.25)] transition hover:brightness-110"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 fill-none stroke-current"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 4v11m-5-5 5 5 5-5M5 20h14" />
        </svg>
        Download StreakSync
      </a>
      <p className="mt-4 text-center text-[12px] leading-relaxed text-[#262322]/50">
        v{SITE.version} · .zip, about 150 KB · Chrome, Edge, Brave
        <br />
        <a
          href={SITE.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1f5fd6] underline-offset-4 hover:underline"
        >
          View the source on GitHub
        </a>
      </p>
    </div>
  );
}

export function Download() {
  return (
    <ScrollReveal id="download" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-28">
      <SectionHead
        label="Download"
        title={
          <>
            Free to <em>use</em>,
            <br />
            open to <em>read</em>
          </>
        }
        body="No price, no account, no sign-in. One click downloads the extension as a small .zip."
      />

      <div className="reveal relative mt-14 py-6" style={{ animationDelay: "0.15s" }}>
        <PoppingLogos />
        <div className="relative">
          <DownloadCard />
        </div>
        <a
          href="#install"
          className="mt-6 block text-center text-[13px] text-[#262322]/55 transition hover:text-[#262322]"
        >
          Downloaded? Here&apos;s how to install it ↓
        </a>
      </div>
    </ScrollReveal>
  );
}
