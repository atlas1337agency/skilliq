import { Course, Video } from '../data/courses';

// YouTube API Key management
export const getYouTubeApiKey = (): string => {
  try {
    const customKey = localStorage.getItem('custom_youtube_api_key');
    if (customKey && customKey.trim()) {
      return customKey.trim();
    }
  } catch (e) {
    // localStorage may be unavailable in some sandboxes
  }

  // @ts-ignore
  const envKey = import.meta.env?.VITE_YOUTUBE_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim();
  }

  return '';
};

export const setCustomYouTubeApiKey = (key: string): void => {
  try {
    if (!key || !key.trim()) {
      localStorage.removeItem('custom_youtube_api_key');
    } else {
      localStorage.setItem('custom_youtube_api_key', key.trim());
    }
  } catch (e) {
    console.error('Failed to save YouTube API key to localStorage', e);
  }
};

export const removeCustomYouTubeApiKey = (): void => {
  try {
    localStorage.removeItem('custom_youtube_api_key');
  } catch (e) {}
};

// Format number into compact form (e.g. 1.2M, 45.3K, 920)
export const formatCompactNumber = (n?: number, fallbackText?: string): string => {
  if (fallbackText && (!n || n <= 0)) return fallbackText;
  if (!n || isNaN(n) || n <= 0) return '0';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return n.toLocaleString('en-US');
};

export const formatFullNumber = (n?: number): string => {
  if (!n || isNaN(n) || n <= 0) return '0';
  return n.toLocaleString('en-US');
};

// Format duration from PT1H2M10S to HH:MM:SS
const formatDuration = (isoDuration: string) => {
  if (!isoDuration) return '00:00';
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '00:00';

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  let formatted = '';
  if (hours > 0) formatted += `${hours}:`;
  formatted += `${hours > 0 && minutes < 10 ? '0' : ''}${minutes}:`;
  formatted += `${seconds < 10 ? '0' : ''}${seconds}`;
  return formatted;
};

export interface PlaylistSyncResponse {
  playlistId: string;
  playlistTitle?: string;
  playlistDescription?: string;
  videos: Video[];
  channelId?: string;
  channelName?: string;
  channelAvatar?: string;
  channelUrl?: string;
  subscriberCount?: number;
  subscriberCountText?: string;
  totalViews?: number;
  totalLikes?: number;
  totalComments?: number;
  syncedAt: number;
}

