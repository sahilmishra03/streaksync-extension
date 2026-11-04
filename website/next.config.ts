import type { NextConfig } from "next";

// Static export: `npm run build` writes plain HTML/CSS/JS to `out/`, hosted free on Cloudflare Pages.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    // The repo root has its own package-lock.json; the website is its own project
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
