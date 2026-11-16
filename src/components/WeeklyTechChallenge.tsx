import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Shield,
  Clock,
  Sparkles,
  Terminal,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Send,
  Award,
  Flame,
  ArrowRight,
  Code2
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { awardCustomXP } from '../lib/gamification';
import { cn } from '../lib/utils';

interface ChallengeData {
  id: string;
  weekNumber: number;
  year: number;
  category: 'Cybersecurity' | 'Web Development' | 'Linux & DevOps';
  title: string;
  titleAr: string;
  badgeName: string;
  badgeIcon: string;
  xpReward: number;
  scenario: string;
  scenarioAr: string;
  codeSnippet?: string;
  hints: { hint: string; hintAr: string }[];
  acceptedAnswers: string[];
}

const WEEKLY_CHALLENGES: ChallengeData[] = [
  {
    id: 'week_challenge_ctf_base64',
    weekNumber: 44,
    year: 2026,
    category: 'Cybersecurity',
    title: 'CTF Challenge: Suspicious Base64 Payload Extraction',
    titleAr: 'تحدي الأمن السيبراني: فك تشفير حمولة Base64 المشبوهة',
    badgeName: 'CTF Security Champion',
    badgeIcon: '🛡️',
    xpReward: 150,
    scenario: 'During a security audit, your SOC detected an encoded payload string in an incoming HTTP header: "c2tpbGxpcS1zZWN1cml0eS1jaGFtcGlvbi0xMzM3". Decode the raw secret key to mitigate the attack.',
    scenarioAr: 'أثناء فحص أمني لمركز العمليات السيبرانية (SOC)، تم اعتراض حمولة مشفرة داخل ترويسة HTTP قادمة: "c2tpbGxpcS1zZWN1cml0eS1jaGFtcGlvbi0xMzM3". فك تشفير المفتاح السري لإبطال التهديد.',
    codeSnippet: 'X-Authorization-Token: c2tpbGxpcS1zZWN1cml0eS1jaGFtcGlvbi0xMzM3',
    hints: [
      {
        hint: 'Base64 uses 64 ASCII characters. You can decode it in browser console using atob("...") or Linux terminal using echo "..." | base64 -d',
        hintAr: 'تشفير Base64 يمكن فكه في المتصفح عبر atob("...") أو موجه أوامر لينكس عبر echo "..." | base64 -d'
      },
      {
        hint: 'The decoded string starts with "skilliq-" and ends with "-1337".',
        hintAr: 'النص المفكوك يبدأ بـ "skilliq-" وينتهي بـ "-1337".'
      }
    ],
    acceptedAnswers: ['skilliq-security-champion-1337']
  },
  {
    id: 'week_challenge_flex_space',
    weekNumber: 45,
    year: 2026,
    category: 'Web Development',
    title: 'CSS Architecture: The Equal Spacing Layout Mystery',
    titleAr: 'هندسة الواجهات: لغز توزيع المساحات المتساوية في Flexbox',
    badgeName: 'CSS Layout Master',
    badgeIcon: '🎨',
    xpReward: 150,
    scenario: 'In CSS Flexbox, what single property-value pair distributes child items with equal spacing between them along the main axis?',
    scenarioAr: 'في CSS Flexbox، ما هي الخاصية وقيمتها التي تقوم بتوزيع العناصر بمساحات متساوية تماماً بينها على طول المحور الرئيسي؟',
    codeSnippet: '.navbar { display: flex; /* ???: ???; */ }',
    hints: [
      {
        hint: 'The property starts with "justify-" and the value has two words joined by a dash.',
        hintAr: 'الخاصية تبدأ بـ "justify-" والقيمة تتكون من كلمتين بينهما شرطة.'
      }
    ],
    acceptedAnswers: ['justify-content: space-between', 'space-between', 'justify-content:space-between']
  }
];

