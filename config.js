// StreakSync configuration. Both values are public: the GitHub client secret and the
// Brevo key live only in the Cloudflare Worker (see worker/README.md).
export const STREAKSYNC_CONFIG = {
  WORKER_URL: 'https://streaksync-api.sahilmishra03032005.workers.dev',
  GITHUB_CLIENT_ID: 'Ov23linJqaHHMZAjZ0JU'
};

export const DEFAULT_REMINDER_TIMES = ['10:00', '14:00', '18:00', '22:00'];
export const MAX_REMINDER_TIMES = 6;
