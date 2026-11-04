"use client";

import { useEffect } from "react";
import { SITE } from "@/lib/site";

// Removes this install from the usage counts. The id is the random one from the extension.
export function UninstallPing() {
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;
    fetch(`${SITE.apiUrl}/uninstall`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }, []);
  return null;
}
