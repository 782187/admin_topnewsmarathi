/**
 * Video URL utilities for extracting video IDs and creating embed URLs
 */

/**
 * Extract YouTube video ID from various YouTube URL formats
 * @param {string} url - YouTube URL
 * @returns {object|null} - Object with videoId and startTime, or null if invalid
 */
export const extractYouTubeInfo = (url) => {
  if (!url) return null;

  // YouTube URL patterns
  const patterns = [
    // Standard watch URL with timestamp
    /(?:youtube\.com\/watch\?v=([^&\n?#]+))(?:.*t=(\d+))?/,
    // Short URL with timestamp
    /(?:youtu\.be\/([^?&\n]+))(?:.*\?t=(\d+))?/,
    // Embed URL
    /(?:youtube\.com\/embed\/([^?&\n]+))(?:.*start=(\d+))?/,
    // Watch URL with time parameter
    /(?:youtube\.com\/watch\?.*v=([^&\n]+))(?:.*time_continue=(\d+))?/,
    // Watch URL with hms format (1h2m3s)
    /(?:youtube\.com\/watch\?v=([^&\n?#]+))(?:.*t=(\d+h)?(\d+m)?(\d+s))?/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      let videoId = match[1];
      let startTime = 0;

      // Handle different timestamp formats
      if (match[2]) {
        // Direct seconds or timestamp parameter
        startTime = parseInt(match[2]);
      } else if (match[3] || match[4] || match[5]) {
        // HMS format (1h2m3s)
        const hours = match[3] ? parseInt(match[3].replace('h', '')) : 0;
        const minutes = match[4] ? parseInt(match[4].replace('m', '')) : 0;
        const seconds = match[5] ? parseInt(match[5].replace('s', '')) : 0;
        startTime = hours * 3600 + minutes * 60 + seconds;
      }

      return { videoId, startTime };
    }
  }

  return null;
};

/**
 * Convert YouTube URL to embed URL with start time
 * @param {string} url - Original YouTube URL
 * @returns {string|null} - Embed URL or null if invalid
 */
export const convertToEmbedUrl = (url) => {
  const youtubeInfo = extractYouTubeInfo(url);
  
  if (!youtubeInfo) {
    return null;
  }

  const { videoId, startTime } = youtubeInfo;
  let embedUrl = `https://www.youtube.com/embed/${videoId}`;
  
  // Add start time if specified
  if (startTime > 0) {
    embedUrl += `?start=${startTime}`;
  }
  
  return embedUrl;
};

/**
 * Check if URL is a YouTube URL
 * @param {string} url - URL to check
 * @returns {boolean} - True if YouTube URL
 */
export const isYouTubeUrl = (url) => {
  if (!url) return false;
  const youtubePatterns = [
    /youtube\.com\/watch/,
    /youtu\.be/,
    /youtube\.com\/embed/
  ];
  
  return youtubePatterns.some(pattern => pattern.test(url));
};

/**
 * Get video platform from URL
 * @param {string} url - Video URL
 * @returns {string} - Platform name ('youtube', 'vimeo', 'other')
 */
export const getVideoPlatform = (url) => {
  if (!url) return 'other';
  
  if (isYouTubeUrl(url)) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  
  return 'other';
};
