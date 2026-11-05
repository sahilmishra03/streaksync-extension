"use client";

import { useAdminData } from "../session";
import { StatusPill } from "../StatusPill";
import {
  Bar,
  Card,
  CardHead,
  Empty,
  MetricCard,
  MailIcon,
  PageHead,
  PulseIcon,
  CalendarIcon,
  formatDay,
  formatTime,
  pct,
  sum,
} from "../ui";

export default function EmailsPage() {
  const { stats, users } = useAdminData();
  const s = stats.series;
  const last = s.slice(-14);
  const max = Math.max(1, ...last.map((d) => Math.max(d.emails, d.allDone)));
  const sent = sum(s, "emails");
  const done = sum(s, "allDone");
  const failed = sum(s, "emailFailed");
  const today = s.at(-1);
  const emailUsers = users.users.filter((u) => u.emailEnabled && u.email);
  const counts = emailUsers.reduce<Record<string, number>>((acc, u) => {
    acc[u.todayStatus] = (acc[u.todayStatus] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHead
        title="Emails"
        desc="Each user gets an email at every selected reminder time, only while something is unfinished."
      />

      <div className="grid gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          icon={MailIcon}
          label="Sent today"
          value={today?.emails ?? 0}
          sub={`${stats.limits.brevoDaily} a day on the free plan`}
        />
        <MetricCard
          icon={PulseIcon}
          label="Sent in 30 days"
          value={sent}
          sub={failed ? `${failed} failed` : "None failed"}
        />
        <MetricCard
          icon={CalendarIcon}
          label="Already done, no email"
          value={sent + done ? `${pct(done, sent + done)}%` : "–"}
          sub={`${done} of ${sent + done} daily checks in 30 days`}
        />
      </div>

      <div className="mt-4 grid gap-4 md:mt-6 md:gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHead title="Daily email checks" desc="Last 14 days (UTC days)" />
          <div className="mb-4 flex flex-wrap gap-5 text-[13px] text-[#9a9aa2]">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#528bff]" /> Emailed
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#32d583]" /> All done, no email
            </span>
          </div>
          {sent + done === 0 ? (
            <Empty>
              No daily email check has finished yet. The first one runs at a user&apos;s last
              reminder time.
            </Empty>
          ) : (
            <>
              <div className="flex h-52 items-end gap-2 border-b border-[#232326] sm:gap-3">
                {last.map((d) => (
                  <div key={d.day} className="flex h-full flex-1 items-end justify-center gap-1">
                    <div
                      className="w-2.5 rounded-t bg-[#528bff]"
                      style={{ height: `${(d.emails / max) * 100}%`, minHeight: d.emails ? 4 : 0 }}
                      title={`${d.day}: ${d.emails} emailed`}
                    />
                    <div
                      className="w-2.5 rounded-t bg-[#32d583]"
                      style={{
                        height: `${(d.allDone / max) * 100}%`,
                        minHeight: d.allDone ? 4 : 0,
                      }}
                      title={`${d.day}: ${d.allDone} all done`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2 sm:gap-3">
                {last.map((d) => (
                  <span key={d.day} className="flex-1 text-center text-[11px] text-[#6b6b73]">
                    {formatDay(d.day).split(" ")[1]}
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card>
          <CardHead title="Free plan limits" />
          <ul className="space-y-5 text-[14px]">
            <li>
              <div className="mb-2 flex justify-between">
                <span className="text-[#c9c9cf]">Brevo emails today</span>
                <span className="text-white tabular-nums">
                  {today?.emails ?? 0} / {stats.limits.brevoDaily}
                </span>
              </div>
              <Bar value={today?.emails ?? 0} total={stats.limits.brevoDaily} />
            </li>
            <li>
              <div className="mb-2 flex justify-between">
                <span className="text-[#c9c9cf]">Email accounts</span>
                <span className="text-white tabular-nums">
                  {stats.totals.email_on} / {stats.limits.brevoDaily}
                </span>
              </div>
              <Bar value={stats.totals.email_on} total={stats.limits.brevoDaily} />
              <p className="mt-2 text-[12px] text-[#6b6b73]">
                Above 300 people, emails stop for the rest of the day.
              </p>
            </li>
          </ul>
        </Card>
      </div>

      <Card className="mt-4 md:mt-6">
        <CardHead
          title="Today, per user"
          desc={`Due ${counts.scheduled || 0} · checking ${counts.checking || 0} · emailed ${counts.emailed || 0} · all done ${(counts["all-done"] || 0) + (counts.done || 0)} · not sent ${counts.missed || 0}`}
        />
        {emailUsers.length === 0 ? (
          <Empty>No one has email reminders on yet.</Empty>
        ) : (
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="w-full min-w-[640px] text-left text-[14px]">
              <thead>
                <tr className="border-y border-[#232326] text-[12px] text-[#9a9aa2]">
                  <th className="px-5 py-3 font-medium sm:px-6">User</th>
                  <th className="px-4 py-3 font-medium">Email time</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Streaks at last check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b1b1e]">
                {emailUsers.map((u) => (
                  <tr key={u.githubLogin} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3 sm:px-6">
                      <span className="font-medium text-white">@{u.githubLogin}</span>
                      <span className="block text-[12px] text-[#9a9aa2]">{u.email}</span>
                    </td>
                    <td className="px-4 py-3 text-[#c9c9cf]">
                      {formatTime(u.emailTime)}
                      <span className="block text-[12px] text-[#6b6b73]">{u.timeZone}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill user={u} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#9a9aa2]">
                      {u.lastRun
                        ? Object.entries(u.lastRun.streaks)
                            .map(([k, v]) => `${k} ${v}d`)
                            .join(" · ")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
