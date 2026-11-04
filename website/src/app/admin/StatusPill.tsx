import type { AdminUser } from "./types";
import { Pill, formatTime } from "./ui";

// Today's email state for one user, in plain words
export function StatusPill({ user }: { user: AdminUser }) {
  switch (user.todayStatus) {
    case "emailed":
      return <Pill tone="blue">Emailed</Pill>;
    case "all-done":
    case "done":
      return <Pill tone="green">All done, no email</Pill>;
    case "checking":
      return <Pill tone="amber">Checking now</Pill>;
    case "scheduled":
      return <Pill tone="gray">Due at {formatTime(user.emailTime)}</Pill>;
    case "missed":
      return <Pill tone="red">Not sent (sites unreachable)</Pill>;
    default:
      return <Pill tone="gray">Email off</Pill>;
  }
}
