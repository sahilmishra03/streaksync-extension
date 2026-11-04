// Forwards to the settings page on the website (Chrome's "Extension options" and the popup gear open this page)
import { STREAKSYNC_CONFIG } from './config.js';

location.replace(`${STREAKSYNC_CONFIG.WEBSITE_URL}/settings/`);
