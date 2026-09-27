import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Brain, CheckCircle2, XCircle, Sparkles, HelpCircle, ArrowRight, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { awardCustomXP, AVAILABLE_BADGES } from '../lib/gamification';
import { cn } from '../lib/utils';

interface QuestQuestion {
  id: number;
  category: string;
  questionEn: string;
  questionAr: string;
  optionsEn: string[];
  optionsAr: string[];
  correctIndex: number;
  explanationEn: string;
  explanationAr: string;
}

const QUEST_BANK: QuestQuestion[] = [
  {
    id: 1,
    category: "Web Security",
    questionEn: "Which HTTP header is primarily used to protect modern web apps against Cross-Site Scripting (XSS)?",
    questionAr: "ما هو ترويسة HTTP (Header) الأساسية المستخدمة لحماية تطبيقات الويب من هجمات XSS؟",
    optionsEn: [
      "Content-Security-Policy (CSP)",
      "Access-Control-Allow-Origin",
      "X-Powered-By",
      "Cache-Control"
    ],
    optionsAr: [
      "Content-Security-Policy (CSP)",
      "Access-Control-Allow-Origin",
      "X-Powered-By",
      "Cache-Control"
    ],
    correctIndex: 0,
    explanationEn: "Content-Security-Policy (CSP) restricts resource loading and prevents malicious script execution.",
    explanationAr: "تقوم ترويسة CSP بتحديد المصادر المصرح بتحميلها وتمنع تشغيل الأكواد البرمجية الخبيثة."
  },
  {
    id: 2,
    category: "JavaScript",
    questionEn: "What is the output of `typeof NaN` in JavaScript?",
    questionAr: "ما هو ناتج استدعاء `typeof NaN` في لغة جافاسكريبت؟",
    optionsEn: ["'number'", "'undefined'", "'NaN'", "'object'"],
    optionsAr: ["'number'", "'undefined'", "'NaN'", "'object'"],
    correctIndex: 0,
    explanationEn: "In JavaScript, NaN (Not a Number) is a special numeric value, so typeof returns 'number'.",
    explanationAr: "في جافاسكريبت، يُصنّف NaN كقيمة رقمية خاصة (numeric value)، ولذلك ناتجه هو 'number'."
  },
  {
    id: 3,
    category: "React",
    questionEn: "Why is using array index as a `key` prop discouraged when rendering dynamic lists in React?",
    questionAr: "لماذا يُنصح بعدم استخدام فهرس المصفوفة (index) كـ `key` عند عرض القوائم الديناميكية في React؟",
    optionsEn: [
      "It causes re-ordering and state bugs during list mutations",
      "React will throw a runtime error",
      "It makes the virtual DOM twice as large",
      "Keys must always be strings, not numbers"
    ],
    optionsAr: [
      "قد يسبب مشاكل في إعادة الترتيب واختلال حالة المكونات عند تعديل القائمة",
      "سيرمي React خطأ أثناء التشغيل",
      "يجعل حجم الـ Virtual DOM مضاعفاً",
      "يجب أن تكون الـ keys نصوصاً فقط دائماً"
    ],
    correctIndex: 0,
    explanationEn: "Using indices can negatively impact performance and cause state mismatch when items are added, removed, or reordered.",
    explanationAr: "استخدام الفهرس يسبب اختلالاً في مطابقة العناصر وحالاتها عند الحذف أو الإضافة أو إعادة الترتيب."
  },
  {
    id: 4,
    category: "Networking & HTTP",
    questionEn: "What is the key difference between HTTP status code 401 and 403?",
    questionAr: "ما الفرق الأساسي بين كود الحالة HTTP 401 وكود 403؟",
    optionsEn: [
      "401 means Unauthorized (Unauthenticated), 403 means Forbidden (Authenticated but lacking permission)",
      "401 is a Server Error, 403 is a Client Error",
      "401 is for GET requests, 403 is for POST requests",
      "There is no difference; they are interchangeable"
    ],
    optionsAr: [
      "401 يعني غير مسجل الدخول (Unauthenticated)، و403 يعني ممنوع الصلاحية (موجود لكن ليس لديه إذن)",
      "401 خطأ خادم، و403 خطأ عميل",
      "401 لطلبات GET و403 لطلبات POST",
      "لا يوجد فرق بينهما"
    ],
    correctIndex: 0,
    explanationEn: "401 indicates lack of valid authentication credentials, while 403 means the server understands the identity but refuses authorization.",
    explanationAr: "يشير 401 إلى غياب بيانات المصادقة، بينما 403 يعني أن الخادم يعرف هويتك لكنك لا تملك صلاحية الوصول لهذا المورد."
  },
  {
    id: 5,
    category: "CSS Architecture",
    questionEn: "Which CSS display property creates a two-dimensional layout system for rows and columns simultaneously?",
    questionAr: "أي من خواص CSS display تنشئ نظام تخطيط ثنائي الأبعاد (صفوف وأعمدة معاً)؟",
    optionsEn: [
      "display: grid",
      "display: flex",
      "display: table",
      "display: inline-block"
    ],
    optionsAr: [
      "display: grid",
      "display: flex",
      "display: table",
      "display: inline-block"
    ],
    correctIndex: 0,
    explanationEn: "CSS Grid is inherently two-dimensional (rows & columns), whereas Flexbox is primarily one-dimensional.",
    explanationAr: "نظام CSS Grid مصمم لتخطيط ثنائي الأبعاد في آن واحد (أعمدة وصفوف)، بينما Flexbox أحادي البعد أساساً."
  },
  {
    id: 6,
    category: "Git & Version Control",
    questionEn: "Which Git command is used to record changes to the repository by creating a new commit on the current branch?",
    questionAr: "أي أمر في Git يُستخدم لحفظ التغييرات في المستودع بإنشاء commit جديد على الفرع الحالي؟",
    optionsEn: [
      "git commit -m 'message'",
      "git push origin main",
      "git branch -c",
      "git stash pop"
    ],
    optionsAr: [
      "git commit -m 'message'",
      "git push origin main",
      "git branch -c",
      "git stash pop"
    ],
    correctIndex: 0,
    explanationEn: "`git commit` captures a snapshot of the currently staged changes in the local repository.",
    explanationAr: "`git commit` يقوم بحفظ لقطة للتغييرات المجهزة في المستودع المحلي."
  },
  {
    id: 7,
    category: "Databases & SQL",
    questionEn: "Which SQL clause is used to filter group results after an aggregate function (e.g. COUNT, SUM)?",
    questionAr: "أي جملة في SQL تُستخدم لفلترة نتائج التجميع بعد استخدام دوال التجميع (مثل COUNT و SUM)؟",
    optionsEn: [
      "HAVING",
      "WHERE",
      "ORDER BY",
      "GROUP BY"
    ],
    optionsAr: [
      "HAVING",
      "WHERE",
      "ORDER BY",
      "GROUP BY"
    ],
    correctIndex: 0,
    explanationEn: "HAVING filters aggregated groups, whereas WHERE filters individual rows before grouping occurs.",
    explanationAr: "تُستخدم HAVING لفلترة المجموعات بعد التجميع، بينما WHERE تفلتر الصفوف الفردية قبل التجميع."
  }
];

