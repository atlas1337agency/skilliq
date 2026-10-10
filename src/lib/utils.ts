import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function filterByLanguage<T extends { language?: string; title?: string; instructor?: string; description?: string }>(items: T[], currentAppLanguage: 'en' | 'ar'): T[] {
  const isArabicTarget = currentAppLanguage === 'ar';
  return items.filter(item => {
    const rawLang = (item.language || '').toLowerCase().trim();
    if (rawLang === 'both' || rawLang === 'all') return true;

    if (rawLang === 'arabic' || rawLang === 'ar') {
      return isArabicTarget;
    }
    if (rawLang === 'english' || rawLang === 'en') {
      return !isArabicTarget;
    }

    // If language is not explicitly specified, detect based on Arabic characters
    const textToCheck = `${item.title || ''} ${item.instructor || ''} ${item.description || ''}`;
    const hasArabicScript = /[\u0600-\u06FF]/.test(textToCheck);

    if (isArabicTarget) {
      return hasArabicScript;
    } else {
      return !hasArabicScript;
    }
  });
}

export function filterPathsByLanguage(paths: any[], courses: any[], currentAppLanguage: 'en' | 'ar'): any[] {
  const isArabicTarget = currentAppLanguage === 'ar';
  return paths.filter(path => {
    const rawLang = (path.language || '').toLowerCase().trim();
    if (rawLang === 'arabic' || rawLang === 'ar') {
      return isArabicTarget;
    }
    if (rawLang === 'english' || rawLang === 'en') {
      return !isArabicTarget;
    }
    if (rawLang === 'both' || rawLang === 'all') {
      return true;
    }

    const pathCourses = (path.courseIds || []).map((id: string) => courses.find((c: any) => c.id === id)).filter(Boolean);
    if (pathCourses.length > 0) {
      const filteredPathCourses = filterByLanguage(pathCourses, currentAppLanguage);
      return filteredPathCourses.length > 0;
    }
    // If a newly created path has no linked courses yet (e.g. only graphic roadmap), filter by path title/description language
    return filterByLanguage([path], currentAppLanguage).length > 0;
  });
}
