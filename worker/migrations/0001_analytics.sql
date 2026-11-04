-- Anonymous installs: one row per extension install (random id, no personal data)
CREATE TABLE IF NOT EXISTS installs (
  id TEXT PRIMARY KEY,
  first_seen TEXT NOT NULL,       -- YYYY-MM-DD (UTC)
  last_seen TEXT NOT NULL,        -- YYYY-MM-DD (UTC)
  version TEXT NOT NULL DEFAULT '',
  browser TEXT NOT NULL DEFAULT '',
  github INTEGER NOT NULL DEFAULT 0,
  leetcode INTEGER NOT NULL DEFAULT 0,
  gfg INTEGER NOT NULL DEFAULT 0,
  email_enabled INTEGER NOT NULL DEFAULT 0,
  reminder_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS installs_last_seen ON installs(last_seen);
CREATE INDEX IF NOT EXISTS installs_first_seen ON installs(first_seen);

-- Daily active installs: one row per install per day it was used
CREATE TABLE IF NOT EXISTS active_days (
  day TEXT NOT NULL,
  id TEXT NOT NULL,
  PRIMARY KEY (day, id)
);

-- Daily counters: emails sent, all-done days, failed checks, uninstalls...
CREATE TABLE IF NOT EXISTS daily_stats (
  day TEXT NOT NULL,
  metric TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, metric)
);
