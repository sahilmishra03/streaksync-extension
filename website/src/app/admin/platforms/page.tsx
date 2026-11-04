"use client";

import { useAdminData } from "../session";
import { Bar, Card, CardHead, Empty, PageHead, pct } from "../ui";
import type { NamedCount } from "../types";

function List({ rows, total }: { rows: NamedCount[]; total: number }) {
  if (rows.length === 0) return <Empty>No data yet.</Empty>;
  return (
    <ul className="space-y-5">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="mb-2 flex items-center justify-between text-[14px]">
            <span className="font-medium text-[#c9c9cf] capitalize">{r.name}</span>
            <span className="text-[#9a9aa2]">
              <b className="font-semibold text-white tabular-nums">{r.n}</b> · {pct(r.n, total)}%
            </span>
          </div>
          <Bar value={r.n} total={total} />
        </li>
      ))}
    </ul>
  );
}

export default function PlatformsPage() {
  const { stats } = useAdminData();
  const p = stats.platforms;
  const total = stats.totals.active_30d;

  return (
    <>
      <PageHead
        title="Platforms"
        desc={`What the ${total} ${total === 1 ? "person" : "people"} active in the last 30 days use. Each person's latest settings count.`}
      />

      <div className="grid gap-4 md:gap-6 xl:grid-cols-2">
        <Card>
          <CardHead title="Tracked platforms" desc="A person can track more than one" />
          <List
            rows={[
              { name: "GitHub", n: p.github },
              { name: "LeetCode", n: p.leetcode },
              { name: "GeeksforGeeks", n: p.gfg },
            ]}
            total={total}
          />
        </Card>

        <Card>
          <CardHead title="Reminders" desc="Settings people chose" />
          <List rows={[{ name: "Email reminders on", n: p.email }]} total={total} />
          <div className="mt-6 rounded-xl bg-white/[0.03] p-4">
            <p className="text-[14px] text-[#9a9aa2]">Average reminder times per person</p>
            <p className="mt-1 text-[24px] font-semibold text-white">{p.avgReminders}</p>
            <p className="mt-1 text-[12px] text-[#6b6b73]">Maximum allowed is 4</p>
          </div>
        </Card>

        <Card>
          <CardHead title="Browsers" />
          <List rows={stats.browsers} total={total} />
        </Card>

        <Card>
          <CardHead title="Extension versions" desc="Who still needs to update" />
          <List
            rows={stats.versions.map((v) => ({ name: v.name ? `v${v.name}` : "Unknown", n: v.n }))}
            total={total}
          />
        </Card>
      </div>
    </>
  );
}
