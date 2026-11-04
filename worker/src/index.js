// StreakSync API: Cloudflare Worker
//
// HTTP endpoints (called by the extension):
//   POST   /github/token   Exchange a GitHub OAuth code for a token (keeps the client secret here).
//   PUT    /account        Save the user's tracked platforms, reminder times and time zone.
//   DELETE /account        Delete the user's account data.
//   Both /account calls need "Authorization: Bearer <GitHub token>"; the account is keyed by GitHub user id.
//
// Scheduled (cron, every 5 minutes):
//   For each user whose last reminder time has passed today (in their time zone), check every
//   tracked platform. Email only the platforms that are not done yet. If all are done, send nothing.
//   Each user is processed at most once per day, so this works even when their laptop is off.
//
// Configuration (see worker/README.md):
//   vars:    GITHUB_CLIENT_ID, SENDER_EMAIL, SENDER_NAME
//   secrets: GITHUB_CLIENT_SECRET, BREVO_API_KEY, TOKEN_KEY (base64, 32 bytes, encrypts stored tokens)
//   KV:      STORE

import {
  PLATFORMS,
  USERNAME_RE,
  TIME_RE,
  isValidTimeZone,
  todayIn,
  minutesNowIn,
  timeToMinutes,
  checkPlatform
} from '../../extension/platforms.js';
import { LOGO_PNG_BASE64 } from './logo.js';

const LOGO_BYTES = Uint8Array.from(atob(LOGO_PNG_BASE64), (c) => c.charCodeAt(0));
// Links shown in emails. Override with SITE_URL / PUBLIC_URL vars once the real domain is live.
const DEFAULT_SITE_URL = 'https://github.com/sahilmishra03/streaksync-extension';
const DEFAULT_PUBLIC_URL = 'https://streaksync-api.sahilmishra03032005.workers.dev';

const MAX_BODY_BYTES = 4096;
const MAX_REMINDER_TIMES = 4;
// Free plan: 50 outgoing requests per run. Each user needs up to 4 (3 platforms + 1 email).
const MAX_USERS_PER_RUN = 10;
// How long after the email time we keep retrying (e.g. if a site was down)
const EMAIL_WINDOW_MINUTES = 180;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

    const { pathname } = new URL(request.url);
    try {
      // Logo for the reminder emails (email apps need a public image URL)
      if (pathname === '/logo.png' && request.method === 'GET') {
        return new Response(LOGO_BYTES, {
          headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800' }
        });
      }
      if (pathname === '/github/token' && request.method === 'POST') return await handleGitHubToken(request, env);
      if (pathname === '/account' && request.method === 'PUT') return await handleSaveAccount(request, env);
      if (pathname === '/account' && request.method === 'DELETE') return await handleDeleteAccount(request, env);
      if (pathname === '/ping' && request.method === 'POST') return await handlePing(request, env);
      if (pathname === '/uninstall' && request.method === 'POST') return await handleUninstall(request, env);
      if (pathname === '/admin/stats' && request.method === 'GET') return await handleAdminStats(request, env);
      if (pathname === '/admin/users' && request.method === 'GET') return await handleAdminUsers(request, env);
      // Only enabled with `wrangler dev --var DEBUG:true`, never in production
      if (env.DEBUG === 'true' && pathname === '/debug/check') return await handleDebugCheck(request);
      return json({ error: 'Not found' }, 404);
    } catch (err) {
      console.error('Unhandled error:', err);
      return json({ error: 'Internal error' }, 500);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runReminders(env));
  }
};

// ---------- GitHub OAuth ----------

async function handleGitHubToken(request, env) {
  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid JSON body' }, 400);

  const { code, redirect_uri: redirectUri } = body;
  if (typeof code !== 'string' || !code || code.length > 200) return json({ error: 'Missing or invalid code' }, 400);
  if (typeof redirectUri !== 'string' || !/^https:\/\/[a-p]{32}\.chromiumapp\.org\//.test(redirectUri)) {
    return json({ error: 'Invalid redirect_uri' }, 400);
  }

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    return json({ error: data.error_description || data.error || 'GitHub token exchange failed' }, 400);
  }
  return json({ access_token: data.access_token, scope: data.scope || '' });
}

// ---------- Account ----------

