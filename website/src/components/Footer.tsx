import Link from "next/link";
import { SITE } from "@/lib/site";

// PortFly-style footer: brand + links, a small policy row, then a huge faded wordmark in the sky gradient.
// The footer is white, so it uses the dark-bar version of the logo (same mark, same yellow flame).

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how", label: "How it works" },
  { href: "/#download", label: "Download" },
  { href: "/#faq", label: "FAQ" },
];

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

export function Footer() {
  return (
    <footer className="border-t border-[#0b1220]/[0.06] bg-white">
      <div className="mx-auto max-w-6xl px-6 pt-14">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2.5" aria-label="StreakSync home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark-dark.png" alt="" width={28} height={28} className="h-7 w-7" />
              <span className="font-geist text-[15px] font-semibold tracking-tight text-[#0b1220]">
                StreakSync
              </span>
            </Link>
            <p className="font-geist mt-3 text-[15px] text-[#0b1220]/55">
              Never break your GitHub, LeetCode and GFG streaks.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="font-geist flex flex-wrap gap-x-7 gap-y-2 text-[15px]">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[#0b1220]/60 transition-colors hover:text-[#0b1220]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={SITE.repoUrl}
                  {...external}
                  className="text-[#0b1220]/60 transition-colors hover:text-[#0b1220]"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="font-geist mt-12 flex flex-col gap-2 text-[13px] text-[#0b1220]/45 sm:flex-row sm:justify-between">
          <nav aria-label="Policies">
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              <li>
                <Link href="/privacy/" className="transition-colors hover:text-[#0b1220]">
                  Privacy
                </Link>
              </li>
              <li>
                <a
                  href={SITE.discordUrl}
                  {...external}
                  className="transition-colors hover:text-[#0b1220]"
                >
                  Report an issue
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SITE.contactEmail}`}
                  className="transition-colors hover:text-[#0b1220]"
                >
                  {SITE.contactEmail}
                </a>
              </li>
            </ul>
          </nav>
          <p>
            © StreakSync. Free and open source, made by{" "}
            <a
              href={SITE.authorUrl}
              {...external}
              className="text-[#0b1220]/70 transition-colors hover:text-[#0b1220]"
            >
              {SITE.authorName}
            </a>
          </p>
        </div>

        {/* Giant wordmark, cut off and faded at the bottom */}
        <div aria-hidden="true" className="[container-type:inline-size] mt-8">
          {/* "StreakSync" has 10 letters (PortFly has 7), so it's smaller to fit the full width */}
          <div className="h-[11cqw] overflow-hidden [mask-image:linear-gradient(to_bottom,black_25%,transparent)]">
            <p className="font-geist bg-gradient-to-r from-[#2a5fd0] via-[#3d86f0] to-[#9fd2ff] bg-clip-text text-center text-[18.5cqw] leading-[0.8] font-semibold tracking-[-0.05em] whitespace-nowrap text-transparent select-none">
              StreakSync
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
