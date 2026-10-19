import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { courses as defaultCourses, learningPaths as defaultPaths, categories as defaultCategories, defaultBanners, defaultBooks, Course, LearningPath, Category, AppNotification, AdBannerData, Book } from '../data/courses';
import { fetchFirestoreContent, addOrUpdateCourse, LEGACY_SEED_PROJECT_IDS } from '../lib/firestoreContent';
import { syncAllCoursesLiveBackground, applyCachedStatsToCourses } from '../lib/youtube';
import { PublicProfile, awardXPAndBadges, initializeOrUpdateProfile } from '../lib/gamification';
import { recordPlatformMovement } from '../lib/telemetry';

// Immediate cleanup of bloated historical localStorage items to prevent QuotaExceededError
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const rawNexa = localStorage.getItem('nexa-store-storage');
    if (rawNexa && (rawNexa.includes('"courses"') || rawNexa.includes('"allCourses"') || rawNexa.length > 50000)) {
      try {
        const parsed = JSON.parse(rawNexa);
        if (parsed?.state) {
          delete parsed.state.courses;
          delete parsed.state.allCourses;
          delete parsed.state.books;
          delete parsed.state.allBooks;
          delete parsed.state.learningPaths;
          delete parsed.state.categories;
          delete parsed.state.banners;
          localStorage.setItem('nexa-store-storage', JSON.stringify(parsed));
        } else {
          localStorage.removeItem('nexa-store-storage');
        }
      } catch {
        localStorage.removeItem('nexa-store-storage');
      }
    }
    // Also clean up heavy youtube stats cache if oversized
    const rawStats = localStorage.getItem('skilliq_course_live_stats_v2');
    if (rawStats && (rawStats.includes('"videos"') || rawStats.length > 100000)) {
      localStorage.removeItem('skilliq_course_live_stats_v2');
    }
  }
} catch {
  // ignore
}

