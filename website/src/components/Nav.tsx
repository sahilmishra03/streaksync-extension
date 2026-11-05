import Link from "next/link";
import { Logo } from "./Logo";
import { SITE } from "@/lib/site";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#download", label: "Download" },
  { href: "#faq", label: "FAQ" },
];

// Glassmorphism navbar with backdrop blur
export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#262322]/[0.07] bg-[#fafaf9]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo tone="dark" />
        <nav
          aria-label="Main"
          className="hidden items-center gap-8 text-[13px] text-[#262322]/70 md:flex"
        >
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-[#262322]">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={SITE.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-9 items-center rounded-full px-4 text-[13px] text-[#262322]/75 transition hover:text-[#262322] sm:inline-flex"
          >
            GitHub
          </a>
          <Link
            href="#download"
            className="inline-flex h-9 items-center rounded-full bg-linear-to-r from-[#1f5fd6] via-[#3d86ee] to-[#6aafff] px-4 text-[13px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(31,95,214,0.25),0_4px_12px_rgba(61,134,238,0.25)] transition hover:brightness-110"
          >
            Add to Chrome
          </Link>
        </div>
      </div>
    </header>
  );
}
