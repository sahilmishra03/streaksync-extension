import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/landing/Features";
import { Install } from "@/components/landing/Install";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Download } from "@/components/landing/Download";
import { SectionHead } from "@/components/landing/SectionHead";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SmoothScroll } from "@/components/SmoothScroll";
import { SITE } from "@/lib/site";
import "./landing.css";

const FAQ = [
  {
    q: "Is StreakSync free?",
    a: "Yes. It's free, open source, and there's nothing to pay for later.",
  },
  {
    q: "Do I need to create an account or API key?",
    a: "No. GitHub uses its normal sign-in. For LeetCode and GFG, StreakSync reads your public profile with your username.",
  },
  {
    q: "Will I get emails if my laptop is off?",
    a: "Yes, if you sign in with GitHub and keep email on. The server checks your platforms at your last reminder time and emails your verified GitHub address.",
  },
  {
    q: "What does StreakSync store about me?",
    a: "Your settings stay in your browser. For email reminders, the server keeps your usernames, reminder times, time zone, GitHub email and an encrypted GitHub sign-in. Disconnecting GitHub deletes it.",
  },
  {
    q: "Which browsers does it work in?",
    a: "Chrome, Edge, Brave and other Chromium browsers.",
  },
];

export default function Home() {
  return (
    <div className="bg-[#fafaf9]">
      <SmoothScroll />
      <Hero />

      <main>
        <Features />
        <HowItWorks />
        <Download />
        <Install />

        <ScrollReveal id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-6 py-28">
          <SectionHead
            label="FAQ"
            title={
              <>
                Questions, <em>answered</em>
              </>
            }
          />
          <div className="reveal mt-12 divide-y divide-[#262322]/[0.08] rounded-[14px] border border-[#262322]/[0.08] bg-white">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-medium text-[#262322]">
                  {f.q}
                  <span className="text-[#262322]/45 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-[#262322]/60">{f.a}</p>
              </details>
            ))}
          </div>
          <a
            href={SITE.discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1 text-[15px] font-medium text-[#2a5fd0] transition-colors hover:text-[#1a4ab0]"
          >
            Something else? Ask on Discord
            <span aria-hidden="true" className="translate-y-px">→</span>
          </a>
        </ScrollReveal>
      </main>
      <Footer />
    </div>
  );
}
