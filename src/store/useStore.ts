import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { courses as defaultCourses, learningPaths as defaultPaths, categories as defaultCategories, defaultBanners, Course, LearningPath, Category, AppNotification, AdBannerData } from '../data/courses';
import { fetchFirestoreContent } from '../lib/firestoreContent';
import { PublicProfile, awardXPAndBadges, initializeOrUpdateProfile } from '../lib/gamification';

interface Progress {
  courseId: string;
  completedVideoIds: string[];
  currentVideoId: string;
  isCompleted: boolean;
  completionDate?: string;
  videoTimestamps?: Record<string, number>;
}

interface StoreState {
  theme: 'light' | 'dark';
  language: 'en' | 'ar';
  progress: Record<string, Progress>;
  user: any | null;
  publicProfile: PublicProfile | null;
  userName: string;
  courses: Course[];
  allCourses: Course[];
  learningPaths: LearningPath[];
  categories: Category[];
  notifications: AppNotification[];
  banners: AdBannerData[];
  isContentLoading: boolean;
  isAuthModalOpen: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  setUser: (user: any) => void;
  setIsAuthModalOpen: (isOpen: boolean) => void;
  loadContent: (retryCount?: number) => Promise<void>;
  loadProgress: () => Promise<void>;
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
      user: null,
      publicProfile: null,
      userName: 'Student',
      courses: defaultCourses,
      allCourses: defaultCourses,
      learningPaths: defaultPaths,
      categories: defaultCategories,
      notifications: [],
      banners: defaultBanners,
      isContentLoading: true,
      isAuthModalOpen: false,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setIsAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
      setUser: async (user) => {
        set({ user, userName: user?.displayName || 'Student' });
        if (user) {
          try {
            const profile = await initializeOrUpdateProfile(user);
            set({ publicProfile: profile });
          } catch (err) {
            console.error("Failed to initialize public profile", err);
          }
        } else {
          set({ publicProfile: null, progress: {} });
        }
      },
      
      loadContent: async (retryCount = 0) => {
        try {
          const { courses, learningPaths, categories, notifications, banners } = await fetchFirestoreContent();
          
          const loadedBanners = banners && banners.length > 0 ? banners : defaultBanners;

          if (courses.length > 0 || learningPaths.length > 0) {
            const approvedCourses = courses.filter(c => c.isApproved !== false);
            set({ allCourses: courses, courses: approvedCourses, learningPaths, categories, notifications: notifications || [], banners: loadedBanners, isContentLoading: false });
          } else {
            // Only set to empty if it genuinely returned zero courses from DB
            set({ courses: [], allCourses: [], learningPaths: [], categories: [], notifications: [], banners: defaultBanners, isContentLoading: false });
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
        if (!user) return;
        
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
        };

        set({
          progress: {
            ...state.progress,
            [courseId]: newProgress,
          },
        });

        if (state.user) {
          try {
            await setDoc(doc(db, `users/${state.user.uid}/progress/${courseId}`), newProgress);
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
        };

        set({
          progress: {
            ...state.progress,
            [courseId]: newProgress,
          },
        });

        if (state.user) {
          try {
            await setDoc(doc(db, `users/${state.user.uid}/progress/${courseId}`), newProgress);
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

        if (state.user) {
          try {
            await setDoc(doc(db, `users/${state.user.uid}/progress/${courseId}`), newProgress);
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
        };

        set({
          progress: {
            ...state.progress,
            [courseId]: newProgress,
          },
        });

        if (state.user) {
          try {
            await setDoc(doc(db, `users/${state.user.uid}/progress/${courseId}`), newProgress);
            
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
      partialize: (state) => ({ language: state.language, theme: state.theme }),
    }
  )
);

