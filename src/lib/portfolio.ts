import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Course } from '../data/courses';

export interface StudentPortfolioProfile {
  uid: string;
  username: string; // e.g. "alex_dev" or "nexa1337"
  displayName: string;
  photoURL: string;
  email?: string;
  headline?: string; // e.g. "Full-Stack Web & Cybersecurity Enthusiast"
  bio?: string;
  location?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  skills?: string[];
  xp: number;
  streak: number;
  badges?: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: string;
  }>;
  lastActive?: string;
  updatedAt?: string;
}

export interface SkillTreeNode {
  id: string;
  title: string;
  titleAr: string;
  category: 'web' | 'cyber' | 'ai' | 'devops' | 'cs';
  level: 'fundamentals' | 'intermediate' | 'advanced' | 'mastery';
  icon: string;
  description: string;
  descriptionAr: string;
  requiredCourses: string[]; // Course IDs or keywords
  isMastered: boolean;
  isInProgress: boolean;
  matchedCompletedCount: number;
  totalRequired: number;
}

export const CORE_SKILL_TREE_NODES: Omit<SkillTreeNode, 'isMastered' | 'isInProgress' | 'matchedCompletedCount' | 'totalRequired'>[] = [
  // Web Development Track
  {
    id: 'web_basics',
    title: 'HTML5, Modern CSS & Responsive UI',
    titleAr: 'أساسيات الويب وبناء الواجهات المتجاوبة',
    category: 'web',
    level: 'fundamentals',
    icon: 'Layout',
    description: 'Semantic HTML, CSS Flexbox/Grid, and responsive layout architecture.',
    descriptionAr: 'هيكلة الويب الحديثة وتصميم واجهات مرنة ومتوافقة مع مختلف الشاشات.',
    requiredCourses: ['html', 'css', 'web', 'responsive']
  },
  {
    id: 'js_ts_mastery',
    title: 'JavaScript ESNext & TypeScript',
    titleAr: 'لغة جافاسكريبت وتايب سكريبت المتقدمة',
    category: 'web',
    level: 'intermediate',
    icon: 'FileCode2',
    description: 'Modern asynchronous JavaScript, closures, DOM, and strong TypeScript types.',
    descriptionAr: 'البرمجة غير المتزامنة والمفاهيم المتقدمة ونظام الأنواع الصارم في TypeScript.',
    requiredCourses: ['javascript', 'typescript', 'js', 'ts']
  },
  {
    id: 'react_frameworks',
    title: 'React & Modern Frontend Architecture',
    titleAr: 'مكتبة React وتطوير تطبيقات الواجهة',
    category: 'web',
    level: 'advanced',
    icon: 'Atom',
    description: 'Component lifecycles, custom hooks, state management, and modern bundling.',
    descriptionAr: 'بناء تطبيقات أحادية الصفحة (SPA)، خطافات React، وإدارة الحالة بكفاءة.',
    requiredCourses: ['react', 'next', 'frontend', 'tailwind']
  },
  {
    id: 'fullstack_backend',
    title: 'Full-Stack Engineering & REST APIs',
    titleAr: 'هندسة الأنظمة الشاملة (Full-Stack) وبناء APIs',
    category: 'web',
    level: 'mastery',
    icon: 'Server',
    description: 'Backend services, database modeling, authentication, and end-to-end integration.',
    descriptionAr: 'تصميم واجهات برمجة التطبيقات، قواعد البيانات، والربط الكامل للأنظمة.',
    requiredCourses: ['node', 'express', 'fullstack', 'api', 'backend', 'mongodb', 'sql']
  },

  // Cybersecurity Track
  {
    id: 'net_linux_basics',
    title: 'Networking Protocols & Linux Internals',
    titleAr: 'بروتوكولات الشبكات وأنظمة لينكس',
    category: 'cyber',
    level: 'fundamentals',
    icon: 'Terminal',
    description: 'TCP/IP architecture, subnetting, DNS, packet analysis, and bash mastery.',
    descriptionAr: 'طبقات الشبكات وفحص الحزم عبر Wireshark والتحكم الكامل في موجه أوامر Linux.',
    requiredCourses: ['linux', 'network', 'networking', 'bash']
  },
  {
    id: 'security_fundamentals',
    title: 'Security Foundations & Cryptography',
    titleAr: 'أسس أمن المعلومات والتشفير',
    category: 'cyber',
    level: 'intermediate',
    icon: 'Shield',
    description: 'Symmetric/asymmetric encryption, hashing, auth standards, and threat modeling.',
    descriptionAr: 'أنظمة التشفير الحديثة والتوقيع الرقمي وتحديد مسارات التهديدات السيبرانية.',
    requiredCourses: ['security', 'cryptography', 'cybersecurity']
  },
  {
    id: 'web_pentesting',
    title: 'Web Application Pentesting (OWASP Top 10)',
    titleAr: 'اختبار اختراق تطبيقات الويب (ثغرات OWASP)',
    category: 'cyber',
    level: 'advanced',
    icon: 'Bug',
    description: 'SQLi, XSS, CSRF, IDOR, SSRF vulnerability discovery and ethical exploitation.',
    descriptionAr: 'اكتشاف واستغلال ثغرات الويب الشائعة وتقديم تقارير الثغرات بطريقة احترافية.',
    requiredCourses: ['pentest', 'ethical-hacking', 'owasp', 'burp', 'hacker']
  },
  {
    id: 'defense_forensics',
    title: 'Defensive Architecture & SOC Analytics',
    titleAr: 'الحماية الدفاعية والتحليل الجنائي الرقمي',
    category: 'cyber',
    level: 'mastery',
    icon: 'ShieldAlert',
    description: 'Incident response, SIEM log monitoring, malware analysis, and hardening.',
    descriptionAr: 'الاستجابة للحوادث السيبرانية وتحليل السجلات وتحصين البنية التحتية السحابية.',
    requiredCourses: ['soc', 'forensics', 'defense', 'malware', 'incident']
  },

  // AI & Data Track
  {
    id: 'python_data_core',
    title: 'Python for Data & Scripting',
    titleAr: 'لغة بايثون وتحليل البيانات',
    category: 'ai',
    level: 'fundamentals',
    icon: 'Binary',
    description: 'Python syntax, NumPy, Pandas, data wrangling, and structured analysis.',
    descriptionAr: 'أساسيات بايثون المتقدمة ومعالجة وهندسة مصفوفات البيانات الضخمة.',
    requiredCourses: ['python', 'pandas', 'numpy', 'data']
  },
  {
    id: 'machine_learning',
    title: 'Machine Learning & Neural Networks',
    titleAr: 'تعلم الآلة والشبكات العصبية الاصطناعية',
    category: 'ai',
    level: 'advanced',
    icon: 'Cpu',
    description: 'Supervised/unsupervised algorithms, evaluation metrics, and model tuning.',
    descriptionAr: 'تدريب النماذج الإحصائية وتطوير خوارزميات التصنيف والتنبؤ الذكية.',
    requiredCourses: ['machine-learning', 'ml', 'deep-learning', 'tensorflow', 'pytorch']
  },
  {
    id: 'llm_generative_ai',
    title: 'LLMs, Prompt Engineering & GenAI',
    titleAr: 'الذكاء الاصطناعي التوليدي وهندسة الأوامر',
    category: 'ai',
    level: 'mastery',
    icon: 'Sparkles',
    description: 'Retrieval Augmented Generation (RAG), vector databases, and AI agent flows.',
    descriptionAr: 'تطبيقات الذكاء الاصطناعي التوليدي، قواعد البيانات المتجهة (Vectors)، وبناء الوكلاء.',
    requiredCourses: ['llm', 'genai', 'gemini', 'gpt', 'rag', 'agent']
  },

  // DevOps & Cloud Track
  {
    id: 'git_automation',
    title: 'Git Version Control & CI/CD Pipelines',
    titleAr: 'إدارة الإصدارات Git وخطوط الإنتاج المؤتمتة',
    category: 'devops',
    level: 'fundamentals',
    icon: 'GitBranch',
    description: 'Branching strategies, merge conflict resolution, GitHub actions, and automation.',
    descriptionAr: 'التحكم البرمجي في الإصدارات، بناء مسارات الفحص والنشر التلقائي عبر GitHub.',
    requiredCourses: ['git', 'github', 'cicd', 'pipeline']
  },
  {
    id: 'docker_containers',
    title: 'Docker Containers & Cloud Deployment',
    titleAr: 'حاويات Docker والنشر السحابي',
    category: 'devops',
    level: 'advanced',
    icon: 'Boxes',
    description: 'Containerization, Docker Compose, microservices orchestration, and VPS hosting.',
    descriptionAr: 'عزل وحزم البرمجيات داخل حاويات موحدة ونشرها على السيرفرات السحابية.',
    requiredCourses: ['docker', 'container', 'cloud', 'devops', 'aws', 'kubernetes']
  }
];