async function authenticate(request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token || token.length > 255) return { error: json({ error: 'Missing GitHub token' }, 401) };
  const user = await githubApi('/user', token);
  if (!user.ok || !user.data?.id) return { error: json({ error: 'Invalid GitHub token' }, 401) };
  return { token, user: user.data };
}

function validateAccount(body) {
  const track = body?.track || {};
  const clean = {
    track: {
      github: track.github === true,
      leetcode: track.leetcode === true,
      gfg: track.gfg === true
    },
    leetcodeUsername: '',
    gfgUsername: '',
    reminderTimes: [],
    timeZone: '',
    emailEnabled: body?.emailEnabled !== false
  };

  for (const id of ['leetcode', 'gfg']) {
    if (!clean.track[id]) continue;
    const name = String(body[`${id}Username`] || '').trim();
    if (!USERNAME_RE.test(name)) return { error: `Invalid ${PLATFORMS[id].name} username` };
    clean[`${id}Username`] = name;
  }
  if (!Object.values(clean.track).some(Boolean)) return { error: 'Track at least one platform' };

  const times = Array.isArray(body?.reminderTimes) ? body.reminderTimes : [];
  clean.reminderTimes = [...new Set(times.filter((t) => typeof t === 'string' && TIME_RE.test(t)))].sort();
  if (clean.reminderTimes.length === 0 || clean.reminderTimes.length > MAX_REMINDER_TIMES) {
    return { error: `Choose between 1 and ${MAX_REMINDER_TIMES} reminder times` };
  }

  if (!isValidTimeZone(body?.timeZone)) return { error: 'Invalid time zone' };
  clean.timeZone = body.timeZone;
  return { account: clean };
}

