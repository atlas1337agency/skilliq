import express from 'express';
import cors from 'cors';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

const app = express();

app.use(cors());
app.use(express.json());

const getBaseOrigin = (req) => {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'skilliq.vercel.app';
  return `${proto}://${host}`;
};

app.get(['/robots.txt', '/api/robots.txt'], (req, res) => {
  const origin = getBaseOrigin(req);
  const robotsTxt = [
    'User-agent: *',
    'Allow: /',
    'Allow: /courses',
    'Allow: /masterclasses',
    'Allow: /paths',
    'Allow: /books',
    'Allow: /creator',
    'Allow: /course/',
    'Allow: /path/',
    'Disallow: /admin',
    'Disallow: /api/',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    ''
  ].join('\n');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(robotsTxt);
});

app.get(['/sitemap.xml', '/api/sitemap.xml'], (req, res) => {
  const origin = getBaseOrigin(req);
  const today = new Date().toISOString().split('T')[0];

  const staticRoutes = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/courses', priority: '0.9', changefreq: 'daily' },
    { path: '/masterclasses', priority: '0.9', changefreq: 'daily' },
    { path: '/paths', priority: '0.9', changefreq: 'weekly' },
    { path: '/books', priority: '0.8', changefreq: 'weekly' },
    { path: '/creator', priority: '0.8', changefreq: 'weekly' },
    { path: '/leaderboard', priority: '0.7', changefreq: 'daily' },
    { path: '/verify', priority: '0.7', changefreq: 'monthly' },
    { path: '/about', priority: '0.7', changefreq: 'monthly' },
    { path: '/contact', priority: '0.6', changefreq: 'monthly' },
    { path: '/copyright', priority: '0.5', changefreq: 'yearly' }
  ];

  const courseMap = new Map();
  const defaultCoursesList = [
    { id: 'html-crash-course', title: 'HTML Crash Course For Absolute Beginners', description: 'Learn HTML5 from scratch in this comprehensive crash course.', youtubeId: 'UB1O30fR-EE' },
    { id: 'react-basics', title: 'React JS Crash Course', description: 'Get started with React in this crash course.', youtubeId: 'w7ejDZ8SWv8' },
    { id: 'css-grid', title: 'CSS Grid Layout Crash Course', description: 'Learn CSS Grid layout in this comprehensive crash course.', youtubeId: 'jV8B24rSN5o' },
    { id: 'javascript-basics', title: 'JavaScript Crash Course For Beginners', description: 'Learn JavaScript from scratch in this crash course.', youtubeId: 'hdI2bqOjy3c' },
    { id: 'network-basics', title: 'Networking Fundamentals', description: 'Learn the basics of computer networking, IP addresses, and OSI model.', youtubeId: 'qiQR5rTSshw' },
    { id: 'comptia-a-plus', title: 'CompTIA A+ Certification Prep', description: 'Comprehensive guide to passing the CompTIA A+ certification.', youtubeId: 'qiQR5rTSshw' },
    { id: 'python-for-security', title: 'Python for Cyber Security', description: 'Learn how to use Python to automate security tasks and build tools.', youtubeId: 'qiQR5rTSshw' },
    { id: 'ceh-prep', title: 'Certified Ethical Hacker (CEH) Prep', description: 'Prepare for the CEH certification with this comprehensive playlist.', youtubeId: 'qiQR5rTSshw' },
    { id: 'full-react-course-2024', title: "React Course - Beginner's Tutorial for React", description: 'A full 12+ hour React course covering modern web applications.', youtubeId: 'bMknfKXIFA8' },
    { id: 'cyber-security-full-course', title: 'Cyber Security Full Course for Beginners', description: 'Learn Cyber Security in 12 Hours.', youtubeId: 'U_P23SqJaDc' },
    { id: 'ipkxu', title: 'Mastering WordPress', description: 'كورس احتراف ووردبريس الشامل باللغة العربية.', youtubeId: 'ctEAYHFcbHk' },
    { id: 'l02pbl', title: 'Flutter & Dart Full Course', description: 'دورة كاملة وشاملة في فلاتر ودارت لبناء تطبيقات الموبايل.', youtubeId: '6bSP4vazmyw' },
    { id: '312ar', title: 'Media Buyer & Digital Ads', description: 'كورس احتراف الميديا باينج والإعلانات الممولة.', youtubeId: 'ZeLtBaN86G8' },
    { id: '4ptzav', title: 'N8N & AI Automation', description: 'دورة بناء أنظمة الذكاء الاصطناعي والأتمتة الذكية بدون كود.', youtubeId: 'EwfCLtjscTE' },
    { id: 'm1pdcj', title: 'Claude Design & UI System', description: 'دورة تصميم واجهات المستخدم والأنظمة المرئية بالذكاء الاصطناعي.', youtubeId: '8tT-1i_EixQ' },
    { id: 'glpr5t', title: 'SketchUp Pro 3D Design', description: 'دورة النمذجة ثلاثية الأبعاد والتصميم المعماري الاحترافي ببرنامج سكتش آب.', youtubeId: 'oaye0GKPJIg' }
  ];

  for (const dc of defaultCoursesList) {
    courseMap.set(dc.id, dc);
  }

  const pathIds = new Set([
    'frontend-master',
    'cyber-security-expert',
    'web-mobile-ar',
    'ai-marketing-ar',
    'design-3d-ar'
  ]);

  const creators = new Set();

  try {
    const backupPath = path.join(process.cwd(), 'public', 'nexa-full-backup.json');
    if (fs.existsSync(backupPath)) {
      const raw = fs.readFileSync(backupPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.courses)) {
        parsed.courses.forEach((c) => {
          if (c?.id && c.isApproved !== false) {
            const firstVid = Array.isArray(c.videos) && c.videos.length > 0 ? c.videos[0] : null;
            courseMap.set(String(c.id), {
              id: String(c.id),
              title: c.title || 'Skilliq Course',
              description: c.description || c.title || 'Free structured course on Skilliq',
              thumbnail: c.thumbnail || (firstVid?.youtubeId ? `https://img.youtube.com/vi/${firstVid.youtubeId}/maxresdefault.jpg` : ''),
              youtubeId: firstVid?.youtubeId || ''
            });
          }
          if (c?.instructor && typeof c.instructor === 'string') {
            creators.add(c.instructor.trim());
          }
        });
      }
      if (Array.isArray(parsed.learningPaths)) {
        parsed.learningPaths.forEach((p) => {
          if (p?.id) pathIds.add(String(p.id));
        });
      }
    }
  } catch (e) {}

  const escapeXml = (str) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const urlsXml = [];

  for (const r of staticRoutes) {
    urlsXml.push(`  <url>
    <loc>${escapeXml(`${origin}${r.path}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`);
  }

  for (const pid of pathIds) {
    urlsXml.push(`  <url>
    <loc>${escapeXml(`${origin}/path/${encodeURIComponent(pid)}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`);
  }

  for (const [cid, cInfo] of courseMap.entries()) {
    const cleanYtId = String(cInfo.youtubeId || '').trim();
    const thumbUrl = cInfo.thumbnail || (cleanYtId ? `https://img.youtube.com/vi/${cleanYtId}/maxresdefault.jpg` : `${origin}/images/logo_dark.png`);
    const videoBlock = cleanYtId && cleanYtId.length === 11
      ? `\n    <video:video>
      <video:thumbnail_loc>${escapeXml(thumbUrl)}</video:thumbnail_loc>
      <video:title>${escapeXml(cInfo.title)}</video:title>
      <video:description>${escapeXml(String(cInfo.description || cInfo.title).slice(0, 2000))}</video:description>
      <video:player_loc>https://www.youtube.com/embed/${escapeXml(cleanYtId)}</video:player_loc>
    </video:video>`
      : '';

    urlsXml.push(`  <url>
    <loc>${escapeXml(`${origin}/course/${encodeURIComponent(cid)}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>${videoBlock}
  </url>`);
  }

  for (const creatorName of creators) {
    if (!creatorName) continue;
    urlsXml.push(`  <url>
    <loc>${escapeXml(`${origin}/creator/${encodeURIComponent(creatorName)}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.70</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urlsXml.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

// OAuth Setup Helper
const getOAuthClient = (req) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  // Construct redirect URI based on current request or provided query param
  let redirectUri = req.query.redirect_uri;
  
  if (!redirectUri && req.query.state) {
      // Allow extracting from state during callback to ensure match
      redirectUri = Buffer.from(req.query.state, 'base64').toString('ascii');
  }

  if (!redirectUri) {
      // Fallback
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      redirectUri = `${protocol}://${host}/api/analytics/oauth/callback`;
  }
  
  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

// Route 1: Get Google Auth URL
app.get('/api/analytics/oauth/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in settings.' });
  }
  const client = getOAuthClient(req);
  // Encode redirect_uri into state so we receive it back exactly
  let state = '';
  if (req.query.redirect_uri) {
    state = Buffer.from(req.query.redirect_uri).toString('base64');
  }

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/analytics.readonly'],
    prompt: 'consent', // Force to get refresh token
    state: state
  });
  res.json({ url });
});

