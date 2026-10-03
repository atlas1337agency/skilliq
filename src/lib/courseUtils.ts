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

  // Capitalize each word properly for any other custom category
  return trimmed
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
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
