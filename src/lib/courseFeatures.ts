import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { Course } from '../data/courses';

export interface CourseFeaturesConfig {
  courseId: string;
  enableSandbox: boolean;      // Terminal / Code Sandbox
  enableFlashcards: boolean;   // Smart Flashcards (Spaced Repetition)
  enableLessonQuiz: boolean;   // Lesson Quiz (Quick test per video)
  enableCourseExam: boolean;   // Course Exam & Certificate Quiz
  sandboxMode?: 'terminal' | 'frontend' | 'python' | 'javascript' | 'sql';
  flashcardsCategory?: string;
  updatedAt?: number;
}

const CACHE_KEY = 'skilliq_course_features_v1';

// In-memory cache for ultra-fast synchronous lookup in React render cycles
let memoryCache: Record<string, CourseFeaturesConfig> = {};

// Load initial cache from localStorage if available
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      memoryCache = JSON.parse(raw);
    }
  }
} catch {
  // ignore
}

/**
 * Save memory cache to localStorage safely
 */
function persistMemoryCache() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache));
    }
  } catch {
    // ignore quota errors
  }
}

/**
 * Checks if a specific interactive feature is enabled for a given course.
 * CRITICAL RULE: If the Admin did not explicitly choose/enable the feature for this course,
 * it returns false (hidden by default).
 */
export function isFeatureEnabledForCourse(
  course: Course | null | undefined,
  feature: 'sandbox' | 'flashcards' | 'lessonQuiz' | 'courseExam',
  featuresMap?: Record<string, CourseFeaturesConfig>
): boolean {
  if (!course || !course.id) return false;

  const courseId = course.id;
  const config = 
    (featuresMap && (featuresMap[courseId] || (course.playlistId ? featuresMap[course.playlistId] : undefined))) ||
    memoryCache[courseId] ||
    (course.playlistId ? memoryCache[course.playlistId] : undefined);

  if (config) {
    switch (feature) {
      case 'sandbox':
        return Boolean(config.enableSandbox);
      case 'flashcards':
        return Boolean(config.enableFlashcards);
      case 'lessonQuiz':
        return Boolean(config.enableLessonQuiz);
      case 'courseExam':
        return Boolean(config.enableCourseExam);
      default:
        return false;
    }
  }

  // Fallback to flags directly on the course model if present (strictly false by default)
  switch (feature) {
    case 'sandbox':
      return Boolean(course.enableSandbox);
    case 'flashcards':
      return Boolean(course.enableFlashcards);
    case 'lessonQuiz':
      return Boolean(course.enableLessonQuiz);
    case 'courseExam':
      return Boolean(course.enableCourseExam);
    default:
      return false;
  }
}

/**
 * Fetches the interactive features configuration for a specific course from Firestore
 */
export async function fetchCourseFeatures(courseId: string): Promise<CourseFeaturesConfig | null> {
  if (!courseId) return null;

  try {
    const snap = await getDoc(doc(db, 'course_features', courseId));
    if (snap.exists()) {
      const data = snap.data() as CourseFeaturesConfig;
      memoryCache[courseId] = {
        courseId,
        enableSandbox: Boolean(data.enableSandbox),
        enableFlashcards: Boolean(data.enableFlashcards),
        enableLessonQuiz: Boolean(data.enableLessonQuiz),
        enableCourseExam: Boolean(data.enableCourseExam),
        sandboxMode: data.sandboxMode,
        flashcardsCategory: data.flashcardsCategory,
        updatedAt: data.updatedAt
      };
      persistMemoryCache();
      return memoryCache[courseId];
    }
  } catch (err) {
    console.warn(`[courseFeatures] Failed to fetch features for course ${courseId}:`, err);
  }

  return memoryCache[courseId] || null;
}

/**
 * Fetches all course features configurations from Firestore for the Admin panel
 */
export async function fetchAllCourseFeatures(): Promise<Record<string, CourseFeaturesConfig>> {
  const result: Record<string, CourseFeaturesConfig> = { ...memoryCache };

  try {
    const snap = await getDocs(collection(db, 'course_features'));
    snap.docs.forEach((d) => {
      const data = d.data() as CourseFeaturesConfig;
      const cid = data.courseId || d.id;
      result[cid] = {
        courseId: cid,
        enableSandbox: Boolean(data.enableSandbox),
        enableFlashcards: Boolean(data.enableFlashcards),
        enableLessonQuiz: Boolean(data.enableLessonQuiz),
        enableCourseExam: Boolean(data.enableCourseExam),
        sandboxMode: data.sandboxMode,
        flashcardsCategory: data.flashcardsCategory,
        updatedAt: data.updatedAt
      };
      memoryCache[cid] = result[cid];
    });
    persistMemoryCache();
  } catch (err) {
    console.warn('[courseFeatures] Failed to fetch all course features:', err);
  }

  return result;
}

/**
 * Saves or updates interactive features settings for a course (called by Admin)
 */
export async function saveCourseFeatures(
  courseId: string,
  features: Partial<CourseFeaturesConfig>
): Promise<CourseFeaturesConfig> {
  if (!courseId) throw new Error('Course ID is required');

  const existing = memoryCache[courseId] || {
    courseId,
    enableSandbox: false,
    enableFlashcards: false,
    enableLessonQuiz: false,
    enableCourseExam: false,
  };

  const updated: CourseFeaturesConfig = {
    ...existing,
    ...features,
    courseId,
    updatedAt: Date.now()
  };

  memoryCache[courseId] = updated;
  persistMemoryCache();

  // Also sync in-memory useStore courses if available so UI reflects toggles immediately
  try {
    const { useStore } = await import('../store/useStore');
    const curCourses = useStore.getState().courses;
    const updatedCourses = curCourses.map(c => c.id === courseId ? {
      ...c,
      enableSandbox: updated.enableSandbox,
      enableFlashcards: updated.enableFlashcards,
      enableLessonQuiz: updated.enableLessonQuiz,
      enableCourseExam: updated.enableCourseExam,
    } : c);
    useStore.setState({ courses: updatedCourses });
  } catch {
    // ignore
  }

  try {
    await setDoc(doc(db, 'course_features', courseId), updated);
  } catch (err) {
    console.error(`[courseFeatures] Failed to save features for course ${courseId}:`, err);
    throw err;
  }

  return updated;
}

