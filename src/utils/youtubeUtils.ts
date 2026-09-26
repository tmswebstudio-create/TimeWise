/**
 * Utility functions for YouTube video extraction, metadata fetching, and duration resolution.
 */

export interface YoutubeVideoMetadata {
  videoId: string;
  title: string;
  channel: string;
  durationSeconds: number;
  durationMinutes: number;
  thumbnail: string;
  thumbnailFallback: string;
  description?: string;
}

/**
 * Extracts standard 11-character YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 * - Or any string containing a YouTube URL
 */
export const extractYoutubeVideoId = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();

  // If user pasted a whole string containing a YouTube link
  const urlMatch = cleanUrl.match(/https?:\/\/[^\s"'<>]+/);
  const target = urlMatch ? urlMatch[0] : cleanUrl;

  // Standard regex matching 11-char ID
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/;
  const match = target.match(regExp);
  if (match && match[1]) {
    return match[1];
  }

  // Handle case where user directly typed/pasted an 11-character video ID
  if (/^[\w-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  return null;
};

/**
 * Get direct YouTube thumbnail URL from video ID
 */
export const getYoutubeThumbnail = (
  videoId: string,
  quality: 'maxres' | 'hq' | 'mq' = 'maxres'
): string => {
  if (quality === 'hq') {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  if (quality === 'mq') {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

/**
 * Parses duration in seconds from title text heuristics
 * E.g., "Master WooCommerce in 5-Hours", "Full Course (10 hours)", "Learn CSS in 45 mins"
 */
export const parseDurationFromTitle = (title: string): number | null => {
  if (!title) return null;

  // Match e.g. "5-Hours", "5 Hours", "2.5 hours", "1 hr 30 min"
  const hrMinMatch = title.match(/(\d+(?:\.\d+)?)\s*(?:-|–|\s)?\s*(?:hours?|hrs?|h)\s*(?:and)?\s*(?:(\d+)\s*(?:mins?|minutes?|m))?/i);
  if (hrMinMatch) {
    const hours = parseFloat(hrMinMatch[1]);
    const mins = hrMinMatch[2] ? parseInt(hrMinMatch[2], 10) : 0;
    if (hours > 0 && hours <= 50) {
      return Math.round(hours * 3600 + mins * 60);
    }
  }

  // Match e.g. "45-Minutes", "30 mins", "20 min"
  const minMatch = title.match(/(\d+)\s*(?:-|–|\s)?\s*(?:minutes?|mins?)\b/i);
  if (minMatch) {
    const mins = parseInt(minMatch[1], 10);
    if (mins > 0 && mins <= 600) {
      return mins * 60;
    }
  }

  return null;
};

/**
 * Loads YouTube IFrame API script onto window if not already present
 */
let ytIframeApiPromise: Promise<void> | null = null;
const loadYoutubeIframeApi = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.reject('No window');
  const w = window as any;

  if (w.YT && w.YT.Player) {
    return Promise.resolve();
  }

  if (ytIframeApiPromise) {
    return ytIframeApiPromise;
  }

  ytIframeApiPromise = new Promise<void>((resolve) => {
    const existingScript = document.getElementById('youtube-iframe-api');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.body.appendChild(tag);
    }

    const prevOnReady = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      if (typeof prevOnReady === 'function') {
        try {
          prevOnReady();
        } catch {
          // ignore
        }
      }
      resolve();
    };

    // Timeout safety in case script is blocked or delayed
    setTimeout(() => {
      resolve();
    }, 3500);
  });

  return ytIframeApiPromise;
};

/**
 * Attempt to determine YouTube video duration in seconds using temporary offscreen YT.Player
 */
export const fetchYoutubeDuration = (videoId: string): Promise<number> => {
  return new Promise(async (resolve) => {
    if (typeof window === 'undefined') {
      return resolve(0);
    }

    let settled = false;
    let tempContainer: HTMLDivElement | null = null;
    let playerInstance: any = null;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      try {
        if (playerInstance && typeof playerInstance.destroy === 'function') {
          playerInstance.destroy();
        }
      } catch {
        // ignore
      }
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
      tempContainer = null;
      playerInstance = null;
    };

    // Safety timeout: resolve 0 after 3.5 seconds
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve(0);
    }, 3500);

    try {
      await loadYoutubeIframeApi();
      const w = window as any;

      if (!w.YT || !w.YT.Player) {
        clearTimeout(timeoutId);
        cleanup();
        return resolve(0);
      }

      tempContainer = document.createElement('div');
      tempContainer.id = `yt-dur-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      // Position offscreen with valid non-zero dimensions to avoid browser throttling
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '240px';
      tempContainer.style.height = '180px';
      tempContainer.style.pointerEvents = 'none';
      document.body.appendChild(tempContainer);

      const handleFound = (dur: number) => {
        if (dur && dur > 0) {
          clearTimeout(timeoutId);
          cleanup();
          resolve(Math.round(dur));
        }
      };

      playerInstance = new w.YT.Player(tempContainer.id, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            try {
              const dur = event.target.getDuration();
              if (dur > 0) {
                handleFound(dur);
                return;
              }
            } catch {
              // ignore
            }

            // Retry after brief interval
            setTimeout(() => {
              try {
                if (event.target && typeof event.target.getDuration === 'function') {
                  const retryDur = event.target.getDuration();
                  if (retryDur > 0) {
                    handleFound(retryDur);
                  }
                }
              } catch {
                // ignore
              }
            }, 400);
          },
          onError: () => {
            clearTimeout(timeoutId);
            cleanup();
            resolve(0);
          },
        },
      });
    } catch {
      clearTimeout(timeoutId);
      cleanup();
      resolve(0);
    }
  });
};

/**
 * Automatically fetch YouTube video metadata:
 * - Title
 * - Channel / Creator
 * - Duration (seconds & minutes)
 * - HD Thumbnail (with fallback)
 */
export const fetchYoutubeMetadata = async (urlOrId: string): Promise<YoutubeVideoMetadata | null> => {
  const videoId = extractYoutubeVideoId(urlOrId);
  if (!videoId) return null;

  const maxresThumbnail = getYoutubeThumbnail(videoId, 'maxres');
  const hqThumbnail = getYoutubeThumbnail(videoId, 'hq');

  let title = '';
  let channel = '';
  let durationSeconds = 0;
  let oembedThumb = '';

  // 1. Fetch title and creator using both noembed and YouTube oEmbed
  try {
    const fetchPromises = [
      fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ];

    const results = await Promise.all(fetchPromises);
    for (const data of results) {
      if (data) {
        if (!title && data.title) title = data.title;
        if (!channel && data.author_name) channel = data.author_name;
        if (!oembedThumb && data.thumbnail_url) oembedThumb = data.thumbnail_url;
      }
    }
  } catch {
    // ignore
  }

  // 2. Fetch duration via title heuristic parser first (very fast & handles long tutorials)
  if (title) {
    const titleDuration = parseDurationFromTitle(title);
    if (titleDuration && titleDuration > 0) {
      durationSeconds = titleDuration;
    }
  }

  // 3. If duration not in title, fetch duration via YouTube IFrame API
  if (durationSeconds <= 0) {
    try {
      const detectedDuration = await fetchYoutubeDuration(videoId);
      if (detectedDuration > 0) {
        durationSeconds = detectedDuration;
      }
    } catch {
      // ignore
    }
  }

  // Fallback defaults if title or channel was empty
  if (!title) {
    title = `YouTube Video (${videoId})`;
  }
  if (!channel) {
    channel = 'YouTube Creator';
  }
  if (!durationSeconds || durationSeconds <= 0) {
    durationSeconds = 1500; // default 25 minutes
  }

  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

  // Determine primary thumbnail: use oembed thumb or maxres, with hq as guaranteed fallback
  const primaryThumb = oembedThumb || maxresThumbnail;

  return {
    videoId,
    title,
    channel,
    durationSeconds,
    durationMinutes,
    thumbnail: primaryThumb,
    thumbnailFallback: hqThumbnail,
  };
};
