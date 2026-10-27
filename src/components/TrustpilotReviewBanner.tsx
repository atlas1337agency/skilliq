import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, ExternalLink, X, Check, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../store/useStore';
import { awardCustomXP } from '../lib/gamification';
import { cn } from '../lib/utils';

export const TRUSTPILOT_REVIEW_URL = 'https://www.trustpilot.com/review/skilliq1337.online';

export function TrustpilotReviewBanner() {
  const { t, i18n } = useTranslation();
  const { user, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [isVisible, setIsVisible] = useState(false);
  const [isReviewed, setIsReviewed] = useState(false);
  const [hasAwardedXP, setHasAwardedXP] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Check localStorage status
    const status = localStorage.getItem('skilliq_trustpilot_status');
    const snoozeUntil = localStorage.getItem('skilliq_trustpilot_snooze');

    if (status === 'reviewed') {
      setIsReviewed(true);
      return;
    }

    if (snoozeUntil && Date.now() < Number(snoozeUntil)) {
      return;
    }

    // Delay showing the banner gently so user doesn't get hit immediately
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 4500);

    // Event listener to open on demand (from Footer or Dashboard button)
    const handleOpen = () => {
      setIsVisible(true);
      setIsMinimized(false);
    };

    window.addEventListener('open-trustpilot-modal', handleOpen);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('open-trustpilot-modal', handleOpen);
    };
  }, []);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#00b67a', '#005128', '#22c55e', '#38bdf8', '#fbbf24']
      });
    } catch {
      // Fallback if canvas-confetti is not loaded
    }
  };

  const handleOpenReview = async () => {
    // Open Trustpilot in new tab
    window.open(TRUSTPILOT_REVIEW_URL, '_blank', 'noopener,noreferrer');

    // Trigger celebration
    triggerCelebration();

    // Mark as reviewed in localStorage
    localStorage.setItem('skilliq_trustpilot_status', 'reviewed');
    setIsReviewed(true);

    // Award +50 XP if user is logged in
    if (user?.uid && !hasAwardedXP) {
      try {
        await awardCustomXP(user.uid, 50, {
          id: 'trustpilot_advocate',
          name: isRtl ? 'سفير مجتمع Skilliq' : 'Community Advocate',
          description: isRtl ? 'قيّم منصة Skilliq على Trustpilot' : 'Reviewed Skilliq on Trustpilot',
          icon: '⭐',
        });
        setHasAwardedXP(true);
      } catch (err) {
        console.warn('Failed to award Trustpilot review XP:', err);
      }
    }

    // Auto-dismiss after 6 seconds of success state
    setTimeout(() => {
      setIsVisible(false);
    }, 6000);
  };

  const handleAlreadyReviewed = async () => {
    localStorage.setItem('skilliq_trustpilot_status', 'reviewed');
    setIsReviewed(true);

    if (user?.uid && !hasAwardedXP) {
      try {
        await awardCustomXP(user.uid, 50, {
          id: 'trustpilot_advocate',
          name: isRtl ? 'سفير مجتمع Skilliq' : 'Community Advocate',
          description: isRtl ? 'قيّم منصة Skilliq على Trustpilot' : 'Reviewed Skilliq on Trustpilot',
          icon: '⭐',
        });
        setHasAwardedXP(true);
        triggerCelebration();
      } catch (err) {
        console.warn('Error awarding XP:', err);
      }
    }

    setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  };

  const handleSnooze = () => {
    // Snooze for 4 days
    const snoozeTime = Date.now() + 4 * 24 * 60 * 60 * 1000;
    localStorage.setItem('skilliq_trustpilot_snooze', String(snoozeTime));
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  // Minimized Floating Pill on the bottom corner
  if (isMinimized) {
    return (
      <div 
        dir={isRtl ? 'rtl' : 'ltr'} 
        className={cn(
          "fixed bottom-20 md:bottom-6 z-50 transition-all duration-300",
          isRtl ? "left-4 md:left-6" : "right-4 md:right-6"
        )}
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-slate-900/95 dark:bg-[#002416]/95 text-white border border-[#00b67a]/40 shadow-xl backdrop-blur-md hover:scale-105 transition-transform cursor-pointer group"
          title={isRtl ? 'ادعمنا على Trustpilot' : 'Review us on Trustpilot'}
        >
          <div className="flex items-center gap-0.5 text-[#00b67a]">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-3 h-3 fill-[#00b67a]" />
            ))}
          </div>
          <span className="text-xs font-bold text-white">
            {isRtl ? 'تقييم المنصة' : 'Rate on Trustpilot'}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#00b67a] text-slate-950 font-black">
            +50 XP
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Trustpilot feedback prompt"
      dir={isRtl ? 'rtl' : 'ltr'}
      className={cn(
        "fixed bottom-20 md:bottom-6 z-50 max-w-md w-[calc(100%-2rem)] sm:w-auto transition-all duration-300",
        isRtl ? "left-4 md:left-6" : "right-4 md:right-6"
      )}
    >
      <div className="relative rounded-2xl bg-card/95 dark:bg-card/90 border border-[#00b67a]/30 shadow-2xl backdrop-blur-xl p-4 sm:p-5 overflow-hidden text-start">
        {/* Subtle emerald gradient ambient glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#00b67a] via-emerald-400 to-teal-400" />
        <div className="absolute -top-12 -end-12 w-32 h-32 rounded-full bg-[#00b67a]/15 blur-2xl pointer-events-none" />

        {/* Top bar with Trustpilot 5 stars & close button */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            {/* Trustpilot Official Star Box */}
            <div className="flex items-center gap-1 bg-[#00b67a] text-white px-2 py-1 rounded-md shadow-xs">
              <Star className="w-3.5 h-3.5 fill-white text-white" />
              <span className="text-xs font-black tracking-wider uppercase">Trustpilot</span>
            </div>

            {/* 5 Green Stars */}
            <div className="flex items-center gap-0.5" aria-label="5 star rating">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-4 h-4 bg-[#00b67a] rounded-[2px] flex items-center justify-center">
                  <Star className="w-2.5 h-2.5 fill-white text-white" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors text-xs"
              title={isRtl ? 'تصغير' : 'Minimize'}
            >
              ─
            </button>
            <button
              onClick={handleSnooze}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
              title={isRtl ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isReviewed ? (
          <div className="py-2 space-y-2">
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
              <Check className="w-5 h-5 stroke-[3]" />
              <span>
                {isRtl ? 'شكراً جزيلاً لدعمك مجتمع Skilliq!' : 'Thank you for supporting Skilliq on Trustpilot!'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {isRtl 
                ? 'تقييمك الصادق يساعدنا في إبقاء المنصة مجانية 100% ودون إعلانات لكل متعلم حول العالم.' 
                : 'Your honest feedback helps us keep the platform 100% free and distraction-free for students worldwide.'}
            </p>
            {hasAwardedXP && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <Award className="w-3.5 h-3.5" />
                <span>+50 XP {isRtl ? 'تمت إضافتها لحسابك' : 'added to your profile!'}</span>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-1.5 mb-3.5">
              <h4 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                <span>
                  {isRtl ? 'هل أعجبتك تجربة التعلم على Skilliq؟' : 'Enjoying distraction-free learning on Skilliq?'}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#00b67a]/20 text-[#00b67a] font-mono">
                  +50 XP
                </span>
              </h4>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl 
                  ? 'منصة Skilliq مجانية بالكامل وبدون إعلانات. دقيقة واحدة لمشاركة رأيك الحقيقي على Trustpilot ستساعد آلاف الطلاب على الوصول لمنهج تعليمي منظم.' 
                  : 'Skilliq is 100% free with zero ads. Your 1-minute honest review on Trustpilot helps other ambitious learners discover our sequential tracks.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-border/50">
              <button
                onClick={handleOpenReview}
                className="flex-1 py-2.5 px-3.5 rounded-xl bg-[#00b67a] hover:bg-[#009b67] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#00b67a]/20 transition-all hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-white" />
                <span>{isRtl ? 'اكتب تقييمك على Trustpilot' : 'Review on Trustpilot'}</span>
                <ExternalLink className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>

              <button
                onClick={handleAlreadyReviewed}
                className="py-2.5 px-3 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                {isRtl ? 'قيّمت سابقاً' : 'Already reviewed'}
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
