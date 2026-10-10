export interface VideoResource {
  title: string;
  url: string;
  logoUrl?: string; // For tools like VS Code, etc.
}

export interface Video {
  id: string;
  title: string;
  duration: string;
  youtubeId: string;
  description?: string;
  language?: string;
  resources?: VideoResource[];
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  publishedAt?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  professorName?: string;
  youtubeChannelName?: string;
  instructorAvatar?: string;
  instructorUrl?: string;
  channelId?: string;
  subscriberCount?: number;
  subscriberCountText?: string;
  playlistId?: string;
  totalViews?: number;
  totalLikes?: number;
  totalComments?: number;
  lastSyncedAt?: number;
  difficulty?: string;
  thumbnail: string;
  category: string;
  subCategory?: string;
  isSingleVideo?: boolean;
  isProject?: boolean;
  language?: string;
  isApproved?: boolean;
  resources?: VideoResource[];
  videos: Video[];
  createdAt?: number;
}

export interface Category {
  name: string;
  subCategories: string[];
}

export const categories: Category[] = [
  { name: "All", subCategories: [] },
  { name: "Web Development", subCategories: ["Frontend", "Backend", "Fullstack"] },
  { name: "Programming", subCategories: ["JavaScript", "Python", "C++"] },
  { name: "Design", subCategories: ["UI/UX", "CSS", "Graphic Design"] },
  { name: "Cyber Security", subCategories: ["Networking", "Ethical Hacking", "Certifications"] }
];

export interface LearningPathRoadmapResource {
  title: string;
  url: string;
  type?: 'tool' | 'doc' | 'repo' | 'article' | 'video' | 'other';
  logoUrl?: string;
}

export interface LearningPathRoadmapStep {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  durationEstimate?: string;
  imageUrl?: string;
  linkedCourseId?: string;
  skills?: string[];
  tools?: LearningPathRoadmapResource[];
  resources?: LearningPathRoadmapResource[];
}

