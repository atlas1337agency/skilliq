import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle, Copy, Check, ExternalLink } from 'lucide-react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { isSuperAdminEmail } from '../lib/admin';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [isDomainError, setIsDomainError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentHostname = window.location.hostname;

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
        // Ensure photoURL is a string, even if null from provider
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Student',
          photoURL: result.user.photoURL || '',
          role: role
        });
      }
      onClose();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        console.error("Error signing in with Google", err);
        const isUnauthorized = err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain');
        setIsDomainError(isUnauthorized);
        if (isUnauthorized) {
          setError(`Domain "${currentHostname}" is not yet authorized in your Firebase project.`);
        } else {
          setError(`Sign-in failed: ${err.message || err.code || 'Unknown error'}.`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-75">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">
            {t('login_to_start', 'Sign In to N E X A 1337')}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
              
              {isDomainError && (
                <div className="mt-3 pt-3 border-t border-red-500/20 text-xs text-foreground space-y-2">
                  <p className="font-medium text-muted-foreground">
                    To fix this in your Firebase Console:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
                    <li>Go to <strong>Firebase Console &gt; Authentication &gt; Settings</strong></li>
                    <li>Click on <strong>Authorized domains</strong></li>
                    <li>Click <strong>Add domain</strong> and paste:</li>
                  </ol>
                  <div className="flex items-center justify-between gap-2 p-2 bg-background border border-border rounded-lg font-mono text-[11px] text-primary">
                    <span className="truncate">{currentHostname}</span>
                    <button
                      type="button"
                      onClick={handleCopyHostname}
                      className="shrink-0 flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity text-xs"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-center mb-8">
            <p className="text-muted-foreground">
              {t('login_desc', 'We exclusively use Google Sign-In to keep out spam, prevent fake accounts, and securely verify your identity for official certificates.')}
            </p>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 border border-border/60 bg-background rounded-xl hover:bg-muted transition-all font-medium text-foreground shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="font-bold">{t('processing', 'Processing...')}</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>{t('continue_with_google', 'Continue with Google')}</span>
              </>
            )}
          </button>
          
          <p className="mt-6 text-xs text-center text-muted-foreground font-medium">
            {t('auth_terms', 'By signing in, you agree to our terms and conditions.')}
          </p>
        </div>
      </div>
    </div>
  );
}
