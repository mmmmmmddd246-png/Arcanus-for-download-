// ──────────────────────────────────────────────
// Platform Detector
// ──────────────────────────────────────────────
const PLATFORMS = {
  youtube:     { name: 'YouTube',     icon: 'fa-brands fa-youtube',      color: '#FF0000' },
  instagram:   { name: 'Instagram',   icon: 'fa-brands fa-instagram',    color: '#E4405F' },
  facebook:    { name: 'Facebook',    icon: 'fa-brands fa-facebook',     color: '#1877F2' },
  tiktok:      { name: 'TikTok',      icon: 'fa-brands fa-tiktok',       color: '#000000' },
  twitter:     { name: 'X / Twitter', icon: 'fa-brands fa-x-twitter',    color: '#333333' },
  vimeo:       { name: 'Vimeo',       icon: 'fa-brands fa-vimeo-v',      color: '#1AB7EA' },
  dailymotion: { name: 'Dailymotion', icon: 'fa-solid fa-play',          color: '#0066DC' },
  reddit:      { name: 'Reddit',      icon: 'fa-brands fa-reddit-alien', color: '#FF4500' },
  twitch:      { name: 'Twitch',      icon: 'fa-brands fa-twitch',       color: '#9146FF' },
  soundcloud:  { name: 'SoundCloud',  icon: 'fa-brands fa-soundcloud',   color: '#FF5500' },
  pinterest:   { name: 'Pinterest',   icon: 'fa-brands fa-pinterest',    color: '#BD081C' },
  bilibili:    { name: 'Bilibili',    icon: 'fa-solid fa-tv',            color: '#00A1D6' },
  snapchat:    { name: 'Snapchat',    icon: 'fa-brands fa-snapchat',     color: '#FFFC00' },
};

const PATTERNS = [
  { id: 'youtube',     pattern: /(?:youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts|youtube\.com\/embed)/i },
  { id: 'instagram',   pattern: /instagram\.com\/(?:p|reel|stories|tv)\//i },
  { id: 'facebook',    pattern: /(?:facebook\.com|fb\.watch|fb\.com)/i },
  { id: 'tiktok',      pattern: /tiktok\.com\/@/i },
  { id: 'twitter',     pattern: /(?:twitter\.com|x\.com)\/\w+\/status/i },
  { id: 'vimeo',       pattern: /vimeo\.com\/\d+/i },
  { id: 'dailymotion', pattern: /dailymotion\.com\/video/i },
  { id: 'reddit',      pattern: /reddit\.com\/r\/\w+\/comments/i },
  { id: 'twitch',      pattern: /twitch\.tv/i },
  { id: 'soundcloud',  pattern: /soundcloud\.com/i },
  { id: 'pinterest',   pattern: /pinterest\.com\/pin/i },
  { id: 'bilibili',    pattern: /bilibili\.com\/video/i },
  { id: 'snapchat',    pattern: /snapchat\.com/i },
];

export function detectPlatform(url) {
  if (!url) return null;
  for (const { id, pattern } of PATTERNS) {
    if (pattern.test(url)) return { id, ...PLATFORMS[id] };
  }
  return null;
}

export function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getAllPlatforms() {
  return Object.entries(PLATFORMS).map(([id, data]) => ({ id, ...data }));
}
