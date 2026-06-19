const PLATFORMS = {
  youtube: {
    name: 'YouTube',
    icon: 'fa-brands fa-youtube',
    color: '#FF0000',
    patterns: [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)/i,
    ],
  },
  instagram: {
    name: 'Instagram',
    icon: 'fa-brands fa-instagram',
    color: '#E4405F',
    patterns: [
      /instagram\.com\/(?:p|reel|stories|tv)\//i,
    ],
  },
  facebook: {
    name: 'Facebook',
    icon: 'fa-brands fa-facebook',
    color: '#1877F2',
    patterns: [
      /(?:facebook\.com|fb\.watch|fb\.com)/i,
    ],
  },
  tiktok: {
    name: 'TikTok',
    icon: 'fa-brands fa-tiktok',
    color: '#000000',
    patterns: [
      /tiktok\.com\/@/i,
    ],
  },
  twitter: {
    name: 'X / Twitter',
    icon: 'fa-brands fa-x-twitter',
    color: '#333333',
    patterns: [
      /(?:twitter\.com|x\.com)\/\w+\/status/i,
    ],
  },
  vimeo: {
    name: 'Vimeo',
    icon: 'fa-brands fa-vimeo-v',
    color: '#1AB7EA',
    patterns: [
      /vimeo\.com\/\d+/i,
    ],
  },
  dailymotion: {
    name: 'Dailymotion',
    icon: 'fa-solid fa-play',
    color: '#0066DC',
    patterns: [
      /dailymotion\.com\/video/i,
    ],
  },
  reddit: {
    name: 'Reddit',
    icon: 'fa-brands fa-reddit-alien',
    color: '#FF4500',
    patterns: [
      /reddit\.com\/r\/\w+\/comments/i,
    ],
  },
  twitch: {
    name: 'Twitch',
    icon: 'fa-brands fa-twitch',
    color: '#9146FF',
    patterns: [
      /twitch\.tv\/videos/i,
    ],
  },
  soundcloud: {
    name: 'SoundCloud',
    icon: 'fa-brands fa-soundcloud',
    color: '#FF5500',
    patterns: [
      /soundcloud\.com/i,
    ],
  },
  pinterest: {
    name: 'Pinterest',
    icon: 'fa-brands fa-pinterest',
    color: '#BD081C',
    patterns: [
      /pinterest\.com\/pin/i,
    ],
  },
  bilibili: {
    name: 'Bilibili',
    icon: 'fa-solid fa-tv',
    color: '#00A1D6',
    patterns: [
      /bilibili\.com\/video/i,
    ],
  },
  snapchat: {
    name: 'Snapchat',
    icon: 'fa-brands fa-snapchat',
    color: '#FFFC00',
    patterns: [
      /snapchat\.com\/\w/i,
    ],
  },
  likee: {
    name: 'Likee',
    icon: 'fa-solid fa-video',
    color: '#FF2D55',
    patterns: [
      /likee\.video/i,
    ],
  },
};

export function detectPlatform(url) {
  if (!url) return null;
  for (const [id, platform] of Object.entries(PLATFORMS)) {
    for (const pattern of platform.patterns) {
      if (pattern.test(url)) return { id, ...platform };
    }
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
