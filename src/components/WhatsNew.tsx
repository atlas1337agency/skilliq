import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  PlayCircle, 
  Layers, 
  BookOpen, 
  Award, 
  Flame, 
  Globe, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  ExternalLink,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

type FilterType = 'all' | 'course' | 'masterclass' | 'path';
type LangFilterType = 'all' | 'ar' | 'en';

export function WhatsNew() {
  const { allCourses, learningPaths, language } = useStore();
  const { i18n } = useTranslation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [newItems, setNewItems] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeLangFilter, setActiveLangFilter] = useState<LangFilterType>('all');

  // Determine current active language
  const currentLang = language === 'ar' || i18n.language === 'ar' ? 'ar' : 'en';
  const isRtl = currentLang === 'ar';

  // Localized dictionary for "What's New" popup
  const dict = {
    en: {
      badge: "Fresh Releases",
      title: "What's New on SkilliQ",
      subtitle: "Explore newly released masterclasses, playlists, and career tracks curated to level up your tech career.",
      filterAll: "All New",
      filterCourses: "Playlists",
      filterMasterclasses: "Masterclasses",
      filterPaths: "Career Tracks",
      allLanguages: "All Languages",
      arabicOnly: "Arabic (عربي)",
      englishOnly: "English Only",
      playlistType: "Playlist",
      masterclassType: "Masterclass",
      pathType: "Career Track",
      lessonsCount: "lessons",
      singleLesson: "Comprehensive Video",
      viewCourse: "Start Learning",
      viewPath: "Explore Track",
      seeMore: "See more items",
      seeAll: "View all updates",
      showLess: "Show less",
      gotIt: "Got it, Explore SkilliQ",
      noResults: "No updates found for this filter.",
      instructor: "Instructor",
      justAdded: "New Release"
    },
    ar: {
      badge: "إصدارات جديدة",
      title: "جديد منصة SkilliQ",
      subtitle: "استكشف أحدث الدورات والماستركلاس والمسارات التقنية المضافة لتطوير مهاراتك ومسارك البرمجي.",
      filterAll: "جميع الإضافات",
      filterCourses: "قوائم التشغيل",
      filterMasterclasses: "ماستركلاس",
      filterPaths: "المسارات المهنية",
      allLanguages: "جميع اللغات",
      arabicOnly: "محتوى عربي 🇸🇦",
      englishOnly: "محتوى إنجليزي 🌐",
      playlistType: "قائمة تشغيل",
      masterclassType: "ماستركلاس مكثف",
      pathType: "مسار مهني معتمد",
      lessonsCount: "درساً",
      singleLesson: "فيديو شامل",
      viewCourse: "ابدأ التعلم",
      viewPath: "استكشف المسار",
      seeMore: "عرض دورات إضافية",
      seeAll: "عرض جميع الإضافات",
      showLess: "عرض أقل",
      gotIt: "فهمت، استكشف المنصة",
      noResults: "لا توجد إضافات تطابق هذا التصنيف حالياً.",
      instructor: "المدرب",
      justAdded: "أُضيفت حديثاً"
    }
  }[currentLang];

  // Helper to test if item contains Arabic script
  const isArabicItem = (item: any): boolean => {
    const rawLang = (item.language || '').toLowerCase().trim();
    if (rawLang === 'arabic' || rawLang === 'ar') return true;
    if (rawLang === 'english' || rawLang === 'en') return false;
    const textToCheck = `${item.title || ''} ${item.instructor || ''} ${item.description || ''}`;
    return /[\u0600-\u06FF]/.test(textToCheck);
  };

  // Build unified item pool
  useEffect(() => {
    const coursesPool = (allCourses || [])
      .filter(c => c && c.isApproved !== false)
      .map(c => ({
        ...c,
        type: c.isSingleVideo ? 'masterclass' : 'course',
        createdAt: c.createdAt || 0
      }));

    const pathsPool = (learningPaths || []).map(p => ({
      ...p,
      type: 'path',
      createdAt: p.createdAt || 0
    }));

    const unified = [...coursesPool, ...pathsPool];
    
    // Sort primarily by createdAt descending
    unified.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    setNewItems(unified);

    // Auto-open logic based on fresh timestamp check
    const lastSeen = localStorage.getItem('lastSeenNewsTimestamp');
    const lastTimestamp = lastSeen ? parseInt(lastSeen, 10) : 0;
    const freshItems = unified.filter(item => (item.createdAt || 0) > lastTimestamp);

    if (freshItems.length > 0) {
      setIsOpen(true);
    }
  }, [allCourses, learningPaths]);

  // Listener for manual opening (e.g. from header, footer or admin preview)
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setShowAll(false);
    };
    window.addEventListener('open-whats-new', handleOpen);
    return () => window.removeEventListener('open-whats-new', handleOpen);
  }, []);

  // Keyboard accessibility: ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close & mark latest as seen
  const handleClose = () => {
    setIsOpen(false);
    if (newItems.length > 0) {
      const topTimestamp = newItems[0].createdAt || Date.now();
      localStorage.setItem('lastSeenNewsTimestamp', topTimestamp.toString());
    }
  };

  // Filter items based on active tabs & language preferences
  const filteredItems = useMemo(() => {
    return newItems.filter(item => {
      // Type filter
      if (activeFilter !== 'all' && item.type !== activeFilter) {
        return false;
      }

      // Language filter
      const isAr = isArabicItem(item);
      if (activeLangFilter === 'ar' && !isAr) return false;
      if (activeLangFilter === 'en' && isAr) return false;

      return true;
    }).sort((a, b) => {
      // When in Arabic UI, prioritize Arabic courses to top
      if (isRtl && activeLangFilter === 'all') {
        const aAr = isArabicItem(a);
        const bAr = isArabicItem(b);
        if (aAr && !bAr) return -1;
        if (!aAr && bAr) return 1;
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [newItems, activeFilter, activeLangFilter, isRtl]);

  // Slice visible items (3 by default, all when expanded)
  const visibleItems = showAll ? filteredItems : filteredItems.slice(0, 3);
  const remainingCount = Math.max(0, filteredItems.length - 3);

  // Counts for filter pills
  const counts = useMemo(() => ({
    all: newItems.length,
    course: newItems.filter(i => i.type === 'course').length,
    masterclass: newItems.filter(i => i.type === 'masterclass').length,
    path: newItems.filter(i => i.type === 'path').length,
  }), [newItems]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Modern frosted backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-md transition-all"
          onClick={handleClose}
          aria-hidden="true"
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className={cn(
            "bg-card w-full max-w-2xl lg:max-w-3xl rounded-3xl border border-border/80 shadow-2xl relative z-10 overflow-hidden flex flex-col my-auto transition-all",
            showAll ? "h-[92vh] sm:h-[88vh]" : "max-h-[92vh]"
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="whats-new-title"
        >
          {/* Ambient top glowing gradient line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-indigo-500 to-purple-600 z-30" />

          {/* Close button with high-accessibility target */}
          <button 
            onClick={handleClose}
            className="absolute top-3.5 sm:top-4 start-auto end-3.5 sm:end-4 w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer z-30 border border-border/50 active:scale-95"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* SMART HEADER */}
          <div className="p-5 sm:p-6 pb-4 sm:pb-5 border-b border-border/70 bg-gradient-to-b from-muted/30 to-transparent shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs relative">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-primary rounded-full animate-ping" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                    {dict.badge}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">·</span>
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    {filteredItems.length} {dict.seeMore.toLowerCase()}
                  </span>
                </div>
                <h2 id="whats-new-title" className="text-lg sm:text-xl md:text-2xl font-black text-foreground tracking-tight">
                  {dict.title}
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl text-start">
              {dict.subtitle}
            </p>

            {/* INTERACTIVE CONTROLS: TYPE FILTER TABS */}
            <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
              {/* Type segmented bar */}
              <div className="flex items-center gap-1 p-1 bg-muted/40 border border-border/70 rounded-xl overflow-x-auto max-w-full">
                <button
                  onClick={() => { setActiveFilter('all'); setShowAll(false); }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                    activeFilter === 'all' 
                      ? "bg-card text-foreground shadow-xs border border-border/60" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {dict.filterAll} ({counts.all})
                </button>
                <button
                  onClick={() => { setActiveFilter('course'); setShowAll(false); }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                    activeFilter === 'course' 
                      ? "bg-card text-foreground shadow-xs border border-border/60" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {dict.filterCourses} ({counts.course})
                </button>
                <button
                  onClick={() => { setActiveFilter('masterclass'); setShowAll(false); }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                    activeFilter === 'masterclass' 
                      ? "bg-card text-foreground shadow-xs border border-border/60" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {dict.filterMasterclasses} ({counts.masterclass})
                </button>
                <button
                  onClick={() => { setActiveFilter('path'); setShowAll(false); }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                    activeFilter === 'path' 
                      ? "bg-card text-foreground shadow-xs border border-border/60" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {dict.filterPaths} ({counts.path})
                </button>
              </div>

              {/* Language quick switcher toggle for content */}
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setActiveLangFilter('all')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer",
                    activeLangFilter === 'all' ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {dict.allLanguages}
                </button>
                <span className="text-border">|</span>
                <button
                  onClick={() => setActiveLangFilter('ar')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1",
                    activeLangFilter === 'ar' ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>🇸🇦</span>
                  <span>{currentLang === 'ar' ? 'عربي' : 'Arabic'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SCROLLABLE ITEMS LIST */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 scrollbar-thin scrollbar-thumb-border/60">
            {visibleItems.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-muted/20 border border-dashed border-border/80">
                <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                <p className="text-xs sm:text-sm font-bold text-foreground">{dict.noResults}</p>
                <button 
                  onClick={() => { setActiveFilter('all'); setActiveLangFilter('all'); }}
                  className="mt-3 px-3 py-1.5 text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  {dict.filterAll}
                </button>
              </div>
            ) : (
              visibleItems.map((item, idx) => {
                const isItemArabic = isArabicItem(item);
                const isPath = item.type === 'path';
                const isMasterclass = item.type === 'masterclass';

                const targetLink = isPath ? `/path/${item.id}` : `/course/${item.id}`;
                const videoCount = item.videos?.length || 0;

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.05 }}
                    key={item.id || idx} 
                    className="group relative p-3 sm:p-4 rounded-2xl border border-border/80 bg-background/60 hover:bg-muted/30 hover:border-primary/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-xs hover:shadow-md"
                  >
                    {/* Media Thumbnail & Badge */}
                    <div className="w-full sm:w-36 md:w-40 aspect-video shrink-0 rounded-xl overflow-hidden bg-muted relative border border-border/60 shadow-xs">
                      {item.thumbnail ? (
                        <img 
                          src={item.thumbnail} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-500/10">
                          {isPath ? <Layers className="w-7 h-7 text-primary" /> : <PlayCircle className="w-7 h-7 text-primary" />}
                        </div>
                      )}

                      {/* Video count / Masterclass chip overlay */}
                      <div className="absolute bottom-1.5 start-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white font-mono text-[9px] font-bold flex items-center gap-1 shadow-sm">
                        {isPath ? (
                          <>
                            <Layers className="w-2.5 h-2.5 text-primary" />
                            <span>{(item.courseIds?.length || 0)} {currentLang === 'ar' ? 'دورات' : 'courses'}</span>
                          </>
                        ) : isMasterclass ? (
                          <>
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            <span>{dict.singleLesson}</span>
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-2.5 h-2.5 text-primary" />
                            <span>{videoCount} {dict.lessonsCount}</span>
                          </>
                        )}
                      </div>

                      {/* Language pill indicator */}
                      {isItemArabic && (
                        <div className="absolute top-1.5 start-1.5 px-1.5 py-0.2 rounded bg-emerald-500/90 text-white text-[9px] font-black shadow-xs">
                          عربي
                        </div>
                      )}
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 min-w-0 text-start w-full">
                      {/* Quiet Unboxed Metadata row */}
                      <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground font-semibold mb-1 flex-wrap">
                        <span className="text-primary font-bold">
                          {isPath ? dict.pathType : isMasterclass ? dict.masterclassType : dict.playlistType}
                        </span>
                        {item.category && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{item.category}</span>
                          </>
                        )}
                        {item.instructor && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-foreground/80 truncate">{item.instructor}</span>
                          </>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-xs sm:text-sm md:text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors tracking-tight">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {item.description || (isRtl ? 'دورة تدريبية متميزة عبر منصة SkilliQ' : 'High quality course available on SkilliQ')}
                      </p>
                    </div>

                    {/* Direct Action Link Button */}
                    <Link 
                      to={targetLink}
                      onClick={handleClose}
                      className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-xs active:scale-98 cursor-pointer mt-2 sm:mt-0"
                    >
                      <span>{isPath ? dict.viewPath : dict.viewCourse}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* STICKY FOOTER ACTIONS */}
          <div className="p-3.5 sm:p-5 border-t border-border/80 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            {/* Show all / Show less toggle */}
            {filteredItems.length > 3 ? (
              <button 
                onClick={() => setShowAll(!showAll)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors py-1 cursor-pointer order-2 sm:order-1"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>{dict.showLess}</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>{dict.seeAll} ({filteredItems.length})</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-xs text-muted-foreground hidden sm:inline order-1">
                SkilliQ · {dict.badge}
              </span>
            )}

            {/* Primary Dismiss Button */}
            <button 
              onClick={handleClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-98 order-1 sm:order-2 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{dict.gotIt}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
