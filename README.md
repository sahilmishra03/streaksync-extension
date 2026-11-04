# StreakSync ⚡

> **Never break your GitHub, LeetCode, and GeeksforGeeks streaks.**

A free, open-source Chrome extension and companion web service that keeps your coding momentum alive. StreakSync tracks your daily problem solving and commits across GitHub, LeetCode, and GeeksforGeeks, sending smart browser alerts and daily reminder emails before midnight.

🌐 **Website:** [streaksync.sahilmishra.dev](https://streaksync.sahilmishra.dev)  
📦 **Download:** [Download Extension (.zip)](https://streaksync.sahilmishra.dev/streaksync-extension.zip)

---

## ✨ Features

- **Multi-Platform Streak Tracking**: Monitor your GitHub contributions, LeetCode submissions, and GeeksforGeeks daily problems simultaneously.
- **Offline Reminder Emails**: Keeps checking your streaks even when your laptop is turned off via a lightweight, serverless Cloudflare Worker cron that sends transactional alerts through Brevo.
- **Smart Notification Thresholds**: Scheduled reminders throughout the day (e.g. 10:00 AM, 2:00 PM, 6:00 PM, 10:00 PM). If you've already solved a problem on a platform, it won't bug you about it.
- **Privacy-First & Secure**: No account creation required. Public profile scraping for LeetCode & GFG; OAuth for GitHub with all stored tokens encrypted using AES-GCM (256-bit).
- **Modern Minimalist UI**: Clean popup interface and companion settings dashboard styled with Geist Sans and Fraunces typography.

---

## 🏗️ Repository Architecture

This monorepo contains three interconnected components:

```
streak-sync-extension/
├── extension/          # Chrome Extension (Manifest V3)
│   ├── manifest.json   # Extension metadata and permissions
│   ├── background.js   # Service worker, alarms, and settings sync
│   ├── popup.html/js   # Extension popup interface
│   └── platforms.js    # Platform streak scrapers & verifiers
├── website/            # Next.js Web Application
│   ├── src/app/        # Landing page, settings app, privacy, uninstall pages
│   ├── src/components/ # Interactive UI widgets, demo clips, and audio
│   └── public/         # Static assets, icons, and prebuilt extension zips
├── worker/             # Cloudflare Worker Backend
│   ├── src/index.js    # OAuth handler, encrypted KV store, and 5-min cron
│   └── wrangler.toml   # Cloudflare Worker configuration & scheduled triggers
├── scripts/            # Packaging and automation scripts
│   ├── zip-extension.mjs   # Packs extension/ into a distributable zip
│   └── preview-emails.mjs  # Local renderer for reminder email templates
└── tests/              # Automated Test Suite (39 test cases)
    ├── extension.test.mjs  # Logic, streak counters, and manifest tests
    └── worker.test.mjs     # Crypto, API routes, and email cron tests
```

---

## 🚀 Quick Start

### 1. Install Extension Manually (Developer Mode)

1. Download [`streaksync-extension.zip`](https://streaksync.sahilmishra.dev/streaksync-extension.zip) or clone this repository.
2. Unzip the archive into a folder.
3. Open Chrome and navigate to `chrome://extensions/`.
4. Enable **Developer mode** in the top right corner.
5. Click **Load unpacked** and select the unzipped `extension/` directory.
6. The setup page will launch automatically to configure your usernames!

### 2. Local Development

**Prerequisites:** Node.js 22.8+

```bash
# Clone the repository
git clone https://github.com/sahilmishra03/streaksync-extension.git
cd streak-sync-extension

# Install root dependencies
npm install

# Run the automated test suite (39 tests)
npm test

# Build and package the extension zip
npm run zip
```

**Running the Website:**
```bash
cd website
npm install
npm run dev
# Open http://localhost:3000
```

**Running the Worker Locally:**
```bash
cd worker
npm install
npx wrangler dev
```

---

## 🔒 Security & Privacy

- **No Passwords Stored**: LeetCode and GeeksforGeeks only require your public usernames.
- **Encrypted GitHub Tokens**: When email alerts are enabled, GitHub tokens are encrypted with AES-GCM before being stored in Cloudflare KV.
- **Zero Third-Party Trackers**: No trackers, ads, or intrusive telemetry.
- **One-Click Disconnect**: Disconnecting GitHub deletes your stored reminder record from the server immediately.

---

## 🧪 Testing & CI/CD

StreakSync includes 39 automated tests covering streak calculation edge cases (e.g. leap years, time zone transitions, platform outages, encryption roundtrips, and email rendering):

```bash
npm test
```

Continuous integration is orchestrated through GitHub Actions:
- `.github/workflows/ci.yml`: Verifies formatting, runs the complete test suite, lints and builds the Next.js website.
- `.github/workflows/deploy.yml`: Deploys updates to Cloudflare Workers and Vercel.
- `.github/workflows/release.yml`: Tags and builds release artifacts when version bumps are pushed to `main`.

---

## 📄 License

MIT © [Sahil Mishra](https://sahilmishra.dev)