async function handleSaveAccount(request, env) {
  const auth = await authenticate(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid JSON body' }, 400);
  const { account, error } = validateAccount(body);
  if (error) return json({ error }, 400);

  const emails = await githubApi('/user/emails', auth.token);
  const list = Array.isArray(emails.data) ? emails.data : [];
  const primary = list.find((e) => e.primary && e.verified) || list.find((e) => e.verified);

  const key = `u:${auth.user.id}`;
  const existing = await env.STORE.getWithMetadata(key);
  let previous = null;
  try {
    previous = existing.value ? JSON.parse(existing.value) : null;
  } catch {
    previous = null;
  }
  const record = {
    ...account,
    githubId: auth.user.id,
    githubLogin: auth.user.login,
    email: primary ? primary.email : '',
    tokenEnc: await encryptToken(auth.token, env.TOKEN_KEY),
    // Records from before createdAt existed: their first save time is the best known join date
    createdAt: previous?.createdAt || previous?.updatedAt || new Date().toISOString(),
    lastRun: previous?.lastRun || null,
    updatedAt: new Date().toISOString()
  };
  await putRecord(env, key, record, existing.metadata?.d || '');

  return json({ saved: true, email: record.email, emailTime: lastTime(record.reminderTimes) });
}

async function handleDeleteAccount(request, env) {
  const auth = await authenticate(request);
  if (auth.error) return auth.error;
  await env.STORE.delete(`u:${auth.user.id}`);
  return json({ deleted: true });
}

function lastTime(times) {
  return times[times.length - 1];
}

// Metadata lets the cron decide who is due from a single list() call, without reading every record
async function putRecord(env, key, record, processedDate) {
  await env.STORE.put(key, JSON.stringify(record), {
    metadata: {
      tz: record.timeZone,
      t: lastTime(record.reminderTimes),
      e: Boolean(record.emailEnabled && record.email),
      d: processedDate
    }
  });
}

// ---------- Scheduled reminders ----------

export async function runReminders(env) {
  const due = [];
  let cursor;
  do {
    const page = await env.STORE.list({ prefix: 'u:', cursor });
    for (const { name, metadata: m } of page.keys) {
      if (!m || !m.e || !isValidTimeZone(m.tz) || !TIME_RE.test(m.t || '')) continue;
      const today = todayIn(m.tz);
      if (m.d === today) continue;
      const late = minutesNowIn(m.tz) - timeToMinutes(m.t);
      if (late >= 0 && late < EMAIL_WINDOW_MINUTES) due.push({ key: name, today, late });
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  // Most overdue first; the rest are picked up by the next run in 5 minutes
  due.sort((a, b) => b.late - a.late);
  const results = [];
  for (const item of due.slice(0, MAX_USERS_PER_RUN)) {
    try {
      results.push(await processUser(env, item.key, item.today));
    } catch (err) {
      console.error('Processing failed for', item.key, err);
      results.push({ key: item.key, status: 'error' });
    }
  }
  if (results.length) console.log('Reminder run:', JSON.stringify(results));
  return results;
}

async function processUser(env, key, today) {
  const stored = await env.STORE.get(key);
  if (!stored) return { key, status: 'missing' };
  const record = JSON.parse(stored);
  const token = await decryptToken(record.tokenEnc, env.TOKEN_KEY);

  const ids = Object.keys(PLATFORMS).filter((id) => record.track?.[id]);
  const checks = await Promise.all(
    ids.map((id) =>
      checkPlatform(
        id,
        {
          token,
          githubLogin: record.githubLogin,
          username: record[`${id}Username`]
        },
        today
      )
    )
  );
  const results = Object.fromEntries(ids.map((id, i) => [id, checks[i]]));

  // The user revoked StreakSync on GitHub: we can no longer verify them, so forget the account
  if (results.github?.unauthorized) {
    await env.STORE.delete(key);
    return { key, status: 'revoked' };
  }

  const failed = ids.filter((id) => !results[id].ok);
  if (failed.length) {
    // Don't guess: retry on the next run while the window is open
    console.warn('Checks failed for', key, failed.map((id) => `${id}: ${results[id].error}`).join('; '));
    return { key, status: 'retry', failed };
  }

  const pending = ids.filter((id) => !results[id].doneToday);
  const streaks = Object.fromEntries(ids.map((id) => [id, results[id].streak]));
  // lastRun is shown in the admin panel. Only written when the day is settled (one write per user per day).
  if (pending.length === 0) {
    record.lastRun = { date: today, status: 'all-done', at: new Date().toISOString(), pending: [], streaks };
    await putRecord(env, key, record, today);
    await bumpStat(env, 'all_done');
    return { key, status: 'all-done' };
  }

  const sent = await sendEmail(env, record, pending, streaks);
  if (!sent) {
    await bumpStat(env, 'email_failed');
    return { key, status: 'email-failed' };
  }
  record.lastRun = { date: today, status: 'emailed', at: new Date().toISOString(), pending, streaks };
  await putRecord(env, key, record, today);
  await bumpStat(env, 'emails_sent');
  return { key, status: 'emailed', pending };
}

async function sendEmail(env, record, pending, streaks) {
  const email = buildReminderEmail(record.githubLogin, pending, streaks, {
    siteUrl: env.SITE_URL || DEFAULT_SITE_URL,
    logoUrl: `${env.PUBLIC_URL || DEFAULT_PUBLIC_URL}/logo.png`
  });
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: env.SENDER_NAME || 'StreakSync', email: env.SENDER_EMAIL },
      to: [{ email: record.email, name: record.githubLogin }],
      subject: email.subject,
      htmlContent: email.html,
      textContent: email.text
    })
  });
  if (!res.ok) console.error('Brevo error:', res.status, await res.text());
  return res.ok;
}

// ---------- Reminder email ----------
//
// One template, three moods, picked by how many platforms are still left:
//   1 left  -> "one problem away" (copy depends on which platform)
//   2 left  -> "panic" meme
//   3 left  -> "this is fine" meme
// Memes are GIFs hotlinked from GIPHY (allowed by GIPHY's embed terms). Many email apps hide
// images until you allow them, so every GIF has alt text and the email reads fine without it.

const GIF = (id) => `https://media.giphy.com/media/${id}/giphy.gif`;
const MEMES = {
  typing: { src: GIF('13GIgrGdslD9oQ'), alt: 'Jim Carrey typing very fast' },
  panic: { src: GIF('HUkOv6BNWc1HO'), alt: 'Someone panicking' },
  fine: { src: GIF('THXwXYVrr0HHX2jgS0'), alt: 'Ross from Friends insisting "I\'m fine"' }
};