// Route 2: Callback after user authenticates
app.get('/api/analytics/oauth/callback', async (req, res) => {
  try {
    const code = req.query.code;
    const client = getOAuthClient(req);
    const { tokens } = await client.getToken(code);
    
    res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">Google Analytics Authenticated!</h2>
          <p>Please copy your Refresh Token below and add it to your Project Settings as <b>GA4_REFRESH_TOKEN</b>:</p>
          <textarea readonly style="width: 100%; height: 100px; padding: 10px; font-family: monospace; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 20px;">${tokens.refresh_token}</textarea>
          <p><strong>Important:</strong> After saving the setting, you must restart your app for the settings to take effect.</p>
          <a href="/admin" style="display: inline-block; padding: 10px 20px; background-color: #0F172A; color: white; text-decoration: none; border-radius: 6px;">Go Back to Admin</a>
        </body>
      </html>
    `);
  } catch (e) {
    res.status(500).send('Error getting token: ' + String(e));
  }
});

// Route 3: Fetch Analytics Data
app.get('/api/analytics', async (req, res) => {
  try {
    const propertyId = process.env.GA4_PROPERTY_ID;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GA4_REFRESH_TOKEN;

    if (!propertyId || !clientId || !clientSecret) {
      return res.status(200).json({ 
        error: 'Missing Credentials', 
        useDemo: true, 
        needsSetup: true 
      });
    }

    if (!refreshToken) {
      return res.status(200).json({ 
        error: 'Missing Refresh Token', 
        useDemo: true, 
        needsAuth: true 
      });
    }

    const authClient = new OAuth2Client(clientId, clientSecret);
    authClient.setCredentials({ refresh_token: refreshToken });

    const analyticsDataClient = new BetaAnalyticsDataClient({ authClient });

    // Fetch Traffic over last 7 days
    const [trafficResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: '7daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'date' },
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' }
      ],
    });

    // Fetch Top Locations
    const [locationResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: '7daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'country' },
      ],
      metrics: [
        { name: 'activeUsers' },
      ],
    });

    res.json({
      traffic: trafficResponse,
      locations: locationResponse
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(200).json({ 
      error: error?.message || 'Failed to fetch analytics', 
      useDemo: true 
    });
  }
});

// YouTube Playlist Importer Proxy Endpoint
const formatIsoDuration = (isoDuration) => {
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

app.get('/api/youtube/config', (req, res) => {
  const hasKey = !!(process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY);
  res.json({ hasEnvKey: hasKey });
});

const formatSecondsDuration = (totalSeconds) => {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) return "15:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

app.get('/api/youtube/video-info', async (req, res) => {
  try {
    const videoId = (req.query.id || '').trim();
    const apiKey = req.query.key || process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY;

    if (!videoId) {
      return res.status(400).json({ error: 'Missing YouTube video ID' });
    }

    let videoTitle = '';
    let videoDuration = '';
    let videoThumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    let youtubeName = '';
    let youtubeAvatar = '';
    let youtubeChannelUrl = '';
    let description = '';

    if (apiKey) {
      try {
        const vUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`;
        const vRes = await fetch(vUrl);
        const vData = await vRes.json();
        if (vData.items && vData.items.length > 0) {
          const item = vData.items[0];
          videoTitle = item.snippet?.title || '';
          description = item.snippet?.description || '';
          videoDuration = formatIsoDuration(item.contentDetails?.duration);
          videoThumbnail = item.snippet?.thumbnails?.maxres?.url || item.snippet?.thumbnails?.high?.url || videoThumbnail;
          youtubeName = item.snippet?.channelTitle || '';
          const channelId = item.snippet?.channelId;
          if (channelId) {
            youtubeChannelUrl = `https://www.youtube.com/channel/${channelId}`;
            const cUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(apiKey)}`;
            const cRes = await fetch(cUrl);
            const cData = await cRes.json();
            if (cData.items && cData.items.length > 0) {
              const cSnippet = cData.items[0].snippet;
              youtubeAvatar = cSnippet?.thumbnails?.high?.url || cSnippet?.thumbnails?.default?.url || '';
            }
          }
        }
      } catch (apiErr) {
        console.warn('YouTube Data API v3 fallback triggered:', apiErr);
      }
    }

    if (!videoTitle || !youtubeName) {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
        const oRes = await fetch(oembedUrl);
        if (oRes.ok) {
          const oData = await oRes.json();
          if (!videoTitle && oData.title) videoTitle = oData.title;
          if (!youtubeName && oData.author_name) youtubeName = oData.author_name;
          if (!youtubeChannelUrl && oData.author_url) youtubeChannelUrl = oData.author_url;
        }
      } catch (oErr) {}
    }

    if (!videoDuration || !youtubeAvatar || !description) {
      try {
        const watchRes = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });
        if (watchRes.ok) {
          const html = await watchRes.text();
          if (!videoDuration) {
            const lenMatch = html.match(/"lengthSeconds":"(\d+)"/);
            if (lenMatch && lenMatch[1]) {
              videoDuration = formatSecondsDuration(parseInt(lenMatch[1], 10));
            } else {
              const approxMatch = html.match(/"approxDurationMs":"(\d+)"/);
              if (approxMatch && approxMatch[1]) {
                videoDuration = formatSecondsDuration(Math.round(parseInt(approxMatch[1], 10) / 1000));
              }
            }
          }
          if (!youtubeAvatar) {
            const ownerAvatarMatch = html.match(/"videoOwnerRenderer":\{"thumbnail":\{"thumbnails":\[\{"url":"([^"]+)"/);
            if (ownerAvatarMatch && ownerAvatarMatch[1]) {
              youtubeAvatar = ownerAvatarMatch[1].replace(/\\u0026/g, '&');
            } else {
              const yt3Match = html.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/(?:ytc\/)?[A-Za-z0-9_\-=]+(?:\=s\d+[^"\\]*)?/);
              if (yt3Match && yt3Match[0]) {
                youtubeAvatar = yt3Match[0];
              }
            }
          }
          if (!youtubeChannelUrl) {
            const chanMatch = html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/);
            if (chanMatch && chanMatch[1]) {
              youtubeChannelUrl = `https://www.youtube.com/channel/${chanMatch[1]}`;
            }
          }
        }
      } catch (e) {}
    }

    if (!youtubeAvatar && youtubeName) {
      youtubeAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(youtubeName)}&background=ef4444&color=fff&bold=true`;
    }

    res.json({
      success: true,
      youtubeId: videoId,
      videoTitle: videoTitle || 'Book Video Summary',
      videoDuration: videoDuration || '15:00',
      videoThumbnail,
      youtubeName: youtubeName || 'YouTube Creator',
      youtubeAvatar,
      youtubeChannelUrl: youtubeChannelUrl || `https://www.youtube.com/watch?v=${videoId}`,
      description: description ? description.slice(0, 1200) : ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch video info' });
  }
});

