import Link from "next/link";

// White-and-yellow mark for dark backgrounds, dark-and-yellow mark for light ones
export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="StreakSync home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dark ? "/logo-mark-dark.png" : "/logo-mark.png"}
        alt=""
        width={40}
        height={40}
        className={dark ? "h-8 w-8 shrink-0" : "h-10 w-10 shrink-0"}
      />
      <span
        className={`leading-none font-semibold ${dark ? "text-lg text-[#262322]" : "text-xl text-white"}`}
      >
        StreakSync
      </span>
    </Link>
  );
}
