import fs from 'fs';
import path from 'path';

const translationsToAdd = {
  analytics: { en: 'Analytics', ar: 'التحليلات' },
  courses: { en: 'Courses', ar: 'الدورات' },
  paths: { en: 'Paths', ar: 'المسارات' },
  settings: { en: 'Settings', ar: 'الإعدادات' },
  manage_courses: { en: 'Manage Courses & Masterclasses', ar: 'إدارة الدورات والماستر كلاس' },
  add_course: { en: 'Add Course', ar: 'إضافة دورة' },
  search_courses_admin: { en: 'Search courses by title or instructor...', ar: 'ابحث عن الدورات بالعنوان أو المدرب...' },
  page: { en: 'Page', ar: 'صفحة' },
  of: { en: 'of', ar: 'من' },
  previous: { en: 'Previous', ar: 'السابق' },
  next: { en: 'Next', ar: 'التالي' },
  manage_paths: { en: 'Manage Learning Paths', ar: 'إدارة مسارات التعلم' },
  add_path: { en: 'Add Path', ar: 'إضافة مسار' },
  courses_linked: { en: 'Courses Linked', ar: 'دورات مرتبطة' }
};

const i18nPath = path.resolve('src/i18n.ts');
let content = fs.readFileSync(i18nPath, 'utf-8');

// Insert english keys
const enMatch = content.match(/en:\s*{\s*translation:\s*{([^}]+)}/s);
if (enMatch) {
  let inner = enMatch[1];
  for (const [key, t] of Object.entries(translationsToAdd)) {
    if (!inner.includes(`"${key}"`)) {
      inner += `,
      "${key}": "${t.en.replace(/"/g, '\\"')}"`;
    }
  }
  content = content.replace(enMatch[1], inner);
}

// Insert arabic keys
const arMatch = content.match(/ar:\s*{\s*translation:\s*{([^}]+)}/s);
if (arMatch) {
  let inner = arMatch[1];
  for (const [key, t] of Object.entries(translationsToAdd)) {
    if (!inner.includes(`"${key}"`)) {
      inner += `,
      "${key}": "${t.ar.replace(/"/g, '\\"')}"`;
    }
  }
  content = content.replace(arMatch[1], inner);
}

fs.writeFileSync(i18nPath, content, 'utf-8');
console.log('Updated i18n.ts with Admin translations');
