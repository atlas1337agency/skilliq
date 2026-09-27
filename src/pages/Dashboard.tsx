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
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { ScrollingText } from '../components/ScrollingText';
import { DailyRewardCheckIn } from '../components/DailyRewardCheckIn';
import { DailyTechQuest } from '../components/DailyTechQuest';
import { AchievementsShowcase } from '../components/AchievementsShowcase';
import { cn } from '../lib/utils';

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const { progress, userName, user, courses, publicProfile, language, setIsAuthModalOpen } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  // Review modal states
  const [reviewModalCourseId, setReviewModalCourseId] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [submittedReviews, setSubmittedReviews] = useState<Record<string, boolean>>({});

  // Course filter tab
  const [courseFilter, setCourseFilter] = useState<'all' | 'in_progress' | 'completed'>('all');

  if (!user) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full px-4 md:px-8 py-20 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black mb-2 text-foreground">{t('login_to_start', 'Please Log In')}</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {isRtl 
            ? 'سجل دخولك لمتابعة تقدمك التعليمي، كسب النقاط اليومية، وفتح الأوسمة والشهادات.' 
            : 'You need to be logged in to view your dashboard, daily rewards, and track your course progress.'}
        </p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl shadow-sm hover:bg-primary/90 transition-all cursor-pointer text-sm"
        >
          {t('login', 'Log In to Continue')}
        </button>
      </div>
    );
  }

  // Calculate user courses
  const startedCourses = courses.filter(c => progress[c.id]);
  const completedCourses = startedCourses.filter(c => progress[c.id]?.isCompleted);
  const inProgressCourses = startedCourses.filter(c => !progress[c.id]?.isCompleted);

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
            </div>
          </div>

          {/* Right: Metric Badges Pill Array */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            
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

            {/* Certificates */}
            <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col items-center text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                <Award className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t('certificates', 'Certificates')}</span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-emerald-500">
                {completedCourses.length}
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
                            <Link 
                              to={`/certificate/${course.id}`}
                              className="col-span-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer"
                            >
                              <Award className="w-4 h-4" />
                              <span>{t('view_certificate', 'View Certificate')}</span>
                            </Link>

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