export interface LearningPathGraphicRoadmap {
  enabled?: boolean;
  defaultExpanded?: boolean;
  title?: string;
  subtitle?: string;
  overviewText?: string;
  diagramImageUrl?: string;
  essentialTools?: LearningPathRoadmapResource[];
  globalResources?: LearningPathRoadmapResource[];
  steps?: LearningPathRoadmapStep[];
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  courseIds: string[];
  icon: string;
  iconUrl?: string;
  language?: string;
  graphicRoadmap?: LearningPathGraphicRoadmap;
  createdAt?: number;
}

  // Notification System
  export interface AppNotificationLink {
    label: string;
    url: string;
    logo?: string;
  }

  export interface AppNotification {
    id: string;
    title: string;
    titleAr?: string;
    message: string;
    messageAr?: string;
    type?: string;
    image?: string;
    link?: string;
    linkLogo?: string;
    actionLabel?: string;
    actionLabelAr?: string;
    links?: AppNotificationLink[];
    createdAt: number;
    isActive: boolean;
    targetUserId?: string;
    targetEmail?: string;
    videoId?: string;
    courseId?: string;
  }
  
  export interface CourseReport {
    id: string;
    type: 'broken_video' | 'content_issue' | 'general_bug';
    courseId: string;
    courseTitle: string;
    videoId: string;
    videoTitle: string;
    youtubeId: string;
    userId: string;
    userName: string;
    userEmail?: string;
    status: 'pending' | 'resolved';
    createdAt: number;
    categoryId?: string;
    issue?: string;
    details?: string;
    resolvedAt?: number;
    resolvedBy?: string;
    resolutionNotes?: string;
  }
  
  export type BannerPlacement = 'home-hero' | 'home-middle' | 'home-bottom' | 'course-sidebar' | 'course-bottom';

  export interface Book {
    id: string;
    title: string;
    author: string;
    description: string;
    category: string;
    subCategory?: string;
    coverImage: string;
    // Primary / English Video Explanation
    youtubeUrl: string;
    youtubeId: string;
    videoTitle?: string;
    videoThumbnail?: string;
    videoDuration: string;
    youtubeName: string;
    youtubeAvatar: string;
    youtubeChannelUrl?: string;
    // Arabic Video Explanation (Optional 2nd link for Arabic version)
    youtubeUrlAr?: string;
    youtubeIdAr?: string;
    videoTitleAr?: string;
    videoThumbnailAr?: string;
    videoDurationAr?: string;
    youtubeNameAr?: string;
    youtubeAvatarAr?: string;
    youtubeChannelUrlAr?: string;
    // Buy Links for EN and AR versions
    buyUrl?: string;
    buyUrlAr?: string;
    language?: string;
    keyTakeaways?: string[];
    isApproved?: boolean;
    createdAt?: number;
  }

  export const defaultBooks: Book[] = [];

  export interface AdBannerData {
    id: string;
    placement: BannerPlacement;
    desktopImageUrl: string;
    mobileImageUrl: string;
    targetUrl: string;
    language?: 'en' | 'ar' | 'all';
    isActive: boolean;
    createdAt: number;
  }
  
  export const defaultBanners: AdBannerData[] = [
    {
      id: "default-banner-hero",
      placement: "home-hero",
      desktopImageUrl: "https://blogger.googleusercontent.com/img/a/AVvXsEjvKO51qmORWNQeRzbG0U66BuGMMlWmMsA344VdhJ8V3JcioC2XrW66Z3kGy4HQMsosM0LgGjCkVJ8NpZ1VIqQIz-mCNWf2jiDCevjoyxhPdqA6XP2XHfgLGCu8RoW85ZbirIllNSaBFZtKZ6z3-HWvKg8LZQxSlaU80PE4nVwUPB9b4feyPJjzjDMUZhVF",
      mobileImageUrl: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEis_fA71Qn7M3Wf_EHTj4A-Dqun-QW8Z2G-gX7Q2HjD-M_h7qT9-TK0TBxqOZgGl5eCoALki-Zuz-YEhFXcxsVXK-F1cHpVOy5CCz/s1600/Untitled-3.png",
      targetUrl: "https://nexa1337.github.io/digitalstore",
      language: 'all',
      isActive: true,
      createdAt: Date.now()
    },
    {
      id: "default-banner-middle",
      placement: "home-middle",
      desktopImageUrl: "https://blogger.googleusercontent.com/img/a/AVvXsEg0zMrZ22tyGW-aXpu2FAjvrfTlqRz699E3AMMRvV1z26qjt1QZTk45h6pPUhWEzmBW-AmKnKGnEg8qanKwtoP76u8qxQoXjCb91OBqZbQLsr4zRM9WUpBr9w5iGZL668__-C8S7LDj-0nfljMmyL9NLQuKMYsCwPcjtfqbuHF8sbOsKoeyNC-kkXOQ5wnl",
      mobileImageUrl: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjD96N8hkeoib7OrzYw5DlfIhpkSjPySH4xy3R2_4NL6pbcN_zAGHK6Wg/s1600/Untitled-5.png",
      targetUrl: "https://linktr.ee/nexa1337",
      language: 'all',
      isActive: true,
      createdAt: Date.now()
    }
  ];

  export const learningPaths: LearningPath[] = [
  {
    id: "frontend-master",
    title: "Frontend Developer Path",
    description: "Master the fundamentals of frontend web development from HTML to React.",
    courseIds: ["html-crash-course", "css-grid", "javascript-basics", "react-basics"],
    icon: "Code",
    graphicRoadmap: {
      enabled: true,
      defaultExpanded: true,
      title: "Frontend Engineering Interactive Roadmap",
      subtitle: "Your distraction-free visual guide: exact sequence, required tools, official docs, and milestones from zero to job-ready Frontend Engineer.",
      overviewText: "Follow this interactive roadmap step-by-step alongside the video playlists below. Before jumping into frameworks, make sure your local coding environment is configured and master each stage in sequence.",
      essentialTools: [
        { title: "VS Code Editor", url: "https://code.visualstudio.com/", type: "tool", logoUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg" },
        { title: "Node.js (LTS)", url: "https://nodejs.org/", type: "tool", logoUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" },
        { title: "Git & GitHub", url: "https://github.com/", type: "tool", logoUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" },
        { title: "Chrome DevTools", url: "https://developer.chrome.com/docs/devtools", type: "tool", logoUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/chrome/chrome-original.svg" }
      ],
      globalResources: [
        { title: "MDN Web Docs (Official Reference)", url: "https://developer.mozilla.org/", type: "doc" },
        { title: "Frontend Mentor (Real-World Practice)", url: "https://www.frontendmentor.io/", type: "other" },
        { title: "Can I Use (Browser Support Tables)", url: "https://caniuse.com/", type: "doc" }
      ],
      steps: [
        {
          id: "step_html_foundations",
          title: "Semantic HTML5 & Web Architecture",
          subtitle: "Stage 1 · Core Structure & Accessibility",
          description: "Understand how browsers parse HTML, structure semantic documents, build accessible forms, and apply SEO best practices before writing a single line of styling.",
          durationEstimate: "Week 1",
          linkedCourseId: "html-crash-course",
          skills: ["Semantic Tags", "Forms & Validation", "DOM Tree", "Web Accessibility (A11y)", "SEO Meta Tags"],
          tools: [
            { title: "Live Server Extension", url: "https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer", type: "tool" },
            { title: "W3C Markup Validator", url: "https://validator.w3.org/", type: "tool" }
          ],
          resources: [
            { title: "MDN HTML5 Reference Guide", url: "https://developer.mozilla.org/en-US/docs/Web/HTML", type: "doc" },
            { title: "HTML5 Semantic Elements Cheatsheet", url: "https://web.dev/learn/html/", type: "article" }
          ]
        },
        {
          id: "step_css_layouts",
          title: "Modern CSS3, Flexbox & CSS Grid Systems",
          subtitle: "Stage 2 · Responsive Layouts & Visual Polish",
          description: "Master the Box Model, positioning, Flexbox 1D alignments, and 2D CSS Grid layouts to craft fluid interfaces that adapt to mobile, tablet, and desktop screens.",
          durationEstimate: "Weeks 2–3",
          linkedCourseId: "css-grid",
          skills: ["Box Model", "Flexbox", "CSS Grid", "Media Queries", "CSS Variables", "Transitions"],
          tools: [
            { title: "Figma (Free Dev Mode)", url: "https://www.figma.com/", type: "tool", logoUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg" },
            { title: "Tailwind CSS Play", url: "https://play.tailwindcss.com/", type: "tool" }
          ],
          resources: [
            { title: "CSS-Tricks Complete Guide to Grid", url: "https://css-tricks.com/snippets/css/complete-guide-grid/", type: "article" },
            { title: "Flexbox Froggy Interactive Game", url: "https://flexboxfroggy.com/", type: "other" }
          ]
        },
        {
          id: "step_js_logic",
          title: "JavaScript (ES6+), DOM Manipulation & Async APIs",
          subtitle: "Stage 3 · Interactive Programming & Data Fetching",
          description: "Bring pages to life with variables, functions, array methods, DOM events, Fetch API, Promises, and Async/Await for dynamic client-side logic.",
          durationEstimate: "Weeks 4–6",
          linkedCourseId: "javascript-basics",
          skills: ["ES6+ Syntax", "DOM Events", "Array Methods", "Fetch API & JSON", "Async / Await", "LocalStorage"],
          tools: [
            { title: "Console & Network Inspector", url: "https://developer.chrome.com/docs/devtools/console", type: "tool" },
            { title: "Postman / Hoppscotch API Tester", url: "https://hoppscotch.io/", type: "tool" }
          ],
          resources: [
            { title: "JavaScript.info Modern Tutorial", url: "https://javascript.info/", type: "doc" },
            { title: "You Don't Know JS (Open Book)", url: "https://github.com/getify/You-Dont-Know-JS", type: "repo" }
          ]
        },
        {
          id: "step_react_apps",
          title: "React.js, Component Architecture & State Management",
          subtitle: "Stage 4 · Production Single-Page Applications",
          description: "Build scalable modular web applications with React components, Hooks (useState, useEffect), client-side routing, and deployment to production.",
          durationEstimate: "Weeks 7–10",
          linkedCourseId: "react-basics",
          skills: ["JSX & Components", "Props & State", "React Hooks", "React Router", "Vite Bundler", "Vercel Deployment"],
          tools: [
            { title: "Vite Build Tool", url: "https://vitejs.dev/", type: "tool" },
            { title: "React Developer Tools", url: "https://react.dev/learn/react-developer-tools", type: "tool", logoUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" }
          ],
          resources: [
            { title: "Official React.dev Interactive Docs", url: "https://react.dev/learn", type: "doc" },
            { title: "Vercel Free Frontend Hosting", url: "https://vercel.com/", type: "tool" }
          ]
        }
      ]
    }
  },
  {
    id: "cyber-security-expert",
    title: "Cyber Security Expert",
    description: "Master the fundamentals of networking, programming, and ethical hacking to become a Cyber Security Expert.",
    courseIds: ["network-basics", "comptia-a-plus", "python-for-security", "ceh-prep"],
    icon: "Shield"
  },
  {
    id: "web-mobile-ar",
    title: "مسار تطوير الويب وتطبيقات الموبايل",
    description: "تعلم بناء المواقع وتطبيقات الهواتف الذكية من الصفر باستخدام ووردبريس وفلاتر ودارت باحترافية.",
    courseIds: ["ipkxu", "l02pbl"],
    icon: "Code",
    graphicRoadmap: {
      enabled: true,
      defaultExpanded: true,
      title: "خريطة الطريق التفاعلية لتطوير الويب وتطبيقات الموبايل",
      subtitle: "دليلك العملي خطوة بخطوة: التسلسل الصحيح للتعلم، الأدوات والبرامج المطلوبة، والروابط الرسمية بدون تشتت.",
      overviewText: "اتبع هذه الخريطة التفاعلية بالترتيب مع قوائم التشغيل بالأسفل. ابدأ بتجهيز بيئة العمل الأساسية ثم انتقل من أساسيات بناء المواقع إلى برمجة تطبيقات الهواتف الذكية باستخدام Flutter & Dart.",
      essentialTools: [
        { title: "محرر الأكواد VS Code", url: "https://code.visualstudio.com/", type: "tool", logoUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg" },
        { title: "حزمة تطوير Flutter SDK", url: "https://docs.flutter.dev/get-started/install", type: "tool", logoUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg" },
        { title: "بيئة Android Studio", url: "https://developer.android.com/studio", type: "tool", logoUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/androidstudio/androidstudio-original.svg" },
        { title: "Git & GitHub", url: "https://github.com/", type: "tool", logoUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" }
      ],
      globalResources: [
        { title: "التوثيق الرسمي لـ Flutter", url: "https://docs.flutter.dev/", type: "doc" },
        { title: "مرجع لغة البرمجة Dart", url: "https://dart.dev/guides", type: "doc" },
        { title: "مكتبة حزم وإضافات pub.dev", url: "https://pub.dev/", type: "other" }
      ],
      steps: [
        {
          id: "ar_step_web_cms",
          title: "تأسيس وبناء المواقع الاحترافية وإدارة المحتوى",
          subtitle: "المرحلة 1 · هيكلة المواقع والاستضافة وتخصيص القوالب",
          description: "تعلم كيفية إعداد بيئة الاستضافة المحلية، وتنصيب وإدارة المواقع خطوة بخطوة، وتخصيص الواجهات والأداء لتكون جاهزة للنشر.",
          durationEstimate: "الأسبوع 1–2",
          linkedCourseId: "ipkxu",
          skills: ["إعداد الاستضافة", "هيكلة الصفحات", "تخصيص القوالب", "تحسين السرعة و SEO"],
          tools: [
            { title: "LocalWP (بيئة ووردبريس محلية)", url: "https://localwp.com/", type: "tool" },
            { title: "أدوات مطوري المتصفح DevTools", url: "https://developer.chrome.com/docs/devtools", type: "tool" }
          ],
          resources: [
            { title: "دليل مطوري ووردبريس الرسمي", url: "https://developer.wordpress.org/", type: "doc" }
          ]
        },
        {
          id: "ar_step_flutter_mobile",
          title: "احتراف برمجة تطبيقات الموبايل باستخدام Flutter و Dart",
          subtitle: "المرحلة 2 · بناء تطبيقات أندرويد و iOS بكود برمجي واحد",
          description: "إتقان أساسيات لغة Dart والبرمجة الكائنية، ثم بناء واجهات المستخدم التفاعلية في Flutter وربط التطبيقات بقواعد البيانات والواجهات البرمجية APIs.",
          durationEstimate: "الأسبوع 3–8",
          linkedCourseId: "l02pbl",
          skills: ["أساسيات لغة Dart", "Flutter Widgets", "إدارة الحالة State Management", "التعامل مع REST APIs"],
          tools: [
            { title: "DartPad (تجربة الكود مباشرة بالمتصفح)", url: "https://dartpad.dev/", type: "tool" },
            { title: "Flutter SDK", url: "https://flutter.dev/", type: "tool" }
          ],
          resources: [
            { title: "كتالوج عناصر واجهة Flutter الرسمي", url: "https://docs.flutter.dev/ui/widgets", type: "doc" },
            { title: "تطبيقات ومشاريع Flutter مفتوحة المصدر", url: "https://flutter.dev/showcase", type: "article" }
          ]
        }
      ]
    }
  },
  {
    id: "ai-marketing-ar",
    title: "مسار الذكاء الاصطناعي والتسويق الرقمي",
    description: "احترف أتمتة الأعمال باستخدام N8N وإدارة الحملات الإعلانية الممولة والميديا باينج مع الذكاء الاصطناعي.",
    courseIds: ["4ptzav", "312ar"],
    icon: "Zap"
  },
  {
    id: "design-3d-ar",
    title: "مسار التصميم الإبداعي والنمذجة ثلاثية الأبعاد",
    description: "إتقان تصميم واجهات المستخدم والأنظمة المرئية بالذكاء الاصطناعي والتصميم المعماري مع سكتش آب.",
    courseIds: ["m1pdcj", "glpr5t"],
    icon: "Layout"
  }
];

export const courses: Course[] = [
  {
    id: "html-crash-course",
    title: "HTML Crash Course For Absolute Beginners",
    description: "Learn HTML5 from scratch in this comprehensive crash course. We will look at all of the common HTML tags and how to structure an HTML page.",
    instructor: "Traversy Media",
    instructorAvatar: "https://yt3.googleusercontent.com/ytc/AIdro_kX44Y3P6I3k4m48D1t2G4E_b4-r4q1Zz_i1R8v8A=s176-c-k-c0x00ffffff-no-rj",
    instructorUrl: "https://www.youtube.com/@TraversyMedia",
    thumbnail: "https://img.youtube.com/vi/UB1O30fR-EE/maxresdefault.jpg",
    category: "Web Development",
    subCategory: "Frontend",
    videos: [
      {
        id: "v1",
        title: "Introduction & Setup",
        duration: "10:00",
        youtubeId: "UB1O30fR-EE",
      },
      {
        id: "v2",
        title: "Basic HTML Structure",
        duration: "15:30",
        youtubeId: "pQN-pnXPaVg",
      },
      {
        id: "v3",
        title: "Headings, Paragraphs & Typography",
        duration: "12:45",
        youtubeId: "kGMHKB1-N9M",
      },
      {
        id: "v4",
        title: "Links, Images & Attributes",
        duration: "20:10",
        youtubeId: "MDLn5-zSQQI",
      }
    ]
  },
  {
    id: "react-basics",
    title: "React JS Crash Course",
    description: "Get started with React in this crash course. We will be building a task tracker app and look at components, props, state, hooks, etc.",
    instructor: "Traversy Media",
    instructorAvatar: "https://yt3.googleusercontent.com/ytc/AIdro_kX44Y3P6I3k4m48D1t2G4E_b4-r4q1Zz_i1R8v8A=s176-c-k-c0x00ffffff-no-rj",
    instructorUrl: "https://www.youtube.com/@TraversyMedia",
    thumbnail: "https://img.youtube.com/vi/w7ejDZ8SWv8/maxresdefault.jpg",
    category: "Web Development",
    subCategory: "Frontend",
    videos: [
      {
        id: "r1",
        title: "What is React?",
        duration: "5:00",
        youtubeId: "w7ejDZ8SWv8",
      },
      {
        id: "r2",
        title: "Environment Setup",
        duration: "8:20",
        youtubeId: "Ke90Tje7VS0",
      },
      {
        id: "r3",
        title: "Components & Props",
        duration: "18:15",
        youtubeId: "Cla1WwguArA",
      }
    ]
  },
  {
    id: "css-grid",
    title: "CSS Grid Layout Crash Course",
    description: "Learn CSS Grid layout in this comprehensive crash course. We will cover all of the properties and build a responsive grid layout.",
    instructor: "Traversy Media",
    instructorAvatar: "https://yt3.googleusercontent.com/ytc/AIdro_kX44Y3P6I3k4m48D1t2G4E_b4-r4q1Zz_i1R8v8A=s176-c-k-c0x00ffffff-no-rj",
    instructorUrl: "https://www.youtube.com/@TraversyMedia",
    thumbnail: "https://img.youtube.com/vi/jV8B24rSN5o/maxresdefault.jpg",
    category: "Design",
    subCategory: "CSS",
    videos: [
      {
        id: "c1",
        title: "What is CSS Grid?",
        duration: "10:00",
        youtubeId: "jV8B24rSN5o",
      },
      {
        id: "c2",
        title: "Grid Container Properties",
        duration: "15:30",
        youtubeId: "0-DY8J_cjZ0",
      },
      {
        id: "c3",
        title: "Grid Item Properties",
        duration: "12:45",
        youtubeId: "t6CBKf8K_Ac",
      }
    ]
  },
  {
    id: "javascript-basics",
    title: "JavaScript Crash Course For Beginners",
    description: "Learn JavaScript from scratch in this crash course. We will cover variables, data types, arrays, objects, loops, functions, and more.",
    instructor: "Traversy Media",
    instructorAvatar: "https://yt3.googleusercontent.com/ytc/AIdro_kX44Y3P6I3k4m48D1t2G4E_b4-r4q1Zz_i1R8v8A=s176-c-k-c0x00ffffff-no-rj",
    instructorUrl: "https://www.youtube.com/@TraversyMedia",
    thumbnail: "https://img.youtube.com/vi/hdI2bqOjy3c/maxresdefault.jpg",
    category: "Programming",
    subCategory: "JavaScript",
    videos: [
      {
        id: "j1",
        title: "Introduction to JavaScript",
        duration: "10:00",
        youtubeId: "hdI2bqOjy3c",
      },
      {
        id: "j2",
        title: "Variables & Data Types",
        duration: "15:30",
        youtubeId: "zQnBQ4tB3ZA",
      },
      {
        id: "j3",
        title: "Arrays & Objects",
        duration: "12:45",
        youtubeId: "W6NZfCO5SIk",
      }
    ]
  },
  {
    id: "network-basics",
    title: "Networking Fundamentals",
    description: "Learn the basics of computer networking, IP addresses, OSI model, and more.",
    instructor: "NetworkChuck",
    instructorAvatar: "https://yt3.googleusercontent.com/ytc/AIdro_kX44Y3P6I3k4m48D1t2G4E_b4-r4q1Zz_i1R8v8A=s176-c-k-c0x00ffffff-no-rj",
    instructorUrl: "https://www.youtube.com/@NetworkChuck",
    thumbnail: "https://img.youtube.com/vi/qiQR5rTSshw/maxresdefault.jpg",
    category: "Cyber Security",
    subCategory: "Networking",
    videos: [
      {
        id: "n1",
        title: "What is a network?",
        duration: "10:00",
        youtubeId: "qiQR5rTSshw",
      }
    ]
  },
  {
    id: "comptia-a-plus",
    title: "CompTIA A+ Certification Prep",
    description: "Comprehensive guide to passing the CompTIA A+ certification.",
    instructor: "Professor Messer",
    instructorAvatar: "https://yt3.googleusercontent.com/ytc/AIdro_kX44Y3P6I3k4m48D1t2G4E_b4-r4q1Zz_i1R8v8A=s176-c-k-c0x00ffffff-no-rj",
    instructorUrl: "https://www.youtube.com/@professormesser",
    thumbnail: "https://img.youtube.com/vi/qiQR5rTSshw/maxresdefault.jpg",
    category: "Cyber Security",
    subCategory: "Certifications",
    videos: [
      {
        id: "a1",
        title: "Hardware Basics",
        duration: "15:00",
        youtubeId: "qiQR5rTSshw",
      }
    ]
  },
  {
    id: "python-for-security",
    title: "Python for Cyber Security",
    description: "Learn how to use Python to automate security tasks and build tools.",
    instructor: "HackerSploit",
    instructorAvatar: "https://yt3.googleusercontent.com/ytc/AIdro_kX44Y3P6I3k4m48D1t2G4E_b4-r4q1Zz_i1R8v8A=s176-c-k-c0x00ffffff-no-rj",
    instructorUrl: "https://www.youtube.com/@HackerSploit",
    thumbnail: "https://img.youtube.com/vi/qiQR5rTSshw/maxresdefault.jpg",
    category: "Cyber Security",
    subCategory: "Ethical Hacking",
    videos: [
      {
        id: "p1",
        title: "Python Basics for Hackers",
        duration: "20:00",
        youtubeId: "qiQR5rTSshw",
      }
    ]
  },
  {
    id: "ceh-prep",
    title: "Certified Ethical Hacker (CEH) Prep",
    description: "Prepare for the CEH certification with this comprehensive playlist.",
    instructor: "Simplilearn",
    instructorAvatar: "https://yt3.googleusercontent.com/ytc/AIdro_kX44Y3P6I3k4m48D1t2G4E_b4-r4q1Zz_i1R8v8A=s176-c-k-c0x00ffffff-no-rj",
    instructorUrl: "https://www.youtube.com/@SimplilearnOfficial",
    thumbnail: "https://img.youtube.com/vi/qiQR5rTSshw/maxresdefault.jpg",
    category: "Cyber Security",
    subCategory: "Certifications",
    videos: [
      {
        id: "ceh1",
        title: "Introduction to Ethical Hacking",
        duration: "25:00",
        youtubeId: "qiQR5rTSshw",
      }
    ]
  },
  {
    id: "full-react-course-2024",
    title: "React Course - Beginner's Tutorial for React",
    description: "A full 12+ hour React course covering everything you need to know to construct modern web applications.",
    instructor: "freeCodeCamp.org",
    thumbnail: "https://img.youtube.com/vi/bMknfKXIFA8/maxresdefault.jpg",
    category: "Web Development",
    subCategory: "Frontend",
    isSingleVideo: true,
    videos: [
      {
        id: "sv1",
        title: "Full React Tutorial",
        duration: "11:55:00",
        youtubeId: "bMknfKXIFA8",
      }
    ]
  },
  {
    id: "cyber-security-full-course",
    title: "Cyber Security Full Course for Beginners",
    description: "Learn Cyber Security in 12 Hours. A comprehensive guide to understanding networks, threats, and defense mechanisms.",
    instructor: "Edureka",
    thumbnail: "https://img.youtube.com/vi/U_P23SqJaDc/maxresdefault.jpg",
    category: "Cyber Security",
    language: "English",
    isSingleVideo: true,
    videos: [
      {
        id: "sv2",
        title: "Cyber Security Full Course",
        duration: "12:00:00",
        youtubeId: "U_P23SqJaDc",
      }
    ]
  },
  {
    id: "ipkxu",
    title: "Mastering WordPress",
    description: "كورس احتراف ووردبريس الشامل باللغة العربية لبناء وإدارة وتخصيص مواقع الويب الاحترافية والمتاجر الإلكترونية.",
    instructor: "Elzero Web School",
    instructorAvatar: "https://yt3.googleusercontent.com/ytc/AIdro_kX44Y3P6I3k4m48D1t2G4E_b4-r4q1Zz_i1R8v8A=s176-c-k-c0x00ffffff-no-rj",
    instructorUrl: "https://www.youtube.com/@ElzeroWebSchool",
    thumbnail: "https://img.youtube.com/vi/ctEAYHFcbHk/maxresdefault.jpg",
    category: "Web Development",
    subCategory: "WordPress",
    isSingleVideo: false,
    language: "Arabic",
    videos: [
      {
        id: "ipkxu_v1",
        title: "WordPress - Introduction and What Is CMS",
        duration: "14:20",
        youtubeId: "ctEAYHFcbHk"
      },
      {
        id: "ipkxu_v2",
        title: "WordPress - Install Local Server & WordPress",
        duration: "18:45",
        youtubeId: "eO23K1vA68E"
      },
      {
        id: "ipkxu_v3",
        title: "WordPress - Dashboard & General Settings",
        duration: "12:15",
        youtubeId: "8c45R0oU92Q"
      }
    ]
  },
  {
    id: "l02pbl",
    title: "Flutter & Dart Full Course",
    description: "دورة كاملة وشاملة في فلاتر ودارت لبناء تطبيقات الموبايل لنظامي أندرويد وآيفون من الصفر حتى الاحتراف.",
    instructor: "Wael abo hamza",
    instructorAvatar: "https://yt3.googleusercontent.com/ytc/AIdro_kX44Y3P6I3k4m48D1t2G4E_b4-r4q1Zz_i1R8v8A=s176-c-k-c0x00ffffff-no-rj",
    thumbnail: "https://img.youtube.com/vi/6bSP4vazmyw/maxresdefault.jpg",
    category: "Programming",
    subCategory: "Mobile",
    isSingleVideo: false,
    language: "Arabic",
    videos: [
      {
        id: "fl_v1",
        title: "1 - Flutter Course Introduction | مقدمة كورس فلاتر",
        duration: "09:30",
        youtubeId: "6bSP4vazmyw"
      },
      {
        id: "fl_v2",
        title: "2 - Flutter Setup & Android Studio | تثبيت بيئة العمل",
        duration: "15:20",
        youtubeId: "Kj_x7c9V5fM"
      }
    ]
  },
  {
    id: "312ar",
    title: "Media Buyer & Digital Ads",
    description: "كورس احتراف الميديا باينج والإعلانات الممولة وتحليل الحملات التسويقية مع سكوب.",
    instructor: "سكوب",
    instructorAvatar: "https://yt3.ggpht.com/-lEZ8TF7A7Ui_znwiJS4nJjQp6gSVuMvJ4NFMOgfpmj6jq_KxnAzlloJ8oWiayyqxVI2nCU8vdg=s800-c-k-c0x00ffffff-no-rj",
    thumbnail: "https://img.youtube.com/vi/ZeLtBaN86G8/maxresdefault.jpg",
    category: "Digital Marketing",
    subCategory: "Marketing",
    isSingleVideo: false,
    language: "Arabic",
    videos: [
      {
        id: "v1778437317088_7y7vr",
        title: "مقدمة لـ كورس الـ Media Buying | ابدأ طريقك كميديا باير",
        duration: "31:10",
        youtubeId: "ZeLtBaN86G8"
      },
      {
        id: "v1778437317088_7aqvm",
        title: "#1 يعني اي ميديا باينج؟ | معلومات مذهلة عن الميديا باينج",
        duration: "21:56",
        youtubeId: "z2bee3EDHKo"
      }
    ]
  },
  {
    id: "4ptzav",
    title: "N8N & AI Automation",
    description: "دورة بناء أنظمة الذكاء الاصطناعي والأتمتة الذكية بدون كود وباحترافية عالية.",
    instructor: "Ai bdarija | الذكاء الاصطناعي",
    instructorAvatar: "https://yt3.ggpht.com/5WWzeEVoN066innvlC3jDr_4c8RPjG9okQiIg9poOC4iiWkuyVa45T0B-QtMklQUKeVKYU9L=s176-c-k-c0x00ffffff-no-rj",
    thumbnail: "https://img.youtube.com/vi/EwfCLtjscTE/maxresdefault.jpg",
    category: "AI",
    subCategory: "Automation",
    isSingleVideo: true,
    language: "Arabic",
    videos: [
      {
        id: "v1776872772460",
        title: "N8N FULL COURSE (Build & Sell AI Automation, No code)",
        duration: "10:55:05",
        youtubeId: "EwfCLtjscTE"
      }
    ]
  },
  {
    id: "m1pdcj",
    title: "Claude Design & UI System",
    description: "دورة تصميم واجهات المستخدم والأنظمة المرئية باستخدام أحدث أدوات الذكاء الاصطناعي.",
    instructor: "Nid Academy",
    instructorAvatar: "https://yt3.googleusercontent.com/ytc/AIdro_kX44Y3P6I3k4m48D1t2G4E_b4-r4q1Zz_i1R8v8A=s176-c-k-c0x00ffffff-no-rj",
    thumbnail: "https://img.youtube.com/vi/8tT-1i_EixQ/maxresdefault.jpg",
    category: "Design",
    subCategory: "AI Design",
    isSingleVideo: true,
    language: "Arabic",
    videos: [
      {
        id: "ai_v1",
        title: "Claude AI & Modern Design Masterclass",
        duration: "1:15:00",
        youtubeId: "8tT-1i_EixQ"
      }
    ]
  },
  {
    id: "glpr5t",
    title: "SketchUp Pro 3D Design",
    description: "دورة النمذجة ثلاثية الأبعاد والتصميم المعماري الاحترافي ببرنامج سكتش آب.",
    instructor: "Almuhandis",
    instructorAvatar: "https://yt3.ggpht.com/cLnodcoRCWI0NZKmdINNLntulV1lmYqKbF_t4Qt5o0gCav-DAsZJq913COiLbw50xBmSGDrZRA=s800-c-k-c0x00ffffff-no-rj",
    thumbnail: "https://img.youtube.com/vi/oaye0GKPJIg/maxresdefault.jpg",
    category: "Design",
    subCategory: "3D",
    isSingleVideo: false,
    language: "Arabic",
    videos: [
      {
        id: "v1783278954632_cfsm1",
        title: "الدرس (1): مقدمة عن برنامج سكتش آب SketchUp",
        duration: "17:16",
        youtubeId: "oaye0GKPJIg"
      }
    ]
  },
  {
    id: "project-fullstack-saas-ai",
    title: "Build & Deploy a Full-Stack AI SaaS Platform (Next.js, Stripe & Tailwind)",
    description: "Real-world end-to-end project build: Architect, code, and deploy a complete production AI SaaS platform with authentication, Stripe subscriptions, database integration, and modern responsive UI.",
    instructor: "JavaScript Mastery",
    instructorUrl: "https://www.youtube.com/@javascriptmastery",
    thumbnail: "https://img.youtube.com/vi/Ahwoks_dawU/maxresdefault.jpg",
    category: "Web Development",
    subCategory: "Full-Stack SaaS",
    isSingleVideo: true,
    isProject: true,
    language: "English",
    createdAt: 1785000001000,
    videos: [
      {
        id: "proj_saas_v1",
        title: "Build and Deploy a Full Stack AI SaaS Application — Complete Hands-On Project",
        duration: "04:42:18",
        youtubeId: "Ahwoks_dawU"
      }
    ]
  },
  {
    id: "project-mern-ecommerce-playlist",
    title: "Build a Complete E-Commerce Store From Scratch (React, Node & MongoDB)",
    description: "Step-by-step practical project playlist: Build a real online store with product catalog, shopping cart, JWT authentication, admin dashboard, and checkout workflow.",
    instructor: "Traversy Media",
    instructorUrl: "https://www.youtube.com/@TraversyMedia",
    thumbnail: "https://img.youtube.com/vi/3d23M7gS1cE/maxresdefault.jpg",
    category: "Web Development",
    subCategory: "E-Commerce Build",
    isSingleVideo: false,
    isProject: true,
    language: "English",
    createdAt: 1785000002000,
    videos: [
      {
        id: "proj_ecom_1",
        title: "Project Architecture, UI Setup & Product Grid",
        duration: "34:15",
        youtubeId: "3d23M7gS1cE"
      },
      {
        id: "proj_ecom_2",
        title: "Shopping Cart State, Backend API & Database Models",
        duration: "41:20",
        youtubeId: "w7ejDZ8SWv8"
      },
      {
        id: "proj_ecom_3",
        title: "User Authentication, Admin Order Panel & Production Deployment",
        duration: "38:50",
        youtubeId: "Ke90Tje7VS0"
      }
    ]
  },
  {
    id: "project-ar-fullstack-web-app",
    title: "بناء مشروع موقع ومتجر متكامل من الصفر خطوة بخطوة (تطبيق عملي شامل)",
    description: "مشروع تطبيقي عملي لبناء وبرمجة موقع كامل من الصفر حتى رفعه على الاستضافة، يشمل تصميم الواجهات المتجاوبة وبرمجة الخصائص التفاعلية كاملة.",
    instructor: "Elzero Web School",
    instructorUrl: "https://www.youtube.com/@ElzeroWebSchool",
    thumbnail: "https://img.youtube.com/vi/c2M-rlkkT5o/maxresdefault.jpg",
    category: "Web Development",
    subCategory: "مشروع ويب متكامل",
    isSingleVideo: false,
    isProject: true,
    language: "Arabic",
    createdAt: 1785000003000,
    videos: [
      {
        id: "proj_ar_1",
        title: "الجزء الأول: تخطيط المشروع وبناء الهيكل الأساسي والتصميم المتجاوب",
        duration: "32:10",
        youtubeId: "c2M-rlkkT5o"
      },
      {
        id: "proj_ar_2",
        title: "الجزء الثاني: برمجة الأقسام التفاعلية، القوائم الذكية، وتحسين الأداء",
        duration: "29:45",
        youtubeId: "ctEAYHFcbHk"
      },
      {
        id: "proj_ar_3",
        title: "الجزء الثالث: مراجعة الكود النهائي ونشر المشروع الحقيقي على الإنترنت",
        duration: "26:15",
        youtubeId: "eO23K1vA68E"
      }
    ]
  },
  {
    id: "project-ar-flutter-real-app",
    title: "مشروع عملي كامل: بناء تطبيق موبايل احترافي باستخدام Flutter & Dart",
    description: "تطبيق عملي شامل في فيديو مطول لبناء تطبيق هاتف ذكي حقيقي من الصفر بواجهات احترافية وربطه بقاعدة البيانات خطوة بخطوة.",
    instructor: "Wael abo hamza",
    thumbnail: "https://img.youtube.com/vi/6bSP4vazmyw/maxresdefault.jpg",
    category: "Programming",
    subCategory: "مشروع تطبيق موبايل",
    isSingleVideo: true,
    isProject: true,
    language: "Arabic",
    createdAt: 1785000004000,
    videos: [
      {
        id: "proj_ar_fl_1",
        title: "ورشة بناء تطبيق Flutter كامل من الصفر للاحتراف (تطبيق عملي)",
        duration: "03:15:00",
        youtubeId: "6bSP4vazmyw"
      }
    ]
  }
];
