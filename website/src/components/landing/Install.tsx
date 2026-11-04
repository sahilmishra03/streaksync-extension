import type { ReactNode } from "react";
import { ScrollReveal } from "../ScrollReveal";
import { CopyText } from "./CopyText";
import { FolderIcon, InstallDemo } from "./InstallDemo";
import { SectionHead } from "./SectionHead";

// Install section, right after Download: five steps beside a MacBook playing the clip.
// Steps, caption and progress bar all follow the clip's 24s timeline (landing.css, "in-*").

const STEPS: { title: string; short: string; body: ReactNode }[] = [
  {
    title: "Unzip the download",
    short: "Unzip the download",
    body: (
      <>
        Double-click the zip to get one{" "}
        <span className="inline-flex items-center gap-1 align-middle font-medium text-[#262322]">
          <FolderIcon size={14} /> streaksync-extension
        </span>{" "}
        folder. Keep it somewhere it won&apos;t be deleted.
      </>
    ),
  },
  {
    title: "Turn on Developer mode",
    short: "Turn on Developer mode",
    body: (
      <>
        Paste <CopyText text="chrome://extensions" /> into the address bar, then switch on Developer
        mode in the top right.
      </>
    ),
  },
  {
    title: "Load unpacked",
    short: "Load unpacked, pick the folder",
    body: (
      <>
        Click <b className="font-medium text-[#262322]">Load unpacked</b> and select the
        streaksync-extension folder, not the zip.
      </>
    ),
  },
  {
    title: "Pin it to the toolbar",
    short: "Pin StreakSync",
    body: <>Open the puzzle icon next to the address bar and pin StreakSync so it stays in view.</>,
  },
  {
    title: "Set up in a few clicks",
    short: "Get started, turn on platforms",
    body: (
      <>
        Click the StreakSync icon, press <b className="font-medium text-[#262322]">Get started</b>,
        and switch on GitHub, LeetCode and GFG. Done.
      </>
    ),
  },
];

function Laptop({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="rounded-[18px] bg-[#0d0d0f] p-[1.4%] shadow-[0_0_0_1px_#c7c9cf,0_0_0_1px_rgba(255,255,255,0.08)_inset,0_30px_70px_-24px_rgba(20,40,90,0.35)]">
        <div className="overflow-hidden rounded-[8px]">{children}</div>
      </div>
      <div className="relative -mx-[3%] h-[12px] rounded-b-[14px] bg-linear-to-b from-[#e4e6ea] via-[#cdd0d6] to-[#a3a6ad] shadow-[0_18px_28px_-12px_rgba(20,40,90,0.35)]">
        <div className="absolute top-0 left-1/2 h-[4px] w-[14%] -translate-x-1/2 rounded-b-[5px] bg-[#b4b7bd]" />
      </div>
    </div>
  );
}

export function Install() {
  return (
    <ScrollReveal id="install" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-28">
      <SectionHead
        label="Install"
        title={
          <>
            Five steps,
            <br />
            about a <em>minute</em>
          </>
        }
        body="StreakSync isn't on the Chrome Web Store yet, so you add it yourself. Watch it once, then follow along. Works in Chrome, Edge and Brave."
      />

      <div className="mt-16 grid gap-12 lg:grid-cols-[320px_1fr] lg:items-center lg:gap-14">
        <ol className="reveal-kids order-2 space-y-1.5 lg:order-1">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className={`in-step${i + 1} relative rounded-xl border border-transparent p-3.5 pl-12`}
            >
              <span
                className={`in-dot${i + 1} absolute top-[16px] left-4 grid h-5 w-5 place-items-center rounded-full font-mono text-[10px]`}
              >
                {i + 1}
              </span>
              <h3 className="text-[14px] font-medium text-[#262322]">{s.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-[#262322]/60">{s.body}</p>
            </li>
          ))}
        </ol>

        {/* No reveal delay here: the clip should be on screen as soon as the section is */}
        <div className="order-1 lg:order-2">
          <Laptop>
            <InstallDemo />
          </Laptop>
          <div className="mx-auto mt-8 max-w-md">
            <div className="relative h-5 text-center text-[13px] text-[#262322]/70">
              {STEPS.map((s, i) => (
                <span key={s.title} className={`in-cap${i + 1} absolute inset-0`}>
                  <span className="font-mono text-[11px] tracking-[0.15em] text-[#262322]/45">
                    STEP {i + 1}/{STEPS.length}
                  </span>{" "}
                  · {s.short}
                </span>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {STEPS.map((s, i) => (
                <span
                  key={s.title}
                  className="relative h-[3px] overflow-hidden rounded-full bg-[#262322]/10"
                >
                  <span className={`in-bar${i + 1} absolute inset-y-0 left-0 bg-[#1f5fd6]`} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
