// Writes every reminder email variant to email-previews/ as .html (open in a browser).
// Run: node scripts/preview-emails.mjs
import fs from 'node:fs';
import path from 'node:path';
import { buildReminderEmail } from '../worker/src/index.js';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'email-previews');
fs.mkdirSync(out, { recursive: true });

const streaks = { github: 4, leetcode: 26, gfg: 1 };
const cases = {
  '1-github': ['github'],
  '1-leetcode': ['leetcode'],
  '1-gfg': ['gfg'],
  '2-leetcode-gfg': ['leetcode', 'gfg'],
  '3-all': ['github', 'leetcode', 'gfg']
};

for (const [name, pending] of Object.entries(cases)) {
  const e = buildReminderEmail('sahilmishra03', pending, streaks);
  fs.writeFileSync(path.join(out, `${name}.html`), e.html.replace('<body', `<!-- Subject: ${e.subject} -->\n<body`));
  fs.writeFileSync(path.join(out, `${name}.txt`), `Subject: ${e.subject}\n\n${e.text}\n`);
  console.log(`${name}: ${e.subject}`);
}
