"use client";

import Link from "next/link";
import { AreaChart } from "./AreaChart";
import { useAdminData } from "./session";
import { StatusPill } from "./StatusPill";
import {
  Bar,
  Card,
  CardHead,
  Empty,
  MailIcon,
  MetricCard,
  PageHead,
  PulseIcon,
  UsersIcon,
  CalendarIcon,
  formatTime,
  weekChange,
} from "./ui";

export default function Overview() {
  const { stats, users } = useAdminData();
  const t = stats.totals;
  const s = stats.series;
  const emailUsers = users.users.filter((u) => u.emailEnabled && u.email);
  const total = t.active_30d;

  return (
    <>
      <PageHead
        title="Overview"
        desc="How StreakSync is being used right now. All numbers are live."
      />

      <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
        <MetricCard
          icon={UsersIcon}
          label="People"
          value={t.people}
          change={weekChange(s, "new")}
          sub={`${t.installs} install${t.installs === 1 ? "" : "s"} (reinstalls count once)`}
        />
        <MetricCard
          icon={PulseIcon}
          label="Active today"
          value={t.active_today}
          change={weekChange(s, "active")}
          sub={`${t.active_7d} active in the last 7 days`}
        />
        <MetricCard
          icon={CalendarIcon}
          label="Active in 30 days"
          value={t.active_30d}
          sub={`${t.new_7d} new this week`}
        />
        <MetricCard
          icon={MailIcon}
          label="Email reminders on"
          value={t.email_on}
          sub={`${t.email_accounts} signed in with GitHub`}
        />
      </div>

      <div className="mt-4 grid gap-4 md:mt-6 md:gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHead
            title="Active people"
            desc="Last 30 days"
            right={
              <Link
                href="/admin/activity/"
                className="text-[14px] font-medium text-[#84adff] hover:underline"
              >
                Details
              </Link>
            }
          />
          <AreaChart data={s} label="Active and new people over the last 30 days" />
        </Card>

        <Card>
          <CardHead
            title="Today's emails"
            desc="Sent at each selected reminder time"
            right={
              <Link
                href="/admin/emails/"
                className="text-[14px] font-medium text-[#84adff] hover:underline"
              >
                Details
              </Link>
            }
          />
          {emailUsers.length === 0 ? (
            <Empty>No one has email reminders on yet.</Empty>
          ) : (
            <ul className="divide-y divide-[#232326]">
              {emailUsers.slice(0, 6).map((u) => (
                <li key={u.githubLogin} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-white">
                      @{u.githubLogin}
                    </span>
                    <span className="block text-[12px] text-[#6b6b73]">
                      {formatTime(u.emailTime)} · {u.timeZone}
                    </span>
                  </span>
                  <StatusPill user={u} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-4 md:mt-6">
        <CardHead
          title="What people track"
          desc="People active in the last 30 days"
          right={
            <Link
              href="/admin/platforms/"
              className="text-[14px] font-medium text-[#84adff] hover:underline"
            >
              Details
            </Link>
          }
        />
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { name: "GitHub", n: stats.platforms.github },
            { name: "LeetCode", n: stats.platforms.leetcode },
            { name: "GeeksforGeeks", n: stats.platforms.gfg },
          ].map((p) => (
            <div key={p.name}>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[14px] font-medium text-[#c9c9cf]">{p.name}</span>
                <span className="text-[20px] font-semibold text-white tabular-nums">{p.n}</span>
              </div>
              <Bar value={p.n} total={total} />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
