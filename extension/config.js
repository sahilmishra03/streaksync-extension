// StreakSync configuration. These values are public: the GitHub client secret and the
// Brevo key live only in the Cloudflare Worker (see worker/README.md).
export const STREAKSYNC_CONFIG = {
  WORKER_URL: 'https://streaksync-api.sahilmishra03032005.workers.dev',
  GITHUB_CLIENT_ID: 'Ov23linJqaHHMZAjZ0JU',
  // The settings page and uninstall page live on the website
  WEBSITE_URL: 'https://streaksync.sahilmishra.dev',
  // Websites allowed to read and change settings (must also be in manifest externally_connectable)
  SETTINGS_ORIGINS: ['https://streaksync.sahilmishra.dev']
};

export const DEFAULT_REMINDER_TIMES = ['10:00', '14:00', '18:00', '22:00'];
export const MAX_REMINDER_TIMES = 4;
