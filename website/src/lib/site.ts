// Public site settings. Change these in one place.

export const SITE = {
  name: "StreakSync",
  url: "https://streaksync.sahilmishra.dev",
  description:
    "A free Chrome extension that reminds you to keep your GitHub, LeetCode and GeeksforGeeks streaks alive.",
  apiUrl: "https://streaksync-api.sahilmishra03032005.workers.dev",
  // Fixed by the "key" in extension/manifest.json
  extensionId: "dbnbgjdeflpgeebnljcedmdcjglkoikj",
  repoUrl: "https://github.com/sahilmishra03/streaksync-extension",
  discordUrl: "https://discord.com/users/889514676067635250",
  // Served by the website itself; scripts/zip-extension.mjs builds it before every build
  downloadUrl: "/streaksync-extension.zip",
  version: "1.0.1",
  // Footer credit: the name is shown, the link goes to the personal site
  authorName: "Sahil Mishra",
  authorUrl: "https://sahilmishra.dev",
  // Shown in the footer. Change it to a dedicated address once you have your own domain.
  contactEmail: "sahilmishra03032005@gmail.com",
} as const;
