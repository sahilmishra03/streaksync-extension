// Background service worker for StreakSync (ES module)
//
// - Shows a browser notification at each reminder time, listing only unfinished platforms.
// - Keeps the popup's status fresh with a check every 30 minutes.
// - Saves the user's settings to the StreakSync server, which sends an email at every reminder
//   time while something remains unfinished, even when this browser is closed.

import { STREAKSYNC_CONFIG, DEFAULT_REMINDER_TIMES, MAX_REMINDER_TIMES } from './config.js';
import { PLATFORMS, USERNAME_RE, TIME_RE, todayIn, minutesNowIn, timeToMinutes, checkPlatform } from './platforms.js';

const PLATFORM_IDS = Object.keys(PLATFORMS);
const DARK_ICON_PATHS = {
  16: 'icons/icon16-dark.png',
  32: 'icons/icon32-dark.png',
  48: 'icons/icon48-dark.png',
  128: 'icons/icon128-dark.png'
};
const LIGHT_ICON_PATHS = {
  16: 'icons/icon16.png',
  32: 'icons/icon32.png',
  48: 'icons/icon48.png',
  128: 'icons/icon128.png'
};

function updateActionIcon() {
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  chrome.action.setIcon({ path: dark ? LIGHT_ICON_PATHS : DARK_ICON_PATHS });
}

updateActionIcon();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateActionIcon);

export const DEFAULT_SETTINGS = {
  onboarded: false,
  track: { github: false, leetcode: false, gfg: false },
  githubUsername: '',
  leetcodeUsername: '',
  gfgUsername: '',
  reminderTimes: DEFAULT_REMINDER_TIMES,
  emailEnabled: true
};

// Keys from older versions that are no longer used
const REMOVED_SYNC_KEYS = [
  'githubToken',
  'githubRepo',
  'autoPushEnabled',
  'authMethod',
  'recipientEmail',
  'emailServiceUrl',
  'emailApiKey',
  'emailAlertsEnabled',
  'reminderTime',
  'lastCheckDate',
  'lastCheckAt',
  'githubStreak',
  'leetcodeStreak',
  'hasCommittedToday',
  'pendingPlatforms'
];

const localTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

// ---------- Setup ----------

chrome.runtime.onInstalled.addListener(async (details) => {
  const old = await chrome.storage.sync.get([
    'leetcodeUsername',
    'githubUsername',
    'reminderTime',
    'emailAlertsEnabled'
  ]);
  await chrome.storage.sync.remove(REMOVED_SYNC_KEYS);
  await chrome.storage.local.remove(['lastNotifiedDate', 'lastEmailedDate']);

  const settings = await getSettings();
  // Carry over setups from the previous version
  if (details.reason === 'update' && !settings.onboarded && (old.githubUsername || old.leetcodeUsername)) {
    const { githubToken } = await chrome.storage.local.get('githubToken');
    await chrome.storage.sync.set({
      onboarded: true,
      track: {
        github: Boolean(githubToken && old.githubUsername),
        leetcode: Boolean(old.leetcodeUsername),
        gfg: false
      },
      emailEnabled: old.emailAlertsEnabled !== false
    });
  }

  await setupAlarms();
  await setUninstallUrl();
  // First install: open the setup page on the website straight away (no redirect page)
  if (details.reason === 'install') {
    chrome.tabs
      .create({ url: `${STREAKSYNC_CONFIG.WEBSITE_URL}/settings/` })
      .catch(() => chrome.runtime.openOptionsPage());
  } else syncAccount().catch((e) => console.warn('Account sync after update failed:', e.message));
  sendPing();
});

chrome.runtime.onStartup.addListener(() => {
  setupAlarms();
  sendPing();
});

// ---------- Anonymous usage ping (powers the admin dashboard) ----------
// Sends a random install id, version, browser, which platforms are tracked and a one-way hash of the
// GitHub username, once a day. No usernames, emails or tokens.

async function getInstallId() {
  const { installId } = await chrome.storage.local.get('installId');
  if (installId) return installId;
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ installId: id });
  return id;
}

async function setUninstallUrl() {
  const id = await getInstallId();
  chrome.runtime.setUninstallURL(`${STREAKSYNC_CONFIG.WEBSITE_URL}/uninstalled?id=${id}`);
}

function detectBrowser() {
  if (navigator.brave) return 'brave';
  const brands = (navigator.userAgentData?.brands || []).map((b) => b.brand).join(' ');
  if (/Edge/i.test(brands)) return 'edge';
  if (/Opera/i.test(brands)) return 'opera';
  if (/Chrome/i.test(brands)) return 'chrome';
  return 'other';
}

