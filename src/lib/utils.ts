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
  return paths.filter(path => {
    // A path is visible if it has AT LEAST ONE course that matches the current language
    const pathCourses = (path.courseIds || []).map((id: string) => courses.find((c: any) => c.id === id)).filter(Boolean);
    const filteredPathCourses = filterByLanguage(pathCourses, currentAppLanguage);
    return filteredPathCourses.length > 0;
  });
}
