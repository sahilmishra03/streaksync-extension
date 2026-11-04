import { DEFAULT_REMINDER_TIMES, MAX_REMINDER_TIMES } from './config.js';

const $ = (id) => document.getElementById(id);
const PLATFORMS = ['github', 'leetcode', 'gfg'];
const NAMES = { github: 'GitHub', leetcode: 'LeetCode', gfg: 'GeeksforGeeks' };

// Usernames that were checked and found, so Save doesn't re-check them
const verified = { leetcode: '', gfg: '' };
let github = { connected: false, login: '', email: '' };

function send(action, data = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action, ...data }, (response) => {
      resolve(response || { success: false, error: chrome.runtime.lastError?.message || 'No response' });
    });
  });
}

function setMsg(el, text, kind) {
  el.textContent = text;
  el.className = `msg ${kind === 'ok' ? 'ok' : kind === 'muted' ? 'muted' : 'err'}`;
}

function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await chrome.storage.sync.get({
    onboarded: false,
    track: { github: false, leetcode: false, gfg: false },
    leetcodeUsername: '',
    gfgUsername: '',
    reminderTimes: DEFAULT_REMINDER_TIMES,
    emailEnabled: true
  });

  $('subtitle').textContent = settings.onboarded
    ? 'Change what you track and when you get reminded.'
    : "Welcome! Set up your reminders in three quick steps. You won't need any keys or tokens.";
  $('saveBtn').textContent = settings.onboarded ? 'Save' : 'Save & start reminders';

  for (const id of PLATFORMS) {
    const box = $(`track-${id}`);
    box.checked = Boolean(settings.track?.[id]);
    box.addEventListener('change', () => renderPlatform(id));
    renderPlatform(id);
  }

  for (const id of ['leetcode', 'gfg']) {
    $(`${id}Username`).value = settings[`${id}Username`] || '';
    if (settings[`${id}Username`]) verified[id] = settings[`${id}Username`];
    $(`${id}Username`).addEventListener('change', () => verifyUsername(id));
  }
  document.querySelectorAll('[data-detect]').forEach((btn) => {
    btn.addEventListener('click', () => detect(btn.dataset.detect, btn));
  });

  settings.reminderTimes.forEach(addTimeRow);
  $('addTimeBtn').addEventListener('click', () => addTimeRow(''));
  updateTimes();

  $('emailEnabled').checked = settings.emailEnabled !== false;
  $('emailEnabled').addEventListener('change', renderEmail);

  $('ghConnectBtn').addEventListener('click', connectGitHub);
  $('emailSignInBtn').addEventListener('click', connectGitHub);
  $('ghDisconnectBtn').addEventListener('click', async () => {
    await send('disconnectGitHub');
    await loadGitHub();
  });
  $('saveBtn').addEventListener('click', save);

  await loadGitHub();
});

// ---------- Platforms ----------

function renderPlatform(id) {
  $(`pf-${id}`).classList.toggle('on', $(`track-${id}`).checked);
  renderEmail();
}

async function loadGitHub() {
  const { githubUsername } = await chrome.storage.sync.get('githubUsername');
  const { githubToken, githubEmail } = await chrome.storage.local.get(['githubToken', 'githubEmail']);
  github = { connected: Boolean(githubToken && githubUsername), login: githubUsername || '', email: githubEmail || '' };
  $('ghConnected').classList.toggle('hidden', !github.connected);
  $('ghDisconnected').classList.toggle('hidden', github.connected);
  $('ghLogin').textContent = github.login;
  renderEmail();
}

async function connectGitHub(event) {
  const btn = event.currentTarget;
  btn.disabled = true;
  setMsg($('ghMsg'), '', 'err');
  const res = await send('connectGitHub');
  btn.disabled = false;
  if (!res.success) {
    setMsg($('ghMsg'), res.error || 'GitHub sign-in was cancelled.', 'err');
    if (btn.id === 'emailSignInBtn') setMsg($('emailInfo'), res.error || 'GitHub sign-in was cancelled.', 'err');
  }
  await loadGitHub();
}

async function detect(id, btn) {
  const msg = $(`${id}Msg`);
  btn.disabled = true;
  setMsg(msg, 'Looking for your account...', 'muted');
  const res = await send('detectAccount', { platform: id });
  btn.disabled = false;

  if (res.success && res.result.username) {
    $(`${id}Username`).value = res.result.username;
    await verifyUsername(id);
  } else if (res.success) {
    msg.textContent = '';
    msg.className = 'msg err';
    msg.append(`You're not logged into ${NAMES[id]} in this browser. `);
    const link = document.createElement('a');
    link.href = res.result.loginUrl;
    link.target = '_blank';
    link.textContent = 'Log in';
    link.style.color = 'inherit';
    msg.append(link, ', then click Detect again, or type your username.');
  } else {
    setMsg(msg, `Couldn't detect your account. Type your username instead.`, 'err');
  }
}

