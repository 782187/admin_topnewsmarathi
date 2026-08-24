// Helpers for validating and normalizing Instagram post URLs.

// Returns true if the URL looks like an Instagram post / reel / TV / video permalink.
export const isInstagramUrl = (url) => {
  if (!url) return false;
  return /instagram\.com\/(p|reel|reels|tv)\//i.test(url.trim());
};

// Strip query string / hash and ensure a trailing slash so embed.js gets a clean permalink.
export const normalizeInstagramUrl = (url) => {
  if (!url) return '';
  let clean = url.trim().split('?')[0].split('#')[0];
  if (clean && !clean.endsWith('/')) clean += '/';
  return clean;
};
