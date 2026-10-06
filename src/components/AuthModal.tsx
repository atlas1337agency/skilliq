import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  AlertCircle, 
  Copy, 
  Check, 
  ShieldCheck, 
  Award, 
  Flame, 
  Sparkles, 
  Heart,
  Loader2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { isSuperAdminEmail } from '../lib/admin';
import { initializeOrUpdateProfile } from '../lib/gamification';
import { useStore } from '../store/useStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { t, i18n } = useTranslation();
  const { language, theme } = useStore();
  const [error, setError] = useState('');
  const [isDomainError, setIsDomainError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const isRtl = language === 'ar' || i18n.language === 'ar';
  const isDark = theme === 'dark';

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyHostname = () => {
    navigator.clipboard.writeText(currentHostname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsDomainError(false);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const role = isSuperAdminEmail(result.user.email) ? 'admin' : 'student';
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Student',
          photoURL: result.user.photoURL || '',
          role: role
        });
      }

      try {
        await initializeOrUpdateProfile({
          uid: result.user.uid,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          email: result.user.email
        });
      } catch (profErr) {
        console.error("Failed to sync public profile on login", profErr);
      }

      onClose();
      window.dispatchEvent(
        new CustomEvent('skilliq-auth-feedback', {
          detail: {
            type: 'login',
            userName: result.user.displayName || result.user.email?.split('@')[0] || 'Learner',
            photoURL: result.user.photoURL || '',
          },
        })
      );
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        console.error("Error signing in with Google", err);
        const isUnauthorized = err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain');
        setIsDomainError(isUnauthorized);
        if (isUnauthorized) {
          setError(
            isRtl
              ? `النطاق "${currentHostname}" غير مصرح به بعد في إعدادات Firebase.`
              : `Domain "${currentHostname}" is not yet authorized in your Firebase project.`
          );
        } else {
          setError(
            isRtl
              ? `فشل تسجيل الدخول: ${err.message || err.code || 'خطأ غير معروف'}`
              : `Sign-in failed: ${err.message || err.code || 'Unknown error'}.`
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: Flame,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      title: isRtl ? 'تتبع تقدمك وسلسلة التعلم اليومية' : 'Track Progress & Daily Streaks',
      desc: isRtl ? 'احفظ مكان توقفك في الدروس واكسب نقاط XP يومياً' : 'Resume lessons anytime and earn XP as you learn',
    },
    {
      icon: Award,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      title: isRtl ? 'احصل على شهادات إتمام موثقة' : 'Earn Verifiable Certificates',
      desc: isRtl ? 'شهادات رسمية برمز QR لكل دورة أو مسار تكمله' : 'Official QR-verified credentials for completed courses',
    },
    {
      icon: Heart,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      title: isRtl ? 'احفظ دوراتك وكتبك المفضلة' : 'Build Your Personal Library',
      desc: isRtl ? 'أضف المسارات والدورات والكتب إلى قائمة مفضلتك' : 'Bookmark playlists, masterclasses, and books for later',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
          {/* Frosted Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 dark:bg-black/75 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            className="relative z-10 w-full max-w-md sm:max-w-lg bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden my-auto text-start"
          >
            {/* Top Gradient Accent Bar */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-emerald-500" />

            {/* Subtle Ambient Glow */}
            <div className="pointer-events-none absolute -top-24 -end-24 w-48 h-48 rounded-full bg-primary/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -start-24 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl" />

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 end-4 z-20 w-9 h-9 rounded-2xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              aria-label={isRtl ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="p-5 sm:p-7 md:p-8 relative z-10">
              {/* Brand & Kicker Header */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'مجاني 100% · بدون إعلانات أو مشتتات' : '100% Free · Distraction-Free Learning'}</span>
                </div>

                <img
                  key={isDark ? 'dark' : 'light'}
                  src={isDark ? '/images/logo_dark.png' : '/images/logo_light.png'}
                  alt="Skilliq"
                  className="h-10 sm:h-12 w-auto object-contain mb-3"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('/public/images/')) {
                      target.src = isDark ? '/public/images/logo_dark.png' : '/public/images/logo_light.png';
                    }
                  }}
                />

                <h2
                  id="auth-modal-title"
                  className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight"
                >
                  {isRtl ? 'سجل الدخول للبدء في التعلم' : t('login_to_start', 'Log in to Start')}
                </h2>

                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
                  {t(
                    'login_desc',
                    'We exclusively use Google Sign-In to keep out spam, prevent fake accounts, and securely verify your identity for official certificates.'
                  )}
                </p>
              </div>

              {/* Error Alert Banner */}
              {error && (
                <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/25 text-red-500 rounded-2xl space-y-2 text-xs sm:text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-semibold leading-snug">{error}</span>
                  </div>

                  {isDomainError && (
                    <div className="mt-2.5 pt-2.5 border-t border-red-500/20 text-xs text-foreground space-y-2">
                      <p className="font-medium text-muted-foreground">
                        {isRtl
                          ? 'لتفعيل النطاق في لوحة تحكم Firebase:'
                          : 'To authorize this domain in Firebase Console:'}
                      </p>
                      <div className="flex items-center justify-between gap-2 p-2 bg-background border border-border rounded-xl font-mono text-[11px] text-primary">
                        <span className="truncate">{currentHostname}</span>
                        <button
                          type="button"
                          onClick={handleCopyHostname}
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-xs cursor-pointer"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied ? (isRtl ? 'تم النسخ' : 'Copied') : (isRtl ? 'نسخ' : 'Copy')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Value Proposition Benefits List */}
              <div className="space-y-2.5 mb-6">
                {benefits.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/60"
                    >
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 ${item.color}`}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-muted-foreground truncate mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Primary Google Sign-In CTA Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 sm:py-4 px-5 rounded-2xl bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('processing', 'Processing...')}</span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          fill="#EA4335"
                        />
                      </svg>
                    </div>
                    <span>{t('continue_with_google', 'Continue with Google')}</span>
                  </>
                )}
              </button>

              {/* Security & Terms Footer */}
              <div className="mt-5 pt-4 border-t border-border/60 flex flex-col items-center gap-2 text-center">
                <div className="flex items-center justify-center gap-3 text-[11px] font-semibold text-muted-foreground flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isRtl ? 'حماية وتوثيق رسمي' : 'Verified Identity'}</span>
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? 'خصوصية تامة' : 'Zero Spam'}</span>
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                  {t('auth_terms', 'By signing in, you agree to our Terms of Service and Privacy Policy.')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
