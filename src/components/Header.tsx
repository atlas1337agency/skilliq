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
  ChevronRight,
  User,
  Compass,
  Heart,
  LayoutGrid,
  MessageSquareHeart,
  LifeBuoy
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState, useRef } from 'react';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
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

  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileExploreOpen, setIsMobileExploreOpen] = useState(true);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  const exploreRef = useRef<HTMLDivElement>(null);
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
      if (exploreRef.current && !exploreRef.current.contains(event.target as Node)) {
        setIsExploreOpen(false);
      }
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
      setIsExploreOpen(false);
      setIsDropdownOpen(false);
    };
    window.addEventListener('open-smart-search', handleOpenSearch);
    return () => window.removeEventListener('open-smart-search', handleOpenSearch);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
    setIsDropdownOpen(false);
    setIsExploreOpen(false);
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
            return;
          }
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
  }, [setUser, loadProgress, loadFavorites]);

  // Listen for unread support ticket replies from Admin
  useEffect(() => {
    if (!user?.uid) {
      setUnreadSupportCount(0);
      return;
    }
    const q = query(collection(db, 'support_tickets'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const count = snap.docs.filter((d) => d.data().unreadByUser === true).length;
      setUnreadSupportCount(count);
    }, () => {});
    return () => unsub();
  }, [user?.uid]);

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
      const currentName = user?.displayName || user?.email?.split('@')[0] || '';
      await signOut(auth);
      setIsDropdownOpen(false);
      setIsMobileMenuOpen(false);
      window.dispatchEvent(
        new CustomEvent('skilliq-auth-feedback', {
          detail: {
            type: 'logout',
            userName: currentName,
          },
        })
      );
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  // Nav Links helper for active state
  const isNavActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const exploreItems = [
    {
      to: '/paths',
      label: t('paths', 'Paths'),
      desc: isRtl ? 'مسارات مهنية منظمة من الصفر للاحتراف' : 'Structured roadmaps from zero to mastery',
      icon: Layers,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      to: '/courses',
      label: t('courses', 'Courses'),
      desc: isRtl ? 'قوائم تشغيل تعليمية متكاملة ومختارة' : 'Multi-lesson curated video playlists',
      icon: BookOpen,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      to: '/projects',
      label: isRtl ? 'المشاريع العملية (Projects)' : t('projects', 'Projects'),
      desc: isRtl ? 'بناء مشاريع وتطبيقات حقيقية خطوة بخطوة (تطبيق عملي)' : 'Hands-on real project builds (playlists & full builds)',
      icon: Sparkles,
      color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
    },
    {
      to: '/masterclasses',
      label: t('masterclasses', 'Masterclasses'),
      desc: isRtl ? 'جلسات مكثفة وشاملة في فيديو واحد' : 'Single-session comprehensive deep dives',
      icon: Sparkles,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    },
    {
      to: '/books',
      label: isRtl ? 'الكتب' : 'Books',
      desc: isRtl ? 'أفضل الكتب التقنية والفكرية المشروحة' : 'Essential tech & mindset books explained',
      icon: Compass,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
  ];

  const isAnyExploreActive = exploreItems.some((item) => isNavActive(item.to));
  const activeExploreItem = exploreItems.find((item) => isNavActive(item.to));

  return (
    <>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* MOBILE SMART SEARCH MODAL */}
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
          
          {/* START: BRAND LOGO + DESKTOP NAVIGATION */}
          <div className="flex items-center gap-2 lg:gap-4 shrink-0">
            <Link to="/" className="flex items-center py-1 group cursor-pointer">
              <img
                key={isDark ? 'dark' : 'light'}
                src={isDark ? '/images/logo_dark.png' : '/images/logo_light.png'}
                alt="Skilliq"
                className="h-9 sm:h-11 md:h-12 w-auto max-w-[145px] sm:max-w-[200px] md:max-w-[230px] object-contain transition-transform duration-200 group-hover:scale-105"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('/public/images/')) {
                    target.src = isDark ? '/public/images/logo_dark.png' : '/public/images/logo_light.png';
                  }
                }}
              />
            </Link>

            {/* DESKTOP / LAPTOP CLEAN NAVIGATION: HOME + EXPLORE DROPDOWN */}
            <nav className="hidden lg:flex items-center gap-1.5 text-sm font-medium ms-1 shrink-0">
              <Link
                to="/"
                className={cn(
                  "px-3.5 py-2 rounded-xl transition-all duration-150 text-xs sm:text-sm font-semibold flex items-center gap-1.5",
                  isNavActive('/')
                    ? "text-primary bg-primary/10 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                )}
              >
                <HomeIcon className="w-4 h-4" />
                <span>{t('home', 'Home')}</span>
              </Link>

              {/* PRIVATE COMMUNITY LINK (ONLY VISIBLE WHEN USER IS LOGGED IN) */}
              {user && (
                <Link
                  to="/community"
                  className={cn(
                    "px-3.5 py-2 rounded-xl transition-all duration-150 text-xs sm:text-sm font-semibold flex items-center gap-1.5",
                    isNavActive('/community')
                      ? "text-primary bg-primary/10 shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  )}
                >
                  <MessageSquareHeart className="w-4 h-4 text-primary" />
                  <span>{isRtl ? 'المجتمع' : 'Community'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </Link>
              )}

              {/* MODERN EXPLORE DROPDOWN MENU (Paths, Courses, Masterclasses, Books) */}
              <div className="relative" ref={exploreRef}>
                <button
                  type="button"
                  onClick={() => setIsExploreOpen(!isExploreOpen)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl transition-all duration-150 text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer border",
                    isAnyExploreActive || isExploreOpen
                      ? "text-primary bg-primary/10 border-primary/20 shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70 border-transparent"
                  )}
                  aria-expanded={isExploreOpen}
                  aria-haspopup="true"
                >
                  <LayoutGrid className="w-4 h-4 text-primary" />
                  <span>
                    {activeExploreItem
                      ? activeExploreItem.label
                      : isRtl
                      ? 'استكشف التعلم'
                      : 'Explore'}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 transition-transform duration-200",
                      isExploreOpen && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence>
                  {isExploreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute start-0 mt-2.5 w-80 sm:w-96 bg-card/95 backdrop-blur-2xl border border-border/80 rounded-3xl shadow-2xl p-2.5 z-50 overflow-hidden text-start"
                    >
                      <div className="px-3 py-2 mb-1 border-b border-border/50 flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                          {isRtl ? 'كتالوج التعلم المنظم' : 'Learning Catalog'}
                        </span>
                        <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {isRtl ? 'مجاني 100%' : '100% Free'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-1">
                        {exploreItems.map((item) => {
                          const Icon = item.icon;
                          const active = isNavActive(item.to);
                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setIsExploreOpen(false)}
                              className={cn(
                                "group flex items-start gap-3.5 p-3 rounded-2xl transition-all duration-150",
                                active
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-muted/80 text-foreground"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-105",
                                  item.color
                                )}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                    {item.label}
                                  </span>
                                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 rtl:rotate-180 transition-all" />
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {item.desc}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>
          </div>

          {/* CENTER: TABLET / LAPTOP SMART SEARCH BAR */}
          <div className="hidden md:flex flex-1 min-w-[200px] max-w-md lg:max-w-lg mx-2 sm:mx-4">
            <SmartSearch mode="inline" className="w-full" />
          </div>

          {/* END: CLEAN CONTROLS & USER PROFILE DROPDOWN */}
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

            {/* LANGUAGE SWITCHER PILL */}
            <button
              onClick={toggleLanguage}
              className="group flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer px-2.5 sm:px-3 py-1.5 rounded-full border border-border/80 bg-card hover:bg-muted shadow-2xs transition-all whitespace-nowrap text-foreground"
              title={isRtl ? 'Switch to English' : 'التبديل إلى العربية'}
              aria-label="Toggle language"
            >
              <Globe className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              <span>{language === 'en' ? 'عربي' : 'EN'}</span>
            </button>

            {/* GAMIFICATION STREAK & XP (Desktop) */}
            {user && publicProfile && (
              <div className="hidden xl:flex items-center gap-1.5">
                <Link 
                  to="/leaderboard" 
                  className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20 cursor-pointer transition-colors text-xs font-bold" 
                  title={isRtl ? 'سلسلة التعلم اليومية' : 'Daily Learning Streak'}
                >
                  <Flame className={cn("w-3.5 h-3.5", publicProfile.streak > 2 && "text-amber-500 fill-amber-500 animate-pulse")} />
                  <span>{publicProfile.streak}</span>
                </Link>
                <Link 
                  to="/leaderboard" 
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full border border-blue-500/20 cursor-pointer transition-colors text-xs font-bold" 
                  title={isRtl ? 'نقاط الخبرة XP' : 'Total XP Points'}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{publicProfile.xp} <span className="text-[9px] uppercase">XP</span></span>
                </Link>
              </div>
            )}

            {/* USER PROFILE DROPDOWN MENU (Contains Theme, Favorites, What's New, Profile Links) */}
            <div className="relative" ref={dropdownRef}>
              {user ? (
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="relative flex items-center gap-1.5 p-1 ps-1.5 pe-2 rounded-full border border-border/80 bg-card hover:bg-muted/70 hover:border-primary/40 transition-all focus:outline-none shrink-0 cursor-pointer shadow-2xs"
                  aria-label="User profile menu"
                >
                  <div className="relative">
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}`} 
                      alt={user.displayName || 'Profile'} 
                      className="w-8 h-8 rounded-full border border-border object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-background" />
                  </div>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-200", isDropdownOpen && "rotate-180")} />
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="relative flex items-center gap-1 p-2 rounded-full border border-border/80 bg-card hover:bg-muted text-foreground transition-all cursor-pointer shadow-2xs"
                    aria-label="User preferences menu"
                    title={isRtl ? 'القائمة والمظهر' : 'Menu & Preferences'}
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform duration-200", isDropdownOpen && "rotate-180")} />
                    <span className="absolute -top-0.5 -end-0.5 w-2 h-2 bg-primary rounded-full" />
                  </button>

                  <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <LogIn className="w-3.5 h-3.5 rtl:rotate-180" />
                    <span>{t('login')}</span>
                  </button>
                </div>
              )}

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    {/* Mobile backdrop for clean tap-outside dismissal */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsDropdownOpen(false)}
                      className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] sm:hidden"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="fixed sm:absolute inset-x-3 sm:inset-x-auto top-[4.25rem] sm:top-full sm:end-0 sm:mt-2.5 w-auto sm:w-76 md:w-80 max-h-[calc(100dvh-5rem)] overflow-y-auto bg-card/98 backdrop-blur-2xl border border-border/80 rounded-3xl shadow-2xl py-2 z-50 text-start"
                    >
                    {/* User Header Card */}
                    {user ? (
                      <div className="px-4 py-3 border-b border-border/60 bg-muted/30">
                        <div className="flex items-center gap-3">
                          <img 
                            src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}`} 
                            alt={user.displayName || 'Profile'} 
                            className="w-10 h-10 rounded-full border border-border object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground truncate">{user.displayName || 'Learner'}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                          </div>
                        </div>
                        
                        {/* Streak & XP inside profile card */}
                        {publicProfile && (
                          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-border/40">
                            <Link 
                              to="/leaderboard" 
                              onClick={() => setIsDropdownOpen(false)} 
                              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 py-1 px-2 rounded-lg transition-colors"
                            >
                              <Flame className={cn("w-3.5 h-3.5", publicProfile.streak > 2 && "fill-amber-500")} />
                              <span>{publicProfile.streak} {isRtl ? 'يوم' : 'd'}</span>
                            </Link>
                            <Link 
                              to="/leaderboard" 
                              onClick={() => setIsDropdownOpen(false)} 
                              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 py-1 px-2 rounded-lg transition-colors"
                            >
                              <Trophy className="w-3.5 h-3.5" />
                              <span>{publicProfile.xp} XP</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="px-4 py-3 border-b border-border/60 bg-muted/30 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {isRtl ? 'مرحباً بك في Skilliq' : 'Welcome to Skilliq'}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {isRtl ? 'سجل الدخول لحفظ تقدمك' : 'Sign in to track your progress'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setIsAuthModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer shrink-0"
                        >
                          {t('login')}
                        </button>
                      </div>
                    )}

                    {/* Main Profile Navigation Links */}
                    <div className="p-1.5 space-y-0.5">
                      {user && (
                        <>
                          <Link 
                            to="/dashboard" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/80 rounded-xl transition-colors"
                          >
                            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <LayoutDashboard className="w-4 h-4" />
                            </div>
                            <span>{t('dashboard')}</span>
                          </Link>

                          <Link 
                            to="/community" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/80 rounded-xl transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                <MessageSquareHeart className="w-4 h-4" />
                              </div>
                              <span>{isRtl ? 'مجتمع الأعضاء الخاص' : 'Private Community'}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                              {isRtl ? 'حصري' : 'VIP'}
                            </span>
                          </Link>

                          <Link 
                            to="/support" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/80 rounded-xl transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                <LifeBuoy className="w-4 h-4" />
                              </div>
                              <span>{isRtl ? 'تذاكر الدعم الفني' : 'Support Tickets'}</span>
                            </div>
                            {unreadSupportCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[10px] animate-pulse">
                                {unreadSupportCount} {isRtl ? 'رد' : 'Reply'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                                {isRtl ? 'مباشر' : 'Help'}
                              </span>
                            )}
                          </Link>
                        </>
                      )}

                      {/* FAVORITE BUTTON INSIDE PROFILE DROPDOWN */}
                      <Link 
                        to="/dashboard" 
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setTimeout(() => {
                            document.getElementById('saved-favorites-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 150);
                        }}
                        className="flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/80 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                            <Heart className={cn("w-4 h-4", savedFavoritesCount > 0 && "fill-current")} />
                          </div>
                          <span>{isRtl ? 'المفضلة والعناصر المحفوظة' : 'Saved & Favorites'}</span>
                        </div>
                        {savedFavoritesCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px]">
                            {savedFavoritesCount > 99 ? '99+' : savedFavoritesCount}
                          </span>
                        )}
                      </Link>

                      {/* WHAT'S NEW BUTTON INSIDE PROFILE DROPDOWN */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          window.dispatchEvent(new CustomEvent('open-whats-new'));
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/80 rounded-xl transition-colors cursor-pointer text-start"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 relative">
                            <Sparkles className="w-4 h-4" />
                            <span className="absolute -top-0.5 -end-0.5 w-2 h-2 bg-primary rounded-full animate-ping" />
                          </div>
                          <span>{isRtl ? 'ما الجديد في المنصة؟' : "What's New"}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                          {isRtl ? 'جديد' : 'NEW'}
                        </span>
                      </button>

                      {/* LIGHT / DARK MODE BUTTON INSIDE PROFILE DROPDOWN */}
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/80 rounded-xl transition-colors cursor-pointer text-start"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                            {theme === 'light' ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
                          </div>
                          <span>{theme === 'light' ? t('dark_mode', 'Dark Mode') : t('light_mode', 'Light Mode')}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-muted border border-border/60 text-[10px] font-bold text-muted-foreground">
                          {theme === 'light' ? (isRtl ? 'داكن' : 'Dark') : (isRtl ? 'فاتح' : 'Light')}
                        </span>
                      </button>

                      {user && (
                        <Link 
                          to="/certificates" 
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/80 rounded-xl transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                            <Award className="w-4 h-4" />
                          </div>
                          <span>{t('certificates')}</span>
                        </Link>
                      )}

                      <Link 
                        to="/leaderboard" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/80 rounded-xl transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <span>{isRtl ? 'لوحة المتصدرين' : 'Global Leaderboard'}</span>
                      </Link>

                      {user && (user.role === 'admin' || user.role === 'publisher') && (
                        <Link 
                          to="/admin" 
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <span>{isRtl ? 'لوحة الإدارة' : 'Admin Panel'}</span>
                        </Link>
                      )}
                    </div>

                    {/* Logout Action */}
                    {user && (
                      <div className="border-t border-border/60 p-1.5 mt-1">
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors text-start cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                            <LogOut className="w-4 h-4 rtl:rotate-180" />
                          </div>
                          <span>{t('logout')}</span>
                        </button>
                      </div>
                    )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* MOBILE & TABLET MENU TOGGLE BUTTON */}
            <button 
              ref={mobileMenuBtnRef}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-colors cursor-pointer"
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
              className="lg:hidden border-t border-border/70 bg-card/95 backdrop-blur-2xl shadow-2xl px-4 py-5 overflow-hidden"
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
              <nav className="flex flex-col gap-1.5 mb-4">
                <Link 
                  to="/" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all",
                    isNavActive('/') 
                      ? "bg-primary/10 text-primary" 
                      : "text-foreground/80 hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <HomeIcon className="w-4 h-4 text-primary" />
                    <span>{t('home', 'Home')}</span>
                  </div>
                  {isNavActive('/') && <span className="w-2 h-2 rounded-full bg-primary" />}
                </Link>

                {/* PRIVATE COMMUNITY IN MOBILE DRAWER (ONLY VISIBLE WHEN LOGGED IN) */}
                {user && (
                  <>
                    <Link 
                      to="/community" 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all",
                        isNavActive('/community') 
                          ? "bg-primary/10 text-primary" 
                          : "text-foreground/80 hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <MessageSquareHeart className="w-4 h-4 text-emerald-500" />
                        <span>{isRtl ? 'مجتمع الأعضاء الخاص' : 'Private Community'}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                        {isRtl ? 'حصري' : 'Members'}
                      </span>
                    </Link>

                    <Link 
                      to="/support" 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all",
                        isNavActive('/support') 
                          ? "bg-primary/10 text-primary" 
                          : "text-foreground/80 hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <LifeBuoy className="w-4 h-4 text-blue-500" />
                        <span>{isRtl ? 'تذاكر الدعم الفني' : 'Support Tickets'}</span>
                      </div>
                      {unreadSupportCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold animate-pulse">
                          {unreadSupportCount} {isRtl ? 'رد جديد' : 'New Reply'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                          {isRtl ? 'مباشر' : 'Help'}
                        </span>
                      )}
                    </Link>
                  </>
                )}

                {/* Collapsible Explore Section in Mobile/Tablet Menu */}
                <div className="rounded-2xl border border-border/70 bg-muted/20 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setIsMobileExploreOpen(!isMobileExploreOpen)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 font-bold text-sm text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <LayoutGrid className="w-4 h-4 text-primary" />
                      <span>{isRtl ? 'استكشف (المسارات، الدورات، الكتب)' : 'Explore Catalog'}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform duration-200",
                        isMobileExploreOpen && "rotate-180"
                      )}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isMobileExploreOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="p-2 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5 border-t border-border/50"
                      >
                        {exploreItems.map((item) => {
                          const Icon = item.icon;
                          const active = isNavActive(item.to);
                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={cn(
                                "flex items-center gap-3 p-2.5 rounded-xl transition-all",
                                active
                                  ? "bg-primary/10 text-primary"
                                  : "bg-card/70 hover:bg-muted text-foreground"
                              )}
                            >
                              <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center shrink-0", item.color)}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1 text-start">
                                <p className="text-xs font-bold truncate">{item.label}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>

              {/* Profile & Quick Actions in Mobile Drawer */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/60">
                <button
                  onClick={toggleTheme}
                  className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold py-2.5 px-2 rounded-xl border border-border bg-background hover:bg-muted transition-colors cursor-pointer text-foreground"
                >
                  {theme === 'light' ? (
                    <><Moon className="h-4 w-4 text-slate-700" /> <span>{t('dark_mode')}</span></>
                  ) : (
                    <><Sun className="h-4 w-4 text-amber-400" /> <span>{t('light_mode')}</span></>
                  )}
                </button>

                <Link
                  to="/dashboard"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setTimeout(() => {
                      document.getElementById('saved-favorites-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 150);
                  }}
                  className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold py-2.5 px-2 rounded-xl border border-border bg-background hover:bg-muted transition-colors text-foreground relative"
                >
                  <Heart className={cn("h-4 w-4 text-rose-500", savedFavoritesCount > 0 && "fill-current")} />
                  <span>{isRtl ? 'المفضلة' : 'Favorites'}</span>
                  {savedFavoritesCount > 0 && (
                    <span className="absolute top-1.5 end-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                      {savedFavoritesCount}
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    window.dispatchEvent(new CustomEvent('open-whats-new'));
                  }}
                  className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold py-2.5 px-2 rounded-xl border border-border bg-background hover:bg-muted transition-colors cursor-pointer text-foreground relative"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>{isRtl ? 'ما الجديد' : "What's New"}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
