"use client";

import { useMemo, useState } from "react";
import { useAdminData } from "../session";
import { StatusPill } from "../StatusPill";
import { Card, CardHead, Empty, PageHead, Pill, formatDateTime, formatTime } from "../ui";

const PLATFORM_NAMES = { github: "GitHub", leetcode: "LeetCode", gfg: "GFG" } as const;

export default function UsersPage() {
  const { users, stats } = useAdminData();
  const [query, setQuery] = useState("");
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users.users;
    return users.users.filter((u) =>
      [u.githubLogin, u.email, u.leetcodeUsername, u.gfgUsername].some((v) =>
        v?.toLowerCase().includes(q),
      ),
    );
  }, [users, query]);

  const anonymous = Math.max(0, stats.totals.people - stats.totals.email_accounts);

  return (
    <>
      <PageHead
        title="Users"
        desc="People signed in with GitHub. Only they can get emails, so only they are listed by name."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3 md:mb-6 md:gap-6">
        <Card>
          <p className="text-[14px] text-[#9a9aa2]">Signed in with GitHub</p>
          <p className="mt-2 text-[30px] font-semibold text-white">{stats.totals.email_accounts}</p>
        </Card>
        <Card>
          <p className="text-[14px] text-[#9a9aa2]">Email reminders on</p>
          <p className="mt-2 text-[30px] font-semibold text-white">{stats.totals.email_on}</p>
        </Card>
        <Card>
          <p className="text-[14px] text-[#9a9aa2]">Not signed in (anonymous)</p>
          <p className="mt-2 text-[30px] font-semibold text-white">{anonymous}</p>
        </Card>
      </div>

      <Card>
        <CardHead
          title={`${list.length} user${list.length === 1 ? "" : "s"}`}
          desc="Newest change first. Times are in each user's own time zone."
          right={
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search username or email"
              className="h-10 w-64 rounded-lg border border-[#2e2e33] bg-[#0b0b0c] px-3.5 text-[14px] text-white outline-none placeholder:text-[#6b6b73] focus:border-[#528bff]"
            />
          }
        />
        {list.length === 0 ? (
          <Empty>
            {users.users.length === 0 ? "No one has signed in with GitHub yet." : "No match."}
          </Empty>
        ) : (
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="w-full min-w-[960px] text-left text-[14px]">
              <thead>
                <tr className="border-y border-[#232326] text-[12px] text-[#9a9aa2]">
                  <th className="px-5 py-3 font-medium sm:px-6">User</th>
                  <th className="px-4 py-3 font-medium">Tracks</th>
                  <th className="px-4 py-3 font-medium">Reminders</th>
                  <th className="px-4 py-3 font-medium">Today</th>
                  <th className="px-4 py-3 font-medium">Last email check</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b1b1e]">
                {list.map((u) => (
                  <tr key={u.githubLogin} className="align-top hover:bg-white/[0.02]">
                    <td className="px-5 py-4 sm:px-6">
                      <a
                        href={`https://github.com/${u.githubLogin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-white hover:underline"
                      >
                        @{u.githubLogin}
                      </a>
                      <span className="block text-[12px] text-[#9a9aa2]">
                        {u.email || "No verified email"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {(Object.keys(PLATFORM_NAMES) as (keyof typeof PLATFORM_NAMES)[])
                          .filter((id) => u.track?.[id])
                          .map((id) => (
                            <Pill key={id} tone="gray">
                              {PLATFORM_NAMES[id]}
                            </Pill>
                          ))}
                      </div>
                      <span className="mt-1.5 block font-mono text-[12px] text-[#6b6b73]">
                        {[
                          u.track?.leetcode && `lc: ${u.leetcodeUsername}`,
                          u.track?.gfg && `gfg: ${u.gfgUsername}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[13px] text-[#c9c9cf]">
                      {u.reminderTimes.map(formatTime).join(", ")}
                      <span className="block text-[12px] text-[#6b6b73]">{u.timeZone}</span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill user={u} />
                    </td>
                    <td className="px-4 py-4 text-[13px] text-[#c9c9cf]">
                      {u.lastRun ? (
                        <>
                          {formatDateTime(u.lastRun.at)}
                          <span className="block text-[12px] text-[#6b6b73]">
                            {u.lastRun.status === "emailed"
                              ? `Emailed about ${u.lastRun.pending.join(", ")}`
                              : "Everything was done"}
                          </span>
                        </>
                      ) : (
                        <span className="text-[#6b6b73]">Not yet</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[13px] text-[#9a9aa2]">
                      {formatDateTime(u.createdAt)}
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