export const fetchPlaylistFullData = async (
  playlistId: string,
  customApiKey?: string
): Promise<PlaylistSyncResponse> => {
  const API_KEY = (customApiKey && customApiKey.trim()) || getYouTubeApiKey();

  // 1. Try backend smart endpoint first (/api/youtube/playlist) which uses API key if available OR keyless scraping
  try {
    const backendUrl = `/api/youtube/playlist?id=${encodeURIComponent(playlistId)}${
      API_KEY ? `&key=${encodeURIComponent(API_KEY)}` : ''
    }`;
    const res = await fetch(backendUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.videos) && data.videos.length > 0) {
        return {
          playlistId,
          playlistTitle: data.playlistTitle || '',
          playlistDescription: data.playlistDescription || '',
          videos: data.videos,
          channelId: data.channelId || '',
          channelName: data.channelName || '',
          channelAvatar: data.channelAvatar || '',
          channelUrl: data.channelUrl || '',
          subscriberCount: data.subscriberCount || 0,
          subscriberCountText: data.subscriberCountText || '',
          totalViews: data.totalViews || 0,
          totalLikes: data.totalLikes || 0,
          totalComments: data.totalComments || 0,
          syncedAt: data.syncedAt || Date.now(),
        };
      }
    }
  } catch (backendErr) {
    console.warn('Backend /api/youtube/playlist warning, trying direct client fallback:', backendErr);
  }

  // 2. Direct client YouTube Data API v3 call if API_KEY is provided
  if (API_KEY) {
    try {
      let allItems: any[] = [];
      let nextPageToken = '';

      do {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${API_KEY}${
          nextPageToken ? `&pageToken=${nextPageToken}` : ''
        }`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
          throw new Error(data.error.message || 'Failed to fetch playlist items');
        }
        if (!data.items || data.items.length === 0) break;

        allItems = allItems.concat(data.items);
        nextPageToken = data.nextPageToken || '';
      } while (nextPageToken);

      const videos: Video[] = [];
      const chunks: any[][] = [];
      for (let i = 0; i < allItems.length; i += 50) {
        chunks.push(allItems.slice(i, i + 50));
      }

      let channelId =
        allItems[0]?.snippet?.videoOwnerChannelId || allItems[0]?.snippet?.channelId || '';
      let channelName =
        allItems[0]?.snippet?.videoOwnerChannelTitle || allItems[0]?.snippet?.channelTitle || '';

      for (const chunk of chunks) {
        const videoIds = chunk
          .map((item: any) => item.snippet?.resourceId?.videoId || item.contentDetails?.videoId)
          .filter(Boolean)
          .join(',');
        if (!videoIds) continue;

        const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${videoIds}&key=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
          throw new Error(`Failed to fetch video durations & statistics: ${data.error.message}`);
        }

        const detailsMap: Record<
          string,
          { duration: string; viewCount: number; likeCount: number; commentCount: number; publishedAt: string }
        > = {};
        if (data.items) {
          for (const item of data.items) {
            detailsMap[item.id] = {
              duration: formatDuration(item.contentDetails?.duration),
              viewCount: parseInt(item.statistics?.viewCount || '0', 10) || 0,
              likeCount: parseInt(item.statistics?.likeCount || '0', 10) || 0,
              commentCount: parseInt(item.statistics?.commentCount || '0', 10) || 0,
              publishedAt: item.snippet?.publishedAt || '',
            };
          }
        }

        for (const item of chunk) {
          const vId = item.snippet?.resourceId?.videoId || item.contentDetails?.videoId;
          const isPrivateOrDeleted =
            item.snippet?.title === 'Private video' || item.snippet?.title === 'Deleted video';

          if (vId && !isPrivateOrDeleted) {
            const det = detailsMap[vId];
            videos.push({
              id: `v_${vId}`,
              title: item.snippet?.title || 'Unknown Title',
              youtubeId: vId,
              duration: det?.duration || '00:00',
              viewCount: det?.viewCount || 0,
              likeCount: det?.likeCount || 0,
              commentCount: det?.commentCount || 0,
              publishedAt: det?.publishedAt || '',
              language: '',
              description: item.snippet?.description ? String(item.snippet.description).slice(0, 500) : '',
              resources: [],
            });
          }
        }
      }

      let channelAvatar = '';
      let channelUrl = '';
      let subscriberCount = 0;
      let subscriberCountText = '';

      if (channelId) {
        channelUrl = `https://www.youtube.com/channel/${channelId}?sub_confirmation=1`;
        try {
          const cUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`;
          const cRes = await fetch(cUrl);
          const cData = await cRes.json();
          if (cData.items && cData.items.length > 0) {
            const cItem = cData.items[0];
            channelName = cItem.snippet?.title || channelName;
            channelAvatar =
              cItem.snippet?.thumbnails?.high?.url || cItem.snippet?.thumbnails?.default?.url || '';
            subscriberCount = parseInt(cItem.statistics?.subscriberCount || '0', 10) || 0;
            subscriberCountText = formatCompactNumber(subscriberCount);
          }
        } catch {}
      }

      const totalViews = videos.reduce((acc, v) => acc + (v.viewCount || 0), 0);
      const totalLikes = videos.reduce((acc, v) => acc + (v.likeCount || 0), 0);
      const totalComments = videos.reduce((acc, v) => acc + (v.commentCount || 0), 0);

      if (videos.length > 0) {
        return {
          playlistId,
          videos,
          channelId,
          channelName,
          channelAvatar,
          channelUrl,
          subscriberCount,
          subscriberCountText,
          totalViews,
          totalLikes,
          totalComments,
          syncedAt: Date.now(),
        };
      }
    } catch (clientErr) {
      console.warn('Direct client YouTube playlist fetch warning:', clientErr);
    }
  }

  throw new Error('Failed to fetch playlist videos. Please make sure the playlist URL is public.');
};

export const fetchPlaylistVideos = async (playlistId: string, customApiKey?: string) => {
  const fullData = await fetchPlaylistFullData(playlistId, customApiKey);
  return fullData.videos;
};

export const fetchVideoDetails = async (youtubeId: string, customApiKey?: string) => {
  const meta = await fetchFullYoutubeVideoMetadata(youtubeId, customApiKey);
  if (!meta) return null;
  return {
    title: meta.videoTitle || 'Unknown Title',
    duration: meta.videoDuration || '00:00',
    description: meta.description || '',
    viewCount: meta.viewCount || 0,
    likeCount: meta.likeCount || 0,
    commentCount: meta.commentCount || 0,
  };
};

export const extractPlaylistId = (input: string) => {
  if (!input) return null;
  input = input.trim();
  const match = input.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  if (/^(PL|UU|FL|RD|OL)[a-zA-Z0-9_-]{10,}$/.test(input)) return input;
  return null;
};

export const fetchChannelDetailsFromVideoOrPlaylist = async (
  id: string,
  isPlaylist: boolean,
  customApiKey?: string
) => {
  const API_KEY = (customApiKey && customApiKey.trim()) || getYouTubeApiKey();

  if (!isPlaylist) {
    const meta = await fetchFullYoutubeVideoMetadata(id, API_KEY);
    if (meta && meta.youtubeName) {
      return {
        instructorName: meta.youtubeName,
        instructorAvatar: meta.youtubeAvatar,
        instructorUrl: meta.youtubeChannelUrl,
        channelId: meta.channelId || '',
        subscriberCount: meta.subscriberCount || 0,
        subscriberCountText: meta.subscriberCountText || '',
      };
    }
  }

  if (!API_KEY) return null;

  try {
    let channelId = null;

    if (isPlaylist) {
      const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${id}&key=${API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        channelId = data.items[0].snippet?.channelId;
      }
    } else {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        channelId = data.items[0].snippet?.channelId;
      }
    }

    if (!channelId) return null;

    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`;
    const channelRes = await fetch(channelUrl);
    const channelData = await channelRes.json();

    if (channelData.items && channelData.items.length > 0) {
      const item = channelData.items[0];
      const channel = item.snippet;
      const subscriberCount = parseInt(item.statistics?.subscriberCount || '0', 10) || 0;
      return {
        instructorName: channel?.title || 'Unknown Instructor',
        instructorAvatar: channel?.thumbnails?.high?.url || channel?.thumbnails?.default?.url || '',
        instructorUrl: `https://www.youtube.com/channel/${channelId}?sub_confirmation=1`,
        channelId,
        subscriberCount,
        subscriberCountText: formatCompactNumber(subscriberCount),
      };
    }
  } catch (err) {
    console.error(err);
  }
  return null;
};

export const extractYoutubeVideoId = (input: string): string => {
  if (!input) return '';
  const str = input.trim();
  const regExp =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = str.match(regExp);
  if (match && match[1]) return match[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
  return '';
};

export interface YoutubeFullMetadata {
  youtubeId: string;
  videoTitle: string;
  videoDuration: string;
  videoThumbnail: string;
  youtubeName: string;
  youtubeAvatar: string;
  youtubeChannelUrl: string;
  channelId?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  subscriberCount?: number;
  subscriberCountText?: string;
  description: string;
}

export const fetchFullYoutubeVideoMetadata = async (
  urlOrId: string,
  customApiKey?: string
): Promise<YoutubeFullMetadata | null> => {
  const youtubeId = extractYoutubeVideoId(urlOrId);
  if (!youtubeId) return null;

  const API_KEY = (customApiKey && customApiKey.trim()) || getYouTubeApiKey();

  // 1. Try server-side smart endpoint (/api/youtube/video-info) which supports both API key & keyless extraction
  try {
    const apiUrl = `/api/youtube/video-info?id=${encodeURIComponent(youtubeId)}${
      API_KEY ? `&key=${encodeURIComponent(API_KEY)}` : ''
    }`;
    const res = await fetch(apiUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.youtubeId) {
        return {
          youtubeId: data.youtubeId,
          videoTitle: data.videoTitle || '',
          videoDuration: data.videoDuration || '15:00',
          videoThumbnail:
            data.videoThumbnail || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
          youtubeName: data.youtubeName || 'YouTube Creator',
          youtubeAvatar:
            data.youtubeAvatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              data.youtubeName || 'YT'
            )}&background=ef4444&color=fff&bold=true`,
          youtubeChannelUrl: data.youtubeChannelUrl || `https://www.youtube.com/watch?v=${youtubeId}`,
          channelId: data.channelId || '',
          viewCount: data.viewCount || 0,
          likeCount: data.likeCount || 0,
          commentCount: data.commentCount || 0,
          subscriberCount: data.subscriberCount || 0,
          subscriberCountText: data.subscriberCountText || '',
          description: data.description || '',
        };
      }
    }
  } catch (err) {
    console.warn('Backend /api/youtube/video-info warning, trying client fallback:', err);
  }

  // 2. Client-side noembed / oEmbed fallback
  try {
    const noembedRes = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${youtubeId}`
    );
    if (noembedRes.ok) {
      const oData = await noembedRes.json();
      const name = oData.author_name || 'YouTube Creator';
      return {
        youtubeId,
        videoTitle: oData.title || '',
        videoDuration: '15:00',
        videoThumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
        youtubeName: name,
        youtubeAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          name
        )}&background=ef4444&color=fff&bold=true`,
        youtubeChannelUrl: oData.author_url || `https://www.youtube.com/watch?v=${youtubeId}`,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        subscriberCount: 0,
        subscriberCountText: '',
        description: '',
      };
    }
  } catch (e) {}

  return {
    youtubeId,
    videoTitle: '',
    videoDuration: '15:00',
    videoThumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
    youtubeName: 'YouTube Creator',
    youtubeAvatar: `https://ui-avatars.com/api/?name=YT&background=ef4444&color=fff&bold=true`,
    youtubeChannelUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    subscriberCount: 0,
    subscriberCountText: '',
    description: '',
  };
};

