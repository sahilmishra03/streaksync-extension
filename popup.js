import { DEFAULT_REMINDER_TIMES } from './config.js';

const $ = (id) => document.getElementById(id);
const NAMES = { github: 'GitHub', leetcode: 'LeetCode', gfg: 'GeeksforGeeks' };

document.addEventListener('DOMContentLoaded', () => {
  render();
  $('openSettings').addEventListener('click', () => chrome.runtime.openOptionsPage());
  $('setupBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());
  $('syncNowBtn').addEventListener('click', () => {
    const btn = $('syncNowBtn');
    btn.textContent = 'Checking...';
    btn.disabled = true;
    chrome.runtime.sendMessage({ action: 'manualSync' }, () => {
      btn.textContent = 'Check now';
      btn.disabled = false;
      render();
    });
  });
  chrome.storage.onChanged.addListener(() => render());
});

function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

async function render() {
  const settings = await chrome.storage.sync.get({ onboarded: false, track: {}, reminderTimes: DEFAULT_REMINDER_TIMES });
  const { status } = await chrome.storage.local.get('status');
  const tracked = Object.keys(NAMES).filter((id) => settings.track?.[id]);

  $('setup').classList.toggle('hidden', settings.onboarded && tracked.length > 0);
  $('main').classList.toggle('hidden', !(settings.onboarded && tracked.length > 0));
  if (!settings.onboarded || tracked.length === 0) return;

  const today = new Intl.DateTimeFormat('en-CA').format(new Date());
  const fresh = status && status.date === today;
  const platforms = (fresh && status.platforms) || {};

  // Summary
  const summary = $('summary');
  const pending = fresh ? status.pending.filter((id) => tracked.includes(id)) : [];
  if (!fresh) {
    summary.textContent = 'Checking...';
    summary.className = 'summary';
  } else if (status.allDone) {
    summary.textContent = '✓ All done today. No more reminders.';
    summary.className = 'summary done';
  } else if (pending.length) {
    summary.textContent = `To do: ${pending.map((id) => NAMES[id]).join(', ')}`;
    summary.className = 'summary todo';
  } else {
    summary.textContent = "Couldn't check every platform";
    summary.className = 'summary todo';
  }
  $('checkedAt').textContent = status?.checkedAt
    ? `Last checked ${new Date(status.checkedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    : '';

  // One row per tracked platform
  const list = $('platforms');
  list.textContent = '';
  for (const id of tracked) {
    const p = platforms[id];
    const row = document.createElement('div');
    row.className = 'platform-row';
    const name = document.createElement('span');
    name.textContent = NAMES[id];
    const right = document.createElement('span');
    const streak = document.createElement('span');
    streak.className = 'streak';
    const n = p?.streak || 0;
    streak.textContent = `🔥 ${n} day${n === 1 ? '' : 's'}`;
    const badge = document.createElement('span');
    if (!p) { badge.className = 'badge muted'; badge.textContent = '...'; }
    else if (!p.ok) { badge.className = 'badge muted'; badge.textContent = 'Error'; badge.title = p.error || ''; }
    else if (p.doneToday) { badge.className = 'badge success'; badge.textContent = 'Done'; }
    else { badge.className = 'badge danger'; badge.textContent = 'To do'; }
    right.append(streak, badge);
    row.append(name, right);
    list.append(row);
  }

  $('footer').textContent = `Reminders: ${settings.reminderTimes.map(formatTime).join(', ')}`;

  // Refresh if stale (never checked, or more than 30 minutes ago)
  if (!status || !fresh || Date.now() - status.checkedAt > 30 * 60 * 1000) {
    chrome.runtime.sendMessage({ action: 'manualSync' });
  }
}
