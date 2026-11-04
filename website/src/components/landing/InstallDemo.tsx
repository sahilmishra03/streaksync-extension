import type { ReactNode } from "react";
import type { BrandId } from "@/lib/brandIcons";
import { FitStage } from "../FitStage";
import { AppleLogo, Dock } from "../MacbookDemo";
import { Brand, Cursor, Logo, WALLPAPER } from "./bits";

/*
 * Install + setup as one 24s clip ("in-*" classes in landing.css) on a macOS desktop.
 * The Chrome window is 720 x 440; all animation positions are in its pixels.
 *   0-19.5%   website: click Download, the zip lands, double-click it in Finder, a folder appears
 *  19.5-34.5% chrome://extensions: switch on Developer mode
 *  34.5-51%   Load unpacked, pick the streaksync-extension folder, Select
 *  51-75%     StreakSync card appears, pin it from the puzzle menu
 *  75-100%    click the pinned icon, Get started, switch on each platform, all set
 * The step list beside it (Install.tsx) lights up in sync using the same timings.
 */

export const STAGE_W = 720;
export const STAGE_H = 440;

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

const PUZZLE =
  "M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z";

export function FolderIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 20 16" width={size} height={size * 0.8} aria-hidden="true">
      <path
        d="M1 3a2 2 0 0 1 2-2h4.2l2 2H17a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2Z"
        fill="#4a90e2"
      />
      <path d="M1 6h18v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2Z" fill="#6aafff" />
    </svg>
  );
}

export function ZipIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 20" width={size * 0.8} height={size} aria-hidden="true">
      <path d="M1 2a1 1 0 0 1 1-1h8l5 5v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1Z" fill="#f5a524" />
      <path d="M10 1v5h5" fill="none" stroke="#fff" strokeOpacity=".6" />
      <path d="M6 3h2v2H6zM8 5h2v2H8zM6 7h2v2H6zM8 9h2v2H8z" fill="#fff" fillOpacity=".85" />
    </svg>
  );
}

function Swap({ a, b, cls }: { a: ReactNode; b: ReactNode; cls: string }) {
  return (
    <span className="relative inline-grid">
      <span className={`in-${cls}-a col-start-1 row-start-1`}>{a}</span>
      <span className={`in-${cls}-b col-start-1 row-start-1`}>{b}</span>
    </span>
  );
}

/* ---------- Chrome frame ---------- */

