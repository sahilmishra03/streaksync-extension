// Packs extension/ into a zip users download:
//   dist/streaksync-extension.zip            (GitHub release asset)
//   website/public/streaksync-extension.zip  (one-click download on the website)
// Files sit inside a "streaksync-extension/" folder, so unzipping gives one folder to load.
// Pure Node (no zip tool needed), so it also runs on Vercel and in CI.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = path.resolve(import.meta.dirname, '..');
const ext = path.join(root, 'extension');
const outputs = [
  path.join(root, 'dist', 'streaksync-extension.zip'),
  path.join(root, 'website', 'public', 'streaksync-extension.zip')
];
const FOLDER = 'streaksync-extension/';
const { version } = JSON.parse(fs.readFileSync(path.join(ext, 'manifest.json'), 'utf8'));

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function listFiles(dir, base = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const rel = base + e.name;
    return e.isDirectory() ? listFiles(path.join(dir, e.name), rel + '/') : [rel];
  });
}

// Fixed timestamp so the zip is identical between builds
const DOS_TIME = 0;
const DOS_DATE = ((2024 - 1980) << 9) | (1 << 5) | 1;

const locals = [];
const centrals = [];
let offset = 0;
for (const rel of listFiles(ext).sort()) {
  const data = fs.readFileSync(path.join(ext, rel));
  const deflated = zlib.deflateRawSync(data, { level: 9 });
  const name = Buffer.from(FOLDER + rel);
  const crc = crc32(data);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6); // UTF-8 names
  local.writeUInt16LE(8, 8); // deflate
  local.writeUInt16LE(DOS_TIME, 10);
  local.writeUInt16LE(DOS_DATE, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(deflated.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  locals.push(local, name, deflated);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(DOS_TIME, 12);
  central.writeUInt16LE(DOS_DATE, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(deflated.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(offset, 42);
  centrals.push(central, name);

  offset += local.length + name.length + deflated.length;
}

const centralBuf = Buffer.concat(centrals);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(centrals.length / 2, 8);
end.writeUInt16LE(centrals.length / 2, 10);
end.writeUInt32LE(centralBuf.length, 12);
end.writeUInt32LE(offset, 16);
const zip = Buffer.concat([...locals, centralBuf, end]);

for (const out of outputs) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, zip);
  console.log(`Created ${path.relative(root, out)} (v${version}, ${Math.round(zip.length / 1024)} KB)`);
}
