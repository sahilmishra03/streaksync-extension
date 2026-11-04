"use client";

import { AreaChart } from "../AreaChart";
import { useAdminData } from "../session";
import {
  Card,
  CardHead,
  MetricCard,
  PageHead,
  PulseIcon,
  UsersIcon,
  CalendarIcon,
  formatDay,
  sum,
  weekChange,
} from "../ui";
import type { DayPoint } from "../types";

export default function ActivityPage() {
  const { stats } = useAdminData();
  const t = stats.totals;
  const s = stats.series;
  const rows = [...s].reverse();
  const cols: { key: keyof DayPoint; label: string }[] = [
    { key: "active", label: "Active people" },
    { key: "new", label: "New people" },
    { key: "emails", label: "Emails sent" },
    { key: "allDone", label: "All done" },
    { key: "emailFailed", label: "Email failed" },
    { key: "uninstalls", label: "Uninstalls" },
  ];

  return (
    <>
      <PageHead
        title="Activity"
        desc="One person = one GitHub account. Installs without GitHub sign-in count as one person each."
      />

      <div className="grid gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          icon={PulseIcon}
          label="Active today"
          value={t.active_today}
          change={weekChange(s, "active")}
          sub="Extension ran today"
        />
        <MetricCard
          icon={CalendarIcon}
          label="Active in 7 days"
          value={t.active_7d}
          sub={`${t.active_30d} in 30 days`}
        />
        <MetricCard
          icon={UsersIcon}
          label="New in 30 days"
          value={sum(s, "new")}
          sub={`${t.new_today} today`}
        />
      </div>

      <Card className="mt-4 md:mt-6">
        <CardHead title="Active and new people" desc="Last 30 days (UTC days)" />
        <AreaChart data={s} label="Active and new people over the last 30 days" />
      </Card>

      <Card className="mt-4 md:mt-6">
        <CardHead title="Daily log" desc="Last 30 days, newest first" />
        <div className="-mx-5 overflow-x-auto sm:-mx-6">
          <table className="w-full min-w-[720px] text-left text-[14px]">
            <thead>
              <tr className="border-y border-[#232326] text-[12px] text-[#9a9aa2]">
                <th className="px-5 py-3 font-medium sm:px-6">Date</th>
                {cols.map((c) => (
                  <th key={c.key} className="px-4 py-3 text-right font-medium">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b1b1e]">
              {rows.map((r) => (
                <tr key={r.day} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-[#c9c9cf] sm:px-6">{formatDay(r.day, true)}</td>
                  {cols.map((c) => (
                    <td
                      key={c.key}
                      className={`px-4 py-3 text-right tabular-nums ${Number(r[c.key]) ? "font-medium text-white" : "text-[#3a3a40]"}`}
                    >
                      {r[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
