import { useTranslation } from 'react-i18next';
import { isSuperAdminEmail } from '../lib/admin';
import { useStore } from '../store/useStore';
import { 
  Moon, 
  Sun, 
  LogIn, 
  LogOut, 
  LayoutDashboard, 
  Award, 
  Home as HomeIcon, 
  BookOpen, 
  Menu, 
  X, 
  ShieldAlert, 
  Flame, 
  Trophy, 
  Globe, 
  Sparkles,
  Search,
  Layers,
  ChevronDown,
  User,
  Compass,
  Heart
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState, useRef } from 'react';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { initializeOrUpdateProfile } from '../lib/gamification';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AuthModal } from './AuthModal';
import { SmartSearch } from './SmartSearch';

export function Header() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { 
    theme, 
    language, 
    setTheme, 
    setLanguage, 
    user, 
    setUser, 
    loadProgress,
    loadFavorites,
    favorites,
    publicProfile, 
    isAuthModalOpen, 
    setIsAuthModalOpen 
  } = useStore();
  const savedFavoritesCount = Object.keys(favorites || {}).length;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);

  const isRtl = language === 'ar' || i18n.language === 'ar';
  const isDark = theme === 'dark';

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Click outside listener for dropdowns and mobile menu
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

  // Listen for mobile search open event (e.g. from Cmd+K on small screens)
  useEffect(() => {
    const handleOpenSearch = () => {
      setIsMobileSearchOpen(true);
      setIsMobileMenuOpen(false);
    };
    window.addEventListener('open-smart-search', handleOpenSearch);
    return () => window.removeEventListener('open-smart-search', handleOpenSearch);
  }, []);

  // Close mobile menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
    setIsDropdownOpen(false);
  }, [location.pathname]);

  // Firebase auth state subscription & profile sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, `users/${currentUser.uid}`);
        let userSnap = await getDoc(userRef);
        let role = 'student';
        
        if (!userSnap.exists()) {
          role = isSuperAdminEmail(currentUser.email) ? 'admin' : 'student';
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
          if (isSuperAdminEmail(currentUser.email) && role !== 'admin') {
            role = 'admin';
            try {
              const { updateDoc } = await import('firebase/firestore');
              await updateDoc(userRef, { role: 'admin' });
            } catch (e) {
              console.error("Failed to upgrade admin role", e);
            }
          }
        }

        const enhancedUser = { ...currentUser, role };
        setUser(enhancedUser);
        loadProgress();
        loadFavorites();

        try {
          const prof = await initializeOrUpdateProfile({
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            email: currentUser.email
          });
          if (prof) {
            useStore.setState({ publicProfile: prof });
          }
        } catch (profErr) {
          console.error("Error syncing public profile", profErr);
        }
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
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
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

  // Nav Links helper for active state
  const isNavActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { to: '/', label: t('home'), icon: HomeIcon },
    { to: '/paths', label: t('paths'), icon: Layers },
    { to: '/courses', label: t('courses'), icon: BookOpen },
    { to: '/masterclasses', label: t('masterclasses') || 'Masterclasses', icon: Sparkles },
    { to: '/books', label: isRtl ? 'الكتب' : 'Books', icon: Compass }
  ];

  return (
    <>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* MOBILE SMART SEARCH MODAL (NO INLINE BAR) */}
      <SmartSearch 
        mode="modal"
        isMobileModalOpen={isMobileSearchOpen}
        onCloseMobileModal={() => setIsMobileSearchOpen(false)}
      />

      <header 
        dir={isRtl ? 'rtl' : 'ltr'}
        className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 dark:bg-background/80 backdrop-blur-xl transition-all shadow-2xs"
      >
        <div className="max-w-7xl mx-auto flex h-16 sm:h-18 lg:h-20 items-center justify-between px-3 sm:px-6 lg:px-8 gap-2 sm:gap-4 relative">
          
          {/* START: BRAND LOGO */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center py-1 group cursor-pointer">
              <img
                key={isDark ? 'dark' : 'light'}
                src={isDark ? '/images/logo_dark.png' : '/images/logo_light.png'}
                alt="Skilliq"
                className="h-9 sm:h-11 md:h-12 w-auto max-w-[150px] sm:max-w-[210px] md:max-w-[240px] object-contain transition-transform duration-200 group-hover:scale-105"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('/public/images/')) {
                    target.src = isDark ? '/public/images/logo_dark.png' : '/public/images/logo_light.png';
                  }
                }}
              />
            </Link>
          </div>

          {/* CENTER-LEFT: DESKTOP PRIMARY NAVIGATION LINKS */}
          <nav className="hidden xl:flex items-center gap-1 text-sm font-medium ms-2 shrink-0">
            {navLinks.map((link) => {
              const active = isNavActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "px-3 py-1.5 rounded-xl transition-all duration-150 relative text-xs sm:text-sm font-semibold flex items-center gap-1.5",
                    active 
                      ? "text-primary bg-primary/10 shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  )}
                >
                  <span>{link.label}</span>
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* TABLET / LAPTOP SMART SEARCH BAR (RESPONSIVE SIZING) */}
          <div className="hidden md:flex flex-1 min-w-[220px] max-w-sm lg:max-w-md xl:max-w-lg mx-2 sm:mx-4">
            <SmartSearch mode="inline" className="w-full" />
          </div>

          {/* END: CONTROLS, GAMIFICATION & USER PROFILE */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 ms-auto shrink-0">
            
            {/* MOBILE ONLY: SMART SEARCH TRIGGER BUTTON */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(true)}
              className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title={isRtl ? 'بحث ذكي' : 'Smart Search'}
              aria-label="Open search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* LANGUAGE SWITCHER PILL (ALWAYS AVAILABLE & EASY TO TAP) */}
            <button
              onClick={toggleLanguage}
              className="group flex items-center justify-center gap-1 sm:gap-1.5 text-xs font-semibold cursor-pointer px-2.5 sm:px-3 py-1.5 rounded-full border border-border/80 bg-card hover:bg-muted shadow-2xs transition-all whitespace-nowrap text-foreground"
              title={isRtl ? 'Switch to English' : 'التبديل إلى العربية'}
              aria-label="Toggle language"
            >
              <Globe className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              <span>{language === 'en' ? 'عربي' : 'EN'}</span>
            </button>

            {/* THEME TOGGLE */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground border border-border/50 shrink-0 cursor-pointer"
              title={theme === 'light' ? t('dark_mode') : t('light_mode')}
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* SAVED / FAVORITES QUICK ACCESS BUTTON */}
            <Link
              to="/dashboard"
              onClick={() => {
                setTimeout(() => {
                  document.getElementById('saved-favorites-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 150);
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center transition-colors text-rose-500 shrink-0 relative cursor-pointer border border-rose-500/20"
              title={isRtl ? 'المفضلة والعناصر المحفوظة' : 'Saved & Favorites'}
              aria-label={isRtl ? 'المفضلة والعناصر المحفوظة' : 'Saved & Favorites'}
            >
              <Heart className={cn("h-4 w-4", savedFavoritesCount > 0 && "fill-current")} />
              {savedFavoritesCount > 0 && (
                <span className="absolute -top-1 -end-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {savedFavoritesCount > 99 ? '99+' : savedFavoritesCount}
                </span>
              )}
            </Link>

            {/* WHAT'S NEW TRIGGER */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-whats-new'))}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors text-primary shrink-0 relative cursor-pointer border border-primary/20"
              title={language === 'ar' ? 'ما الجديد؟' : "What's New!"}
              aria-label="What's New"
            >
              <Sparkles className="h-4 w-4" />
              <span className="absolute -top-0.5 -end-0.5 w-2 h-2 bg-primary rounded-full animate-ping" />
            </button>

            {/* USER PROFILE & STATS */}
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3 ms-1">
                {/* Gamification Streak & XP (Desktop & Tablet) */}
                {publicProfile && (
                  <div className="hidden lg:flex items-center gap-2">
                    <Link 
                      to="/leaderboard" 
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20 cursor-pointer transition-colors text-xs font-bold" 
                      title={isRtl ? 'سلسلة التعلم اليومية' : 'Daily Learning Streak'}
                    >
                      <Flame className={cn("w-3.5 h-3.5", publicProfile.streak > 2 && "text-amber-500 fill-amber-500 animate-pulse")} />
                      <span>{publicProfile.streak}</span>
                    </Link>
                    <Link 
                      to="/leaderboard" 
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full border border-blue-500/20 cursor-pointer transition-colors text-xs font-bold" 
                      title={isRtl ? 'نقاط الخبرة XP' : 'Total XP Points'}
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>{publicProfile.xp} <span className="text-[9px] uppercase">XP</span></span>
                    </Link>
                  </div>
                )}

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-primary/40 transition-all focus:outline-none shrink-0 cursor-pointer"
                    aria-label="User profile menu"
                  >
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}`} 
                      alt={user.displayName || 'Profile'} 
                      className="w-8 h-8 rounded-full border border-border object-cover shadow-2xs"
                      referrerPolicy="no-referrer"
                    />
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute end-0 mt-2 w-64 bg-card/95 backdrop-blur-2xl border border-border/80 rounded-2xl shadow-xl py-1.5 z-50 overflow-hidden text-start"
                      >
                        {/* User Card */}
                        <div className="px-4 py-3 border-b border-border/60 bg-muted/30">
                          <p className="text-sm font-bold text-foreground truncate">{user.displayName || 'Learner'}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                          
                          {/* Streak & XP for mobile dropdown */}
                          {publicProfile && (
                            <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-border/40">
                              <Link 
                                to="/leaderboard" 
                                onClick={() => setIsDropdownOpen(false)} 
                                className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md"
                              >
                                <Flame className={cn("w-3.5 h-3.5", publicProfile.streak > 2 && "fill-amber-500")} />
                                <span>{publicProfile.streak} {isRtl ? 'يوم' : 'd'}</span>
                              </Link>
                              <Link 
                                to="/leaderboard" 
                                onClick={() => setIsDropdownOpen(false)} 
                                className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md"
                              >
                                <Trophy className="w-3.5 h-3.5" />
                                <span>{publicProfile.xp} XP</span>
                              </Link>
                            </div>
                          )}
                        </div>

                        {/* Dropdown Links */}
                        <div className="p-1 space-y-0.5">
                          <Link 
                            to="/dashboard" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/80 rounded-xl transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-primary" />
                            <span>{t('dashboard')}</span>
                          </Link>

                          <Link 
                            to="/dashboard" 
                            onClick={() => {
                              setIsDropdownOpen(false);
                              setTimeout(() => {
                                document.getElementById('saved-favorites-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }, 150);
                            }}
                            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/80 rounded-xl transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                              <span>{isRtl ? 'المفضلة والمحفوظات' : 'Saved & Favorites'}</span>
                            </div>
                            {savedFavoritesCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-500 font-bold text-[10px]">
                                {savedFavoritesCount}
                              </span>
                            )}
                          </Link>

                          <Link 
                            to="/certificates" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/80 rounded-xl transition-colors"
                          >
                            <Award className="w-4 h-4 text-emerald-500" />
                            <span>{t('certificates')}</span>
                          </Link>

                          {(user.role === 'admin' || user.role === 'publisher') && (
                            <Link 
                              to="/admin" 
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors"
                            >
                              <ShieldAlert className="w-4 h-4 text-amber-500" />
                              <span>{isRtl ? 'لوحة الإدارة' : 'Admin Panel'}</span>
                            </Link>
                          )}
                        </div>

                        {/* Logout Action */}
                        <div className="border-t border-border/60 p-1 mt-1">
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors text-start cursor-pointer"
                          >
                            <LogOut className="w-4 h-4 rtl:rotate-180" />
                            <span>{t('logout')}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              /* MODERN SIGN IN CTA BUTTON */
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{t('login')}</span>
              </button>
            )}

            {/* MOBILE & TABLET MENU TOGGLE BUTTON */}
            <button 
              ref={mobileMenuBtnRef}
              className="xl:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-colors cursor-pointer"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* MOBILE & TABLET ANIMATED MENU DRAWER */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              ref={mobileMenuRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="xl:hidden border-t border-border/70 bg-card/95 backdrop-blur-2xl shadow-2xl px-4 py-5 overflow-hidden"
            >
              {/* Quick Search Trigger in Drawer */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsMobileSearchOpen(true);
                }}
                className="w-full mb-3 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-muted/60 hover:bg-muted border border-border/70 text-muted-foreground hover:text-foreground text-xs font-medium cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" />
                  <span>{isRtl ? 'ابحث عن الدورات والمسارات...' : 'Search courses & paths...'}</span>
                </div>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-card border border-border/60 rounded">
                  {isRtl ? 'بحث' : 'Search'}
                </kbd>
              </button>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-1 mb-4">
                {navLinks.map((link) => {
                  const active = isNavActive(link.to);
                  const Icon = link.icon;
                  return (
                    <Link 
                      key={link.to} 
                      to={link.to} 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all",
                        active 
                          ? "bg-primary/10 text-primary" 
                          : "text-foreground/80 hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-primary" />
                        <span>{link.label}</span>
                      </div>
                      {active && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </Link>
                  );
                })}

                <Link
                  to="/dashboard"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setTimeout(() => {
                      document.getElementById('saved-favorites-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 150);
                  }}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm text-foreground/80 hover:bg-muted/70 hover:text-foreground transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                    <span>{isRtl ? 'المفضلة والعناصر المحفوظة' : 'Saved & Favorites'}</span>
                  </div>
                  {savedFavoritesCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-bold">
                      {savedFavoritesCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/leaderboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm text-foreground/80 hover:bg-muted/70 hover:text-foreground transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>{isRtl ? 'لوحة المتصدرين' : 'Global Leaderboard'}</span>
                  </div>
                </Link>
              </nav>

              {/* Quick Settings: Language & Theme Grid */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/60">
                <button
                  onClick={toggleLanguage}
                  className="flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-3 rounded-xl border border-border bg-background hover:bg-muted transition-colors cursor-pointer text-foreground"
                >
                  <Globe className="w-4 h-4 text-primary" />
                  <span>{language === 'en' ? 'النسخة العربية' : 'English Version'}</span>
                </button>
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-3 rounded-xl border border-border bg-background hover:bg-muted transition-colors cursor-pointer text-foreground"
                >
                  {theme === 'light' ? (
                    <><Moon className="h-4 w-4" /> <span>{t('dark_mode')}</span></>
                  ) : (
                    <><Sun className="h-4 w-4 text-amber-400" /> <span>{t('light_mode')}</span></>
                  )}
                </button>
              </div>

              {/* User Actions */}
              {user ? (
                <div className="pt-3 mt-3 border-t border-border/60 space-y-1">
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <LayoutDashboard className="w-4 h-4 text-primary" />
                    <span>{t('dashboard')}</span>
                  </Link>
                  <Link
                    to="/certificates"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <Award className="w-4 h-4 text-emerald-500" />
                    <span>{t('certificates')}</span>
                  </Link>
                  {(user.role === 'admin' || user.role === 'publisher') && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      <span>{isRtl ? 'لوحة الإدارة' : 'Admin Panel'}</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 cursor-pointer text-start"
                  >
                    <LogOut className="w-4 h-4 rtl:rotate-180" />
                    <span>{t('logout')}</span>
                  </button>
                </div>
              ) : (
                <div className="pt-3 mt-3 border-t border-border/60">
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl font-bold text-sm shadow-xs transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 rtl:rotate-180" />
                    <span>{t('login')}</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