const ONE_LEFT = {
  leetcode: {
    emoji: '🧠',
    subject: (s) =>
      s > 0 ? `1 LeetCode problem stands between you and day ${s + 1}` : 'LeetCode misses you. One problem?',
    title: 'Just one LeetCode problem left.',
    line: 'An Easy counts. Two Sum counts. Nobody has to know.',
    caption: 'You at 11:58 PM, solving Two Sum for the fourth time'
  },
  github: {
    emoji: '🟩',
    subject: (s) => (s > 0 ? `Your ${s}-day GitHub streak wants one commit` : 'Your GitHub graph has a gap today'),
    title: 'One commit and you are free.',
    line: 'Fix a README typo. Push that side project. Any contribution counts.',
    caption: 'git commit -m "saving the streak"'
  },
  gfg: {
    emoji: '🟢',
    subject: (s) =>
      s > 0 ? `GeeksforGeeks is guarding your ${s}-day streak. Barely.` : 'GeeksforGeeks is feeling ignored',
    title: 'One GeeksforGeeks problem to go.',
    line: 'The Problem of the Day is right there. So is the streak.',
    caption: 'You speedrunning the Problem of the Day'
  }
};

function streakLine(s) {
  return s > 0 ? `${s}-day streak ends at midnight` : 'Start a new streak today';
}

