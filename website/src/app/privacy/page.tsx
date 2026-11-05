import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Privacy" };

// A parody of the "Parental Advisory" label: safe, and it makes the point
function AdvisoryLabel() {
  return (
    <div className="inline-flex -rotate-2 flex-col items-stretch border-[5px] border-black bg-white text-center text-black shadow-[0_18px_40px_-20px_rgba(0,0,0,0.5)] select-none">
      <span className="px-5 pt-2 text-[15px] font-black tracking-[0.12em]">PRIVACY ADVISORY</span>
      <span className="bg-black px-5 py-2 text-[26px] leading-none font-black tracking-[0.02em] text-white">
        NO DATA SOLD
      </span>
      <span className="px-5 pt-1.5 pb-2 text-[11px] font-bold tracking-[0.2em]">
        CLEAN CONTENT ONLY
      </span>
    </div>
  );
}

function Card({ emoji, title, children }: { emoji: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-[14px] border border-[#262322]/[0.08] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-3">
        <span className="text-[28px] leading-none" aria-hidden="true">
          {emoji}
        </span>
        <h2 className="text-[22px] leading-tight text-[#262322]">{title}</h2>
      </div>
      <div className="mt-3 space-y-2 text-[14px] leading-relaxed text-[#262322]/65 [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </section>
  );
}

export default function Privacy() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafaf9]">
      <PageHeader />
      <main className="mx-auto w-full max-w-3xl px-6 pt-20 pb-28">
        <div className="flex flex-col items-center text-center">
          <p className="reveal font-mono text-[11px] tracking-[0.2em] text-[#262322]/45 uppercase">
            Privacy
          </p>
          <h1
            className="reveal mt-4 text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.05] text-[#262322] [&_em]:pr-[0.05em]"
            style={{ animationDelay: "0.12s" }}
          >
            Your data stays <em>yours</em>
          </h1>
          <p
            className="reveal mt-5 max-w-xl text-[15px] leading-relaxed text-[#262322]/60"
            style={{ animationDelay: "0.24s" }}
          >
            StreakSync only collects what it needs to remind you about your streaks. Here&apos;s all
            of it, in plain words.
          </p>
          <div className="reveal mt-12" style={{ animationDelay: "0.36s" }}>
            <AdvisoryLabel />
          </div>

          {/* Meme: what we know vs what people think we know */}
          <figure
            className="reveal mt-14 grid w-full max-w-xl grid-cols-2 overflow-hidden rounded-[18px] border border-[#262322]/[0.08] bg-white text-[13px] shadow-[0_20px_50px_-28px_rgba(20,40,90,0.35)]"
            style={{ animationDelay: "0.48s" }}
          >
            <div className="border-r border-[#262322]/[0.06] p-5">
              <div className="text-[48px] leading-none" aria-hidden="true">
                🕵️
              </div>
              <p className="mt-3 font-medium text-[#262322]">What you think we know</p>
              <p className="mt-1 text-[#262322]/55">
                Your search history, your passwords, that you copy answers from the Discuss tab
              </p>
            </div>
            <div className="bg-[#0b0b0c] p-5 text-[#f4f4f0]">
              <div className="text-[48px] leading-none" aria-hidden="true">
                🙈
              </div>
              <p className="mt-3 font-medium">What we actually know</p>
              <p className="mt-1 text-[#9a9aa2]">
                Whether you solved a problem today. That&apos;s it.
              </p>
            </div>
          </figure>
        </div>

        <div className="mt-16 space-y-4">
          <Card emoji="💻" title="Stored in your browser">
            <ul>
              <li>
                The platforms you track, your LeetCode and GFG usernames, and your reminder times.
              </li>
              <li>Your GitHub sign-in token and GitHub email, on that device only.</li>
              <li>Your latest streak status.</li>
            </ul>
          </Card>
          <Card emoji="☁️" title="On our server, only if you use email reminders">
            <ul>
              <li>Your GitHub user id, username and verified primary email.</li>
              <li>Your GitHub sign-in token, encrypted with AES-GCM.</li>
              <li>The platforms you track, your usernames, reminder times and time zone.</li>
            </ul>
            <p>
              The server uses this at each selected reminder time to check your streaks and
              email you about anything unfinished. Emails are sent through Brevo.
            </p>
          </Card>
          <Card emoji="📊" title="Anonymous usage counts">
            <p>
              Once a day the extension sends a random install id, its version, your browser type,
              which platforms you track (yes or no for each), whether email is on and how many
              reminder times you have. No usernames, emails or tokens. This is how we count how many
              people use StreakSync.
            </p>
          </Card>
          <Card emoji="👀" title="What StreakSync reads">
            <ul>
              <li>
                GitHub: your profile, verified email addresses and contribution calendar. It cannot
                read or change your code.
              </li>
              <li>LeetCode and GeeksforGeeks: your public submission calendars, by username.</li>
            </ul>
          </Card>
          <Card emoji="🗑️" title="Deleting your data">
            <p>
              Click Disconnect next to GitHub in StreakSync settings to delete your data from the
              server. Removing the extension deletes what&apos;s stored in your browser and removes
              your install from the usage counts. Your data is never sold or shared.
            </p>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
