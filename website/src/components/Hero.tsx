import type { CSSProperties } from "react";
import { BRAND_ICONS, type BrandId } from "@/lib/brandIcons";
import { SITE } from "@/lib/site";
import { MacbookDemo } from "./MacbookDemo";
import { Nav } from "./Nav";

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

function ChromeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 8.5h8.6M8.97 13.75 4.66 6.3M15.03 13.75l-4.3 7.45" />
    </svg>
  );
}

const PLATFORMS: { id: BrandId; name: string; color: string }[] = [
  { id: "github", name: "GitHub", color: "#262322" },
  { id: "leetcode", name: "LeetCode", color: BRAND_ICONS.leetcode.color },
  { id: "gfg", name: "GeeksforGeeks", color: BRAND_ICONS.gfg.color },
];

// Centred hero: badge, headline, copy, buttons and platforms stacked in one column,
// then the MacBook demo on the plain page.
export function Hero() {
  return (
    <div className="bg-[#fafaf9]">
      <Nav />

      <section className="flex flex-col items-center px-6 pt-24 pb-14 text-center sm:pt-32 sm:pb-16">
        <a
          href="#features"
          className="reveal inline-flex items-stretch overflow-hidden rounded-lg border border-[#262322] text-[12px] transition-colors hover:bg-white"
          style={delay(100)}
        >
          <span className="flex items-center bg-[#262322] px-3 text-[11px] tracking-wider text-white">
            NEW
          </span>
          <span className="flex items-center px-4 py-1.5 text-[#262322]">
            GeeksforGeeks streaks are here.
          </span>
        </a>

        <h1
          className="reveal mt-10 text-[clamp(2.4rem,5.4vw,4.6rem)] leading-[1.05] font-[330] tracking-[-0.045em] text-[#262322] [word-spacing:0.14em] [&_em]:pr-[0.06em]"
          style={delay(220)}
        >
          <span className="sm:block sm:whitespace-nowrap">
            Never <em>break</em> your coding
          </span>{" "}
          <span className="sm:block sm:whitespace-nowrap">
            <em>streak</em> again
          </span>
        </h1>

        <p
          className="reveal mt-7 max-w-2xl text-[15px] leading-relaxed text-[#262322]/65 sm:text-base"
          style={delay(360)}
        >
          Reminders for GitHub, LeetCode and GeeksforGeeks, only for what you haven&apos;t done
          today.
          <br className="hidden sm:block" /> Even by email, with your laptop off.
        </p>

        <div
          className="reveal mt-10 flex flex-wrap items-center justify-center gap-3"
          style={delay(480)}
        >
          <a
            href="#download"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-linear-to-r from-[#1f5fd6] via-[#3d86ee] to-[#6aafff] px-5 text-[13px] font-medium tracking-[0.08em] text-white uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(31,95,214,0.25),0_4px_12px_rgba(61,134,238,0.25)] transition hover:brightness-110"
          >
            <ChromeIcon />
            Add to Chrome
          </a>
          <a
            href={SITE.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#262322]/15 bg-white px-5 text-[13px] font-medium tracking-[0.08em] text-[#262322] uppercase shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:border-[#262322]/30"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d={BRAND_ICONS.github.d} />
            </svg>
            View on GitHub
          </a>
        </div>

        <div
          className="reveal mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-[#262322]/60"
          style={delay(580)}
        >
          <span className="tracking-[0.08em] uppercase">Works with</span>
          {PLATFORMS.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1.5 text-[#262322]">
              <svg
                viewBox={BRAND_ICONS[p.id].viewBox}
                className="h-4 w-4"
                fill={p.color}
                aria-hidden="true"
              >
                <path d={BRAND_ICONS[p.id].d} />
              </svg>
              {p.name}
            </span>
          ))}
        </div>
      </section>

      <div className="reveal mx-auto w-full max-w-5xl px-4 pb-24 sm:px-6" style={delay(680)}>
        <MacbookDemo />
      </div>
    </div>
  );
}
