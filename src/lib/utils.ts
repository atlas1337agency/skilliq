import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function filterByLanguage<T extends { language?: string }>(items: T[], currentAppLanguage: 'en' | 'ar'): T[] {
  const targetLang = currentAppLanguage === 'en' ? 'English' : 'Arabic';
  return items.filter(item => {
    if (!item.language) return true;
    if (item.language === targetLang) return true;
    if (item.language === 'Both') return true;
    return false;
  });
}

export function filterPathsByLanguage(paths: any[], courses: any[], currentAppLanguage: 'en' | 'ar'): any[] {
  return paths.filter(path => {
    // A path is visible if it has AT LEAST ONE course that matches the current language
    const pathCourses = path.courseIds.map((id: string) => courses.find((c: any) => c.id === id)).filter(Boolean);
    const filteredPathCourses = filterByLanguage(pathCourses, currentAppLanguage);
    return filteredPathCourses.length > 0;
  });
}
