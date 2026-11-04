-- One-way hash of the GitHub username (when signed in), so reinstalls by the same person count as one person.
-- Not reversible to a username without guessing; no email or token is stored.
ALTER TABLE installs ADD COLUMN user_hash TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS installs_user_hash ON installs(user_hash);
