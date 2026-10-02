import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { OAuth2Client } from 'google-auth-library';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // AI Smart Learning Path Advisor endpoint
  app.post('/api/ai/smart-path', async (req, res) => {
    const { goal = '', language = 'en', currentLevel = 'beginner' } = req.body;
    const isAr = language === 'ar';

    const fallbackPlans: Record<string, any> = {
      security: {
        title: isAr ? 'مسار خبير الأمن السيبراني واختبار الاختراق' : 'Cyber Security & Ethical Hacking Master Path',
        summary: isAr 
          ? 'خريطة طريق مكثفة تأخذك من فهم بنية الشبكات وأنظمة Linux إلى اختبار اختراق تطبيقات الويب وحماية الأنظمة.' 
          : 'A battle-tested roadmap from core networking & Linux internals to offensive web penetration testing.',
        estimatedWeeks: 8,
        weeklyHours: isAr ? '٥-٧ ساعات / أسبوع' : '5-7 hrs/week',
        difficulty: isAr ? 'من الصفر إلى المتقدم' : 'Beginner to Advanced',
        matchedCourseId: 'network-basics',
        steps: [
          {
            step: 1,
            title: isAr ? 'أساسيات بروتوكولات الشبكات ونظام Linux' : 'Computer Networking Protocols & Linux Fundamentals',
            duration: isAr ? 'أسبوعان' : '2 weeks',
            description: isAr ? 'فهم طبقات TCP/IP وDNS والتوجيه والتعامل العملي مع موجه الأوامر.' : 'Master TCP/IP, subnets, packet flow with Wireshark and core shell commands.',
            courseId: 'network-basics'
          },
          {
            step: 2,
            title: isAr ? 'لغة Python المتقدمة لأمن المعلومات والأتمتة' : 'Python Scripting for Security & Network Tools',
            duration: isAr ? '٣ أسابيع' : '3 weeks',
            description: isAr ? 'برمجة أدوات فحص المنافذ واستكشاف الثغرات وأتمتة المهام الأمنية.' : 'Build port scanners, exploit payloads, and automated vulnerability checkers.',
            courseId: 'python-for-security'
          },
          {
            step: 3,
            title: isAr ? 'اختبار اختراق تطبيقات الويب وشهادات الاعتماد' : 'Web Application Pentesting & Ethical Defense',
            duration: isAr ? '٣ أسابيع' : '3 weeks',
            description: isAr ? 'اكتشاف ثغرات OWASP Top 10 مثل SQL Injection وXSS وتطبيق أساليب الحماية.' : 'Hands-on exploitation of SQLi, XSS, CSRF, and securing distributed production workloads.',
            courseId: 'ceh-prep'
          }
        ],
        proTip: isAr 
          ? 'نصيحة ذكية: لا تكتفِ بالمشاهدة، قم بإنشاء بيئة معملية افتراضية على جهازك وجرب كل هجوم بنفسك.'
          : 'Pro Tip: Setup an isolated virtual lab and practice each attack vector on vulnerable targets.'
      },
      web: {
        title: isAr ? 'مسار مهندس الويب الشامل (Full-Stack)' : 'Full-Stack Web Engineering Career Path',
        summary: isAr 
          ? 'خطة تعلم تفاعلية متكاملة تبدأ من واجهات الويب وتصل بك إلى بناء تطبيقات متكاملة مع React وقواعد البيانات.' 
          : 'An end-to-end curriculum to build modern responsive UIs, server architectures, and verified credentials.',
        estimatedWeeks: 6,
        weeklyHours: isAr ? '٤-٦ ساعات / أسبوع' : '4-6 hrs/week',
        difficulty: isAr ? 'مبتدئ إلى احترافي' : 'Zero to Production',
        matchedCourseId: 'react-basics',
        steps: [
          {
            step: 1,
            title: isAr ? 'بنية HTML5 الدلالية وتنسيقات CSS الحديثة' : 'Semantic HTML5, CSS Grid & Responsive Architecture',
            duration: isAr ? 'أسبوع' : '1 week',
            description: isAr ? 'بناء صفحات ويب نظيفة ومتجاوبة مع كافة الشاشات دون تشتت.' : 'Master flexbox, modern grid layouts, typography, and accessibility foundations.',
            courseId: 'html-crash-course'
          },
          {
            step: 2,
            title: isAr ? 'لغة JavaScript والتعامل مع البيانات والواجهات' : 'Core JavaScript ES6+, Asynchronous & DOM Engineering',
            duration: isAr ? 'أسبوعان' : '2 weeks',
            description: isAr ? 'إتقان الدوال غير المتزامنة والمصفوفات وربط الـ APIs الحقيقية.' : 'Deep dive into closures, async/await, REST fetch calls, and event mechanics.',
            courseId: 'javascript-basics'
          },
          {
            step: 3,
            title: isAr ? 'مكتبة React وتطوير التطبيقات التفاعلية' : 'Modern React Components, State Machines & Hooks',
            duration: isAr ? '٣ أسابيع' : '3 weeks',
            description: isAr ? 'تطوير تطبيقات أحادية الصفحة (SPA) قابلة للتوسع ونشرها على السحابة.' : 'State lifecycle, component hierarchies, router navigation, and production deployment.',
            courseId: 'react-basics'
          }
        ],
        proTip: isAr 
          ? 'نصيحة ذكية: ركز على إنهاء كل درس وممارسة الكود بيدك قبل الانتقال للمرحلة التالية.'
          : 'Pro Tip: Code along with every lesson in a distraction-free window to maximize retention.'
      }
    };

    const isSecurityQuery = /security|cyber|hack|pen|linux|network|أمن|اختراق|شبكات/i.test(goal);
    const defaultPlan = isSecurityQuery ? fallbackPlans.security : fallbackPlans.web;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are the AI Learning Advisor for Skilliq, a distraction-free learning platform.
Given a user's learning goal, return a JSON object with a tailored 3-step learning roadmap.
Available catalog courses in Skilliq:
- 'html-crash-course' (HTML Crash Course)
- 'css-grid' (CSS Grid Layout)
- 'javascript-basics' (JavaScript Crash Course)
- 'react-basics' (React JS Crash Course)
- 'network-basics' (Networking Basics for Security)
- 'comptia-a-plus' (CompTIA A+ Core)
- 'python-for-security' (Python for Security)
- 'ceh-prep' (Certified Ethical Hacker Prep)

Respond ONLY with valid JSON (no markdown ticks, no preamble) matching this schema:
{
  "title": string,
  "summary": string,
  "estimatedWeeks": number,
  "weeklyHours": string,
  "difficulty": string,
  "matchedCourseId": string (one of the course IDs above),
  "steps": [
    {
      "step": number (1, 2, or 3),
      "title": string,
      "duration": string,
      "description": string,
      "courseId": string
    }
  ],
  "proTip": string
}
Language of response must be: ${isAr ? 'Arabic' : 'English'}.
User goal: "${goal}"
Level: "${currentLevel}"`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const text = response.text?.trim() || '';
        if (text) {
          const parsed = JSON.parse(text);
          return res.json({ success: true, plan: parsed, isAiGenerated: true });
        }
      }
    } catch (err: any) {
      console.warn('Gemini AI Smart Path fallback used:', err?.message || err);
    }

    // High quality deterministic fallback
    return res.json({ success: true, plan: defaultPlan, isAiGenerated: false });
  });

  // OAuth Setup Helper
  const getOAuthClient = (req: any) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    // Construct redirect URI based on current request or provided query param
    let redirectUri = req.query.redirect_uri as string;
    
    if (!redirectUri && req.query.state) {
        // Allow extracting from state during callback to ensure match
        redirectUri = Buffer.from(req.query.state as string, 'base64').toString('ascii');
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
      state = Buffer.from(req.query.redirect_uri as string).toString('base64');
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
      const code = req.query.code as string;
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

      const analyticsDataClient = new BetaAnalyticsDataClient({ authClient: authClient as any });

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

    } catch (error: any) {
      console.error('Analytics error:', error);
      const isInvalidGrant = error?.message?.includes('invalid_grant');
      res.status(200).json({ 
        error: error?.message || 'Failed to fetch analytics', 
        useDemo: true,
        needsAuth: isInvalidGrant
      });
    }
  });

  // Reports API Endpoints (Persistence for broken video and content reports)
  const reportsFilePath = path.join(process.cwd(), 'src', 'data', 'reports.json');
  const getStoredReports = (): any[] => {
    try {
      if (fs.existsSync(reportsFilePath)) {
        const raw = fs.readFileSync(reportsFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading reports.json:', e);
    }
    return [];
  };

  const saveStoredReports = (reports: any[]) => {
    try {
      fs.writeFileSync(reportsFilePath, JSON.stringify(reports, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing reports.json:', e);
    }
  };

  app.get('/api/reports', (req, res) => {
    const list = getStoredReports();
    res.json({ reports: list });
  });

  app.post('/api/reports', (req, res) => {
    const data = req.body;
    const reportId = data.id || `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const current = getStoredReports();

    // Check if an identical report was submitted in the last 60 seconds (anti-duplicate guard)
    const existingIndex = current.findIndex(r => 
      r.id === reportId || 
      (r.videoId === data.videoId && r.userId === data.userId && Math.abs((r.createdAt || 0) - (data.createdAt || Date.now())) < 60000)
    );

    if (existingIndex !== -1) {
      console.log(`[Reports] Debounced duplicate report for video "${data.videoId}"`);
      return res.status(200).json({ success: true, id: current[existingIndex].id, report: current[existingIndex] });
    }

    const newReport = {
      id: reportId,
      type: data.type || 'broken_video',
      courseId: data.courseId || '',
      courseTitle: data.courseTitle || '',
      videoId: data.videoId || '',
      videoTitle: data.videoTitle || '',
      youtubeId: data.youtubeId || '',
      userId: data.userId || 'guest',
      userName: data.userName || 'Learner',
      userEmail: data.userEmail || '',
      issue: data.issue || 'Video unavailable',
      details: data.details || '',
      status: 'pending',
      createdAt: data.createdAt || Date.now(),
      categoryId: data.categoryId || ''
    };

    current.unshift(newReport);
    saveStoredReports(current);

    console.log(`[Reports] New report saved: ${newReport.id} for course "${newReport.courseTitle}"`);
    res.status(201).json({ success: true, id: newReport.id, report: newReport });
  });

  // Notifications API Endpoints
  const notificationsFilePath = path.join(process.cwd(), 'src', 'data', 'notifications.json');
  const getStoredNotifications = (): any[] => {
    try {
      if (fs.existsSync(notificationsFilePath)) {
        const raw = fs.readFileSync(notificationsFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading notifications.json:', e);
    }
    return [];
  };

  const saveStoredNotifications = (notifications: any[]) => {
    try {
      fs.writeFileSync(notificationsFilePath, JSON.stringify(notifications, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing notifications.json:', e);
    }
  };

  app.get('/api/notifications', (req, res) => {
    const list = getStoredNotifications();
    res.json({ notifications: list });
  });

  app.post('/api/reports/:id/resolve', (req, res) => {
    const { id } = req.params;
    const { resolvedBy } = req.body;
    const current = getStoredReports();
    const targetReport = current.find(r => r.id === id);

    const updated = current.map(r => r.id === id ? { ...r, status: 'resolved', resolvedAt: Date.now(), resolvedBy: resolvedBy || 'admin' } : r);
    saveStoredReports(updated);

    // If report found, automatically create a "Video Fixed" notification
    if (targetReport) {
      const videoName = targetReport.videoTitle || 'Lesson Video';
      const courseName = targetReport.courseTitle || 'Course';

      const newNotification = {
        id: `notif_fixed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'video_fixed',
        title: `🎉 Video Fixed: "${videoName}"`,
        titleAr: `🎉 تم إصلاح درس: "${videoName}"`,
        message: `Good news! The video issue reported in "${courseName}" has been inspected and updated by the admin team. You can keep learning now!`,
        messageAr: `خبر سار! تم فحص وتحديث درس "${videoName}" في دورة "${courseName}" بواسطة فريق الإدارة. يمكنك الآن مواصلة التعلم والتقدم!`,
        link: `/course/${targetReport.courseId}`,
        actionLabel: 'Keep Learning Now',
        actionLabelAr: 'مواصلة التعلم الآن',
        courseId: targetReport.courseId,
        videoId: targetReport.videoId,
        targetUserId: targetReport.userId && targetReport.userId !== 'guest' && targetReport.userId !== 'anonymous' ? targetReport.userId : undefined,
        targetEmail: targetReport.userEmail || undefined,
        createdAt: Date.now(),
        isActive: true
      };

      const notifs = getStoredNotifications();
      // Remove any previous notif for same video to avoid clutter
      const filteredNotifs = notifs.filter(n => n.videoId !== targetReport.videoId);
      filteredNotifs.unshift(newNotification);
      saveStoredNotifications(filteredNotifs);

      console.log(`[Reports] Generated Video Fixed notification for video "${videoName}" in course "${courseName}"`);
      return res.json({ success: true, notification: newNotification });
    }

    res.json({ success: true });
  });

  app.delete('/api/reports/:id', (req, res) => {
    const { id } = req.params;
    const current = getStoredReports();
    const filtered = current.filter(r => r.id !== id);
    saveStoredReports(filtered);
    res.json({ success: true });
  });

  // Form Submissions API Endpoints (DMCA takedowns, Contact direct messages, Creator badge submissions)
  const submissionsFilePath = path.join(process.cwd(), 'src', 'data', 'submissions.json');
  const getStoredSubmissions = (): any[] => {
    try {
      if (fs.existsSync(submissionsFilePath)) {
        const raw = fs.readFileSync(submissionsFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading submissions.json:', e);
    }
    return [];
  };

  const saveStoredSubmissions = (subs: any[]) => {
    try {
      fs.writeFileSync(submissionsFilePath, JSON.stringify(subs, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing submissions.json:', e);
    }
  };

  app.get('/api/submissions', (req, res) => {
    const list = getStoredSubmissions();
    res.json({ submissions: list });
  });

  app.post('/api/submissions', (req, res) => {
    const data = req.body;
    const id = data.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const current = getStoredSubmissions();

    // Check duplicate guard within 30 seconds
    const existingIdx = current.findIndex(s => 
      s.id === id || 
      (s.type === data.type && (s.email === data.email || s.takedownEmail === data.takedownEmail) && Math.abs((s.createdAt || 0) - (data.createdAt || Date.now())) < 30000)
    );

    if (existingIdx !== -1) {
      return res.status(200).json({ success: true, id: current[existingIdx].id, submission: current[existingIdx] });
    }

    const newSub = {
      id,
      type: data.type || 'contact', // 'dmca' | 'contact' | 'creator'
      status: data.status || 'pending', // 'pending' | 'reviewed' | 'resolved'
      createdAt: data.createdAt || Date.now(),
      // Contact form fields
      name: data.name || '',
      email: data.email || data.takedownEmail || data.hubEmail || '',
      subject: data.subject || '',
      message: data.message || '',
      // DMCA form fields
      takedownName: data.takedownName || data.name || '',
      takedownEmail: data.takedownEmail || data.email || '',
      takedownUrl: data.takedownUrl || '',
      takedownReason: data.takedownReason || 'Removal Request',
      takedownDetails: data.takedownDetails || data.details || '',
      // Creator application fields
      creatorName: data.creatorName || data.name || '',
      channelUrl: data.channelUrl || '',
      notes: data.notes || '',
    };

    current.unshift(newSub);
    saveStoredSubmissions(current);
    console.log(`[Submissions] Saved new ${newSub.type} submission: ${newSub.id} from ${newSub.email}`);
    res.status(201).json({ success: true, id: newSub.id, submission: newSub });
  });

  app.patch('/api/submissions/:id', (req, res) => {
    const { id } = req.params;
    const { status, resolvedBy, notes } = req.body;
    const current = getStoredSubmissions();
    const updated = current.map(s => {
      if (s.id === id) {
        return {
          ...s,
          ...(status ? { status } : {}),
          ...(resolvedBy ? { resolvedBy } : {}),
          ...(notes !== undefined ? { adminNotes: notes } : {}),
          updatedAt: Date.now()
        };
      }
      return s;
    });
    saveStoredSubmissions(updated);
    res.json({ success: true });
  });

  app.delete('/api/submissions/:id', (req, res) => {
    const { id } = req.params;
    const current = getStoredSubmissions();
    const filtered = current.filter(s => s.id !== id);
    saveStoredSubmissions(filtered);
    res.json({ success: true });
  });

  // YouTube Playlist Importer Proxy Endpoint
  const formatIsoDuration = (isoDuration: string) => {
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

  app.get('/api/youtube/playlist', async (req, res) => {
    try {
      const playlistId = req.query.id as string;
      const apiKey = (req.query.key as string) || process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY;

      if (!playlistId) {
        return res.status(400).json({ error: 'Missing playlist id parameter' });
      }
      if (!apiKey) {
        return res.status(400).json({ error: 'Missing YouTube API Key' });
      }

      let allItems: any[] = [];
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
        const videoIds = chunk.map((item: any) => item.snippet?.resourceId?.videoId || item.contentDetails?.videoId).filter(Boolean).join(',');
        if (!videoIds) continue;

        const durUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`;
        const durRes = await fetch(durUrl);
        const durData = await durRes.json();

        const durationMap: Record<string, string> = {};
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
    } catch (err: any) {
      console.error('Server YouTube playlist fetch error:', err);
      res.status(500).json({ error: err.message || 'Server error fetching playlist' });
    }
  });

  // Serve public folder directly as fallback for /public/* requests
  app.use('/public', express.static(path.join(process.cwd(), 'public')));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false 
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
