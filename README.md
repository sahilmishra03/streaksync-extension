# ⚡ StreakSync

A Chrome extension that reminds you to keep your daily **GitHub**, **LeetCode** and **GeeksforGeeks** streaks alive.

- **Pick what you track.** On first launch you choose GitHub, LeetCode and/or GFG and connect each one. No keys or tokens.
- **Reminders through the day.** By default at 10 AM, 2 PM, 6 PM and 10 PM (change, add or remove times, up to 6). Each notification lists only the platforms you haven't finished today.
- **Stops when you're done.** Once every tracked platform is done for the day, you get no more reminders that day.
- **Email even when your laptop is off.** At your last reminder time, the StreakSync server checks your platforms and emails you about anything unfinished. Needs GitHub sign-in (the email goes to your verified GitHub email).

## Install

1. Download this repository (**Code → Download ZIP**) and unzip it.
2. Open `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the unzipped folder (the one containing `manifest.json`).
4. The setup page opens. Pick your platforms, connect them, and click **Save & start reminders**.

Works in Chrome, Edge and Brave.

## How each platform is checked

| Platform | How you connect | Counts as done today when |
|---|---|---|
| GitHub | Sign in with GitHub | You have at least one contribution on your profile graph today |
| LeetCode | **Detect** (uses the account you're logged into) or type your username | You submitted on LeetCode today (LeetCode's calendar, UTC days) |
| GeeksforGeeks | **Detect** or type your username | You solved a problem on GFG today (your GFG submission heatmap) |

LeetCode and GFG don't offer sign-in for other apps, so StreakSync reads your public profile data with your username. The GFG data comes from an unofficial endpoint, which GFG could change without notice.

## Privacy

See [PRIVACY.md](PRIVACY.md). In short: if you turn on email reminders, the server stores your usernames, reminder times, time zone, GitHub email and an encrypted GitHub sign-in token, only to send you reminders. Disconnecting GitHub deletes it.

## Project structure

| Path | What it is |
|---|---|
| `manifest.json`, `background.js`, `popup.*`, `options.*` | The extension |
| `platforms.js` | Streak checks for GitHub, LeetCode and GFG, shared by the extension and the server |
| `config.js` | Server URL and GitHub OAuth client ID (public values) |
| `worker/` | Cloudflare Worker: GitHub sign-in and scheduled reminder emails through Brevo. See [worker/README.md](worker/README.md) |

Secrets are never in this repository. They live in `worker/.env` on the maintainer's machine (git-ignored) and in Cloudflare.
