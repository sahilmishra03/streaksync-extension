// Usage (from website/): node brand/scripts/make-logo-icons.cjs
// Renders brand/logo-mark.svg, always on a transparent background, in three colorways of the same mark:
//   light: off-white bars, for dark or blue backgrounds (website hero, extension popup and settings)
//   dark:  ink bars, for white backgrounds (admin panel, website footer)
//   icon:  white bars, for favicons and the Chrome toolbar
// The amber flame is the same in all three. Edit the SVG, run this, and every icon updates.
const fs = require('fs');
const path = require('path');
const sharp = require(require.resolve('sharp', { paths: [process.cwd()] }));

const SVG = fs.readFileSync(path.join('brand', 'logo-mark.svg'), 'utf8');
// Favicons and toolbar icons use the same white bars as the light mark (white + amber only)
const BARS = { light: '#F4F4F0', dark: '#0B1220', icon: '#F4F4F0' };
const PUBLIC = 'public';
const EXT_ICONS = path.join('..', 'extension', 'icons');

async function render(variant, size, out) {
  const svg = Buffer.from(SVG.replaceAll('#F4F4F0', BARS[variant]));
  // Render large, then downscale, so small sizes stay crisp
  const big = await sharp(svg, { density: 1152 }).resize(1024, 1024).png().toBuffer();
  let img = sharp(big).resize(size, size, { kernel: 'lanczos3' });
  if (size <= 48) img = img.sharpen({ sigma: 0.5 });
  await img.png().toFile(out);
  console.log(`${out} (${variant}, ${size}px)`);
}

const OUTPUTS = [
  ['icon', 16, path.join(PUBLIC, 'favicon-16x16.png')],
  ['icon', 32, path.join(PUBLIC, 'favicon-32x32.png')],
  ['icon', 48, path.join(PUBLIC, 'favicon-48x48.png')],
  ['icon', 512, path.join(PUBLIC, 'favicon.png')],
  ['icon', 160, path.join(PUBLIC, 'app_icon.png')],
  ['icon', 192, path.join(PUBLIC, 'android-chrome-192x192.png')],
  ['icon', 512, path.join(PUBLIC, 'android-chrome-512x512.png')],
  ['icon', 180, path.join(PUBLIC, 'apple-touch-icon.png')],
  ['light', 512, path.join(PUBLIC, 'logo-mark.png')],
  ['dark', 512, path.join(PUBLIC, 'logo-mark-dark.png')],
  ['icon', 16, path.join(EXT_ICONS, 'icon16.png')],
  ['icon', 32, path.join(EXT_ICONS, 'icon32.png')],
  ['icon', 48, path.join(EXT_ICONS, 'icon48.png')],
  ['icon', 128, path.join(EXT_ICONS, 'icon128.png')],
  ['light', 256, path.join(EXT_ICONS, 'logo-mark.png')]
];

(async () => {
  for (const [variant, size, out] of OUTPUTS) await render(variant, size, out);
})();
