import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { OAuth2Client } from 'google-auth-library';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

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
