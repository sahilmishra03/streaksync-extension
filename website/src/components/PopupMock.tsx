// A picture of the real extension popup (extension/popup.html + popup.css), drawn in HTML.
// Black theme, Geist font, amber edge on unfinished rows, settings gear in the header.
type Row = { name: string; streak: number; done: boolean };

const BEFORE: Row[] = [
  { name: "GitHub", streak: 41, done: true },
  { name: "LeetCode", streak: 25, done: false },
  { name: "GeeksforGeeks", streak: 6, done: false },
];
const AFTER: Row[] = [
  { name: "GitHub", streak: 41, done: true },
  { name: "LeetCode", streak: 26, done: true },
  { name: "GeeksforGeeks", streak: 6, done: false },
];

function Flame() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        d="M8 2c2.5 3 4 4.8 4 7.2A4 4 0 0 1 4 9.2C4 7.5 5 6.2 6 5c.3 1.3 1 2 2 2.2C8 5.5 7.6 3.8 8 2Z"
        fill="#f5a524"
      />
    </svg>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        fill="none"
        stroke="#4ade80"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Gear() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[17px] w-[17px] fill-none stroke-[#f4f4f0]"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

/**
 * state "before": LeetCode still to do. state "after": LeetCode solved.
 * The refresh icon carries the `demo-spin` class so the hero animation can spin it.
 */
export function PopupMock({
  state = "before",
  className = "",
}: {
  state?: "before" | "after";
  className?: string;
}) {
  const rows = state === "before" ? BEFORE : AFTER;
  const done = rows.filter((r) => r.done).length;
  const left = rows.filter((r) => !r.done).map((r) => r.name);

  return (
    <div
      className={`font-geist w-[300px] rounded-xl border border-white/10 bg-[#0b0b0c] p-3.5 text-[13px] leading-normal text-[#f4f4f0] ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-base font-semibold tracking-[-0.01em]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" className="h-7 w-7" />
          StreakSync
        </div>
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-[#161618]">
          <Gear />
        </span>
      </div>

      <div className="pt-5 pb-4 text-center">
        <div className="text-[46px] leading-[1.05] font-semibold tracking-[-0.03em] tabular-nums">
          {done}
          <span className="mx-1 font-normal text-[#9a9aa2]">/</span>
          {rows.length}
        </div>
        <div className="mt-0.5 text-[11px] tracking-[0.08em] text-[#9a9aa2] uppercase">
          done today
        </div>
        <div className="mt-2 text-xs text-[#f5a524]">Still to do: {left.join(", ")}</div>
        <span className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-[#1f5fd6] px-3.5 py-[7px] text-xs font-medium text-white">
          <svg
            viewBox="0 0 24 24"
            className="demo-spin h-3.5 w-3.5 fill-none stroke-white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4" />
          </svg>
          Check now
        </span>
      </div>

      <div className="flex justify-between border-t border-white/[0.08] px-0.5 pt-3 pb-2 text-[11px] text-[#9a9aa2]">
        <span>Tue, Nov 3</span>
        <span>
          Checked{" "}
          <b className="font-semibold text-[#f4f4f0]">
            {state === "before" ? "5:42 PM" : "6:01 PM"}
          </b>
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <div
            key={r.name}
            className={`flex items-center gap-2.5 rounded-lg border bg-[#161618] px-3 py-2.5 ${
              r.done ? "border-white/[0.08]" : "border-[#f5a524]/35"
            }`}
          >
            <span className={`flex-1 font-medium ${r.done ? "text-[#9a9aa2]" : ""}`}>{r.name}</span>
            <span className="text-xs text-[#9a9aa2] tabular-nums">{r.streak} days</span>
            {r.done ? <Check /> : <Flame />}
          </div>
        ))}
      </div>
    </div>
  );
}
