// Usage (from website/): node brand/scripts/make-logo-icons.cjs
// Renders brand/logo-mark.svg on a transparent background in light, dark and icon colorways.
// The yellow flame stays the same in every variant. Edit the SVG, run this, and every icon updates.
const fs = require("fs");
const path = require("path");
const sharp = require(require.resolve("sharp", { paths: [process.cwd()] }));

const SVG = fs.readFileSync(path.join("brand", "logo-mark.svg"), "utf8");
const BARS = { light: "#F4F4F0", dark: "#0B1220", icon: "#F4F4F0", "icon-dark": "#0B1220" };
const PUBLIC = "public";
const EXT_ICONS = path.join("..", "extension", "icons");

async function render(variant, size, out) {
  const svg = Buffer.from(SVG.replaceAll("#F4F4F0", BARS[variant]));
  // Render large, then downscale, so small sizes stay crisp
  const big = await sharp(svg, { density: 1152 }).resize(1024, 1024).png().toBuffer();
  let img = sharp(big).resize(size, size, { kernel: "lanczos3" });
  if (size <= 48) img = img.sharpen({ sigma: 0.5 });
  await img.png().toFile(out);
  console.log(`${out} (${variant}, ${size}px)`);
}

const OUTPUTS = [
  ["icon", 16, path.join(PUBLIC, "favicon-16x16.png")],
  ["icon", 32, path.join(PUBLIC, "favicon-32x32.png")],
  ["icon-dark", 16, path.join(PUBLIC, "favicon-16x16-dark.png")],
  ["icon-dark", 32, path.join(PUBLIC, "favicon-32x32-dark.png")],
  ["icon-dark", 48, path.join(PUBLIC, "favicon-48x48-dark.png")],
  ["icon", 48, path.join(PUBLIC, "favicon-48x48.png")],
  ["icon", 512, path.join(PUBLIC, "favicon.png")],
  ["icon-dark", 512, path.join(PUBLIC, "favicon-dark.png")],
  ["icon", 160, path.join(PUBLIC, "app_icon.png")],
  ["icon-dark", 160, path.join(PUBLIC, "app_icon-dark.png")],
  ["icon", 192, path.join(PUBLIC, "android-chrome-192x192.png")],
  ["icon-dark", 192, path.join(PUBLIC, "android-chrome-192x192-dark.png")],
  ["icon", 512, path.join(PUBLIC, "android-chrome-512x512.png")],
  ["icon-dark", 512, path.join(PUBLIC, "android-chrome-512x512-dark.png")],
  ["icon", 180, path.join(PUBLIC, "apple-touch-icon.png")],
  ["light", 512, path.join(PUBLIC, "logo-mark.png")],
  ["dark", 512, path.join(PUBLIC, "logo-mark-dark.png")],
  ["icon", 16, path.join(EXT_ICONS, "icon16.png")],
  ["icon", 32, path.join(EXT_ICONS, "icon32.png")],
  ["icon", 48, path.join(EXT_ICONS, "icon48.png")],
  ["icon", 128, path.join(EXT_ICONS, "icon128.png")],
  ["icon-dark", 16, path.join(EXT_ICONS, "icon16-dark.png")],
  ["icon-dark", 32, path.join(EXT_ICONS, "icon32-dark.png")],
  ["icon-dark", 48, path.join(EXT_ICONS, "icon48-dark.png")],
  ["icon-dark", 128, path.join(EXT_ICONS, "icon128-dark.png")],
  ["light", 256, path.join(EXT_ICONS, "logo-mark.png")],
  ["dark", 256, path.join(EXT_ICONS, "logo-mark-dark.png")],
];

(async () => {
  for (const [variant, size, out] of OUTPUTS) await render(variant, size, out);
})();
