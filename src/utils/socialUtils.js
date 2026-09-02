// Helpers for validating and normalizing social post URLs used as article embeds.
// Shared shape between the admin form (input + preview) and the user article page.

const PATTERNS = {
  instagram: /instagram\.com\/(p|reel|reels|tv)\//i,
  twitter: /(twitter\.com|x\.com)\/[^/]+\/status(?:es)?\/\d+/i,
  facebook: /(facebook\.com\/[^/]+\/(posts|videos|photos)\/|facebook\.com\/(permalink\.php|watch|share|story\.php)|fb\.watch\/)/i,
};

export const PLATFORMS = ['instagram', 'twitter', 'facebook'];

// Returns 'instagram' | 'twitter' | 'facebook' | null.
export const detectPlatform = (url) => {
  if (!url) return null;
  const trimmed = url.trim();
  for (const platform of PLATFORMS) {
    if (PATTERNS[platform].test(trimmed)) return platform;
  }
  return null;
};

// True if the URL looks like an embeddable post on any supported platform.
export const isSocialUrl = (url) => detectPlatform(url) !== null;

// True only if the URL matches the given platform — used to validate each field separately.
export const isPlatformUrl = (platform, url) => detectPlatform(url) === platform;

// Clean the permalink so each platform's embed renderer gets what it expects.
export const normalizeSocialUrl = (url) => {
  if (!url) return '';
  const platform = detectPlatform(url);
  let clean = url.trim().split('#')[0];

  // Facebook keeps its identifier IN the query string
  // (permalink.php?story_fbid=...&id=..., /watch/?v=...) so it must survive.
  if (platform !== 'facebook') clean = clean.split('?')[0];

  // embed.js is picky about the trailing slash on Instagram permalinks.
  if (platform === 'instagram' && !clean.endsWith('/')) clean += '/';

  return clean;
};