export function DailyTechQuest() {
  const { t, i18n } = useTranslation();
  const { user, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const storageKey = `skilliq_daily_quest_${user?.uid || 'guest'}_${todayStr}`;

  // Deterministic daily question based on day of year
  const currentQuestion = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return QUEST_BANK[dayOfYear % QUEST_BANK.length];
  }, []);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.completed) {
          setHasCompletedToday(true);
          setSelectedOption(parsed.selectedOption);
          setIsSubmitted(true);
          setIsCorrect(true);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [storageKey]);

  const handleSubmit = async () => {
    if (selectedOption === null || isSubmitted) return;

    const correct = selectedOption === currentQuestion.correctIndex;
    setIsCorrect(correct);
    setIsSubmitted(true);

    if (correct && user) {
      setHasCompletedToday(true);
      setXpAwarded(true);

      // Save locally
      localStorage.setItem(storageKey, JSON.stringify({
        completed: true,
        selectedOption
      }));

      // Award XP & Daily Scholar badge
      try {
        const updated = await awardCustomXP(user.uid, 25, AVAILABLE_BADGES.DAILY_SCHOLAR);
        if (updated) {
          useStore.setState({ publicProfile: updated });
        }
      } catch (err) {
        console.error("Failed to award quest XP:", err);
      }
    }
  };

  const handleRetry = () => {
    setIsSubmitted(false);
    setSelectedOption(null);
  };

  const questionText = isRtl ? currentQuestion.questionAr : currentQuestion.questionEn;
  const optionsList = isRtl ? currentQuestion.optionsAr : currentQuestion.optionsEn;
  const explanationText = isRtl ? currentQuestion.explanationAr : currentQuestion.explanationEn;

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative overflow-hidden rounded-3xl bg-card border border-border/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow text-start"
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 end-0 -mt-10 -me-10 w-44 h-44 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                {t('daily_challenge', 'Daily Tech Quest')}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/15 text-primary">
                +25 XP
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('daily_challenge_sub', "Solve today's fast challenge to earn bonus XP & keep your brain sharp!")}
            </p>
          </div>
        </div>

        {/* Category tag */}
        <span className="hidden sm:inline-flex text-[11px] font-bold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/50">
          {currentQuestion.category}
        </span>
      </div>

      {/* Question prompt */}
      <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-muted/40 border border-border/60">
        <div className="flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm font-bold text-foreground leading-relaxed">
            {questionText}
          </p>
        </div>
      </div>

      {/* Multiple-Choice Options */}
      <div className="space-y-2 mb-5">
        {optionsList.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          const isThisCorrect = idx === currentQuestion.correctIndex;

          let optionStyle = "bg-muted/30 border-border/60 text-foreground hover:bg-muted/70 hover:border-border";

          if (isSubmitted) {
            if (isThisCorrect) {
              optionStyle = "bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs";
            } else if (isSelected && !isThisCorrect) {
              optionStyle = "bg-rose-500/15 border-rose-500/50 text-rose-700 dark:text-rose-400 font-bold";
            } else {
              optionStyle = "bg-muted/20 border-border/40 text-muted-foreground opacity-60";
            }
          } else if (isSelected) {
            optionStyle = "bg-primary/15 border-primary text-primary font-bold shadow-xs";
          }

          return (
            <button
              key={idx}
              onClick={() => {
                if (!isSubmitted) setSelectedOption(idx);
              }}
              disabled={isSubmitted}
              className={cn(
                "w-full text-start p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm border transition-all flex items-center justify-between gap-3 cursor-pointer",
                optionStyle
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 border",
                  isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border/80"
                )}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="leading-snug">{opt}</span>
              </div>

              {isSubmitted && isThisCorrect && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              {isSubmitted && isSelected && !isThisCorrect && (
                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Result Explanation Card */}
      <AnimatePresence>
        {isSubmitted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className={cn(
              "p-3.5 rounded-2xl border text-xs leading-relaxed",
              isCorrect ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300" : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
            )}>
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {isCorrect ? (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>{t('correct_answer_xp', '+25 XP Earned! Great job!')}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>{t('wrong_answer_retry', 'Not quite! Try again.')}</span>
                  </>
                )}
              </div>
              <p className="opacity-90">{explanationText}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer controls */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
        <span className="text-xs text-muted-foreground font-medium">
          {hasCompletedToday ? (
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'تم حل تحدي اليوم' : 'Completed for today'}</span>
            </span>
          ) : (
            <span>{isRtl ? 'سؤال جديد كل 24 ساعة' : 'Refreshes every 24 hours'}</span>
          )}
        </span>

        {isSubmitted && !isCorrect ? (
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            {isRtl ? 'حاول مجدداً' : 'Try Again'}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null || isSubmitted}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs",
              selectedOption === null || isSubmitted
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-75"
                : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md active:scale-98"
            )}
          >
            <span>{t('submit_answer', 'Submit Answer')}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        )}
      </div>
    </div>
  );
}