/**
 * Live Sync Engine for a Course or Playlist:
 * 1. If the course has a `playlistId`, fetches the latest playlist videos from YouTube,
 *    automatically appends any NEW videos the original creator added to the playlist,
 *    and updates real views, likes, comments, and channel subscriber counts.
 * 2. Syncs the currently active video's real-time views, likes, comments, and creator subscribers.
 */
export const syncCourseRealtimeWithYouTube = async (
  course: Course,
  activeYoutubeId?: string
): Promise<{
  updatedCourse: Course;
  hasChanges: boolean;
  newVideosAddedCount: number;
  activeVideoStats?: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    subscriberCount: number;
    subscriberCountText: string;
  };
}> => {
  let hasChanges = false;
  let newVideosAddedCount = 0;
  let updatedVideos = [...(course.videos || [])];
  let subscriberCount = course.subscriberCount || 0;
  let subscriberCountText = course.subscriberCountText || '';
  let channelId = course.channelId || '';
  let instructorAvatar = course.instructorAvatar || '';
  let instructorUrl = course.instructorUrl || '';

  // Step 1: If course has a playlistId, check for newly added videos by original creator & updated playlist stats
  if (course.playlistId && !course.isSingleVideo) {
    try {
      const plData = await fetchPlaylistFullData(course.playlistId);
      if (plData && Array.isArray(plData.videos) && plData.videos.length > 0) {
        const existingByYtId = new Map<string, Video>();
        updatedVideos.forEach((v) => {
          if (v.youtubeId) existingByYtId.set(v.youtubeId.trim(), v);
        });

        const mergedList: Video[] = [];
        // Keep existing videos in order and update their live stats if available
        const liveByYtId = new Map<string, Video>();
        plData.videos.forEach((lv) => {
          if (lv.youtubeId) liveByYtId.set(lv.youtubeId.trim(), lv);
        });

        for (const existingVid of updatedVideos) {
          const liveMatch = existingVid.youtubeId ? liveByYtId.get(existingVid.youtubeId.trim()) : undefined;
          if (liveMatch) {
            const nextView = liveMatch.viewCount || existingVid.viewCount || 0;
            const nextLike = liveMatch.likeCount || existingVid.likeCount || 0;
            const nextComment = liveMatch.commentCount || existingVid.commentCount || 0;
            if (
              nextView !== (existingVid.viewCount || 0) ||
              nextLike !== (existingVid.likeCount || 0) ||
              nextComment !== (existingVid.commentCount || 0)
            ) {
              hasChanges = true;
            }
            mergedList.push({
              ...existingVid,
              duration:
                existingVid.duration && existingVid.duration !== '00:00'
                  ? existingVid.duration
                  : liveMatch.duration || '15:00',
              viewCount: nextView,
              likeCount: nextLike,
              commentCount: nextComment,
            });
          } else {
            mergedList.push(existingVid);
          }
        }

        // Detect any brand-new videos added to the YouTube playlist by the original creator!
        for (const liveVid of plData.videos) {
          const cleanId = (liveVid.youtubeId || '').trim();
          if (cleanId && !existingByYtId.has(cleanId)) {
            newVideosAddedCount++;
            hasChanges = true;
            mergedList.push({
              id: `v_${cleanId}`,
              title: liveVid.title || 'New Lesson',
              youtubeId: cleanId,
              duration: liveVid.duration || '15:00',
              viewCount: liveVid.viewCount || 0,
              likeCount: liveVid.likeCount || 0,
              commentCount: liveVid.commentCount || 0,
              language: course.language || '',
              description: liveVid.description || '',
              resources: [],
            });
          }
        }

        updatedVideos = mergedList;

        if (plData.subscriberCount && plData.subscriberCount !== subscriberCount) {
          subscriberCount = plData.subscriberCount;
          subscriberCountText = plData.subscriberCountText || formatCompactNumber(plData.subscriberCount);
          hasChanges = true;
        }
        if (plData.channelId && !channelId) {
          channelId = plData.channelId;
          hasChanges = true;
        }
        if (plData.channelAvatar && !instructorAvatar) {
          instructorAvatar = plData.channelAvatar;
          hasChanges = true;
        }
      }
    } catch (plErr) {
      console.warn('Playlist auto-sync warning:', plErr);
    }
  }

  // Step 2: Sync the active video (or first video) for real-time exact viewCount, likeCount, commentCount & channel subscribers
  const targetVidId =
    (activeYoutubeId && activeYoutubeId.trim()) ||
    updatedVideos[0]?.youtubeId?.trim() ||
    '';

  let activeVideoStats:
    | {
        viewCount: number;
        likeCount: number;
        commentCount: number;
        subscriberCount: number;
        subscriberCountText: string;
      }
    | undefined;

  if (targetVidId) {
    try {
      const liveMeta = await fetchFullYoutubeVideoMetadata(targetVidId);
      if (liveMeta) {
        activeVideoStats = {
          viewCount: liveMeta.viewCount || 0,
          likeCount: liveMeta.likeCount || 0,
          commentCount: liveMeta.commentCount || 0,
          subscriberCount: liveMeta.subscriberCount || subscriberCount || 0,
          subscriberCountText:
            liveMeta.subscriberCountText ||
            subscriberCountText ||
            formatCompactNumber(liveMeta.subscriberCount || subscriberCount),
        };

        if (liveMeta.subscriberCount && liveMeta.subscriberCount !== subscriberCount) {
          subscriberCount = liveMeta.subscriberCount;
          subscriberCountText =
            liveMeta.subscriberCountText || formatCompactNumber(liveMeta.subscriberCount);
          hasChanges = true;
        }
        if (liveMeta.channelId && !channelId) {
          channelId = liveMeta.channelId;
          hasChanges = true;
        }
        if (liveMeta.youtubeAvatar && !instructorAvatar) {
          instructorAvatar = liveMeta.youtubeAvatar;
          hasChanges = true;
        }
        if (liveMeta.youtubeChannelUrl && !instructorUrl) {
          instructorUrl = liveMeta.youtubeChannelUrl;
          hasChanges = true;
        }

        updatedVideos = updatedVideos.map((v) => {
          if (v.youtubeId && v.youtubeId.trim() === targetVidId) {
            const newViews = liveMeta.viewCount || v.viewCount || 0;
            const newLikes = liveMeta.likeCount || v.likeCount || 0;
            const newComments = liveMeta.commentCount || v.commentCount || 0;
            if (
              newViews !== (v.viewCount || 0) ||
              newLikes !== (v.likeCount || 0) ||
              newComments !== (v.commentCount || 0)
            ) {
              hasChanges = true;
            }
            return {
              ...v,
              viewCount: newViews,
              likeCount: newLikes,
              commentCount: newComments,
              duration:
                v.duration && v.duration !== '00:00'
                  ? v.duration
                  : liveMeta.videoDuration || '15:00',
            };
          }
          return v;
        });
      }
    } catch (vErr) {
      console.warn('Video live stats sync warning:', vErr);
    }
  }

  // Compute aggregate course totals
  const totalViews = updatedVideos.reduce((sum, v) => sum + (v.viewCount || 0), 0);
  const totalLikes = updatedVideos.reduce((sum, v) => sum + (v.likeCount || 0), 0);
  const totalComments = updatedVideos.reduce((sum, v) => sum + (v.commentCount || 0), 0);

  if (
    totalViews !== (course.totalViews || 0) ||
    totalLikes !== (course.totalLikes || 0) ||
    totalComments !== (course.totalComments || 0)
  ) {
    hasChanges = true;
  }

  const updatedCourse: Course = {
    ...course,
    videos: updatedVideos,
    channelId: channelId || course.channelId,
    subscriberCount: subscriberCount || course.subscriberCount,
    subscriberCountText:
      subscriberCountText ||
      course.subscriberCountText ||
      (subscriberCount > 0 ? formatCompactNumber(subscriberCount) : undefined),
    instructorAvatar: instructorAvatar || course.instructorAvatar,
    instructorUrl: instructorUrl || course.instructorUrl,
    totalViews,
    totalLikes,
    totalComments,
    lastSyncedAt: Date.now(),
  };

  return {
    updatedCourse,
    hasChanges,
    newVideosAddedCount,
    activeVideoStats,
  };
};

