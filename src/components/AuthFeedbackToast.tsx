import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Rocket, X, Flame, Award, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';

interface AuthFeedbackDetail {
  id?: number;
  type: 'login' | 'logout';
  userName?: string;
  photoURL?: string;
}

const DISPLAY_DURATION_MS = 12000;

export function AuthFeedbackToast() {
  const { i18n } = useTranslation();
  const language = useStore((state) => state.language);
  const [feedback, setFeedback] = useState<AuthFeedbackDetail | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isRtl = language === 'ar' || i18n.language === 'ar';

  useEffect(() => {
    const handleAuthFeedback = (event: Event) => {
      const customEvent = event as CustomEvent<AuthFeedbackDetail>;
      if (customEvent.detail) {
        setFeedback({
          ...customEvent.detail,
          id: Date.now(),
        });
        setIsPaused(false);
      }
    };

    window.addEventListener('skilliq-auth-feedback', handleAuthFeedback);
    return () => {
      window.removeEventListener('skilliq-auth-feedback', handleAuthFeedback);
    };
  }, []);

  useEffect(() => {
    if (!feedback || isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    timerRef.current = setTimeout(() => {
      setFeedback(null);
    }, DISPLAY_DURATION_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [feedback, isPaused]);

  const isLogin = feedback?.type === 'login';
  const displayName = feedback?.userName || (isRtl ? 'صديقنا المتعلم' : 'Learner');

  return (
    <AnimatePresence mode="wait">
      {feedback && (
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          className="fixed top-20 sm:top-24 inset-x-0 z-[250] flex justify-center px-3 sm:px-6 pointer-events-none"
        >
          <motion.div
            key={feedback.id}
            initial={{ opacity: 0, y: -24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            className="pointer-events-auto relative w-full max-w-md sm:max-w-lg rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl overflow-hidden p-4 sm:p-5 text-start"
          >
            {/* Top gradient accent line */}
            <div
              className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${
                isLogin
                  ? 'from-primary via-emerald-500 to-indigo-500'
                  : 'from-rose-500 via-amber-500 to-primary'
              }`}
            />

            {/* Close button */}
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="absolute top-3.5 end-3.5 w-7 h-7 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              aria-label={isRtl ? 'إغلاق' : 'Close'}
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-start gap-3.5 sm:gap-4 pe-6">
              {/* Avatar or Icon */}
              {isLogin ? (
                <div className="relative shrink-0">
                  {feedback.photoURL ? (
                    <img
                      src={feedback.photoURL}
                      alt={displayName}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-primary/30 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs">
                      <Rocket className="w-6 h-6" />
                    </div>
                  )}
                  <span className="absolute -bottom-1 -end-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-3 h-3" />
                  </span>
                </div>
              ) : (
                <div className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shadow-xs">
                  <Heart className="w-6 h-6 fill-rose-500/20" />
                </div>
              )}

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-1 bg-primary/10 text-primary">
                  {isLogin ? (
                    <>
                      <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{isRtl ? 'مرحباً بعودتك إلى عائلة Skilliq' : 'Welcome to the Skilliq Family'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-rose-500" />
                      <span>{isRtl ? 'نراك قريباً في رحلة التعلم' : 'See You Again Soon'}</span>
                    </>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-extrabold text-foreground leading-snug">
                  {isLogin
                    ? isRtl
                      ? `أهلاً بك يا ${displayName}! سعداء بوجودك معنا 🚀`
                      : `Welcome back, ${displayName}! We're glad you're here 🚀`
                    : isRtl
                    ? `وداعاً مؤقتاً يا ${displayName}! مكانك محفوظ دائماً 💙`
                    : `See you soon, ${displayName}! Keep shining 💙`}
                </h3>

                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {isLogin
                    ? isRtl
                      ? 'مساراتك، نقاطك، وشهاداتك المعتمدة جاهزة. كل درس تكمله اليوم يقربك خطوة نحو القمة!'
                      : 'Your courses, daily streak, and certificates are ready. Every lesson you finish today brings you closer to mastery!'
                    : isRtl
                    ? 'تم حفظ تقدمك وإنجازاتك بأمان تام. عد إلينا في أي وقت لمواصلة تطوير مهاراتك — Skilliq دائماً معك ومجانية 100%!'
                    : 'Your progress and XP are safely saved. Come back anytime to keep your streak alive — Skilliq is always 100% free and waiting for you!'}
                </p>

                {/* Bottom Motivation Tag & Dismiss Button */}
                <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary truncate">
                    <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">
                      {isLogin
                        ? isRtl
                          ? 'بيئة تعلم نقية 100% بدون مشتتات'
                          : '100% Distraction-Free Studio Active'
                        : isRtl
                        ? 'بانتظار عودتك لإكمال مسارك القادم!'
                        : 'Can’t wait to see what you master next!'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFeedback(null)}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>{isRtl ? 'حسناً' : 'Got it'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Auto-dismiss progress bar */}
            {!isPaused && (
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: DISPLAY_DURATION_MS / 1000, ease: 'linear' }}
                className="absolute bottom-0 inset-x-0 h-1 bg-primary/35 origin-left rtl:origin-right"
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
