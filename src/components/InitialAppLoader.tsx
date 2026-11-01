import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { Sparkles, CheckCircle2, Shield, Code, Layers } from 'lucide-react';

export function InitialAppLoader() {
  const { isContentLoading, theme, language } = useStore();
  const [progress, setProgress] = useState(12);
  const [isVisible, setIsVisible] = useState(true);
  const [stageText, setStageText] = useState<'init' | 'loading' | 'ready'>('init');

  const isRtl = language === 'ar';
  const isDark = theme === 'dark';

  useEffect(() => {
    const startTime = Date.now();
    const minDuration = 1200; // minimum display time for smooth experience
    const maxSafetyTimeout = 3200; // safety timeout

    // Progress simulation while assets & Firestore load
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 45) {
          return prev + Math.floor(Math.random() * 10) + 6;
        } else if (prev < 85) {
          setStageText('loading');
          return prev + Math.floor(Math.random() * 6) + 3;
        } else if (prev < 98) {
          // If content still loading, crawl near 95%
          if (isContentLoading && Date.now() - startTime < maxSafetyTimeout) {
            return Math.min(96, prev + 1);
          }
          return 99;
        }
        return prev;
      });
    }, 90);

    // Watch for readiness
    const checkReadiness = () => {
      const elapsed = Date.now() - startTime;
      const contentReady = !isContentLoading;
      const isWindowReady = document.readyState === 'complete';

      if ((contentReady || elapsed >= maxSafetyTimeout) && elapsed >= minDuration) {
        setProgress(100);
        setStageText('ready');
        clearInterval(interval);

        // Smooth exit after reaching 100%
        const exitTimer = setTimeout(() => {
          setIsVisible(false);
        }, 450);

        return () => clearTimeout(exitTimer);
      }
    };

    const readyInterval = setInterval(checkReadiness, 100);

    return () => {
      clearInterval(interval);
      clearInterval(readyInterval);
    };
  }, [isContentLoading]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="app-initial-loader"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.03,
            filter: 'blur(10px)',
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } 
          }}
          dir={isRtl ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-[999999] flex flex-col items-center justify-center select-none overflow-hidden bg-background text-foreground transition-colors duration-300"
          style={{ willChange: 'opacity, transform, filter' }}
        >
          {/* Ambient Glowing Orbs Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-[20%] -start-[10%] w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute -bottom-[20%] -end-[10%] w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full bg-violet-500/10 dark:bg-violet-600/15 blur-[120px] animate-pulse" style={{ animationDuration: '5s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px]" />
          </div>

          {/* Central Animated Content Card */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full">
            
            {/* Animated Logo Container with Concentric Rings */}
            <div className="relative mb-6 sm:mb-8 flex items-center justify-center">
              
              {/* Outer Pulsing Aura Ring */}
              <motion.div 
                animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.1, 0.35] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-primary/20 dark:bg-primary/25 blur-lg"
              />

              {/* Rotating Gradient Border Frame */}
              <div className="relative p-[2.5px] rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-violet-500 shadow-2xl shadow-primary/20">
                {/* Inner Icon Backdrop */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[22px] bg-card/95 backdrop-blur-xl border border-border/60 flex items-center justify-center p-3 sm:p-3.5 relative overflow-hidden group">
                  
                  {/* Subtle Inner Sheen Sweep */}
                  <motion.div
                    animate={{ x: ['-120%', '150%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
                  />

                  {/* favicon.png as requested */}
                  <motion.img
                    src="/favicon.png"
                    alt="Skilliq Icon"
                    onError={(e) => {
                      // Fallback to /images/favicon.png if needed
                      (e.currentTarget as HTMLImageElement).src = '/images/favicon.png';
                    }}
                    animate={{ 
                      scale: [0.96, 1.04, 0.96],
                      rotate: [0, 1.5, -1.5, 0]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="w-full h-full object-contain drop-shadow-md select-none"
                    draggable={false}
                  />
                </div>
              </div>

              {/* Floating Sparkle Satellite */}
              <motion.div
                animate={{ 
                  y: [-3, 3, -3],
                  rotate: [0, 90, 180, 270, 360]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute -top-1.5 -end-1.5 sm:-top-2 sm:-end-2 w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-card border border-border/80 shadow-md flex items-center justify-center text-primary"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary animate-pulse" />
              </motion.div>
            </div>

            {/* Brand Title with Gradient Typography */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-2"
            >
              <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-foreground flex items-center justify-center gap-2">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                  SKILLIQ
                </span>
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-muted-foreground mt-0.5">
                {isRtl 
                  ? 'منصة التعليم التقني والمسارات المتسلسلة' 
                  : 'Structured Tech Pathways & Roadmaps'}
              </p>
            </motion.div>

            {/* Dynamic Status Label & Progress Bar */}
            <div className="w-full mt-4 sm:mt-5 space-y-2.5">
              
              {/* Progress Text and Percentage */}
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
                <span className="truncate max-w-[240px] text-start transition-all">
                  {stageText === 'init' && (isRtl ? 'جاري تهيئة المنصة...' : 'Initializing platform...')}
                  {stageText === 'loading' && (isRtl ? 'تحميل المسارات والمحتوى التفاعلي...' : 'Loading paths & interactive content...')}
                  {stageText === 'ready' && (isRtl ? 'اكتمل التحميل، أهلاً بك!' : 'Ready! Welcome aboard.')}
                </span>
                <span className="font-mono text-primary font-black text-xs sm:text-sm tabular-nums">
                  {Math.min(100, Math.max(0, progress))}%
                </span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-2 sm:h-2.5 rounded-full bg-muted/80 border border-border/60 overflow-hidden p-[1.5px] shadow-inner">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 relative overflow-hidden"
                  initial={{ width: '10%' }}
                  animate={{ width: `${Math.min(100, progress)}%` }}
                  transition={{ ease: "easeOut", duration: 0.2 }}
                >
                  {/* Subtle Light Stripe Animation */}
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                  />
                </motion.div>
              </div>

            </div>

            {/* Trust & Modern Value Chips at Bottom */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] font-semibold text-muted-foreground"
            >
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-card border border-border/70 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{isRtl ? 'مجاني 100% بدون إعلانات' : '100% Free Forever'}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-card border border-border/70 shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>{isRtl ? 'شهادات موثقة' : 'Verified Certificates'}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-card border border-border/70 shadow-2xs">
                <Layers className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                <span>{isRtl ? 'خرائط طريق تفاعلية' : 'Graphic Roadmaps'}</span>
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
