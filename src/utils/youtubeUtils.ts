/**
 * Utility functions for YouTube video extraction, metadata fetching, and duration resolution.
 */

export interface YoutubeVideoMetadata {
  videoId: string;
  playlistId?: string;
  title: string;
  channel: string;
  durationSeconds: number;
  durationMinutes: number;
  thumbnail: string;
  thumbnailFallback: string;
  description?: string;
  isPlaylist?: boolean;
  playlistVideos?: any[];
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
 * Extracts standard YouTube playlist ID (34-character list parameter) from various URL formats.
 */
export const extractYoutubePlaylistId = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();

  // If user pasted a whole string containing a YouTube link
  const urlMatch = cleanUrl.match(/https?:\/\/[^\s"'<>]+/);
  const target = urlMatch ? urlMatch[0] : cleanUrl;

  const listMatch = target.match(/[&?]list=([^&]+)/);
  if (listMatch && listMatch[1]) {
    return listMatch[1];
  }

  const playlistMatch = target.match(/youtube\.com\/playlist\?list=([^&]+)/);
  if (playlistMatch && playlistMatch[1]) {
    return playlistMatch[1];
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
 * Helper to parse time string like "12:34" or "1:02:15" into total seconds.
 */
export const parseSimpleTextDurationToSeconds = (timeStr: string): number => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':').map((p) => parseInt(p, 10));
  if (parts.some((p) => isNaN(p))) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return 0;
};

/**
 * Automatically fetch YouTube video metadata:
 * - Title
 * - Channel / Creator
 * - Duration (seconds & minutes)
 * - HD Thumbnail (with fallback)
 */
export const fetchYoutubeMetadata = async (urlOrId: string): Promise<YoutubeVideoMetadata | null> => {
  // Check if it is a playlist first
  const playlistId = extractYoutubePlaylistId(urlOrId);
  if (playlistId) {
    let title = '';
    let channel = '';
    let oembedThumb = '';

    try {
      const fetchPromises = [
        fetch(`https://noembed.com/embed?url=https://www.youtube.com/playlist?list=${playlistId}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=${playlistId}&format=json`)
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

    // Fetch the full playlist videos to calculate exact sum of ALL video durations!
    const playlistVideos = await fetchYoutubePlaylistVideos(playlistId);
    let durationSeconds = 0;
    if (playlistVideos && playlistVideos.length > 0) {
      durationSeconds = playlistVideos.reduce((sum, v) => sum + (v.durationSeconds || 0), 0);
      if (!oembedThumb && playlistVideos[0]?.videoId) {
        oembedThumb = getYoutubeThumbnail(playlistVideos[0].videoId, 'maxres');
      }
    }

    if (!durationSeconds || durationSeconds <= 0) {
      durationSeconds = 7200; // default 2 hours fallback
    }

    if (!title) {
      title = `YouTube Playlist (${playlistId})`;
    }
    if (!channel) {
      channel = 'YouTube Creator';
    }

    const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

    return {
      videoId: playlistVideos[0]?.videoId || '',
      playlistId,
      title,
      channel,
      durationSeconds,
      durationMinutes,
      thumbnail: oembedThumb || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=320&q=80',
      thumbnailFallback: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=320&q=80',
      isPlaylist: true,
      playlistVideos,
    };
  }

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

/**
 * Universal helper to parse any duration value into total seconds:
 * - Number: 252 -> 252
 * - Colon string: "4:12" -> 252, "1:02:15" -> 3735
 * - Digit string: "252" -> 252
 * - ISO 8601 string: "PT4M12S" -> 252, "PT1H20M" -> 4800
 * - Text: "4 minutes 12 seconds", "1 hour 20 mins" -> 4800
 */
export const parseAnyDurationToSeconds = (val: any): number => {
  if (val === null || val === undefined) return 0;

  if (typeof val === 'number' && !isNaN(val) && val > 0) {
    return Math.round(val);
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return 0;

    // Colon format: "12:34" or "1:02:15"
    if (trimmed.includes(':')) {
      const sec = parseSimpleTextDurationToSeconds(trimmed);
      if (sec > 0) return sec;
    }

    // Digit string: "252"
    if (/^\d+$/.test(trimmed)) {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num > 0) return num;
    }

    // ISO 8601 format: "PT4M12S" or "PT1H23M45S"
    if (trimmed.startsWith('PT') || (trimmed.includes('M') && trimmed.includes('S'))) {
      const matchH = trimmed.match(/(\d+)H/i);
      const matchM = trimmed.match(/(\d+)M/i);
      const matchS = trimmed.match(/(\d+)S/i);
      const h = matchH ? parseInt(matchH[1], 10) : 0;
      const m = matchM ? parseInt(matchM[1], 10) : 0;
      const s = matchS ? parseInt(matchS[1], 10) : 0;
      const total = h * 3600 + m * 60 + s;
      if (total > 0) return total;
    }

    // Natural text: "4 minutes, 12 seconds" or "1 hour 20 minutes"
    let totalTextSec = 0;
    const hourMatch = trimmed.match(/(\d+)\s*h(?:our)?s?/i);
    const minMatch = trimmed.match(/(\d+)\s*m(?:in(?:ute)?)?s?/i);
    const secMatch = trimmed.match(/(\d+)\s*s(?:ec(?:ond)?)?s?/i);
    if (hourMatch) totalTextSec += parseInt(hourMatch[1], 10) * 3600;
    if (minMatch) totalTextSec += parseInt(minMatch[1], 10) * 60;
    if (secMatch) totalTextSec += parseInt(secMatch[1], 10);
    if (totalTextSec > 0) return totalTextSec;
  }

  return 0;
};

/**
 * Fetch all videos of a YouTube playlist with exact durations using high-availability
 * Piped API instances, direct YouTube HTML scraping via CORS proxies, and Invidious API instances.
 */
export const fetchYoutubePlaylistVideos = async (playlistId: string): Promise<any[]> => {
  if (!playlistId) return [];

  // Function to finalize playlist video items, filling any missing duration with average/heuristics
  const finalizeVideos = (rawList: any[]): any[] => {
    if (!Array.isArray(rawList) || rawList.length === 0) return [];

    const knownDurations = rawList
      .map((v) => v.durationSeconds)
      .filter((d) => typeof d === 'number' && d > 0);

    const avgDuration = knownDurations.length > 0
      ? Math.round(knownDurations.reduce((a, b) => a + b, 0) / knownDurations.length)
      : 300;

    return rawList.map((vid: any, i: number) => {
      let dur = parseAnyDurationToSeconds(vid.durationSeconds || vid.duration || vid.lengthSeconds || vid.length);
      if (dur <= 0 && vid.title) {
        dur = parseDurationFromTitle(vid.title) || 0;
      }
      if (dur <= 0) {
        dur = avgDuration;
      }

      return {
        videoId: vid.videoId || '',
        title: vid.title || `Video ${i + 1}`,
        channel: vid.channel || vid.author || 'YouTube Creator',
        durationSeconds: dur,
        thumbnail: vid.thumbnail || (vid.videoId ? getYoutubeThumbnail(vid.videoId, 'hq') : ''),
        index: i,
      };
    }).filter((v: any) => v.videoId);
  };

  // Strategy 1: Piped API Endpoints
  const pipedInstances = [
    'https://pipedapi.kavin.rocks',
    'https://api.piped.yt',
    'https://pipedapi.privacy.com.de',
    'https://pipedapi.palvelut.me',
    'https://pipedapi.col2370.xyz',
    'https://pipedapi.drgns.space',
  ];

  for (const instance of pipedInstances) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const response = await fetch(`${instance}/playlists/${playlistId}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rawStreams = data.relatedStreams || data.videos || [];
        if (Array.isArray(rawStreams) && rawStreams.length > 0) {
          const list = rawStreams.map((vid: any, i: number) => {
            const vIdMatch = vid.url?.match(/v=([\w-]{11})/);
            const videoId = vIdMatch ? vIdMatch[1] : (vid.videoId || '');
            const rawDur = vid.duration ?? vid.lengthSeconds ?? vid.length ?? vid.durationSeconds;
            const dur = parseAnyDurationToSeconds(rawDur);

            return {
              videoId,
              title: vid.title || `Video ${i + 1}`,
              channel: vid.uploaderName || data.uploader || 'YouTube Creator',
              durationSeconds: dur,
              thumbnail: vid.thumbnail || (videoId ? getYoutubeThumbnail(videoId, 'hq') : ''),
              index: i,
            };
          });

          const finalized = finalizeVideos(list);
          if (finalized.length > 0) return finalized;
        }
      }
    } catch {
      // try next
    }
  }

  // Strategy 2: Direct YouTube HTML Scraping via CORS Proxies
  const proxyUrls = [
    `https://corsproxy.io/?url=https%3A%2F%2Fwww.youtube.com%2Fplaylist%3Flist%3D${playlistId}`,
    `https://api.allorigins.win/raw?url=https%3A%2F%2Fwww.youtube.com%2Fplaylist%3Flist%3D${playlistId}`,
  ];

  for (const proxyUrl of proxyUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const html = await res.text();
        const playlistVideoChunks = html.split('playlistVideoRenderer');
        if (playlistVideoChunks.length > 1) {
          const scrapedVideos: any[] = [];
          playlistVideoChunks.slice(1).forEach((chunk, i) => {
            const videoId = chunk.match(/"videoId"\s*:\s*"([\w-]{11})"/)?.[1];
            if (!videoId) return;

            const title = chunk.match(/"title"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/)?.[1]
              || chunk.match(/"title"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/)?.[1]
              || `Video ${i + 1}`;

            let durationSec = 0;
            const lengthSecMatch = chunk.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
            if (lengthSecMatch) {
              durationSec = parseInt(lengthSecMatch[1], 10);
            }

            if (!durationSec || durationSec <= 0) {
              const simpleTextMatch = chunk.match(/"lengthText"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/);
              if (simpleTextMatch) {
                durationSec = parseAnyDurationToSeconds(simpleTextMatch[1]);
              }
            }

            if (!durationSec || durationSec <= 0) {
              const runsMatch = chunk.match(/"lengthText"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/);
              if (runsMatch) {
                durationSec = parseAnyDurationToSeconds(runsMatch[1]);
              }
            }

            if (!durationSec || durationSec <= 0) {
              const labelMatch = chunk.match(/"label"\s*:\s*"([^"]+)"/);
              if (labelMatch) {
                durationSec = parseAnyDurationToSeconds(labelMatch[1]);
              }
            }

            scrapedVideos.push({
              videoId,
              title,
              channel: 'YouTube Creator',
              durationSeconds: durationSec,
              thumbnail: getYoutubeThumbnail(videoId, 'hq'),
              index: i,
            });
          });

          const finalized = finalizeVideos(scrapedVideos);
          if (finalized.length > 0) return finalized;
        }
      }
    } catch {
      // try next
    }
  }

  // Strategy 3: Invidious API instances
  const invidiousInstances = [
    'https://inv.tux.im',
    'https://yewtu.be',
    'https://invidious.projectsegfau.lt',
    'https://invidious.drgns.space',
    'https://invidious.flokinet.to',
  ];

  for (const instance of invidiousInstances) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${instance}/api/v1/playlists/${playlistId}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.videos)) {
          const list = data.videos.map((vid: any, i: number) => ({
            videoId: vid.videoId,
            title: vid.title,
            channel: vid.author || data.author || 'YouTube Creator',
            durationSeconds: parseAnyDurationToSeconds(vid.lengthSeconds ?? vid.duration ?? vid.length),
            thumbnail: vid.videoThumbnails?.[0]?.url || `https://img.youtube.com/vi/${vid.videoId}/mqdefault.jpg`,
            index: i,
          }));

          const finalized = finalizeVideos(list);
          if (finalized.length > 0) return finalized;
        }
      }
    } catch {
      // try next
    }
  }

  // Strategy 4: RSS-to-JSON online parser fallback
  try {
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.youtube.com%2Ffeeds%2Fvideos.xml%3Fplaylist_id%3D${playlistId}`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.items && Array.isArray(data.items)) {
        const list = data.items.map((item: any, i: number) => {
          const videoIdMatch = item.link?.match(/v=([\w-]{11})/);
          const videoId = videoIdMatch ? videoIdMatch[1] : '';
          const title = item.title || `Video ${i + 1}`;

          return {
            videoId,
            title,
            channel: item.author || 'YouTube Creator',
            durationSeconds: parseDurationFromTitle(title) || 0,
            thumbnail: item.thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            index: i,
          };
        });

        const finalized = finalizeVideos(list);
        if (finalized.length > 0) return finalized;
      }
    }
  } catch {
    // ignore
  }

  return [];
};

