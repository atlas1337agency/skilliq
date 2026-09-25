// Format duration from PT1H2M10S to HH:MM:SS
const formatDuration = (isoDuration: string) => {
  if (!isoDuration) return "00:00";
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "00:00";
  
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  
  let formatted = "";
  if (hours > 0) formatted += `${hours}:`;
  formatted += `${hours > 0 && minutes < 10 ? '0' : ''}${minutes}:`;
  formatted += `${seconds < 10 ? '0' : ''}${seconds}`;
  return formatted;
};

export const fetchPlaylistVideos = async (playlistId: string) => {
  // @ts-ignore
  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!API_KEY) {
    throw new Error("Missing VITE_YOUTUBE_API_KEY. Please open Settings in AI Studio and add your API Key.");
  }

  let allItems: any[] = [];
  let nextPageToken = "";
  
  // Fetch all items from the playlist (handles up to 50 items per page)
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Failed to fetch playlist items");
    }
    if (!data.items || data.items.length === 0) break;

    allItems = allItems.concat(data.items);
    nextPageToken = data.nextPageToken || ""; 
  } while (nextPageToken);

  const videos = [];
  const chunks = [];
  // YouTube videos API only allows up to 50 IDs at a time, so we chunk it
  for(let i = 0; i < allItems.length; i += 50) {
    chunks.push(allItems.slice(i, i + 50));
  }

  // Get exact video durations for every chunk of 50 videos
  for (const chunk of chunks) {
    const videoIds = chunk.map((item: any) => item.snippet?.resourceId?.videoId || item.contentDetails?.videoId).filter(Boolean).join(',');
    if (!videoIds) continue;

    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.error) {
       console.error("Videos API Error:", data.error);
       throw new Error(`Failed to fetch video durations: ${data.error.message}`);
    }

    const durationMap: Record<string, string> = {};
    if (data.items) {
      for (const item of data.items) {
        durationMap[item.id] = formatDuration(item.contentDetails?.duration);
      }
    }

    // Build the clean video objects
    for (const item of chunk) {
      const vId = item.snippet?.resourceId?.videoId || item.contentDetails?.videoId;
      const isPrivateOrDeleted = item.snippet?.title === "Private video" || item.snippet?.title === "Deleted video";
      
      if (vId && !isPrivateOrDeleted) {
        videos.push({
          id: `v${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: item.snippet?.title || "Unknown Title",
          youtubeId: vId,
          duration: durationMap[vId] || "00:00",
          language: "",
          description: "",
          resources: []
        });
      }
    }
  }
  
  return videos;
};

export const fetchVideoDetails = async (youtubeId: string) => {
  // @ts-ignore
  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!API_KEY) return null;

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${youtubeId}&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      const durationMatch = item.contentDetails.duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
      let durationStr = '00:00';
      if (durationMatch) {
         const h = (parseInt(durationMatch[1]) || 0);
         const m = (parseInt(durationMatch[2]) || 0);
         const s = (parseInt(durationMatch[3]) || 0);
         if (h > 0) {
           durationStr = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
         } else {
           durationStr = `${m}:${s.toString().padStart(2, '0')}`;
         }
      }

      return {
        title: item.snippet?.title || 'Unknown Title',
        duration: durationStr,
        description: item.snippet?.description || ''
      };
    }
  } catch (err) {
    console.error("Error fetching video details:", err);
  }
  return null;
};

export const extractPlaylistId = (input: string) => {
  if (!input) return null;
  input = input.trim();
  const match = input.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : input; 
};

export const fetchChannelDetailsFromVideoOrPlaylist = async (id: string, isPlaylist: boolean) => {
  // @ts-ignore
  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
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

    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${API_KEY}`;
    const channelRes = await fetch(channelUrl);
    const channelData = await channelRes.json();

    if (channelData.items && channelData.items.length > 0) {
      const channel = channelData.items[0].snippet;
      return {
        instructorName: channel?.title || 'Unknown Instructor',
        instructorAvatar: channel?.thumbnails?.high?.url || channel?.thumbnails?.default?.url || '',
        instructorUrl: `https://www.youtube.com/channel/${channelId}?sub_confirmation=1`
      };
    }
  } catch (err) {
    console.error(err);
  }
  return null;
};
