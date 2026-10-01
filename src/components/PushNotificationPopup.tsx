import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { 
  X, 
  ExternalLink, 
  Bell, 
  Sparkles, 
  ArrowRight, 
  Check, 
  CheckCircle2,
  PlayCircle,
  Volume2, 
  VolumeX, 
  EyeOff,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

export function PushNotificationPopup() {
  const { notifications, user, language } = useStore();
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeNotif, setActiveNotif] = useState<any | null>(null);
  const [sessionSkipped, setSessionSkipped] = useState<string[]>([]);
  const [isExpandedModal, setIsExpandedModal] = useState<boolean>(false);

  const isRtl = language === 'ar' || i18n.language === 'ar';

  // Listen to live notifications from store
  useEffect(() => {
    // Check local storage for videos reported by this user (including guest sessions)
    const myReported = JSON.parse(localStorage.getItem('my_reported_videos') || '{}');

    // Get active notifications matching user, broadcast, or learner reported video
    const active = notifications.filter(n => {
      if (!n.isActive) return false;
      if (!n.targetUserId) return true; // broadcast to all
      if (user && n.targetUserId === user.uid) return true; // targeted to logged in user
      if ((n as any).videoId && myReported[(n as any).videoId]) return true; // targeted to learner who reported it
      return false;
    });

    if (active.length === 0) {
      setActiveNotif(null);
      return;
    }

    // Sort by newest
    active.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    // Check local storage for dismissed notifications
    const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
    
    // Find the newest active notification that hasn't been dismissed or skipped
    const newestUnseen = active.find(n => !dismissed.includes(n.id) && !sessionSkipped.includes(n.id));

    if (newestUnseen) {
      setActiveNotif(newestUnseen);
    } else {
      setActiveNotif(null);
    }
  }, [notifications, sessionSkipped, user]);

  // Support manual preview trigger from admin panel
  useEffect(() => {
    const handlePreview = (e: any) => {
      if (e.detail?.notification) {
        setActiveNotif({
          ...e.detail.notification,
          isPreview: true
        });
      }
    };
    window.addEventListener('preview-push-notification', handlePreview);
    return () => window.removeEventListener('preview-push-notification', handlePreview);
  }, []);

  const handleDismiss = (dontShowAgain: boolean) => {
    if (!activeNotif) return;

    if (dontShowAgain && !activeNotif.isPreview) {
      const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
      if (!dismissed.includes(activeNotif.id)) dismissed.push(activeNotif.id);
      localStorage.setItem('dismissedNotifications', JSON.stringify(dismissed));
    } else {
      setSessionSkipped(prev => [...prev, activeNotif.id]);
    }
    setActiveNotif(null);
    setIsExpandedModal(false);
  };

  const handleActionClick = (url: string) => {
    if (!url) return;
    if (url.startsWith('/')) {
      navigate(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    handleDismiss(false);
  };

  if (!activeNotif) return null;

  return (
    <AnimatePresence>
      {/* 
        MODERN FLOATING PUSH NOTIFICATION (Responsive Island on Desktop/Tablet, Bottom Sheet on Mobile)
      */}
      <div 
        className={cn(
          "fixed z-[260] pointer-events-none transition-all duration-300",
          isExpandedModal 
            ? "inset-0 flex items-center justify-center p-3 sm:p-5 bg-background/80 backdrop-blur-md pointer-events-auto"
            : "bottom-4 end-4 sm:bottom-6 sm:end-6 start-4 sm:start-auto max-w-md w-auto"
        )}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 26 }}
          className={cn(
            "pointer-events-auto bg-card/95 backdrop-blur-xl border border-border/90 shadow-2xl rounded-3xl relative overflow-hidden flex flex-col text-start",
            isExpandedModal 
              ? "w-full max-w-lg max-h-[88vh] overflow-y-auto" 
              : "w-full sm:w-[410px] shadow-primary/10 border-primary/40 ring-1 ring-primary/20"
          )}
          role="alert"
          aria-live="assertive"
        >
          {/* Luminous Top Gradient Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-indigo-500 to-purple-600 z-30" />

          {/* PREVIEW BADGE IF IN PREVIEW MODE */}
          {activeNotif.isPreview && (
            <div className="bg-amber-500 text-black font-extrabold text-[10px] uppercase tracking-wider py-1 px-3 text-center">
              {isRtl ? 'معاينة الإشعار الحي للمسؤول' : 'Admin Live Notification Preview'}
            </div>
          )}

          {/* NOTIFICATION IMAGE (IF PROVIDED) */}
          {activeNotif.image && (
            <div className={cn(
              "w-full bg-muted relative shrink-0 overflow-hidden",
              isExpandedModal ? "h-48 sm:h-56" : "h-36 sm:h-40"
            )}>
              <img 
                src={activeNotif.image} 
                alt="" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
            </div>
          )}

          {/* MAIN CONTENT BODY */}
          <div className="p-4 sm:p-5 space-y-3 relative z-10">
            {/* Header row: Bell pulse, tag, close button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {activeNotif.type === 'video_fixed' || activeNotif.title?.includes('Fixed') || activeNotif.title?.includes('إصلاح') ? (
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 shadow-xs relative">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 shadow-xs relative">
                    <Bell className="w-4 h-4 animate-bounce" />
                    <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-primary rounded-full animate-ping" />
                  </div>
                )}
                <div>
                  <span className={cn(
                    "text-[10px] font-extrabold uppercase tracking-wider",
                    activeNotif.type === 'video_fixed' || activeNotif.title?.includes('Fixed') || activeNotif.title?.includes('إصلاح')
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-primary"
                  )}>
                    {activeNotif.type === 'video_fixed' || activeNotif.title?.includes('Fixed') || activeNotif.title?.includes('إصلاح')
                      ? (isRtl ? '✓ تم إصلاح الفيديو' : '✓ Video Repaired & Ready')
                      : (isRtl ? 'إشعار جديد' : 'Live Broadcast')}
                  </span>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {isRtl ? 'الآن على SkilliQ' : 'Just now on SkilliQ'}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Expand toggle & Dismiss */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpandedModal(!isExpandedModal)}
                  className="w-7 h-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                  title={isExpandedModal ? "Minimize" : "Expand"}
                >
                  {isExpandedModal ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleDismiss(false)}
                  className="w-7 h-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight line-clamp-2">
              {isRtl && activeNotif.titleAr ? activeNotif.titleAr : activeNotif.title}
            </h3>

            {/* Message Body */}
            <p className={cn(
              "text-xs text-muted-foreground leading-relaxed whitespace-pre-line",
              isExpandedModal ? "max-h-60 overflow-y-auto" : "line-clamp-3"
            )}>
              {isRtl && activeNotif.messageAr ? activeNotif.messageAr : activeNotif.message}
            </p>

            {/* ACTIONS FOOTER */}
            <div className="pt-2 space-y-2">
              {/* Primary Action Button (If CTA Link exists) */}
              {activeNotif.link && (
                <button
                  onClick={() => handleActionClick(activeNotif.link)}
                  className={cn(
                    "w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98",
                    activeNotif.type === 'video_fixed' || activeNotif.title?.includes('Fixed') || activeNotif.title?.includes('إصلاح')
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {activeNotif.type === 'video_fixed' || activeNotif.title?.includes('Fixed') || activeNotif.title?.includes('إصلاح') ? (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      <span>{isRtl ? (activeNotif.actionLabelAr || 'مواصلة التعلم الآن') : (activeNotif.actionLabel || 'Keep Learning Now')}</span>
                    </>
                  ) : (
                    <>
                      <span>{isRtl ? 'استكشف الآن' : 'Explore Now'}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </>
                  )}
                </button>
              )}

              {/* Secondary Multiple Links (If present) */}
              {activeNotif.links && activeNotif.links.length > 0 && (
                <div className="space-y-1.5">
                  {activeNotif.links.map((lnk: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleActionClick(lnk.url)}
                      className="w-full py-2 px-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{lnk.label || 'Learn More'}</span>
                      <ExternalLink className="w-3 h-3 rtl:rotate-180" />
                    </button>
                  ))}
                </div>
              )}

              {/* Dismiss & "Don't show again" row */}
              <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground font-medium">
                <button
                  onClick={() => handleDismiss(false)}
                  className="hover:text-foreground transition-colors cursor-pointer py-1"
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>

                {!activeNotif.isPreview && (
                  <button
                    onClick={() => handleDismiss(true)}
                    className="hover:text-foreground text-muted-foreground/80 hover:underline transition-colors cursor-pointer py-1 flex items-center gap-1"
                  >
                    <EyeOff className="w-3 h-3" />
                    <span>{isRtl ? 'عدم الإظهار مجدداً' : "Don't show again"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