/**
 * Fetch a student's public portfolio by username slug or by Firebase UID
 */
export async function getPortfolioByUsernameOrUid(slugOrUid: string): Promise<StudentPortfolioProfile | null> {
  if (!slugOrUid) return null;
  const cleanInput = slugOrUid.trim().toLowerCase();

  try {
    // 1. Try querying by username first
    const profilesCol = collection(db, 'publicProfiles');
    const q = query(profilesCol, where('username', '==', cleanInput), limit(1));
    const querySnap = await getDocs(q);

    if (!querySnap.empty) {
      const docData = querySnap.docs[0].data();
      return sanitizePortfolioData(querySnap.docs[0].id, docData);
    }

    // 2. Fallback: Check if slugOrUid matches doc ID (uid) directly
    const directDoc = await getDoc(doc(db, 'publicProfiles', slugOrUid));
    if (directDoc.exists()) {
      return sanitizePortfolioData(directDoc.id, directDoc.data());
    }

    return null;
  } catch (err) {
    console.error('Error fetching public portfolio:', err);
    return null;
  }
}

/**
 * Update or save public portfolio information
 */
export async function updatePortfolioProfile(
  uid: string,
  data: Partial<StudentPortfolioProfile>
): Promise<StudentPortfolioProfile> {
  const profileRef = doc(db, 'publicProfiles', uid);
  const snap = await getDoc(profileRef);
  const now = new Date().toISOString();

  const currentData = snap.exists() ? snap.data() : {};
  
  // Format clean username
  let cleanUsername = (data.username || currentData.username || '').trim().toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 30);
  
  if (!cleanUsername) {
    cleanUsername = (currentData.email ? currentData.email.split('@')[0] : `user_${uid.slice(0, 6)}`)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 30);
  }

  const updatedPayload: Record<string, any> = {
    ...currentData,
    uid,
    username: cleanUsername,
    displayName: data.displayName !== undefined ? data.displayName : (currentData.displayName || 'Learner'),
    photoURL: data.photoURL !== undefined ? data.photoURL : (currentData.photoURL || ''),
    headline: data.headline !== undefined ? data.headline.slice(0, 160) : (currentData.headline || ''),
    bio: data.bio !== undefined ? data.bio.slice(0, 800) : (currentData.bio || ''),
    location: data.location !== undefined ? data.location.slice(0, 80) : (currentData.location || ''),
    githubUrl: data.githubUrl !== undefined ? data.githubUrl.slice(0, 300) : (currentData.githubUrl || ''),
    linkedinUrl: data.linkedinUrl !== undefined ? data.linkedinUrl.slice(0, 300) : (currentData.linkedinUrl || ''),
    websiteUrl: data.websiteUrl !== undefined ? data.websiteUrl.slice(0, 300) : (currentData.websiteUrl || ''),
    skills: Array.isArray(data.skills) ? data.skills.slice(0, 25) : (currentData.skills || []),
    xp: currentData.xp || 0,
    streak: currentData.streak || 1,
    badges: currentData.badges || [],
    lastActive: currentData.lastActive || now.split('T')[0],
    updatedAt: now
  };

  if (snap.exists()) {
    await updateDoc(profileRef, updatedPayload);
  } else {
    await setDoc(profileRef, updatedPayload);
  }

  return sanitizePortfolioData(uid, updatedPayload);
}

