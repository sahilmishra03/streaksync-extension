// Extension tests: streak maths, platform checks (with a fake network), config and manifest.
// Run with `npm test` (Node's built-in test runner, no extra packages).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  PLATFORMS,
  USERNAME_RE,
  TIME_RE,
  isValidTimeZone,
  timeToMinutes,
  prevDay,
  countStreak,
  checkGitHub,
  checkLeetCode,
  checkGfg,
  checkPlatform
} from '../extension/platforms.js';
import { STREAKSYNC_CONFIG, DEFAULT_REMINDER_TIMES, MAX_REMINDER_TIMES } from '../extension/config.js';
import { mockFetch } from './helpers.mjs';

const root = path.resolve(import.meta.dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const TODAY = '2026-11-03';

// ---------- Dates and streaks ----------

test('prevDay crosses month and year boundaries', () => {
  assert.equal(prevDay('2026-03-01'), '2026-02-28');
  assert.equal(prevDay('2024-03-01'), '2024-02-29');
  assert.equal(prevDay('2026-01-01'), '2025-12-31');
});

test('countStreak counts back from today when today is done', () => {
  const r = countStreak(new Set(['2026-11-03', '2026-11-02', '2026-11-01', '2026-10-30']), TODAY);
  assert.deepEqual([r.doneToday, r.streak, r.firstMissing], [true, 3, '2026-10-31']);
});

test('countStreak keeps yesterday’s streak alive when today is not done yet', () => {
  const r = countStreak(new Set(['2026-11-02', '2026-11-01']), TODAY);
  assert.deepEqual([r.doneToday, r.streak], [false, 2]);
});

test('countStreak is 0 with a gap yesterday', () => {
  const r = countStreak(new Set(['2026-11-01']), TODAY);
  assert.deepEqual([r.doneToday, r.streak], [false, 0]);
});

test('timeToMinutes and TIME_RE', () => {
  assert.equal(timeToMinutes('00:00'), 0);
  assert.equal(timeToMinutes('22:30'), 1350);
  for (const ok of ['00:00', '09:05', '23:59']) assert.ok(TIME_RE.test(ok), ok);
  for (const bad of ['24:00', '9:00', '12:60', '12:00pm', '']) assert.ok(!TIME_RE.test(bad), bad);
});

test('USERNAME_RE accepts real handles and rejects injection', () => {
  for (const ok of ['sahil_03', 'a.b-c', 'X']) assert.ok(USERNAME_RE.test(ok), ok);
  for (const bad of ['', 'a b', '<script>', 'x'.repeat(41), 'a/b']) assert.ok(!USERNAME_RE.test(bad), bad);
});

test('isValidTimeZone', () => {
  assert.ok(isValidTimeZone('Asia/Kolkata'));
  assert.ok(isValidTimeZone('UTC'));
  assert.ok(!isValidTimeZone('Mars/Olympus'));
  assert.ok(!isValidTimeZone(''));
  assert.ok(!isValidTimeZone(42));
});

// ---------- Platform checks ----------

function githubCalendar(days) {
  return {
    data: { user: { contributionsCollection: { contributionCalendar: { weeks: [{ contributionDays: days }] } } } }
  };
}

test('GitHub: counts contribution days', async () => {
  const f = mockFetch({
    'api.github.com/graphql': () => ({
      body: githubCalendar([
        { date: '2026-11-01', contributionCount: 2 },
        { date: '2026-11-02', contributionCount: 1 },
        { date: '2026-11-03', contributionCount: 0 }
      ])
    })
  });
  try {
    assert.deepEqual(await checkGitHub('tok', 'octo', TODAY), { ok: true, doneToday: false, streak: 2 });
    assert.equal(f.calls[0].init.headers.Authorization, 'Bearer tok');
  } finally {
    f.restore();
  }
});

test('GitHub: a revoked token is reported as unauthorized', async () => {
  const f = mockFetch({ 'api.github.com/graphql': () => ({ status: 401 }) });
  try {
    const r = await checkGitHub('tok', 'octo', TODAY);
    assert.equal(r.ok, false);
    assert.equal(r.unauthorized, true);
  } finally {
    f.restore();
  }
});

test('GitHub: not connected without a token', async () => {
  assert.equal((await checkGitHub('', 'octo', TODAY)).ok, false);
});

test('LeetCode: reads both years of the submission calendar', async () => {
  const ts = (d) => String(Date.parse(`${d}T12:00:00Z`) / 1000);
  const f = mockFetch({
    'leetcode.com/graphql': () => ({
      body: {
        data: {
          matchedUser: {
            current: { submissionCalendar: JSON.stringify({ [ts('2026-11-03')]: 1, [ts('2026-11-02')]: 3 }) },
            previous: { submissionCalendar: '{}' }
          }
        }
      }
    })
  });
  try {
    assert.deepEqual(await checkLeetCode('sahil', TODAY), { ok: true, doneToday: true, streak: 2 });
    assert.deepEqual(f.calls[0].body.variables, { username: 'sahil', year: 2026, prevYear: 2025 });
  } finally {
    f.restore();
  }
});

test('LeetCode: unknown user and bad usernames', async () => {
  const f = mockFetch({
    'leetcode.com/graphql': () => ({ body: { errors: [{ message: 'That user does not exist.' }], data: {} } })
  });
  try {
    assert.equal((await checkLeetCode('ghost', TODAY)).notFound, true);
    assert.equal((await checkLeetCode('bad name', TODAY)).notFound, true);
    assert.equal(f.calls.length, 1, 'invalid usernames never hit the network');
  } finally {
    f.restore();
  }
});

test('GFG: counts heatmap days and handles a missing user', async () => {
  let status = 200;
  const f = mockFetch({
    'practiceapi.geeksforgeeks.org': () =>
      status === 406
        ? { status: 406 }
        : { body: { status: 'success', result: { '2026-11-03': 2, '2026-11-02': 1, '2026-11-01': 0 } } }
  });
  try {
    assert.deepEqual(await checkGfg('sahil', TODAY), { ok: true, doneToday: true, streak: 2 });
    status = 406;
    assert.equal((await checkGfg('ghost', TODAY)).notFound, true);
  } finally {
    f.restore();
  }
});

test('GFG: a site outage is an error, not "not done"', async () => {
  const f = mockFetch({ 'practiceapi.geeksforgeeks.org': () => ({ status: 503 }) });
  try {
    const r = await checkGfg('sahil', TODAY);
    assert.equal(r.ok, false);
    assert.match(r.error, /503/);
  } finally {
    f.restore();
  }
});

test('checkPlatform rejects unknown platforms', async () => {
  assert.equal((await checkPlatform('codeforces', {}, TODAY)).ok, false);
  assert.deepEqual(Object.keys(PLATFORMS), ['github', 'leetcode', 'gfg']);
});

// ---------- Config and manifest ----------

test('config: four reminder times at most, defaults valid and sorted', () => {
  assert.equal(MAX_REMINDER_TIMES, 4);
  assert.ok(DEFAULT_REMINDER_TIMES.length <= MAX_REMINDER_TIMES);
  assert.ok(DEFAULT_REMINDER_TIMES.every((t) => TIME_RE.test(t)));
  assert.deepEqual([...DEFAULT_REMINDER_TIMES].sort(), DEFAULT_REMINDER_TIMES);
  assert.match(STREAKSYNC_CONFIG.WORKER_URL, /^https:\/\//);
});

test('config: every settings origin is allowed by externally_connectable', () => {
  const manifest = JSON.parse(read('extension/manifest.json'));
  const patterns = manifest.externally_connectable.matches.map(
    (m) => new RegExp('^' + m.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$')
  );
  for (const origin of STREAKSYNC_CONFIG.SETTINGS_ORIGINS) {
    const { protocol, hostname } = new URL(origin);
    assert.ok(
      patterns.some((p) => p.test(`${protocol}//${hostname}/settings/`)),
      `${origin} missing from manifest`
    );
  }
  assert.ok(STREAKSYNC_CONFIG.SETTINGS_ORIGINS.includes(new URL(STREAKSYNC_CONFIG.WEBSITE_URL).origin));
});

test('manifest: fixed key, MV3, x.y.z version, no broad host access', () => {
  const manifest = JSON.parse(read('extension/manifest.json'));
  assert.equal(manifest.manifest_version, 3);
  assert.ok(manifest.key?.length > 100, 'the key keeps the extension id fixed');
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.ok(!manifest.host_permissions.includes('<all_urls>'));
  assert.ok(!manifest.permissions.includes('tabs'), 'tabs permission is not needed');
});

test('background: first install opens the website setup page', () => {
  const src = read('extension/background.js');
  assert.match(src, /details\.reason === 'install'/);
  assert.match(src, /WEBSITE_URL\}\/settings\//);
});

test('no secrets in the extension', () => {
  const files = fs.readdirSync(path.join(root, 'extension')).filter((f) => f.endsWith('.js'));
  for (const f of files) {
    const src = read(`extension/${f}`);
    assert.ok(!/xkeysib-|ghp_|gho_|sk-[A-Za-z0-9]{20}/.test(src), `${f} contains something that looks like a key`);
  }
});
