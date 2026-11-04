# StreakSync server (Cloudflare Worker)

Users don't need any of this. It's for the maintainer, who deploys it once.

## What it does

- `POST /github/token`: finishes GitHub sign-in using the client secret, which must not ship in the extension.
- `PUT /account` / `DELETE /account`: saves or deletes a user's settings. Requires the user's GitHub token, and the account is keyed by their GitHub user id.
- **Cron every 5 minutes:** finds users whose last reminder time has passed today (in their time zone), checks their tracked platforms, and emails them through Brevo about the unfinished ones. Nothing is sent if all are done. Each user is processed at most once a day. If a site can't be reached, it retries for up to 3 hours.

## Free-plan limits

| Service | Limit | What it means |
|---|---|---|
| Brevo free | 300 emails/day | About 300 users with email on |
| Workers KV free | 1,000 writes/day | One write per user per day, plus one per settings save |
| Workers free | 50 outgoing requests per run | Up to 10 users per 5-minute run, so 120 per hour |

## Setup

1. GitHub OAuth App at [github.com/settings/developers](https://github.com/settings/developers):
   - Callback URL `https://dbnbgjdeflpgeebnljcedmdcjglkoikj.chromiumapp.org/github` (the extension ID is fixed by the `key` in `manifest.json`)
   - **Expire user access tokens** unchecked
2. Brevo: verify a sender, create an API key with **Transactional email** access only, and turn off **Security → Authorized IPs** blocking (Cloudflare has no fixed IP).
3. Secrets: copy `.env.example` to `.env` and fill it in. `.env` is git-ignored.
4. Deploy from this folder:

```powershell
npx wrangler login
npx wrangler kv namespace create STORE   # first time only, put the id in wrangler.toml
npx wrangler deploy
npx wrangler secret bulk .env
```

5. Put the Worker URL and GitHub client ID in `../config.js`.

## Useful commands

```powershell
npx wrangler tail                                    # live logs, including each reminder run
npx wrangler dev --remote --var DEBUG:true           # dev server with /debug/check?platform=gfg&username=NAME
```

## Rotating secrets

Generate a new GitHub client secret or Brevo key, update `.env`, and run `npx wrangler secret bulk .env`. Don't change `TOKEN_KEY` unless you have to: stored tokens can't be decrypted afterwards, and users must save their settings again to get emails.