// Track which course IDs have already been live-synced in this browser session
const sessionSyncedCourseIds = new Set<string>();
const LIVE_STATS_CACHE_KEY = 'skilliq_course_live_stats_v2';

export const getCachedCourseStats = (): Record<string, Partial<Course>> => {
  try {
    const raw = localStorage.getItem(LIVE_STATS_CACHE_KEY);
    if (raw) {
      return JSON.parse(raw) || {};
    }
  } catch {}
  return {};
};

export const saveCachedCourseStats = (updates: Record<string, Course>) => {
  try {
    const current = getCachedCourseStats();
    for (const [id, c] of Object.entries(updates)) {
      current[id] = {
        subscriberCount: c.subscriberCount,
        subscriberCountText: c.subscriberCountText,
        instructorAvatar: c.instructorAvatar,
        instructorUrl: c.instructorUrl,
        channelId: c.channelId,
        totalViews: c.totalViews,
        totalLikes: c.totalLikes,
        totalComments: c.totalComments,
        lastSyncedAt: c.lastSyncedAt,
        videos: c.videos,
      };
    }
    localStorage.setItem(LIVE_STATS_CACHE_KEY, JSON.stringify(current));
  } catch {}
};

export const applyCachedStatsToCourses = (courses: Course[]): Course[] => {
  const cache = getCachedCourseStats();
  if (!cache || Object.keys(cache).length === 0) return courses;
  return courses.map((c) => {
    const cached = cache[c.id];
    if (!cached) return c;
    return {
      ...c,
      subscriberCount: c.subscriberCount || cached.subscriberCount,
      subscriberCountText: c.subscriberCountText || cached.subscriberCountText,
      instructorAvatar: c.instructorAvatar?.trim() ? c.instructorAvatar : (cached.instructorAvatar || c.instructorAvatar),
      instructorUrl: c.instructorUrl?.trim() ? c.instructorUrl : (cached.instructorUrl || c.instructorUrl),
      channelId: c.channelId || cached.channelId,
      totalViews: Math.max(c.totalViews || 0, cached.totalViews || 0),
      totalLikes: Math.max(c.totalLikes || 0, cached.totalLikes || 0),
      totalComments: Math.max(c.totalComments || 0, cached.totalComments || 0),
      lastSyncedAt: Math.max(c.lastSyncedAt || 0, cached.lastSyncedAt || 0),
      videos: (c.videos || []).map((v, idx) => {
        const cv = cached.videos?.find((x) => x.id === v.id || (x.youtubeId && x.youtubeId === v.youtubeId)) || cached.videos?.[idx];
        if (!cv) return v;
        return {
          ...v,
          viewCount: v.viewCount || cv.viewCount || 0,
          likeCount: v.likeCount || cv.likeCount || 0,
          commentCount: v.commentCount || cv.commentCount || 0,
          duration: (v.duration && v.duration !== '00:00' && v.duration !== '15:00') ? v.duration : (cv.duration || v.duration),
        };
      }),
    };
  });
};

