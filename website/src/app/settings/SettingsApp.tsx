"use client";

import { useCallback, useEffect, useState } from "react";
import { extension, ExtensionMissingError, type ExtState, type PlatformId } from "@/lib/extension";
import { SITE } from "@/lib/site";

// Black theme, same as the extension popup. Fraunces for the page title only, Geist Mono for the rest.

const PLATFORMS: { id: PlatformId; name: string; desc: string }[] = [
  { id: "github", name: "GitHub", desc: "Any contribution on your profile graph" },
  { id: "leetcode", name: "LeetCode", desc: "Any submission on your LeetCode calendar" },
  { id: "gfg", name: "GeeksforGeeks", desc: "Any problem solved on GFG" },
];

type UserPlatform = "leetcode" | "gfg";
type Note = { text: string; kind: "ok" | "err" | "muted"; link?: { href: string; label: string } };

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function SettingsApp() {
  const [state, setState] = useState<ExtState | null>(null);
  const [phase, setPhase] = useState<"loading" | "missing" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState("");

  // Form
  const [track, setTrack] = useState<Record<PlatformId, boolean>>({
    github: false,
    leetcode: false,
    gfg: false,
  });
  const [usernames, setUsernames] = useState<Record<UserPlatform, string>>({
    leetcode: "",
    gfg: "",
  });
  const [verified, setVerified] = useState<Record<UserPlatform, string>>({ leetcode: "", gfg: "" });
  const [notes, setNotes] = useState<Partial<Record<PlatformId, Note>>>({});
  const [times, setTimes] = useState<string[]>([]);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [saveNote, setSaveNote] = useState<Note | null>(null);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async (resetForm: boolean) => {
    try {
      const s = await extension.getState();
      setState(s);
      setPhase("ready");
      if (resetForm) {
        setTrack(s.settings.track);
        setUsernames({ leetcode: s.settings.leetcodeUsername, gfg: s.settings.gfgUsername });
        setVerified({ leetcode: s.settings.leetcodeUsername, gfg: s.settings.gfgUsername });
        setTimes([...s.settings.reminderTimes].sort());
        setEmailEnabled(s.settings.emailEnabled !== false);
        setDirty(false);
      }
    } catch (e) {
      if (e instanceof ExtensionMissingError) setPhase("missing");
      else {
        setLoadError(e instanceof Error ? e.message : "Could not reach the extension");
        setPhase("error");
      }
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load the extension's settings on mount
    load(true);
  }, [load]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const change = () => {
    setDirty(true);
    setSaveNote(null);
  };
  const setNote = (id: PlatformId, note: Note | undefined) =>
    setNotes((n) => ({ ...n, [id]: note }));

  // ---------- GitHub ----------

  async function connectGitHub() {
    setBusy("github");
    setNote("github", undefined);
    try {
      await extension.connectGitHub();
      await load(false);
    } catch (e) {
      setNote("github", {
        text: e instanceof Error ? e.message : "Sign-in cancelled",
        kind: "err",
      });
    } finally {
      setBusy(null);
    }
  }

  async function disconnectGitHub() {
    setBusy("github");
    try {
      await extension.disconnectGitHub();
      setTrack((t) => ({ ...t, github: false }));
      await load(false);
    } finally {
      setBusy(null);
    }
  }

  // ---------- LeetCode / GFG ----------

  async function verify(id: UserPlatform, name = usernames[id]): Promise<boolean> {
    const username = name.trim();
    setVerified((v) => ({ ...v, [id]: "" }));
    if (!username) {
      setNote(id, undefined);
      return false;
    }
    setNote(id, { text: "Checking...", kind: "muted" });
    try {
      const r = await extension.verifyAccount(id, username);
      setVerified((v) => ({ ...v, [id]: r.username }));
      setNote(id, {
        text: `Found @${r.username} · ${r.streak}-day streak · ${r.doneToday ? "done today" : "not done today yet"}`,
        kind: "ok",
      });
      return true;
    } catch (e) {
      setNote(id, {
        text: e instanceof Error ? e.message : "Could not check this username",
        kind: "err",
      });
      return false;
    }
  }

  async function detect(id: UserPlatform) {
    setBusy(id);
    setNote(id, { text: "Looking for your account...", kind: "muted" });
    try {
      const r = await extension.detectAccount(id);
      if (r.username) {
        setUsernames((u) => ({ ...u, [id]: r.username }));
        change();
        await verify(id, r.username);
      } else {
        setNote(id, {
          text: "You're not logged in on this browser. Log in, then click Detect again, or type your username.",
          kind: "err",
          link: r.loginUrl ? { href: r.loginUrl, label: "Log in" } : undefined,
        });
      }
    } catch {
      setNote(id, {
        text: "Couldn't detect your account. Type your username instead.",
        kind: "err",
      });
    } finally {
      setBusy(null);
    }
  }

  // ---------- Times ----------

  const maxTimes = state?.limits.maxReminderTimes ?? 4;
  const sortedTimes = [...new Set(times.filter(Boolean))].sort();
  const emailTime = sortedTimes.at(-1);

  function updateTime(i: number, value: string) {
    setTimes((t) => t.map((x, j) => (j === i ? value : x)));
    change();
  }
  function removeTime(i: number) {
    setTimes((t) => (t.length > 1 ? t.filter((_, j) => j !== i) : t));
    change();
  }
  function addTime() {
    if (times.length >= maxTimes) return;
    setTimes((t) => [...t, "20:00"]);
    change();
  }

  // ---------- Save ----------

  async function save() {
    if (!Object.values(track).some(Boolean)) {
      return setSaveNote({ text: "Turn on at least one platform.", kind: "err" });
    }
    if (track.github && !state?.github.connected) {
      return setSaveNote({ text: "Connect GitHub, or turn it off.", kind: "err" });
    }
    setBusy("save");
    setSaveNote({ text: "Saving...", kind: "muted" });
    for (const id of ["leetcode", "gfg"] as const) {
      if (track[id] && verified[id] !== usernames[id].trim() && !(await verify(id))) {
        setBusy(null);
        return setSaveNote({
          text: `Check your ${id === "gfg" ? "GFG" : "LeetCode"} username first.`,
          kind: "err",
        });
      }
    }
    try {
      const { account } = await extension.saveSettings({
        track,
        leetcodeUsername: usernames.leetcode.trim(),
        gfgUsername: usernames.gfg.trim(),
        reminderTimes: sortedTimes,
        emailEnabled,
      });
      setDirty(false);
      await load(true);
      if (!emailEnabled || account?.status === "no-github") {
        setSaveNote({
          text: "Saved. You'll get a notification at each reminder time.",
          kind: "ok",
        });
      } else if (account?.status === "saved") {
        setSaveNote({
          text: `Saved. Email to ${account.email || "you"} at ${formatTime(account.emailTime || emailTime || "22:00")} if something is unfinished.`,
          kind: "ok",
        });
      } else {
        setSaveNote({
          text: `Saved, but email reminders couldn't be set up: ${account?.error}`,
          kind: "err",
        });
      }
    } catch (e) {
      setSaveNote({ text: e instanceof Error ? e.message : "Could not save", kind: "err" });
    } finally {
      setBusy(null);
    }
  }

  // ---------- Render ----------

  if (phase !== "ready" || !state)
    return (
      <Shell>
        <StatusScreen phase={phase} error={loadError} onRetry={() => load(true)} />
      </Shell>
    );

  const onboarded = state.settings.onboarded;
  const github = state.github;

  return (
    <Shell>
      <header className="mb-10">
        <h1 className="text-[38px] leading-[1.1] text-[#f4f4f0] sm:text-[44px]">
          {onboarded ? "Settings" : "Never break your streak"}
        </h1>
        <p className="mt-3 text-[13px] text-[#9a9aa2]">
          {onboarded
            ? "Change what you track and when you get reminded."
            : "Pick your platforms, choose your times, and you're done. No keys or tokens."}
        </p>
      </header>

      {/* Platforms */}
      <Section title="Platforms" desc="Turn on the sites where you keep a daily streak.">
        <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-[#131315]">
          {PLATFORMS.map((p) => (
            <div key={p.id} className="p-4">
              <label className="flex cursor-pointer items-center gap-4">
                <PlatformIcon id={p.id} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-[#f4f4f0]">{p.name}</span>
                  <span className="block text-[12px] text-[#9a9aa2]">{p.desc}</span>
                </span>
                <Switch
                  checked={track[p.id]}
                  onChange={(v) => {
                    setTrack((t) => ({ ...t, [p.id]: v }));
                    change();
                  }}
                  label={`Track ${p.name}`}
                />
              </label>

              {track[p.id] && (
                <div className="mt-4 pl-[52px]">
                  {p.id === "github" ? (
                    github.connected ? (
                      <div className="flex items-center justify-between gap-3 rounded-lg bg-[#1b1b1e] px-3 py-2.5 text-[12.5px]">
                        <span className="text-[#c9c9cf]">
                          Signed in as{" "}
                          <b className="font-mono font-medium text-[#f4f4f0]">@{github.login}</b>
                        </span>
                        <Button
                          variant="ghost"
                          onClick={disconnectGitHub}
                          disabled={busy === "github"}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Button onClick={connectGitHub} disabled={busy === "github"}>
                          {busy === "github" ? "Waiting for GitHub..." : "Connect GitHub"}
                        </Button>
                        <p className="mt-2 text-[12px] text-[#6b6b73]">
                          Reads your profile and email address. It can&apos;t change your code.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={usernames[p.id as UserPlatform]}
                        onChange={(e) => {
                          const id = p.id as UserPlatform;
                          setUsernames((u) => ({ ...u, [id]: e.target.value }));
                          setVerified((v) => ({ ...v, [id]: "" }));
                          setNote(id, undefined);
                          change();
                        }}
                        onBlur={() => {
                          const id = p.id as UserPlatform;
                          if (usernames[id].trim() && verified[id] !== usernames[id].trim())
                            verify(id);
                        }}
                        placeholder={`${p.id === "gfg" ? "GFG" : "LeetCode"} username`}
                        spellCheck={false}
                        autoComplete="off"
                        className="min-w-0 flex-1 rounded-md border border-white/[0.14] bg-[#0b0b0c] px-3 py-2 font-mono text-[13px] text-[#f4f4f0] outline-none placeholder:text-[#6b6b73] focus:border-[#0b63e5]"
                      />
                      <Button
                        variant="ghost"
                        onClick={() => detect(p.id as UserPlatform)}
                        disabled={busy === p.id}
                      >
                        Detect
                      </Button>
                    </div>
                  )}
                  {notes[p.id] && <NoteLine note={notes[p.id]!} />}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Reminder times */}
      <Section
        title="Reminder times"
        desc="A notification at each time, listing only what's left. Reminders stop once everything is done."
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {times.map((t, i) => {
            const isEmail = emailEnabled && github.connected && t === emailTime;
            return (
              <div
                key={i}
                className={`flex items-center rounded-lg border bg-[#131315] pl-1 ${isEmail ? "border-[#0b63e5]/60" : "border-white/[0.08]"}`}
              >
                <input
                  type="time"
                  value={t}
                  onChange={(e) => updateTime(i, e.target.value)}
                  aria-label={`Reminder time ${i + 1}`}
                  className="min-w-0 flex-1 bg-transparent px-2 py-2 font-mono text-[13px] text-[#f4f4f0] [color-scheme:dark] outline-none"
                />
                {isEmail && <span className="pr-1 text-[10px] text-[#8fb2ff]">email</span>}
                <button
                  type="button"
                  onClick={() => removeTime(i)}
                  disabled={times.length <= 1}
                  aria-label="Remove time"
                  className="px-2.5 py-2 text-[15px] text-[#6b6b73] hover:text-[#f87171] disabled:opacity-30"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
        {times.length >= maxTimes && (
          <p className="mt-3 text-[12px] text-[#6b6b73]">
            You can have up to {maxTimes} reminder times.
          </p>
        )}
        {times.length < maxTimes && (
          <div className="mt-3">
            <Button variant="ghost" onClick={addTime}>
              + Add time
            </Button>
          </div>
        )}
      </Section>

      {/* Email */}
      <Section
        title="Email"
        desc={`One email at your last reminder time${emailTime ? ` (${formatTime(emailTime)})` : ""}, only if something is unfinished. It arrives even if your laptop is off.`}
      >
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#131315] p-4">
          <span>
            <span className="block text-[14px] font-semibold text-[#f4f4f0]">Email me</span>
            <span className="block text-[12px] text-[#9a9aa2]">
              {!emailEnabled
                ? "Off. You'll only get browser notifications."
                : github.connected
                  ? github.email
                    ? `Sent to ${github.email}`
                    : "Your GitHub account has no verified email."
                  : "Needs GitHub sign-in (you don't have to track GitHub)."}
            </span>
          </span>
          <Switch
            checked={emailEnabled}
            onChange={(v) => {
              setEmailEnabled(v);
              change();
            }}
            label="Email me"
          />
        </label>
        {emailEnabled && !github.connected && (
          <div className="mt-3">
            <Button onClick={connectGitHub} disabled={busy === "github"}>
              Sign in with GitHub for email
            </Button>
          </div>
        )}
      </Section>

      {/* Save bar */}
      <div className="sticky bottom-0 -mx-6 mt-10 border-t border-white/[0.08] bg-[#0b0b0c]/90 px-6 py-4 backdrop-blur">
        <div className="flex items-center justify-end gap-4">
          {saveNote && <NoteLine note={saveNote} className="mt-0 flex-1" />}
          {!saveNote && dirty && (
            <span className="flex-1 text-[12px] text-[#9a9aa2]">Unsaved changes</span>
          )}
          <Button onClick={save} disabled={busy === "save"} size="lg">
            {busy === "save" ? "Saving..." : onboarded ? "Save" : "Save & start reminders"}
          </Button>
        </div>
      </div>
    </Shell>
  );
}

// ---------- Pieces ----------

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-geist min-h-screen bg-[#0b0b0c] text-[#f4f4f0]">
      <div className="mx-auto max-w-2xl px-6 pt-10">
        <div className="mb-12 flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" className="h-9 w-9" />
          <span className="text-[14px] font-semibold">StreakSync</span>
        </div>
        {children}
        <div className="h-10" />
      </div>
    </div>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h3 className="font-geist text-[15px] font-semibold tracking-[-0.01em] text-[#f4f4f0]">
        {title}
      </h3>
      <p className="mt-1 mb-4 text-[12.5px] leading-relaxed text-[#9a9aa2]">{desc}</p>
      {children}
    </section>
  );
}

function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  size = "md",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
}) {
  const base =
    "whitespace-nowrap rounded-lg font-medium transition disabled:cursor-wait disabled:opacity-60";
  const sizes = size === "lg" ? "px-4 py-2 text-[14px]" : "px-3 py-[7px] text-[13px]";
  const look =
    variant === "primary"
      ? "bg-[#0b63e5] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-[#0a56c7] active:bg-[#094aab]"
      : "border border-white/[0.16] bg-[#131315] text-[#f4f4f0] hover:bg-[#1f1f22]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes} ${look}`}
    >
      {children}
    </button>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        onChange(!checked);
      }}
      className={`relative h-[22px] w-[38px] shrink-0 rounded-full border transition ${checked ? "border-[#0b63e5] bg-[#0b63e5]" : "border-white/[0.16] bg-[#1b1b1e]"}`}
    >
      <span
        className={`absolute top-[2px] left-[2px] h-4 w-4 rounded-full transition ${checked ? "translate-x-4 bg-white" : "bg-[#9a9aa2]"}`}
      />
    </button>
  );
}

function NoteLine({ note, className = "" }: { note: Note; className?: string }) {
  const color =
    note.kind === "ok"
      ? "text-[#4ade80]"
      : note.kind === "err"
        ? "text-[#f87171]"
        : "text-[#9a9aa2]";
  return (
    <p className={`mt-2 text-[12px] ${color} ${className}`}>
      {note.text}{" "}
      {note.link && (
        <a href={note.link.href} target="_blank" rel="noreferrer" className="underline">
          {note.link.label}
        </a>
      )}
    </p>
  );
}

// Brand logos from Simple Icons (CC0). GitHub white, LeetCode and GFG in their brand colors.
const ICON_PATHS: Record<PlatformId, { d: string; color: string }> = {
  github: {
    color: "#f4f4f0",
    d: "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z",
  },
  leetcode: {
    color: "#FFA116",
    d: "M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z",
  },
  gfg: {
    color: "#2F8D46",
    d: "M21.45 14.315c-.143.28-.334.532-.565.745a3.691 3.691 0 0 1-1.104.695 4.51 4.51 0 0 1-3.116-.016 3.79 3.79 0 0 1-2.135-2.078 3.571 3.571 0 0 1-.13-.353h7.418a4.26 4.26 0 0 1-.368 1.008zm-11.99-.654a3.793 3.793 0 0 1-2.134 2.078 4.51 4.51 0 0 1-3.117.016 3.7 3.7 0 0 1-1.104-.695 2.652 2.652 0 0 1-.564-.745 4.221 4.221 0 0 1-.368-1.006H9.59c-.038.12-.08.238-.13.352zm14.501-1.758a3.849 3.849 0 0 0-.082-.475l-9.634-.008a3.932 3.932 0 0 1 1.143-2.348c.363-.35.79-.625 1.26-.809a3.97 3.97 0 0 1 4.484.957l1.521-1.49a5.7 5.7 0 0 0-1.922-1.357 6.283 6.283 0 0 0-2.544-.49 6.35 6.35 0 0 0-2.405.457 6.007 6.007 0 0 0-1.963 1.276 6.142 6.142 0 0 0-1.325 1.94 5.862 5.862 0 0 0-.466 1.864h-.063a5.857 5.857 0 0 0-.467-1.865 6.13 6.13 0 0 0-1.325-1.939A6 6 0 0 0 8.21 6.34a6.698 6.698 0 0 0-4.949.031A5.708 5.708 0 0 0 1.34 7.73l1.52 1.49a4.166 4.166 0 0 1 4.484-.958c.47.184.898.46 1.26.81.368.36.66.792.859 1.268.146.344.242.708.285 1.08l-9.635.008A4.714 4.714 0 0 0 0 12.457a6.493 6.493 0 0 0 .345 2.127 4.927 4.927 0 0 0 1.08 1.783c.528.56 1.17 1 1.88 1.293a6.454 6.454 0 0 0 2.504.457c.824.005 1.64-.15 2.404-.457a5.986 5.986 0 0 0 1.964-1.277 6.116 6.116 0 0 0 1.686-3.076h.273a6.13 6.13 0 0 0 1.686 3.077 5.99 5.99 0 0 0 1.964 1.276 6.345 6.345 0 0 0 2.405.457 6.45 6.45 0 0 0 2.502-.457 5.42 5.42 0 0 0 1.882-1.293 4.928 4.928 0 0 0 1.08-1.783A6.52 6.52 0 0 0 24 12.457a4.757 4.757 0 0 0-.039-.554z",
  },
};

function PlatformIcon({ id }: { id: PlatformId }) {
  const { d, color } = ICON_PATHS[id];
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] border border-white/[0.08] bg-[#1b1b1e]"
      aria-hidden="true"
    >
      <svg viewBox={id === "github" ? "0 0 16 16" : "0 0 24 24"} className="h-5 w-5" fill={color}>
        <path d={d} />
      </svg>
    </span>
  );
}

function StatusScreen({
  phase,
  error,
  onRetry,
}: {
  phase: "loading" | "missing" | "ready" | "error";
  error: string;
  onRetry: () => void;
}) {
  if (phase === "loading")
    return <p className="text-[13px] text-[#9a9aa2]">Connecting to the extension...</p>;
  if (phase === "missing")
    return (
      <div>
        <h1 className="text-[38px] leading-[1.1]">Install StreakSync first</h1>
        <p className="mt-3 max-w-md text-[13px] leading-relaxed text-[#9a9aa2]">
          This page changes the settings of the StreakSync extension in this browser. Install it,
          then open settings from the extension&apos;s gear icon.
        </p>
        <div className="mt-6 flex gap-2">
          <a
            href={SITE.downloadUrl}
            className="rounded-md bg-[#0b63e5] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#0a56c7]"
          >
            Download StreakSync
          </a>
          <button
            onClick={onRetry}
            className="rounded-md border border-white/[0.16] bg-[#131315] px-4 py-2 text-[14px] font-medium hover:bg-[#1f1f22]"
          >
            I installed it
          </button>
        </div>
      </div>
    );
  return (
    <div>
      <h1 className="text-[38px] leading-[1.1]">Couldn&apos;t load settings</h1>
      <p className="mt-3 text-[13px] text-[#f87171]">{error}</p>
      <button
        onClick={onRetry}
        className="mt-6 rounded-md border border-white/[0.16] bg-[#131315] px-4 py-2 text-[14px] font-medium hover:bg-[#1f1f22]"
      >
        Try again
      </button>
    </div>
  );
}
