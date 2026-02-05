import Database from 'better-sqlite3';
import { BrowserHistoryEntry } from './types';

export function cleanContent(text: string): string {
  return text
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/Copyright.*$/i, '') // common footer noise
    .replace(/All rights reserved.*$/i, '') // more footer noise
    .replace(/subscribe to our newsletter.*/i, '') // newsletter prompts
    .replace(/follow us on.*$/i, '') // social prompts
    .replace(/sign up to read more.*/i, '') // paywall prompts
    .trim();
}

export function trimForProcessing(text: string): string {
  const MAX_LEN = 20000;
  if (text.length <= MAX_LEN) return text;
  return text.slice(0, MAX_LEN);
}

export const findByCanonicalUrl = async (
  dbInstance: Database.Database,
  canonicalUrl: string,
  profileId: string
): Promise<any> => {
  return dbInstance
    .prepare(
      `
      SELECT id, created_at, save_type
      FROM memories
      WHERE user_id = ? AND canonical_url = ?
      ORDER BY created_at DESC
      LIMIT 1
    `
    )
    .get(profileId, canonicalUrl);
};

export function timeAgo(from: Date | number | string): string {
  const now = Date.now();
  const past = new Date(from).getTime();
  const diff = Math.max(0, now - past);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;

  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.floor(diff / minute)} minutes ago`;
  if (diff < day) return `${Math.floor(diff / hour)} hours ago`;
  if (diff < week) return `${Math.floor(diff / day)} days ago`;
  if (diff < month) return `${Math.floor(diff / week)} weeks ago`;
  return `${Math.floor(diff / month)} months ago`;
}

export function canonicalizeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.hostname = url.hostname.replace(/^www\./, '').toLowerCase();
    url.hash = '';

    const params = new URLSearchParams(url.search);
    const allowed = new URLSearchParams();
    for (const [k, v] of params.entries()) {
      if (!k.startsWith('utm_') && k !== 'ref') {
        allowed.append(k, v);
      }
    }

    url.search = allowed.toString()
      ? '?' +
        [...allowed.entries()]
          .sort()
          .map(([k, v]) => `${k}=${v}`)
          .join('&')
      : '';

    url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString();
  } catch {
    return raw;
  }
}

const BLOCKED_DOMAINS = [
  // Social Media
  'twitter.com',
  'x.com',
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'reddit.com',
  'tiktok.com',
  'snapchat.com',
  'pinterest.com',

  // Video Platforms
  'youtube.com',
  'youtu.be',
  'twitch.tv',
  'vimeo.com',

  // Email & Communication
  'mail.google.com',
  'outlook.live.com',
  'outlook.office.com',
  'yahoo.com/mail',
  'slack.com',
  'discord.com',
  'teams.microsoft.com',
  'zoom.us',

  // Cloud Storage
  'drive.google.com',
  'dropbox.com',
  'onedrive.live.com',
  'docs.google.com', // Google Docs

  // Dev Package Managers
  'npmjs.com',
  'npm.io',
  'cdnjs.com',
  'unpkg.com',
  'jsdelivr.net',

  // Icon Libraries
  'lucide.dev',
  'fontawesome.com',
  'heroicons.com',
  'flaticon.com',

  // Search Engines (results pages)
  'google.com/search',
  'bing.com/search',
  'duckduckgo.com/',

  // Analytics
  'analytics.google.com',

  // Version Control
  'github.com',
  'gitlab.com',
  'bitbucket.org'
];

const BLOCKED_URL_PATTERNS = [
  // Auth flows
  /\/(login|signin|sign-in|signup|sign-up|register|auth|oauth|sso|callback|logout)/i,

  // API endpoints
  /\/api\//i,
  /\/graphql/i,

  // Documentation patterns (official docs)
  /\/docs?\//i,
  /\/documentation\//i,
  /\/guide/i,
  /\/guides\//i,
  /\/reference/i,
  /\/getting-started/i,
  /\/quickstart/i,
  /readthedocs\.io/i,

  // File downloads
  /\.(pdf|zip|rar|tar|gz|exe|dmg|pkg|deb|rpm)$/i,

  // Media files
  /\.(jpg|jpeg|png|gif|svg|webp|mp4|mp3|wav|avi|mov)$/i,

  // Development
  /localhost/i,
  /127\.0\.0\.1/i,
  /192\.168\./i,
  /\.local/i,
  /^file:\/\//i,

  // Query params indicating redirects
  /[?&](redirect|return|returnUrl|next|continue|callback)=/i
];

export function applyBlocklist(entries: BrowserHistoryEntry[]): BrowserHistoryEntry[] {
  return entries.filter((entry) => {
    const url = entry.url.toLowerCase();

    // Check blocked domains
    const isDomainBlocked = BLOCKED_DOMAINS.some((domain) => url.includes(domain));
    if (isDomainBlocked) return false;

    // Check blocked patterns
    const isPatternBlocked = BLOCKED_URL_PATTERNS.some((pattern) => pattern.test(entry.url));
    if (isPatternBlocked) return false;

    return true;
  });
}
