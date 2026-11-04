import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { SITE } from "@/lib/site";
import { UninstallPing } from "./UninstallPing";

export const metadata: Metadata = { title: "Sorry to see you go", robots: { index: false } };

// Chrome opens this page when someone removes the extension (chrome.runtime.setUninstallURL)
export default function Uninstalled() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafaf9]">
      <PageHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-6 pt-20 pb-28 text-center">
        {/* Sad face with a tear rolling down */}
        <div className="reveal relative text-[96px] leading-none" aria-hidden="true">
          🥲
          <span className="tear absolute top-[52px] left-[30px] h-3 w-2 rounded-full bg-[#6aafff]" />
        </div>

        <h1
          className="reveal mt-8 text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.05] text-[#262322] [&_em]:pr-[0.05em]"
          style={{ animationDelay: "0.12s" }}
        >
          Sorry to see you <em>go</em>
        </h1>
        <p
          className="reveal mt-5 max-w-xl text-[15px] leading-relaxed text-[#262322]/60"
          style={{ animationDelay: "0.24s" }}
        >
          StreakSync has been removed and your browser settings are gone.
        </p>

        {/* Meme card */}
        <figure
          className="reveal mt-12 w-full max-w-md overflow-hidden rounded-[18px] border border-[#262322]/[0.08] bg-white text-left shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_50px_-28px_rgba(20,40,90,0.35)]"
          style={{ animationDelay: "0.36s" }}
        >
          <div className="space-y-3 p-6 text-[15px] text-[#262322]">
            <p>
              <b className="font-semibold">Me:</b> removes StreakSync
            </p>
            <p>
              <b className="font-semibold">My 41-day LeetCode streak at 11:59 PM:</b>
            </p>
          </div>
          <div className="grid place-items-center gap-2 border-t border-[#262322]/[0.06] bg-[#0b0b0c] py-8 text-center">
            <span className="text-[64px] leading-none" aria-hidden="true">
              💀
            </span>
            <span className="font-mono text-[11px] tracking-[0.2em] text-[#9a9aa2] uppercase">
              streak: 0 days
            </span>
          </div>
        </figure>

        <div
          className="reveal mt-12 w-full max-w-xl rounded-[14px] border border-[#262322]/[0.08] bg-white p-5 text-left text-[14px] leading-relaxed text-[#262322]/70"
          style={{ animationDelay: "0.48s" }}
        >
          <p className="font-mono text-[11px] tracking-[0.2em] text-[#262322]/45 uppercase">
            Used email reminders?
          </p>
          <p className="mt-2">
            Disconnect StreakSync at{" "}
            <a
              className="text-[#1f5fd6] underline-offset-4 hover:underline"
              href="https://github.com/settings/applications"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/settings/applications
            </a>
            . The server deletes your data at its next check.
          </p>
        </div>

        <div
          className="reveal mt-10 flex flex-wrap justify-center gap-3"
          style={{ animationDelay: "0.6s" }}
        >
          <a
            href={SITE.downloadUrl}
            download
            className="inline-flex h-11 items-center rounded-lg bg-linear-to-r from-[#1f5fd6] via-[#3d86ee] to-[#6aafff] px-5 text-[13px] font-medium tracking-[0.08em] text-white uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_12px_rgba(61,134,238,0.25)] transition hover:brightness-110"
          >
            Changed your mind? Reinstall
          </a>
          <a
            href={`${SITE.repoUrl}/issues/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded-lg border border-[#262322]/15 bg-white px-5 text-[13px] font-medium tracking-[0.08em] text-[#262322] uppercase transition hover:border-[#262322]/30"
          >
            Tell us what went wrong
          </a>
        </div>
        <UninstallPing />
      </main>
      <Footer />
    </div>
  );
}
