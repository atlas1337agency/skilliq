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
  app.use(express.json({ limit: '10mb' }));

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

  // Google Analytics 4 Configuration Storage (Runtime Environment Variables First)
  const parseServiceAccountCredentials = (raw?: string): Record<string, any> | null => {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.private_key === 'string') {
          parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
        }
        return parsed;
      }
    } catch {
      try {
        const decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
        const parsed = JSON.parse(decoded);
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.private_key === 'string') {
            parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
          }
          return parsed;
        }
      } catch {
        return null;
      }
    }
    return null;
  };

  app.get('/api/analytics/config', (req, res) => {
    const measurementId = (process.env.VITE_GA_MEASUREMENT_ID || '').trim();
    const hasPropertyId = Boolean((process.env.GA4_PROPERTY_ID || '').trim());
    const hasServiceAccount = Boolean(parseServiceAccountCredentials(process.env.GA4_SERVICE_ACCOUNT_JSON));
    res.json({
      measurementId,
      configured: hasPropertyId && hasServiceAccount,
      hasPropertyId,
      hasServiceAccount
    });
  });

  // Helper: Fetch GA4 Data API Reports via REST using Service Account access token
  const fetchGa4ReportsViaRest = async (accessToken: string, propId: string, measurementId?: string) => {
    const cleanPropId = propId.replace(/^properties\//, '').trim();
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const [trafficRes, locationRes, pagesRes, devicesRes, sourcesRes, realtimeRes] = await Promise.all([
      fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropId}:runReport`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'sessions' }, { name: 'averageSessionDuration' }]
        })
      }),
      fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropId}:runReport`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'activeUsers' }]
        })
      }),
      fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropId}:runReport`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }]
        })
      }),
      fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropId}:runReport`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'activeUsers' }]
        })
      }),
      fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropId}:runReport`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'sessions' }]
        })
      }),
      fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropId}:runRealtimeReport`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          metrics: [{ name: 'activeUsers' }]
        })
      })
    ]);

    if (!trafficRes.ok) {
      const errBody = await trafficRes.json().catch(() => ({}));
      return {
        ok: false,
        status: trafficRes.status,
        error: errBody?.error?.message || `Google Analytics Data API returned HTTP ${trafficRes.status}`
      };
    }

    const traffic = await trafficRes.json();
    const locations = locationRes.ok ? await locationRes.json() : null;
    const pages = pagesRes.ok ? await pagesRes.json() : null;
    const devices = devicesRes.ok ? await devicesRes.json() : null;
    const sources = sourcesRes.ok ? await sourcesRes.json() : null;
    const realtime = realtimeRes.ok ? await realtimeRes.json() : null;

    return {
      ok: true,
      data: {
        useDemo: false,
        measurementId: measurementId || '',
        traffic,
        locations,
        pages,
        devices,
        sources,
        realtime
      }
    };
  };

  // Route 3: Fetch Analytics Data using GA4_PROPERTY_ID and GA4_SERVICE_ACCOUNT_JSON from runtime environment
  app.get('/api/analytics', async (req, res) => {
    try {
      const propertyId = (process.env.GA4_PROPERTY_ID || '').replace(/^properties\//, '').trim();
      const measurementId = (process.env.VITE_GA_MEASUREMENT_ID || '').trim();
      const rawServiceAccount = process.env.GA4_SERVICE_ACCOUNT_JSON;

      if (!propertyId || !rawServiceAccount) {
        const missing: string[] = [];
        if (!propertyId) missing.push('GA4_PROPERTY_ID');
        if (!rawServiceAccount) missing.push('GA4_SERVICE_ACCOUNT_JSON');
        return res.status(200).json({
          useDemo: true,
          configured: false,
          error: `GA4 reporting requires server environment variables (${missing.join(', ')}) to be set.`
        });
      }

      const credentials = parseServiceAccountCredentials(rawServiceAccount);
      if (!credentials || !credentials.client_email || !credentials.private_key) {
        return res.status(200).json({
          useDemo: true,
          configured: false,
          error: 'GA4_SERVICE_ACCOUNT_JSON is present in the environment but is not a valid Service Account JSON object.'
        });
      }

      const { GoogleAuth } = await import('google-auth-library');
      const gAuth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/analytics.readonly']
      });
      const client = await gAuth.getClient();
      const tokenRes = await client.getAccessToken();

      if (!tokenRes?.token) {
        return res.status(200).json({
          useDemo: true,
          configured: true,
          error: 'Failed to obtain an access token using GA4_SERVICE_ACCOUNT_JSON.'
        });
      }

      const result = await fetchGa4ReportsViaRest(tokenRes.token, propertyId, measurementId);
      if (result.ok) {
        return res.json(result.data);
      }

      return res.status(200).json({
        useDemo: true,
        configured: true,
        error: result.error || 'Unable to query Google Analytics Data API for the configured GA4_PROPERTY_ID.'
      });
    } catch {
      res.status(200).json({
        useDemo: true,
        configured: false,
        error: 'Server error while communicating with Google Analytics Data API.'
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

  // Support Tickets API Endpoints (User-Admin conversations with screenshot & text attachments)
  const ticketsFilePath = path.join(process.cwd(), 'src', 'data', 'tickets.json');
  const getStoredTickets = (): any[] => {
    try {
      if (fs.existsSync(ticketsFilePath)) {
        const raw = fs.readFileSync(ticketsFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error('Error reading tickets.json:', e);
    }
    return [];
  };

  const saveStoredTickets = (tickets: any[]) => {
    try {
      fs.writeFileSync(ticketsFilePath, JSON.stringify(tickets, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing tickets.json:', e);
    }
  };

  app.get('/api/tickets', (req, res) => {
    const userId = req.query.userId as string | undefined;
    const list = getStoredTickets();
    if (userId) {
      return res.json({ tickets: list.filter(t => t.userId === userId) });
    }
    res.json({ tickets: list });
  });

  app.post('/api/tickets', (req, res) => {
    const ticket = req.body;
    if (!ticket || !ticket.id) {
      return res.status(400).json({ error: 'Invalid ticket payload' });
    }
    const current = getStoredTickets();
    const existingIdx = current.findIndex(t => t.id === ticket.id);
    if (existingIdx !== -1) {
      current[existingIdx] = { ...current[existingIdx], ...ticket };
    } else {
      current.unshift(ticket);
    }
    saveStoredTickets(current);
    res.status(201).json({ success: true, ticket });
  });

  app.post('/api/tickets/:id/reply', (req, res) => {
    const { id } = req.params;
    const { message, status, unreadByAdmin, unreadByUser } = req.body;
    if (!message || !message.id) {
      return res.status(400).json({ error: 'Invalid reply message' });
    }
    const current = getStoredTickets();
    const idx = current.findIndex(t => t.id === id);
    if (idx !== -1) {
      const existingMsgs = Array.isArray(current[idx].messages) ? current[idx].messages : [];
      const alreadyExists = existingMsgs.some((m: any) => m.id === message.id);
      const updatedMsgs = alreadyExists ? existingMsgs : [...existingMsgs, message];
      current[idx] = {
        ...current[idx],
        messages: updatedMsgs,
        ...(status ? { status } : {}),
        ...(unreadByAdmin !== undefined ? { unreadByAdmin } : {}),
        ...(unreadByUser !== undefined ? { unreadByUser } : {}),
        updatedAt: Date.now()
      };
      saveStoredTickets(current);
      return res.json({ success: true, ticket: current[idx] });
    }
    res.json({ success: true });
  });

  app.patch('/api/tickets/:id/status', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const current = getStoredTickets();
    const updated = current.map(t => {
      if (t.id === id) {
        return {
          ...t,
          ...updates,
          updatedAt: Date.now()
        };
      }
      return t;
    });
    saveStoredTickets(updated);
    res.json({ success: true });
  });

  app.delete('/api/tickets/:id', (req, res) => {
    const { id } = req.params;
    const current = getStoredTickets();
    const filtered = current.filter(t => t.id !== id);
    saveStoredTickets(filtered);
    res.json({ success: true });
  });

  // --- REAL-TIME PLATFORM TELEMETRY & USER PRESENCE ---
  const presenceFilePath = path.join(process.cwd(), 'src', 'data', 'presence.json');
  const movementsFilePath = path.join(process.cwd(), 'src', 'data', 'movements.json');
  let memoryPresence: any[] = [];
  let memoryMovements: any[] = [];

  const getStoredPresence = (): any[] => {
    try {
      if (fs.existsSync(presenceFilePath)) {
        const raw = fs.readFileSync(presenceFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          memoryPresence = parsed;
          return parsed;
        }
      }
    } catch (e) {}
    return memoryPresence;
  };

  const saveStoredPresence = (list: any[]) => {
    memoryPresence = list;
    try {
      fs.writeFileSync(presenceFilePath, JSON.stringify(list.slice(0, 500), null, 2));
    } catch (e) {}
  };

  const getStoredMovements = (): any[] => {
    try {
      if (fs.existsSync(movementsFilePath)) {
        const raw = fs.readFileSync(movementsFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          memoryMovements = parsed;
          return parsed;
        }
      }
    } catch (e) {}
    return memoryMovements;
  };

  const saveStoredMovements = (list: any[]) => {
    memoryMovements = list.slice(0, 500);
    try {
      fs.writeFileSync(movementsFilePath, JSON.stringify(memoryMovements, null, 2));
    } catch (e) {}
  };

  app.get('/api/telemetry', (req, res) => {
    res.json({
      presence: getStoredPresence(),
      movements: getStoredMovements()
    });
  });

  app.post('/api/telemetry/presence', (req, res) => {
    const record = req.body;
    if (!record || !record.id) {
      return res.status(400).json({ error: 'Invalid presence payload' });
    }
    const list = getStoredPresence();
    const idx = list.findIndex((p: any) => p.id === record.id);
    if (idx !== -1) {
      const existing = list[idx];
      list[idx] = {
        ...existing,
        ...record,
        totalSecondsSpent: Math.max(existing.totalSecondsSpent || 0, record.totalSecondsSpent || 0),
        visitCount: Math.max(existing.visitCount || 1, record.visitCount || 1),
        pagesVisitedCount: Math.max(existing.pagesVisitedCount || 1, record.pagesVisitedCount || 1),
        firstVisitAt: existing.firstVisitAt || record.firstVisitAt || Date.now(),
        lastSeenAt: record.lastSeenAt || Date.now()
      };
    } else {
      list.unshift(record);
    }
    saveStoredPresence(list);
    res.json({ success: true });
  });

  app.post('/api/telemetry/movement', (req, res) => {
    const ev = req.body;
    if (!ev || !ev.id) {
      return res.status(400).json({ error: 'Invalid movement payload' });
    }
    const list = getStoredMovements();
    if (!list.some((m: any) => m.id === ev.id)) {
      list.unshift(ev);
      saveStoredMovements(list);
    }
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

  // Format raw seconds into H:MM:SS or MM:SS
  const formatSecondsDuration = (totalSeconds: number) => {
    if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) return "15:00";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Parse human-readable count strings like "1.4M subscribers", "245K", "1,234,567 views" into numbers
  const parseHumanNumber = (raw?: string): number => {
    if (!raw) return 0;
    const cleaned = String(raw).replace(/,/g, '').trim();
    const match = cleaned.match(/([\d.]+)\s*(billion|million|thousand|[KMBkmb]|ألف|مليون|مليار)?/i);
    if (!match) return 0;
    const num = parseFloat(match[1]);
    if (isNaN(num)) return 0;
    const unit = (match[2] || '').toUpperCase();
    if (unit === 'K' || unit === 'THOUSAND' || unit === 'ألف') return Math.round(num * 1_000);
    if (unit === 'M' || unit === 'MILLION' || unit === 'مليون') return Math.round(num * 1_000_000);
    if (unit === 'B' || unit === 'BILLION' || unit === 'مليار') return Math.round(num * 1_000_000_000);
    return Math.round(num);
  };

  // Format number into clean compact form (e.g. 1.2M, 45.3K)
  const formatCompactCount = (n?: number): string => {
    if (!n || isNaN(n) || n <= 0) return '0';
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return n.toLocaleString('en-US');
  };

  // Helper to extract rich metadata from a YouTube watch page HTML string
  const parseWatchPageHtml = (html: string) => {
    let videoTitle = '';
    let videoDuration = '';
    let youtubeName = '';
    let youtubeAvatar = '';
    let youtubeChannelUrl = '';
    let channelId = '';
    let description = '';
    let viewCount = 0;
    let likeCount = 0;
    let commentCount = 0;
    let subscriberCount = 0;
    let subscriberCountText = '';

    // Duration
    const lenMatch = html.match(/"lengthSeconds":"(\d+)"/);
    if (lenMatch && lenMatch[1] && parseInt(lenMatch[1], 10) > 0) {
      videoDuration = formatSecondsDuration(parseInt(lenMatch[1], 10));
    } else {
      const approxMatch = html.match(/"approxDurationMs":"(\d+)"/);
      if (approxMatch && approxMatch[1] && parseInt(approxMatch[1], 10) > 0) {
        videoDuration = formatSecondsDuration(Math.round(parseInt(approxMatch[1], 10) / 1000));
      } else {
        const endTimes = [...html.matchAll(/"endTimeMs":"(\d+)"/g)]
          .map(m => parseInt(m[1], 10))
          .filter(n => !isNaN(n) && n > 0 && n < 86400000);
        if (endTimes.length > 0) {
          const maxMs = Math.max(...endTimes);
          videoDuration = formatSecondsDuration(Math.round(maxMs / 1000));
        } else {
          const durMillis = [...html.matchAll(/"durationMillis":"(\d+)"/g)]
            .map(m => parseInt(m[1], 10))
            .filter(n => !isNaN(n) && n > 0);
          if (durMillis.length > 0) {
            const totalMs = durMillis.reduce((a, b) => a + b, 0);
            if (totalMs > 1000 && totalMs < 86400000) {
              videoDuration = formatSecondsDuration(Math.round(totalMs / 1000));
            }
          }
        }
      }
    }

    // Title
    const primaryTitleMatch = html.match(/"videoPrimaryInfoRenderer":\{"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"\}/);
    if (primaryTitleMatch && primaryTitleMatch[1]) {
      try {
        videoTitle = JSON.parse(`"${primaryTitleMatch[1]}"`);
      } catch {
        videoTitle = primaryTitleMatch[1];
      }
    } else {
      const metaTitleMatch = html.match(/<meta name="title" content="([^"]+)">/);
      if (metaTitleMatch && metaTitleMatch[1]) videoTitle = metaTitleMatch[1];
    }

    // Description
    const descMatch =
      html.match(/"attributedDescription":\{"content":"((?:[^"\\]|\\.)*)"/) ||
      html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
    if (descMatch && descMatch[1]) {
      try {
        description = JSON.parse(`"${descMatch[1]}"`);
      } catch {
        description = descMatch[1].replace(/\\n/g, '\n');
      }
    }

    // Real View Count Extraction
    const viewPatterns = [
      /"viewCount":\{"videoViewCountRenderer":\{"viewCount":\{"simpleText":"([\d,]+)\s*views"/i,
      /"viewCount":\{"simpleText":"([\d,]+)\s*views"/i,
      /"viewCount":\{"simpleText":"([\d.,KMB]+)\s*views"/i,
      /"views":\{"simpleText":"([\d.,KMB]+)\s*views"/i,
      /itemprop="interactionCount"\s+content="(\d+)"/i,
      /"viewCount":"(\d+)"/,
      /"originalViewCount":"([1-9]\d*)"/
    ];
    for (const pat of viewPatterns) {
      const m = html.match(pat);
      if (m && m[1]) {
        const parsed = parseHumanNumber(m[1]);
        if (parsed > 0) {
          viewCount = parsed;
          break;
        }
      }
    }

    // Real Like Count Extraction
    const likePatterns = [
      /"iconName":"LIKE"[^}]*?"title":"([\d.,KMB]+)"/i,
      /"defaultButtonViewModel":\{"buttonViewModel":\{"iconName":"LIKE","title":"([\d.,KMB]+)"/i,
      /"label":"([\d,.]+)\s+likes"/i,
      /"accessibilityText":"like this video along with ([\d,]+) other people"/i,
      /"likeCount":(\d+)/,
      /"likeCountIfIndifferentNumber":"(\d+)"/,
      /"defaultText":\{"accessibility":\{"accessibilityData":\{"label":"([\d,]+)\s+likes"/i,
      /"toggledText":\{"accessibility":\{"accessibilityData":\{"label":"([\d,]+)\s+likes"/i
    ];
    for (const pat of likePatterns) {
      const m = html.match(pat);
      if (m && m[1]) {
        const parsed = parseHumanNumber(m[1]);
        if (parsed > 0) {
          likeCount = parsed;
          break;
        }
      }
    }

    // Real Comment Count Extraction
    const commentPatterns = [
      /"engagementPanelTitleHeaderRenderer":\{"title":\{"runs":\[\{"text":"Comments"\}\]\},"contextualInfo":\{"runs":\[\{"text":"([\d.,KMB]+)"\}\]/i,
      /"commentCount":\{"simpleText":"([\d.,KMB]+)"\}/i,
      /"commentsEntryPointHeaderRenderer":\{.*?"commentCount":\{"simpleText":"([\d.,KMB]+)"\}/i,
      /"countText":\{"runs":\[\{"text":"([\d,]+)"\},\{"text":"\s*Comments"\}\]/i
    ];
    for (const pat of commentPatterns) {
      const m = html.match(pat);
      if (m && m[1]) {
        const parsed = parseHumanNumber(m[1]);
        if (parsed > 0) {
          commentCount = parsed;
          break;
        }
      }
    }

    // Real Subscriber Count Extraction
    const subMatch =
      html.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"\}\},"simpleText":"([^"]+)"\}/) ||
      html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"\}/) ||
      html.match(/"subscriberCountText":\{"runs":\[\{"text":"([^"]+)"\}/);
    if (subMatch) {
      const rawSub = subMatch[2] || subMatch[1] || '';
      const cleanSub = rawSub.replace(/subscribers|subscriber|مشترك|مشتركين/gi, '').trim();
      subscriberCount = parseHumanNumber(cleanSub);
      subscriberCountText = formatCompactCount(subscriberCount) !== '0' ? formatCompactCount(subscriberCount) : cleanSub;
    }

    // Channel Owner Info
    const ownerNameMatch = html.match(/"videoOwnerRenderer":\{.*?"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/);
    if (ownerNameMatch && ownerNameMatch[1]) {
      try {
        youtubeName = JSON.parse(`"${ownerNameMatch[1]}"`);
      } catch {
        youtubeName = ownerNameMatch[1];
      }
    }

    const ownerAvatarMatch = html.match(/"videoOwnerRenderer":\{"thumbnail":\{"thumbnails":\[\{"url":"([^"]+)"/);
    if (ownerAvatarMatch && ownerAvatarMatch[1]) {
      youtubeAvatar = ownerAvatarMatch[1].replace(/\\u0026/g, '&');
    } else {
      const yt3Match = html.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/(?:ytc\/)?[A-Za-z0-9_\-=]+(?:\=s\d+[^"\\]*)?/);
      if (yt3Match && yt3Match[0]) {
        youtubeAvatar = yt3Match[0];
      }
    }

    const chanMatch =
      html.match(/"videoOwnerRenderer":\{.*?"browseId":"(UC[a-zA-Z0-9_-]+)"/) ||
      html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/);
    if (chanMatch && chanMatch[1]) {
      channelId = chanMatch[1];
      youtubeChannelUrl = `https://www.youtube.com/channel/${channelId}?sub_confirmation=1`;
    }

    return {
      videoTitle,
      videoDuration,
      youtubeName,
      youtubeAvatar,
      youtubeChannelUrl,
      channelId,
      description,
      viewCount,
      likeCount,
      commentCount,
      subscriberCount,
      subscriberCountText
    };
  };

  // Smart YouTube Single Video Info Fetcher (Works with API Key OR keyless oEmbed + watch page extraction)
  app.get('/api/youtube/video-info', async (req, res) => {
    try {
      const videoId = (req.query.id as string || '').trim();
      const apiKey = (req.query.key as string) || process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY;

      if (!videoId) {
        return res.status(400).json({ error: 'Missing YouTube video ID' });
      }

      let videoTitle = '';
      let videoDuration = '';
      let videoThumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      let youtubeName = '';
      let youtubeAvatar = '';
      let youtubeChannelUrl = '';
      let channelId = '';
      let description = '';
      let viewCount = 0;
      let likeCount = 0;
      let commentCount = 0;
      let subscriberCount = 0;
      let subscriberCountText = '';

      // 1. Try Official YouTube Data API v3 if key is available
      if (apiKey) {
        try {
          const vUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`;
          const vRes = await fetch(vUrl);
          const vData = await vRes.json();
          if (vData.items && vData.items.length > 0) {
            const item = vData.items[0];
            videoTitle = item.snippet?.title || '';
            description = item.snippet?.description || '';
            videoDuration = formatIsoDuration(item.contentDetails?.duration);
            videoThumbnail =
              item.snippet?.thumbnails?.maxres?.url ||
              item.snippet?.thumbnails?.high?.url ||
              videoThumbnail;
            youtubeName = item.snippet?.channelTitle || '';
            channelId = item.snippet?.channelId || '';
            viewCount = parseInt(item.statistics?.viewCount || '0', 10) || 0;
            likeCount = parseInt(item.statistics?.likeCount || '0', 10) || 0;
            commentCount = parseInt(item.statistics?.commentCount || '0', 10) || 0;

            if (channelId) {
              youtubeChannelUrl = `https://www.youtube.com/channel/${channelId}?sub_confirmation=1`;
              const cUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(apiKey)}`;
              const cRes = await fetch(cUrl);
              const cData = await cRes.json();
              if (cData.items && cData.items.length > 0) {
                const cItem = cData.items[0];
                const cSnippet = cItem.snippet;
                youtubeAvatar = cSnippet?.thumbnails?.high?.url || cSnippet?.thumbnails?.default?.url || '';
                subscriberCount = parseInt(cItem.statistics?.subscriberCount || '0', 10) || 0;
                if (subscriberCount > 0) {
                  subscriberCountText = formatCompactCount(subscriberCount);
                }
              }
            }
          }
        } catch (apiErr) {
          console.warn('YouTube Data API v3 fallback triggered:', apiErr);
        }
      }

      // 2. Keyless Fallback: Use YouTube oEmbed + Public Watch Page Metadata Extraction
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
        } catch (oErr) {
          console.warn('oEmbed fetch warning:', oErr);
        }
      }

      if (!videoDuration || !youtubeAvatar || !description || !viewCount || !likeCount || !commentCount || !subscriberCount) {
        try {
          const watchRes = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&hl=en`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });
          if (watchRes.ok) {
            const html = await watchRes.text();
            const parsed = parseWatchPageHtml(html);

            if (!videoDuration && parsed.videoDuration) videoDuration = parsed.videoDuration;
            if (!videoTitle && parsed.videoTitle) videoTitle = parsed.videoTitle;
            if (!description && parsed.description) description = parsed.description;
            if (!viewCount && parsed.viewCount) viewCount = parsed.viewCount;
            if (!likeCount && parsed.likeCount) likeCount = parsed.likeCount;
            if (!commentCount && parsed.commentCount) commentCount = parsed.commentCount;
            if (!subscriberCount && parsed.subscriberCount) {
              subscriberCount = parsed.subscriberCount;
              subscriberCountText = parsed.subscriberCountText;
            }
            if (!youtubeName && parsed.youtubeName) youtubeName = parsed.youtubeName;
            if (!youtubeAvatar && parsed.youtubeAvatar) youtubeAvatar = parsed.youtubeAvatar;
            if (!channelId && parsed.channelId) channelId = parsed.channelId;
            if (!youtubeChannelUrl && parsed.youtubeChannelUrl) youtubeChannelUrl = parsed.youtubeChannelUrl;
          }
        } catch (scrapeErr) {
          console.warn('Watch page metadata fallback warning:', scrapeErr);
        }
      }

      if (!youtubeAvatar && youtubeName) {
        youtubeAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(youtubeName)}&background=ef4444&color=fff&bold=true`;
      }

      res.json({
        success: true,
        youtubeId: videoId,
        videoTitle: videoTitle || 'Video Lesson',
        videoDuration: videoDuration || '15:00',
        videoThumbnail,
        youtubeName: youtubeName || 'YouTube Creator',
        youtubeAvatar,
        youtubeChannelUrl: youtubeChannelUrl || `https://www.youtube.com/watch?v=${videoId}`,
        channelId,
        viewCount,
        likeCount,
        commentCount,
        subscriberCount,
        subscriberCountText: subscriberCountText || (subscriberCount > 0 ? formatCompactCount(subscriberCount) : ''),
        description: description ? description.slice(0, 1200) : '',
        syncedAt: Date.now()
      });
    } catch (err: any) {
      console.error('Error in /api/youtube/video-info:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch video info' });
    }
  });

  // Books API Endpoints (Persistence backup alongside Firestore)
  const booksFilePath = path.join(process.cwd(), 'src', 'data', 'books.json');
  const deletedBooksFilePath = path.join(process.cwd(), 'src', 'data', 'deleted_books.json');

  const getStoredBooks = (): any[] => {
    try {
      if (fs.existsSync(booksFilePath)) {
        const raw = fs.readFileSync(booksFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error('Error reading books.json:', e);
    }
    return [];
  };

  const saveStoredBooks = (booksList: any[]) => {
    try {
      fs.writeFileSync(booksFilePath, JSON.stringify(booksList, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing books.json:', e);
    }
  };

  const getDeletedBookIds = (): string[] => {
    try {
      if (fs.existsSync(deletedBooksFilePath)) {
        const raw = fs.readFileSync(deletedBooksFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error('Error reading deleted_books.json:', e);
    }
    return [];
  };

  const saveDeletedBookIds = (ids: string[]) => {
    try {
      fs.writeFileSync(deletedBooksFilePath, JSON.stringify(Array.from(new Set(ids)), null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing deleted_books.json:', e);
    }
  };

  app.get('/api/books', (req, res) => {
    const list = getStoredBooks();
    const deletedIds = getDeletedBookIds();
    res.json({ books: list, deletedIds });
  });

  app.post('/api/books', (req, res) => {
    const book = req.body;
    if (!book || !book.id) {
      return res.status(400).json({ error: 'Invalid book payload' });
    }
    const current = getStoredBooks();
    const idx = current.findIndex(b => b.id === book.id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...book };
    } else {
      current.unshift(book);
    }
    saveStoredBooks(current);

    // If it was previously in deletedIds, remove it from deletedIds
    const deletedIds = getDeletedBookIds();
    if (deletedIds.includes(book.id)) {
      saveDeletedBookIds(deletedIds.filter(id => id !== book.id));
    }

    res.json({ success: true, book });
  });

  app.delete('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const current = getStoredBooks();
    const filtered = current.filter(b => b.id !== id);
    saveStoredBooks(filtered);

    const deletedIds = getDeletedBookIds();
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      saveDeletedBookIds(deletedIds);
    }

    res.json({ success: true, deletedId: id });
  });

  // Private Community Posts API Endpoints (Persistence alongside Firestore)
  const communityPostsFilePath = path.join(process.cwd(), 'src', 'data', 'community_posts.json');
  const deletedCommunityPostsFilePath = path.join(process.cwd(), 'src', 'data', 'deleted_community_posts.json');
  const communityCategoriesFilePath = path.join(process.cwd(), 'src', 'data', 'community_categories.json');

  const getStoredCommunityCategories = (): any[] => {
    try {
      if (fs.existsSync(communityCategoriesFilePath)) {
        const raw = fs.readFileSync(communityCategoriesFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error('Error reading community_categories.json:', e);
    }
    return [];
  };

  const saveStoredCommunityCategories = (catsList: any[]) => {
    try {
      fs.writeFileSync(communityCategoriesFilePath, JSON.stringify(catsList, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing community_categories.json:', e);
    }
  };

  app.get('/api/community/categories', (req, res) => {
    res.json({ categories: getStoredCommunityCategories() });
  });

  app.post('/api/community/categories', (req, res) => {
    const { categories } = req.body;
    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'Invalid categories payload' });
    }
    saveStoredCommunityCategories(categories);
    res.json({ success: true, categories });
  });

  const getStoredCommunityPosts = (): any[] => {
    try {
      if (fs.existsSync(communityPostsFilePath)) {
        const raw = fs.readFileSync(communityPostsFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error('Error reading community_posts.json:', e);
    }
    return [];
  };

  const saveStoredCommunityPosts = (postsList: any[]) => {
    try {
      fs.writeFileSync(communityPostsFilePath, JSON.stringify(postsList, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing community_posts.json:', e);
    }
  };

  const getDeletedCommunityPostIds = (): string[] => {
    try {
      if (fs.existsSync(deletedCommunityPostsFilePath)) {
        const raw = fs.readFileSync(deletedCommunityPostsFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error('Error reading deleted_community_posts.json:', e);
    }
    return [];
  };

  const saveDeletedCommunityPostIds = (ids: string[]) => {
    try {
      fs.writeFileSync(deletedCommunityPostsFilePath, JSON.stringify(Array.from(new Set(ids)), null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing deleted_community_posts.json:', e);
    }
  };

  app.get('/api/community', (req, res) => {
    const list = getStoredCommunityPosts();
    const deletedIds = getDeletedCommunityPostIds();
    res.json({ posts: list.filter(p => p && !deletedIds.includes(p.id)), deletedIds });
  });

  app.post('/api/community', (req, res) => {
    const post = req.body;
    if (!post || !post.id) {
      return res.status(400).json({ error: 'Invalid community post payload' });
    }
    const current = getStoredCommunityPosts();
    const idx = current.findIndex(p => p.id === post.id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...post };
    } else {
      current.unshift(post);
    }
    saveStoredCommunityPosts(current);

    const deletedIds = getDeletedCommunityPostIds();
    if (deletedIds.includes(post.id)) {
      saveDeletedCommunityPostIds(deletedIds.filter(id => id !== post.id));
    }

    res.json({ success: true, post });
  });

  app.post('/api/community/:id/react', (req, res) => {
    const { id } = req.params;
    const { userId, reaction } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }
    const current = getStoredCommunityPosts();
    const idx = current.findIndex(p => p.id === id);
    if (idx !== -1) {
      const reactions = { ...(current[idx].reactions || {}) };
      if (!reaction) {
        delete reactions[userId];
      } else {
        reactions[userId] = reaction;
      }
      current[idx] = { ...current[idx], reactions };
      saveStoredCommunityPosts(current);
      return res.json({ success: true, post: current[idx] });
    }
    res.json({ success: true });
  });

  app.delete('/api/community/:id', (req, res) => {
    const { id } = req.params;
    const current = getStoredCommunityPosts();
    const filtered = current.filter(p => p.id !== id);
    saveStoredCommunityPosts(filtered);

    const deletedIds = getDeletedCommunityPostIds();
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      saveDeletedCommunityPostIds(deletedIds);
    }

    res.json({ success: true, deletedId: id });
  });

  app.get('/api/youtube/playlist', async (req, res) => {
    try {
      const playlistId = (req.query.id as string || '').trim();
      const apiKey = (req.query.key as string) || process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY;

      if (!playlistId) {
        return res.status(400).json({ error: 'Missing playlist id parameter' });
      }

      let playlistTitle = '';
      let playlistDescription = '';
      let videos: any[] = [];
      let channelId = '';
      let channelName = '';
      let channelAvatar = '';
      let channelUrl = '';
      let subscriberCount = 0;
      let subscriberCountText = '';

      // 1. Official YouTube Data API v3 when key is available
      if (apiKey) {
        try {
          // Fetch playlist title & description first
          try {
            const pMetaUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${encodeURIComponent(playlistId)}&key=${encodeURIComponent(apiKey)}`;
            const pMetaRes = await fetch(pMetaUrl);
            const pMetaData = await pMetaRes.json();
            if (pMetaData.items && pMetaData.items.length > 0) {
              const pSnip = pMetaData.items[0].snippet;
              playlistTitle = pSnip?.title || '';
              playlistDescription = pSnip?.description || '';
              channelId = pSnip?.channelId || channelId;
              channelName = pSnip?.channelTitle || channelName;
            }
          } catch {}

          let allItems: any[] = [];
          let nextPageToken = '';

          do {
            const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${encodeURIComponent(playlistId)}&key=${encodeURIComponent(apiKey)}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
            const ytRes = await fetch(url);
            const data = await ytRes.json();
            if (data.error) {
              break;
            }
            if (!data.items || data.items.length === 0) break;
            allItems = allItems.concat(data.items);
            nextPageToken = data.nextPageToken || '';
          } while (nextPageToken);

          if (allItems.length > 0) {
            channelId = allItems[0]?.snippet?.videoOwnerChannelId || allItems[0]?.snippet?.channelId || channelId;
            channelName = allItems[0]?.snippet?.videoOwnerChannelTitle || allItems[0]?.snippet?.channelTitle || channelName;
          }

          const chunks: any[][] = [];
          for (let i = 0; i < allItems.length; i += 50) {
            chunks.push(allItems.slice(i, i + 50));
          }

          for (const chunk of chunks) {
            const videoIds = chunk
              .map((item: any) => item.snippet?.resourceId?.videoId || item.contentDetails?.videoId)
              .filter(Boolean)
              .join(',');
            if (!videoIds) continue;

            const durUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${encodeURIComponent(videoIds)}&key=${encodeURIComponent(apiKey)}`;
            const durRes = await fetch(durUrl);
            const durData = await durRes.json();

            const detailsMap: Record<string, { duration: string; viewCount: number; likeCount: number; commentCount: number; publishedAt: string }> = {};
            if (durData.items) {
              for (const item of durData.items) {
                detailsMap[item.id] = {
                  duration: formatIsoDuration(item.contentDetails?.duration),
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
                  duration: det?.duration || '15:00',
                  viewCount: det?.viewCount || 0,
                  likeCount: det?.likeCount || 0,
                  commentCount: det?.commentCount || 0,
                  publishedAt: det?.publishedAt || item.contentDetails?.videoPublishedAt || '',
                  language: '',
                  description: item.snippet?.description ? String(item.snippet.description).slice(0, 600) : '',
                  resources: [],
                });
              }
            }
          }

          if (channelId) {
            channelUrl = `https://www.youtube.com/channel/${channelId}?sub_confirmation=1`;
            const cUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(apiKey)}`;
            const cRes = await fetch(cUrl);
            const cData = await cRes.json();
            if (cData.items && cData.items.length > 0) {
              const cItem = cData.items[0];
              channelName = cItem.snippet?.title || channelName;
              channelAvatar =
                cItem.snippet?.thumbnails?.high?.url || cItem.snippet?.thumbnails?.default?.url || '';
              subscriberCount = parseInt(cItem.statistics?.subscriberCount || '0', 10) || 0;
              if (subscriberCount > 0) {
                subscriberCountText = formatCompactCount(subscriberCount);
              }
            }
          }
        } catch (apiErr) {
          console.warn('YouTube Data API playlist warning, trying keyless fallback:', apiErr);
        }
      }

      // 2. Keyless Public Playlist Extraction Fallback (when no API Key or API quota reached)
      if (videos.length === 0) {
        try {
          const plRes = await fetch(`https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}&hl=en`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          });
          if (plRes.ok) {
            const html = await plRes.text();
            const initMatch = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
            if (initMatch && initMatch[1]) {
              const initData = JSON.parse(initMatch[1]);

              // Extract playlist title & description from header / metadata
              playlistTitle =
                initData.metadata?.playlistMetadataRenderer?.title ||
                initData.header?.pageHeaderRenderer?.pageTitle ||
                initData.microformat?.microformatDataRenderer?.title ||
                playlistTitle;
              playlistDescription =
                initData.metadata?.playlistMetadataRenderer?.description ||
                initData.microformat?.microformatDataRenderer?.description ||
                playlistDescription;

              // Extract channel details from pageHeaderViewModel if available
              try {
                const headerRows = initData.header?.pageHeaderRenderer?.content?.pageHeaderViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
                for (const row of headerRows) {
                  for (const part of row.metadataParts || []) {
                    const avStack = part.avatarStack?.avatarStackViewModel;
                    if (avStack) {
                      const rawAuthor = avStack.text?.content || '';
                      if (rawAuthor && !channelName) {
                        channelName = rawAuthor.replace(/^by\s+/i, '').trim();
                      }
                      const avSrc = avStack.avatars?.[0]?.avatarViewModel?.image?.sources?.[0]?.url;
                      if (avSrc && !channelAvatar) {
                        channelAvatar = avSrc;
                      }
                      const bId =
                        avStack.rendererContext?.commandContext?.onTap?.innertubeCommand?.browseEndpoint?.browseId ||
                        avStack.text?.commandRuns?.[0]?.onTap?.innertubeCommand?.browseEndpoint?.browseId;
                      if (bId && !channelId) {
                        channelId = bId;
                        channelUrl = `https://www.youtube.com/channel/${bId}?sub_confirmation=1`;
                      }
                    }
                  }
                }
              } catch {}

              const seenIds = new Set<string>();

              // Recursive walker for modern lockupViewModel and legacy playlistVideoRenderer
              const walkPlaylistNodes = (node: any) => {
                if (!node || typeof node !== 'object') return;

                // Modern YouTube Playlist Item: lockupViewModel
                if (node.lockupViewModel && node.lockupViewModel.contentId) {
                  const lvm = node.lockupViewModel;
                  const vId = String(lvm.contentId || '').trim();
                  if (vId && vId.length === 11 && !seenIds.has(vId)) {
                    const vTitle = lvm.metadata?.lockupMetadataViewModel?.title?.content || 'Video Lesson';
                    if (vTitle !== 'Private video' && vTitle !== 'Deleted video') {
                      seenIds.add(vId);

                      // Duration badge
                      let vDur = '15:00';
                      const overlays = lvm.contentImage?.thumbnailViewModel?.overlays || [];
                      for (const ov of overlays) {
                        const badges = ov.thumbnailBottomOverlayViewModel?.badges || [];
                        for (const b of badges) {
                          if (b.thumbnailBadgeViewModel?.text && /\d+:\d+/.test(b.thumbnailBadgeViewModel.text)) {
                            vDur = b.thumbnailBadgeViewModel.text.trim();
                            break;
                          }
                        }
                      }

                      // Views & Channel info from metadataRows
                      let vViews = 0;
                      const rows = lvm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
                      for (const r of rows) {
                        for (const p of r.metadataParts || []) {
                          const txt = p.text?.content || '';
                          const a11y = p.accessibilityLabel || '';
                          if (
                            p.leadingIcon?.name === 'PLAY_ARROW_OUTLINED' ||
                            /views|مشاهدة/i.test(a11y) ||
                            /views|مشاهدة/i.test(txt)
                          ) {
                            const parsedV = parseHumanNumber(txt || a11y);
                            if (parsedV > 0) vViews = parsedV;
                          }
                          const browseEp = p.text?.commandRuns?.[0]?.onTap?.innertubeCommand?.browseEndpoint;
                          if (browseEp?.browseId && !channelId) {
                            channelId = browseEp.browseId;
                            channelUrl = `https://www.youtube.com/channel/${channelId}?sub_confirmation=1`;
                          }
                          if (browseEp && txt && !channelName) {
                            channelName = txt;
                          }
                        }
                      }

                      // Fallback channel avatar & ID from decoratedAvatarViewModel
                      const decAv = lvm.metadata?.lockupMetadataViewModel?.image?.decoratedAvatarViewModel;
                      if (decAv) {
                        const avUrl = decAv.avatar?.avatarViewModel?.image?.sources?.[0]?.url;
                        if (avUrl && !channelAvatar) channelAvatar = avUrl;
                        const bId = decAv.rendererContext?.commandContext?.onTap?.innertubeCommand?.browseEndpoint?.browseId;
                        if (bId && !channelId) {
                          channelId = bId;
                          channelUrl = `https://www.youtube.com/channel/${channelId}?sub_confirmation=1`;
                        }
                      }

                      videos.push({
                        id: `v_${vId}`,
                        title: vTitle,
                        youtubeId: vId,
                        duration: vDur,
                        viewCount: vViews,
                        likeCount: 0,
                        commentCount: 0,
                        language: '',
                        description: '',
                        resources: [],
                      });
                    }
                  }
                  return;
                }

                // Classic YouTube Playlist Item: playlistVideoRenderer
                if (node.playlistVideoRenderer && node.playlistVideoRenderer.videoId) {
                  const pvr = node.playlistVideoRenderer;
                  const vId = String(pvr.videoId || '').trim();
                  if (vId && !seenIds.has(vId)) {
                    const vTitle = pvr.title?.runs?.[0]?.text || pvr.title?.simpleText || 'Video Lesson';
                    if (vTitle !== 'Private video' && vTitle !== 'Deleted video') {
                      seenIds.add(vId);
                      const vDur = pvr.lengthText?.simpleText || pvr.lengthText?.runs?.[0]?.text || '15:00';
                      const rawViews = pvr.videoInfo?.runs?.[0]?.text || '';
                      const vViews = parseHumanNumber(rawViews);
                      if (!channelName && pvr.shortBylineText?.runs?.[0]?.text) {
                        channelName = pvr.shortBylineText.runs[0].text;
                      }
                      const bId = pvr.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
                      if (bId && !channelId) {
                        channelId = bId;
                        channelUrl = `https://www.youtube.com/channel/${channelId}?sub_confirmation=1`;
                      }
                      videos.push({
                        id: `v_${vId}`,
                        title: vTitle,
                        youtubeId: vId,
                        duration: vDur,
                        viewCount: vViews,
                        likeCount: 0,
                        commentCount: 0,
                        language: '',
                        description: '',
                        resources: [],
                      });
                    }
                  }
                  return;
                }

                for (const key of Object.keys(node)) {
                  walkPlaylistNodes(node[key]);
                }
              };

              walkPlaylistNodes(initData.contents);

              // Enrich up to the first 5 videos in parallel via watch page to get real likeCount, commentCount, exact viewCount, and channel subscriberCount
              if (videos.length > 0) {
                const sampleCount = Math.min(videos.length, 5);
                const sampleIndices = Array.from({ length: sampleCount }, (_, i) => i);
                await Promise.all(
                  sampleIndices.map(async (idx) => {
                    try {
                      const targetVid = videos[idx];
                      const watchRes = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(targetVid.youtubeId)}&hl=en`, {
                        headers: {
                          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                          'Accept-Language': 'en-US,en;q=0.9',
                        },
                      });
                      if (watchRes.ok) {
                        const wHtml = await watchRes.text();
                        const parsed = parseWatchPageHtml(wHtml);
                        if (parsed.viewCount > 0) targetVid.viewCount = parsed.viewCount;
                        if (parsed.likeCount > 0) targetVid.likeCount = parsed.likeCount;
                        if (parsed.commentCount > 0) targetVid.commentCount = parsed.commentCount;
                        if ((!targetVid.duration || targetVid.duration === '15:00' || targetVid.duration === '00:00') && parsed.videoDuration) {
                          targetVid.duration = parsed.videoDuration;
                        }
                        if (!targetVid.description && parsed.description) {
                          targetVid.description = parsed.description.slice(0, 600);
                        }
                        if (idx === 0) {
                          if (parsed.subscriberCount > 0) {
                            subscriberCount = parsed.subscriberCount;
                            subscriberCountText = parsed.subscriberCountText || formatCompactCount(parsed.subscriberCount);
                          }
                          if (parsed.youtubeAvatar) channelAvatar = parsed.youtubeAvatar;
                          if (parsed.channelId) {
                            channelId = parsed.channelId;
                            channelUrl = parsed.youtubeChannelUrl || `https://www.youtube.com/channel/${parsed.channelId}?sub_confirmation=1`;
                          }
                          if (parsed.youtubeName && !channelName) {
                            channelName = parsed.youtubeName;
                          }
                        }
                      }
                    } catch {}
                  })
                );

                // For remaining videos in large playlists that weren't individually scraped (idx >= 5),
                // estimate their likes/comments proportionally from the enriched sample's engagement ratio if they have viewCount > 0
                if (videos.length > 5) {
                  const enrichedVids = videos.slice(0, 5).filter(v => v.viewCount > 0 && v.likeCount > 0);
                  if (enrichedVids.length > 0) {
                    const sampleViews = enrichedVids.reduce((s, v) => s + v.viewCount, 0);
                    const sampleLikes = enrichedVids.reduce((s, v) => s + v.likeCount, 0);
                    const sampleComments = enrichedVids.reduce((s, v) => s + v.commentCount, 0);
                    const likeRatio = sampleViews > 0 ? sampleLikes / sampleViews : 0.025;
                    const commentRatio = sampleViews > 0 ? sampleComments / sampleViews : 0.0015;
                    for (let i = 5; i < videos.length; i++) {
                      if (videos[i].viewCount > 0) {
                        if (!videos[i].likeCount) {
                          videos[i].likeCount = Math.max(1, Math.round(videos[i].viewCount * likeRatio));
                        }
                        if (!videos[i].commentCount && sampleComments > 0) {
                          videos[i].commentCount = Math.max(1, Math.round(videos[i].viewCount * commentRatio));
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (scrapeErr) {
          console.warn('Keyless playlist scrape fallback warning:', scrapeErr);
        }
      }

      if (videos.length === 0) {
        return res.status(400).json({
          error: 'Could not extract videos from this playlist. Make sure the playlist is Public.',
        });
      }

      // Calculate total playlist metrics
      const totalViews = videos.reduce((acc, v) => acc + (v.viewCount || 0), 0);
      const totalLikes = videos.reduce((acc, v) => acc + (v.likeCount || 0), 0);
      const totalComments = videos.reduce((acc, v) => acc + (v.commentCount || 0), 0);

      res.json({
        success: true,
        playlistId,
        playlistTitle,
        playlistDescription,
        videos,
        channelId,
        channelName,
        channelAvatar,
        channelUrl,
        subscriberCount,
        subscriberCountText: subscriberCountText || (subscriberCount > 0 ? formatCompactCount(subscriberCount) : ''),
        totalViews,
        totalLikes,
        totalComments,
        syncedAt: Date.now(),
      });
    } catch (err: any) {
      console.error('Server YouTube playlist fetch error:', err);
      res.status(500).json({ error: err.message || 'Server error fetching playlist' });
    }
  });

  // Dynamic SEO: /robots.txt and /sitemap.xml for Google Search Console & Crawlers
  const getBaseOrigin = (req: any) => {
    if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'skilliq1337school.vercel.app';
    return `${proto}://${host}`;
  };

  app.get('/robots.txt', (req, res) => {
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

  app.get('/sitemap.xml', (req, res) => {
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

    const courseMap = new Map<string, any>();
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

    const pathIds = new Set<string>([
      'frontend-master',
      'cyber-security-expert',
      'web-mobile-ar',
      'ai-marketing-ar',
      'design-3d-ar'
    ]);

    const creators = new Set<string>();

    try {
      const backupPath = path.join(process.cwd(), 'public', 'nexa-full-backup.json');
      if (fs.existsSync(backupPath)) {
        const raw = fs.readFileSync(backupPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.courses)) {
          parsed.courses.forEach((c: any) => {
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
          parsed.learningPaths.forEach((p: any) => {
            if (p?.id) pathIds.add(String(p.id));
          });
        }
      }
    } catch (e) {
      console.warn('Sitemap backup read warning:', e);
    }

    const escapeXml = (str: string) =>
      String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const urlsXml: string[] = [];

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
