// Checks the extension and worker without a browser:
// manifest is valid, every file it references exists, scripts parse, and no secret leaked into tracked code.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const ext = path.join(root, 'extension');
const errors = [];

// 1. Manifest
const manifest = JSON.parse(fs.readFileSync(path.join(ext, 'manifest.json'), 'utf8'));
const referenced = [
  manifest.background?.service_worker,
  manifest.action?.default_popup,
  manifest.options_page,
  ...Object.values(manifest.icons || {}),
  ...Object.values(manifest.action?.default_icon || {})
].filter(Boolean);
for (const file of referenced) {
  if (!fs.existsSync(path.join(ext, file))) errors.push(`manifest.json points to missing file: ${file}`);
}
if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) errors.push(`manifest version "${manifest.version}" should be x.y.z`);

// 2. Every .js file parses as an ES module
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-check-'));
const jsFiles = [
  ...fs
    .readdirSync(ext)
    .filter((f) => f.endsWith('.js'))
    .map((f) => path.join(ext, f)),
  path.join(root, 'worker', 'src', 'index.js')
];
for (const file of jsFiles) {
  const copy = path.join(tmp, path.basename(file).replace(/\.js$/, '.mjs'));
  fs.copyFileSync(file, copy);
  try {
    execFileSync(process.execPath, ['--check', copy], { stdio: 'pipe' });
  } catch (e) {
    errors.push(`${path.relative(root, file)}: ${e.stderr.toString().split('\n').slice(0, 4).join(' ')}`);
  }
}
fs.rmSync(tmp, { recursive: true, force: true });

// 3. No secret values from worker/.env in the extension, worker source or website source
const envFile = path.join(root, 'worker', '.env');
if (fs.existsSync(envFile)) {
  const secrets = fs
    .readFileSync(envFile, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.match(/^[A-Z_]+=(.{8,})$/)?.[1]?.trim())
    .filter(Boolean);
  const scan = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.next', 'out', '.wrangler', '.git'].includes(entry.name) || entry.name === '.env') continue;
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) scan(p);
      else if (/\.(js|mjs|cjs|ts|tsx|json|html|css|toml|md)$/.test(entry.name)) {
        const text = fs.readFileSync(p, 'utf8');
        if (secrets.some((s) => text.includes(s))) errors.push(`Secret value found in ${path.relative(root, p)}`);
      }
    }
  };
  scan(root);
}

if (errors.length) {
  console.error('Extension check failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log(`Extension check passed (${jsFiles.length} scripts, manifest v${manifest.version}).`);
