import { Course } from '../data/courses';

/**
 * Normalizes any category string into a standardized, canonical title.
 * Prevents duplicates caused by casing (e.g. 'digital marketing' vs 'Digital Marketing'),
 * spacing, or common naming variations.
 */
export function normalizeCategory(category?: string): string {
  if (!category) return 'Other';
  const trimmed = category.trim();
  const lower = trimmed.toLowerCase();

  // Canonical mapping for common variations
  if (
    lower === 'digital marketing' || 
    lower === 'marketing' || 
    lower === 'media buying' || 
    lower === 'تسويق' || 
    lower === 'التسويق الرقمي' ||
    lower === 'ميديا باينج'
  ) {
    return 'Digital Marketing';
  }

  if (
    lower === 'cyber security' || 
    lower === 'cybersecurity' || 
    lower === 'security' || 
    lower === 'information security' || 
    lower === 'أمن سيبراني' || 
    lower === 'الأمن السيبراني'
  ) {
    return 'Cybersecurity';
  }

  if (
    lower === 'web development' || 
    lower === 'web dev' || 
    lower === 'frontend' || 
    lower === 'backend' || 
    lower === 'fullstack' || 
    lower === 'تطوير الويب' ||
    lower === 'برمجة المواقع'
  ) {
    return 'Web Development';
  }

  if (
    lower === 'programming' || 
    lower === 'coding' || 
    lower === 'software engineering' || 
    lower === 'برمجة' || 
    lower === 'البرمجة'
  ) {
    return 'Programming';
  }

  if (
    lower === 'design' || 
    lower === 'ui/ux' || 
    lower === 'design & ui/ux' || 
    lower === 'graphic design' || 
    lower === 'تصميم' || 
    lower === 'التصميم' ||
    lower === 'تصميم واجهات'
  ) {
    return 'Design & UI/UX';
  }

  if (
    lower === 'ai' || 
    lower === 'ai & machine learning' || 
    lower === 'artificial intelligence' || 
    lower === 'machine learning' || 
    lower === 'ذكاء اصطناعي' || 
    lower === 'الذكاء الاصطناعي'
  ) {
    return 'AI & Machine Learning';
  }

  if (
    lower === 'mobile' || 
    lower === 'mobile apps' || 
    lower === 'mobile development' || 
    lower === 'flutter' || 
    lower === 'تطبيقات الموبايل' ||
    lower === 'موبايل'
  ) {
    return 'Mobile Apps';
  }

  if (
    lower === 'devops' || 
    lower === 'devops & cloud' || 
    lower === 'cloud' || 
    lower === 'الحوسبة السحابية'
  ) {
    return 'DevOps & Cloud';
  }

  if (
    lower === 'data science' || 
    lower === 'data analysis' || 
    lower === 'علوم البيانات'
  ) {
    return 'Data Science';
  }

  // Capitalize each word properly for any other custom category while preserving common uppercase acronyms
  const upperAcronyms = new Set([
    'AI', 'UI', 'UX', 'UI/UX', '3D', '2D', 'CAD', 'SEO', 'SEM', 'IOT', 'API',
    'AWS', 'GCP', 'SQL', 'NOSQL', 'CSS', 'HTML', 'JS', 'TS', 'PHP', 'C#', 'C++',
    'ERP', 'CRM', 'SAAS', 'B2B', 'B2C', 'AR', 'VR', 'XR', 'QA', 'IT', 'HR', 'PR', 'BIM'
  ]);
  return trimmed
    .split(/\s+/)
    .map(w => {
      const upper = w.toUpperCase();
      if (upperAcronyms.has(upper)) return upper;
      if (upper === 'DEVOPS') return 'DevOps';
      if (upper === 'IOS') return 'iOS';
      if (upper === 'AUTOCAD') return 'AutoCAD';
      if (upper === 'SOLIDWORKS') return 'SolidWorks';
      if (upper === 'WORDPRESS') return 'WordPress';
      if (upper === 'JAVASCRIPT') return 'JavaScript';
      if (upper === 'TYPESCRIPT') return 'TypeScript';
      // Preserve words that already contain intentional mixed case or slashes (e.g. UI/UX, CI/CD)
      if (w.includes('/')) {
        return w
          .split('/')
          .map(part => {
            const pUp = part.toUpperCase();
            return upperAcronyms.has(pUp) ? pUp : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          })
          .join('/');
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Checks if a course matches a selected category filter with robust canonical equality.
 */
export function matchCourseCategory(courseCategory?: string, selectedCategory?: string): boolean {
  if (!selectedCategory || selectedCategory === 'All') return true;
  return normalizeCategory(courseCategory) === normalizeCategory(selectedCategory);
}

/**
 * Returns a human-friendly localized category label.
 */
export function getCategoryDisplayName(category: string, isRtl: boolean): string {
  const norm = normalizeCategory(category);
  
  if (norm === 'All' || category === 'All') {
    return isRtl ? 'جميع التصنيفات' : 'All Categories';
  }

  if (!isRtl) {
    return norm;
  }

  // Arabic translations
  const arMap: Record<string, string> = {
    'Web Development': 'تطوير الويب',
    'Programming': 'البرمجة والتطوير',
    'Cybersecurity': 'الأمن السيبراني',
    'Design & UI/UX': 'التصميم وواجهات المستخدم',
    'Digital Marketing': 'التسويق الرقمي والميديا باينج',
    'AI & Machine Learning': 'الذكاء الاصطناعي والأتمتة',
    'Mobile Apps': 'تطبيقات الموبايل',
    'DevOps & Cloud': 'الحوسبة السحابية وDevOps',
    'Data Science': 'علوم البيانات',
    'Other': 'أخرى'
  };

  return arMap[norm] || category;
}

/**
 * Extracts a dependable numeric timestamp for chronological sorting.
 * Ensures that newly added courses ALWAYS have higher timestamps than older seed courses.
 */
export function getCourseTimestamp(c: Course): number {
  if (typeof c.createdAt === 'number' && !isNaN(c.createdAt) && c.createdAt > 0) {
    return c.createdAt;
  }

  // If ID has timestamp like "v1778437317088" or "17..."
  const match = c.id.match(/\d{10,13}/);
  if (match) {
    const ts = parseInt(match[0], 10);
    if (!isNaN(ts) && ts > 1000000000000) return ts;
  }

  // Deterministic baseline dates for legacy seed courses (Nov 2024 baseline)
  // Ensures newer seed courses (Arabic additions) are ordered, but any newly added course is much higher.
  const baselineSeedTimestamps: Record<string, number> = {
    'glpr5t': 1735000000000 + 700000,
    'm1pdcj': 1735000000000 + 600000,
    '4ptzav': 1735000000000 + 500000,
    '312ar': 1735000000000 + 400000,
    'l02pbl': 1735000000000 + 300000,
    'ipkxu': 1735000000000 + 200000,
    'full-react-course-2024': 1730000000000 + 500000,
    'cyber-security-full-course': 1730000000000 + 400000,
    'ceh-prep': 1730000000000 + 300000,
    'python-for-security': 1730000000000 + 200000,
    'comptia-a-plus': 1730000000000 + 100000,
    'network-basics': 1730000000000,
    'javascript-basics': 1729000000000 + 300000,
    'css-grid': 1729000000000 + 200000,
    'react-basics': 1729000000000 + 100000,
    'html-crash-course': 1729000000000
  };

  return baselineSeedTimestamps[c.id] || 1725000000000;
}

/**
 * Checks if a course is recently added (within the last 30 days) or among the top newest additions.
 */
export function isCourseNew(c: Course, allCourses?: Course[]): boolean {
  const ts = getCourseTimestamp(c);
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  // Real timestamp created in last 30 days
  if (ts && (now - ts) < thirtyDaysMs && ts > 1735000000000) {
    return true;
  }

  // If allCourses provided, check if it's in the top 3 newest courses
  if (allCourses && allCourses.length > 0) {
    const topNewestIds = [...allCourses]
      .sort((a, b) => getCourseTimestamp(b) - getCourseTimestamp(a))
      .slice(0, 3)
      .map(item => item.id);

    return topNewestIds.includes(c.id);
  }

  return false;
}

export interface CategorySummary {
  name: string;
  count: number;
  subCategories: string[];
}

/**
 * Checks whether a course is a single-video Masterclass (displayed on the Masterclasses page).
 */
export function isMasterclassCourse(course?: Partial<Course> | null): boolean {
  if (!course) return false;
  return course.isSingleVideo === true || String(course.isSingleVideo).toLowerCase() === 'true';
}

/**
 * Checks whether a course is a Real-World Project Build (practical project playlist or long video).
 */
export function isProjectCourse(course?: Partial<Course> | null): boolean {
  if (!course) return false;
  return course.isProject === true || String((course as any).isProject).toLowerCase() === 'true';
}

/**
 * Checks whether a course is eligible for an official certificate.
 * Only structured Playlists (Courses page, Playlists inside Learning Paths, and Project Playlists) grant certificates.
 * Single-video Masterclasses and single-video Full-Build sessions do NOT grant certificates.
 */
export function isCertificateEligible(course?: Partial<Course> | null): boolean {
  if (!course) return false;
  return !isMasterclassCourse(course);
}

/**
 * Checks whether a course is eligible for the exclusive Real-World Project Build Certificate
 * (Must be a Project AND a multi-lesson Playlist, NOT a single-video masterclass).
 */
export function isProjectCertificateEligible(course?: Partial<Course> | null): boolean {
  if (!course) return false;
  return isProjectCourse(course) && !isMasterclassCourse(course);
}

/**
 * Generates an official, deterministic verifiable Certificate ID in the format:
 * ATLAS1337-SKILLIQ-<CODE>
 * Encodes user, course, and completion signature into a clean alphanumeric code that can be verified anytime.
 */
export function buildCertificateId(
  courseId?: string,
  userId?: string,
  completionDate?: string | number,
  isDemo = false
): string {
  if (isDemo || !courseId || courseId === 'demo' || courseId === 'demo-project') {
    return 'ATLAS1337-SKILLIQ-DEMO77X9';
  }

  const cleanCourse = courseId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
  const cleanUser = (userId || 'USER88').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3).padEnd(3, '9');

  // Create a deterministic 3-char alphanumeric hash from courseId + userId + completionDate
  const seedStr = `${courseId}:${userId || 'anon'}:${completionDate || '2026'}`;
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const suffix = Math.abs(hash).toString(36).toUpperCase().slice(0, 3).padEnd(3, '7');

  return `ATLAS1337-SKILLIQ-${cleanCourse}${cleanUser}${suffix}`;
}

/**
 * Matches a course from an official ATLAS1337-SKILLIQ-<CODE> (or legacy NX-*) certificate ID.
 */
export function matchCourseFromCertificateId(certId: string, allCourses: Course[]): Course | null {
  const clean = certId.trim().toUpperCase();
  if (!clean) return null;

  if (clean.startsWith('ATLAS1337-SKILLIQ-')) {
    const codePart = clean.replace('ATLAS1337-SKILLIQ-', '').trim();
    if (codePart.length >= 4 && !codePart.startsWith('DEMO')) {
      const coursePrefix = codePart.slice(0, 4).toLowerCase();
      return (
        allCourses.find(c => {
          if (!isCertificateEligible(c)) return false;
          const normId = c.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          return normId.startsWith(coursePrefix);
        }) || null
      );
    }
  }

  // Legacy support for NX-* IDs
  const parts = clean.split('-');
  if (parts.length >= 3 && parts[0] === 'NX') {
    const coursePrefix = (parts[1] === 'PROJ' ? parts[3] : parts[2])?.toLowerCase();
    if (coursePrefix) {
      return (
        allCourses.find(c => isCertificateEligible(c) && c.id.toLowerCase().startsWith(coursePrefix)) ||
        null
      );
    }
  }

  return null;
}

export interface CourseEducatorInfo {
  professorName: string;
  youtubeChannelName: string;
  youtubeHandle?: string;
}

const KNOWN_EDUCATORS: Record<string, { professorName: string; youtubeChannelName: string }> = {
  'traversy media': { professorName: 'Prof. Brad Traversy', youtubeChannelName: 'Traversy Media' },
  "jeremy's it lab": { professorName: 'Prof. Jeremy McDowell', youtubeChannelName: "Jeremy's IT Lab" },
  'networkchuck': { professorName: 'Prof. Chuck Keith', youtubeChannelName: 'NetworkChuck' },
  'professor messer': { professorName: 'Prof. James Messer', youtubeChannelName: 'Professor Messer' },
  'hackersploit': { professorName: 'Prof. Alexis Ahmed', youtubeChannelName: 'HackerSploit' },
  'elzero web school': { professorName: 'Prof. Osama Elzero', youtubeChannelName: 'Elzero Web School' },
  'wael abo hamza': { professorName: 'Prof. Wael Abo Hamza', youtubeChannelName: 'Wael Abo Hamza' },
  'freecodecamp.org': { professorName: 'Prof. Quincy Larson & Faculty', youtubeChannelName: 'freeCodeCamp.org' },
  'freecodecamp': { professorName: 'Prof. Quincy Larson & Faculty', youtubeChannelName: 'freeCodeCamp.org' },
  'simplilearn': { professorName: 'Prof. Simplilearn Faculty', youtubeChannelName: 'Simplilearn' },
  'edureka': { professorName: 'Prof. Edureka Faculty', youtubeChannelName: 'edureka!' },
  'programming with mosh': { professorName: 'Prof. Mosh Hamedani', youtubeChannelName: 'Programming with Mosh' },
  'mosh hamedani': { professorName: 'Prof. Mosh Hamedani', youtubeChannelName: 'Programming with Mosh' },
  'fireship': { professorName: 'Prof. Jeff Delaney', youtubeChannelName: 'Fireship' },
  'the net ninja': { professorName: 'Prof. Shaun Pelling', youtubeChannelName: 'Net Ninja' },
  'net ninja': { professorName: 'Prof. Shaun Pelling', youtubeChannelName: 'Net Ninja' },
  'bro code': { professorName: 'Prof. Chris (Bro Code)', youtubeChannelName: 'Bro Code' },
  'dave gray': { professorName: 'Prof. Dave Gray', youtubeChannelName: 'Dave Gray' },
  'web dev simplified': { professorName: 'Prof. Kyle Cook', youtubeChannelName: 'Web Dev Simplified' },
  'kevin powell': { professorName: 'Prof. Kevin Powell', youtubeChannelName: 'Kevin Powell' },
  'david bombal': { professorName: 'Prof. David Bombal', youtubeChannelName: 'David Bombal' },
  'john hammond': { professorName: 'Prof. John Hammond', youtubeChannelName: 'John Hammond' },
  'the cyber mentor': { professorName: 'Prof. Heath Adams', youtubeChannelName: 'TCM Security' },
  'tcm security': { professorName: 'Prof. Heath Adams', youtubeChannelName: 'TCM Security' },
  'codewithharry': { professorName: 'Prof. Haris Ali Khan', youtubeChannelName: 'CodeWithHarry' },
  'techworld with nana': { professorName: 'Prof. Nana Janashia', youtubeChannelName: 'TechWorld with Nana' },
  'abdelrahman gamal': { professorName: 'Prof. Abdelrahman Gamal', youtubeChannelName: 'Abdelrahman Gamal' },
  'codezilla': { professorName: 'Prof. Islam Hesham', youtubeChannelName: 'Codezilla' },
  'tarmeez academy': { professorName: 'Prof. Yarob Al-Mustafa', youtubeChannelName: 'Tarmeez Academy' },
  'أكاديمية ترميز': { professorName: 'Prof. Yarob Al-Mustafa', youtubeChannelName: 'أكاديمية ترميز' },
  'almuhandis': { professorName: 'Prof. Almuhandis', youtubeChannelName: 'Almuhandis' },
  'سكوب': { professorName: 'Prof. سكوب', youtubeChannelName: 'سكوب' },
};

function formatProfessorPrefix(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Prof. Course Educator';
  if (/^(prof\.?|professor|dr\.?|mr\.?|أ\.|الأستاذ|د\.)\s/i.test(trimmed)) {
    return trimmed.replace(/^professor\s+/i, 'Prof. ');
  }
  return `Prof. ${trimmed}`;
}

/**
 * Resolves the Professor (Teacher Name) and Official YouTube Channel Name for any course
 * so certificates can properly honor and credit the educator.
 */
export function resolveCourseEducator(course?: Partial<Course> | null): CourseEducatorInfo {
  if (!course) {
    return {
      professorName: 'Prof. Brad Traversy',
      youtubeChannelName: 'Traversy Media',
      youtubeHandle: '@TraversyMedia'
    };
  }

  const rawInstructor = (course.instructor || '').trim();
  const normKey = rawInstructor.toLowerCase();
  const known = KNOWN_EDUCATORS[normKey];

  let youtubeHandle: string | undefined;
  if (course.instructorUrl) {
    const handleMatch = course.instructorUrl.match(/youtube\.com\/(@[a-zA-Z0-9_.-]+)/i);
    if (handleMatch && handleMatch[1]) {
      youtubeHandle = handleMatch[1];
    }
  }

  const professorName = course.professorName?.trim()
    ? formatProfessorPrefix(course.professorName)
    : known
    ? known.professorName
    : formatProfessorPrefix(rawInstructor || 'Course Educator');

  const youtubeChannelName = course.youtubeChannelName?.trim()
    ? course.youtubeChannelName.trim()
    : known
    ? known.youtubeChannelName
    : (rawInstructor || 'Official YouTube Educator');

  return {
    professorName,
    youtubeChannelName,
    youtubeHandle
  };
}

/**
 * Builds an aggregated, deduplicated category summary list from courses.
 * Guarantees NO duplicate category names.
 */
export function buildDeduplicatedCategories(courses: Course[]): CategorySummary[] {
  const map = new Map<string, { count: number; subCategories: Set<string> }>();

  courses.forEach(c => {
    const norm = normalizeCategory(c.category);
    if (!map.has(norm)) {
      map.set(norm, { count: 0, subCategories: new Set() });
    }
    const entry = map.get(norm)!;
    entry.count += 1;
    if (c.subCategory && c.subCategory.trim()) {
      entry.subCategories.add(c.subCategory.trim());
    }
  });

  // Sort categories by highest course count first for a rich user experience
  const sortedCategories: CategorySummary[] = Array.from(map.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      subCategories: Array.from(data.subCategories).sort()
    }))
    .sort((a, b) => b.count - a.count);

  return [
    { name: 'All', count: courses.length, subCategories: [] },
    ...sortedCategories
  ];
}
