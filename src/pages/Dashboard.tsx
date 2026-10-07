import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Award, 
  PlayCircle, 
  CheckCircle, 
  Trophy, 
  Flame, 
  BookOpen, 
  Clock, 
  Star, 
  X, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  ShieldCheck,
  Compass,
  Check,
  Heart,
  Trash2,
  Youtube,
  Play,
  Bookmark,
  LifeBuoy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { Book } from '../data/courses';
import { ScrollingText } from '../components/ScrollingText';
import { DailyRewardCheckIn } from '../components/DailyRewardCheckIn';
import { DailyTechQuest } from '../components/DailyTechQuest';
import { AchievementsShowcase } from '../components/AchievementsShowcase';
import { FavoriteButton } from '../components/FavoriteButton';
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

export function Dashboard() {
  const { t, i18n } = useTranslation();
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
    setIsAuthModalOpen 
  } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  // Review modal states
  const [reviewModalCourseId, setReviewModalCourseId] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [submittedReviews, setSubmittedReviews] = useState<Record<string, boolean>>({});

  // Course filter tab
  const [courseFilter, setCourseFilter] = useState<'all' | 'in_progress' | 'completed'>('all');

  // Saved Favorites filter tab
  const [favoriteTab, setFavoriteTab] = useState<'all' | 'playlist' | 'masterclass' | 'path' | 'book'>('all');
  const [selectedBookForModal, setSelectedBookForModal] = useState<Book | null>(null);

  if (!user) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full px-4 sm:px-6 lg:px-8 py-12 max-w-[1400px] mx-auto space-y-10">
        <BookVideoModal
          book={selectedBookForModal}
          onClose={() => setSelectedBookForModal(null)}
          onSelectBook={(b) => setSelectedBookForModal(b)}
        />

        <div className="p-8 sm:p-10 rounded-3xl bg-card border border-border/80 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black mb-2 text-foreground">{t('login_to_start', 'Please Log In')}</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {isRtl 
              ? 'سجل دخولك لحفظ مفضلاتك سحابياً في حسابك الشخصي، متابعة تقدمك التعليمي، وكسب النقاط والشهادات.' 
              : 'Log in to sync your saved favorites across devices, track your course progress, and unlock verifiable certificates.'}
          </p>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl shadow-sm hover:bg-primary/90 transition-all cursor-pointer text-sm"
          >
            {t('login', 'Log In to Continue')}
          </button>
        </div>

        {Object.keys(favorites || {}).length > 0 && (
          <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-4 text-start">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <h3 className="text-lg font-extrabold text-foreground">
                  {isRtl ? 'مفضلاتك المحفوظة على هذا الجهاز' : 'Your Saved Favorites on This Device'} ({Object.keys(favorites || {}).length})
                </h3>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                {isRtl ? 'سجل الدخول لمزامنتها في حسابك ←' : 'Log in to save permanently to your profile →'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Calculate user courses
  const coursePool = courses.length > 0 ? courses : allCourses;
  const bookPool = books.length > 0 ? books : allBooks;

  const startedCourses = coursePool.filter(c => progress[c.id]);
  const completedCourses = startedCourses.filter(c => progress[c.id]?.isCompleted);
  const earnedCertificates = completedCourses.filter(c => isCertificateEligible(c));
  const inProgressCourses = startedCourses.filter(c => !progress[c.id]?.isCompleted);

  // Calculate Saved / Favorite Items
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

  const displayedCourses = useMemo(() => {
    if (courseFilter === 'in_progress') return inProgressCourses;
    if (courseFilter === 'completed') return completedCourses;
    return startedCourses;
  }, [courseFilter, inProgressCourses, completedCourses, startedCourses]);

  // Gamification metrics
  const xp = publicProfile ? publicProfile.xp : 0;
  const level = publicProfile ? Math.floor(publicProfile.xp / 100) + 1 : 1;
  const streak = publicProfile?.streak || 1;

  // Rank title
  const rankTitle = useMemo(() => {
    if (level >= 7) return t('rank_master', 'Cyber Master');
    if (level >= 4) return t('rank_architect', 'Systems Architect');
    if (level >= 2) return t('rank_builder', 'Tech Builder');
    return t('rank_apprentice', 'Code Novice');
  }, [level, t]);

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-[1500px] mx-auto space-y-10"
    >
      {/* Book Video Popup Modal for Saved Books */}
      <BookVideoModal
        book={selectedBookForModal}
        onClose={() => setSelectedBookForModal(null)}
        onSelectBook={(b) => setSelectedBookForModal(b)}
      />

      {/* 1. STUDENT PROFILE & STATS HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card/90 to-primary/5 border border-border/80 p-6 sm:p-8 md:p-10 shadow-sm text-start">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          {/* Left: User Identity */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={userName} 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-primary/20 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Online indicator */}
              <span className="absolute -bottom-1 -end-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-bold mb-1.5">
                <Sparkles className="w-3 h-3" />
                <span>{rankTitle}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                {t('welcome_back', 'Welcome back,')} {userName}!
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {t('track_your_progress', 'Track your daily progress, solve challenges, and continue learning.')}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href="#user-support-tickets-section"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs font-bold transition-colors"
                >
                  <LifeBuoy className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'تذاكر الدعم الفني والمساعدة' : 'Support Tickets & Help Desk'}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right: Metric Badges Pill Array */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            
            {/* Level Metric */}
            <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col items-center text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                <Trophy className="w-3.5 h-3.5 text-primary" />
                <span>{t('current_level', 'Level')}</span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-foreground">
                LVL {level}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {xp.toLocaleString()} XP
              </span>
            </div>

            {/* Streak Metric */}
            <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col items-center text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                <span>{t('daily_streak', 'Streak')}</span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-orange-500">
                {streak}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isRtl ? 'أيام متتالية' : 'Days Active'}
              </span>
            </div>

            {/* Courses In Progress */}
            <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col items-center text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>{t('courses', 'Courses')}</span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-foreground">
                {startedCourses.length}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {completedCourses.length} {isRtl ? 'مكتملة' : 'Completed'}
              </span>
            </div>

            {/* Saved / Favorites Metric */}
            <a 
              href="#saved-favorites-section" 
              className="p-3 sm:p-4 rounded-2xl bg-card hover:bg-rose-500/5 border border-border/70 hover:border-rose-500/30 shadow-xs flex flex-col items-center text-center transition-colors"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>{isRtl ? 'المفضلة' : 'Favorites'}</span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-rose-500">
                {totalSavedCount}
              </span>
              <span className="text-[10px] text-primary hover:underline font-semibold">
                {isRtl ? 'المحفوظات' : 'Saved Items'}
              </span>
            </a>

            {/* Certificates */}
            <div className="col-span-2 sm:col-span-1 p-3 sm:p-4 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col items-center text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                <Award className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t('certificates', 'Certificates')}</span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-emerald-500">
                {earnedCertificates.length}
              </span>
              <Link to="/certificates" className="text-[10px] text-primary hover:underline font-semibold">
                {t('view_all', 'View All')}
              </Link>
            </div>

          </div>

        </div>
      </div>

      {/* 2. DAILY RETENTION & STUDENT HABIT HUB (THE KEY HOOK) */}
      <section className="space-y-4 text-start">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Flame className="w-4 h-4 fill-primary" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
            {isRtl ? 'مركز الزيارة والنشاط اليومي' : 'Daily Retention & Habit Hub'}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Feature 1: 7-Day Reward Check-in */}
          <DailyRewardCheckIn />

          {/* Feature 2: Daily Tech Quest */}
          <DailyTechQuest />
        </div>
      </section>

      {/* 3. ACHIEVEMENTS & BADGES SHOWCASE */}
      <section className="space-y-4 text-start">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
            <Trophy className="w-4 h-4" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
            {t('hacker_roadmap_achievements', 'Achievements & Milestones')}
          </h2>
        </div>

        <AchievementsShowcase />
      </section>

      {/* 4. MY COURSES & PROGRESS HUB */}
      <section className="space-y-6 text-start">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/70">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {t('my_enrolled_courses', 'My Courses & Progress')}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isRtl ? 'تابع تقدمك في الدروس وقوائم التشغيل التي بدأت بتعلمها' : 'Continue lessons where you left off and claim verified completion certificates.'}
            </p>
          </div>

          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border/70 self-start sm:self-auto">
            <button
              onClick={() => setCourseFilter('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                courseFilter === 'all'
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('filter_all_courses', 'All Enrolled')} ({startedCourses.length})
            </button>
            <button
              onClick={() => setCourseFilter('in_progress')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                courseFilter === 'in_progress'
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('filter_in_progress', 'In Progress')} ({inProgressCourses.length})
            </button>
            <button
              onClick={() => setCourseFilter('completed')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                courseFilter === 'completed'
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('filter_completed', 'Completed')} ({completedCourses.length})
            </button>
          </div>
        </div>

        {/* Empty State */}
        {displayedCourses.length === 0 ? (
          <div className="text-center py-16 px-4 bg-card rounded-3xl border border-dashed border-border/80">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <PlayCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold mb-1 text-foreground">
              {courseFilter === 'completed' 
                ? (isRtl ? 'لم تكمل أي دورة بعد' : 'No completed courses yet')
                : (isRtl ? 'لم تسجل في أي دورة بعد' : t('no_courses_yet', 'No courses yet'))}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              {isRtl 
                ? 'استكشف مكتبتنا المجانية الغنية بالقوائم التسلسلية والماستر كلاس وابدأ التعلم الآن.' 
                : 'Start your distraction-free tech journey by choosing a course or learning path today.'}
            </p>
            <Link 
              to="/courses"
              className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs sm:text-sm shadow-xs hover:bg-primary/90 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>{t('explore_courses', 'Explore Courses')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        ) : (
          /* Enrolled Courses Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayedCourses.map(course => {
              const courseProgress = progress[course.id] || { completedVideoIds: [], isCompleted: false };
              const percentComplete = Math.round(((courseProgress.completedVideoIds?.length || 0) / (course.videos?.length || 1)) * 100);
              const isCompleted = courseProgress.isCompleted;

              return (
                <div 
                  key={course.id} 
                  className="group flex flex-col bg-card rounded-3xl border border-border/80 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 text-start"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {course.thumbnail?.trim() ? (
                      <img 
                        src={course.thumbnail} 
                        alt={course.title} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 text-xs font-semibold text-muted-foreground text-center">
                        {course.title}
                      </div>
                    )}

                    {/* Completion badge overlay */}
                    {isCompleted ? (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white font-bold text-xs shadow-md">
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>{t('completed', 'Completed')}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute top-3 start-3">
                        <span className="bg-background/90 backdrop-blur px-2.5 py-1 rounded-md text-[10px] font-bold text-foreground shadow-xs">
                          {course.category}
                        </span>
                      </div>
                    )}

                    {course.language && (
                      <div className="absolute top-3 end-3 z-10 bg-black/75 backdrop-blur text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                        {course.language}
                      </div>
                    )}

                    <div className="absolute bottom-3 end-3 z-10">
                      <FavoriteButton
                        itemId={course.id}
                        itemType={course.isSingleVideo ? 'masterclass' : 'playlist'}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    <h3 className="font-bold text-base sm:text-lg mb-1 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <div className="text-xs text-muted-foreground mb-4">
                      <ScrollingText>{course.instructor}</ScrollingText>
                    </div>

                    <div className="mt-auto pt-2">
                      {/* Progress Bar & Stats */}
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-foreground">
                          {percentComplete}% {t('completed')}
                        </span>
                        <span className="text-muted-foreground font-medium">
                          {courseProgress.completedVideoIds?.length || 0} / {course.videos?.length || 0} {t('videos')}
                        </span>
                      </div>

                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-5">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            isCompleted ? "bg-emerald-500" : "bg-primary"
                          )} 
                          style={{ width: `${percentComplete}%` }}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        {isCompleted ? (
                          <>
                            {isCertificateEligible(course) ? (
                              <Link 
                                to={`/certificate/${course.id}`}
                                className="col-span-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer"
                              >
                                <Award className="w-4 h-4" />
                                <span>{t('view_certificate', 'View Certificate')}</span>
                              </Link>
                            ) : (
                              <div className="col-span-2 py-2 px-3 bg-muted/60 border border-border/70 text-muted-foreground rounded-xl font-semibold text-[11px] text-center flex items-center justify-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>
                                  {isRtl ? 'تم إكمال الماستركلاس (الشهادات لقوائم التشغيل)' : 'Masterclass Completed (Certificates for Playlists)'}
                                </span>
                              </div>
                            )}

                            <button 
                              onClick={() => setReviewModalCourseId(course.id)}
                              disabled={submittedReviews[course.id]}
                              className="py-2 px-2 bg-muted hover:bg-muted/80 text-foreground border border-border/80 rounded-xl font-bold text-center text-xs transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {submittedReviews[course.id] ? 'Reviewed ✓' : t('review_course', 'Review')}
                            </button>

                            <Link 
                              to={`/course/${course.id}`}
                              className="py-2 px-2 bg-muted hover:bg-muted/80 text-foreground border border-border/80 rounded-xl font-bold text-center text-xs transition-all cursor-pointer"
                            >
                              {isRtl ? 'إعادة المشاهدة' : 'Re-watch'}
                            </Link>
                          </>
                        ) : (
                          <Link 
                            to={`/course/${course.id}`}
                            className="col-span-2 py-2.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
                          >
                            <span>{t('continue_watching', 'Continue Lesson')}</span>
                            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                          </Link>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. SAVED & FAVORITES LIBRARY (PLAYLISTS, MASTERCLASSES, PATHS, BOOKS) */}
      <section id="saved-favorites-section" className="space-y-6 text-start scroll-mt-24">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-border/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
                <Heart className="w-4 h-4 fill-rose-500" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {isRtl ? 'المفضلة والمحفوظات في ملفك الشخصي' : 'Saved & Favorites in Your Profile'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isRtl 
                ? 'جميع قوائم التشغيل، الماستركلاس، المسارات التعليمية، والكتب التي حفظتها للعودة إليها في أي وقت.' 
                : 'Your personal collection of saved playlists, masterclasses, learning paths, and books to revisit anytime.'}
            </p>
          </div>

          {/* Responsive Filter Tabs for Laptop, Tablet & Mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar p-1 bg-muted/50 rounded-2xl border border-border/70 self-start lg:self-auto max-w-full">
            {[
              { id: 'all', label: isRtl ? 'الكل' : 'All Saved', count: totalSavedCount },
              { id: 'playlist', label: isRtl ? 'قوائم التشغيل' : 'Playlists', count: savedPlaylists.length },
              { id: 'masterclass', label: isRtl ? 'الماستركلاس' : 'Masterclasses', count: savedMasterclasses.length },
              { id: 'path', label: isRtl ? 'المسارات' : 'Paths', count: savedPaths.length },
              { id: 'book', label: isRtl ? 'الكتب' : 'Books', count: savedBooks.length }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFavoriteTab(tab.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0",
                  favoriteTab === tab.id
                    ? "bg-card text-foreground shadow-xs font-bold border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold",
                  favoriteTab === tab.id ? "bg-rose-500/15 text-rose-500" : "bg-muted text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {totalSavedCount === 0 ? (
          <div className="text-center py-14 px-4 bg-card rounded-3xl border border-dashed border-border/80">
            <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-500">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold mb-1.5 text-foreground">
              {isRtl ? 'قائمة المفضلة فارغة حالياً' : 'Your Favorites List is Empty'}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
              {isRtl 
                ? 'اضغط على أيقونة القلب ❤️ في أي قائمة تشغيل، ماستركلاس، مسار تعليمي، أو كتاب لحفظه هنا في ملفك الشخصي والرجوع إليه لاحقاً.' 
                : 'Tap the heart icon ❤️ on any playlist, masterclass, learning path, or book across the platform to bookmark it in your profile for later.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Link
                to="/courses"
                className="px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow-xs hover:bg-primary/90 transition-all"
              >
                {isRtl ? 'تصفح قوائم التشغيل' : 'Browse Playlists'}
              </Link>
              <Link
                to="/masterclasses"
                className="px-4 py-2.5 bg-card hover:bg-muted text-foreground border border-border/80 font-bold rounded-xl text-xs transition-all"
              >
                {isRtl ? 'تصفح الماستركلاس' : 'Browse Masterclasses'}
              </Link>
              <Link
                to="/paths"
                className="px-4 py-2.5 bg-card hover:bg-muted text-foreground border border-border/80 font-bold rounded-xl text-xs transition-all"
              >
                {isRtl ? 'تصفح المسارات' : 'Browse Paths'}
              </Link>
              <Link
                to="/books"
                className="px-4 py-2.5 bg-card hover:bg-muted text-foreground border border-border/80 font-bold rounded-xl text-xs transition-all"
              >
                {isRtl ? 'تصفح الكتب' : 'Browse Books'}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* SAVED PLAYLISTS & MASTERCLASSES */}
            {((favoriteTab === 'all' && (savedPlaylists.length > 0 || savedMasterclasses.length > 0)) ||
              favoriteTab === 'playlist' ||
              favoriteTab === 'masterclass') && (
              <div className="space-y-4">
                {favoriteTab === 'all' && (
                  <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-primary" />
                    <span>{isRtl ? 'قوائم التشغيل والماستركلاس المحفوظة' : 'Saved Playlists & Masterclasses'}</span>
                    <span className="text-xs font-mono text-muted-foreground">({savedPlaylists.length + savedMasterclasses.length})</span>
                  </h3>
                )}

                {(() => {
                  const listToRender =
                    favoriteTab === 'playlist'
                      ? savedPlaylists
                      : favoriteTab === 'masterclass'
                      ? savedMasterclasses
                      : [...savedPlaylists, ...savedMasterclasses];

                  if (listToRender.length === 0) {
                    return (
                      <div className="p-8 text-center bg-card rounded-2xl border border-dashed border-border/70 text-xs text-muted-foreground">
                        {favoriteTab === 'playlist'
                          ? (isRtl ? 'لم تقم بحفظ أي قائمة تشغيل بعد.' : 'No saved playlists yet.')
                          : (isRtl ? 'لم تقم بحفظ أي ماستركلاس بعد.' : 'No saved masterclasses yet.')}
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {listToRender.map(course => {
                        const isMC = Boolean(course.isSingleVideo);
                        return (
                          <div
                            key={course.id}
                            className="group flex flex-col bg-card rounded-3xl border border-border/80 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 text-start"
                          >
                            <div className="relative aspect-video overflow-hidden bg-muted">
                              {course.thumbnail?.trim() ? (
                                <img
                                  src={course.thumbnail}
                                  alt={course.title}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center p-4 text-xs font-semibold text-muted-foreground text-center">
                                  {course.title}
                                </div>
                              )}
                              <div className="absolute top-3 start-3 flex flex-wrap gap-1.5 z-10">
                                <span className={cn(
                                  "px-2.5 py-1 rounded-md text-[10px] font-bold shadow-xs",
                                  isMC ? "bg-purple-600 text-white" : "bg-primary text-primary-foreground"
                                )}>
                                  {isMC ? (isRtl ? 'ماستركلاس' : 'Masterclass') : (isRtl ? 'قائمة تشغيل' : 'Playlist')}
                                </span>
                                <span className="bg-background/95 backdrop-blur px-2.5 py-1 rounded-md text-[10px] font-bold text-foreground shadow-xs">
                                  {getCategoryDisplayName(course.category, isRtl)}
                                </span>
                              </div>
                              <div className="absolute top-3 end-3 z-10">
                                <FavoriteButton
                                  itemId={course.id}
                                  itemType={isMC ? 'masterclass' : 'playlist'}
                                  size="sm"
                                />
                              </div>
                            </div>

                            <div className="p-5 flex flex-col flex-1">
                              <h4 className="font-bold text-base mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
                                {course.title}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
                                {course.description}
                              </p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 bg-muted/30 p-2.5 rounded-xl border border-border/50">
                                <span className="font-bold text-foreground">
                                  {isMC
                                    ? (course.videos?.[0]?.duration || '2h+')
                                    : `${course.videos?.length || 0} ${isRtl ? 'دروس' : 'videos'}`}
                                </span>
                                <span className="font-medium text-foreground max-w-[50%] truncate">
                                  {course.instructor}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-auto">
                                <Link
                                  to={`/course/${course.id}`}
                                  className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <span>{isRtl ? 'متابعة التعلم الآن' : 'Open & Watch'}</span>
                                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => toggleFavorite(course.id, isMC ? 'masterclass' : 'playlist')}
                                  title={isRtl ? 'إزالة من المفضلة' : 'Remove from Favorites'}
                                  className="p-2.5 rounded-xl bg-muted hover:bg-rose-500/15 text-muted-foreground hover:text-rose-500 border border-border/70 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SAVED LEARNING PATHS */}
            {((favoriteTab === 'all' && savedPaths.length > 0) || favoriteTab === 'path') && (
              <div className="space-y-4">
                {favoriteTab === 'all' && (
                  <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span>{isRtl ? 'المسارات التعليمية المحفوظة' : 'Saved Learning Paths'}</span>
                    <span className="text-xs font-mono text-muted-foreground">({savedPaths.length})</span>
                  </h3>
                )}

                {savedPaths.length === 0 ? (
                  <div className="p-8 text-center bg-card rounded-2xl border border-dashed border-border/70 text-xs text-muted-foreground">
                    {isRtl ? 'لم تقم بحفظ أي مسار تعليمي بعد.' : 'No saved learning paths yet.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {savedPaths.map(path => (
                      <div
                        key={path.id}
                        className="group bg-card border border-border/80 rounded-3xl p-5 sm:p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 text-start"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-xl">
                              {path.courseIds.length} {isRtl ? 'قوائم تشغيل' : 'Playlists'}
                            </span>
                            <FavoriteButton itemId={path.id} itemType="path" variant="pill" size="sm" />
                          </div>
                          <h4 className="text-lg sm:text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {path.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-4">
                            {path.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-2">
                          <Link
                            to={`/path/${path.id}`}
                            className="flex-1 py-2.5 px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-all"
                          >
                            <span>{isRtl ? 'فتح المسار التعليمي' : 'Continue Path'}</span>
                            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleFavorite(path.id, 'path')}
                            title={isRtl ? 'إزالة من المفضلة' : 'Remove from Favorites'}
                            className="p-2.5 rounded-xl bg-muted hover:bg-rose-500/15 text-muted-foreground hover:text-rose-500 border border-border/70 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SAVED BOOKS */}
            {((favoriteTab === 'all' && savedBooks.length > 0) || favoriteTab === 'book') && (
              <div className="space-y-4">
                {favoriteTab === 'all' && (
                  <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>{isRtl ? 'الكتب المشروحة المحفوظة' : 'Saved Video Books'}</span>
                    <span className="text-xs font-mono text-muted-foreground">({savedBooks.length})</span>
                  </h3>
                )}

                {savedBooks.length === 0 ? (
                  <div className="p-8 text-center bg-card rounded-2xl border border-dashed border-border/70 text-xs text-muted-foreground">
                    {isRtl ? 'لم تقم بحفظ أي كتاب بعد.' : 'No saved books yet.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {savedBooks.map(book => {
                      const localized = getLocalizedBookData(book, isRtl ? 'ar' : 'en');
                      return (
                        <div
                          key={book.id}
                          onClick={() => setSelectedBookForModal(book)}
                          className="group bg-card border border-border/80 hover:border-primary/40 rounded-3xl p-4 flex flex-col justify-between hover:shadow-xl transition-all duration-200 hover:-translate-y-1 cursor-pointer text-start relative"
                        >
                          <div className="absolute top-6 end-6 z-30">
                            <FavoriteButton itemId={book.id} itemType="book" size="sm" />
                          </div>
                          <div>
                            <div className="px-4 pt-1 pb-3">
                              <BookCoverVisual book={book} />
                            </div>
                            <div className="text-[11px] font-semibold text-primary mb-1 truncate">
                              {translateBookCategory(book.category, isRtl)}
                            </div>
                            <h4 className="text-sm sm:text-base font-extrabold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                              {book.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {isRtl ? 'تأليف: ' : 'By '}<span className="font-semibold text-foreground/90">{book.author}</span>
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBookForModal(book);
                              }}
                              className="flex-1 py-2 px-3 rounded-xl bg-foreground text-background hover:bg-primary hover:text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>{isRtl ? 'مشاهدة الشرح' : 'Watch Summary'}</span>
                            </button>
                            {localized.buyUrl && (
                              <a
                                href={localized.buyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#FF9900] to-[#F57C00] text-slate-950 text-xs font-black flex items-center justify-center gap-1 shrink-0"
                              >
                                <AmazonIcon className="w-3.5 h-3.5 text-slate-950" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 6. LIVE SUPPORT TICKETS & HELP DESK SECTION INSIDE USER PROFILE */}
      <section id="user-support-tickets-section" className="pt-4 scroll-mt-24">
        <SupportTickets embedded />
      </section>

      {/* Review Modal */}
      {reviewModalCourseId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl p-6 relative text-start"
          >
            <button 
              onClick={() => setReviewModalCourseId(null)}
              className="absolute top-4 end-4 p-2 hover:bg-muted rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black mb-1 text-foreground">
              {t('review_course', 'Review Course')}
            </h3>
            <p className="text-muted-foreground text-xs mb-5">
              {courses.find(c => c.id === reviewModalCourseId)?.title}
            </p>
            
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className="p-1 hover:scale-115 transition-transform focus:outline-none cursor-pointer"
                >
                  <Star 
                    className={`w-7 h-7 ${star <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground opacity-30'}`} 
                  />
                </button>
              ))}
            </div>
            
            <textarea 
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={isRtl ? 'اكتب رأيك وتقييمك للدورة هنا...' : 'Write your feedback here... (Optional)'}
              className="w-full bg-background border border-border/80 rounded-2xl px-4 py-3 text-xs sm:text-sm min-h-[90px] mb-5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
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
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-xs sm:text-sm hover:bg-primary/90 active:scale-98 transition-all flex items-center justify-center disabled:opacity-70 cursor-pointer shadow-xs"
            >
              {isSubmittingReview ? (isRtl ? 'جاري الإرسال...' : 'Submitting...') : (isRtl ? 'إرسال التقييم' : 'Submit Review')}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