export function WeeklyTechChallenge() {
  const { user, publicProfile, language, setIsAuthModalOpen } = useStore();
  const isRtl = language === 'ar';

  // Calculate current week challenge
  const activeChallenge = useMemo(() => {
    return WEEKLY_CHALLENGES[0];
  }, []);

  const storageKey = `skilliq_weekly_done_${activeChallenge.id}_${user?.uid || 'guest'}`;

  const [isCompleted, setIsCompleted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  });

  const [answerInput, setAnswerInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeftStr, setTimeLeftStr] = useState('');

  // Weekly countdown to Sunday 23:59:59
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 is Sunday
      const daysUntilSunday = currentDay === 0 ? 0 : 7 - currentDay;

      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + daysUntilSunday);
      endOfWeek.setHours(23, 59, 59, 999);

      const diff = endOfWeek.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeftStr(isRtl ? 'ينتهي قريباً' : 'Ending soon');
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);

      setTimeLeftStr(isRtl ? `${d} أيام و ${h} س` : `${d}d ${h}h ${m}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [isRtl]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const cleanInput = answerInput.trim().toLowerCase();
    const isCorrect = activeChallenge.acceptedAnswers.some(ans => ans.toLowerCase() === cleanInput);

    if (!isCorrect) {
      setErrorMsg(isRtl ? 'الإجابة غير صحيحة، حاول مجدداً أو راجع التلميحات!' : 'Incorrect answer! Check the hints and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Confetti celebratory explosion
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Award XP + Unlock Exclusive Badge
      if (user.uid) {
        await awardCustomXP(user.uid, activeChallenge.xpReward, {
          id: `weekly_badge_${activeChallenge.id}`,
          name: activeChallenge.badgeName,
          description: `Solved ${activeChallenge.title}`,
          icon: activeChallenge.badgeIcon
        });
      }

      localStorage.setItem(storageKey, 'true');
      setIsCompleted(true);
      setAnswerInput('');
    } catch (err) {
      console.error('Failed to submit challenge:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleHint = (idx: number) => {
    setRevealedHints(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 text-start relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 end-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER STRIP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-foreground">
                {isRtl ? 'تحدي الأسبوع التقني' : 'Weekly Tech Challenge'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-wider">
                WEEK {activeChallenge.weekNumber}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRtl
                ? 'حل التحدي الأسبوعي للفوز بشارة حصرية و +150 نقطة خبرة XP!'
                : 'Solve this week\'s puzzle to win an exclusive badge & +150 XP!'}
            </p>
          </div>
        </div>

        {/* Timer Countdown Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/60 text-xs font-mono font-bold text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>{isRtl ? 'ينتهي خلال:' : 'Ends in:'} {timeLeftStr}</span>
          </div>
        </div>
      </div>

      {/* CHALLENGE BODY */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm sm:text-base font-bold text-foreground">
            {isRtl ? activeChallenge.titleAr : activeChallenge.title}
          </h4>
          <span className="px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-black">
            +{activeChallenge.xpReward} XP
          </span>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {isRtl ? activeChallenge.scenarioAr : activeChallenge.scenario}
        </p>

        {/* Code / Command Snippet Box */}
        {activeChallenge.codeSnippet && (
          <div className="bg-muted/40 rounded-2xl border border-border/60 p-3.5 font-mono text-xs text-foreground flex items-center justify-between gap-3 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-0">
              <Terminal className="w-4 h-4 text-primary shrink-0" />
              <code className="select-all font-bold">{activeChallenge.codeSnippet}</code>
            </div>
          </div>
        )}

        {/* HINTS ACCORDION */}
        <div className="space-y-2">
          {activeChallenge.hints.map((hintObj, idx) => {
            const isRevealed = revealedHints.includes(idx);
            return (
              <div key={idx} className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => toggleHint(idx)}
                  className="w-full p-2.5 flex items-center justify-between text-start text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isRtl ? `تلميح ${idx + 1}` : `Hint ${idx + 1}`}</span>
                  </span>
                  <span className="text-[10px] font-bold text-primary">
                    {isRevealed ? (isRtl ? 'إخفاء' : 'Hide') : (isRtl ? 'إظهار التلميح' : 'Reveal')}
                  </span>
                </button>

                {isRevealed && (
                  <div className="p-3 pt-0 text-muted-foreground text-xs leading-relaxed border-t border-border/40">
                    {isRtl ? hintObj.hintAr : hintObj.hint}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* STATUS: COMPLETED vs SUBMISSION FORM */}
        {isCompleted ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-lg shrink-0">
                {activeChallenge.badgeIcon}
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isRtl ? 'تم حل التحدي بنجاح!' : 'Challenge Solved!'}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {isRtl ? `تم فتح الشارة الحصرية: ${activeChallenge.badgeName}` : `Unlocked Exclusive Badge: ${activeChallenge.badgeName}`}
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-black text-xs">
              +150 XP EARNED
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmitAnswer} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={answerInput}
                onChange={e => {
                  setAnswerInput(e.target.value);
                  setErrorMsg('');
                }}
                placeholder={isRtl ? 'أدخل الإجابة أو المفتاح المفكوك هنا...' : 'Enter the decoded flag or answer here...'}
                className="flex-1 rounded-2xl bg-card border border-border px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary shadow-xs"
              />
              <button
                type="submit"
                disabled={isSubmitting || !answerInput.trim()}
                className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-2xl text-xs sm:text-sm shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isRtl ? 'تحقق' : 'Submit'}</span>
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs font-bold text-rose-500 flex items-center gap-1 pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </p>
            )}
          </form>
        )}

      </div>
    </div>
  );
}
