import type { ReactNode } from "react";

// Section header, PortFly style: tiny mono label, light serif title with italic words, muted line
export function SectionHead({
  label,
  title,
  body,
}: {
  label: string;
  title: ReactNode;
  body?: ReactNode;
}) {
  return (
    <div className="reveal-kids flex flex-col items-center text-center">
      <p className="font-mono text-[11px] tracking-[0.2em] text-[#262322]/45 uppercase">{label}</p>
      <h2 className="mt-4 max-w-2xl text-[clamp(2.1rem,4.2vw,3.4rem)] leading-[1.06] text-[#262322] [&_em]:pr-[0.05em]">
        {title}
      </h2>
      {body && (
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[#262322]/60">{body}</p>
      )}
    </div>
  );
}