app.get('/api/youtube/playlist', async (req, res) => {
  try {
    const playlistId = req.query.id;
    const apiKey = req.query.key || process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY;

    if (!playlistId) {
      return res.status(400).json({ error: 'Missing playlist id parameter' });
    }
    if (!apiKey) {
      return res.status(400).json({ error: 'Missing YouTube API Key' });
    }

    let allItems = [];
    let nextPageToken = "";

    do {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      const ytRes = await fetch(url);
      const data = await ytRes.json();
      if (data.error) {
        return res.status(400).json({ error: data.error.message || 'Failed to fetch playlist items' });
      }
      if (!data.items || data.items.length === 0) break;
      allItems = allItems.concat(data.items);
      nextPageToken = data.nextPageToken || "";
    } while (nextPageToken);

    const videos = [];
    const chunks = [];
    for (let i = 0; i < allItems.length; i += 50) {
      chunks.push(allItems.slice(i, i + 50));
    }

    for (const chunk of chunks) {
      const videoIds = chunk.map((item) => item.snippet?.resourceId?.videoId || item.contentDetails?.videoId).filter(Boolean).join(',');
      if (!videoIds) continue;

      const durUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`;
      const durRes = await fetch(durUrl);
      const durData = await durRes.json();

      const durationMap = {};
      if (durData.items) {
        for (const item of durData.items) {
          durationMap[item.id] = formatIsoDuration(item.contentDetails?.duration);
        }
      }

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

    res.json({ success: true, videos });
  } catch (err) {
    console.error('Server YouTube playlist fetch error:', err);
    res.status(500).json({ error: err.message || 'Server error fetching playlist' });
  }
});

// Export the Express API
export default app;