export function buildReminderEmail(login, pending, streaks, brand = {}) {
  const rows = pending.map((id) => {
    const streak = streaks[id] || 0;
    return { id, name: PLATFORMS[id].name, url: PLATFORMS[id].url, streak, note: streakLine(streak) };
  });
  const atStake = rows.reduce((sum, r) => sum + r.streak, 0);
  const names = rows.map((r) => r.name);

  let subject, title, line, meme, caption;
  if (rows.length === 1) {
    const copy = ONE_LEFT[rows[0].id];
    subject = `${copy.emoji} ${copy.subject(rows[0].streak)}`;
    ({ title, line, caption } = copy);
    meme = MEMES.typing;
  } else if (rows.length === 2) {
    subject = `😬 2 streaks are sweating: ${names.join(' and ')}`;
    title = `${names.join(' and ')} are still waiting.`;
    line = 'Two quick wins and the evening is yours again.';
    caption = `Your ${names.join(' and ')} streaks watching the clock`;
    meme = MEMES.panic;
  } else {
    subject = `🔥 This is fine. (It is not. ${rows.length} streaks left today)`;
    title = 'Everything is fine. Probably.';
    line = `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} are all still open. Start with the easiest one.`;
    caption = `You, with 0 of ${rows.length} done tonight`;
    meme = MEMES.fine;
  }
  const stakeText = atStake > 0 ? `${atStake} streak day${atStake === 1 ? '' : 's'} on the line tonight.` : '';

  const text = [
    `Hi ${login},`,
    '',
    title,
    line,
    '',
    ...rows.map((r) => `- ${r.name}: ${r.note} (${r.url})`),
    '',
    stakeText,
    'Platforms you already finished today are not listed. Turn off emails in StreakSync settings.',
    '',
    `StreakSync: never break your coding streak. ${brand.siteUrl || DEFAULT_SITE_URL}`
  ]
    .filter((l, i, a) => l !== '' || a[i - 1] !== '')
    .join('\n');

  // Clean, minimal layout: logo, one headline, the meme, a plain list of what's left, a footer
  // that promotes the site. Tables + inline styles so it renders the same in Gmail and Outlook.
  const siteUrl = brand.siteUrl || DEFAULT_SITE_URL;
  const logoUrl = brand.logoUrl || `${DEFAULT_PUBLIC_URL}/logo.png`;
  const siteLabel = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const ink = '#262322';
  const muted = '#8a8580';

  const rowHtml = rows
    .map(
      (r, i) => `
            <tr>
              <td style="padding:14px 0;${i ? 'border-top:1px solid #efece8;' : ''}font-family:${font};">
                <div style="font-size:15px;font-weight:600;color:${ink};">${escapeHtml(r.name)}</div>
                <div style="font-size:13px;color:${muted};margin-top:2px;">${escapeHtml(r.note)}</div>
              </td>
              <td align="right" style="padding:14px 0;${i ? 'border-top:1px solid #efece8;' : ''}font-family:${font};">
                <a href="${r.url}" style="font-size:13px;font-weight:600;color:#1f5fd6;text-decoration:none;">Open &rarr;</a>
              </td>
            </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#fafaf9;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(line)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td style="padding:0 0 22px;">
          <a href="${siteUrl}" style="text-decoration:none;">
            <img src="${logoUrl}" alt="StreakSync" width="28" height="28" style="display:inline-block;vertical-align:middle;border:0;">
            <span style="display:inline-block;vertical-align:middle;margin-left:8px;font-family:${font};font-size:16px;font-weight:600;color:${ink};">StreakSync</span>
          </a>
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid #ece9e4;border-radius:16px;padding:28px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="font-family:${font};font-size:13px;color:${muted};padding-bottom:6px;">Hi ${escapeHtml(login)},</td></tr>
            <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:${ink};padding-bottom:8px;">${escapeHtml(title)}</td></tr>
            <tr><td style="font-family:${font};font-size:14px;line-height:1.55;color:#5f5a55;padding-bottom:22px;">${escapeHtml(line)}</td></tr>
            <tr><td style="padding-bottom:6px;">
              <img src="${meme.src}" alt="${escapeHtml(meme.alt)}" width="430" style="display:block;width:100%;max-width:430px;height:auto;border-radius:10px;border:0;">
            </td></tr>
            <tr><td style="font-family:${font};font-size:12px;font-style:italic;color:${muted};text-align:center;padding-bottom:18px;">${escapeHtml(caption)}</td></tr>
            <tr><td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowHtml}
              </table>
            </td></tr>
            ${stakeText ? `<tr><td style="font-family:${font};font-size:13px;color:${ink};padding-top:10px;border-top:1px solid #efece8;">${escapeHtml(stakeText)}</td></tr>` : ''}
          </table>
        </td></tr>
        <tr><td align="center" style="padding:26px 8px 0;font-family:${font};">
          <img src="${logoUrl}" alt="" width="20" height="20" style="display:block;border:0;margin:0 auto 8px;">
          <div style="font-size:13px;color:${ink};font-weight:600;">Never break your coding streak.</div>
          <div style="font-size:12px;color:${muted};margin-top:4px;">Free reminders for GitHub, LeetCode and GeeksforGeeks.</div>
          <a href="${siteUrl}" style="display:inline-block;margin-top:10px;font-size:12px;font-weight:600;color:#1f5fd6;text-decoration:none;">${escapeHtml(siteLabel)}</a>
          <div style="font-size:11px;color:#b0aba5;margin-top:14px;line-height:1.5;">
            Finished platforms are never listed. Turn off emails anytime in StreakSync settings.<br>GIFs via GIPHY.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, html, text };
}

// ---------- Anonymous usage analytics (admin dashboard) ----------

const INSTALL_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const BROWSERS = ['chrome', 'edge', 'brave', 'opera', 'other'];
const utcDay = (offsetDays = 0) => new Date(Date.now() - offsetDays * 86400000).toISOString().slice(0, 10);

// Called by the extension at most once a day. Contains no usernames, emails or tokens.
async function handlePing(request, env) {
  const body = await readJson(request);
  if (!body || !INSTALL_ID_RE.test(body.id || '')) return json({ error: 'Invalid ping' }, 400);
  const version = /^\d{1,3}(\.\d{1,3}){0,3}$/.test(body.version || '') ? body.version : '';
  const browser = BROWSERS.includes(body.browser) ? body.browser : 'other';
  const t = body.track || {};
  const reminders = Math.max(0, Math.min(MAX_REMINDER_TIMES, Number(body.reminderCount) || 0));
  const userHash = /^[0-9a-f]{64}$/.test(body.userHash || '') ? body.userHash : '';
  const today = utcDay();

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO installs (id, first_seen, last_seen, version, browser, github, leetcode, gfg, email_enabled, reminder_count, user_hash)
       VALUES (?1, ?2, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
       ON CONFLICT(id) DO UPDATE SET last_seen = ?2, version = ?3, browser = ?4, github = ?5, leetcode = ?6,
         gfg = ?7, email_enabled = ?8, reminder_count = ?9, user_hash = ?10`
    ).bind(
      body.id,
      today,
      version,
      browser,
      t.github ? 1 : 0,
      t.leetcode ? 1 : 0,
      t.gfg ? 1 : 0,
      body.emailEnabled ? 1 : 0,
      reminders,
      userHash
    ),
    env.DB.prepare('INSERT OR IGNORE INTO active_days (day, id) VALUES (?1, ?2)').bind(today, body.id)
  ]);
  return json({ ok: true });
}

async function handleUninstall(request, env) {
  const body = await readJson(request);
  if (!body || !INSTALL_ID_RE.test(body.id || '')) return json({ error: 'Invalid id' }, 400);
  const res = await env.DB.prepare('DELETE FROM installs WHERE id = ?1').bind(body.id).run();
  if (res.meta?.changes) await bumpStat(env, 'uninstalls');
  return json({ ok: true });
}

