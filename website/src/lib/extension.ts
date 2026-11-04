// Talks to the StreakSync extension installed in this browser (Chrome "externally_connectable").
// Only works on sites listed in the extension's manifest; elsewhere `chrome.runtime` is undefined.
import { SITE } from "./site";

export type PlatformId = "github" | "leetcode" | "gfg";

export type ExtSettings = {
  onboarded: boolean;
  track: Record<PlatformId, boolean>;
  githubUsername: string;
  leetcodeUsername: string;
  gfgUsername: string;
  reminderTimes: string[];
  emailEnabled: boolean;
};

export type ExtState = {
  version: string;
  settings: ExtSettings;
  github: { connected: boolean; login: string; email: string };
  accountSync: { status: string; email?: string; emailTime?: string; error?: string } | null;
  limits: { maxReminderTimes: number; defaultReminderTimes: string[] };
};

export type SaveInput = {
  track: Record<PlatformId, boolean>;
  leetcodeUsername: string;
  gfgUsername: string;
  reminderTimes: string[];
  emailEnabled: boolean;
};

type Response<T> = { success: true; result: T } | { success: false; error: string };

type ChromeRuntime = {
  sendMessage: (id: string, message: unknown, callback: (response?: unknown) => void) => void;
  lastError?: { message?: string };
};

function runtime(): ChromeRuntime | null {
  const c = (globalThis as { chrome?: { runtime?: ChromeRuntime } }).chrome;
  return c?.runtime?.sendMessage ? c.runtime : null;
}

export class ExtensionMissingError extends Error {
  constructor() {
    super("StreakSync isn't installed in this browser, or it can't be reached.");
  }
}

function call<T>(
  action: string,
  data: Record<string, unknown> = {},
  timeoutMs = 120_000,
): Promise<T> {
  const rt = runtime();
  if (!rt) return Promise.reject(new ExtensionMissingError());
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("The extension didn't answer. Try again.")),
      timeoutMs,
    );
    rt.sendMessage(SITE.extensionId, { action, ...data }, (raw) => {
      clearTimeout(timer);
      const res = raw as Response<T> | undefined;
      if (!res) return reject(new ExtensionMissingError());
      if (res.success) resolve(res.result);
      else reject(new Error(res.error));
    });
  });
}

export const extension = {
  isReachable: () => runtime() !== null,
  getState: () => call<ExtState>("getState", {}, 8_000),
  connectGitHub: () => call<{ username: string; email: string }>("connectGitHub"),
  disconnectGitHub: () => call<{ disconnected: boolean }>("disconnectGitHub"),
  detectAccount: (platform: PlatformId) =>
    call<{ username: string; loginUrl?: string }>("detectAccount", { platform }, 20_000),
  verifyAccount: (platform: PlatformId, username: string) =>
    call<{ username: string; streak: number; doneToday: boolean }>(
      "verifyAccount",
      { platform, username },
      20_000,
    ),
  saveSettings: (settings: SaveInput) =>
    call<{ account: ExtState["accountSync"] & { status: string } }>("saveSettings", { settings }),
};
