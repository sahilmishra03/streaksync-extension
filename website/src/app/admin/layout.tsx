import type { Metadata } from "next";
import { AdminShell } from "./AdminShell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · StreakSync" },
  robots: { index: false, follow: false },
};

// One session for every admin page: sign in once, then move between pages without reloading data
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