async function verifyUsername(id) {
  const msg = $(`${id}Msg`);
  const name = $(`${id}Username`).value.trim();
  verified[id] = '';
  if (!name) {
    setMsg(msg, '', 'err');
    return false;
  }
  setMsg(msg, 'Checking...', 'muted');
  const res = await send('verifyAccount', { platform: id, username: name });
  if (!res.success) {
    setMsg(msg, res.error, 'err');
    return false;
  }
  verified[id] = res.result.username;
  const s = res.result.streak;
  const today = res.result.doneToday ? 'done today' : 'not done today yet';
  setMsg(msg, `✓ Found @${res.result.username}: ${s}-day streak, ${today}`, 'ok');
  return true;
}

// ---------- Reminder times ----------

function addTimeRow(value) {
  const rows = $('times').children;
  if (rows.length >= MAX_REMINDER_TIMES) return;
  const row = document.createElement('div');
  row.className = 'row';
  const input = document.createElement('input');
  input.type = 'time';
  input.value = value || '20:00';
  input.addEventListener('change', updateTimes);
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'remove';
  remove.title = 'Remove';
  remove.textContent = '×';
  remove.addEventListener('click', () => {
    if ($('times').children.length > 1) row.remove();
    updateTimes();
  });
  row.append(input, remove);
  $('times').append(row);
  updateTimes();
}

function getTimes() {
  return [...new Set([...$('times').querySelectorAll('input')].map((i) => i.value).filter(Boolean))].sort();
}

function updateTimes() {
  const times = getTimes();
  $('addTimeBtn').classList.toggle('hidden', $('times').children.length >= MAX_REMINDER_TIMES);
  $('lastTimeText').textContent = times.length ? formatTime(times[times.length - 1]) : '-';
}

// ---------- Email ----------

function renderEmail() {
  if (!$('emailInfo')) return;
  const wantsEmail = $('emailEnabled').checked;
  $('emailSignInBtn').classList.toggle('hidden', !wantsEmail || github.connected);
  if (!wantsEmail) setMsg($('emailInfo'), '', 'muted');
  else if (!github.connected) setMsg($('emailInfo'), 'Email reminders use your verified GitHub email, so sign in with GitHub. You can sign in without tracking GitHub.', 'muted');
  else if (github.email) setMsg($('emailInfo'), `Emails go to ${github.email}.`, 'muted');
  else setMsg($('emailInfo'), 'Your GitHub account has no verified email, so emails cannot be sent.', 'err');
}

// ---------- Save ----------

async function save() {
  const btn = $('saveBtn');
  const msg = $('saveMsg');
  const track = Object.fromEntries(PLATFORMS.map((id) => [id, $(`track-${id}`).checked]));

  if (!Object.values(track).some(Boolean)) return setMsg(msg, 'Pick at least one platform to track.', 'err');
  if (track.github && !github.connected) return setMsg(msg, 'Connect GitHub, or untick it.', 'err');

  btn.disabled = true;
  setMsg(msg, 'Saving...', 'muted');
  for (const id of ['leetcode', 'gfg']) {
    const name = $(`${id}Username`).value.trim();
    if (track[id] && verified[id] !== name && !(await verifyUsername(id))) {
      btn.disabled = false;
      return setMsg(msg, `Fix your ${NAMES[id]} username first.`, 'err');
    }
  }

  const res = await send('saveSettings', {
    settings: {
      track,
      leetcodeUsername: $('leetcodeUsername').value.trim(),
      gfgUsername: $('gfgUsername').value.trim(),
      reminderTimes: getTimes(),
      emailEnabled: $('emailEnabled').checked
    }
  });
  btn.disabled = false;
  if (!res.success) return setMsg(msg, res.error, 'err');

  const account = res.result.account;
  $('saveBtn').textContent = 'Save';
  $('subtitle').textContent = 'Change what you track and when you get reminded.';
  if (!$('emailEnabled').checked || account.status === 'no-github') {
    setMsg(msg, '✓ Saved. You will get browser notifications at your reminder times.', 'ok');
  } else if (account.status === 'saved') {
    setMsg(msg, `✓ Saved. Notifications at your reminder times, and an email to ${account.email || 'you'} at ${formatTime(account.emailTime)} if something is unfinished.`, 'ok');
  } else {
    setMsg(msg, `Saved on this device, but email reminders could not be set up: ${account.error}`, 'err');
  }
}
