"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SITE } from "@/lib/site";
import { AdminSession, useAdmin } from "./session";
import {
  ChartIcon,
  CodeIcon,
  ExternalIcon,
  GridIcon,
  HomeIcon,
  LayersIcon,
  LogoutIcon,
  MailIcon,
  MenuIcon,
  RefreshIcon,
  UsersIcon,
  pct,
} from "./ui";

const NAV = [
  { href: "/admin/", label: "Overview", icon: GridIcon },
  { href: "/admin/users/", label: "Users", icon: UsersIcon },
  { href: "/admin/activity/", label: "Activity", icon: ChartIcon },
  { href: "/admin/platforms/", label: "Platforms", icon: LayersIcon },
  { href: "/admin/emails/", label: "Emails", icon: MailIcon },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminSession>
      <Gate>{children}</Gate>
    </AdminSession>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  const { state } = useAdmin();
  if (state.status === "restoring") return <Loading />;
  if (state.status === "signed-out") return <Login />;
  return <Layout>{children}</Layout>;
}

function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className="flex items-center gap-2.5">
      {/* White-and-yellow mark, no background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="" className={size === "lg" ? "h-10 w-10" : "h-9 w-9"} />
      <span className="text-[17px] font-semibold text-white">StreakSync</span>
    </span>
  );
}

function Loading() {
  return (
    <div className="font-geist grid min-h-screen place-items-center bg-[#0b0b0c]">
      <div className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="" className="h-12 w-12 animate-pulse" />
        <p className="text-[14px] text-[#9a9aa2]">Loading dashboard...</p>
      </div>
    </div>
  );
}

function Login() {
  const { state, signIn, loading } = useAdmin();
  const [value, setValue] = useState("");
  const error = state.status === "signed-out" ? state.error : "";
  return (
    <div className="font-geist grid min-h-screen place-items-center bg-[#0b0b0c] px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) signIn(value.trim());
        }}
        className="w-full max-w-sm rounded-2xl border border-[#232326] bg-[#131315] p-8"
      >
        <Logo size="lg" />
        <h1 className="mt-8 text-[30px] leading-tight text-white">Admin sign in</h1>
        <p className="mt-1 text-[14px] text-[#9a9aa2]">
          You stay signed in on this browser for 7 days.
        </p>
        <label htmlFor="pw" className="mt-6 block text-[14px] font-medium text-[#c9c9cf]">
          Password
        </label>
        <input
          id="pw"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1.5 h-11 w-full rounded-lg border border-[#2e2e33] bg-[#0b0b0c] px-3.5 text-[14px] text-white outline-none focus:border-[#528bff] focus:ring-4 focus:ring-[#1f5fd6]/20"
        />
        {error && <p className="mt-2 text-[13px] text-[#f97066]">{error}</p>}
        <button
          disabled={loading}
          className="mt-5 h-11 w-full rounded-lg bg-[#1f5fd6] text-[14px] font-medium text-white transition hover:bg-[#2a6ce8] disabled:opacity-60"
        >
          {loading ? "Checking..." : "Sign in"}
        </button>
        <p className="mt-4 text-[12px] text-[#6b6b73]">
          The password is <code className="font-mono">ADMIN_TOKEN</code> in{" "}
          <code className="font-mono">worker/.env</code>.
        </p>
      </form>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const { state, refresh, signOut, loading, error } = useAdmin();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  if (state.status !== "signed-in") return null;
  const stats = state.stats;
  const emailsToday = stats.series.at(-1)?.emails ?? 0;
  const isActive = (href: string) =>
    href === "/admin/"
      ? pathname === "/admin" || pathname === "/admin/"
      : pathname.startsWith(href.slice(0, -1));

  return (
    <div className="font-geist flex min-h-screen bg-[#0b0b0c] text-white/90">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col border-r border-[#232326] bg-[#0b0b0c] px-5 py-6 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="px-2">
          <Logo />
        </div>

        <p className="mt-9 px-3 text-[12px] font-medium tracking-wide text-[#6b6b73] uppercase">
          Menu
        </p>
        <nav className="mt-3 space-y-1">
          {NAV.map((n) => {
            const on = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition ${on ? "bg-white/[0.07] text-white" : "text-[#c9c9cf] hover:bg-white/[0.04]"}`}
              >
                <n.icon className={`h-5 w-5 ${on ? "text-white" : "text-[#9a9aa2]"}`} />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <p className="mt-8 px-3 text-[12px] font-medium tracking-wide text-[#6b6b73] uppercase">
          Links
        </p>
        <nav className="mt-3 space-y-1 text-[14px] font-medium text-[#c9c9cf]">
          {[
            { href: "/", label: "Website", icon: HomeIcon },
            { href: SITE.repoUrl, label: "GitHub repo", icon: CodeIcon },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.05]"
            >
              <l.icon className="h-5 w-5 text-[#9a9aa2]" />
              <span className="flex-1">{l.label}</span>
              <ExternalIcon className="h-4 w-4 text-[#6b6b73]" />
            </a>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl bg-white/[0.03] p-4">
          <p className="text-[14px] font-medium text-white/90">Free plan limit</p>
          <p className="mt-1 text-[13px] text-[#9a9aa2]">
            Emails today: <b className="text-white">{emailsToday}</b> of {stats.limits.brevoDaily}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#232326]">
            <div
              className="h-full rounded-full bg-[#1f5fd6]"
              style={{ width: `${Math.min(100, pct(emailsToday, stats.limits.brevoDaily))}%` }}
            />
          </div>
        </div>
        <button
          onClick={signOut}
          className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-[#c9c9cf] hover:bg-white/[0.05]"
        >
          <LogoutIcon className="h-5 w-5 text-[#9a9aa2]" /> Sign out
        </button>
      </aside>
      {menuOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-4 border-b border-[#232326] bg-[#0b0b0c]/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="grid h-10 w-10 place-items-center rounded-lg border border-[#232326] text-[#9a9aa2] lg:hidden"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <span className="text-[14px] text-[#9a9aa2]">
              Live data · updated{" "}
              {new Date(stats.generatedAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {error && <span className="hidden text-[13px] text-[#f97066] sm:inline">{error}</span>}
            <button
              onClick={refresh}
              disabled={loading}
              className="flex h-10 items-center gap-2 rounded-lg border border-[#2e2e33] px-4 text-[14px] font-medium text-[#c9c9cf] hover:bg-white/[0.05] disabled:opacity-60"
            >
              <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Refreshing" : "Refresh"}
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
