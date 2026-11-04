import type { ReactNode } from "react";
import { ScrollReveal } from "../ScrollReveal";
import { Brand, Check, Cursor, Flame, Logo, MiniMenuBar, WALLPAPER } from "./bits";
import { SectionHead } from "./SectionHead";

/*
 * Three short looping clips, one per platform, drawn in HTML and animated with CSS
 * (landing.css, "k-*" classes). Every clip shares one 7s loop: the action happens in the
 * first half, the result shows at 46%, then it holds and starts over.
 */

// Deterministic "random" so server and client render the same squares
function seeded(i: number) {
  const n = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function Clip({ app, children }: { app: string; children: ReactNode }) {
  return (
    <div className={`relative grid h-[300px] place-items-center overflow-hidden ${WALLPAPER}`}>
      <MiniMenuBar app={app} />
      <div className="relative mt-4">{children}</div>
    </div>
  );
}

/* ---------- LeetCode: solve it, the popup notices ---------- */

function Swap({ before, after }: { before: ReactNode; after: ReactNode }) {
  return (
    <span className="relative inline-grid">
      <span className="k-before col-start-1 row-start-1">{before}</span>
      <span className="k-after col-start-1 row-start-1">{after}</span>
    </span>
  );
}

function LeetCodeClip() {
  const row = "flex items-center gap-2 rounded-md border bg-[#161618] px-2.5 py-[7px]";
  return (
    <Clip app="Chrome">
      <div className="k-drop absolute -top-[34px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#2cbb5d] px-3 py-1 text-[11px] font-semibold whitespace-nowrap text-white shadow-md">
        <Brand id="leetcode" size={12} color="#fff" /> Accepted · Two Sum
      </div>
      <div className="w-[236px] rounded-xl border border-white/10 bg-[#0b0b0c] p-3 text-[12px] text-[#f4f4f0] shadow-[0_18px_40px_-10px_rgba(10,30,80,0.55)]">
        <div className="flex items-center gap-2 text-[13px] font-semibold">
          <Logo className="h-5 w-5" /> StreakSync
        </div>
        <div className="py-3 text-center">
          <div className="text-[30px] leading-none font-semibold tabular-nums">
            <Swap before="1" after="2" />
            <span className="mx-1 font-normal text-[#9a9aa2]">/</span>3
          </div>
          <div className="mt-1 text-[9px] tracking-[0.08em] text-[#9a9aa2] uppercase">
            done today
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className={`${row} border-white/[0.08]`}>
            <span className="flex-1 text-[#9a9aa2]">GitHub</span>
            <span className="text-[11px] text-[#9a9aa2]">41 days</span>
            <Check className="h-3.5 w-3.5" />
          </div>
          <div className={`${row} k-row-done border-[#f5a524]/35`}>
            <span className="flex-1">LeetCode</span>
            <span className="text-[11px] text-[#9a9aa2] tabular-nums">
              <Swap before="25 days" after="26 days" />
            </span>
            <Swap
              before={<Flame className="h-3.5 w-3.5" />}
              after={<Check className="h-3.5 w-3.5" />}
            />
          </div>
          <div className={`${row} border-[#f5a524]/35`}>
            <span className="flex-1">GeeksforGeeks</span>
            <span className="text-[11px] text-[#9a9aa2]">6 days</span>
            <Flame className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Clip>
  );
}

/* ---------- GeeksforGeeks: one click finds your account ---------- */

function GfgClip() {
  return (
    <Clip app="Chrome">
      <div className="w-[256px] rounded-xl border border-white/10 bg-[#0b0b0c] p-3.5 text-[12px] text-[#f4f4f0] shadow-[0_18px_40px_-10px_rgba(10,30,80,0.55)]">
        <div className="text-[10px] tracking-[0.12em] text-[#9a9aa2] uppercase">Platforms</div>
        <div className="mt-2.5 flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-[#161618] p-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-[#1b1b1e]">
            <Brand id="gfg" size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">GeeksforGeeks</span>
            <span className="relative block h-4 text-[10.5px] text-[#9a9aa2]">
              <span className="k-before absolute inset-0">Not connected</span>
              <span className="k-after absolute inset-0 text-[#4ade80]">@sahil_gfg · found</span>
            </span>
          </span>
          <span className="relative inline-grid">
            <span className="k-before k-press col-start-1 row-start-1 rounded-md bg-[#0b63e5] px-2.5 py-1 text-[11px] font-medium">
              Detect
            </span>
            <span className="k-after col-start-1 row-start-1 grid place-items-center">
              <Check />
            </span>
          </span>
        </div>
        <div className="mt-3 text-[10px] tracking-[0.12em] text-[#9a9aa2] uppercase">
          Problems solved
        </div>
        <div className="mt-2 grid grid-flow-col grid-rows-4 justify-start gap-[3px]">
          {Array.from({ length: 64 }, (_, i) => {
            const last = i === 63;
            const r = seeded(i + 7);
            const a = r < 0.35 ? 0.06 : r < 0.65 ? 0.35 : r < 0.88 ? 0.6 : 0.9;
            return (
              <span
                key={i}
                className={`h-[11px] w-[11px] rounded-[2px] ${last ? "k-cell ring-1 ring-white/25" : ""}`}
                style={last ? undefined : { background: `rgba(47,141,70,${a})` }}
              />
            );
          })}
        </div>
      </div>
      <Cursor className="k-gfg-cursor absolute top-0 left-0 z-10" />
    </Clip>
  );
}

/* ---------- GitHub: push, and today's square fills in ---------- */

function GitHubClip() {
  return (
    <Clip app="Terminal">
      <div className="w-[262px] overflow-hidden rounded-xl bg-[#1c1c1e] text-[11px] text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_18px_40px_-10px_rgba(10,30,80,0.55)]">
        <div className="flex h-[24px] items-center gap-1.5 px-2.5">
          <i className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="h-[86px] px-3 pb-2 font-mono leading-[1.7]">
          <p>
            <span className="text-[#6fb2ff]">~/dsa</span> <span className="text-white/45">$</span>{" "}
            git commit -m &quot;two pointers&quot;
          </p>
          <p className="flex">
            <span className="text-[#6fb2ff]">~/dsa</span>&nbsp;
            <span className="text-white/45">$</span>
            &nbsp;
            <span className="k-type inline-block overflow-hidden whitespace-nowrap">git push</span>
          </p>
          <p className="k-after text-white/50">
            <span className="text-[#73d178]">✓</span> main → main
          </p>
        </div>
      </div>
      <div className="mt-3 w-[262px] rounded-xl border border-black/5 bg-white p-3 text-[11px] text-[#1f2328] shadow-[0_18px_40px_-14px_rgba(10,30,80,0.45)]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-semibold">
            <Brand id="github" size={13} color="#1f2328" /> Contributions
          </span>
          <span className="text-[#59636e] tabular-nums">
            <Swap before="41-day streak" after="42-day streak" />
          </span>
        </div>
        <div className="mt-2.5 grid grid-flow-col grid-rows-7 justify-start gap-[3px]">
          {Array.from({ length: 133 }, (_, i) => {
            const last = i === 132;
            const r = seeded(i);
            const recent = i > 132 - 42;
            const c = recent
              ? ["#9be9a8", "#40c463", "#30a14e"][Math.floor(r * 3)]
              : r < 0.3
                ? "#eff2f5"
                : ["#9be9a8", "#40c463", "#30a14e", "#216e39"][Math.floor(r * 4)];
            return (
              <span
                key={i}
                className={`h-[9px] w-[9px] rounded-[2px] ${last ? "k-cell-gh" : ""}`}
                style={last ? undefined : { background: c }}
              />
            );
          })}
        </div>
      </div>
    </Clip>
  );
}

const CARDS = [
  {
    clip: <LeetCodeClip />,
    title: "Knows when you've solved it",
    body: "Submit on LeetCode and StreakSync marks it done. The next reminder won't mention it.",
    lift: "lg:translate-y-16",
  },
  {
    clip: <GfgClip />,
    title: "One click to connect",
    body: "No keys or tokens. Detect reads the GeeksforGeeks or LeetCode account you're signed in to.",
    lift: "lg:translate-y-8",
  },
  {
    clip: <GitHubClip />,
    title: "Counts every contribution",
    body: "Push a commit and today's square fills in. Your GitHub streak is read straight from your profile graph.",
    lift: "",
  },
];

export function Features() {
  return (
    <ScrollReveal id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-28">
      <SectionHead
        label="Features"
        title={
          <>
            Three platforms,
            <br />
            <em>one</em> streak to keep
          </>
        }
        body="GitHub, LeetCode and GeeksforGeeks in one place. It only nudges you about what's still left today."
      />
      <div className="reveal-kids mt-16 grid gap-6 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3 lg:items-start lg:pb-16">
        {CARDS.map((c) => (
          <article
            key={c.title}
            className={`mx-auto w-full max-w-[380px] overflow-hidden rounded-[14px] border border-[#262322]/[0.08] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(20,40,90,0.18)] ${c.lift}`}
          >
            {c.clip}
            <div className="px-4 pt-4 pb-5">
              <h3 className="text-[14px] font-medium text-[#262322]">{c.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#262322]/60">{c.body}</p>
            </div>
          </article>
        ))}
      </div>
    </ScrollReveal>
  );
}
