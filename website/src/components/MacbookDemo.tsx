"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { BRAND_ICONS, type BrandId } from "@/lib/brandIcons";
import { PopupMock } from "./PopupMock";

/*
 * A MacBook showing macOS + Chrome, drawn in HTML so it stays sharp at any size.
 * The screen is laid out at a fixed 1200 x 750 and scaled to fit the lid, so every
 * position used by the animation (globals.css, "demo-*") is in these stage pixels.
 * No blur anywhere: menu bar, dock and notification use solid colours.
 *
 * Add ?demo=<seconds> to the URL to freeze the animation at that moment (for screenshots).
 */
const STAGE_W = 1200;
const STAGE_H = 750;

function useFitScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  // Layout effect: the screen gets its size before the first paint, so it never pops in
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / STAGE_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, scale };
}

const noSubscribe = () => () => {};
function useFrozenTime() {
  const search = useSyncExternalStore(
    noSubscribe,
    () => window.location.search,
    () => "",
  );
  const v = new URLSearchParams(search).get("demo");
  return v !== null && !Number.isNaN(Number(v)) ? Number(v) : null;
}

/* ---------- small icons ---------- */

function Brand({ id, size = 16 }: { id: BrandId; size?: number }) {
  const { d, color, viewBox } = BRAND_ICONS[id];
  return (
    <svg viewBox={viewBox} width={size} height={size} fill={color} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function AppleLogo() {
  return (
    <svg viewBox="0 0 384 512" className="h-[14px] w-auto fill-current" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function ChromeLogo({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path d="M16 16 5.61 10A12 12 0 0 1 26.39 10Z" fill="#ea4335" />
      <path d="M16 16 26.39 10A12 12 0 0 1 16 28Z" fill="#fbbc04" />
      <path d="M16 16 16 28A12 12 0 0 1 5.61 10Z" fill="#34a853" />
      <circle cx="16" cy="16" r="5.6" fill="#fff" />
      <circle cx="16" cy="16" r="4.4" fill="#1a73e8" />
    </svg>
  );
}

function Stroke({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`fill-none stroke-current ${className}`}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/* ---------- macOS menu bar ---------- */

function MenuBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-20 flex h-[26px] items-center justify-between bg-white/40 px-4 text-[13px] text-[#1d1d1f]">
      <div className="flex items-center gap-[18px]">
        <AppleLogo />
        <span className="font-semibold">Chrome</span>
        {["File", "Edit", "View", "History", "Bookmarks", "Profiles", "Tab"].map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
      <div className="flex items-center gap-[14px]">
        {/* battery */}
        <svg viewBox="0 0 28 14" className="h-[12px] w-auto" aria-hidden="true">
          <rect
            x="0.5"
            y="0.5"
            width="23"
            height="13"
            rx="3.5"
            fill="none"
            stroke="currentColor"
            strokeOpacity=".5"
          />
          <rect x="2.5" y="2.5" width="15" height="9" rx="2" fill="currentColor" />
          <path
            d="M25.5 5v4"
            stroke="currentColor"
            strokeOpacity=".5"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        {/* wi-fi */}
        <svg viewBox="0 0 24 18" className="h-[13px] w-auto fill-current" aria-hidden="true">
          <path d="M12 3.2c3.6 0 6.9 1.4 9.3 3.7l1.7-1.8C20.1 2.3 16.2.7 12 .7S3.9 2.3 1 5.1l1.7 1.8C5.1 4.6 8.4 3.2 12 3.2Zm0 5c2.3 0 4.3.9 5.8 2.3l1.7-1.8C17.6 6.9 14.9 5.7 12 5.7S6.4 6.9 4.5 8.7l1.7 1.8C7.7 9.1 9.7 8.2 12 8.2Zm0 5c.9 0 1.6.3 2.2.9L12 16.5l-2.2-2.4c.6-.6 1.3-.9 2.2-.9Z" />
        </svg>
        <Stroke d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm10 17-5-5" className="h-[13px] w-[13px]" />
        {/* control centre */}
        <svg
          viewBox="0 0 24 24"
          className="h-[14px] w-[14px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="6" rx="3" />
          <rect x="3" y="14" width="18" height="6" rx="3" />
          <circle cx="7" cy="7" r="1.6" fill="currentColor" />
          <circle cx="17" cy="17" r="1.6" fill="currentColor" />
        </svg>
        <span>Tue 3 Nov&nbsp;&nbsp;5:58 PM</span>
      </div>
    </div>
  );
}

/* ---------- Chrome window ---------- */

function Tab({
  icon,
  title,
  active = false,
}: {
  icon: ReactNode;
  title: string;
  active?: boolean;
}) {
  return (
    <div
      className={`relative flex h-[32px] w-[228px] items-center gap-2 px-3 text-[12px] ${
        active ? "rounded-t-[10px] bg-[#35363a] text-[#e8eaed]" : "text-[#bdc1c6]"
      }`}
    >
      <span className="grid h-4 w-4 place-items-center">{icon}</span>
      <span className="flex-1 truncate">{title}</span>
      <Stroke d="M6 6l12 12M18 6 6 18" className="h-3 w-3 text-[#9aa0a6]" />
      {!active && <span className="absolute top-2 right-0 h-4 w-px bg-white/15" />}
    </div>
  );
}

const CODE: { t: string; c: string }[][] = [
  [
    { t: "class ", c: "#c792ea" },
    { t: "Solution", c: "#ffcb6b" },
    { t: ":", c: "#e8eaed" },
  ],
  [
    { t: "    def ", c: "#c792ea" },
    { t: "twoSum", c: "#82aaff" },
    { t: "(self, nums: ", c: "#e8eaed" },
    { t: "List", c: "#ffcb6b" },
    { t: "[", c: "#e8eaed" },
    { t: "int", c: "#ffcb6b" },
    { t: "], target: ", c: "#e8eaed" },
    { t: "int", c: "#ffcb6b" },
    { t: ") -> ", c: "#e8eaed" },
    { t: "List", c: "#ffcb6b" },
    { t: "[", c: "#e8eaed" },
    { t: "int", c: "#ffcb6b" },
    { t: "]:", c: "#e8eaed" },
  ],
  [{ t: "        seen = {}", c: "#e8eaed" }],
  [
    { t: "        for ", c: "#c792ea" },
    { t: "i, n ", c: "#e8eaed" },
    { t: "in ", c: "#c792ea" },
    { t: "enumerate", c: "#82aaff" },
    { t: "(nums):", c: "#e8eaed" },
  ],
  [
    { t: "            if ", c: "#c792ea" },
    { t: "target - n ", c: "#e8eaed" },
    { t: "in ", c: "#c792ea" },
    { t: "seen:", c: "#e8eaed" },
  ],
  [
    { t: "                return ", c: "#c792ea" },
    { t: "[seen[target - n], i]", c: "#e8eaed" },
  ],
  [{ t: "            seen[n] = i", c: "#e8eaed" }],
  [{ t: "", c: "" }],
  [
    { t: "        return ", c: "#c792ea" },
    { t: "[]", c: "#e8eaed" },
  ],
];

function LeetCodePage() {
  return (
    <div className="flex h-[526px] flex-col bg-[#1a1a1a] text-[#eff1f6]">
      {/* LeetCode top bar: Run / Submit sit in the middle */}
      <div className="relative flex h-[44px] shrink-0 items-center gap-4 px-4 text-[13px] text-[#eff1f6]/80">
        <Brand id="leetcode" size={18} />
        <span className="font-medium text-[#eff1f6]">Problem List</span>
        <span className="flex gap-3 text-[#eff1f6]/50">
          <Stroke d="M15 6l-6 6 6 6" className="h-4 w-4" />
          <Stroke d="M9 6l6 6-6 6" className="h-4 w-4" />
        </span>
        <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-[2px]">
          <span className="flex h-[32px] w-[76px] items-center justify-center gap-1.5 rounded-l-md bg-[#2d2d2d] text-[13px]">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M7 4.5v15l12-7.5Z" />
            </svg>
            Run
          </span>
          <span className="demo-submit flex h-[32px] w-[92px] items-center justify-center gap-1.5 rounded-r-md bg-[#2d2d2d] text-[13px] font-medium text-[#2cbb5d]">
            <Stroke d="M12 16V8m-4 4 4-4 4 4M5 19h14" className="h-4 w-4" />
            Submit
          </span>
        </div>
        <span className="ml-auto flex items-center gap-3">
          <span className="rounded-md bg-[#ffa116]/15 px-2.5 py-1 text-[12px] text-[#ffa116]">
            Premium
          </span>
          <span className="h-7 w-7 rounded-full bg-linear-to-br from-[#f5a524] to-[#e2557a]" />
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_1.08fr] gap-2 px-2 pb-2">
        {/* Description */}
        <div className="overflow-hidden rounded-lg bg-[#262626]">
          <div className="flex h-[36px] items-center gap-5 bg-[#303030] px-4 text-[12px] text-[#eff1f6]/60">
            <span className="font-medium text-[#eff1f6]">Description</span>
            <span>Editorial</span>
            <span>Solutions</span>
            <span>Submissions</span>
          </div>
          <div className="px-5 pt-4 text-[13px] leading-[1.65] text-[#eff1f6]/85">
            <div className="text-[22px] font-semibold text-[#eff1f6]">1. Two Sum</div>
            <div className="mt-3 flex gap-2 text-[11.5px]">
              <span className="rounded-full bg-[#ffffff]/10 px-2.5 py-0.5 text-[#1cbaba]">
                Easy
              </span>
              <span className="rounded-full bg-[#ffffff]/10 px-2.5 py-0.5">Topics</span>
              <span className="rounded-full bg-[#ffffff]/10 px-2.5 py-0.5">Companies</span>
              <span className="rounded-full bg-[#ffffff]/10 px-2.5 py-0.5">Hint</span>
            </div>
            <p className="mt-4">
              Given an array of integers <Code>nums</Code> and an integer <Code>target</Code>,
              return <i>indices of the two numbers such that they add up to</i> <Code>target</Code>.
            </p>
            <p className="mt-3">
              You may assume that each input would have <b>exactly one solution</b>, and you may not
              use the same element twice.
            </p>
            <p className="mt-4 font-semibold text-[#eff1f6]">Example 1:</p>
            <div className="mt-2 border-l-2 border-white/15 pl-3 font-mono text-[12px] leading-[1.75] text-[#eff1f6]/75">
              <div>
                <b className="text-[#eff1f6]">Input:</b> nums = [2,7,11,15], target = 9
              </div>
              <div>
                <b className="text-[#eff1f6]">Output:</b> [0,1]
              </div>
              <div>
                <b className="text-[#eff1f6]">Explanation:</b> nums[0] + nums[1] == 9
              </div>
            </div>
          </div>
        </div>

        {/* Code + result */}
        <div className="flex min-h-0 flex-col gap-2">
          <div className="flex-1 overflow-hidden rounded-lg bg-[#1e1e1e] ring-1 ring-white/5">
            <div className="flex h-[36px] items-center gap-2 bg-[#303030] px-4 text-[12px] font-medium">
              <span className="font-mono text-[#2cbb5d]">&lt;/&gt;</span> Code
            </div>
            <div className="flex h-[30px] items-center gap-1 border-b border-white/5 px-4 text-[12px] text-[#eff1f6]/60">
              Python3
              <Stroke d="M6 9l6 6 6-6" className="h-3 w-3" />
              <span className="ml-3">Auto</span>
            </div>
            <div className="py-2 font-mono text-[12px] leading-[22px]">
              {CODE.map((line, i) => (
                <div key={i} className="flex whitespace-pre">
                  <span className="w-10 pr-3 text-right text-[#6e7681]">{i + 1}</span>
                  {line.map((tok, j) => (
                    <span key={j} style={{ color: tok.c }}>
                      {tok.t}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-[132px] shrink-0 overflow-hidden rounded-lg bg-[#262626]">
            <div className="flex h-[34px] items-center gap-5 bg-[#303030] px-4 text-[12px] text-[#eff1f6]/60">
              <span>Testcase</span>
              <span className="font-medium text-[#eff1f6]">Test Result</span>
            </div>
            <div className="demo-result-before absolute inset-x-0 top-[34px] bottom-0 grid place-items-center text-[12px] text-[#eff1f6]/45">
              You must run your code first
            </div>
            <div className="demo-result-after absolute inset-x-0 top-[34px] bottom-0 px-5 pt-4">
              <div className="flex items-baseline gap-3">
                <span className="text-[20px] font-semibold text-[#2cbb5d]">Accepted</span>
                <span className="text-[12px] text-[#eff1f6]/50">63 / 63 testcases passed</span>
              </div>
              <div className="mt-3 flex gap-3 text-[12px]">
                <span className="rounded-md bg-white/[0.06] px-3 py-2">
                  <span className="text-[#eff1f6]/50">Runtime</span>{" "}
                  <b className="font-semibold">0 ms</b>
                </span>
                <span className="rounded-md bg-white/[0.06] px-3 py-2">
                  <span className="text-[#eff1f6]/50">Beats</span>{" "}
                  <b className="font-semibold">100.00%</b>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded border border-white/10 bg-white/[0.07] px-1 py-px font-mono text-[12px]">
      {children}
    </code>
  );
}

function ChromeWindow() {
  return (
    <div className="absolute top-[44px] left-[60px] z-10 h-[604px] w-[1080px] overflow-hidden rounded-[12px] bg-[#202124] shadow-[0_0_0_0.5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)_inset,0_28px_60px_-14px_rgba(10,30,80,0.55)]">
      {/* Tab strip */}
      <div className="flex h-[38px] items-end gap-0 pr-3 pl-[14px]">
        <span className="mr-5 mb-[13px] flex gap-2">
          <i className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <i className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <i className="h-3 w-3 rounded-full bg-[#28c840]" />
        </span>
        <Tab active icon={<Brand id="leetcode" size={14} />} title="Two Sum - LeetCode" />
        <Tab icon={<Brand id="github" size={14} />} title="sahilmishra03 · GitHub" />
        <Tab icon={<Brand id="gfg" size={15} />} title="Problem of the Day | GfG" />
        <span className="mb-[7px] ml-1 grid h-[24px] w-[24px] place-items-center rounded-full text-[#bdc1c6]">
          <Stroke d="M12 5v14M5 12h14" className="h-4 w-4" />
        </span>
        <span className="mb-[7px] ml-auto grid h-[24px] w-[24px] place-items-center text-[#bdc1c6]">
          <Stroke d="M6 9l6 6 6-6" className="h-4 w-4" />
        </span>
      </div>

      {/* Toolbar */}
      <div className="relative flex h-[40px] items-center gap-1 bg-[#35363a] pr-[150px] pl-2 text-[#c4c7c5]">
        {[
          "M19 12H5m6-6-6 6 6 6",
          "M5 12h14m-6-6 6 6-6 6",
          "M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4",
        ].map((d, i) => (
          <span
            key={i}
            className={`grid h-8 w-8 place-items-center ${i === 1 ? "opacity-40" : ""}`}
          >
            <Stroke d={d} className="h-[17px] w-[17px]" />
          </span>
        ))}
        <div className="ml-1 flex h-[30px] flex-1 items-center gap-3 rounded-full bg-[#202124] px-3.5 text-[13px]">
          <Stroke
            d="M4 7h10m4 0h2M4 17h4m4 0h8M16 5v4M10 15v4"
            className="h-[15px] w-[15px] text-[#c4c7c5]"
          />
          <span>
            <span className="text-[#e8eaed]">leetcode.com</span>
            <span className="text-[#9aa0a6]">/problems/two-sum/description/</span>
          </span>
          <Stroke
            d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9Z"
            className="ml-auto h-[15px] w-[15px]"
          />
        </div>
        {/* Extensions: StreakSync pinned, then the puzzle menu, profile and kebab */}
        <span className="demo-icon absolute top-[6px] right-[110px] grid h-7 w-7 place-items-center rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" className="h-[18px] w-[18px]" />
        </span>
        <span className="absolute top-[6px] right-[78px] grid h-7 w-7 place-items-center">
          <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] fill-current" aria-hidden="true">
            <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z" />
          </svg>
        </span>
        <span className="absolute top-[12px] right-[68px] h-4 w-px bg-white/15" />
        <span className="absolute top-[7px] right-[36px] h-[26px] w-[26px] rounded-full bg-linear-to-br from-[#f5a524] to-[#e2557a] ring-2 ring-[#35363a]" />
        <span className="absolute top-[6px] right-[6px] grid h-7 w-7 place-items-center">
          <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] fill-current" aria-hidden="true">
            <circle cx="12" cy="5" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="12" cy="19" r="1.8" />
          </svg>
        </span>
      </div>

      <LeetCodePage />
    </div>
  );
}

/* ---------- Dock ---------- */

function DockIcon({
  bg,
  running = false,
  children,
}: {
  bg: string;
  running?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center">
      <div
        className="grid h-[50px] w-[50px] place-items-center overflow-hidden rounded-[12px]"
        style={{
          background: bg,
          boxShadow: "0 0 0 0.5px rgba(0,0,0,0.14) inset, 0 2px 4px rgba(10,30,80,0.2)",
        }}
      >
        {children}
      </div>
      <span
        className="absolute -bottom-[7px] h-[4px] w-[4px] rounded-full bg-black/60"
        style={{ opacity: running ? 1 : 0 }}
      />
    </div>
  );
}

export function Dock() {
  return (
    <div className="absolute bottom-[8px] left-1/2 z-20 flex -translate-x-1/2 items-end gap-[8px] rounded-[22px] border border-white/50 bg-white/35 px-[9px] pt-[8px] pb-[10px] shadow-[0_10px_30px_-6px_rgba(10,30,80,0.35)]">
      {/* Finder */}
      <DockIcon bg="linear-gradient(90deg,#1e8ef5 0 50%,#d8ecff 50% 100%)" running>
        <svg viewBox="0 0 32 32" className="h-[50px] w-[50px]" aria-hidden="true">
          <path
            d="M17.5 2c-2 6-3.6 10.2-2.6 15H13c-.4 5 .8 9.4 2.4 13"
            fill="none"
            stroke="#0b2a4a"
            strokeWidth="1.4"
          />
          <rect x="9" y="10" width="1.8" height="5" rx=".9" fill="#0b2a4a" />
          <rect x="21.2" y="10" width="1.8" height="5" rx=".9" fill="#0b2a4a" />
          <path
            d="M8 21.5c4.5 3.5 11.5 3.5 16 0"
            fill="none"
            stroke="#0b2a4a"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </DockIcon>
      {/* Chrome */}
      <DockIcon bg="linear-gradient(180deg,#ffffff,#eceff3)" running>
        <ChromeLogo size={36} />
      </DockIcon>
      {/* Calendar */}
      <DockIcon bg="#ffffff">
        <div className="flex flex-col items-center leading-none">
          <span className="text-[10px] font-semibold tracking-wide text-[#ff3b30]">NOV</span>
          <span className="mt-0.5 text-[26px] font-light text-[#1d1d1f]">3</span>
        </div>
      </DockIcon>
      {/* Notes */}
      <DockIcon bg="linear-gradient(180deg,#ffd60a 0 26%,#fffdf4 26% 100%)">
        <div className="mt-[14px] flex w-[30px] flex-col gap-[5px]">
          <span className="h-px bg-[#c7c2b3]" />
          <span className="h-px bg-[#c7c2b3]" />
          <span className="h-px bg-[#c7c2b3]" />
        </div>
      </DockIcon>
      {/* Terminal */}
      <DockIcon bg="linear-gradient(180deg,#3a3a3c,#151517)" running>
        <span className="font-mono text-[16px] font-semibold text-white/90">&gt;_</span>
      </DockIcon>
      {/* VS Code */}
      <DockIcon bg="linear-gradient(180deg,#2aa4f4,#0f6fc6)" running>
        <svg viewBox="0 0 32 32" className="h-[30px] w-[30px]" aria-hidden="true">
          <path
            d="M22.5 3 27 5.2v21.6L22.5 29 11 18.4 6 22.2l-2-1.4V11.2l2-1.4 5 3.8Z"
            fill="#fff"
            fillOpacity=".95"
          />
          <path d="M22.5 9.5 14.4 16l8.1 6.5ZM6.5 13v6l3.3-3Z" fill="#1678d0" />
        </svg>
      </DockIcon>
      {/* System Settings */}
      <DockIcon bg="linear-gradient(180deg,#d9dce2,#9da3ad)">
        <svg viewBox="0 0 24 24" className="h-[32px] w-[32px]" aria-hidden="true">
          <path
            fill="#55595f"
            d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.5 7.5 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.5 7.5 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1l.4 2.6h4l.4-2.6c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5Z"
          />
          <circle cx="12" cy="12" r="3.2" fill="#c4c8cf" />
        </svg>
      </DockIcon>
      <span className="mx-[2px] mb-[6px] h-[44px] w-px bg-black/20" />
      {/* Trash */}
      <DockIcon bg="linear-gradient(180deg,rgba(255,255,255,0.8),rgba(225,232,242,0.6))">
        <svg
          viewBox="0 0 32 32"
          className="h-[30px] w-[30px] fill-none stroke-[#7c8494]"
          strokeWidth="1.4"
          aria-hidden="true"
        >
          <path d="M7 9h18M13 9V6.5h6V9" />
          <path d="M9 9l1.4 17.5h11.2L23 9" />
          <path d="M13.5 13v10M18.5 13v10" />
        </svg>
      </DockIcon>
    </div>
  );
}

/* ---------- macOS notification from Chrome ---------- */

function Notification() {
  return (
    <div className="demo-toast absolute top-[36px] right-[14px] z-30 flex w-[352px] items-center gap-3 rounded-[16px] border border-black/5 bg-[#f5f5f7] p-3 text-[#1d1d1f] shadow-[0_12px_30px_-8px_rgba(10,30,80,0.35)]">
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[9px] bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.12)]">
        <ChromeLogo size={30} />
      </span>
      <div className="min-w-0 flex-1 text-[12.5px] leading-[1.35]">
        <div className="flex justify-between">
          <b className="font-semibold">StreakSync</b>
          <span className="text-[11px] text-[#86868b]">now</span>
        </div>
        <div className="font-medium">1 left today: GeeksforGeeks</div>
        <div className="text-[#515154]">Your 6-day streak ends at midnight.</div>
      </div>
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[8px] bg-[#0b0b0c]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="" className="h-6 w-6" />
      </span>
    </div>
  );
}

function Screen() {
  return (
    <div
      className="relative h-full w-full overflow-hidden antialiased select-none"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', var(--font-geist-sans), 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Plain gradient wallpaper in the site colours */}
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_18%_12%,#d6ebff_0%,transparent_60%),radial-gradient(80%_70%_at_88%_92%,#ffd9a3_0%,transparent_62%),linear-gradient(160deg,#4f97f0_0%,#86bfff_48%,#f1c38f_100%)]" />
      <MenuBar />
      {/* Notch */}
      <div className="absolute top-0 left-1/2 z-30 h-[26px] w-[170px] -translate-x-1/2 rounded-b-[12px] bg-black" />
      <ChromeWindow />

      {/* Extension popup, hanging under the StreakSync toolbar icon */}
      <div className="demo-popup absolute top-[128px] left-[730px] z-20 origin-top-right rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_40px_-8px_rgba(0,0,0,0.7)]">
        <PopupMock state="before" className="demo-before" />
        <PopupMock state="after" className="demo-after absolute inset-0" />
      </div>

      <Notification />
      <Dock />

      {/* Cursor; its tip is at (4, 3) of the 24px box */}
      <svg
        viewBox="0 0 24 24"
        className="demo-cursor absolute top-0 left-0 z-40 h-[22px] w-[22px]"
        aria-hidden="true"
      >
        <path
          d="M4 2.5v17l4.6-4.3 3 6.6 2.8-1.3-3-6.4H18L4 2.5Z"
          fill="#000"
          stroke="#fff"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function MacbookDemo({ className = "" }: { className?: string }) {
  const { ref, scale } = useFitScale();
  const frozen = useFrozenTime();

  return (
    <div className={className} aria-hidden="true">
      {/* Lid: black bezel with a thin aluminium edge */}
      <div className="rounded-[22px] bg-[#0d0d0f] p-[1.2%] shadow-[0_0_0_1px_#c7c9cf,0_0_0_1px_rgba(255,255,255,0.08)_inset,0_30px_80px_-20px_rgba(20,40,90,0.35)]">
        <div
          ref={ref}
          className="relative overflow-hidden rounded-[10px] bg-[#86bfff]"
          style={{ aspectRatio: `${STAGE_W} / ${STAGE_H}` }}
        >
          <div
            className={`absolute top-0 left-0 ${frozen !== null ? "demo-frozen" : ""}`}
            style={
              {
                width: STAGE_W,
                height: STAGE_H,
                // zoom (not transform: scale) so text is laid out at its real size and stays crisp
                zoom: scale ?? 1,
                visibility: scale === null ? "hidden" : "visible",
                "--demo-delay": frozen !== null ? `-${frozen}s` : undefined,
              } as CSSProperties
            }
          >
            <Screen />
          </div>
        </div>
      </div>
      {/* Base, a little wider than the lid, with the opening notch in the front edge */}
      <div className="relative -mx-[3%] h-[14px] rounded-b-[16px] bg-linear-to-b from-[#e4e6ea] via-[#cdd0d6] to-[#a3a6ad] shadow-[0_20px_30px_-12px_rgba(20,40,90,0.35)] sm:h-[16px]">
        <div className="absolute top-0 left-1/2 h-[5px] w-[14%] -translate-x-1/2 rounded-b-[6px] bg-[#b4b7bd] shadow-[inset_0_1px_2px_rgba(0,0,0,0.18)]" />
      </div>
    </div>
  );
}