// One-way hash of the GitHub username, so reinstalls by the same person count once. Empty if not signed in.
async function userHash(login) {
  if (!login) return '';
  const bytes = new TextEncoder().encode(`streaksync:${login.toLowerCase()}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sendPing() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { lastPingDay } = await chrome.storage.local.get('lastPingDay');
    if (lastPingDay === today) return;
    const settings = await getSettings();
    const res = await fetch(`${STREAKSYNC_CONFIG.WORKER_URL}/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: await getInstallId(),
        version: chrome.runtime.getManifest().version,
        browser: detectBrowser(),
        track: settings.track,
        emailEnabled: settings.emailEnabled,
        reminderCount: settings.reminderTimes.length,
        userHash: await userHash(settings.githubUsername)
      })
    });
    if (res.ok) await chrome.storage.local.set({ lastPingDay: today });
  } catch (e) {
    console.warn('Ping failed:', e.message);
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.reminderTimes) setupAlarms();
});

async function getSettings() {
  const s = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return { ...s, track: { ...DEFAULT_SETTINGS.track, ...s.track } };
}

// One daily alarm per reminder time, plus a status refresh every 30 minutes
// (the refresh also catches up on a reminder missed while the browser was closed)
async function setupAlarms() {
  const { reminderTimes } = await getSettings();
  const existing = await chrome.alarms.getAll();
  await Promise.all(existing.filter((a) => a.name.startsWith('remind-')).map((a) => chrome.alarms.clear(a.name)));
  for (const time of reminderTimes) {
    chrome.alarms.create(`remind-${time}`, { when: nextOccurrence(time), periodInMinutes: 24 * 60 });
  }
  chrome.alarms.create('checkStreaks', { periodInMinutes: 30 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkStreaks') sendPing();
  if (alarm.name === 'checkStreaks' || alarm.name.startsWith('remind-')) {
    checkStreaks().catch((err) => console.error('Scheduled check failed:', err));
  }
});

function nextOccurrence(time) {
  const [h, m] = time.split(':').map(Number);
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  return next.getTime();
}

// ---------- Messages from the popup and settings page ----------

const handlers = {
  manualSync: () => checkStreaks(),
  connectGitHub: () => connectGitHub(),
  disconnectGitHub: () => disconnectGitHub(),
  detectAccount: ({ platform }) => detectAccount(platform),
  verifyAccount: ({ platform, username }) => verifyAccount(platform, username),
  saveSettings: ({ settings }) => saveSettings(settings)
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const handler = handlers[request.action];
  if (!handler) return false;
  handler(request)
    .then((result) => sendResponse({ success: true, result }))
    .catch((error) => sendResponse({ success: false, error: error.message }));
  return true;
});

// ---------- Messages from the settings page on the StreakSync website ----------
// Chrome only delivers these from the sites listed in manifest "externally_connectable".
// The origin is checked again here, and only these actions are allowed. Tokens are never sent to the page.

const WEBSITE_ORIGINS = new Set(STREAKSYNC_CONFIG.SETTINGS_ORIGINS);

const externalHandlers = {
  getState: () => getState(),
  connectGitHub: () => connectGitHub(),
  disconnectGitHub: () => disconnectGitHub(),
  detectAccount: ({ platform }) => detectAccount(platform),
  verifyAccount: ({ platform, username }) => verifyAccount(platform, username),
  saveSettings: ({ settings }) => saveSettings(settings)
};

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (!WEBSITE_ORIGINS.has(sender.origin)) {
    sendResponse({ success: false, error: 'This website is not allowed to change StreakSync settings.' });
    return false;
  }
  const handler = externalHandlers[request?.action];
  if (!handler) {
    sendResponse({ success: false, error: 'Unknown action' });
    return false;
  }
  handler(request)
    .then((result) => sendResponse({ success: true, result }))
    .catch((error) => sendResponse({ success: false, error: error.message }));
  return true;
});

// Everything the settings page needs to draw itself (no tokens)
async function getState() {
  const settings = await getSettings();
  const {
    githubToken,
    githubEmail = '',
    accountSync = null
  } = await chrome.storage.local.get(['githubToken', 'githubEmail', 'accountSync']);
  return {
    version: chrome.runtime.getManifest().version,
    settings,
    github: {
      connected: Boolean(githubToken && settings.githubUsername),
      login: settings.githubUsername,
      email: githubEmail
    },
    accountSync,
    limits: { maxReminderTimes: MAX_REMINDER_TIMES, defaultReminderTimes: DEFAULT_REMINDER_TIMES }
  };
}

