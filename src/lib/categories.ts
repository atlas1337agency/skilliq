import { Course } from '../data/courses';

/**
 * Normalizes any category string into a standardized, canonical category name.
 * Prevents duplicate categories caused by casing, whitespace, or slight spelling differences
 * (e.g., "digital marketing" vs "Digital Marketing", "Cybersecurity" vs "Cyber Security").
 */
export function normalizeCategoryName(rawCategory?: string): string {
  if (!rawCategory) return 'Other';
  const clean = rawCategory.trim();
  const lower = clean.toLowerCase();

  if (lower === 'all' || lower === 'الكل') return 'All';

  // Web Development
  if (
    lower === 'web development' ||
    lower.includes('web dev') ||
    lower.includes('frontend') ||
    lower.includes('backend') ||
    lower.includes('fullstack') ||
    lower.includes('تطوير الويب') ||
    lower.includes('ويب')
  ) {
    return 'Web Development';
  }

  // Cyber Security
  if (
    lower.includes('cyber') ||
    lower.includes('security') ||
    lower.includes('ethical hacking') ||
    lower.includes('hacking') ||
    lower.includes('penetration') ||
    lower.includes('أمن') ||
    lower.includes('سيبراني')
  ) {
    return 'Cyber Security';
  }

  // Programming
  if (
    lower === 'programming' ||
    lower === 'coding' ||
    lower.includes('software') ||
    lower.includes('برمجة') ||
    lower.includes('تطوير البرمجيات')
  ) {
    return 'Programming';
  }

  // AI & Machine Learning
  if (
    lower === 'ai' ||
    lower.includes('artificial intelligence') ||
    lower.includes('machine learning') ||
    lower.includes('automation') ||
    lower.includes('n8n') ||
    lower.includes('ذكاء') ||
    lower.includes('اصطناعي')
  ) {
    return 'AI & Machine Learning';
  }

  // Digital Marketing
  if (
    lower.includes('marketing') ||
    lower.includes('media buy') ||
    lower.includes('تسويق') ||
    lower.includes('ميديا باينج')
  ) {
    return 'Digital Marketing';
  }

  // Design & UI/UX
  if (
    lower.includes('design') ||
    lower.includes('ui/ux') ||
    lower.includes('ui') ||
    lower.includes('ux') ||
    lower.includes('3d') ||
    lower.includes('sketchup') ||
    lower.includes('تصميم') ||
    lower.includes('جرافيك')
  ) {
    return 'Design & UI/UX';
  }

  // Mobile Development
  if (
    lower.includes('mobile') ||
    lower.includes('flutter') ||
    lower.includes('dart') ||
    lower.includes('android') ||
    lower.includes('ios') ||
    lower.includes('موبايل') ||
    lower.includes('تطبيقات')
  ) {
    return 'Mobile Development';
  }

  // DevOps & Cloud
  if (
    lower.includes('devops') ||
    lower.includes('cloud') ||
    lower.includes('docker') ||
    lower.includes('kubernetes') ||
    lower.includes('aws') ||
    lower.includes('سحابة')
  ) {
    return 'DevOps & Cloud';
  }

  // Data Science
  if (
    lower.includes('data science') ||
    lower.includes('data analysis') ||
    lower.includes('بيانات')
  ) {
    return 'Data Science';
  }

  // Standardize capitalization for any custom category (e.g. "Languages" -> "Languages")
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Returns localized label for a normalized category
 */
export function getCategoryDisplayTitle(catName: string, language: 'en' | 'ar' = 'en'): string {
  const norm = normalizeCategoryName(catName);
  const isAr = language === 'ar';

  if (norm === 'All') return isAr ? 'جميع التصنيفات' : 'All Categories';
  if (norm === 'Web Development') return isAr ? 'تطوير الويب' : 'Web Development';
  if (norm === 'Cyber Security') return isAr ? 'الأمن السيبراني' : 'Cyber Security';
  if (norm === 'Programming') return isAr ? 'البرمجة' : 'Programming';
  if (norm === 'AI & Machine Learning') return isAr ? 'الذكاء الاصطناعي' : 'AI & Machine Learning';
  if (norm === 'Design & UI/UX') return isAr ? 'التصميم و UI/UX' : 'Design & UI/UX';
  if (norm === 'Digital Marketing') return isAr ? 'التسويق الرقمي' : 'Digital Marketing';
  if (norm === 'Mobile Development') return isAr ? 'تطوير الموبايل' : 'Mobile Development';
  if (norm === 'DevOps & Cloud') return isAr ? 'السحابة و DevOps' : 'DevOps & Cloud';
  if (norm === 'Data Science') return isAr ? 'علم البيانات' : 'Data Science';

  return norm;
}

/**
 * Robust timestamp extractor to guarantee newly added courses are always sorted at the top.
 */
export function getCourseTimestamp(course: Course): number {
  if (course.createdAt && typeof course.createdAt === 'number') {
    return course.createdAt;
  }
  // Try extracting timestamp from ID (e.g., v1778437317088 or course_1730000000)
  const tsMatch = course.id?.match(/\d{10,13}/);
  if (tsMatch) {
    const val = parseInt(tsMatch[0], 10);
    if (!isNaN(val)) {
      return val > 1000000000000 ? val : val * 1000;
    }
  }
  // Fallback baseline for initial seed courses
  return 1700000000000;
}

/**
 * Check if a course is recently created (e.g., created within 60 days or top newest)
 */
export function isNewCourse(course: Course, allCourses: Course[]): boolean {
  const ts = getCourseTimestamp(course);
  const now = Date.now();
  // If created within the last 60 days
  if (now - ts < 60 * 24 * 60 * 60 * 1000 && ts > 1700000000000) {
    return true;
  }
  // Or if it is among the newest additions
  const sorted = [...allCourses].sort((a, b) => getCourseTimestamp(b) - getCourseTimestamp(a));
  return sorted.slice(0, 3).some(c => c.id === course.id);
}
