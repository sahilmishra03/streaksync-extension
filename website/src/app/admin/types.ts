export type DayPoint = {
  day: string;
  active: number;
  new: number;
  emails: number;
  allDone: number;
  uninstalls: number;
  emailFailed: number;
};

export type NamedCount = { name: string; n: number };

export type Stats = {
  generatedAt: string;
  totals: {
    installs: number;
    people: number;
    active_today: number;
    active_7d: number;
    active_30d: number;
    new_today: number;
    new_7d: number;
    email_accounts: number;
    email_on: number;
  };
  series: DayPoint[];
  platforms: { github: number; leetcode: number; gfg: number; email: number; avgReminders: number };
  browsers: NamedCount[];
  versions: NamedCount[];
  limits: { brevoDaily: number; kvWritesDaily?: number; usersPerRun?: number };
};

export type TodayStatus =
  "scheduled" | "checking" | "emailed" | "all-done" | "done" | "missed" | "email-off";

export type AdminUser = {
  githubLogin: string;
  email: string;
  track: { github?: boolean; leetcode?: boolean; gfg?: boolean };
  leetcodeUsername: string;
  gfgUsername: string;
  reminderTimes: string[];
  timeZone: string;
  emailEnabled: boolean;
  emailTime: string;
  today: string;
  todayStatus: TodayStatus;
  lastRun: {
    date: string;
    status: "emailed" | "all-done";
    at: string;
    pending: string[];
    streaks: Record<string, number>;
  } | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type UsersResponse = { generatedAt: string; users: AdminUser[]; truncated: boolean };