function TabStrip() {
  return (
    <div className="flex h-[34px] items-end bg-[#dfe3ea] pl-3">
      <span className="mr-4 mb-[11px] flex gap-1.5">
        <i className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
        <i className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
        <i className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
      </span>
      <div className="flex h-[28px] w-[200px] items-center gap-2 rounded-t-[9px] bg-white px-3 text-[11.5px] text-[#1f1f1f]">
        <Swap
          cls="tabicon"
          a={<Logo className="h-3.5 w-3.5 rounded-sm bg-[#0b0b0c] p-px" />}
          b={
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-[#5f6368]" aria-hidden="true">
              <path d={PUZZLE} />
            </svg>
          }
        />
        <span className="flex-1 truncate">
          <Swap cls="tabname" a="StreakSync" b="Extensions" />
        </span>
      </div>
      <div className="in-tab2 flex h-[28px] w-[200px] items-center gap-2 px-3 text-[11.5px] text-[#444]">
        <Logo className="h-3.5 w-3.5 rounded-sm bg-[#0b0b0c] p-px" />
        Welcome to StreakSync
      </div>
    </div>
  );
}

function Toolbar() {
  return (
    <div className="relative flex h-[38px] items-center gap-1 border-b border-black/10 bg-white pr-[110px] pl-2 text-[#5f6368]">
      <Stroke d="M19 12H5m6-6-6 6 6 6" className="mx-1.5 h-4 w-4" />
      <Stroke d="M5 12h14m-6-6 6 6-6 6" className="mx-1.5 h-4 w-4 opacity-40" />
      <Stroke d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4" className="mx-1.5 h-4 w-4" />
      <div className="ml-1 flex h-[28px] flex-1 items-center rounded-full bg-[#f1f3f4] px-3.5 text-[12px] text-[#1f1f1f]">
        <span className="relative inline-grid">
          <span className="in-url-a col-start-1 row-start-1">
            streaksync.app<span className="text-[#5f6368]">/#download</span>
          </span>
          <span className="in-url-b col-start-1 row-start-1">
            <span className="text-[#5f6368]">chrome://</span>extensions
          </span>
          <span className="in-url-c col-start-1 row-start-1">
            streaksync.app<span className="text-[#5f6368]">/settings</span>
          </span>
        </span>
      </div>
      {/* pinned StreakSync, appears in step 4 and is clicked in step 5 */}
      <span className="in-pin absolute top-[5px] right-[74px] grid h-7 w-7 place-items-center rounded-full bg-[#0b0b0c]">
        <span className="in-pinclick absolute inset-0 rounded-full" />
        <Logo className="h-4 w-4" />
      </span>
      <span className="in-puzzle absolute top-[5px] right-[42px] grid h-7 w-7 place-items-center rounded-full">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d={PUZZLE} />
        </svg>
      </span>
      <span className="absolute top-[8px] right-[12px] h-[22px] w-[22px] rounded-full bg-linear-to-br from-[#f5a524] to-[#e2557a]" />
      {/* download bubble, step 1 */}
      <div className="in-dl absolute top-[40px] right-[8px] z-20 w-[250px] rounded-xl border border-black/10 bg-white p-3 text-[12px] text-[#1f1f1f] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.3)]">
        <div className="text-[11px] font-medium text-[#5f6368]">Recent download history</div>
        <div className="mt-2 flex items-center gap-2.5">
          <ZipIcon size={22} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">streaksync-extension.zip</div>
            <div className="text-[11px] text-[#5f6368]">148 KB · Done</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Scene 1: the website and Finder ---------- */

function SitePage() {
  return (
    <div className="in-site absolute inset-x-0 top-[72px] bottom-0 z-10 flex flex-col items-center bg-[#fafaf9] pt-16 text-center">
      <div className="font-mono text-[10px] tracking-[0.2em] text-[#262322]/45">INSTALL</div>
      <div
        className="mt-2 text-[34px] leading-tight text-[#262322]"
        style={{ fontFamily: "var(--font-fraunces)", fontWeight: 330, letterSpacing: "-0.04em" }}
      >
        Ready in a <i>minute</i>
      </div>
      <span className="in-dlbtn mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-linear-to-r from-[#1f5fd6] via-[#3d86ee] to-[#6aafff] px-5 text-[12px] font-medium tracking-[0.08em] text-white uppercase">
        <Stroke d="M12 4v11m-5-5 5 5 5-5M5 20h14" className="h-4 w-4" />
        Download .zip
      </span>
    </div>
  );
}

function Finder() {
  return (
    <div className="in-finder absolute top-[118px] left-[150px] z-30 h-[230px] w-[420px] overflow-hidden rounded-[12px] border border-black/10 bg-white text-[12px] text-[#1d1d1f] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.4)]">
      <div className="flex h-[34px] items-center gap-1.5 border-b border-black/[0.06] bg-[#f6f6f6] px-3">
        <i className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
        <i className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
        <i className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
        <b className="ml-3 font-semibold">Downloads</b>
      </div>
      <div className="flex h-[196px]">
        <div className="w-[104px] space-y-1.5 border-r border-black/[0.06] bg-[#f3f3f5] p-3 text-[11px] text-[#6e6e73]">
          <div className="text-[10px] font-semibold text-[#aeaeb2]">Favourites</div>
          <div>Desktop</div>
          <div className="rounded bg-black/[0.07] px-1.5 py-0.5 text-[#1d1d1f]">Downloads</div>
          <div>Documents</div>
        </div>
        <div className="flex flex-1 items-center justify-center gap-14">
          <div className="in-zipfile flex flex-col items-center gap-2 rounded-lg px-2 py-1.5">
            <ZipIcon size={54} />
            <span className="text-[11px]">streaksync-extension.zip</span>
          </div>
          <div className="in-unzip flex flex-col items-center gap-2 px-2 py-1.5">
            <FolderIcon size={62} />
            <span className="text-[11px] font-medium">streaksync-extension</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Scenes 2-4: chrome://extensions ---------- */

function Toggle({ cls }: { cls: string }) {
  return (
    <span className={`${cls} relative inline-block h-[16px] w-[30px] rounded-full`}>
      <span
        className={`${cls}-knob absolute top-[2px] left-[2px] h-[12px] w-[12px] rounded-full bg-white shadow`}
      />
    </span>
  );
}

function ExtCard({
  name,
  body,
  icon,
  cls = "",
}: {
  name: string;
  body: string;
  icon: ReactNode;
  cls?: string;
}) {
  return (
    <div
      className={`${cls} flex h-[126px] w-[216px] flex-col rounded-[10px] border border-black/10 bg-white p-3.5 text-[11px] text-[#5f6368] shadow-[0_1px_2px_rgba(0,0,0,0.06)]`}
    >
      <div className="flex gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg">{icon}</span>
        <div className="min-w-0">
          <div className="text-[12.5px] font-medium text-[#1f1f1f]">{name}</div>
          <div className="mt-0.5 leading-snug">{body}</div>
        </div>
      </div>
      <div className="mt-auto flex items-center gap-2">
        <span className="rounded-full border border-black/10 px-2.5 py-1 text-[10.5px] text-[#0b57d0]">
          Details
        </span>
        <span className="rounded-full border border-black/10 px-2.5 py-1 text-[10.5px] text-[#0b57d0]">
          Remove
        </span>
        <span className="ml-auto inline-block h-[16px] w-[30px] rounded-full bg-[#0b57d0]">
          <span className="relative top-[2px] left-[16px] block h-[12px] w-[12px] rounded-full bg-white" />
        </span>
      </div>
    </div>
  );
}

function ExtensionsPage() {
  return (
    <div className="absolute inset-x-0 top-[72px] bottom-0 bg-[#f8fafd] text-[#1f1f1f]">
      <div className="flex h-[56px] items-center gap-3 px-5">
        <Stroke d="M4 6h16M4 12h16M4 18h16" className="h-4 w-4 text-[#5f6368]" />
        <span className="text-[17px]">Extensions</span>
        <span className="ml-8 flex h-[30px] w-[260px] items-center gap-2 rounded-full bg-[#e9eef6] px-3 text-[11.5px] text-[#5f6368]">
          <Stroke d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm10 17-5-5" className="h-3.5 w-3.5" />
          Search extensions
        </span>
        <span className="ml-auto flex items-center gap-2.5 text-[12px] text-[#444]">
          Developer mode
          <Toggle cls="in-devtoggle" />
        </span>
      </div>
      <div className="in-devbar flex h-[44px] items-center gap-2 border-y border-black/[0.06] bg-white px-5">
        {["Load unpacked", "Pack extension", "Update"].map((b, i) => (
          <span
            key={b}
            className={`rounded-full border border-black/15 px-3.5 py-1.5 text-[11.5px] font-medium text-[#0b57d0] ${i === 0 ? "in-loadbtn" : ""}`}
          >
            {b}
          </span>
        ))}
      </div>
      <div className="flex gap-3 px-5 pt-4">
        <ExtCard
          name="Google Docs Offline"
          body="Edit, create and view your documents without internet."
          icon={
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#4285f4] text-[13px] font-bold text-white">
              D
            </span>
          }
        />
        <ExtCard
          cls="in-card"
          name="StreakSync 2.0.0"
          body="Reminders for GitHub, LeetCode and GFG streaks."
          icon={
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#0b0b0c]">
              <Logo className="h-6 w-6" />
            </span>
          }
        />
      </div>
    </div>
  );
}

function Picker() {
  return (
    <div className="in-picker absolute top-[104px] left-[150px] z-30 w-[420px] overflow-hidden rounded-[12px] border border-black/10 bg-white text-[12px] text-[#1d1d1f] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.4)]">
      <div className="border-b border-black/[0.06] bg-[#f6f6f6] px-4 py-2.5 text-center font-semibold">
        Select the extension directory
      </div>
      <div className="flex h-[170px]">
        <div className="w-[104px] space-y-1.5 border-r border-black/[0.06] bg-[#f3f3f5] p-3 text-[11px] text-[#6e6e73]">
          <div className="text-[10px] font-semibold text-[#aeaeb2]">Favourites</div>
          <div>Desktop</div>
          <div className="rounded bg-black/[0.07] px-1.5 py-0.5 text-[#1d1d1f]">Downloads</div>
          <div>Documents</div>
        </div>
        <div className="flex-1 p-2">
          <div className="in-pickrow flex items-center gap-2 rounded-md px-2.5 py-2">
            <FolderIcon size={16} />
            <span className="font-medium">streaksync-extension</span>
            <span className="ml-auto text-[10.5px] opacity-60">Folder</span>
          </div>
          <div className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[#aeaeb2]">
            <ZipIcon size={15} />
            streaksync-extension.zip
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-black/[0.06] px-4 py-2.5">
        <span className="rounded-md border border-black/10 px-4 py-1 text-[11.5px]">Cancel</span>
        <span className="in-select rounded-md bg-[#0a84ff] px-4 py-1 text-[11.5px] font-medium text-white">
          Select
        </span>
      </div>
    </div>
  );
}

function PuzzleMenu() {
  return (
    <div className="in-menu absolute top-[74px] right-[20px] z-30 w-[230px] rounded-xl border border-black/10 bg-white p-2.5 text-[12px] text-[#1f1f1f] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.3)]">
      <div className="px-1.5 pb-2 text-[11px] font-medium text-[#5f6368]">Extensions</div>
      <div className="flex items-center gap-2.5 rounded-md bg-[#f1f3f4] px-1.5 py-1.5">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-[#0b0b0c]">
          <Logo className="h-4 w-4" />
        </span>
        <span className="flex-1">StreakSync</span>
        <svg viewBox="0 0 24 24" className="in-pinicon h-4 w-4" aria-hidden="true">
          <path d="M16 3l5 5-3 1-4 4 1 5-2 2-4-4-5 5-1-1 5-5-4-4 2-2 5 1 4-4z" />
        </svg>
      </div>
    </div>
  );
}

/* ---------- Scene 5: first-run popup, then the setup page ---------- */

// Popup under the pinned icon. Get started's centre is at (550, 216) in window pixels.
function SetupPopup() {
  return (
    <div className="in-pop absolute top-[76px] left-[440px] z-30 h-[170px] w-[220px] rounded-xl border border-white/10 bg-[#0b0b0c] text-center text-[#f4f4f0] shadow-[0_18px_40px_-8px_rgba(0,0,0,0.55)]">
      <div className="flex flex-col items-center pt-4">
        <Logo className="h-9 w-9" />
        <div className="mt-2 text-[13px] font-semibold">Never break your streak</div>
        <div className="mt-1 px-5 text-[10.5px] leading-snug text-[#9a9aa2]">
          Track GitHub, LeetCode and GFG.
        </div>
      </div>
      <span className="in-getstarted absolute inset-x-[14px] bottom-[14px] grid h-8 place-items-center rounded-lg bg-[#1f5fd6] text-[12px] font-semibold text-white">
        Get started
      </span>
    </div>
  );
}

const SETUP_ROWS: { id: BrandId; name: string; who: string }[] = [
  { id: "github", name: "GitHub", who: "Signed in as @sahilmishra03" },
  { id: "leetcode", name: "LeetCode", who: "Detected @sahil_lc" },
  { id: "gfg", name: "GeeksforGeeks", who: "Detected @sahil_gfg" },
];

// Rows sit at window y 175 / 219 / 263 (40px tall); toggles centre on x 535
function SetupPage() {
  return (
    <div className="in-setup absolute inset-x-0 top-[72px] bottom-0 z-20 bg-[#0b0b0c] text-[#f4f4f0]">
      <div className="absolute top-[26px] left-[150px] w-[420px]">
        <div className="text-[18px] font-semibold tracking-[-0.01em]">Set up StreakSync</div>
        <div className="mt-0.5 text-[11.5px] text-[#9a9aa2]">
          Turn on what you want reminders for.
        </div>
      </div>
      {SETUP_ROWS.map((r, i) => (
        <div
          key={r.id}
          className="absolute left-[150px] flex h-[40px] w-[420px] items-center gap-3 rounded-lg border border-white/[0.08] bg-[#161618] px-3"
          style={{ top: 103 + i * 44 }}
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-[#1b1b1e]">
            <Brand id={r.id} size={15} />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[12.5px] font-semibold">{r.name}</span>
            <span className={`in-ok${i + 1} block text-[10.5px] text-[#4ade80]`}>{r.who}</span>
          </span>
          <span className={`in-tog${i + 1} relative mr-[5px] h-[16px] w-[30px] rounded-full`}>
            <span
              className={`in-knob${i + 1} absolute top-[2px] left-[2px] h-[12px] w-[12px] rounded-full bg-white`}
            />
          </span>
        </div>
      ))}
      <div className="absolute top-[245px] left-[150px] w-[420px]">
        <div className="text-[10px] tracking-[0.12em] text-[#9a9aa2] uppercase">Reminders</div>
        <div className="mt-2 flex gap-1.5">
          {["10:00 AM", "2:00 PM", "6:00 PM", "10:00 PM"].map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 bg-[#161618] px-2.5 py-1 text-[11px]"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="in-allset absolute top-[310px] left-[150px] inline-flex items-center gap-2 rounded-full bg-[#4ade80]/12 px-3 py-1.5 text-[11.5px] font-medium text-[#4ade80]">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        All set. First reminder at 10:00 AM.
      </div>
    </div>
  );
}

/* ---------- macOS desktop around the Chrome window ---------- */

// The desktop is 896 x 560 (MacBook 16:10). The Chrome window is 720 x 440 at (88, 36);
// every animation position in landing.css is in window pixels.
const DESK_W = 896;
const DESK_H = 560;

function DesktopMenuBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex h-[24px] items-center justify-between bg-white/40 px-3.5 text-[12px] text-[#1d1d1f]">
      <div className="flex items-center gap-4">
        <AppleLogo />
        <b className="font-semibold">Chrome</b>
        {["File", "Edit", "View", "History", "Bookmarks", "Window"].map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 28 14" className="h-[11px] w-auto" aria-hidden="true">
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
        </svg>
        <span>Tue 3 Nov&nbsp;&nbsp;9:41 AM</span>
      </div>
    </div>
  );
}

export function InstallDemo() {
  return (
    <FitStage width={DESK_W} height={DESK_H}>
      <div
        className={`relative h-full w-full overflow-hidden antialiased select-none ${WALLPAPER}`}
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Text', var(--font-geist-sans), 'Segoe UI', system-ui, sans-serif",
        }}
        aria-hidden="true"
      >
        <DesktopMenuBar />
        <div className="absolute top-0 left-1/2 z-30 h-[22px] w-[130px] -translate-x-1/2 rounded-b-[10px] bg-black" />
        <div
          className="absolute top-[36px] left-[88px] overflow-hidden rounded-[10px] bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.35),0_24px_50px_-14px_rgba(10,30,80,0.5)]"
          style={{ width: STAGE_W, height: STAGE_H }}
        >
          <TabStrip />
          <Toolbar />
          <ExtensionsPage />
          <SitePage />
          <SetupPage />
          <Finder />
          <Picker />
          <PuzzleMenu />
          <SetupPopup />
          <Cursor className="in-cursor absolute top-0 left-0 z-40" />
        </div>
        <Dock />
      </div>
    </FitStage>
  );
}
