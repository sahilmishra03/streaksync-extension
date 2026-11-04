# StreakSync privacy policy

StreakSync only collects what it needs to remind you about your coding streaks.

## Stored in your browser

- The platforms you track, your LeetCode and GFG usernames, and your reminder times (Chrome sync storage).
- Your GitHub sign-in token and GitHub email (this device only, not synced).
- Your latest streak status.

## Stored on the StreakSync server

Only if you sign in with GitHub and keep email reminders on:

- Your GitHub user id, username and verified primary email
- Your GitHub sign-in token, encrypted (AES-GCM)
- The platforms you track, your LeetCode and GFG usernames, your reminder times and time zone

The server uses this once a day, at your last reminder time, to check your streaks and email you about anything unfinished. Emails are sent through Brevo.

## What StreakSync reads

- **GitHub:** your profile, verified email addresses and contribution calendar (scope `user:email`). It cannot read or change your code.
- **LeetCode and GeeksforGeeks:** your public submission calendars, by username. When you click **Detect**, the extension asks the site which account is logged in, in your browser.

Your data is not sold or shared, and is not used for anything except reminders.

## Deleting your data

Click **Disconnect** next to GitHub in StreakSync settings. This deletes your data from the server. Revoking StreakSync at [github.com/settings/applications](https://github.com/settings/applications) also stops all access; the server then deletes your record at its next check. Removing the extension deletes the data stored in your browser.