/**
 * Builds user's interactive skill tree based on completed courses & skills
 */
export function computeUserSkillTree(
  completedCourseIds: string[],
  allCourses: Course[],
  customSkills: string[] = []
): SkillTreeNode[] {
  const completedIdsSet = new Set(completedCourseIds.map(id => id.toLowerCase()));
  const completedCourses = allCourses.filter(c => completedIdsSet.has(c.id.toLowerCase()));
  const customSkillsLower = customSkills.map(s => s.toLowerCase());

  return CORE_SKILL_TREE_NODES.map(node => {
    let matchedCount = 0;

    // Check course title, category, description, and keywords
    for (const c of completedCourses) {
      const text = `${c.title} ${c.category} ${c.subCategory || ''} ${c.description || ''} ${c.id}`.toLowerCase();
      const hasMatch = node.requiredCourses.some(kw => text.includes(kw.toLowerCase()));
      if (hasMatch) {
        matchedCount++;
      }
    }

    // Also check custom skills
    for (const s of customSkillsLower) {
      if (node.requiredCourses.some(kw => s.includes(kw) || kw.includes(s))) {
        matchedCount++;
      }
    }

    const totalRequired = Math.max(1, node.level === 'fundamentals' ? 1 : node.level === 'intermediate' ? 2 : 3);
    const isMastered = matchedCount >= totalRequired;
    const isInProgress = matchedCount > 0 && !isMastered;

    return {
      ...node,
      isMastered,
      isInProgress,
      matchedCompletedCount: matchedCount,
      totalRequired
    };
  });
}

function sanitizePortfolioData(uid: string, data: any): StudentPortfolioProfile {
  return {
    uid,
    username: data.username || (data.email ? data.email.split('@')[0] : `user_${uid.slice(0, 6)}`),
    displayName: data.displayName || 'Learner',
    photoURL: data.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.displayName || 'Learner')}&background=random`,
    email: data.email || '',
    headline: data.headline || '',
    bio: data.bio || '',
    location: data.location || '',
    githubUrl: data.githubUrl || '',
    linkedinUrl: data.linkedinUrl || '',
    websiteUrl: data.websiteUrl || '',
    skills: Array.isArray(data.skills) ? data.skills : [],
    xp: typeof data.xp === 'number' ? data.xp : 0,
    streak: typeof data.streak === 'number' ? data.streak : 1,
    badges: Array.isArray(data.badges) ? data.badges : [],
    lastActive: data.lastActive || '',
    updatedAt: data.updatedAt || ''
  };
}