async function bumpStat(env, metric) {
  if (!env.DB) return;
  try {
    await env.DB.prepare(
      'INSERT INTO daily_stats (day, metric, value) VALUES (?1, ?2, 1) ON CONFLICT(day, metric) DO UPDATE SET value = value + 1'
    )
      .bind(utcDay(), metric)
      .run();
  } catch (e) {
    console.error('bumpStat failed:', e);
  }
}

function safeEqual(a, b) {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

function isAdmin(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return Boolean(env.ADMIN_TOKEN && env.ADMIN_TOKEN.length >= 16 && safeEqual(token, env.ADMIN_TOKEN));
}

// One "person" per GitHub account (user_hash). Installs without GitHub sign-in count as one person each.
const PEOPLE = `(SELECT CASE WHEN user_hash <> '' THEN user_hash ELSE id END AS person, * FROM installs)`;

async function handleAdminStats(request, env) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401);

  const days = 30;
  const since = utcDay(days - 1);
  const d7 = utcDay(6);
  const today = utcDay();
  const q = (sql, ...args) => env.DB.prepare(sql).bind(...args);
  const activePeople = (where) =>
    `(SELECT COUNT(DISTINCT p.person) FROM active_days a JOIN ${PEOPLE} p ON p.id = a.id WHERE ${where})`;

  const [totals, activeSeries, newSeries, statSeries, platforms, browsers, versions] = await env.DB.batch([
    q(
      `SELECT
         (SELECT COUNT(*) FROM installs) AS installs,
         (SELECT COUNT(DISTINCT person) FROM ${PEOPLE}) AS people,
         ${activePeople('a.day = ?1')} AS active_today,
         ${activePeople('a.day >= ?2')} AS active_7d,
         ${activePeople('a.day >= ?3')} AS active_30d,
         (SELECT COUNT(*) FROM (SELECT person FROM ${PEOPLE} GROUP BY person HAVING MIN(first_seen) = ?1)) AS new_today,
         (SELECT COUNT(*) FROM (SELECT person FROM ${PEOPLE} GROUP BY person HAVING MIN(first_seen) >= ?2)) AS new_7d`,
      today,
      d7,
      since
    ),
    q(
      `SELECT a.day, COUNT(DISTINCT p.person) AS n FROM active_days a JOIN ${PEOPLE} p ON p.id = a.id WHERE a.day >= ?1 GROUP BY a.day`,
      since
    ),
    q(
      `SELECT day, COUNT(*) AS n FROM (SELECT person, MIN(first_seen) AS day FROM ${PEOPLE} GROUP BY person) WHERE day >= ?1 GROUP BY day`,
      since
    ),
    q('SELECT day, metric, value FROM daily_stats WHERE day >= ?1', since),
    // Each person's most recent install decides what they track (SQLite takes bare columns from the MAX row)
    q(
      `SELECT SUM(github) AS github, SUM(leetcode) AS leetcode, SUM(gfg) AS gfg, SUM(email_enabled) AS email,
         AVG(reminder_count) AS avg_reminders
       FROM (SELECT *, MAX(last_seen) AS latest FROM ${PEOPLE} WHERE last_seen >= ?1 GROUP BY person)`,
      since
    ),
    q(
      `SELECT browser AS name, COUNT(DISTINCT person) AS n FROM ${PEOPLE} WHERE last_seen >= ?1 GROUP BY browser ORDER BY n DESC`,
      since
    ),
    q(
      `SELECT version AS name, COUNT(DISTINCT person) AS n FROM ${PEOPLE} WHERE last_seen >= ?1 GROUP BY version ORDER BY n DESC LIMIT 6`,
      since
    )
  ]);

  // Email accounts live in KV; metadata says who has email on
  let accounts = 0;
  let emailOn = 0;
  let cursor;
  do {
    const page = await env.STORE.list({ prefix: 'u:', cursor });
    for (const k of page.keys) {
      accounts++;
      if (k.metadata?.e) emailOn++;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  const series = [];
  const byDay = (rows) => Object.fromEntries((rows.results || []).map((r) => [r.day, r.n]));
  const active = byDay(activeSeries);
  const fresh = byDay(newSeries);
  const stats = {};
  for (const r of statSeries.results || []) (stats[r.day] ||= {})[r.metric] = r.value;
  for (let i = days - 1; i >= 0; i--) {
    const day = utcDay(i);
    series.push({
      day,
      active: active[day] || 0,
      new: fresh[day] || 0,
      emails: stats[day]?.emails_sent || 0,
      allDone: stats[day]?.all_done || 0,
      uninstalls: stats[day]?.uninstalls || 0,
      emailFailed: stats[day]?.email_failed || 0
    });
  }

  const p = platforms.results?.[0] || {};
  return json({
    generatedAt: new Date().toISOString(),
    totals: { ...(totals.results?.[0] || {}), email_accounts: accounts, email_on: emailOn },
    series,
    platforms: {
      github: p.github || 0,
      leetcode: p.leetcode || 0,
      gfg: p.gfg || 0,
      email: p.email || 0,
      avgReminders: Math.round((p.avg_reminders || 0) * 10) / 10
    },
    browsers: browsers.results || [],
    versions: versions.results || [],
    limits: { brevoDaily: 300, kvWritesDaily: 1000, usersPerRun: MAX_USERS_PER_RUN }
  });
}

// Email accounts (people signed in with GitHub). Tokens are never returned.
async function handleAdminUsers(request, env) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401);
  const keys = [];
  let cursor;
  do {
    const page = await env.STORE.list({ prefix: 'u:', cursor });
    keys.push(...page.keys);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor && keys.length < 200);

  const users = [];
  for (const k of keys.slice(0, 200)) {
    const raw = await env.STORE.get(k.name);
    if (!raw) continue;
    let r;
    try {
      r = JSON.parse(raw);
    } catch {
      continue;
    }
    const tz = isValidTimeZone(r.timeZone) ? r.timeZone : 'UTC';
    const today = todayIn(tz);
    const emailTime = lastTime(r.reminderTimes || []) || '';
    const late = emailTime ? minutesNowIn(tz) - timeToMinutes(emailTime) : -1;
    let todayStatus;
    if (!r.emailEnabled || !r.email) todayStatus = 'email-off';
    else if (k.metadata?.d === today) todayStatus = r.lastRun?.date === today ? r.lastRun.status : 'done';
    else if (late < 0) todayStatus = 'scheduled';
    else if (late < EMAIL_WINDOW_MINUTES) todayStatus = 'checking';
    else todayStatus = 'missed';
    users.push({
      githubLogin: r.githubLogin,
      email: r.email,
      track: r.track,
      leetcodeUsername: r.leetcodeUsername,
      gfgUsername: r.gfgUsername,
      reminderTimes: r.reminderTimes,
      timeZone: tz,
      emailEnabled: Boolean(r.emailEnabled),
      emailTime,
      today,
      todayStatus,
      lastRun: r.lastRun || null,
      createdAt: r.createdAt || null,
      updatedAt: r.updatedAt || null
    });
  }
  users.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return json({ generatedAt: new Date().toISOString(), users, truncated: keys.length > 200 });
}

