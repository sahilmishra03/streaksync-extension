"use client";

import { useState } from "react";

// Inline code with a copy button. Browsers don't let a web page open chrome:// links,
// so the user copies it and pastes it into the address bar.
export function CopyText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-[#262322]/10 bg-white px-2 py-0.5 align-middle font-mono text-[12px] text-[#262322] transition hover:border-[#262322]/25"
      aria-label={`Copy ${text}`}
    >
      {text}
      <span className="text-[10px] tracking-[0.08em] text-[#262322]/45 uppercase">
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