/**
* Automatically enriches courses in the background with real YouTube views, likes, comments,
* and creator subscriber counts if they haven't been synced recently.
*/
export const syncAllCoursesLiveBackground = async (
  coursesList: Course[],
  onBatchUpdated: (updatedMap: Record<string, Course>) => void,
  forceAll = false
): Promise<void> => {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = Date.now();

  const needsSync = coursesList.filter((c) => {
    if (!c || !c.id) return false;
    if (!forceAll && sessionSyncedCourseIds.has(c.id)) return false;
    const firstVid = c.videos?.[0];
    if (!firstVid?.youtubeId && !c.playlistId) return false;
    if (forceAll) return true;
    const isMissingStats =
      !c.totalViews ||
      !c.totalLikes ||
      !c.subscriberCount ||
      !firstVid?.viewCount ||
      !firstVid?.likeCount;
    const isStale = !c.lastSyncedAt || now - c.lastSyncedAt > ONE_HOUR;
    return isMissingStats || isStale;
  });

  if (needsSync.length === 0) return;

  // Process in batches of 4 so UI updates rapidly
  const batchSize = 4;
  for (let i = 0; i < needsSync.length; i += batchSize) {
    const chunk = needsSync.slice(i, i + batchSize);
    const updatedBatch: Record<string, Course> = {};

    await Promise.all(
      chunk.map(async (courseItem) => {
        sessionSyncedCourseIds.add(courseItem.id);
        try {
          const firstVidId = extractYoutubeVideoId(courseItem.videos?.[0]?.youtubeId || '');
          if (!firstVidId) return;

          const meta = await fetchFullYoutubeVideoMetadata(firstVidId);
          if (!meta || (!meta.viewCount && !meta.likeCount && !meta.subscriberCount)) return;

          const updatedVideos = (courseItem.videos || []).map((v, idx) => {
            if (idx === 0) {
              return {
                ...v,
                viewCount: meta.viewCount || v.viewCount || 0,
                likeCount: meta.likeCount || v.likeCount || 0,
                commentCount: meta.commentCount || v.commentCount || 0,
                duration:
                  v.duration && v.duration !== '00:00' && v.duration !== '15:00'
                    ? v.duration
                    : meta.videoDuration || v.duration || '15:00',
              };
            }
            return v;
          });

          const sumViews = updatedVideos.reduce((acc, v) => acc + (v.viewCount || 0), 0);
          const sumLikes = updatedVideos.reduce((acc, v) => acc + (v.likeCount || 0), 0);
          const sumComments = updatedVideos.reduce((acc, v) => acc + (v.commentCount || 0), 0);

          const totalViews = Math.max(courseItem.totalViews || 0, sumViews);
          const totalLikes = Math.max(courseItem.totalLikes || 0, sumLikes);
          const totalComments = Math.max(courseItem.totalComments || 0, sumComments);
          const subscriberCount = meta.subscriberCount || courseItem.subscriberCount || 0;
          const subscriberCountText =
            meta.subscriberCountText ||
            courseItem.subscriberCountText ||
            (subscriberCount > 0 ? formatCompactNumber(subscriberCount) : '');

          updatedBatch[courseItem.id] = {
            ...courseItem,
            videos: updatedVideos,
            channelId: meta.channelId || courseItem.channelId,
            subscriberCount,
            subscriberCountText,
            instructorAvatar: courseItem.instructorAvatar?.trim()
              ? courseItem.instructorAvatar
              : meta.youtubeAvatar || courseItem.instructorAvatar,
            instructorUrl: courseItem.instructorUrl?.trim()
              ? courseItem.instructorUrl
              : meta.youtubeChannelUrl || courseItem.instructorUrl,
            totalViews,
            totalLikes,
            totalComments,
            lastSyncedAt: Date.now(),
          };
        } catch {}
      })
    );

    if (Object.keys(updatedBatch).length > 0) {
      saveCachedCourseStats(updatedBatch);
      onBatchUpdated(updatedBatch);
    }
  }
};

export const searchBookCoverOnline = async (
  title: string,
  author?: string
): Promise<{ coverUrl?: string; authorName?: string; title?: string } | null> => {
  if (!title.trim()) return null;
  try {
    const q = encodeURIComponent(`${title.trim()} ${author ? author.trim() : ''}`.trim());
    const res = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=5`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.docs) && data.docs.length > 0) {
        const docWithCover = data.docs.find((d: any) => d.cover_i) || data.docs[0];
        const coverUrl = docWithCover.cover_i
          ? `https://covers.openlibrary.org/b/id/${docWithCover.cover_i}-L.jpg`
          : undefined;
        const authorName = Array.isArray(docWithCover.author_name)
          ? docWithCover.author_name[0]
          : undefined;
        return {
          coverUrl,
          authorName,
          title: docWithCover.title,
        };
      }
    }
  } catch (e) {
    console.warn('OpenLibrary cover lookup warning:', e);
  }
  return null;
};
