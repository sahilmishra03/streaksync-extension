import Link from "next/link";
import { Logo } from "./Logo";

// Simple top bar for inner pages (privacy, uninstalled), same look as the landing Nav
export function PageHeader() {
  return (
    <header className="border-b border-[#262322]/[0.07] bg-[#fafaf9]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo tone="dark" />
        <Link href="/" className="text-[13px] text-[#262322]/65 transition hover:text-[#262322]">
          ← Back to home
        </Link>
      </div>
    </header>
  );
}
