// A static picture of the extension's setup page (extension/options.html)
const PLATFORMS = [
  { name: "GitHub", on: true, detail: "✓ Connected as @sahilmishra03" },
  { name: "LeetCode", on: true, detail: "✓ Found @sahilmishra03: 25-day streak" },
  { name: "GeeksforGeeks", on: false, detail: "" },
];

export function SetupMock() {
  return (
    <div className="shadow-sky-top/20 w-full max-w-md rounded-2xl bg-white p-5 text-left shadow-xl">
      <h3 className="flex items-center gap-2 text-[15px] font-semibold">
        <span className="bg-sky-top grid h-5 w-5 place-items-center rounded-full text-[11px] text-white">
          1
        </span>
        What do you want to track?
      </h3>
      <div className="mt-4 space-y-2.5">
        {PLATFORMS.map((p) => (
          <div
            key={p.name}
            className={`rounded-xl border p-3 ${p.on ? "border-sky-top bg-[#f6f9ff]" : "border-neutral-200"}`}
          >
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <span
                className={`grid h-4 w-4 place-items-center rounded ${p.on ? "bg-sky-top" : "border border-neutral-300"}`}
              >
                {p.on && (
                  <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
                    <path
                      d="M3.5 8.5 6.5 11.5 12.5 4.5"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </span>
              {p.name}
            </div>
            {p.detail && <p className="mt-2 text-xs text-[#12a150]">{p.detail}</p>}
          </div>
        ))}
      </div>
      <h3 className="mt-5 flex items-center gap-2 text-[15px] font-semibold">
        <span className="bg-sky-top grid h-5 w-5 place-items-center rounded-full text-[11px] text-white">
          2
        </span>
        When should we remind you?
      </h3>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {["10:00 AM", "2:00 PM", "6:00 PM", "10:00 PM"].map((t) => (
          <span key={t} className="rounded-lg border border-neutral-200 bg-[#f5f7fb] px-3 py-2">
            {t}
          </span>
        ))}
      </div>
      <div className="mt-5 rounded-xl bg-black py-3 text-center text-sm font-semibold text-white">
        Save &amp; start reminders
      </div>
    </div>
  );
}
