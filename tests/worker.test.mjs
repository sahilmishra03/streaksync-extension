// Worker tests: reminder email (1, 2 and 3 platforms left), token encryption, HTTP endpoints
// and the scheduled reminder run, all against an in-memory KV and a fake network.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { buildReminderEmail, encryptToken, decryptToken, runReminders } from '../worker/src/index.js';
import { memoryKV, mockFetch, TOKEN_KEY } from './helpers.mjs';

const call = (env, method, path, { body, token } = {}) =>
  worker.fetch(
    new Request(`https://api.test${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body)
    }),
    env
  );
const baseEnv = () => ({ STORE: memoryKV(), TOKEN_KEY, BREVO_API_KEY: 'test', SENDER_EMAIL: 'bot@test.dev' });

// ---------- Reminder email ----------

test('email, 1 left (LeetCode): streak-aware subject, typing meme, links', () => {
  const e = buildReminderEmail('sahil', ['leetcode'], { leetcode: 25 });
  assert.match(e.subject, /day 26/);
  assert.match(e.html, /13GIgrGdslD9oQ/);
  assert.match(e.html, /leetcode\.com\/problemset/);
  assert.match(e.html, /25-day streak ends at midnight/);
  assert.match(e.text, /LeetCode: 25-day streak ends at midnight/);
});

test('email, 1 left: each platform has its own copy, and a 0 streak says "start"', () => {
  const gh = buildReminderEmail('s', ['github'], { github: 0 });
  const gfg = buildReminderEmail('s', ['gfg'], { gfg: 6 });
  assert.match(gh.subject, /GitHub graph has a gap/);
  assert.match(gh.html, /Start a new streak today/);
  assert.match(gfg.subject, /6-day streak/);
  assert.notEqual(gh.subject, gfg.subject);
});

test('email, 2 left: panic meme, both names in the subject', () => {
  const e = buildReminderEmail('s', ['leetcode', 'gfg'], { leetcode: 3, gfg: 4 });
  assert.match(e.subject, /2 streaks are sweating: LeetCode and GeeksforGeeks/);
  assert.match(e.html, /HUkOv6BNWc1HO/);
  assert.match(e.html, /7 streak days on the line/);
});

test('email, 3 left: "this is fine" meme and every platform listed', () => {
  const e = buildReminderEmail('s', ['github', 'leetcode', 'gfg'], { github: 1, leetcode: 0, gfg: 0 });
  assert.match(e.subject, /This is fine/);
  assert.match(e.html, /THXwXYVrr0HHX2jgS0/);
  for (const name of ['GitHub', 'LeetCode', 'GeeksforGeeks']) assert.match(e.text, new RegExp(`- ${name}:`));
  assert.match(e.html, /1 streak day on the line/);
});

test('email escapes the GitHub login and gives every GIF alt text', () => {
  const e = buildReminderEmail('<img src=x onerror=alert(1)>', ['github'], { github: 2 });
  assert.ok(!e.html.includes('<img src=x'), 'login must be escaped');
  for (const img of e.html.match(/<img [^>]*>/g)) assert.match(img, /alt="/, 'every image has an alt attribute');
  for (const img of e.html.match(/<img [^>]*giphy[^>]*>/g))
    assert.match(img, /alt="[^"]+"/, 'GIFs describe themselves');
  assert.match(e.html, /\/logo\.png/, 'uses the StreakSync logo');
  const plain = buildReminderEmail('sahil', ['github', 'gfg'], { github: 2, gfg: 1 });
  assert.ok(!/<[a-z]/i.test(plain.text), 'text version has no HTML');
});

// ---------- Token encryption ----------

test('tokens round-trip through AES-GCM and fail with the wrong key', async () => {
  const enc = await encryptToken('gho_secret', TOKEN_KEY);
  assert.ok(!enc.includes('gho_secret'));
  assert.notEqual(enc, await encryptToken('gho_secret', TOKEN_KEY), 'random IV each time');
  assert.equal(await decryptToken(enc, TOKEN_KEY), 'gho_secret');
  await assert.rejects(decryptToken(enc, Buffer.alloc(32, 9).toString('base64')));
  await assert.rejects(encryptToken('x', 'c2hvcnQ='), /32 bytes/);
});

// ---------- HTTP endpoints ----------

test('/logo.png serves the email logo', async () => {
  const res = await call(baseEnv(), 'GET', '/logo.png');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Content-Type'), 'image/png');
  const bytes = new Uint8Array(await res.arrayBuffer());
  assert.deepEqual([...bytes.slice(1, 4)], [0x50, 0x4e, 0x47], 'PNG signature');
});

test('unknown routes 404 and CORS preflight works', async () => {
  const env = baseEnv();
  assert.equal((await call(env, 'GET', '/nope')).status, 404);
  const pre = await call(env, 'OPTIONS', '/account');
  assert.equal(pre.status, 204);
  assert.match(pre.headers.get('Access-Control-Allow-Methods'), /PUT/);
});

test('/github/token only accepts chromiumapp.org redirects', async () => {
  const env = baseEnv();
  const bad = await call(env, 'POST', '/github/token', { body: { code: 'abc', redirect_uri: 'https://evil.com/' } });
  assert.equal(bad.status, 400);
  assert.equal((await call(env, 'POST', '/github/token', { body: {} })).status, 400);
});

test('/account needs a GitHub token', async () => {
  assert.equal((await call(baseEnv(), 'PUT', '/account', { body: {} })).status, 401);
});

function githubUser(id = 42, login = 'sahil') {
  return {
    'api.github.com/user/emails': () => ({ body: [{ email: 'me@test.dev', primary: true, verified: true }] }),
    'api.github.com/user': () => ({ body: { id, login } })
  };
}
const ACCOUNT = {
  track: { github: true, leetcode: true, gfg: false },
  leetcodeUsername: 'sahil_lc',
  reminderTimes: ['22:00', '10:00'],
  timeZone: 'Asia/Kolkata'
};

test('PUT /account saves an encrypted record with cron metadata', async () => {
  const env = baseEnv();
  const f = mockFetch(githubUser());
  try {
    const res = await call(env, 'PUT', '/account', { token: 'gho_abc', body: ACCOUNT });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { saved: true, email: 'me@test.dev', emailTimes: ['10:00', '22:00'] });
    const { value, metadata } = await env.STORE.getWithMetadata('u:42');
    assert.deepEqual(metadata, {
      tz: 'Asia/Kolkata',
      ts: '10:00,22:00',
      t: '22:00',
      e: true,
      d: '',
      sd: '',
      st: ''
    });
    const rec = JSON.parse(value);
    assert.deepEqual(rec.reminderTimes, ['10:00', '22:00']);
    assert.ok(!value.includes('gho_abc'), 'token must be stored encrypted');
    assert.equal(await decryptToken(rec.tokenEnc, TOKEN_KEY), 'gho_abc');
  } finally {
    f.restore();
  }
});

test('PUT /account rejects bad input', async () => {
  const env = baseEnv();
  const f = mockFetch(githubUser());
  try {
    const bad = [
      { ...ACCOUNT, reminderTimes: ['08:00', '10:00', '12:00', '14:00', '16:00'] },
      { ...ACCOUNT, reminderTimes: [] },
      { ...ACCOUNT, timeZone: 'Nowhere/City' },
      { ...ACCOUNT, leetcodeUsername: 'bad name' },
      { ...ACCOUNT, track: {} }
    ];
    for (const body of bad) assert.equal((await call(env, 'PUT', '/account', { token: 't', body })).status, 400);
    assert.equal(env.STORE.data.size, 0);
  } finally {
    f.restore();
  }
});

test('DELETE /account removes the record', async () => {
  const env = baseEnv();
  await env.STORE.put('u:42', '{}');
  const f = mockFetch(githubUser());
  try {
    assert.equal((await call(env, 'DELETE', '/account', { token: 't' })).status, 200);
    assert.equal(await env.STORE.get('u:42'), null);
  } finally {
    f.restore();
  }
});

test('/ping validates the install id, admin routes need the password', async () => {
  const env = { ...baseEnv(), ADMIN_TOKEN: 'pw' };
  assert.equal((await call(env, 'POST', '/ping', { body: { id: 'not-a-uuid' } })).status, 400);
  assert.equal((await call(env, 'GET', '/admin/stats')).status, 401);
  assert.equal((await call(env, 'GET', '/admin/users', { token: 'wrong' })).status, 401);
});

// ---------- Scheduled reminders ----------

// A reminder time a few minutes ago in UTC, so the user is due right now
function justPassed() {
  const d = new Date(Date.now() - 5 * 60 * 1000);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
const nearMidnight = () => new Date().getUTCHours() * 60 + new Date().getUTCMinutes() < 10;
const todayUTC = () => new Date().toISOString().slice(0, 10);

async function seedUser(env, track = { github: true, leetcode: true, gfg: false }) {
  const record = {
    track,
    leetcodeUsername: 'sahil_lc',
    gfgUsername: '',
    reminderTimes: [justPassed()],
    timeZone: 'UTC',
    emailEnabled: true,
    githubId: 42,
    githubLogin: 'sahil',
    email: 'me@test.dev',
    tokenEnc: await encryptToken('gho_abc', TOKEN_KEY)
  };
  await env.STORE.put('u:42', JSON.stringify(record), {
    metadata: { tz: 'UTC', t: record.reminderTimes[0], e: true, d: '' }
  });
}

function platformRoutes({ githubDone, leetcodeDone, githubStatus = 200 }) {
  const today = todayUTC();
  return {
    'api.github.com/graphql': () =>
      githubStatus !== 200
        ? { status: githubStatus }
        : {
            body: {
              data: {
                user: {
                  contributionsCollection: {
                    contributionCalendar: {
                      weeks: [{ contributionDays: [{ date: today, contributionCount: githubDone ? 1 : 0 }] }]
                    }
                  }
                }
              }
            }
          },
    'leetcode.com/graphql': () => ({
      body: {
        data: {
          matchedUser: {
            current: {
              submissionCalendar: JSON.stringify(leetcodeDone ? { [String(Math.floor(Date.now() / 1000))]: 1 } : {})
            },
            previous: { submissionCalendar: '{}' }
          }
        }
      }
    }),
    'api.brevo.com': () => ({ status: 201, body: { messageId: 'm1' } })
  };
}

test('cron: emails only the unfinished platform, once per reminder slot', { skip: nearMidnight() }, async () => {
  const env = baseEnv();
  await seedUser(env);
  const f = mockFetch(platformRoutes({ githubDone: true, leetcodeDone: false }));
  try {
    const [r] = await runReminders(env);
    assert.deepEqual(r.pending, ['leetcode']);
    const sent = f.calls.filter((c) => c.url.includes('brevo'));
    assert.equal(sent.length, 1);
    assert.match(sent[0].body.subject, /LeetCode/);
    assert.equal(sent[0].body.to[0].email, 'me@test.dev');
    assert.equal(sent[0].init.headers['api-key'], 'test');

    assert.equal((await runReminders(env)).length, 0, 'second run for the same slot sends nothing');
    const stored = await env.STORE.getWithMetadata('u:42');
    assert.equal(stored.metadata.d, '');
    assert.deepEqual(JSON.parse(stored.value).reminderSentTimes, [JSON.parse(stored.value).reminderTimes[0]]);
  } finally {
    f.restore();
  }
});

test('cron: sends again at a later reminder slot while work remains', { skip: nearMidnight() }, async () => {
  const env = baseEnv();
  const first = justPassed();
  const earlierDate = new Date(Date.now() - 10 * 60 * 1000);
  const second = `${String(earlierDate.getUTCHours()).padStart(2, '0')}:${String(earlierDate.getUTCMinutes()).padStart(2, '0')}`;
  const record = {
    track: { github: true, leetcode: true, gfg: false },
    leetcodeUsername: 'sahil_lc',
    gfgUsername: '',
    reminderTimes: [second, first],
    timeZone: 'UTC',
    emailEnabled: true,
    githubId: 42,
    githubLogin: 'sahil',
    email: 'me@test.dev',
    tokenEnc: await encryptToken('gho_abc', TOKEN_KEY)
  };
  await env.STORE.put('u:42', JSON.stringify(record), {
    metadata: { tz: 'UTC', ts: record.reminderTimes.join(','), t: first, e: true, d: '', sd: '', st: '' }
  });
  const f = mockFetch(platformRoutes({ githubDone: true, leetcodeDone: false }));
  try {
    const results = await runReminders(env);
    assert.equal(results.filter((r) => r.status === 'emailed').length, 2);
    assert.equal(f.calls.filter((c) => c.url.includes('brevo')).length, 2);
  } finally {
    f.restore();
  }
});

test('cron: nothing is sent when everything is done', { skip: nearMidnight() }, async () => {
  const env = baseEnv();
  await seedUser(env);
  const f = mockFetch(platformRoutes({ githubDone: true, leetcodeDone: true }));
  try {
    const [r] = await runReminders(env);
    assert.equal(r.status, 'all-done');
    assert.equal(f.calls.filter((c) => c.url.includes('brevo')).length, 0);
  } finally {
    f.restore();
  }
});

test('cron: a site outage retries later instead of guessing', { skip: nearMidnight() }, async () => {
  const env = baseEnv();
  await seedUser(env);
  const f = mockFetch({ ...platformRoutes({}), 'leetcode.com/graphql': () => ({ status: 502 }) });
  try {
    const [r] = await runReminders(env);
    assert.equal(r.status, 'retry');
    assert.equal((await env.STORE.getWithMetadata('u:42')).metadata.d, '', 'not marked as processed');
  } finally {
    f.restore();
  }
});

test('cron: a revoked GitHub sign-in deletes the account', { skip: nearMidnight() }, async () => {
  const env = baseEnv();
  await seedUser(env);
  const f = mockFetch(platformRoutes({ githubStatus: 401 }));
  try {
    const [r] = await runReminders(env);
    assert.equal(r.status, 'revoked');
    assert.equal(await env.STORE.get('u:42'), null);
  } finally {
    f.restore();
  }
});

test('cron: users with email off are skipped', async () => {
  const env = baseEnv();
  await env.STORE.put('u:7', '{}', { metadata: { tz: 'UTC', t: justPassed(), e: false, d: '' } });
  assert.equal((await runReminders(env)).length, 0);
});