// ---------- Debug (dev only) ----------

async function handleDebugCheck(request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('platform');
  const username = url.searchParams.get('username');
  const today = todayIn(url.searchParams.get('tz') || 'Asia/Kolkata');
  return json({ today, result: await checkPlatform(id, { username }, today) });
}

// ---------- Token encryption (AES-GCM) ----------

async function importKey(b64) {
  const raw = Uint8Array.from(atob(b64 || ''), (c) => c.charCodeAt(0));
  if (raw.length !== 32) throw new Error('TOKEN_KEY must be 32 bytes, base64-encoded');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptToken(token, keyB64) {
  const key = await importKey(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(token))
  );
  const out = new Uint8Array(iv.length + data.length);
  out.set(iv);
  out.set(data, iv.length);
  return btoa(String.fromCharCode(...out));
}

export async function decryptToken(enc, keyB64) {
  const key = await importKey(keyB64);
  const bytes = Uint8Array.from(atob(enc), (c) => c.charCodeAt(0));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12));
  return new TextDecoder().decode(plain);
}

// ---------- Helpers ----------

async function githubApi(path, token) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'StreakSync-Worker'
    }
  });
  const data = res.ok ? await res.json().catch(() => null) : null;
  return { ok: res.ok && data !== null, data };
}

async function readJson(request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}
