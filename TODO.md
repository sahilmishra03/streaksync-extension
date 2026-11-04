# StreakSync to-do

Work in this order.

## 1. Finish the extension
- [x] Logo: white and yellow mark, no background, bigger in the popup and favicon
- [x] Popup: Geist font, no reminder section, settings gear, no white highlighted row
- [x] First install opens the setup page on the website straight away

## 2. Settings page
- [x] On the website (`website/src/app/settings/`), talks to the extension through `externally_connectable`
- [x] Black theme, Geist text, compact blue buttons, max 4 reminder times, real platform logos

## 3. Admin panel
- [x] TailAdmin style, extension black, five pages, 7-day session, people counted once
- [x] Confirm the first real 10:00 PM email check shows up under Emails

## 4. Landing page and other pages
- [x] Hero: centred PortFly-style layout, detailed MacBook demo (macOS, Chrome, Dock, LeetCode, popup, notification)
- [x] Blur-in page load, scroll reveals, Lenis smooth scroll
- [x] Typography same as PortFly: Fraunces headings, Geist text, Geist Mono labels
- [x] Features: three looping clips (LeetCode, GFG, GitHub)
- [x] How it works: animated "one day" timeline
- [x] Download: Free card, one-click zip served by the website, popping platform logos
- [x] Install: five-step clip on a MacBook desktop with Dock, steps/caption/progress in sync, setup tutorial at the end
- [x] Zip built automatically before every `dev` and `build` (`scripts/zip-extension.mjs`, no zip tool needed)
- [x] Mac-style click sound on links and buttons (synthesized, no audio file)
- [x] Privacy and uninstalled pages redesigned to match, with safe memes
- [x] PortFly-style footer

## 5. Next: go live
- [x] Recreate the automated tests (39 tests, `npm test`)
- [ ] Deploy the website on Vercel with the custom domain (`streaksync.sahilmishra.dev`)
- [x] Put the real domain in `extension/config.js` (`WEBSITE_URL`, `SETTINGS_ORIGINS`) and `manifest.json` (`externally_connectable`), then rebuild the zip
- [x] Update `SITE.url` in `website/src/lib/site.ts` to `streaksync.sahilmishra.dev`
- [ ] Commit and push the repo to GitHub

## Done this round
- [x] Reminder email redesigned: logo, one meme per case (1, 2 or 3 left), plain list, site link in the footer. Preview: `node scripts/preview-emails.mjs` writes `email-previews/`
- [x] Worker serves the logo at `/logo.png` for emails; deployed
- [x] Tests recreated: 39 tests (`npm test`)
- [x] CI/CD: `ci.yml` (format, tests, website build, zip artifact), `release.yml` (version bump on main -> tag, GitHub release, optional Chrome Web Store publish), `deploy.yml` (worker + Vercel after CI)

## Later
- [x] Set `SITE_URL` / `PUBLIC_URL` worker vars once the domain is live (emails link to the GitHub repo until then)
- [ ] Add repo secrets for deploys (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, optional `VERCEL_*`, `CWS_*`)