// ---------- GitHub sign-in ----------

async function connectGitHub() {
  const redirectUri = chrome.identity.getRedirectURL('github');
  const state = crypto.randomUUID();
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', STREAKSYNC_CONFIG.GITHUB_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'user:email');
  authUrl.searchParams.set('state', state);

  const responseUrl = await chrome.identity.launchWebAuthFlow({ url: authUrl.href, interactive: true });
  const params = new URL(responseUrl).searchParams;
  if (params.get('error')) throw new Error(params.get('error_description') || params.get('error'));
  if (params.get('state') !== state) throw new Error('GitHub sign-in failed. Please try again.');

  const res = await fetch(`${STREAKSYNC_CONFIG.WORKER_URL}/github/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: params.get('code'), redirect_uri: redirectUri })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) throw new Error(body.error || 'Could not complete GitHub sign-in.');
  const token = body.access_token;

  const user = await githubApi('/user', token);
  if (!user) throw new Error('Could not read your GitHub profile.');
  const emails = await githubApi('/user/emails', token);
  const list = Array.isArray(emails) ? emails : [];
  const primary = list.find((e) => e.primary && e.verified) || list.find((e) => e.verified);

  // The token stays on this device (storage.local is not synced between computers)
  await chrome.storage.local.set({ githubToken: token, githubEmail: primary ? primary.email : '' });
  await chrome.storage.sync.set({ githubUsername: user.login });
  // Re-ping so the admin stats link this install to the person right away
  await chrome.storage.local.remove('lastPingDay');
  sendPing();
  return { username: user.login, email: primary ? primary.email : '' };
}

async function disconnectGitHub() {
  const { githubToken } = await chrome.storage.local.get('githubToken');
  if (githubToken) {
    await fetch(`${STREAKSYNC_CONFIG.WORKER_URL}/account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${githubToken}` }
    }).catch(() => {});
  }
  await chrome.storage.local.remove(['githubToken', 'githubEmail', 'accountSync']);
  const settings = await getSettings();
  await chrome.storage.sync.set({ githubUsername: '', track: { ...settings.track, github: false } });
  return { disconnected: true };
}

async function githubApi(path, token) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
  });
  return res.ok ? res.json() : null;
}

// ---------- LeetCode / GFG accounts ----------

// Finds the account the user is logged into on that site, in this browser
async function detectAccount(platform) {
  if (platform === 'leetcode') {
    const query = encodeURIComponent('{ userStatus { isSignedIn username } }');
    const res = await fetch(`https://leetcode.com/graphql?query=${query}`, { credentials: 'include' });
    const status = res.ok ? (await res.json())?.data?.userStatus : null;
    if (status?.isSignedIn && status.username) return { username: status.username };
    return { username: '', loginUrl: 'https://leetcode.com/accounts/login/' };
  }
  if (platform === 'gfg') {
    const cookie = await chrome.cookies.get({ url: 'https://www.geeksforgeeks.org', name: 'gfguserName' });
    const handle = cookie ? decodeURIComponent(cookie.value).split('/')[0].trim() : '';
    if (USERNAME_RE.test(handle)) return { username: handle };
    return { username: '', loginUrl: 'https://auth.geeksforgeeks.org/' };
  }
  throw new Error('Unknown platform');
}

async function verifyAccount(platform, username) {
  const name = String(username || '').trim();
  if (!USERNAME_RE.test(name)) throw new Error('Enter a valid username');
  const result = await checkPlatform(platform, { username: name }, todayIn(localTimeZone()));
  if (!result.ok)
    throw new Error(result.notFound ? `No ${PLATFORMS[platform].name} user named "${name}"` : result.error);
  return { username: name, streak: result.streak, doneToday: result.doneToday };
}

// ---------- Settings ----------

