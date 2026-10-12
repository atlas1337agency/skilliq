import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  X, 
  Target, 
  Flame, 
  Timer, 
  Sparkles, 
  BookOpen, 
  Clock, 
  ArrowRight, 
  Zap, 
  Check, 
  AlertCircle
} from 'lucide-react';

interface DailyGoalExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyGoalType: 'lessons' | 'minutes';
  dailyGoalTarget: number;
  currentAchieved: number;
  isGoalMet: boolean;
  selectedCourseTitle?: string | null;
  midnightCountdown: string;
}

export const DailyGoalExplainerModal: React.FC<DailyGoalExplainerModalProps> = ({
  isOpen,
  onClose,
  dailyGoalType,
  dailyGoalTarget,
  currentAchieved,
  isGoalMet,
  selectedCourseTitle,
  midnightCountdown
}) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  if (!isOpen) return null;

  const remaining = Math.max(0, dailyGoalTarget - currentAchieved);
  const unitLabel = dailyGoalType === 'lessons' 
    ? (isRtl ? 'دروس / فيديوهات' : 'videos') 
    : (isRtl ? 'دقيقة تركيز' : 'focus minutes');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          className="relative w-full max-w-2xl bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden z-10 text-start"
        >
          {/* Top Decorative Header */}
          <div className="relative p-6 sm:p-7 bg-linear-to-br from-emerald-500/15 via-primary/10 to-transparent border-b border-border/60">
            <button
              onClick={onClose}
              className="absolute top-5 end-5 p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'دليل العلامة الخضراء والوتيرة الأسبوعية' : 'Green Checkmark Guide'}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-foreground">
                  {isRtl ? 'كيف تحصل على العلامة الخضراء (✅) وتكسب XP؟' : 'How to Get the Green Checkmark (✅) & XP'}
                </h2>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Live Today's Status Banner */}
            <div className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
              isGoalMet 
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/50 text-rose-600 dark:text-rose-400'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${
                  isGoalMet ? 'bg-emerald-500 shadow-md shadow-emerald-500/30' : 'bg-rose-500 shadow-md shadow-rose-500/30'
                }`}>
                  {isGoalMet ? <Check className="w-5 h-5 stroke-[3]" /> : <AlertCircle className="w-5 h-5 stroke-[2.5]" />}
                </div>
                <div>
                  <div className="font-black text-sm">
                    {isGoalMet 
                      ? (isRtl ? '🎉 هدف اليوم مكتمل! العلامة الخضراء مفعلة' : '🎉 Goal Met Today! Green Checkmark Active') 
                      : (isRtl ? '⏳ هدف اليوم قيد الإنجاز (العلامة حمراء مؤقتاً)' : '⏳ Goal In Progress (Temporarily Red)')}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {isGoalMet 
                      ? (isRtl ? `أنجزت ${currentAchieved} من ${dailyGoalTarget} ${unitLabel} وتم حماية خطك اليومي بنجاح.` : `Completed ${currentAchieved}/${dailyGoalTarget} ${unitLabel}. Your streak is safe!`)
                      : (isRtl ? `أنجزت ${currentAchieved} من أصل ${dailyGoalTarget} ${unitLabel}. متبقي ${remaining} لإشعال العلامة الخضراء!` : `You have ${currentAchieved} of ${dailyGoalTarget} ${unitLabel}. Complete ${remaining} more before midnight to turn green!`)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono text-[11px] bg-background/80 px-3 py-1.5 rounded-xl border border-border/60">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{isRtl ? 'متبقي حتى منتصف الليل:' : 'Closes in:'}</span>
                <span className="font-bold text-foreground">{midnightCountdown}</span>
              </div>
            </div>

            {/* 3 Steps: Step-by-Step Instructions */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {isRtl ? 'خطوات الحصول على العلامة الخضراء اليوم:' : '3 Simple Steps to Turn Today Green:'}
              </h3>

              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? 'حدد هدف اليوم والدورة المستهدفة' : 'Pick Your Daily Target & Course'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isRtl 
                      ? 'اختر بين عدد الفيديوهات (مثلاً 2 فيديو) أو دقائق التركيز (مثلاً 30 دقيقة). يمكنك أيضاً تحديد دورة أو قائمة تشغيل معينة لتسهيل المتابعة.' 
                      : 'Choose between videos (e.g. 2 videos from your playlist) or focus minutes (e.g. 30 mins). You can pick a specific course to target today!'}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? 'أنجز الفيديوهات أو شغل مساعد التركيز' : 'Watch Videos or Run Focus Companion'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isRtl 
                      ? 'شاهد دروس دورتك المختارة، أو اضغط على "إكمال درس (+15 XP)" لتسجيله فوراً. أو شغّل "مساعد التركيز الذكي" وستُحسب دقائقه مباشرة لهدف اليوم.' 
                      : 'Watch lessons from your playlist, or click "Complete Video (+15 XP)" to log progress instantly. Or run the "Smart Focus Companion" to automatically accumulate focus minutes.'}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>{isRtl ? 'العلامة الخضراء الفورية + مكافأة XP (+30 XP)!' : 'Instant Green Checkmark + Bonus XP (+30 XP)!'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isRtl 
                      ? 'بمجرد أن تصل إلى العدد المطلوب (مثلاً فيديوهين أو 30 دقيقة)، يتحول مربع اليوم فوراً إلى علامة خضراء ✅ مع مكافأة +30 XP وحماية خطك اليومي من الانقطاع!' 
                      : 'As soon as your daily target is achieved, today instantly turns into a vibrant Green Checkmark ✅, granting +30 Bonus XP and safeguarding your learning streak!'}
                  </p>
                </div>
              </div>
            </div>

            {/* Color Code Legend */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>{isRtl ? 'دليل رموز شريط الأيام السبعة (7-Day Velocity):' : '7-Day Velocity Legend:'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-card border border-emerald-500/30">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="font-black text-emerald-600 dark:text-emerald-400">{isRtl ? 'أخضر (مكتمل)' : 'Green (Met)'}</div>
                    <div className="text-[10px] text-muted-foreground">{isRtl ? 'تم تحقيق الهدف بنجاح' : 'Target reached!'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-card border border-rose-500/30">
                  <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="font-black text-rose-600 dark:text-rose-400">{isRtl ? 'أحمر (قيد الإنجاز / فائت)' : 'Red (Missed/Pending)'}</div>
                    <div className="text-[10px] text-muted-foreground">{isRtl ? 'أكمل الهدف لقلبه أخضر' : 'Finish today to flip green'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/60">
                  <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs shrink-0">
                    ·
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{isRtl ? 'رمادي (قادم)' : 'Gray (Upcoming)'}</div>
                    <div className="text-[10px] text-muted-foreground">{isRtl ? 'أيام قادمة في الأسبوع' : 'Upcoming week days'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 bg-muted/20 border-t border-border/60 flex items-center justify-between gap-3">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>{isRtl ? 'المثابرة اليومية هي مفتاح إتقان المهارات!' : 'Daily consistency builds true mastery!'}</span>
            </div>

            <button
              onClick={onClose}
              className="py-2.5 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>{isRtl ? 'فهمت، لنبدأ التعلم!' : 'Got it, let’s study!'}</span>
              <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
