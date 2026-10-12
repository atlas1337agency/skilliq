import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Trophy, Lock, CheckCircle, Sparkles, Star, Zap, Flame, Clock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { AVAILABLE_BADGES, awardCustomXP } from '../lib/gamification';
import { cn } from '../lib/utils';

export function AchievementsShowcase() {
  const { t, i18n } = useTranslation();
  const { publicProfile, language, user, progress, courses, allCourses } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);

  // Derive real-time learner statistics
  const userBadges = useMemo(() => {
    return publicProfile?.badges || [];
  }, [publicProfile]);

  const allAvailableBadges = useMemo(() => {
    return Object.values(AVAILABLE_BADGES);
  }, []);

  const totalCompletedCourses = useMemo(() => {
    return Object.values(progress || {}).filter(p => p.isCompleted).length;
  }, [progress]);

  const totalWatchedVideos = useMemo(() => {
    let count = 0;
    Object.values(progress || {}).forEach(p => {
      count += (p.completedVideoIds?.length || 0);
    });
    return count;
  }, [progress]);

  const streakDays = publicProfile?.streak || 1;

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayFocusMinutes = useMemo(() => {
    try {
      return Number(localStorage.getItem(`skilliq_focus_mins_${todayStr}`)) || 0;
    } catch {
      return 0;
    }
  }, [todayStr]);

  // SMART AUTO-UNLOCK: If user criteria are met locally/realtime, auto-award the badge
  useEffect(() => {
    if (!user?.uid) return;
    const existingIds = new Set(userBadges.map(b => b.id));

    // 1. First Step: at least 1 video watched
    if (totalWatchedVideos >= 1 && !existingIds.has('first_step')) {
      awardCustomXP(user.uid, 10, AVAILABLE_BADGES.FIRST_STEP).then((res) => {
        if (res) useStore.setState({ publicProfile: res });
      });
    }

    // 2. Course Conqueror: at least 1 course completed
    if (totalCompletedCourses >= 1 && !existingIds.has('course_conqueror')) {
      awardCustomXP(user.uid, 50, AVAILABLE_BADGES.COURSE_CONQUEROR).then((res) => {
        if (res) useStore.setState({ publicProfile: res });
      });
    }

    // 3. Certified Specialist: at least 1 certified course completed
    if (totalCompletedCourses >= 1 && !existingIds.has('certificate_pro')) {
      awardCustomXP(user.uid, 75, AVAILABLE_BADGES.CERTIFICATE_PRO).then((res) => {
        if (res) useStore.setState({ publicProfile: res });
      });
    }

    // 4. Focus Master: 60+ minutes focus today
    if (todayFocusMinutes >= 60 && !existingIds.has('focus_warrior')) {
      awardCustomXP(user.uid, 30, AVAILABLE_BADGES.FOCUS_WARRIOR).then((res) => {
        if (res) useStore.setState({ publicProfile: res });
      });
    }

    // 5. 7-Day Streak
    if (streakDays >= 7 && !existingIds.has('streak_7')) {
      awardCustomXP(user.uid, 50, AVAILABLE_BADGES.STREAK_7).then((res) => {
        if (res) useStore.setState({ publicProfile: res });
      });
    }

    // 6. Streak Master (30 days)
    if (streakDays >= 30 && !existingIds.has('streak_master')) {
      awardCustomXP(user.uid, 150, AVAILABLE_BADGES.STREAK_MASTER).then((res) => {
        if (res) useStore.setState({ publicProfile: res });
      });
    }
  }, [user?.uid, totalWatchedVideos, totalCompletedCourses, todayFocusMinutes, streakDays, userBadges]);

  const badgeStatusList = useMemo(() => {
    return allAvailableBadges.map(badgeDef => {
      const earned = userBadges.find(b => b.id === badgeDef.id);
      
      // Calculate smart requirement completion percentage
      let progressPercent = 0;
      let progressText = '';

      if (badgeDef.id === 'first_step') {
        progressPercent = Math.min(100, Math.round((totalWatchedVideos / 1) * 100));
        progressText = `${Math.min(1, totalWatchedVideos)} / 1 ${isRtl ? 'درس' : 'lesson'}`;
      } else if (badgeDef.id === 'focus_warrior') {
        progressPercent = Math.min(100, Math.round((todayFocusMinutes / 60) * 100));
        progressText = `${Math.min(60, todayFocusMinutes)} / 60 ${isRtl ? 'دقيقة' : 'mins'}`;
      } else if (badgeDef.id === 'course_conqueror' || badgeDef.id === 'certificate_pro') {
        progressPercent = Math.min(100, Math.round((totalCompletedCourses / 1) * 100));
        progressText = `${Math.min(1, totalCompletedCourses)} / 1 ${isRtl ? 'مقرر' : 'course'}`;
      } else if (badgeDef.id === 'streak_7') {
        progressPercent = Math.min(100, Math.round((streakDays / 7) * 100));
        progressText = `${Math.min(7, streakDays)} / 7 ${isRtl ? 'أيام' : 'days'}`;
      } else if (badgeDef.id === 'streak_master') {
        progressPercent = Math.min(100, Math.round((streakDays / 30) * 100));
        progressText = `${Math.min(30, streakDays)} / 30 ${isRtl ? 'أيام' : 'days'}`;
      } else if (badgeDef.id === 'daily_scholar') {
        const questDone = (() => {
          try {
            const key = `skilliq_daily_quest_${todayStr}_${user?.uid || 'guest'}`;
            return JSON.parse(localStorage.getItem(key) || '{}')?.completed === true;
          } catch {
            return false;
          }
        })();
        progressPercent = questDone ? 100 : 0;
        progressText = questDone ? (isRtl ? 'مكتمل' : 'Done') : (isRtl ? 'تحدي اليوم' : 'Daily quest');
      } else {
        progressPercent = earned ? 100 : 25;
        progressText = earned ? (isRtl ? 'مكتمل' : 'Done') : (isRtl ? 'قيد الإنجاز' : 'In progress');
      }

      return {
        ...badgeDef,
        isUnlocked: Boolean(earned),
        unlockedAt: earned?.unlockedAt,
        progressPercent,
        progressText,
      };
    });
  }, [allAvailableBadges, userBadges, totalWatchedVideos, totalCompletedCourses, todayFocusMinutes, streakDays, todayStr, user?.uid, isRtl]);

  const filteredBadges = useMemo(() => {
    if (activeTab === 'unlocked') {
      return badgeStatusList.filter(b => b.isUnlocked);
    }
    if (activeTab === 'locked') {
      return badgeStatusList.filter(b => !b.isUnlocked);
    }
    return badgeStatusList;
  }, [badgeStatusList, activeTab]);

  const xp = publicProfile?.xp || 0;
  const level = Math.floor(xp / 100) + 1;
  const currentLevelProgress = xp % 100;
  const xpNeeded = 100 - currentLevelProgress;

  const unlockedCount = badgeStatusList.filter(b => b.isUnlocked).length;
  const overallBadgePercent = Math.round((unlockedCount / Math.max(1, allAvailableBadges.length)) * 100);

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'}
      className="rounded-3xl bg-card border border-border/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow text-start space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0 shadow-2xs">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight flex items-center gap-2">
              <span>{t('badges_unlocked', 'Badges & Achievements')}</span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                {unlockedCount} / {allAvailableBadges.length} ({overallBadgePercent}%)
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRtl ? 'نظام ذكي متصل بتقدمك في الدورات، دقائق التركيز، وسلسلة الأيام.' : 'Smart achievement system synced in realtime with courses, focus sessions, and daily streaks.'}
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border/60 self-start sm:self-auto shrink-0">
          {[
            { id: 'all', label: t('all', 'All'), count: allAvailableBadges.length },
            { id: 'unlocked', label: isRtl ? 'المكتسبة' : 'Unlocked', count: unlockedCount },
            { id: 'locked', label: isRtl ? 'المتبقية' : 'Locked', count: allAvailableBadges.length - unlockedCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-muted">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Smart Level XP Progress Bar & Live Stats Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-8 p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-foreground">
                {t('current_level', 'Level')} {level}
              </span>
              <span className="text-muted-foreground font-mono">
                ({xp.toLocaleString()} XP)
              </span>
            </div>
            <span className="text-muted-foreground font-semibold text-[11px]">
              {xpNeeded} XP {isRtl ? `للمستوى ${level + 1}` : `to Level ${level + 1}`}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary via-purple-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${currentLevelProgress}%` }}
            />
          </div>
        </div>

        <div className="md:col-span-4 grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 text-center">
            <div className="text-[10px] text-muted-foreground font-bold uppercase">{isRtl ? 'الدروس' : 'Lessons'}</div>
            <div className="text-sm font-extrabold font-mono text-foreground">{totalWatchedVideos}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 text-center">
            <div className="text-[10px] text-muted-foreground font-bold uppercase">{isRtl ? 'المقررات' : 'Courses'}</div>
            <div className="text-sm font-extrabold font-mono text-foreground">{totalCompletedCourses}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 text-center">
            <div className="text-[10px] text-muted-foreground font-bold uppercase">{isRtl ? 'السلسلة' : 'Streak'}</div>
            <div className="text-sm font-extrabold font-mono text-orange-500 flex items-center justify-center gap-0.5">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{streakDays}d</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Grid - Very Smart with progress meters, unlock status & interactive detail */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
        <AnimatePresence mode="popLayout">
          {filteredBadges.map((badge, idx) => (
            <motion.div
              layout
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, delay: idx * 0.02 }}
              onClick={() => setSelectedBadge(badge)}
              className={cn(
                "p-3.5 rounded-2xl border flex flex-col items-center text-center transition-all relative overflow-hidden group cursor-pointer justify-between",
                badge.isUnlocked
                  ? "bg-gradient-to-b from-card via-card to-purple-500/5 border-border/80 hover:border-purple-500/50 hover:shadow-md"
                  : "bg-muted/15 border-border/40 opacity-75 hover:opacity-100 hover:border-border/80"
              )}
            >
              {/* Unlocked checkmark pill vs locked padlock */}
              {badge.isUnlocked ? (
                <div className="absolute top-2.5 end-2.5 w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <div className="absolute top-2.5 end-2.5 text-muted-foreground/60">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}

              {/* Badge Icon with smart glow */}
              <div className="w-full flex flex-col items-center">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2.5 shadow-xs transition-transform group-hover:scale-110",
                  badge.isUnlocked ? "bg-purple-500/10 ring-2 ring-purple-500/20" : "bg-muted grayscale"
                )}>
                  {badge.icon}
                </div>

                {/* Badge Name */}
                <h4 className="text-xs font-bold text-foreground mb-1 line-clamp-1 leading-snug group-hover:text-primary transition-colors">
                  {badge.name}
                </h4>

                {/* Description */}
                <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                  {badge.description}
                </p>
              </div>

              {/* Smart Dynamic Progress Meter */}
              <div className="w-full pt-3 mt-2 border-t border-border/50 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                  <span>{badge.isUnlocked ? (isRtl ? 'تم الفوز بها' : 'Earned') : badge.progressText}</span>
                  <span className="font-bold">{badge.isUnlocked ? '100%' : `${badge.progressPercent}%`}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      badge.isUnlocked ? "bg-emerald-500" : "bg-primary"
                    )}
                    style={{ width: `${badge.isUnlocked ? 100 : badge.progressPercent}%` }}
                  />
                </div>

                {badge.isUnlocked && badge.unlockedAt && (
                  <span className="text-[9px] text-muted-foreground/70 block font-mono">
                    {badge.unlockedAt.split('T')[0]}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div 
          onClick={() => setSelectedBadge(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card w-full max-w-sm rounded-3xl border border-border/80 shadow-2xl p-6 text-center space-y-4 relative"
          >
            <div className={cn(
              "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-4xl shadow-md",
              selectedBadge.isUnlocked ? "bg-purple-500/15 ring-2 ring-purple-500/30" : "bg-muted"
            )}>
              {selectedBadge.icon}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-foreground">
                {selectedBadge.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {selectedBadge.description}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{isRtl ? 'الحالة:' : 'Status:'}</span>
                <span className={cn("font-bold flex items-center gap-1", selectedBadge.isUnlocked ? "text-emerald-500" : "text-amber-500")}>
                  {selectedBadge.isUnlocked ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{isRtl ? 'مكتسبة وجاهزة' : 'Unlocked & Active'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'مغلقة حالياً' : 'Locked'}</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{isRtl ? 'التقدم نحو الوسام:' : 'Progress:'}</span>
                <span className="font-mono font-bold text-foreground">
                  {selectedBadge.isUnlocked ? '100%' : `${selectedBadge.progressPercent}% (${selectedBadge.progressText})`}
                </span>
              </div>

              {selectedBadge.unlockedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{isRtl ? 'تاريخ الاكتساب:' : 'Unlocked on:'}</span>
                  <span className="font-mono text-muted-foreground">
                    {new Date(selectedBadge.unlockedAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
            >
              {isRtl ? 'إغلاق' : 'Close'}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