async function saveSettings(input) {
  const settings = await getSettings();
  const track = {};
  for (const id of PLATFORM_IDS) track[id] = input?.track?.[id] === true;

  const { githubToken } = await chrome.storage.local.get('githubToken');
  if (track.github && !(githubToken && settings.githubUsername)) throw new Error('Connect GitHub first');
  const update = { track, onboarded: true, emailEnabled: input?.emailEnabled !== false };

  for (const id of ['leetcode', 'gfg']) {
    const name = String(input?.[`${id}Username`] || '').trim();
    if (track[id] && !USERNAME_RE.test(name)) throw new Error(`Connect your ${PLATFORMS[id].name} account first`);
    update[`${id}Username`] = track[id] ? name : '';
  }
  if (!Object.values(track).some(Boolean)) throw new Error('Pick at least one platform to track');

  const times = [...new Set((input?.reminderTimes || []).filter((t) => TIME_RE.test(t)))].sort();
  if (times.length === 0) throw new Error('Add at least one reminder time');
  if (times.length > MAX_REMINDER_TIMES) throw new Error(`You can have up to ${MAX_REMINDER_TIMES} reminder times`);
  update.reminderTimes = times;

  await chrome.storage.sync.set(update);
  // A reminder time added for later today shouldn't count as already missed
  await chrome.storage.local.remove('notified');
  await setupAlarms();

  // Settings changed: let the next ping report the new platform mix
  await chrome.storage.local.remove('lastPingDay');
  sendPing();

  const account = await syncAccount();
  checkStreaks().catch((e) => console.warn('Check after save failed:', e.message));
  return { account };
}

// Sends the settings to the server, which emails at every reminder time each day
async function syncAccount() {
  const settings = await getSettings();
  const { githubToken } = await chrome.storage.local.get('githubToken');
  if (!githubToken || !settings.onboarded) return { status: 'no-github' };

  try {
    const res = await fetch(`${STREAKSYNC_CONFIG.WORKER_URL}/account`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${githubToken}` },
      body: JSON.stringify({
        track: settings.track,
        leetcodeUsername: settings.leetcodeUsername,
        gfgUsername: settings.gfgUsername,
        reminderTimes: settings.reminderTimes,
        emailEnabled: settings.emailEnabled,
        timeZone: localTimeZone()
      })
    });
    const body = await res.json().catch(() => ({}));
    const state = res.ok
      ? { status: 'saved', email: body.email, emailTimes: body.emailTimes, at: Date.now() }
      : { status: 'error', error: body.error || `Server returned HTTP ${res.status}`, at: Date.now() };
    await chrome.storage.local.set({ accountSync: state });
    return state;
  } catch (e) {
    const state = { status: 'error', error: 'Could not reach the StreakSync server', at: Date.now() };
    await chrome.storage.local.set({ accountSync: state });
    return state;
  }
}

// ---------- Streak checks and notifications ----------

// Prevents overlapping checks (alarm + popup) from showing duplicate notifications
let runningCheck = null;
function checkStreaks() {
  if (!runningCheck)
    runningCheck = doCheckStreaks().finally(() => {
      runningCheck = null;
    });
  return runningCheck;
}

async function doCheckStreaks() {
  const settings = await getSettings();
  const { githubToken = '', notified = {} } = await chrome.storage.local.get(['githubToken', 'notified']);
  const tz = localTimeZone();
  const today = todayIn(tz);

  const ids = PLATFORM_IDS.filter((id) => settings.track[id]);
  const checks = await Promise.all(
    ids.map((id) =>
      checkPlatform(
        id,
        {
          token: githubToken,
          githubLogin: settings.githubUsername,
          username: settings[`${id}Username`]
        },
        today
      )
    )
  );

  const { status: prev = {} } = await chrome.storage.local.get('status');
  const platforms = {};
  ids.forEach((id, i) => {
    const r = checks[i];
    platforms[id] = r.ok
      ? { ok: true, doneToday: r.doneToday, streak: r.streak }
      : // Keep the last known streak if a check fails
        { ok: false, error: r.error, streak: prev.platforms?.[id]?.streak || 0 };
  });

  const failed = ids.filter((id) => !platforms[id].ok);
  const pending = ids.filter((id) => platforms[id].ok && !platforms[id].doneToday);
  const status = {
    date: today,
    checkedAt: Date.now(),
    platforms,
    pending,
    failed,
    allDone: ids.length > 0 && failed.length === 0 && pending.length === 0
  };
  await chrome.storage.local.set({ status });

  // Notify for the latest reminder time that has passed today, once per time.
  // If a check failed, wait for the next check rather than guess.
  const now = minutesNowIn(tz);
  const passed = settings.reminderTimes.filter((t) => timeToMinutes(t) <= now);
  const latest = passed[passed.length - 1];
  const sentToday = notified.date === today ? notified.times : [];
  if (latest && !sentToday.includes(latest) && failed.length === 0) {
    if (pending.length > 0) {
      const names = pending.map((id) => PLATFORMS[id].name).join(', ');
      chrome.notifications.create(`streak-${today}-${latest}`, {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '🚨 Your streak is at risk!',
        message: `Still to do today: ${names}`,
        priority: 2
      });
    }
    // Earlier missed times are skipped so the user gets one notification, not several
    await chrome.storage.local.set({ notified: { date: today, times: passed } });
  }

  return status;
}
