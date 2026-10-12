import { useState, useMemo, useEffect, useCallback, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Award, 
  PlayCircle, 
  CheckCircle2, 
  CheckCircle,
  XCircle,
  Trophy, 
  Flame, 
  BookOpen, 
  Clock, 
  Star, 
  X, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Check, 
  Heart, 
  Trash2, 
  Play, 
  LifeBuoy,
  Search,
  Timer,
  Pause,
  RotateCcw,
  Target,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Zap,
  Bookmark,
  ShieldCheck,
  Calendar,
  Volume2,
  Maximize2,
  Coffee,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { onSnapshot, doc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useStore } from '../store/useStore';
import { useFocusTimer, triggerFocusAlarmSoundAndVibrate } from '../store/useFocusTimer';
import { Book, Course, LearningPath } from '../data/courses';
import { ScrollingText } from '../components/ScrollingText';
import { DailyRewardCheckIn } from '../components/DailyRewardCheckIn';
import { DailyTechQuest } from '../components/DailyTechQuest';
import { AchievementsShowcase } from '../components/AchievementsShowcase';
import { FavoriteButton } from '../components/FavoriteButton';
import { DailyGoalExplainerModal } from '../components/DailyGoalExplainerModal';
import { awardCustomXP } from '../lib/gamification';
import { SupportTickets } from './SupportTickets';
import { 
  BookVideoModal, 
  BookCoverVisual, 
  translateBookCategory, 
  AmazonIcon, 
  getLocalizedBookData 
} from '../components/BookVideoModal';
import { cn } from '../lib/utils';
import { isCertificateEligible, getCategoryDisplayName } from '../lib/courseUtils';

type DashboardTab = 'overview' | 'courses' | 'saved' | 'quests' | 'support';

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    progress, 
    favorites, 
    toggleFavorite, 
    userName, 
    user, 
    courses, 
    allCourses, 
    books, 
    allBooks, 
    learningPaths, 
    publicProfile, 
    language, 
    setIsAuthModalOpen,
    markVideoCompleted
  } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  // Navigation tab from URL param or default
  const activeTab = (searchParams.get('tab') as DashboardTab) || 'overview';
  const setActiveTab = (tab: DashboardTab) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  // Real-time Firestore snapshot listener for user profile (badges, streak, XP)
  useEffect(() => {
    if (!user?.uid) return;
    try {
      const unsub = onSnapshot(doc(db, 'publicProfiles', user.uid), (snapshot) => {
        if (snapshot.exists()) {
          useStore.setState({ publicProfile: snapshot.data() as any });
        }
      });
      return () => unsub();
    } catch {
      // offline/fallback
    }
  }, [user?.uid]);

  // Real-time Firestore snapshot listener for user progress (lessons, timestamps, courses)
  useEffect(() => {
    if (!user?.uid) return;
    try {
      const progressRef = collection(db, 'users', user.uid, 'progress');
      const unsub = onSnapshot(progressRef, (snapshot) => {
        const currentProgress = { ...useStore.getState().progress };
        snapshot.docs.forEach((docSnap) => {
          currentProgress[docSnap.id] = docSnap.data() as any;
        });
        useStore.setState({ progress: currentProgress });
      });
      return () => unsub();
    } catch (err) {
      console.warn('Realtime progress listener warning:', err);
    }
  }, [user?.uid]);

  // Real-time cross-tab & local progress event listener
  const [progressTick, setProgressTick] = useState(0);
  useEffect(() => {
    const handleSync = () => setProgressTick(t => t + 1);
    window.addEventListener('skilliq-progress-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('skilliq-progress-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Live ticking date and clock for real-time user visibility
  const [currentLiveTime, setCurrentLiveTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Review modal states
  const [reviewModalCourseId, setReviewModalCourseId] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [submittedReviews, setSubmittedReviews] = useState<Record<string, boolean>>({});

  // Course filter & Pagination state
  const [courseFilter, setCourseFilter] = useState<'all' | 'in_progress' | 'completed' | 'certified'>('all');
  const [courseCategoryFilter, setCourseCategoryFilter] = useState<string>('all');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [courseCurrentPage, setCourseCurrentPage] = useState<number>(1);
  const coursesPerPage = 6;

  // Reset pagination when filter or search changes
  useEffect(() => {
    setCourseCurrentPage(1);
  }, [courseFilter, courseCategoryFilter, courseSearchQuery]);

  // Saved Library filter state
  const [favoriteTab, setFavoriteTab] = useState<'all' | 'playlist' | 'masterclass' | 'path' | 'book'>('all');
  const [favoriteSearchQuery, setFavoriteSearchQuery] = useState('');
  const [selectedBookForModal, setSelectedBookForModal] = useState<Book | null>(null);

  // Smart Study Habit & Daily Goal state
  const [dailyGoalType, setDailyGoalType] = useState<'lessons' | 'minutes'>(() => {
    try {
      return (localStorage.getItem('skilliq_goal_type') as 'lessons' | 'minutes') || 'lessons';
    } catch {
      return 'lessons';
    }
  });

  const [dailyGoalTarget, setDailyGoalTarget] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('skilliq_daily_goal_target')) || 2;
    } catch {
      return 2;
    }
  });

  // Focus Timer from global store
  const {
    timeLeft,
    initialDuration,
    isRunning: isFocusRunning,
    mode: focusModeType,
    customMinutesInput,
    focusMinutesToday,
    startFocus,
    pauseFocus,
    resumeFocus,
    resetFocus,
    setMode: setFocusMode,
    setCustomMinutesInput,
    showFloatingPopup,
    setShowFloatingPopup,
  } = useFocusTimer();

  const [customTimeInputVal, setCustomTimeInputVal] = useState<string>(String(customMinutesInput || 25));

  const handleCustomTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomTimeInputVal(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 180) {
      setCustomMinutesInput(parsed);
    }
  };

  const handleSelectPresetTime = (mins: number) => {
    setCustomTimeInputVal(String(mins));
    setCustomMinutesInput(mins);
  };

  // Real-time countdown to midnight for daily quests reset
  const [midnightCountdown, setMidnightCountdown] = useState<string>('');
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diffMs = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diffMs / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diffMs % (1000 * 60)) / 1000);
      setMidnightCountdown(`${h}h ${m}m ${s}s`);
    };
    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, []);

  // Daily goal switcher
  const handleSetDailyGoal = (target: number, type: 'lessons' | 'minutes') => {
    setDailyGoalTarget(target);
    setDailyGoalType(type);
    try {
      localStorage.setItem('skilliq_daily_goal_target', String(target));
      localStorage.setItem('skilliq_goal_type', type);
    } catch {}
  };

  // Pools
  const coursePool = useMemo(() => courses.length > 0 ? courses : allCourses, [courses, allCourses]);
  const bookPool = useMemo(() => books.length > 0 ? books : allBooks, [books, allBooks]);

  // Real Enrolled Courses calculation - Realtime prioritized by most recent activity
  const startedCourses = useMemo(() => {
    return coursePool
      .filter(c => progress[c.id])
      .sort((a, b) => {
        const progA = progress[a.id];
        const progB = progress[b.id];
        const timeA = progA?.updatedAt ? new Date(progA.updatedAt).getTime() : 0;
        const timeB = progB?.updatedAt ? new Date(progB.updatedAt).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        const countA = progA?.completedVideoIds?.length || 0;
        const countB = progB?.completedVideoIds?.length || 0;
        return countB - countA;
      });
  }, [coursePool, progress, progressTick]);

  const completedCourses = useMemo(() => startedCourses.filter(c => progress[c.id]?.isCompleted), [startedCourses, progress]);
  const earnedCertificates = useMemo(() => completedCourses.filter(c => isCertificateEligible(c)), [completedCourses]);
  const inProgressCourses = useMemo(() => startedCourses.filter(c => !progress[c.id]?.isCompleted), [startedCourses, progress]);

  // Real Lessons Completed Count Today (Realtime synced from localStorage & Firestore progress)
  const dailyLessonsCompletedCount = useMemo(() => {
    let count = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const loggedToday = JSON.parse(localStorage.getItem(`skilliq_lessons_done_${todayStr}`) || '[]');
      if (Array.isArray(loggedToday) && loggedToday.length > 0) {
        count = loggedToday.length;
      }
    } catch {}

    Object.values(progress).forEach(p => {
      if (p.isCompleted && p.completionDate?.startsWith(todayStr)) {
        count = Math.max(count, 1);
      }
      if (p.updatedAt?.startsWith(todayStr) && (p.completedVideoIds?.length || 0) > 0) {
        count = Math.max(count, p.completedVideoIds.length);
      }
    });

    return count;
  }, [progress, inProgressCourses, progressTick]);

  // ==============================================================
  // REAL DATA & REALTIME: "Resume Where You Left Off" Engine
  // ==============================================================
  const smartNextLearning = useMemo(() => {
    if (inProgressCourses.length === 0) {
      // If user hasn't started any course yet, pull the real highest-ranked course from coursePool
      const featured = coursePool[0];
      if (!featured) return null;

      const firstVideo = featured.videos?.[0] || null;
      return {
        type: 'recommendation' as const,
        course: featured,
        video: firstVideo,
        lessonIndex: 1,
        totalLessons: featured.videos?.length || 1,
        percentComplete: 0,
        savedTimeText: null,
        lastActiveText: null,
      };
    }

    // User has real in-progress courses
    const activeCourse = inProgressCourses[0];
    const courseProg = progress[activeCourse.id] || { courseId: activeCourse.id, isCompleted: false, completedVideoIds: [], currentVideoId: '', videoTimestamps: {}, updatedAt: undefined };
    const completedSet = new Set(courseProg.completedVideoIds || []);
    const videos = activeCourse.videos || [];

    // Identify next uncompleted video
    let nextVideo = (courseProg.currentVideoId && videos.find(v => v.id === courseProg.currentVideoId))
      || videos.find(v => !completedSet.has(v.id)) 
      || videos[0];
    let nextIndex = videos.findIndex(v => v.id === nextVideo?.id) + 1;
    if (nextIndex <= 0) nextIndex = 1;

    // Check if user paused with saved timestamp
    let savedTimeText: string | null = null;
    const savedTimestamp = courseProg.videoTimestamps?.[nextVideo?.id];
    if (savedTimestamp && savedTimestamp > 15) {
      const mins = Math.floor(savedTimestamp / 60);
      const secs = Math.floor(savedTimestamp % 60).toString().padStart(2, '0');
      savedTimeText = `${mins}:${secs}`;
    }

    // Relative last active text
    let lastActiveText: string | null = null;
    if (courseProg.updatedAt) {
      try {
        const diffMs = Date.now() - new Date(courseProg.updatedAt).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) {
          lastActiveText = isRtl ? 'نشط الآن' : 'Active just now';
        } else if (diffMins < 60) {
          lastActiveText = isRtl ? `نشط منذ ${diffMins} دقيقة` : `Active ${diffMins}m ago`;
        } else {
          const diffHours = Math.floor(diffMins / 60);
          lastActiveText = isRtl ? `نشط منذ ${diffHours} ساعة` : `Active ${diffHours}h ago`;
        }
      } catch {}
    }

    const percent = Math.round((completedSet.size / Math.max(videos.length, 1)) * 100);

    return {
      type: 'continue' as const,
      course: activeCourse,
      video: nextVideo,
      lessonIndex: nextIndex,
      totalLessons: videos.length,
      percentComplete: percent,
      savedTimeText,
      lastActiveText,
    };
  }, [inProgressCourses, coursePool, progress, isRtl, progressTick]);

  // ==============================================================
  // REAL DATA: "Active Learning Tracks"
  // ==============================================================
  const activeLearningTracks = useMemo(() => {
    if (inProgressCourses.length >= 2) {
      return inProgressCourses.slice(0, 4);
    }
    if (inProgressCourses.length === 1) {
      // Combine the in-progress course with the top recommended platform course
      const other = coursePool.find(c => c.id !== inProgressCourses[0].id);
      return other ? [inProgressCourses[0], other] : inProgressCourses;
    }
    // No in-progress courses: provide the top 2 organic curated courses
    return coursePool.slice(0, 2);
  }, [inProgressCourses, coursePool]);

  // Saved / Favorite items breakdown
  const favoriteItemsList = useMemo(() => {
    const list = Object.values(favorites || {});
    return list.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }, [favorites]);

  const savedPlaylists = useMemo(() => {
    return favoriteItemsList
      .filter(f => f.itemType === 'playlist')
      .map(f => coursePool.find(c => c.id === f.itemId))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
  }, [favoriteItemsList, coursePool]);

  const savedMasterclasses = useMemo(() => {
    return favoriteItemsList
      .filter(f => f.itemType === 'masterclass')
      .map(f => coursePool.find(c => c.id === f.itemId))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
  }, [favoriteItemsList, coursePool]);

  const savedPaths = useMemo(() => {
    return favoriteItemsList
      .filter(f => f.itemType === 'path')
      .map(f => learningPaths.find(p => p.id === f.itemId))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  }, [favoriteItemsList, learningPaths]);

  const savedBooks = useMemo(() => {
    return favoriteItemsList
      .filter(f => f.itemType === 'book')
      .map(f => bookPool.find(b => b.id === f.itemId))
      .filter((b): b is NonNullable<typeof b> => Boolean(b));
  }, [favoriteItemsList, bookPool]);

  const totalSavedCount = savedPlaylists.length + savedMasterclasses.length + savedPaths.length + savedBooks.length;

  // Categories list
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    startedCourses.forEach(c => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [startedCourses]);

  // Displayed Courses (filtered)
  const displayedCourses = useMemo(() => {
    let list = startedCourses;
    if (courseFilter === 'in_progress') list = inProgressCourses;
    else if (courseFilter === 'completed') list = completedCourses;
    else if (courseFilter === 'certified') list = earnedCertificates;

    if (courseCategoryFilter !== 'all') {
      list = list.filter(c => c.category === courseCategoryFilter);
    }

    if (courseSearchQuery.trim()) {
      const q = courseSearchQuery.toLowerCase();
      list = list.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.instructor.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [courseFilter, courseCategoryFilter, courseSearchQuery, startedCourses, inProgressCourses, completedCourses, earnedCertificates]);

  // Paginated Courses Slice
  const totalCoursePages = Math.max(1, Math.ceil(displayedCourses.length / coursesPerPage));
  const paginatedCourses = useMemo(() => {
    const startIdx = (courseCurrentPage - 1) * coursesPerPage;
    return displayedCourses.slice(startIdx, startIdx + coursesPerPage);
  }, [displayedCourses, courseCurrentPage, coursesPerPage]);

  // Gamification metrics
  const xp = publicProfile ? publicProfile.xp : 0;
  const level = publicProfile ? Math.floor(publicProfile.xp / 100) + 1 : 1;
  const streak = publicProfile?.streak || 1;
  const xpInCurrentLevel = xp % 100;
  const xpNeededForNext = 100 - xpInCurrentLevel;

  // Rank title
  const rankTitle = useMemo(() => {
    if (level >= 7) return t('rank_master', 'Cyber Master');
    if (level >= 4) return t('rank_architect', 'Systems Architect');
    if (level >= 2) return t('rank_builder', 'Tech Builder');
    return t('rank_apprentice', 'Code Novice');
  }, [level, t]);

  // 7-day activity days with SMART GOAL CHECK: Green Check if completed, Red Check if not completed
  const daysOfWeek = useMemo(() => {
    const days = [
      { key: 'Mon', en: 'Mon', ar: 'إثن' },
      { key: 'Tue', en: 'Tue', ar: 'ثلا' },
      { key: 'Wed', en: 'Wed', ar: 'أرب' },
      { key: 'Thu', en: 'Thu', ar: 'خمي' },
      { key: 'Fri', en: 'Fri', ar: 'جمع' },
      { key: 'Sat', en: 'Sat', ar: 'سبت' },
      { key: 'Sun', en: 'Sun', ar: 'أحد' }
    ];
    const today = new Date();
    const currentDayIdx = (today.getDay() + 6) % 7; // 0 for Mon, 6 for Sun

    const currentAchieved = dailyGoalType === 'lessons' ? dailyLessonsCompletedCount : focusMinutesToday;
    const isTodayGoalComplete = currentAchieved >= dailyGoalTarget;

    return days.map((d, idx) => {
      const isToday = idx === currentDayIdx;
      const isPast = idx < currentDayIdx;
      const isFuture = idx > currentDayIdx;

      // Calculate date for this day of the week
      const dayOffset = idx - currentDayIdx;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + dayOffset);
      const dayDateStr = targetDate.toISOString().split('T')[0];

      let isGoalMet = false;
      let isGoalMissed = false;

      if (isToday) {
        isGoalMet = isTodayGoalComplete;
        isGoalMissed = !isTodayGoalComplete;
      } else if (isPast) {
        let pastLessons = 0;
        let pastMins = 0;
        try {
          const lList = JSON.parse(localStorage.getItem(`skilliq_lessons_done_${dayDateStr}`) || '[]');
          pastLessons = Array.isArray(lList) ? lList.length : 0;
          pastMins = Number(localStorage.getItem(`skilliq_focus_mins_${dayDateStr}`)) || 0;
        } catch {}

        const dayProgressCount = dailyGoalType === 'lessons' ? pastLessons : pastMins;
        const reachedTarget = dayProgressCount >= dailyGoalTarget;
        const coveredByStreak = streak > (currentDayIdx - idx);

        if (reachedTarget || coveredByStreak) {
          isGoalMet = true;
        } else {
          isGoalMissed = true; // "if not check red"
        }
      }

      return {
        ...d,
        dayNum: targetDate.getDate(),
        dateStr: dayDateStr,
        isToday,
        isPast,
        isFuture,
        isGoalMet,
        isGoalMissed,
      };
    });
  }, [streak, dailyGoalType, dailyGoalTarget, dailyLessonsCompletedCount, focusMinutesToday, progressTick]);

  // Real-time quest check state from localStorage
  const isQuestDoneToday = useMemo(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `skilliq_daily_quest_${today}_${user?.uid || 'guest'}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved)?.completed === true : false;
    } catch {
      return false;
    }
  }, [user?.uid]);

  const isCheckinDoneToday = useMemo(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `skilliq_daily_checkin_${user?.uid || 'guest'}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved)?.lastClaimDate === today : false;
    } catch {
      return false;
    }
  }, [user?.uid]);

  // If user is not logged in
  if (!user) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full px-4 sm:px-6 lg:px-8 py-10 max-w-5xl mx-auto space-y-8">
        <BookVideoModal
          book={selectedBookForModal}
          onClose={() => setSelectedBookForModal(null)}
          onSelectBook={(b) => setSelectedBookForModal(b)}
        />

        <div className="relative overflow-hidden rounded-3xl bg-card border border-border/80 p-8 sm:p-12 text-center shadow-xs">
          <div className="max-w-xl mx-auto relative z-10 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {isRtl ? 'لوحة تحكم المتعلم الذكية' : 'Your Smart Learning Command Center'}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isRtl 
                ? 'سجل دخولك لحفظ تقدمك السحابي، متابعة الدروس من حيث توقفت، حل التحديات اليومية، واستخدام مؤقت التركيز الذكي.'
                : 'Log in to track video progress, resume where you left off, solve daily tech quests, and use the smart focus timer.'}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full sm:w-auto px-7 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-xs hover:bg-primary/90 transition-all text-sm cursor-pointer"
              >
                {t('login', 'Log In to Continue')}
              </button>
              <Link
                to="/courses"
                className="w-full sm:w-auto px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl text-sm transition-all text-center"
              >
                {t('explore_courses', 'Explore Courses')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1440px] mx-auto space-y-6 sm:space-y-8"
    >
      {/* Book Video Popup Modal */}
      <BookVideoModal
        book={selectedBookForModal}
        onClose={() => setSelectedBookForModal(null)}
        onSelectBook={(b) => setSelectedBookForModal(b)}
      />

      {/* 1. TOP SMART HUB BANNER */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-card border border-border/80 p-5 sm:p-6 lg:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* User Profile */}
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4.5">
            <div className="relative shrink-0">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={userName} 
                  className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl object-cover border border-border shadow-xs"
                />
              ) : (
                <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-primary text-primary-foreground font-extrabold text-xl sm:text-2xl flex items-center justify-center shadow-xs">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-1 -end-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-card" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-primary">
                  {rankTitle}
                </span>
                <span className="text-muted-foreground text-xs" aria-hidden="true">·</span>
                <span className="text-xs font-mono font-medium text-muted-foreground tabular-nums">
                  Level {level}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
                {t('welcome_back', 'Welcome back,')} {userName}!
              </h1>

              {/* Progress to Next Level */}
              <div className="flex items-center gap-2 pt-0.5 max-w-xs">
                <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(xpInCurrentLevel, 100)}%` }} 
                  />
                </div>
                <span className="text-[11px] text-muted-foreground font-mono tabular-nums whitespace-nowrap">
                  {xpInCurrentLevel}/100 XP
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:items-center gap-2 sm:gap-3 self-stretch lg:self-auto">
            
            <div className="p-3 sm:px-4 sm:py-3 rounded-xl bg-muted/40 border border-border/70 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground mb-0.5">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                <span>{t('daily_streak', 'Streak')}</span>
              </div>
              <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-foreground">
                {streak} <span className="text-xs font-sans font-normal text-muted-foreground">{isRtl ? 'أيام' : 'd'}</span>
              </span>
            </div>

            <div className="p-3 sm:px-4 sm:py-3 rounded-xl bg-muted/40 border border-border/70 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground mb-0.5">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>{t('courses', 'Courses')}</span>
              </div>
              <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-foreground">
                {inProgressCourses.length} <span className="text-xs font-sans font-normal text-muted-foreground">{isRtl ? 'جارية' : 'active'}</span>
              </span>
            </div>

            <div className="p-3 sm:px-4 sm:py-3 rounded-xl bg-muted/40 border border-border/70 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground mb-0.5">
                <Award className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t('certificates', 'Certificates')}</span>
              </div>
              <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {earnedCertificates.length}
              </span>
            </div>

            <div className="p-3 sm:px-4 sm:py-3 rounded-xl bg-muted/40 border border-border/70 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground mb-0.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>{isRtl ? 'المحفوظات' : 'Saved'}</span>
              </div>
              <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-foreground">
                {totalSavedCount}
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* 2. SMART RESPONSIVE TAB BAR */}
      <nav 
        aria-label="Dashboard views"
        className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-2 pb-3 border-b border-border/70 -mx-3 px-3 sm:mx-0 sm:px-0"
      >
        <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
          
          <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/70 shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                activeTab === 'overview'
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isRtl ? 'نظرة عامة والتركيز' : 'Overview & Focus'}</span>
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                activeTab === 'courses'
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isRtl ? 'دوراتي والشهادات' : 'My Courses'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground">
                {startedCourses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                activeTab === 'saved'
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isRtl ? 'المكتبة المحفوظة' : 'Saved Library'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground">
                {totalSavedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('quests')}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                activeTab === 'quests'
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{isRtl ? 'التحديات والمكافآت' : 'Daily Quests & Badges'}</span>
              {(!isQuestDoneToday || !isCheckinDoneToday) && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                activeTab === 'support'
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>{isRtl ? 'الدعم الفني' : 'Support Desk'}</span>
            </button>
          </div>

          <Link
            to="/courses"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0"
          >
            <span>{isRtl ? 'استكشاف المقررات' : 'Explore Catalog'}</span>
            <ArrowRight className="w-3 h-3 rtl:rotate-180" />
          </Link>

        </div>
      </nav>

      {/* ============================================================== */}
      {/* VIEW 1: OVERVIEW & FOCUS SECTION                              */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">

          {/* BENTO 2-COLUMN GRID (LAPTOP / TABLET / MOBILE) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Velocity & Real Active Learning Tracks */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              
              {/* 2. VERY SMART WEEKLY VELOCITY & DAILY GOAL (REAL DATE/TIME + GREEN/RED CHECK) */}
              <div className="rounded-2xl bg-card border border-border/80 p-5 sm:p-6 space-y-5 text-start">
                
                {/* Real Date & Live Ticking Clock Display Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/70">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        {isRtl ? 'التاريخ الفعلي الحالي' : 'Live Current Date'}
                      </div>
                      <div className="font-bold text-foreground text-xs sm:text-sm">
                        {currentLiveTime.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{isRtl ? 'الوقت المباشر' : 'Live Local Time'}</span>
                      </div>
                      <div className="font-mono font-extrabold text-foreground text-xs sm:text-sm tabular-nums tracking-tight">
                        {currentLiveTime.toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Header with Title and Daily Goal Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm sm:text-base text-foreground">
                      {isRtl ? 'وتيرة التعلم والهدف اليومي' : 'Weekly Velocity & Daily Goal'}
                    </h3>
                  </div>

                  {/* Goal Mode & Target Selector */}
                  <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
                    <div className="flex items-center gap-1 p-0.5 bg-muted/60 rounded-lg border border-border/60">
                      <button
                        onClick={() => handleSetDailyGoal(dailyGoalTarget, 'lessons')}
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer",
                          dailyGoalType === 'lessons' ? "bg-card text-foreground font-bold shadow-2xs" : "text-muted-foreground"
                        )}
                      >
                        {isRtl ? 'دروس' : 'Lessons'}
                      </button>
                      <button
                        onClick={() => handleSetDailyGoal(30, 'minutes')}
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer",
                          dailyGoalType === 'minutes' ? "bg-card text-foreground font-bold shadow-2xs" : "text-muted-foreground"
                        )}
                      >
                        {isRtl ? 'دقائق' : 'Minutes'}
                      </button>
                    </div>

                    {dailyGoalType === 'lessons' ? (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 5].map(t => (
                          <button
                            key={t}
                            onClick={() => handleSetDailyGoal(t, 'lessons')}
                            className={cn(
                              "px-2 py-1 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer",
                              dailyGoalTarget === t
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {[15, 30, 45, 60].map(m => (
                          <button
                            key={m}
                            onClick={() => handleSetDailyGoal(m, 'minutes')}
                            className={cn(
                              "px-2 py-1 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer",
                              dailyGoalTarget === m
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {m}m
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 7-Day Velocity: GREEN CHECK IF COMPLETED, RED CHECK IF NOT COMPLETED */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                      <span>{isRtl ? 'سجل الأيام السبعة (أخضر = مكتمل، أحمر = غير مكتمل)' : '7-Day Tracker (Green = Met, Red = Missed)'}</span>
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-foreground">
                      {streak} {isRtl ? 'أيام متواصلة' : 'days streak'}
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {daysOfWeek.map((day) => (
                      <div 
                        key={day.key}
                        className={cn(
                          "p-2 sm:p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all",
                          day.isToday 
                            ? day.isGoalMet
                              ? "border-emerald-500/60 bg-emerald-500/10 ring-2 ring-emerald-500/30"
                              : "border-rose-500/60 bg-rose-500/10 ring-2 ring-rose-500/30"
                            : day.isGoalMet
                            ? "border-emerald-500/40 bg-emerald-500/5"
                            : day.isGoalMissed
                            ? "border-rose-500/40 bg-rose-500/5"
                            : "border-border/60 bg-muted/20"
                        )}
                      >
                        <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                          {isRtl ? day.ar : day.en}
                        </span>

                        {/* GREEN CHECK if goal completed, RED CHECK if not completed / missed */}
                        {day.isGoalMet ? (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : day.isGoalMissed ? (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
                            <X className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted text-muted-foreground/40 flex items-center justify-center text-[10px] font-bold">
                            ·
                          </div>
                        )}

                        <span className={cn(
                          "text-[9px] sm:text-[10px] font-extrabold mt-1",
                          day.isGoalMet 
                            ? "text-emerald-600 dark:text-emerald-400" 
                            : day.isGoalMissed 
                            ? "text-rose-600 dark:text-rose-400" 
                            : "text-muted-foreground/50"
                        )}>
                          {day.isGoalMet 
                            ? (isRtl ? 'مكتمل' : 'Met') 
                            : day.isGoalMissed 
                            ? (isRtl ? 'غير مكتمل' : 'Missed') 
                            : (isRtl ? 'قادم' : 'Pending')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real Daily Goal Status Banner: GREEN IF COMPLETED, RED IF NOT COMPLETED */}
                {(() => {
                  const currentAchieved = dailyGoalType === 'lessons' ? dailyLessonsCompletedCount : focusMinutesToday;
                  const currentTarget = dailyGoalTarget;
                  const pct = Math.min(100, Math.round((currentAchieved / Math.max(currentTarget, 1)) * 100));
                  const isDone = currentAchieved >= currentTarget;
                  const remaining = Math.max(0, currentTarget - currentAchieved);

                  return (
                    <div className="space-y-3">
                      {isDone ? (
                        /* GREEN CHECK: GOAL COMPLETED */
                        <div className="p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <Check className="w-5 h-5 stroke-[3]" />
                            </div>
                            <div>
                              <div className="font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm flex items-center gap-1.5">
                                <span>{isRtl ? '🎉 تم إنجاز الهدف اليومي بنجاح!' : '🎉 Daily Goal Accomplished!'}</span>
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                {isRtl 
                                  ? `رائع! أنجزت ${currentAchieved} من أصل ${currentTarget} ${dailyGoalType === 'lessons' ? 'دروس' : 'دقيقة'} وتم حماية خطك اليومي بنجاح.` 
                                  : `Target reached (${currentAchieved}/${currentTarget} ${dailyGoalType === 'lessons' ? 'lessons' : 'minutes'})! Your streak is safely shielded today.`}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white font-mono font-black text-xs flex items-center gap-1.5 shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>100% {isRtl ? 'مكتمل' : 'Done'}</span>
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* RED CHECK: GOAL INCOMPLETE */
                        <div className="p-4 rounded-xl bg-rose-500/10 border-2 border-rose-500/50 text-rose-600 dark:text-rose-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <X className="w-5 h-5 stroke-[3]" />
                            </div>
                            <div>
                              <div className="font-black text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-center gap-1.5">
                                <span>{isRtl ? '⚠️ الهدف اليومي غير مكتمل بعد' : '⚠️ Daily Goal Incomplete'}</span>
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400">
                                  {isRtl ? `متبقي ${remaining}` : `${remaining} left`}
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                {isRtl 
                                  ? `أنجزت ${currentAchieved} من أصل ${currentTarget} ${dailyGoalType === 'lessons' ? 'دروس' : 'دقيقة'} — تبقّى ${remaining} لإنجاز هدف اليوم وتأمين الخط.` 
                                  : `Completed ${currentAchieved} of ${currentTarget} ${dailyGoalType === 'lessons' ? 'lessons' : 'minutes'} — finish ${remaining} more before midnight to shield your streak!`}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <span className="px-3 py-1 rounded-full bg-rose-500 text-white font-mono font-black text-xs flex items-center gap-1.5 shadow-xs">
                              <X className="w-3.5 h-3.5 stroke-[3]" />
                              <span>{pct}% {isRtl ? 'غير مكتمل' : 'Incomplete'}</span>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Progress Line with Live Midnight Countdown */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{isRtl ? 'ينتهي موعد هدف اليوم خلال:' : 'Daily goal window closes in:'}</span>
                            <span className="font-mono font-bold text-foreground ms-1">{midnightCountdown}</span>
                          </span>
                          <span className="font-mono font-bold tabular-nums text-foreground">
                            {currentAchieved} / {currentTarget} {dailyGoalType === 'lessons' ? (isRtl ? 'دروس' : 'lessons') : (isRtl ? 'دقيقة' : 'mins')}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              isDone ? "bg-emerald-500" : "bg-rose-500"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Interactive Focus Link when in minutes mode or incomplete */}
                      <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Timer className="w-3.5 h-3.5 text-primary" />
                          <span>{isRtl ? 'متصل مباشرة بمساعد التركيز الذكي:' : 'Connected directly to Focus Companion:'}</span>
                          <span className="font-mono font-bold text-foreground">{focusMinutesToday}m {isRtl ? 'اليوم' : 'today'}</span>
                        </div>

                        {!isDone && (
                          <button
                            type="button"
                            onClick={() => {
                              const minsNeeded = dailyGoalType === 'minutes' ? Math.max(5, remaining) : 25;
                              setCustomMinutesInput(minsNeeded);
                              startFocus(minsNeeded, 'work');
                              setShowFloatingPopup(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>
                              {isRtl 
                                ? (dailyGoalType === 'minutes' ? `بدء جلسة تركيز (${remaining} دقيقة)` : 'بدء جلسة تركيز للهدف') 
                                : (dailyGoalType === 'minutes' ? `Launch Focus (${remaining}m to complete)` : 'Start Focus Session')}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 3. REAL DATA: "ACTIVE LEARNING TRACKS" - CONNECTED DIRECTLY WITH MY COURSES */}
              <div className="space-y-3 text-start">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm sm:text-base text-foreground">
                      {isRtl ? 'المسارات والدورات الجارية (بيانات حقيقية)' : 'Active Learning Tracks (Real Data)'}
                    </h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                      {startedCourses.length} {isRtl ? 'دورات مسجلة' : 'enrolled'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCourseFilter('in_progress');
                        setActiveTab('courses');
                      }}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>{isRtl ? 'الانتقال إلى دوراتي' : 'Open in My Courses'}</span>
                      <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeLearningTracks.map(course => {
                    const courseProg = progress[course.id] || { completedVideoIds: [] };
                    const completedCount = courseProg.completedVideoIds?.length || 0;
                    const totalCount = course.videos?.length || 1;
                    const pct = Math.round((completedCount / totalCount) * 100);
                    const isStarted = Boolean(progress[course.id]);

                    return (
                      <div 
                        key={course.id}
                        className="p-4 rounded-2xl bg-card border border-border/80 hover:border-primary/40 transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <img 
                            src={course.thumbnail} 
                            alt={course.title} 
                            className="w-16 h-12 rounded-lg object-cover bg-muted shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="space-y-1 min-w-0 flex-1">
                            <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">
                              {course.category}
                            </span>
                            <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1">
                              {course.title}
                            </h4>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {course.instructor}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 pt-1 border-t border-border/60">
                          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-muted-foreground">
                            <span>{pct}% {t('completed')}</span>
                            <span>{completedCount} / {totalCount} {t('videos')}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Link
                              to={`/course/${course.id}`}
                              className="py-2 px-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs text-center flex items-center justify-center gap-1 transition-colors"
                            >
                              <span>{isStarted ? (isRtl ? 'متابعة' : 'Resume') : (isRtl ? 'بدء' : 'Start')}</span>
                              <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => {
                                setCourseSearchQuery(course.title);
                                setActiveTab('courses');
                              }}
                              className="py-2 px-2.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs text-center flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <BookOpen className="w-3 h-3 text-muted-foreground" />
                              <span className="truncate">{isRtl ? 'في دوراتي' : 'In My Courses'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Smart Focus Companion (Custom time + popup timer + alarm) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6">
              
              {/* 4. SMART FOCUS COMPANION (CUSTOM TIME + POPUP TIMER + ALARM) */}
              <div className={cn(
                "rounded-2xl border p-5 sm:p-6 space-y-4 text-start transition-colors",
                focusModeType === 'break' 
                  ? "bg-amber-50/70 dark:bg-slate-900/90 border-amber-500/40" 
                  : "bg-card border-border/80"
              )}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2 min-w-0">
                    {focusModeType === 'break' ? (
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500 shrink-0">
                        <Coffee className="w-4 h-4 text-amber-500" />
                      </div>
                    ) : (
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Timer className="w-4 h-4" />
                      </div>
                    )}
                    <h3 className={cn("font-bold text-xs sm:text-sm md:text-base truncate", focusModeType === 'break' ? "text-amber-600 dark:text-amber-400 font-black" : "text-foreground")}>
                      {focusModeType === 'break' 
                        ? (isRtl ? 'استراحة قهوة' : 'Coffee Break') 
                        : (isRtl ? 'مساعد التركيز المخصص' : 'Smart Focus Companion')}
                    </h3>
                  </div>

                  {/* Mode switcher - Responsive for Laptop, Tablet, Mobile */}
                  <div className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold bg-muted/60 p-0.5 rounded-lg border border-border/60 self-start sm:self-auto shrink-0">
                    <button
                      onClick={() => setFocusMode('work')}
                      className={cn(
                        "px-2 sm:px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap",
                        focusModeType === 'work' ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Timer className="w-3 h-3" />
                      <span>{isRtl ? 'تركيز' : 'Focus'}</span>
                    </button>
                    <button
                      onClick={() => setFocusMode('break')}
                      className={cn(
                        "px-2 sm:px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap",
                        focusModeType === 'break' 
                          ? "bg-amber-500 text-slate-950 font-black shadow-2xs" 
                          : "text-muted-foreground hover:text-amber-500"
                      )}
                    >
                      <Coffee className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{isRtl ? 'استراحة قهوة' : 'Coffee Break'}</span>
                    </button>
                  </div>
                </div>

                {/* Custom Time Selection & Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{isRtl ? 'حدد المدة المطلوبة:' : 'Custom Session Duration:'}</span>
                    <span className="font-mono font-bold text-foreground">{customMinutesInput} mins</span>
                  </div>

                  {/* Presets */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {(focusModeType === 'break' ? [3, 5, 10, 15] : [15, 25, 45, 60]).map(mins => (
                      <button
                        key={mins}
                        onClick={() => handleSelectPresetTime(mins)}
                        className={cn(
                          "py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer text-center",
                          customMinutesInput === mins
                            ? focusModeType === 'break' ? "bg-amber-500 text-slate-950 font-black" : "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>

                  {/* Custom Number Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <label className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {isRtl ? 'أو وقت مخصص (دقيقة):' : 'Or exact minutes:'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={customTimeInputVal}
                      onChange={handleCustomTimeChange}
                      className="w-20 bg-background border border-border/80 rounded-lg px-2 py-1 text-xs font-mono font-bold text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Clock Display - Doesn't change while choosing time; updates and counts down when running */}
                {(() => {
                  const displaySecs = isFocusRunning ? timeLeft : (focusModeType === 'break' ? 5 * 60 : 25 * 60);
                  const displayM = Math.floor(displaySecs / 60);
                  const displayS = displaySecs % 60;
                  return (
                    <div className={cn(
                      "py-3 text-center space-y-1 rounded-xl border transition-colors",
                      focusModeType === 'break' 
                        ? "bg-amber-500/10 border-amber-500/30" 
                        : "bg-muted/20 border-border/50"
                    )}>
                      <div className={cn(
                        "text-4xl sm:text-5xl font-mono font-extrabold tabular-nums tracking-tight",
                        focusModeType === 'break' ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                      )}>
                        {displayM.toString().padStart(2, '0')}:{displayS.toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                        {focusModeType === 'break' ? (
                          <>
                            <Coffee className="w-3.5 h-3.5 text-amber-500" />
                            <span>{isRtl ? 'وقت استراحة لتجديد طاقتك' : 'Coffee rest interval to recharge'}</span>
                          </>
                        ) : (
                          <span>
                            {isFocusRunning
                              ? (isRtl ? 'المؤقت يعمل فوق الفيديو والمنصة.' : 'Timer running! Visible floating HUD on videos.')
                              : (isRtl ? 'اضغط "بدء التركيز" لبدء الجلسة وظهور المؤقت.' : 'Click "Start Focus" to launch the session HUD.')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (isFocusRunning) {
                        pauseFocus();
                      } else {
                        startFocus(customMinutesInput, focusModeType);
                        setShowFloatingPopup(true);
                      }
                    }}
                    className={cn(
                      "flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs",
                      isFocusRunning 
                        ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-black" 
                        : focusModeType === 'break'
                        ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-black"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    )}
                  >
                    {isFocusRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'إيقاف مؤقت' : 'Pause Focus'}</span>
                      </>
                    ) : (
                      <>
                        {focusModeType === 'break' ? <Coffee className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{isRtl ? 'بدء التركيز' : 'Start Focus'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={resetFocus}
                    title={isRtl ? 'إعادة ضبط' : 'Reset'}
                    className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Alarm test & Logged info */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground font-mono tabular-nums">
                  <span>{isRtl ? 'دقائق اليوم:' : 'Logged today:'}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{focusMinutesToday} mins</span>
                    <button
                      onClick={() => triggerFocusAlarmSoundAndVibrate()}
                      title={isRtl ? 'اختبار صوت المنبه والاهتزاز' : 'Test alarm sound & vibration'}
                      className="p-1 rounded text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* REALTIME QUESTS PREVIEW */}
              <div className="rounded-2xl bg-card border border-border/80 p-5 space-y-3 text-start">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <h3 className="font-bold text-sm text-foreground">
                      {isRtl ? 'التحديات اليومية (مباشر)' : 'Daily Quests (Realtime)'}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {midnightCountdown}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                    <span>{isRtl ? 'سؤال اليوم البرمجي (+25 XP)' : 'Daily Tech Quest (+25 XP)'}</span>
                    <span className={cn(
                      "font-bold px-2 py-0.5 rounded text-[11px]",
                      isQuestDoneToday ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"
                    )}>
                      {isQuestDoneToday ? (isRtl ? 'مكتمل ✓' : 'Done ✓') : (isRtl ? 'متاح الآن' : 'Available')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                    <span>{isRtl ? 'مكافأة تسجيل الحضور' : '7-Day Check-in Reward'}</span>
                    <span className={cn(
                      "font-bold px-2 py-0.5 rounded text-[11px]",
                      isCheckinDoneToday ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/15 text-primary"
                    )}>
                      {isCheckinDoneToday ? (isRtl ? 'تم الاستلام ✓' : 'Claimed ✓') : (isRtl ? 'جاهز للاستلام' : 'Ready')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('quests')}
                  className="w-full py-2 px-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{isRtl ? 'فتح مركز التحديات والمكافآت' : 'Open Quests & Badges'}</span>
                  <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: MY COURSES & CERTIFICATES (WITH PAGINATION)           */}
      {/* ============================================================== */}
      {activeTab === 'courses' && (
        <div className="space-y-6 text-start">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-border/70">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                {t('my_enrolled_courses', 'My Courses & Progress')}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRtl ? 'تصفح دوراتك ومقرراتك مع ميزة التنقل بين الصفحات والشهادات المعتمدة.' : 'Browse your learning catalog with clean page navigation and verifiable certificates.'}
              </p>
            </div>

            {/* Filter segments */}
            <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border/70 overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => setCourseFilter('all')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                  courseFilter === 'all' ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t('filter_all_courses', 'All')} ({startedCourses.length})
              </button>
              <button
                onClick={() => setCourseFilter('in_progress')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                  courseFilter === 'in_progress' ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t('filter_in_progress', 'In Progress')} ({inProgressCourses.length})
              </button>
              <button
                onClick={() => setCourseFilter('completed')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                  courseFilter === 'completed' ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t('filter_completed', 'Completed')} ({completedCourses.length})
              </button>
              <button
                onClick={() => setCourseFilter('certified')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                  courseFilter === 'certified' ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t('certificates', 'Certificates')} ({earnedCertificates.length})
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={courseSearchQuery}
                onChange={(e) => setCourseSearchQuery(e.target.value)}
                placeholder={isRtl ? 'ابحث في دوراتك حسب العنوان أو المدرس...' : 'Search your courses by title or instructor...'}
                className="w-full bg-card border border-border/80 rounded-xl ps-9 pe-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {allCategories.length > 0 && (
              <select
                value={courseCategoryFilter}
                onChange={(e) => setCourseCategoryFilter(e.target.value)}
                className="bg-card border border-border/80 rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shrink-0"
              >
                <option value="all">{isRtl ? 'جميع التصنيفات' : 'All Categories'}</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>

          {/* Courses Grid */}
          {paginatedCourses.length === 0 ? (
            <div className="text-center py-16 px-4 bg-card rounded-2xl border border-dashed border-border/80 space-y-3">
              <PlayCircle className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="font-bold text-base text-foreground">
                {courseSearchQuery 
                  ? (isRtl ? 'لم يتم العثور على نتائج للبحث' : 'No courses match your search')
                  : (isRtl ? 'لا توجد دورات في هذا القسم' : 'No courses in this section')}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {isRtl 
                  ? 'استكشف كتالوج المقررات وابدأ رحلة تعليمية جديدة اليوم.' 
                  : 'Explore our catalog of structured courses and launch your learning track.'}
              </p>
              <Link 
                to="/courses"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 transition-all"
              >
                <span>{t('explore_courses', 'Explore Courses')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedCourses.map(course => {
                  const courseProg = progress[course.id] || { completedVideoIds: [], isCompleted: false };
                  const percent = Math.round(((courseProg.completedVideoIds?.length || 0) / (course.videos?.length || 1)) * 100);
                  const isCompleted = courseProg.isCompleted;

                  return (
                    <div 
                      key={course.id}
                      className="flex flex-col bg-card rounded-2xl border border-border/80 overflow-hidden hover:border-primary/40 transition-all group"
                    >
                      <div className="relative aspect-video bg-muted overflow-hidden">
                        {course.thumbnail ? (
                          <img 
                            src={course.thumbnail} 
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-3 text-xs text-muted-foreground text-center font-medium">
                            {course.title}
                          </div>
                        )}

                        <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5">
                          <span className="bg-background/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-bold text-foreground">
                            {course.category}
                          </span>
                        </div>

                        <div className="absolute top-2.5 end-2.5">
                          <FavoriteButton itemId={course.id} itemType={course.isSingleVideo ? 'masterclass' : 'playlist'} size="sm" />
                        </div>

                        {isCompleted && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>{t('completed', 'Completed')}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between space-y-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm sm:text-base text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {course.title}
                          </h4>
                          <div className="text-xs text-muted-foreground">
                            <ScrollingText>{course.instructor}</ScrollingText>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border/60">
                          <div className="flex items-center justify-between text-xs font-mono tabular-nums text-muted-foreground">
                            <span className="font-bold text-foreground">{percent}%</span>
                            <span>{courseProg.completedVideoIds?.length || 0} / {course.videos?.length || 0}</span>
                          </div>

                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full transition-all", isCompleted ? "bg-emerald-500" : "bg-primary")}
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            {isCompleted ? (
                              <>
                                {isCertificateEligible(course) ? (
                                  <Link 
                                    to={`/certificate/${course.id}`}
                                    className="col-span-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-all"
                                  >
                                    <Award className="w-3.5 h-3.5" />
                                    <span>{t('view_certificate', 'View Certificate')}</span>
                                  </Link>
                                ) : (
                                  <div className="col-span-2 py-1.5 px-2 bg-muted/60 text-muted-foreground rounded-lg font-medium text-[11px] text-center">
                                    {isRtl ? 'تم إكمال الماستركلاس' : 'Masterclass Completed'}
                                  </div>
                                )}

                                <button 
                                  onClick={() => setReviewModalCourseId(course.id)}
                                  disabled={submittedReviews[course.id]}
                                  className="py-2 px-2 bg-muted hover:bg-muted/80 text-foreground border border-border/70 rounded-xl font-semibold text-center text-xs transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  {submittedReviews[course.id] ? 'Reviewed ✓' : t('review_course', 'Review')}
                                </button>

                                <Link 
                                  to={`/course/${course.id}`}
                                  className="py-2 px-2 bg-muted hover:bg-muted/80 text-foreground border border-border/70 rounded-xl font-semibold text-center text-xs transition-colors"
                                >
                                  {isRtl ? 'إعادة المشاهدة' : 'Re-watch'}
                                </Link>
                              </>
                            ) : (
                              <Link 
                                to={`/course/${course.id}`}
                                className="col-span-2 py-2.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow-xs transition-all"
                              >
                                <span>{t('continue_watching', 'Continue Lesson')}</span>
                                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                              </Link>
                            )}
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 5. RESPONSIVE PAGINATION CONTROLS */}
              {totalCoursePages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/70">
                  <div className="text-xs font-mono text-muted-foreground">
                    {isRtl 
                      ? `الصفحة ${courseCurrentPage} من ${totalCoursePages} (${displayedCourses.length} دورات)` 
                      : `Page ${courseCurrentPage} of ${totalCoursePages} (${displayedCourses.length} courses total)`}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Previous Page */}
                    <button
                      onClick={() => setCourseCurrentPage(p => Math.max(1, p - 1))}
                      disabled={courseCurrentPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-border/70 bg-card hover:bg-muted text-foreground text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                      <span>{isRtl ? 'السابق' : 'Prev'}</span>
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalCoursePages }, (_, idx) => idx + 1).map(pageNumber => (
                      <button
                        key={pageNumber}
                        onClick={() => setCourseCurrentPage(pageNumber)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer",
                          courseCurrentPage === pageNumber
                            ? "bg-primary text-primary-foreground shadow-2xs"
                            : "bg-card border border-border/70 text-foreground hover:bg-muted"
                        )}
                      >
                        {pageNumber}
                      </button>
                    ))}

                    {/* Next Page */}
                    <button
                      onClick={() => setCourseCurrentPage(p => Math.min(totalCoursePages, p + 1))}
                      disabled={courseCurrentPage === totalCoursePages}
                      className="px-3 py-1.5 rounded-lg border border-border/70 bg-card hover:bg-muted text-foreground text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>{isRtl ? 'التالي' : 'Next'}</span>
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 3: SAVED LIBRARY (PLAYLISTS, MASTERCLASSES, PATHS, BOOKS)  */}
      {/* ============================================================== */}
      {activeTab === 'saved' && (
        <div className="space-y-6 text-start">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-border/70">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                {isRtl ? 'المكتبة المحفوظة والمفضلات' : 'Saved Library & Bookmarks'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRtl 
                  ? 'مجموعتك الشخصية من قوائم التشغيل، الماستركلاس، المسارات والكتب المحفوظة للمراجعة لاحقاً.' 
                  : 'Your bookmarked playlists, masterclasses, learning paths, and audio/video books in one place.'}
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border/70 overflow-x-auto no-scrollbar shrink-0">
              {[
                { id: 'all', label: isRtl ? 'الكل' : 'All', count: totalSavedCount },
                { id: 'playlist', label: isRtl ? 'قوائم التشغيل' : 'Playlists', count: savedPlaylists.length },
                { id: 'masterclass', label: isRtl ? 'الماستركلاس' : 'Masterclasses', count: savedMasterclasses.length },
                { id: 'path', label: isRtl ? 'المسارات' : 'Paths', count: savedPaths.length },
                { id: 'book', label: isRtl ? 'الكتب' : 'Books', count: savedBooks.length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFavoriteTab(tab.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                    favoriteTab === tab.id ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>{tab.label}</span>
                  <span className="font-mono text-[10px] px-1 py-0.2 rounded-md bg-muted text-muted-foreground">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={favoriteSearchQuery}
              onChange={(e) => setFavoriteSearchQuery(e.target.value)}
              placeholder={isRtl ? 'ابحث في عناصرك المحفوظة...' : 'Search your saved items...'}
              className="w-full bg-card border border-border/80 rounded-xl ps-9 pe-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {totalSavedCount === 0 ? (
            <div className="text-center py-16 px-4 bg-card rounded-2xl border border-dashed border-border/80 space-y-3">
              <Heart className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="font-bold text-base text-foreground">
                {isRtl ? 'قائمة المفضلة فارغة حالياً' : 'No Saved Items Yet'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {isRtl 
                  ? 'اضغط على رمز القلب في أي قائمة تشغيل أو مسار أو كتاب لحفظه في مكتبتك الشخصية.' 
                  : 'Click the heart icon on any playlist, learning path, or book to save it to your personal library.'}
              </p>
              <Link 
                to="/courses"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 transition-all"
              >
                <span>{t('explore_courses', 'Explore Courses')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* PLAYLISTS & MASTERCLASSES */}
              {(favoriteTab === 'all' || favoriteTab === 'playlist' || favoriteTab === 'masterclass') && (
                (() => {
                  let list = favoriteTab === 'playlist' 
                    ? savedPlaylists 
                    : favoriteTab === 'masterclass' 
                    ? savedMasterclasses 
                    : [...savedPlaylists, ...savedMasterclasses];
                  
                  if (favoriteSearchQuery.trim()) {
                    const q = favoriteSearchQuery.toLowerCase();
                    list = list.filter(c => c.title.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q));
                  }

                  if (list.length === 0 && favoriteTab !== 'all') {
                    return (
                      <p className="text-xs text-muted-foreground py-8 text-center bg-card rounded-xl border border-border/70">
                        {isRtl ? 'لا توجد عناصر محفوظة في هذا القسم.' : 'No saved items in this category.'}
                      </p>
                    );
                  }

                  if (list.length === 0) return null;

                  return (
                    <div className="space-y-3">
                      {favoriteTab === 'all' && (
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <PlayCircle className="w-3.5 h-3.5 text-primary" />
                          <span>{isRtl ? 'قوائم التشغيل والماستركلاس' : 'Playlists & Masterclasses'}</span>
                          <span className="font-mono">({list.length})</span>
                        </h3>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {list.map(course => {
                          const isMC = Boolean(course.isSingleVideo);
                          return (
                            <div 
                              key={course.id}
                              className="flex flex-col bg-card rounded-2xl border border-border/80 overflow-hidden hover:border-primary/40 transition-all group"
                            >
                              <div className="relative aspect-video bg-muted overflow-hidden">
                                {course.thumbnail ? (
                                  <img 
                                    src={course.thumbnail} 
                                    alt={course.title}
                                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center p-3 text-xs text-muted-foreground text-center font-medium">
                                    {course.title}
                                  </div>
                                )}
                                <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5">
                                  <span className="bg-background/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-bold text-foreground">
                                    {isMC ? (isRtl ? 'ماستركلاس' : 'Masterclass') : (isRtl ? 'قائمة تشغيل' : 'Playlist')}
                                  </span>
                                </div>
                                <div className="absolute top-2.5 end-2.5">
                                  <FavoriteButton itemId={course.id} itemType={isMC ? 'masterclass' : 'playlist'} size="sm" />
                                </div>
                              </div>

                              <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                                <div className="space-y-1">
                                  <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                    {course.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {course.instructor}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                                  <Link
                                    to={`/course/${course.id}`}
                                    className="flex-1 py-2 px-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs text-center flex items-center justify-center gap-1 transition-all"
                                  >
                                    <span>{isRtl ? 'مشاهدة' : 'Watch'}</span>
                                    <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                                  </Link>
                                  <button
                                    onClick={() => toggleFavorite(course.id, isMC ? 'masterclass' : 'playlist')}
                                    title={isRtl ? 'إزالة من المفضلة' : 'Remove'}
                                    className="p-2 rounded-xl bg-muted hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              )}

              {/* LEARNING PATHS */}
              {(favoriteTab === 'all' || favoriteTab === 'path') && (
                (() => {
                  let list = savedPaths;
                  if (favoriteSearchQuery.trim()) {
                    const q = favoriteSearchQuery.toLowerCase();
                    list = list.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
                  }

                  if (list.length === 0 && favoriteTab !== 'all') {
                    return (
                      <p className="text-xs text-muted-foreground py-8 text-center bg-card rounded-xl border border-border/70">
                        {isRtl ? 'لا توجد مسارات محفوظة.' : 'No saved paths.'}
                      </p>
                    );
                  }

                  if (list.length === 0) return null;

                  return (
                    <div className="space-y-3">
                      {favoriteTab === 'all' && (
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-primary" />
                          <span>{isRtl ? 'المسارات التعليمية' : 'Learning Paths'}</span>
                          <span className="font-mono">({list.length})</span>
                        </h3>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {list.map(path => (
                          <div 
                            key={path.id}
                            className="p-5 rounded-2xl bg-card border border-border/80 hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="font-bold text-primary">{path.courseIds.length} {isRtl ? 'قوائم تشغيل' : 'Curriculums'}</span>
                                <FavoriteButton itemId={path.id} itemType="path" size="sm" />
                              </div>
                              <h4 className="font-bold text-base text-foreground line-clamp-1">
                                {path.title}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {path.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 pt-3 border-t border-border/60">
                              <Link
                                to={`/path/${path.id}`}
                                className="flex-1 py-2 px-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs text-center flex items-center justify-center gap-1 transition-all"
                              >
                                <span>{isRtl ? 'فتح المسار' : 'View Path'}</span>
                                <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                              </Link>
                              <button
                                onClick={() => toggleFavorite(path.id, 'path')}
                                title={isRtl ? 'إزالة من المفضلة' : 'Remove'}
                                className="p-2 rounded-xl bg-muted hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()
              )}

              {/* BOOKS */}
              {(favoriteTab === 'all' || favoriteTab === 'book') && (
                (() => {
                  let list = savedBooks;
                  if (favoriteSearchQuery.trim()) {
                    const q = favoriteSearchQuery.toLowerCase();
                    list = list.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
                  }

                  if (list.length === 0 && favoriteTab !== 'all') {
                    return (
                      <p className="text-xs text-muted-foreground py-8 text-center bg-card rounded-xl border border-border/70">
                        {isRtl ? 'لا توجد كتب محفوظة.' : 'No saved books.'}
                      </p>
                    );
                  }

                  if (list.length === 0) return null;

                  return (
                    <div className="space-y-3">
                      {favoriteTab === 'all' && (
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-primary" />
                          <span>{isRtl ? 'الكتب المشروحة' : 'Video Books'}</span>
                          <span className="font-mono">({list.length})</span>
                        </h3>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {list.map(book => {
                          const localized = getLocalizedBookData(book, isRtl ? 'ar' : 'en');
                          return (
                            <div 
                              key={book.id}
                              onClick={() => setSelectedBookForModal(book)}
                              className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-primary/40 transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
                            >
                              <div className="space-y-2">
                                <div className="px-2 pt-1">
                                  <BookCoverVisual book={book} />
                                </div>
                                <span className="text-[10px] font-semibold text-primary block truncate">
                                  {translateBookCategory(book.category, isRtl)}
                                </span>
                                <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                  {book.title}
                                </h4>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {book.author}
                                </p>
                              </div>

                              <div className="pt-2 border-t border-border/60 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBookForModal(book);
                                  }}
                                  className="flex-1 py-1.5 px-2 rounded-lg bg-foreground text-background text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>{isRtl ? 'الشرح' : 'Summary'}</span>
                                </button>
                                {localized.buyUrl && (
                                  <a
                                    href={localized.buyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 rounded-lg bg-[#FF9900] text-slate-950 flex items-center justify-center shrink-0"
                                    title="Amazon"
                                  >
                                    <AmazonIcon className="w-3 h-3 text-slate-950" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              )}

            </div>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 4: DAILY QUESTS, RETENTION & BADGES (REALTIME UPDATE)    */}
      {/* ============================================================== */}
      {activeTab === 'quests' && (
        <div className="space-y-8 text-start">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                {isRtl ? 'التحديات اليومية وخارطة الأوسمة (تحديث فوري)' : 'Daily Quests & Skill Milestones (Live Sync)'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRtl ? 'تحديثات فورية لنقاط الخبرة XP والأوسمة وسلسلة الأيام بمجرد إكمال التحدي أو تسجيل الحضور.' : 'Live Firestore sync for XP, achievement badges, and daily retention ladders.'}
              </p>
            </div>

            {/* Midnight Reset live ticker */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/70 text-xs font-mono text-muted-foreground self-start sm:self-auto">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>{isRtl ? 'يتجدد التحدي بعد:' : 'Resets in:'}</span>
              <span className="font-bold text-foreground">{midnightCountdown}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <DailyRewardCheckIn />
            <DailyTechQuest />
          </div>

          <AchievementsShowcase />

        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 5: SUPPORT TICKETS & HELP DESK                           */}
      {/* ============================================================== */}
      {activeTab === 'support' && (
        <div className="space-y-6 text-start">
          <div className="pb-3 border-b border-border/70">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              {isRtl ? 'تذاكر الدعم الفني والمساعدة' : 'Support Desk & Help Tickets'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRtl ? 'تواصل مباشرة مع المشرفين التقنيين لمتابعة استفساراتك أو مشاكل الحساب والمقررات.' : 'Get in direct contact with platform mentors and admins for help with courses, accounts, or certificates.'}
            </p>
          </div>

          <SupportTickets embedded />
        </div>
      )}

      {/* REVIEW COURSE MODAL */}
      {reviewModalCourseId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 relative text-start"
          >
            <button 
              onClick={() => setReviewModalCourseId(null)}
              className="absolute top-4 end-4 p-1.5 hover:bg-muted rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-lg font-bold mb-1 text-foreground">
              {t('review_course', 'Review Course')}
            </h3>
            <p className="text-muted-foreground text-xs mb-4">
              {courses.find(c => c.id === reviewModalCourseId)?.title}
            </p>
            
            <div className="flex justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className="p-1 hover:scale-110 transition-transform focus:outline-none cursor-pointer"
                >
                  <Star 
                    className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground opacity-30'}`} 
                  />
                </button>
              ))}
            </div>
            
            <textarea 
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={isRtl ? 'اكتب رأيك وملاحظاتك حول المقرر...' : 'Share your learning experience and feedback...'}
              className="w-full bg-background border border-border/80 rounded-xl px-3 py-2.5 text-xs min-h-[90px] mb-4 resize-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
            
            <button 
              onClick={() => {
                setIsSubmittingReview(true);
                setTimeout(() => {
                  setSubmittedReviews(prev => ({ ...prev, [reviewModalCourseId]: true }));
                  setIsSubmittingReview(false);
                  setReviewModalCourseId(null);
                  setReviewText('');
                  setReviewRating(5);
                }, 600);
              }}
              disabled={isSubmittingReview}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center disabled:opacity-70 cursor-pointer shadow-xs"
            >
              {isSubmittingReview ? (isRtl ? 'جاري الإرسال...' : 'Submitting...') : (isRtl ? 'إرسال التقييم' : 'Submit Review')}
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
}
