import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { Moon, Sun, LogIn, LogOut, LayoutDashboard, Award, Home as HomeIcon, BookOpen, Menu, BadgeCheck, X, ShieldAlert, Flame, Trophy, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState, useRef } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { WolfLogo } from './WolfLogo';
import { motion } from 'motion/react';
import { AuthModal } from './AuthModal';

export function Header() {
  const { t, i18n } = useTranslation();
  const { theme, language, setTheme, setLanguage, user, setUser, loadProgress, publicProfile, isAuthModalOpen, setIsAuthModalOpen } = useStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (
        mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) &&
        mobileMenuBtnRef.current && !mobileMenuBtnRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch or create user doc
        const userRef = doc(db, `users/${currentUser.uid}`);
        let userSnap = await getDoc(userRef);
        let role = 'student';
        
        if (!userSnap.exists()) {
          role = currentUser.email === 'marouananouar02@gmail.com' ? 'admin' : 'student';
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            role: role
          });
        } else {
          role = userSnap.data().role || 'student';
          if (role === 'blocked') {
            await signOut(auth);
            setUser(null);
            useStore.setState({ progress: {} });
            useStore.setState({ isAuthModalOpen: false });
            alert("Your account has been blocked by the admin.");
            return;
          }
          // Force fix for admin if their role got stuck as 'user' or 'student'
          if (currentUser.email === 'marouananouar02@gmail.com' && role !== 'admin') {
            role = 'admin';
            try {
              const { updateDoc } = await import('firebase/firestore');
              await updateDoc(userRef, { role: 'admin' });
            } catch (e) {
              console.error("Failed to upgrade admin role", e);
            }
          }
        }

        // Add role to the user object we store in state
        const enhancedUser = { ...currentUser, role };
        setUser(enhancedUser);
        loadProgress();
      } else {
        setUser(null);
        useStore.setState({ progress: {} });
      }
    });
    return () => unsubscribe();
  }, [setUser, loadProgress]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsDropdownOpen(false);
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 relative">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 sm:gap-3 group shrink-0">
              <Link to="/" className="flex items-center gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6">
                  <WolfLogo className="group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex flex-col leading-none">
                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground font-black text-sm sm:text-xl md:text-xl tracking-wider">Skilliq</span>
                    <span className="text-blue-500">
                      <BadgeCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </span>
                  </div>
                  <div className="flex items-center mt-0.5">
                    <span className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                      Internet For Everyone
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium ms-6">
          <Link to="/" className="text-foreground/60 hover:text-foreground transition-colors">{t('home')}</Link>
          <Link to="/paths" className="text-foreground/60 hover:text-foreground transition-colors">{t('paths')}</Link>
          <Link to="/courses" className="text-foreground/60 hover:text-foreground transition-colors">{t('courses')}</Link>
          <Link to="/masterclasses" className="text-foreground/60 hover:text-foreground transition-colors">{t('masterclasses') || 'Masterclasses'}</Link>
        </nav>

        <div className="hidden lg:flex flex-1 max-w-md mx-8">
          <input 
            type="text" 
            placeholder={t('search_placeholder')} 
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-4 ms-auto shrink-0">
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="group flex items-center justify-center gap-2 text-sm font-medium cursor-pointer px-3 py-1.5 rounded-full border shadow-sm bg-background border-border hover:bg-muted transition-all whitespace-nowrap"
              title={t('language')}
            >
              <Globe className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span>{language === 'en' ? 'عربي' : 'English'}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors text-muted-foreground hover:text-foreground shrink-0"
              title={theme === 'light' ? t('dark_mode') : t('light_mode')}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>
          
          {user ? (
            <div className="flex items-center gap-3 ms-1 sm:ms-2">
              {publicProfile && (
                <div className="hidden sm:flex items-center gap-3">
                  <Link to="/leaderboard" className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full cursor-pointer transition-colors" title="Global Leaderboard">
                    <Flame className={cn("w-4 h-4", publicProfile.streak > 2 && "text-orange-500 fill-orange-500 animate-pulse")} />
                    <span className="font-bold text-sm leading-none">{publicProfile.streak}</span>
                  </Link>
                  <Link to="/leaderboard" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full cursor-pointer transition-colors" title="Global Leaderboard">
                    <Trophy className="w-4 h-4" />
                    <span className="font-bold text-sm leading-none">{publicProfile.xp} <span className="text-[10px] uppercase">XP</span></span>
                  </Link>
                </div>
              )}
              
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 focus:outline-none shrink-0"
                >
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                    alt="Profile" 
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border hover:ring-2 hover:ring-primary transition-all"
                    referrerPolicy="no-referrer"
                  />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute end-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl py-1 z-50">
                    <div className="px-4 py-3 border-b border-border mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      
                      {publicProfile && (
                        <div className="flex items-center gap-3 mt-3 sm:hidden">
                          <Link to="/leaderboard" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-1 text-orange-500">
                            <Flame className={cn("w-4 h-4", publicProfile.streak > 2 && "fill-orange-500")} />
                            <span className="font-bold text-xs">{publicProfile.streak}</span>
                          </Link>
                          <Link to="/leaderboard" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-1 text-blue-500">
                            <Trophy className="w-4 h-4" />
                            <span className="font-bold text-xs">{publicProfile.xp} XP</span>
                          </Link>
                        </div>
                      )}
                    </div>
                    
                  <Link 
                    to="/dashboard" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {t('dashboard')}
                  </Link>
                  <Link 
                    to="/certificates" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <Award className="w-4 h-4" />
                    {t('certificates')}
                  </Link>

                  {(user.role === 'admin' || user.role === 'publisher') && (
                    <Link 
                      to="/admin" 
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-amber-500 hover:bg-muted transition-colors"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      Admin Panel
                    </Link>
                  )}
                  
                  <div className="border-t border-border mt-1 pt-1">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-muted transition-colors text-start"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="hidden lg:flex items-center gap-2 px-5 py-2 bg-foreground text-background hover:bg-foreground/90 rounded-full font-bold shadow-sm hover:shadow transition-all active:scale-95 text-sm ms-3 shrink-0"
            >
              <LogIn className="w-4 h-4" />
              <span>{t('login')}</span>
            </button>
          )}

          <button 
            ref={mobileMenuBtnRef}
            className="lg:hidden p-1.5 text-muted-foreground hover:bg-muted rounded-md"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div ref={mobileMenuRef} className="lg:hidden absolute top-16 start-0 end-0 bg-card border-b border-border shadow-xl p-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
            
            <div className="flex gap-2">
              <button
                onClick={toggleLanguage}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-medium cursor-pointer px-4 py-2.5 rounded-xl border shadow-sm bg-background border-border hover:bg-muted transition-all whitespace-nowrap"
              >
                <Globe className="w-4 h-4 text-muted-foreground transition-colors" />
                <span>{language === 'en' ? 'عربي' : 'English'}</span>
              </button>
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-foreground"
              >
                {theme === 'light' ? (
                  <><Moon className="h-4 w-4" /> Dark</>
                ) : (
                  <><Sun className="h-4 w-4" /> Light</>
                )}
              </button>
            </div>
            
            <nav className="flex flex-col gap-1 border-t border-border pt-3">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground font-medium text-sm">{t('home')}</Link>
              <Link to="/paths" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground font-medium text-sm">{t('paths')}</Link>
              <Link to="/courses" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground font-medium text-sm">{t('courses')}</Link>
              <Link to="/masterclasses" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground font-medium text-sm">{t('masterclasses') || 'Masterclasses'}</Link>
            </nav>

            {!user && (
              <div className="border-t border-border pt-4">
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 rounded-lg font-bold shadow-sm transition-all text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t('login')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
    </>
  );
}
