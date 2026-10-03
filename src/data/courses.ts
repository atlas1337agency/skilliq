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
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorAvatar?: string;
  instructorUrl?: string;
  thumbnail: string;
  category: string;
  subCategory?: string;
  isSingleVideo?: boolean;
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

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  courseIds: string[];
  icon: string;
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

  export const defaultBooks: Book[] = [
    {
      id: "book-clean-code",
      title: "Clean Code: A Handbook of Agile Software Craftsmanship",
      author: "Robert C. Martin (Uncle Bob)",
      description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Discover the core principles of writing readable, maintainable, and resilient software systems.",
      category: "Software Engineering",
      subCategory: "Architecture",
      coverImage: "/src/assets/images/book_cover_clean_code_1791050350269.jpg",
      youtubeUrl: "https://www.youtube.com/watch?v=7EmboKQH8lM",
      youtubeId: "7EmboKQH8lM",
      videoTitle: "Clean Code - Uncle Bob / Lesson 1",
      videoThumbnail: "https://img.youtube.com/vi/7EmboKQH8lM/maxresdefault.jpg",
      videoDuration: "1:48:22",
      youtubeName: "UnityCoin / Uncle Bob",
      youtubeAvatar: "https://ui-avatars.com/api/?name=Uncle+Bob&background=0284c7&color=fff&bold=true",
      youtubeChannelUrl: "https://www.youtube.com/watch?v=7EmboKQH8lM",
      buyUrl: "https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882",
      language: "English",
      keyTakeaways: [
        "Meaningful names reveal intent and eliminate mental mapping.",
        "Functions should do one thing, do it well, and do it only.",
        "Leave the campground cleaner than you found it (Boy Scout Rule)."
      ],
      isApproved: true,
      createdAt: 1710000010000
    },
    {
      id: "book-deep-work",
      title: "Deep Work: Rules for Focused Success in a Distracted World",
      author: "Cal Newport",
      description: "Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information and produce better results in less time.",
      category: "Productivity & Mindset",
      subCategory: "Focus",
      coverImage: "/src/assets/images/book_cover_deep_work_1791050383475.jpg",
      youtubeUrl: "https://www.youtube.com/watch?v=gTaJhjQHcf8",
      youtubeId: "gTaJhjQHcf8",
      videoTitle: "Deep Work by Cal Newport - Animated Book Summary",
      videoThumbnail: "https://img.youtube.com/vi/gTaJhjQHcf8/maxresdefault.jpg",
      videoDuration: "14:26",
      youtubeName: "Escaping Ordinary (B.C Marx)",
      youtubeAvatar: "https://ui-avatars.com/api/?name=Escaping+Ordinary&background=4f46e5&color=fff&bold=true",
      youtubeChannelUrl: "https://www.youtube.com/@EscapingOrdinary",
      buyUrl: "https://www.amazon.com/Deep-Work-Focused-Success-Distracted/dp/1455586692",
      language: "English",
      keyTakeaways: [
        "High-Quality Work Produced = (Time Spent) x (Intensity of Focus).",
        "Eliminate shallow context-switching and batch communication.",
        "Schedule every minute of your deep focus blocks."
      ],
      isApproved: true,
      createdAt: 1710000009000
    },
    {
      id: "book-ai-superpowers",
      title: "Designing Data-Intensive & AI Systems",
      author: "Martin Kleppmann",
      description: "The definitive guide to the big ideas behind reliable, scalable, and maintainable data and AI-ready architectures—from distributed consensus to real-time stream processing.",
      category: "AI & Future Tech",
      subCategory: "Systems",
      coverImage: "/src/assets/images/book_cover_ai_engineering_1791050361894.jpg",
      youtubeUrl: "https://www.youtube.com/watch?v=i5twVF3s8zg",
      youtubeId: "i5twVF3s8zg",
      videoTitle: "Designing Data-Intensive Applications - Full Breakdown",
      videoThumbnail: "https://img.youtube.com/vi/i5twVF3s8zg/maxresdefault.jpg",
      videoDuration: "24:15",
      youtubeName: "ByteByteGo",
      youtubeAvatar: "https://ui-avatars.com/api/?name=ByteByteGo&background=059669&color=fff&bold=true",
      youtubeChannelUrl: "https://www.youtube.com/@ByteByteGo",
      buyUrl: "https://www.amazon.com/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321",
      language: "English",
      keyTakeaways: [
        "Master replication, partitioning, and distributed transactions.",
        "Understand trade-offs between consistency, availability, and latency.",
        "Build fault-tolerant pipelines for modern AI and analytics."
      ],
      isApproved: true,
      createdAt: 1710000008000
    },
    {
      id: "book-cyber-ghost",
      title: "The Art of Invisibility & Offensive Security",
      author: "Kevin Mitnick",
      description: "The world's most famous hacker teaches you how digital footprints work, how modern cyber reconnaissance operates, and the layered security mindset required to defend critical systems.",
      category: "Cybersecurity",
      subCategory: "Privacy & Defense",
      coverImage: "/src/assets/images/book_cover_cyber_defense_1791050371723.jpg",
      youtubeUrl: "https://www.youtube.com/watch?v=fQ3W2v8V9M8",
      youtubeId: "fQ3W2v8V9M8",
      videoTitle: "Top Cybersecurity Books Every Hacker Should Read",
      videoThumbnail: "https://img.youtube.com/vi/fQ3W2v8V9M8/maxresdefault.jpg",
      videoDuration: "16:40",
      youtubeName: "NetworkChuck",
      youtubeAvatar: "https://ui-avatars.com/api/?name=NetworkChuck&background=d97706&color=fff&bold=true",
      youtubeChannelUrl: "https://www.youtube.com/@NetworkChuck",
      buyUrl: "https://www.amazon.com/Art-Invisibility-Worlds-Teaches-Brother/dp/0316380504",
      language: "English",
      keyTakeaways: [
        "Defense in depth starts with threat modeling and OPSEC.",
        "Human social engineering remains the #1 attack surface.",
        "Encrypt data in transit and at rest with zero-trust verification."
      ],
      isApproved: true,
      createdAt: 1710000007000
    },
    {
      id: "book-atomic-habits-en",
      title: "Atomic Habits: Tiny Changes, Remarkable Results",
      author: "James Clear",
      description: "An easy and proven framework for building daily engineering and learning habits—breaking bad routines and mastering the tiny behaviors that compound into extraordinary mastery.",
      category: "Productivity & Mindset",
      subCategory: "Habits",
      coverImage: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
      youtubeUrl: "https://www.youtube.com/watch?v=PZ7lDrwYdZc",
      youtubeId: "PZ7lDrwYdZc",
      videoTitle: "Atomic Habits Book Summary by Ali Abdaal",
      videoThumbnail: "https://img.youtube.com/vi/PZ7lDrwYdZc/maxresdefault.jpg",
      videoDuration: "28:14",
      youtubeName: "Ali Abdaal",
      youtubeAvatar: "https://ui-avatars.com/api/?name=Ali+Abdaal&background=0ea5e9&color=fff&bold=true",
      youtubeChannelUrl: "https://www.youtube.com/@aliabdaal",
      buyUrl: "https://www.amazon.com/Atomic-Habits-Proven-Build-Break/dp/0735211299",
      language: "English",
      keyTakeaways: [
        "1% better every day compounds to 37x improvement in a year.",
        "Focus on identity-based systems rather than outcome goals.",
        "Make good habits obvious, attractive, easy, and satisfying."
      ],
      isApproved: true,
      createdAt: 1710000006000
    },
    {
      id: "book-pragmatic-programmer",
      title: "The Pragmatic Programmer: Your Journey to Mastery",
      author: "Andrew Hunt & David Thomas",
      description: "One of the most significant books in software engineering. Examines what it means to be a modern developer, from personal responsibility and career development to architectural techniques.",
      category: "Software Engineering",
      subCategory: "Career & Craft",
      coverImage: "https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg",
      youtubeUrl: "https://www.youtube.com/watch?v=0a2_ce89334",
      youtubeId: "0a2_ce89334",
      videoTitle: "The Pragmatic Programmer - Key Lessons Explained",
      videoThumbnail: "https://img.youtube.com/vi/0a2_ce89334/maxresdefault.jpg",
      videoDuration: "19:12",
      youtubeName: "Travis Media",
      youtubeAvatar: "https://ui-avatars.com/api/?name=Travis+Media&background=2563eb&color=fff&bold=true",
      youtubeChannelUrl: "https://www.youtube.com/@TravisMedia",
      buyUrl: "https://www.amazon.com/Pragmatic-Programmer-journey-mastery-Anniversary/dp/0135957052",
      language: "English",
      keyTakeaways: [
        "DRY: Don't Repeat Yourself—every piece of knowledge must have a single representation.",
        "Design orthogonal components that are decoupled and easy to test.",
        "Invest regularly in your knowledge portfolio."
      ],
      isApproved: true,
      createdAt: 1710000005000
    },
    {
      id: "book-zero-to-one",
      title: "Zero to One: Notes on Startups, or How to Build the Future",
      author: "Peter Thiel & Blake Masters",
      description: "The great secret of our time is that there are still uncharted frontiers to explore and new inventions to create. Learn how to build breakthrough technology companies that create new value.",
      category: "Business & Startups",
      subCategory: "Entrepreneurship",
      coverImage: "https://covers.openlibrary.org/b/isbn/9780804139298-L.jpg",
      youtubeUrl: "https://www.youtube.com/watch?v=rFZrL1R12qE",
      youtubeId: "rFZrL1R12qE",
      videoTitle: "Zero to One by Peter Thiel - Full Video Book Summary",
      videoThumbnail: "https://img.youtube.com/vi/rFZrL1R12qE/maxresdefault.jpg",
      videoDuration: "15:50",
      youtubeName: "Swedish Investor",
      youtubeAvatar: "https://ui-avatars.com/api/?name=Swedish+Investor&background=7c3aed&color=fff&bold=true",
      youtubeChannelUrl: "https://www.youtube.com/@TheSwedishInvestor",
      buyUrl: "https://www.amazon.com/Zero-One-Notes-Startups-Future/dp/0804139296",
      language: "English",
      keyTakeaways: [
        "Horizontal progress copies things that work (1 to n); vertical progress creates new tech (0 to 1).",
        "Start by dominating a small, specific niche market before scaling.",
        "Build proprietary technology that is 10x better than the closest substitute."
      ],
      isApproved: true,
      createdAt: 1710000004000
    },
    // ARABIC BOOKS CATALOG
    {
      id: "book-atomic-habits-ar",
      title: "العادات الذرية (Atomic Habits)",
      author: "جيمس كلير (James Clear)",
      description: "شرح تفصيلي لكتاب العادات الذرية وكيف يمكنك بناء عادات تعلم وبرمجة يومية صغيرة تتراكم لتصنع نتائج استثنائية في مسيرتك المهنية والشخصية.",
      category: "Productivity & Mindset",
      subCategory: "تطوير الذات",
      coverImage: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
      youtubeUrl: "https://www.youtube.com/watch?v=kW8t7-cQe6U",
      youtubeId: "kW8t7-cQe6U",
      videoTitle: "شرح كتاب العادات الذرية - دوباميكافين",
      videoThumbnail: "https://img.youtube.com/vi/kW8t7-cQe6U/maxresdefault.jpg",
      videoDuration: "32:18",
      youtubeName: "دوباميكافين | Dupamicaffeine",
      youtubeAvatar: "https://ui-avatars.com/api/?name=Dupamicaffeine&background=f59e0b&color=fff&bold=true",
      youtubeChannelUrl: "https://www.youtube.com/@Dupamicaffeine",
      buyUrl: "https://www.jarir.com/arabic-books-535867.html",
      language: "Arabic",
      keyTakeaways: [
        "التحسن بنسبة 1% كل يوم يجعلك أفضل بـ 37 ضعفاً في نهاية العام.",
        "ركز على بناء الأنظمة اليومية بدلاً من الاكتفاء بتحديد الأهداف.",
        "القوانين الأربعة لبناء العادة: اجعلها واضحة، جذابة، سهلة، ومُشبعة."
      ],
      isApproved: true,
      createdAt: 1710000012000
    },
    {
      id: "book-deep-work-ar",
      title: "العمل العميق (Deep Work)",
      author: "كال نيوبورت (Cal Newport)",
      description: "قواعد النجاح المركّز في عالم مليء بالمشتتات الرقمية. كيف تضاعف إنتاجيتك وتتعلم المهارات التقنية المعقدة في نصف الوقت المعتاد.",
      category: "Productivity & Mindset",
      subCategory: "التركيز والإنتاجية",
      coverImage: "/src/assets/images/book_cover_deep_work_1791050383475.jpg",
      youtubeUrl: "https://www.youtube.com/watch?v=ef48a0s7kHM",
      youtubeId: "ef48a0s7kHM",
      videoTitle: "ملخص كتاب العمل العميق Deep Work - التركيز الفائق",
      videoThumbnail: "https://img.youtube.com/vi/ef48a0s7kHM/maxresdefault.jpg",
      videoDuration: "24:45",
      youtubeName: "أخضر | Akhdar",
      youtubeAvatar: "https://ui-avatars.com/api/?name=Akhdar&background=10b981&color=fff&bold=true",
      youtubeChannelUrl: "https://www.youtube.com/@Akhdar",
      buyUrl: "https://www.jarir.com/arabic-books-514496.html",
      language: "Arabic",
      keyTakeaways: [
        "العمل العميق هو المهارة الأكثر ندرة وقيمة في اقتصاد القرن الحادي والعشرين.",
        "تخلص من التشتت السطحي والتنقل المستمر بين الإشعارات أثناء الدراسة.",
        "خصص فترات زمنية يومية مغلقة للتركيز الكامل بدون إنترنت أو هاتف."
      ],
      isApproved: true,
      createdAt: 1710000011500
    },
    {
      id: "book-clean-code-ar",
      title: "الكود النظيف وهندسة البرمجيات (Clean Code)",
      author: "روبرت سي مارتن (Uncle Bob)",
      description: "دليلك العملي لكتابة كود برمجي نظيف، قابل للقراءة والصيانة والتطوير، وأهم المبادئ التي تميز مهندس البرمجيات المحترف عن المبتدئ.",
      category: "Software Engineering",
      subCategory: "هندسة البرمجيات",
      coverImage: "/src/assets/images/book_cover_clean_code_1791050350269.jpg",
      youtubeUrl: "https://www.youtube.com/watch?v=W8KRzm-HUcc",
      youtubeId: "W8KRzm-HUcc",
      videoTitle: "ملخص وشرح كتاب Clean Code للمبرمجين",
      videoThumbnail: "https://img.youtube.com/vi/W8KRzm-HUcc/maxresdefault.jpg",
      videoDuration: "21:10",
      youtubeName: "Elzero Web School",
      youtubeAvatar: "https://ui-avatars.com/api/?name=Elzero+Web&background=0284c7&color=fff&bold=true",
      youtubeChannelUrl: "https://www.youtube.com/@ElzeroWebSchool",
      buyUrl: "https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882",
      language: "Arabic",
      keyTakeaways: [
        "اختيار أسماء المتغيرات والدوال بوضوح يغني عن عشرات التعليقات.",
        "كل دالة برمجية يجب أن تؤدي مهمة واحدة فقط وبإتقان.",
        "الاختبارات البرمجية والتنظيم المعماري يحميان المشروع من الانهيار مستقبلاً."
      ],
      isApproved: true,
      createdAt: 1710000011000
    },
    {
      id: "book-ai-future-ar",
      title: "الذكاء الاصطناعي وبناء أنظمة المستقبل",
      author: "كاي فو لي ومارتن كليبمان",
      description: "نظرة شاملة على ثورة الذكاء الاصطناعي وهندسة البيانات الحديثة، وكيف يستعد المبرمجون ورواد الأعمال لبناء الجيل القادم من التطبيقات الذكية.",
      category: "AI & Future Tech",
      subCategory: "الذكاء الاصطناعي",
      coverImage: "/src/assets/images/book_cover_ai_engineering_1791050361894.jpg",
      youtubeUrl: "https://www.youtube.com/watch?v=EwfCLtjscTE",
      youtubeId: "EwfCLtjscTE",
      videoTitle: "شرح كتاب ثورة الذكاء الاصطناعي وأنظمة الأتمتة",
      videoThumbnail: "https://img.youtube.com/vi/EwfCLtjscTE/maxresdefault.jpg",
      videoDuration: "19:35",
      youtubeName: "Ai bdarija | الذكاء الاصطناعي",
      youtubeAvatar: "https://yt3.ggpht.com/5WWzeEVoN066innvlC3jDr_4c8RPjG9okQiIg9poOC4iiWkuyVa45T0B-QtMklQUKeVKYU9L=s176-c-k-c0x00ffffff-no-rj",
      youtubeChannelUrl: "https://www.youtube.com/@aibdarija",
      buyUrl: "https://www.amazon.com/AI-Superpowers-China-Silicon-Valley/dp/132854639X",
      language: "Arabic",
      keyTakeaways: [
        "دمج وكلاء الذكاء الاصطناعي والأتمتة في صميم المنتجات الرقمية.",
        "فهم بنية البيانات الضخمة والنماذج اللغوية الحديثة.",
        "المهارات البشرية الإبداعية والهندسية التي تتكامل مع الذكاء الاصطناعي."
      ],
      isApproved: true,
      createdAt: 1710000010500
    },
    {
      id: "book-cyber-ar",
      title: "فن التخفي والأمن السيبراني (The Art of Invisibility)",
      author: "كيفن ميتنيك (Kevin Mitnick)",
      description: "أشهر خبير أمن سيبراني في العالم يشرح أسرار الخصوصية الرقمية، الهندسة الاجتماعية، وكيف تحمي أنظمتك وبياناتك من الاختراقات الحديثة.",
      category: "Cybersecurity",
      subCategory: "الأمن السيبراني",
      coverImage: "/src/assets/images/book_cover_cyber_defense_1791050371723.jpg",
      youtubeUrl: "https://www.youtube.com/watch?v=fQ3W2v8V9M8",
      youtubeId: "fQ3W2v8V9M8",
      videoTitle: "ملخص كتاب فن التخفي والأمن السيبراني",
      videoThumbnail: "https://img.youtube.com/vi/fQ3W2v8V9M8/maxresdefault.jpg",
      videoDuration: "17:50",
      youtubeName: "Cyber Arabic | الأمن السيبراني",
      youtubeAvatar: "https://ui-avatars.com/api/?name=Cyber+Arabic&background=059669&color=fff&bold=true",
      youtubeChannelUrl: "https://www.youtube.com/results?search_query=the+art+of+invisibility+arabic",
      buyUrl: "https://www.amazon.com/Art-Invisibility-Worlds-Teaches-Brother/dp/0316380504",
      language: "Arabic",
      keyTakeaways: [
        "الأمان يبدأ من الوعي بالهندسة الاجتماعية وحماية الهوية الرقمية.",
        "تطبيق التشفير القوي ومبدأ انعدام الثقة (Zero Trust) في الشبكات.",
        "كيف يفكر مختبر الاختراق الأخلاقي لاكتشاف الثغرات قبل المهاجمين."
      ],
      isApproved: true,
      createdAt: 1710000010200
    },
    {
      id: "book-ai-superpowers-en-2",
      title: "AI Superpowers & Autonomous Agents",
      author: "Kai-Fu Lee",
      description: "Inside the global artificial intelligence revolution, autonomous engineering workflows, and how deep learning is reshaping software products and society.",
      category: "AI & Future Tech",
      subCategory: "AI Strategy",
      coverImage: "/src/assets/images/book_cover_ai_engineering_1791050361894.jpg",
      youtubeUrl: "https://www.youtube.com/watch?v=EwfCLtjscTE",
      youtubeId: "EwfCLtjscTE",
      videoTitle: "AI Superpowers by Kai-Fu Lee - Complete Video Breakdown",
      videoThumbnail: "https://img.youtube.com/vi/EwfCLtjscTE/maxresdefault.jpg",
      videoDuration: "19:35",
      youtubeName: "Two Minute Papers",
      youtubeAvatar: "https://ui-avatars.com/api/?name=Two+Minute+Papers&background=059669&color=fff&bold=true",
      youtubeChannelUrl: "https://www.youtube.com/@TwoMinutePapers",
      buyUrl: "https://www.amazon.com/AI-Superpowers-China-Silicon-Valley/dp/132854639X",
      language: "Both",
      youtubeUrlAr: "https://www.youtube.com/watch?v=EwfCLtjscTE",
      youtubeIdAr: "EwfCLtjscTE",
      videoDurationAr: "19:35",
      youtubeNameAr: "Ai bdarija | الذكاء الاصطناعي",
      buyUrlAr: "https://www.amazon.com/AI-Superpowers-China-Silicon-Valley/dp/132854639X",
      keyTakeaways: [
        "Data quality and real-world deployment velocity drive modern AI breakthroughs.",
        "Engineers who pair domain expertise with AI agents multiply their output."
      ],
      isApproved: true,
      createdAt: 1710000003500
    },
    {
      id: "book-ghost-in-the-wires",
      title: "Ghost in the Wires: Ethical Hacking & Social Engineering",
      author: "Kevin Mitnick",
      description: "A thrilling deep dive into real-world penetration testing, human psychology in cybersecurity, and how to harden enterprise infrastructure against intrusion.",
      category: "Cybersecurity",
      subCategory: "Ethical Hacking",
      coverImage: "/src/assets/images/book_cover_cyber_defense_1791050371723.jpg",
      youtubeUrl: "https://www.youtube.com/watch?v=fQ3W2v8V9M8",
      youtubeId: "fQ3W2v8V9M8",
      videoTitle: "Ghost in the Wires - Key Cybersecurity Lessons",
      videoThumbnail: "https://img.youtube.com/vi/fQ3W2v8V9M8/maxresdefault.jpg",
      videoDuration: "21:15",
      youtubeName: "David Bombal",
      youtubeAvatar: "https://ui-avatars.com/api/?name=David+Bombal&background=10b981&color=fff&bold=true",
      youtubeChannelUrl: "https://www.youtube.com/@davidbombal",
      buyUrl: "https://www.amazon.com/Ghost-Wires-Adventures-Worlds-Wanted/dp/0316037729",
      language: "Both",
      youtubeUrlAr: "https://www.youtube.com/watch?v=fQ3W2v8V9M8",
      youtubeIdAr: "fQ3W2v8V9M8",
      videoDurationAr: "21:15",
      youtubeNameAr: "Cyber Security Arabic",
      buyUrlAr: "https://www.amazon.com/Ghost-Wires-Adventures-Worlds-Wanted/dp/0316037729",
      keyTakeaways: [
        "Every technical control can be bypassed if human verification protocols fail.",
        "Continuous security auditing and zero-trust authentication are mandatory."
      ],
      isApproved: true,
      createdAt: 1710000003000
    },
    {
      id: "book-lean-startup",
      title: "The Lean Startup: How Today's Entrepreneurs Use Continuous Innovation",
      author: "Eric Ries",
      description: "How modern tech founders and product engineers validate ideas rapidly using the Build-Measure-Learn feedback loop, Minimum Viable Products (MVPs), and actionable metrics.",
      category: "Business & Startups",
      subCategory: "Product & Startups",
      coverImage: "https://covers.openlibrary.org/b/isbn/9780307887894-L.jpg",
      youtubeUrl: "https://www.youtube.com/watch?v=RSaIOCHbu0I",
      youtubeId: "RSaIOCHbu0I",
      videoTitle: "The Lean Startup by Eric Ries - Animated Summary",
      videoThumbnail: "https://img.youtube.com/vi/RSaIOCHbu0I/maxresdefault.jpg",
      videoDuration: "14:40",
      youtubeName: "Escaping Ordinary",
      youtubeAvatar: "https://ui-avatars.com/api/?name=Lean+Startup&background=8b5cf6&color=fff&bold=true",
      youtubeChannelUrl: "https://www.youtube.com/@EscapingOrdinary",
      buyUrl: "https://www.amazon.com/Lean-Startup-Entrepreneurs-Continuous-Innovation/dp/0307887898",
      language: "Both",
      youtubeUrlAr: "https://www.youtube.com/watch?v=RSaIOCHbu0I",
      youtubeIdAr: "RSaIOCHbu0I",
      videoDurationAr: "14:40",
      youtubeNameAr: "أخضر | ريادة الأعمال",
      buyUrlAr: "https://www.jarir.com",
      keyTakeaways: [
        "Launch a Minimum Viable Product (MVP) fast to start learning from real users.",
        "Accelerate the Build-Measure-Learn feedback loop before scaling."
      ],
      isApproved: true,
      createdAt: 1710000002500
    },
    {
      id: "book-system-design-interview",
      title: "System Design Interview: An Insider's Guide",
      author: "Alex Xu",
      description: "A step-by-step framework for tackling real-world distributed system design questions—covering load balancers, consistent hashing, rate limiters, key-value stores, and notification services.",
      category: "Software Engineering",
      subCategory: "System Design",
      coverImage: "https://covers.openlibrary.org/b/isbn/9781736049112-L.jpg",
      youtubeUrl: "https://www.youtube.com/watch?v=i5twVF3s8zg",
      youtubeId: "i5twVF3s8zg",
      videoTitle: "System Design Interview Concepts Explained by ByteByteGo",
      videoThumbnail: "https://img.youtube.com/vi/i5twVF3s8zg/maxresdefault.jpg",
      videoDuration: "22:30",
      youtubeName: "ByteByteGo (Alex Xu)",
      youtubeAvatar: "https://ui-avatars.com/api/?name=ByteByteGo&background=0284c7&color=fff&bold=true",
      youtubeChannelUrl: "https://www.youtube.com/@ByteByteGo",
      buyUrl: "https://www.amazon.com/System-Design-Interview-insiders-Second/dp/B08CMF2CQF",
      language: "Both",
      youtubeUrlAr: "https://www.youtube.com/watch?v=W8KRzm-HUcc",
      youtubeIdAr: "W8KRzm-HUcc",
      videoTitleAr: "شرح تصميم الأنظمة البرمجية System Design للمهندسين",
      videoThumbnailAr: "https://img.youtube.com/vi/W8KRzm-HUcc/maxresdefault.jpg",
      videoDurationAr: "21:10",
      youtubeNameAr: "Elzero Web School",
      youtubeAvatarAr: "https://ui-avatars.com/api/?name=Elzero+Web&background=0284c7&color=fff&bold=true",
      youtubeChannelUrlAr: "https://www.youtube.com/@ElzeroWebSchool",
      buyUrlAr: "https://www.amazon.sa/s?k=System+Design+Interview+Alex+Xu",
      keyTakeaways: [
        "Scale horizontally with stateless web tiers, caching layers, and CDNs.",
        "Use consistent hashing and message queues to decouple high-traffic microservices.",
        "Always clarify functional and non-functional requirements before designing."
      ],
      isApproved: true,
      createdAt: 1710000002200
    },
    {
      id: "book-refactoring",
      title: "Refactoring: Improving the Design of Existing Code",
      author: "Martin Fowler",
      description: "The classic guide to transforming messy, brittle legacy code into clean, modular software without changing its external behavior—one small, safe step at a time.",
      category: "Software Engineering",
      subCategory: "Clean Architecture",
      coverImage: "https://covers.openlibrary.org/b/isbn/9780134757599-L.jpg",
      youtubeUrl: "https://www.youtube.com/watch?v=7EmboKQH8lM",
      youtubeId: "7EmboKQH8lM",
      videoTitle: "Refactoring by Martin Fowler - Core Engineering Principles",
      videoThumbnail: "https://img.youtube.com/vi/7EmboKQH8lM/maxresdefault.jpg",
      videoDuration: "18:45",
      youtubeName: "Continuous Delivery",
      youtubeAvatar: "https://ui-avatars.com/api/?name=Continuous+Delivery&background=1d4ed8&color=fff&bold=true",
      youtubeChannelUrl: "https://www.youtube.com/@ContinuousDelivery",
      buyUrl: "https://www.amazon.com/Refactoring-Improving-Existing-Addison-Wesley-Signature/dp/0134757599",
      language: "Both",
      youtubeUrlAr: "https://www.youtube.com/watch?v=W8KRzm-HUcc",
      youtubeIdAr: "W8KRzm-HUcc",
      videoTitleAr: "ملخص كتاب Refactoring لتحسين جودة الكود البرمجي",
      videoThumbnailAr: "https://img.youtube.com/vi/W8KRzm-HUcc/maxresdefault.jpg",
      videoDurationAr: "19:20",
      youtubeNameAr: "محمد أبو هدهود | Programming Advices",
      youtubeAvatarAr: "https://ui-avatars.com/api/?name=Programming+Advices&background=0369a1&color=fff&bold=true",
      youtubeChannelUrlAr: "https://www.youtube.com/@ProgrammingAdvices",
      buyUrlAr: "https://www.amazon.sa/s?k=Refactoring+Martin+Fowler",
      keyTakeaways: [
        "Any fool can write code that a computer can understand; good programmers write code humans understand.",
        "Refactor in small, test-backed steps so the system never stays broken.",
        "Spot code smells like long methods, feature envy, and shotgun surgery early."
      ],
      isApproved: true,
      createdAt: 1710000002000
    },
    {
      id: "book-Zero-To-One-Ar-En",
      title: "Rework: Change the Way You Work Forever",
      author: "Jason Fried & David Heinemeier Hansson",
      description: "From the founders of Basecamp and Ruby on Rails—a contrarian playbook on building profitable, calm, product-obsessed software businesses without meetings or bloat.",
      category: "Business & Startups",
      subCategory: "Bootstrapping",
      coverImage: "https://covers.openlibrary.org/b/isbn/9780307463746-L.jpg",
      youtubeUrl: "https://www.youtube.com/watch?v=rFZrL1R12qE",
      youtubeId: "rFZrL1R12qE",
      videoTitle: "REWORK by Jason Fried & DHH - Complete Video Book Summary",
      videoThumbnail: "https://img.youtube.com/vi/rFZrL1R12qE/maxresdefault.jpg",
      videoDuration: "16:20",
      youtubeName: "Ali Abdaal",
      youtubeAvatar: "https://ui-avatars.com/api/?name=Ali+Abdaal&background=0ea5e9&color=fff&bold=true",
      youtubeChannelUrl: "https://www.youtube.com/@aliabdaal",
      buyUrl: "https://www.amazon.com/Rework-Jason-Fried/dp/0307463745",
      language: "Both",
      youtubeUrlAr: "https://www.youtube.com/watch?v=RSaIOCHbu0I",
      youtubeIdAr: "RSaIOCHbu0I",
      videoTitleAr: "ملخص كتاب Rework لبناء المشاريع التقنية بذكاء",
      videoThumbnailAr: "https://img.youtube.com/vi/RSaIOCHbu0I/maxresdefault.jpg",
      videoDurationAr: "17:10",
      youtubeNameAr: "أخضر | Akhdar",
      youtubeAvatarAr: "https://ui-avatars.com/api/?name=Akhdar&background=10b981&color=fff&bold=true",
      youtubeChannelUrlAr: "https://www.youtube.com/@Akhdar",
      buyUrlAr: "https://www.jarir.com",
      keyTakeaways: [
        "Planning is guessing—ship real working software and iterate on real usage.",
        "Build half a product, not a half-baked product.",
        "Protect uninterrupted maker time from unnecessary status meetings."
      ],
      isApproved: true,
      createdAt: 1710000001800
    }
  ];

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
    icon: "Code"
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
    icon: "Code"
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
  }
];
