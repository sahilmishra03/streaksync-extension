// Platform streak checks, shared by the extension (background.js) and the
// Cloudflare Worker (worker/src/index.js) so both count streaks the same way.
// Every check returns { ok: true, doneToday, streak } or { ok: false, error, ... }.

export const PLATFORMS = {
  github: { name: 'GitHub', url: 'https://github.com' },
  leetcode: { name: 'LeetCode', url: 'https://leetcode.com/problemset/' },
  gfg: { name: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/problem-of-the-day' }
};

export const USERNAME_RE = /^[A-Za-z0-9_.-]{1,40}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// ---------- Dates (all as YYYY-MM-DD strings) ----------

export function isValidTimeZone(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return typeof tz === 'string' && tz.length > 0 && tz.length < 64;
  } catch {
    return false;
  }
}

export function todayIn(tz) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

export function minutesNowIn(tz) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());
  const get = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
  return get('hour') * 60 + get('minute');
}

export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function prevDay(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Consecutive active days ending today, or ending yesterday if today isn't done yet.
// firstMissing is the first inactive day going backwards.
export function countStreak(activeDates, today) {
  const doneToday = activeDates.has(today);
  let day = doneToday ? today : prevDay(today);
  let streak = 0;
  while (activeDates.has(day) && streak < 5000) {
    streak++;
    day = prevDay(day);
  }
  return { doneToday, streak, firstMissing: day };
}

function failure(error, extra = {}) {
  return { ok: false, error, ...extra };
}

// ---------- GitHub: same contribution calendar as the green profile graph ----------

const GITHUB_QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar { weeks { contributionDays { date contributionCount } } }
      }
    }
  }
`;

export async function checkGitHub(token, login, today) {
  if (!token || !login) return failure('GitHub not connected');
  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'StreakSync'
      },
      body: JSON.stringify({ query: GITHUB_QUERY, variables: { login } })
    });
    if (res.status === 401) return failure('GitHub sign-in is no longer valid', { unauthorized: true });
    if (!res.ok) return failure(`GitHub returned HTTP ${res.status}`);
    const json = await res.json();
    const weeks = json?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
    if (json.errors || !Array.isArray(weeks)) return failure('GitHub API error');

    const active = new Set();
    for (const week of weeks) {
      for (const day of week.contributionDays) {
        if (day.contributionCount > 0) active.add(day.date);
      }
    }
    const { doneToday, streak } = countStreak(active, today);
    return { ok: true, doneToday, streak };
  } catch (e) {
    return failure(`GitHub request failed: ${e.message || e}`);
  }
}

// ---------- LeetCode: public submission calendar (per year, UTC days) ----------

const LEETCODE_QUERY = `
  query($username: String!, $year: Int, $prevYear: Int) {
    matchedUser(username: $username) {
      current: userCalendar(year: $year) { submissionCalendar }
      previous: userCalendar(year: $prevYear) { submissionCalendar }
    }
  }
`;

export async function checkLeetCode(username, today) {
  if (!USERNAME_RE.test(username || '')) return failure('Invalid LeetCode username', { notFound: true });
  try {
    const year = Number(today.slice(0, 4));
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (StreakSync)'
      },
      body: JSON.stringify({ query: LEETCODE_QUERY, variables: { username, year, prevYear: year - 1 } })
    });
    if (!res.ok) return failure(`LeetCode returned HTTP ${res.status}`);
    const json = await res.json();
    if (json.errors && !json?.data?.matchedUser) {
      const notFound = json.errors.some((e) => /does not exist/i.test(e.message || ''));
      return failure(notFound ? 'LeetCode user not found' : 'LeetCode API error', { notFound });
    }
    const user = json?.data?.matchedUser;
    if (!user) return failure('LeetCode user not found', { notFound: true });

    const active = new Set();
    for (const cal of [user.current, user.previous]) {
      if (!cal?.submissionCalendar) continue;
      for (const ts of Object.keys(JSON.parse(cal.submissionCalendar))) {
        active.add(new Date(parseInt(ts, 10) * 1000).toISOString().slice(0, 10));
      }
    }
    const { doneToday, streak } = countStreak(active, today);
    return { ok: true, doneToday, streak };
  } catch (e) {
    return failure(`LeetCode request failed: ${e.message || e}`);
  }
}

// ---------- GeeksforGeeks: yearly submission heatmap (unofficial endpoint) ----------

async function gfgYear(username, year) {
  const res = await fetch('https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (StreakSync)' },
    body: JSON.stringify({ handle: username, requestType: 'getYearwiseUserSubmissions', year: String(year), month: '' })
  });
  if (res.status === 406) return { notFound: true };
  if (!res.ok) return { error: `GFG returned HTTP ${res.status}` };
  const json = await res.json();
  if (json.status !== 'success') return { error: 'GFG API error' };
  const result = json.result && typeof json.result === 'object' ? json.result : {};
  return {
    days: Object.entries(result)
      .filter(([, count]) => Number(count) > 0)
      .map(([day]) => day)
  };
}

export async function checkGfg(username, today) {
  if (!USERNAME_RE.test(username || '')) return failure('Invalid GFG username', { notFound: true });
  try {
    const year = Number(today.slice(0, 4));
    const current = await gfgYear(username, year);
    if (current.notFound) return failure('GFG user not found', { notFound: true });
    if (current.error) return failure(current.error);

    const active = new Set(current.days);
    let result = countStreak(active, today);
    // Streak runs back past Jan 1: also load last year
    if (result.firstMissing.startsWith(String(year - 1))) {
      const previous = await gfgYear(username, year - 1);
      if (previous.days) {
        previous.days.forEach((d) => active.add(d));
        result = countStreak(active, today);
      }
    }
    return { ok: true, doneToday: result.doneToday, streak: result.streak };
  } catch (e) {
    return failure(`GFG request failed: ${e.message || e}`);
  }
}

export function checkPlatform(id, { token, githubLogin, username }, today) {
  if (id === 'github') return checkGitHub(token, githubLogin, today);
  if (id === 'leetcode') return checkLeetCode(username, today);
  if (id === 'gfg') return checkGfg(username, today);
  return Promise.resolve(failure('Unknown platform'));
}
