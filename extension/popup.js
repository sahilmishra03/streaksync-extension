const $ = (id) => document.getElementById(id);
const NAMES = { github: 'GitHub', leetcode: 'LeetCode', gfg: 'GeeksforGeeks' };
const SVG_NS = 'http://www.w3.org/2000/svg';

document.addEventListener('DOMContentLoaded', () => {
  render();
  const openSettings = () => chrome.runtime.openOptionsPage();
  $('openSettings').addEventListener('click', openSettings);
  $('setupBtn').addEventListener('click', openSettings);
  $('syncNowBtn').addEventListener('click', () => {
    const btn = $('syncNowBtn');
    btn.classList.add('spin');
    btn.disabled = true;
    chrome.runtime.sendMessage({ action: 'manualSync' }, () => {
      void chrome.runtime.lastError; // read it so Chrome doesn't log "Unchecked runtime.lastError"
      btn.classList.remove('spin');
      btn.disabled = false;
      render();
    });
  });
  chrome.storage.onChanged.addListener(() => render());
});

function stateIcon(kind) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.classList.add('state');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  if (kind === 'done') {
    path.setAttribute('d', 'M3.5 8.5 6.5 11.5 12.5 4.5');
    path.setAttribute('stroke', '#4ade80');
  } else if (kind === 'error') {
    path.setAttribute('d', 'M8 4v5M8 12v.01');
    path.setAttribute('stroke', '#9aa0a6');
  } else {
    // Flame: still to do
    path.setAttribute(
      'd',
      'M8 2c2.5 3 4 4.8 4 7.2A4 4 0 0 1 4 9.2C4 7.5 5 6.2 6 5c.3 1.3 1 2 2 2.2C8 5.5 7.6 3.8 8 2Z'
    );
    path.setAttribute('fill', '#f5a524');
    path.setAttribute('stroke', 'none');
  }
  svg.append(path);
  return svg;
}

async function render() {
  const settings = await chrome.storage.sync.get({ onboarded: false, track: {} });
  const { status } = await chrome.storage.local.get('status');
  const tracked = Object.keys(NAMES).filter((id) => settings.track?.[id]);
  const ready = settings.onboarded && tracked.length > 0;

  $('setup').classList.toggle('hidden', ready);
  $('main').classList.toggle('hidden', !ready);
  if (!ready) return;

  const today = new Intl.DateTimeFormat('en-CA').format(new Date());
  const fresh = status && status.date === today;
  const platforms = (fresh && status.platforms) || {};

  // Big counter: platforms done today out of tracked
  const done = tracked.filter((id) => platforms[id]?.ok && platforms[id].doneToday);
  $('doneCount').textContent = String(done.length);
  $('totalCount').textContent = String(tracked.length);

  const summary = $('summary');
  const pending = fresh ? status.pending.filter((id) => tracked.includes(id)) : [];
  if (!fresh) {
    summary.textContent = 'Checking...';
    summary.className = 'hero-sub';
  } else if (status.allDone) {
    summary.textContent = 'All done today. No more reminders.';
    summary.className = 'hero-sub done';
  } else if (pending.length) {
    summary.textContent = `Still to do: ${pending.map((id) => NAMES[id]).join(', ')}`;
    summary.className = 'hero-sub todo';
  } else {
    summary.textContent = "Couldn't check every platform";
    summary.className = 'hero-sub';
  }

  $('todayLabel').textContent = new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  $('checkedAt').textContent = status?.checkedAt
    ? new Date(status.checkedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '-';

  // One row per tracked platform, all on the same dark background
  const list = $('platforms');
  list.textContent = '';
  for (const id of tracked) {
    const p = platforms[id];
    const row = document.createElement('div');
    const kind = !p ? 'pending' : !p.ok ? 'error' : p.doneToday ? 'done' : 'todo';
    row.className = `row ${kind}`;
    if (kind === 'error') row.title = p.error || '';

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = NAMES[id];
    const streak = document.createElement('span');
    streak.className = 'streak';
    const n = p?.streak || 0;
    streak.textContent = `${n} day${n === 1 ? '' : 's'}`;
    row.append(name, streak, stateIcon(kind === 'pending' ? 'todo' : kind));
    list.append(row);
  }

  // Refresh if stale (never checked, or more than 30 minutes ago)
  if (!status || !fresh || Date.now() - status.checkedAt > 30 * 60 * 1000) {
    // The popup may close before the check finishes; that's fine, the result lands in storage
    chrome.runtime.sendMessage({ action: 'manualSync' }).catch(() => {});
  }
}
