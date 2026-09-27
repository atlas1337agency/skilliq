import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Gift, Check, Clock, Sparkles, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { awardCustomXP, AVAILABLE_BADGES } from '../lib/gamification';
import { cn } from '../lib/utils';

const REWARD_SCHEDULE = [
  { day: 1, xp: 10, label: '+10 XP' },
  { day: 2, xp: 15, label: '+15 XP' },
  { day: 3, xp: 20, label: '+20 XP' },
  { day: 4, xp: 25, label: '+25 XP' },
  { day: 5, xp: 35, label: '+35 XP' },
  { day: 6, xp: 50, label: '+50 XP' },
  { day: 7, xp: 100, label: '+100 XP', isSpecial: true },
];

export function DailyRewardCheckIn() {
  const { t, i18n } = useTranslation();
  const { user, publicProfile, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [hasClaimedToday, setHasClaimedToday] = useState(false);
  const [currentCycleDay, setCurrentCycleDay] = useState(1);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedJustNow, setClaimedJustNow] = useState<number | null>(null);
  const [timeLeftUntilReset, setTimeLeftUntilReset] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const storageKey = `skilliq_daily_checkin_${user?.uid || 'guest'}`;

  // Check claim status and calculate time until midnight
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.lastClaimDate === todayStr) {
          setHasClaimedToday(true);
          setCurrentCycleDay(parsed.cycleDay || 1);
        } else {
          // Check if yesterday was claimed to maintain sequence
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (parsed.lastClaimDate === yesterdayStr) {
            const nextDay = ((parsed.cycleDay || 1) % 7) + 1;
            setCurrentCycleDay(nextDay);
          } else {
            // Missed a day -> reset to Day 1
            setCurrentCycleDay(1);
          }
          setHasClaimedToday(false);
        }
      } else {
        setCurrentCycleDay(1);
        setHasClaimedToday(false);
      }
    } catch (e) {
      setCurrentCycleDay(1);
      setHasClaimedToday(false);
    }

    // Countdown to midnight
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diffMs = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeLeftUntilReset(`${hours}h ${mins}m ${secs}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [todayStr, storageKey]);

  const handleClaim = async () => {
    if (hasClaimedToday || isClaiming || !user) return;
    setIsClaiming(true);

    const reward = REWARD_SCHEDULE[currentCycleDay - 1] || REWARD_SCHEDULE[0];

    try {
      // Award XP & possible badge
      const isDay7 = currentCycleDay === 7;
      const badgeToAward = isDay7 ? AVAILABLE_BADGES.STREAK_MASTER : undefined;

      const updated = await awardCustomXP(user.uid, reward.xp, badgeToAward);
      if (updated) {
        useStore.setState({ publicProfile: updated });
      }

      // Save claim status locally
      localStorage.setItem(storageKey, JSON.stringify({
        lastClaimDate: todayStr,
        cycleDay: currentCycleDay,
      }));

      setClaimedJustNow(reward.xp);
      setHasClaimedToday(true);

      setTimeout(() => {
        setClaimedJustNow(null);
      }, 4000);
    } catch (err) {
      console.error("Failed to claim daily reward:", err);
    } finally {
      setIsClaiming(false);
    }
  };

  const streakCount = publicProfile?.streak || 1;

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative overflow-hidden rounded-3xl bg-card border border-border/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 end-0 -mt-10 -me-10 w-44 h-44 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
              {t('daily_checkin', 'Daily Reward Chest')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('daily_streak_quote', 'Consistency beats intensity. Keep your streak alive!')}
            </p>
          </div>
        </div>

        {/* Current streak badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 font-bold text-xs shrink-0 self-start sm:self-auto">
          <Flame className="w-4 h-4 fill-orange-500" />
          <span>{streakCount} {isRtl ? 'أيام متتالية' : 'Days Streak'}</span>
        </div>
      </div>

      {/* 7-Day Reward Track */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-5">
        {REWARD_SCHEDULE.map((item) => {
          const isDone = item.day < currentCycleDay || (item.day === currentCycleDay && hasClaimedToday);
          const isCurrent = item.day === currentCycleDay && !hasClaimedToday;
          const isUpcoming = item.day > currentCycleDay;

          return (
            <div
              key={item.day}
              className={cn(
                "flex flex-col items-center justify-between p-2 sm:p-2.5 rounded-2xl border text-center transition-all duration-200 relative",
                isDone && "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
                isCurrent && "bg-amber-500/10 border-amber-500/50 shadow-xs scale-102 ring-2 ring-amber-500/20",
                isUpcoming && "bg-muted/40 border-border/50 text-muted-foreground opacity-75",
                item.isSpecial && "border-purple-500/40 bg-purple-500/5"
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {isRtl ? `يوم ${item.day}` : `D${item.day}`}
              </span>

              <div className="my-1.5 flex items-center justify-center">
                {isDone ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : item.isSpecial ? (
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center animate-pulse">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <Sparkles className={cn("w-3.5 h-3.5", isCurrent ? "text-amber-500" : "text-muted-foreground")} />
                  </div>
                )}
              </div>

              <span className={cn(
                "text-[10px] sm:text-xs font-black",
                isDone ? "text-emerald-600 dark:text-emerald-400" : isCurrent ? "text-amber-500 font-extrabold" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action Row & Celebration Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>
            {hasClaimedToday 
              ? `${t('next_reward_in', 'Next reward in')}: ${timeLeftUntilReset}`
              : t('day_streak_multiplier', { day: currentCycleDay, defaultValue: `Day ${currentCycleDay} of 7 Streak` })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {claimedJustNow && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs font-bold text-emerald-500 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+{claimedJustNow} XP!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleClaim}
            disabled={hasClaimedToday || isClaiming}
            className={cn(
              "w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs",
              hasClaimedToday
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-80"
                : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md active:scale-98"
            )}
          >
            {hasClaimedToday ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{t('daily_claimed', 'Claimed Today!')}</span>
              </>
            ) : (
              <>
                <Gift className="w-4 h-4" />
                <span>{t('claim_daily_xp', "Claim Today's XP")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