// Resilient localStorage wrapper that never throws unhandled QuotaExceededError
const safeLocalStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (err) {
      console.warn(`[safeLocalStorage] Storage write failed for '${name}' (QuotaExceeded), recovering:`, err);
      try {
        localStorage.removeItem('skilliq_course_live_stats_v2');
        localStorage.removeItem(name);
        localStorage.setItem(name, value);
      } catch {
        // Graceful failover to memory without crashing React
      }
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

interface Progress {
  courseId: string;
  completedVideoIds: string[];
  currentVideoId: string;
  isCompleted: boolean;
  completionDate?: string;
  videoTimestamps?: Record<string, number>;
  updatedAt?: string;
}

function cleanProgressForFirestore(prog: Progress): Record<string, any> {
  const clean: Record<string, any> = {
    courseId: prog.courseId,
    completedVideoIds: Array.isArray(prog.completedVideoIds) ? prog.completedVideoIds : [],
    isCompleted: Boolean(prog.isCompleted),
  };
  if (prog.currentVideoId) clean.currentVideoId = String(prog.currentVideoId).slice(0, 100);
  if (prog.completionDate) clean.completionDate = String(prog.completionDate).slice(0, 100);
  if (prog.updatedAt) clean.updatedAt = String(prog.updatedAt).slice(0, 100);
  if (prog.videoTimestamps && typeof prog.videoTimestamps === 'object') {
    const cleanTimestamps: Record<string, number> = {};
    for (const [vId, ts] of Object.entries(prog.videoTimestamps)) {
      if (typeof ts === 'number' && !isNaN(ts)) {
        cleanTimestamps[vId] = Math.floor(ts);
      }
    }
    clean.videoTimestamps = cleanTimestamps;
  }
  return clean;
}

export type FavoriteItemType = 'playlist' | 'masterclass' | 'path' | 'book';

export interface FavoriteItem {
  id: string;
  itemId: string;
  itemType: FavoriteItemType;
  savedAt: string;
}

interface StoreState {
  theme: 'light' | 'dark';
  language: 'en' | 'ar';
  progress: Record<string, Progress>;
  favorites: Record<string, FavoriteItem>;
  user: any | null;
  publicProfile: PublicProfile | null;
  userName: string;
  courses: Course[];
  allCourses: Course[];
  books: Book[];
  allBooks: Book[];
  learningPaths: LearningPath[];
  categories: Category[];
  notifications: AppNotification[];
  banners: AdBannerData[];
  isContentLoading: boolean;
  hasLoadedFromDb: boolean;
  isAuthModalOpen: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  setUser: (user: any) => void;
  setIsAuthModalOpen: (isOpen: boolean) => void;
  loadContent: (retryCount?: number) => Promise<void>;
  loadProgress: () => Promise<void>;
  loadFavorites: () => Promise<void>;
  toggleFavorite: (itemId: string, itemType: FavoriteItemType) => Promise<boolean>;
  isFavorite: (itemId: string, itemType: FavoriteItemType) => boolean;
  markVideoCompleted: (courseId: string, videoId: string, nextVideoId?: string) => Promise<void>;
  setCurrentVideo: (courseId: string, videoId: string) => Promise<void>;
  completeCourse: (courseId: string) => Promise<void>;
  saveVideoTimestamp: (courseId: string, videoId: string, timestamp: number) => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'en',
      progress: {},
      favorites: {},
      user: null,
      publicProfile: null,
      userName: 'Student',
      courses: defaultCourses,
      allCourses: defaultCourses,
      books: [],
      allBooks: [],
      learningPaths: defaultPaths,
      categories: defaultCategories,
      notifications: [],
      banners: [],
      isContentLoading: true,
      hasLoadedFromDb: false,
      isAuthModalOpen: false,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setIsAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
      setUser: async (user) => {
        // Reset progress on user switch to ensure strict per-user progress isolation
        set({ user, userName: user?.displayName || 'Student', progress: {} });
        if (user) {
          try {
            const profile = await initializeOrUpdateProfile(user);
            set({ publicProfile: profile });
            get().loadFavorites();
            get().loadProgress();
          } catch (err) {
            console.error("Failed to initialize public profile", err);
          }
        } else {
          set({ publicProfile: null, progress: {} });
        }
      },
      
      loadContent: async (retryCount = 0) => {
        try {
          const { courses, learningPaths, categories, notifications, banners, books } = await fetchFirestoreContent();
          let deletedBookIds: string[] = [];
          try {
            const rawDeleted = localStorage.getItem('deleted_book_ids');
            if (rawDeleted) deletedBookIds = JSON.parse(rawDeleted);
          } catch (e) {}

          const finalBooks = Array.isArray(books)
            ? books.filter(b => !deletedBookIds.includes(b.id))
            : defaultBooks.filter(b => !deletedBookIds.includes(b.id));
          const approvedBooks = finalBooks.filter(b => b.isApproved !== false);

          if (courses.length > 0 || learningPaths.length > 0) {
            let deletedCourseIds: string[] = [];
            try {
              const rawDeletedCourses = localStorage.getItem('deleted_course_ids');
              if (rawDeletedCourses) deletedCourseIds = JSON.parse(rawDeletedCourses);
            } catch (e) {}

            const cleanedCourses = courses.filter(
              c => !deletedCourseIds.includes(c.id) && !LEGACY_SEED_PROJECT_IDS.has(c.id)
            );

            const hydratedCourses = applyCachedStatsToCourses(cleanedCourses);
            const approvedCourses = hydratedCourses.filter(c => c.isApproved !== false);
            set({ 
              allCourses: hydratedCourses, 
              courses: approvedCourses, 
              allBooks: finalBooks,
              books: approvedBooks,
              learningPaths, 
              categories, 
              notifications: notifications || [], 
              banners: banners || [], 
              isContentLoading: false,
              hasLoadedFromDb: true
            });
            syncAllCoursesLiveBackground(hydratedCourses, (updatedMap) => {
              const latestAll = get().allCourses.map(c => updatedMap[c.id] || c);
              set({
                allCourses: latestAll,
                courses: latestAll.filter(c => c.isApproved !== false)
              });
              // If admin/creator is signed in, persist live-synced stats to Firestore
              const activeUser = get().user;
              if (activeUser && (activeUser.role === 'admin' || activeUser.role === 'creator')) {
                Object.values(updatedMap).forEach((updatedCourse) => {
                  addOrUpdateCourse(updatedCourse, true).catch(() => {});
                });
              }
            });
          } else {
            // Retain defaultCourses if DB returns empty
            const currentCourses = applyCachedStatsToCourses(get().courses.length > 0 ? get().courses : defaultCourses);
            set({ 
              courses: currentCourses, 
              allCourses: currentCourses, 
              allBooks: finalBooks,
              books: approvedBooks,
              learningPaths: defaultPaths, 
              categories: defaultCategories, 
              notifications: notifications || [], 
              banners: banners || [], 
              isContentLoading: false,
              hasLoadedFromDb: true
            });
            syncAllCoursesLiveBackground(currentCourses, (updatedMap) => {
              const latestAll = get().allCourses.map(c => updatedMap[c.id] || c);
              set({
                allCourses: latestAll,
                courses: latestAll.filter(c => c.isApproved !== false)
              });
            });
          }
        } catch (error: any) {
          console.error("Firestore loading error:", error);
          if (retryCount < 3) {
            console.log(`Retrying fetch... (${retryCount + 1}/3)`);
            setTimeout(() => {
              get().loadContent(retryCount + 1);
            }, 1000 * (retryCount + 1));
          } else {
            // Keep using the persisted cache if we fail, rather than default test courses.
            set({ isContentLoading: false });
          }
        }
      },

      loadProgress: async () => {
        const { user } = get();
        if (!user) {
          set({ progress: {} });
          return;
        }
        
        try {
          const { collection, getDocs } = await import('firebase/firestore');
          const querySnapshot = await getDocs(collection(db, `users/${user.uid}/progress`));
          const progressData: Record<string, Progress> = {};
          querySnapshot.forEach((doc) => {
            progressData[doc.id] = doc.data() as Progress;
          });
          set({ progress: progressData });
        } catch (error) {
          console.error("Error loading progress:", error);
        }
      },

      loadFavorites: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const profileSnap = await getDoc(doc(db, 'publicProfiles', user.uid));
          if (profileSnap.exists()) {
            const data = profileSnap.data();
            if (Array.isArray(data.favorites)) {
              const favMap: Record<string, FavoriteItem> = { ...(get().favorites || {}) };
              data.favorites.forEach((item: FavoriteItem) => {
                if (item && item.id) {
                  favMap[item.id] = item;
                }
              });
              set({ favorites: favMap });
            }
          }
        } catch (error) {
          console.error("Error loading favorites:", error);
        }
      },

      isFavorite: (itemId, itemType) => {
        const favKey = `${itemType}_${itemId}`;
        return Boolean(get().favorites?.[favKey]);
      },

      toggleFavorite: async (itemId, itemType) => {
        const state = get();
        const favKey = `${itemType}_${itemId}`;
        const currentFavs = { ...(state.favorites || {}) };
        const exists = Boolean(currentFavs[favKey]);

        if (exists) {
          delete currentFavs[favKey];
        } else {
          currentFavs[favKey] = {
            id: favKey,
            itemId,
            itemType,
            savedAt: new Date().toISOString()
          };
        }

        set({ favorites: currentFavs });

        if (state.user?.uid) {
          try {
            const favList = Object.values(currentFavs);
            await setDoc(
              doc(db, 'publicProfiles', state.user.uid),
              {
                uid: state.user.uid,
                favorites: favList
              },
              { merge: true }
            );
          } catch (error) {
            console.error("Error syncing favorites to profile:", error);
          }
        }

        if (!exists) {
          recordPlatformMovement({
            uid: state.user?.uid || null,
            userName: state.user?.displayName || 'Guest Visitor',
            userEmail: state.user?.email || '',
            userAvatar: state.user?.photoURL || '',
            actionType: 'favorite_toggled',
            path: typeof window !== 'undefined' ? window.location.pathname : '/',
            pageTitle: `Saved ${itemType}`,
            detail: `Saved ${itemType} (${itemId}) to Favorites`,
          });
        }

        return !exists;
      },

      markVideoCompleted: async (courseId, videoId, nextVideoId) => {
        const state = get();
        const courseProgress = state.progress[courseId] || {
          courseId,
          completedVideoIds: [],
          currentVideoId: videoId,
          isCompleted: false,
        };

        const isNewCompletion = !courseProgress.completedVideoIds.includes(videoId);

        const newCompleted = courseProgress.completedVideoIds.includes(videoId)
          ? courseProgress.completedVideoIds
          : [...courseProgress.completedVideoIds, videoId];

        const newProgress = {
          ...courseProgress,
          completedVideoIds: newCompleted,
          currentVideoId: nextVideoId || courseProgress.currentVideoId,
          updatedAt: new Date().toISOString(),
        };

        set({
          progress: {
            ...state.progress,
            [courseId]: newProgress,
          },
        });

        // Log daily completed lesson
        try {
          const todayStr = new Date().toISOString().split('T')[0];
          const key = `skilliq_lessons_done_${todayStr}`;
          const existing = JSON.parse(localStorage.getItem(key) || '[]');
          if (!existing.includes(videoId)) {
            existing.push(videoId);
            localStorage.setItem(key, JSON.stringify(existing));
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('skilliq-progress-updated'));
          }
        } catch {}

        if (isNewCompletion) {
          const matchedCourse = state.allCourses.find((c) => c.id === courseId);
          recordPlatformMovement({
            uid: state.user?.uid || null,
            userName: state.user?.displayName || 'Guest Visitor',
            userEmail: state.user?.email || '',
            userAvatar: state.user?.photoURL || '',
            actionType: 'lesson_completed',
            path: `/course/${courseId}`,
            pageTitle: matchedCourse?.title || courseId,
            detail: `Completed lesson #${newCompleted.length} in "${matchedCourse?.title || courseId}"`,
          });
        }

        if (state.user) {
          try {
            await setDoc(doc(db, `users/${state.user.uid}/progress/${courseId}`), cleanProgressForFirestore(newProgress));
            if (isNewCompletion) {
              const hour = new Date().getHours();
              const isNightOwl = hour >= 22 || hour <= 4;
              const result = await awardXPAndBadges(state.user.uid, 'VIDEO_WATCHED', { nightOwl: isNightOwl });
              if (result) {
                set((s) => ({ publicProfile: s.publicProfile ? { ...s.publicProfile, ...result } : null }));
              }
            }
          } catch (error) {
            console.error("Error saving progress:", error);
          }
        }
      },

      setCurrentVideo: async (courseId, videoId) => {
        const state = get();
        const courseProgress = state.progress[courseId] || {
          courseId,
          completedVideoIds: [],
          currentVideoId: videoId,
          isCompleted: false,
        };

        const newProgress = {
          ...courseProgress,
          currentVideoId: videoId,
          updatedAt: new Date().toISOString(),
        };

        set({
          progress: {
            ...state.progress,
            [courseId]: newProgress,
          },
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('skilliq-progress-updated'));
        }

        if (state.user) {
          try {
            await setDoc(doc(db, `users/${state.user.uid}/progress/${courseId}`), cleanProgressForFirestore(newProgress));
          } catch (error) {
            console.error("Error saving progress:", error);
          }
        }
      },

      saveVideoTimestamp: async (courseId, videoId, timestamp) => {
        const state = get();
        const courseProgress = state.progress[courseId] || {
          courseId,
          completedVideoIds: [],
          currentVideoId: videoId,
          isCompleted: false,
          videoTimestamps: {},
        };

        const newProgress = {
          ...courseProgress,
          currentVideoId: videoId,
          updatedAt: new Date().toISOString(),
          videoTimestamps: {
            ...(courseProgress.videoTimestamps || {}),
            [videoId]: Math.floor(timestamp),
          },
        };

        set({
          progress: {
            ...state.progress,
            [courseId]: newProgress,
          },
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('skilliq-progress-updated'));
        }

        if (state.user) {
          try {
            await setDoc(doc(db, `users/${state.user.uid}/progress/${courseId}`), cleanProgressForFirestore(newProgress));
          } catch (error) {
            console.error("Error saving video timestamp:", error);
          }
        }
      },

      completeCourse: async (courseId) => {
        const state = get();
        const courseProgress = state.progress[courseId];
        if (!courseProgress) return;

        const newProgress = {
          ...courseProgress,
          isCompleted: true,
          completionDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({
          progress: {
            ...state.progress,
            [courseId]: newProgress,
          },
        });

        const matchedCourse = state.allCourses.find((c) => c.id === courseId);
        recordPlatformMovement({
          uid: state.user?.uid || null,
          userName: state.user?.displayName || 'Guest Visitor',
          userEmail: state.user?.email || '',
          userAvatar: state.user?.photoURL || '',
          actionType: 'course_completed',
          path: `/course/${courseId}`,
          pageTitle: matchedCourse?.title || courseId,
          detail: `Graduated and unlocked certificate for "${matchedCourse?.title || courseId}"`,
        });

        if (state.user) {
          try {
            await setDoc(doc(db, `users/${state.user.uid}/progress/${courseId}`), cleanProgressForFirestore(newProgress));
            
            // Gamification checks
            const course = state.courses.find(c => c.id === courseId);
            // Let's assume a fast finish is < 24 hrs, but without knowing start time we just randomly reward it for testing, or if there's only 1 day difference from first progress.
            // For simplicity, let's just award the course complete XP
            const result = await awardXPAndBadges(state.user.uid, 'COURSE_COMPLETED');
            if (result) {
               set((s) => ({ publicProfile: s.publicProfile ? { ...s.publicProfile, ...result } : null }));
            }

          } catch (error) {
            console.error("Error saving progress:", error);
          }
        }
      },
    }),
    {
      name: 'nexa-store-storage',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ 
        language: state.language, 
        theme: state.theme,
        favorites: state.favorites,
      }),
    }
  )
);

