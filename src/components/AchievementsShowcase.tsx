import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Trophy, Lock, CheckCircle, Sparkles, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { AVAILABLE_BADGES, Badge } from '../lib/gamification';
import { cn } from '../lib/utils';

export function AchievementsShowcase() {
  const { t, i18n } = useTranslation();
  const { publicProfile, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'locked'>('all');

  const userBadges = useMemo(() => {
    return publicProfile?.badges || [];
  }, [publicProfile]);

  const allAvailableBadges = useMemo(() => {
    return Object.values(AVAILABLE_BADGES);
  }, []);

  const badgeStatusList = useMemo(() => {
    return allAvailableBadges.map(badgeDef => {
      const earned = userBadges.find(b => b.id === badgeDef.id);
      return {
        ...badgeDef,
        isUnlocked: Boolean(earned),
        unlockedAt: earned?.unlockedAt,
      };
    });
  }, [allAvailableBadges, userBadges]);

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

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'}
      className="rounded-3xl bg-card border border-border/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow text-start"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <span>{t('badges_unlocked', 'Badges & Achievements')}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                {unlockedCount} / {allAvailableBadges.length}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              {isRtl ? 'أوسمة وجوائز تفاعلية تضاف تلقائياً مع تقدمك اليومي' : 'Earn milestone badges as you complete courses and maintain streaks.'}
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border/60 self-start sm:self-auto">
          {[
            { id: 'all', label: t('all', 'All') },
            { id: 'unlocked', label: isRtl ? 'المكتسبة' : 'Unlocked' },
            { id: 'locked', label: isRtl ? 'المتبقية' : 'Locked' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Level XP Progress Bar */}
      <div className="mb-6 p-4 rounded-2xl bg-muted/30 border border-border/60">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">
              {t('current_level', 'Level')} {level}
            </span>
            <span className="text-muted-foreground font-mono">
              ({xp.toLocaleString()} XP)
            </span>
          </div>
          <span className="text-muted-foreground font-semibold">
            {xpNeeded} XP {isRtl ? `للمستوى ${level + 1}` : `to Level ${level + 1}`}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary to-purple-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${currentLevelProgress}%` }}
          />
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <AnimatePresence mode="popLayout">
          {filteredBadges.map((badge, idx) => (
            <motion.div
              layout
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className={cn(
                "p-3.5 rounded-2xl border flex flex-col items-center text-center transition-all relative overflow-hidden group",
                badge.isUnlocked
                  ? "bg-card border-border/80 hover:border-purple-500/40 hover:shadow-md"
                  : "bg-muted/20 border-border/40 opacity-70 grayscale hover:grayscale-0 hover:opacity-100"
              )}
            >
              {/* Unlocked checkmark pill */}
              {badge.isUnlocked ? (
                <div className="absolute top-2 end-2 text-emerald-500">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="absolute top-2 end-2 text-muted-foreground opacity-50">
                  <Lock className="w-3 h-3" />
                </div>
              )}

              {/* Badge Icon */}
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2.5 shadow-xs transition-transform group-hover:scale-110",
                badge.isUnlocked ? "bg-purple-500/10" : "bg-muted"
              )}>
                {badge.icon}
              </div>

              {/* Badge Name */}
              <h4 className="text-xs font-bold text-foreground mb-1 line-clamp-1 leading-snug">
                {badge.name}
              </h4>

              {/* Description */}
              <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                {badge.description}
              </p>

              {badge.isUnlocked && badge.unlockedAt && (
                <span className="text-[9px] text-muted-foreground/80 mt-2 font-mono">
                  {badge.unlockedAt.split('T')[0]}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
