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
  PLATFORMS, USERNAME_RE, TIME_RE, isValidTimeZone, todayIn, minutesNowIn, timeToMinutes, checkPlatform
} from '../../platforms.js';

const MAX_BODY_BYTES = 4096;
const MAX_REMINDER_TIMES = 6;
// Free plan: 50 outgoing requests per run. Each user needs up to 4 (3 platforms + 1 email).
const MAX_USERS_PER_RUN = 10;
// How long after the email time we keep retrying (e.g. if a site was down)
const EMAIL_WINDOW_MINUTES = 180;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/github/token' && request.method === 'POST') return await handleGitHubToken(request, env);
      if (pathname === '/account' && request.method === 'PUT') return await handleSaveAccount(request, env);
      if (pathname === '/account' && request.method === 'DELETE') return await handleDeleteAccount(request, env);
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
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
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
  const record = {
    ...account,
    githubId: auth.user.id,
    githubLogin: auth.user.login,
    email: primary ? primary.email : '',
    tokenEnc: await encryptToken(auth.token, env.TOKEN_KEY),
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
  const checks = await Promise.all(ids.map((id) => checkPlatform(id, {
    token,
    githubLogin: record.githubLogin,
    username: record[`${id}Username`]
  }, today)));
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
  if (pending.length === 0) {
    await putRecord(env, key, record, today);
    return { key, status: 'all-done' };
  }

  const streaks = Object.fromEntries(ids.map((id) => [id, results[id].streak]));
  const sent = await sendEmail(env, record, pending, streaks);
  if (!sent) return { key, status: 'email-failed' };
  await putRecord(env, key, record, today);
  return { key, status: 'emailed', pending };
}

async function sendEmail(env, record, pending, streaks) {
  const email = buildReminderEmail(record.githubLogin, pending, streaks);
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' },
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

export function buildReminderEmail(login, pending, streaks) {
  const rows = pending.map((id) => {
    const s = streaks[id] || 0;
    return {
      name: PLATFORMS[id].name,
      url: PLATFORMS[id].url,
      streakText: s > 0 ? `your ${s}-day streak ends tonight` : 'start a new streak today'
    };
  });
  const subject = `⏰ Still to do today: ${rows.map((r) => r.name).join(', ')}`;

  const text = [
    `Hi ${login},`,
    '',
    "You haven't finished these today:",
    ...rows.map((r) => `- ${r.name}: ${r.streakText} (${r.url})`),
    '',
    'Platforms you already finished today are not listed.',
    '- StreakSync'
  ].join('\n');

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#0f172a;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#f8fafc;">
  <div style="max-width:480px;margin:0 auto;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;">
    <h2 style="margin:0 0 12px;font-size:20px;">⚡ Don't break your streak</h2>
    <p style="margin:0 0 16px;color:#cbd5e1;">Hi ${escapeHtml(login)}, you haven't finished these today:</p>
    ${rows.map((r) => `
    <div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px;margin-bottom:10px;">
      <div style="font-weight:700;font-size:15px;">${escapeHtml(r.name)}</div>
      <div style="color:#f59e0b;font-size:13px;margin:4px 0 10px;">🔥 ${escapeHtml(r.streakText)}</div>
      <a href="${r.url}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:8px 14px;border-radius:6px;font-size:13px;font-weight:600;">Open ${escapeHtml(r.name)}</a>
    </div>`).join('')}
    <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;">Platforms you already finished today are not listed. You can turn off emails in StreakSync settings.</p>
  </div>
</body></html>`;

  return { subject, html, text };
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
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(token)));
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
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json', 'User-Agent': 'StreakSync-Worker' }
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
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
}
