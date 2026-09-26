import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Play, 
  Pause, 
  Check, 
  Layers, 
  Search, 
  X, 
  Award, 
  ShieldCheck, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Flame,
  Star,
  Zap,
  Shuffle,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { courses as fallbackCourses, Course } from '../data/courses';
import { filterByLanguage } from '../lib/utils';

export function HeroSection() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { language, courses: storeCourses } = useStore();
  
  // Current language determination
  const currentAppLang: 'en' | 'ar' = (language === 'ar' || i18n.language === 'ar') ? 'ar' : 'en';
  const isRtl = currentAppLang === 'ar';

  const coursesList = (storeCourses && storeCourses.length > 0) ? storeCourses : fallbackCourses;

  // STRICT LANGUAGE FILTERING:
  // Arabic version strictly shows Arabic courses, English version strictly shows English courses
  const filteredCoursesForLang = useMemo(() => {
    const filtered = filterByLanguage(coursesList, currentAppLang);
    return filtered.length > 0 ? filtered : coursesList;
  }, [coursesList, currentAppLang]);

  // Dynamically extract real categories present in current language courses
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    filteredCoursesForLang.forEach(c => {
      if (c.category && c.category.trim()) cats.add(c.category.trim());
    });
    return ['All', ...Array.from(cats)];
  }, [filteredCoursesForLang]);

  // Selected category in smart showcase card
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeCourseIndex, setActiveCourseIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isAutoSwitchEnabled, setIsAutoSwitchEnabled] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [switchProgress, setSwitchProgress] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<number>(1); // 1 = forward, -1 = backward

  const courseListScrollRef = useRef<HTMLDivElement>(null);

  // Sync category if it doesn't exist in current language
  useEffect(() => {
    if (!availableCategories.includes(selectedCategory)) {
      setSelectedCategory('All');
      setActiveCourseIndex(0);
      setIsPlaying(false);
      setSwitchProgress(0);
    }
  }, [availableCategories, selectedCategory]);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Filter courses for active category
  // When 'All': show all courses in this language.
  // When specific category: ONLY show courses of that category!
  const categoryCourses: Course[] = useMemo(() => {
    if (selectedCategory === 'All') {
      return filteredCoursesForLang;
    }
    const filtered = filteredCoursesForLang.filter(c => c.category === selectedCategory);
    return filtered.length > 0 ? filtered : filteredCoursesForLang;
  }, [filteredCoursesForLang, selectedCategory]);

  // Ensure active index is safe
  const activeCourse: Course = categoryCourses[activeCourseIndex] || categoryCourses[0] || filteredCoursesForLang[0];

  // First video of active course for distraction-free player
  const firstVideo = (activeCourse.videos && activeCourse.videos.length > 0)
    ? activeCourse.videos[0]
    : { youtubeId: 'w7ejDZ8SWv8', title: activeCourse.title, duration: '15:00' };

  // Category translation helper
  const getCategoryLabel = (cat: string) => {
    const norm = (cat || '').toLowerCase().trim();
    if (norm === 'all') return t('category_All', 'All Tracks');
    if (norm === 'web development') return t('category_Web_Development', 'Web Development');
    if (norm === 'cyber security') return t('category_Cyber_Security', 'Cyber Security');
    if (norm === 'programming') return t('category_Programming', 'Programming');
    if (norm === 'design') return t('category_Design', 'Design');
    if (norm === 'digital marketing') return t('category_digital_marketing', 'Digital Marketing');
    if (norm === 'ai') return t('category_AI', 'Artificial Intelligence');
    if (norm === 'automation') return t('category_Automation', 'Automation');
    if (norm === '3d') return t('category_3d', '3D Design');
    if (norm === 'development') return t('category_Development', 'Software Development');
    return cat;
  };

  // Smart Recommendation Reason for current course
  const recommendationInfo = useMemo(() => {
    const reasons = [
      { text: t('rec_reason_trending', 'Trending #1 in Track'), icon: Flame, color: 'text-amber-500' },
      { text: t('rec_reason_completion', 'Highest Completion Rate'), icon: Star, color: 'text-emerald-500' },
      { text: t('rec_reason_career', 'High-Demand Skill'), icon: Zap, color: 'text-indigo-500' },
      { text: t('rec_reason_cert', 'Verifiable Proof'), icon: Award, color: 'text-blue-500' }
    ];
    return reasons[activeCourseIndex % reasons.length];
  }, [activeCourseIndex, t]);

  // Switch category - reset progress and stay within it
  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setActiveCourseIndex(0);
    setIsPlaying(false);
    setSwitchProgress(0);
    setSlideDirection(1);
  };

  // Prev / Next course navigation
  const handlePrevCourse = () => {
    setIsPlaying(false);
    setSwitchProgress(0);
    setSlideDirection(-1);
    setActiveCourseIndex(prev => (prev > 0 ? prev - 1 : categoryCourses.length - 1));
  };

  const handleNextCourse = () => {
    setIsPlaying(false);
    setSwitchProgress(0);
    setSlideDirection(1);
    if (selectedCategory === 'All') {
      // Random discovery in All Tracks
      if (categoryCourses.length <= 1) {
        setActiveCourseIndex(0);
      } else {
        let nextIdx = Math.floor(Math.random() * categoryCourses.length);
        if (nextIdx === activeCourseIndex) nextIdx = (activeCourseIndex + 1) % categoryCourses.length;
        setActiveCourseIndex(nextIdx);
      }
    } else {
      // Strictly cycle within chosen category
      setActiveCourseIndex(prev => (prev + 1) % categoryCourses.length);
    }
  };

  // SMART AUTO-SWITCH WITH TIMED ANIMATION
  // STRICT LOGIC:
  // If user selected a specific category: auto-switch cycles ONLY inside that category! NEVER switches out.
  // If user selected 'All': auto-switch explores random courses from all categories.
  const SWITCH_DURATION_MS = 5500;
  const TICK_INTERVAL_MS = 50;

  useEffect(() => {
    if (!isAutoSwitchEnabled || isHovered || isPlaying) return;

    const interval = setInterval(() => {
      setSwitchProgress(prev => {
        const next = prev + (TICK_INTERVAL_MS / SWITCH_DURATION_MS) * 100;
        if (next >= 100) {
          setSlideDirection(1);
          if (selectedCategory === 'All') {
            // Random discovery across all categories
            setActiveCourseIndex(currentIdx => {
              if (categoryCourses.length <= 1) return 0;
              let nextIdx = Math.floor(Math.random() * categoryCourses.length);
              if (nextIdx === currentIdx) nextIdx = (currentIdx + 1) % categoryCourses.length;
              return nextIdx;
            });
          } else {
            // STRICTLY stay within the selected category! Loop back to 0 when reaching end
            setActiveCourseIndex(currentIdx => (currentIdx + 1) % categoryCourses.length);
          }
          return 0;
        }
        return next;
      });
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAutoSwitchEnabled, isHovered, isPlaying, categoryCourses.length, selectedCategory]);

  // Smooth scroll active course thumbnail horizontally inside its own strip ONLY (never scrolls the whole page)
  useEffect(() => {
    if (courseListScrollRef.current && activeCourse?.id) {
      const container = courseListScrollRef.current;
      const el = document.getElementById(`hero-course-item-${activeCourse.id}`);
      if (el) {
        const elLeft = el.offsetLeft;
        const containerWidth = container.clientWidth;
        const elWidth = el.clientWidth;
        container.scrollTo({
          left: elLeft - (containerWidth / 2) + (elWidth / 2),
          behavior: 'smooth'
        });
      }
    }
  }, [activeCourse?.id]);

  // Search Results Filter within current language
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return filteredCoursesForLang
      .filter(c => 
        c.title.toLowerCase().includes(query) || 
        c.category?.toLowerCase().includes(query) || 
        c.instructor?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      )
      .slice(0, 4);
  }, [filteredCoursesForLang, searchQuery]);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/courses');
    }
  };

  // Directional slide variants for smooth animation
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? (isRtl ? -28 : 28) : (isRtl ? 28 : -28),
      opacity: 0,
      scale: 0.985
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.32,
        ease: [0.16, 1, 0.3, 1]
      }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? (isRtl ? 28 : -28) : (isRtl ? -28 : 28),
      opacity: 0,
      scale: 0.985,
      transition: {
        duration: 0.22,
        ease: [0.16, 1, 0.3, 1]
      }
    })
  };

  return (
    <section 
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative w-full overflow-hidden bg-background py-8 sm:py-12 md:py-16 lg:py-20 border-b border-border/50"
    >
      
      {/* Subtle Background Canvas & Modern Dot Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div 
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05] bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:24px_24px]"
          style={{
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 25%, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 25%, black 40%, transparent 100%)'
          }}
        />
        {/* Soft, low-contrast ambient glow */}
        <div className="absolute -top-32 start-1/2 -translate-x-1/2 w-[34rem] sm:w-[50rem] h-[18rem] sm:h-[24rem] rounded-full bg-primary/10 blur-[130px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center">
          
          {/* LEFT / START COLUMN: Clean Editorial Narrative & Actions */}
          <div className="flex flex-col text-center lg:text-start lg:col-span-7">
            
            {/* Minimalist Live Status Kicker */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="inline-flex items-center gap-2 mb-4 sm:mb-5 mx-auto lg:mx-0 text-xs sm:text-sm font-medium text-muted-foreground"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-medium text-foreground">
                {t('hero_kicker', 'The Distraction-Free Learning Engine')}
              </span>
              <span className="text-border" aria-hidden="true">·</span>
              <span className="text-primary font-semibold">
                {t('hero_quick_stats_zero_cost', '100% Free Always')}
              </span>
            </motion.div>

            {/* Master Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.12] text-foreground mb-4 sm:mb-6"
              style={{ textWrap: 'balance' }}
            >
              <span>{t('hero_title_1', 'Learn Without Distractions.')}</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-400 inline-block mt-1">
                {t('hero_title_accent', 'Build Real Skills.')}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-6 sm:mb-7 font-normal leading-relaxed"
            >
              {t('hero_subtitle', 'Skilliq is a structured learning platform that organizes the best free YouTube courses into clear paths. Stay focused, save time, and actually finish what you start.')}
            </motion.p>

            {/* Modern Interactive Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 }}
              ref={searchContainerRef}
              className="relative w-full max-w-xl mx-auto lg:mx-0 mb-4 sm:mb-5 z-20"
            >
              <form 
                onSubmit={handleSearchSubmit}
                className="relative flex items-center bg-card border border-border/80 rounded-xl sm:rounded-2xl p-1.5 shadow-sm hover:border-border focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/20 transition-all"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground ms-2.5 sm:ms-3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder={t('hero_search_placeholder', 'Search courses, skills, or technologies...')}
                  className="w-full bg-transparent px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground me-1 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:bg-primary/95 active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  {t('hero_search_btn', 'Search')}
                </button>
              </form>

              {/* Instant Search Suggestions Dropdown */}
              <AnimatePresence>
                {isSearchFocused && searchQuery.trim().length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-full start-0 end-0 mt-2 bg-card/95 backdrop-blur-xl border border-border/80 rounded-xl shadow-xl overflow-hidden text-start z-30"
                  >
                    {searchResults.length > 0 ? (
                      <div className="p-2 space-y-1">
                        {searchResults.map((course) => (
                          <Link
                            key={course.id}
                            to={`/course/${course.id}`}
                            onClick={() => {
                              setIsSearchFocused(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/80 transition-colors group cursor-pointer"
                          >
                            <div className="w-10 h-7 rounded bg-muted overflow-hidden shrink-0">
                              <img 
                                src={course.thumbnail} 
                                alt="" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                {course.title}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate">
                                {course.instructor} · {getCategoryLabel(course.category)}
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                          </Link>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleSearchSubmit()}
                          className="w-full text-center py-2 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors border-t border-border/40 mt-1 cursor-pointer"
                        >
                          {t('hero_view_all_matches', 'View all matches for')} "{searchQuery}" →
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        {t('hero_no_matches', 'No courses match your query')}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Curated Popular Categories Quick-Toggles */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.22 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 mb-6 sm:mb-8 text-xs text-muted-foreground"
            >
              <span className="font-medium text-foreground/80 me-1">
                {t('hero_popular_label', 'Popular:')}
              </span>
              {availableCategories.slice(0, 5).map((catName) => (
                <button
                  key={catName}
                  onClick={() => handleCategorySelect(catName)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
                    selectedCategory === catName
                      ? 'bg-foreground text-background border-foreground shadow-xs'
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50'
                  }`}
                >
                  {getCategoryLabel(catName)}
                </button>
              ))}
            </motion.div>

            {/* Primary Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.26 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 w-full sm:w-auto mb-6 sm:mb-8"
            >
              <Link
                to="/courses"
                className="group px-6 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm sm:text-base hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>{t('start_learning', 'Start Learning Free')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/paths"
                className="px-5 py-3.5 bg-card hover:bg-muted/70 text-foreground border border-border/80 rounded-xl font-semibold text-sm sm:text-base hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>{t('explore_paths', 'Explore Paths')}</span>
              </Link>
            </motion.div>

            {/* Quiet Proofline Trust Markers */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-4 sm:gap-x-6 text-xs text-muted-foreground pt-4 border-t border-border/50"
            >
              <div className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{t('hero_quick_stats_playlists', '100+ Free Playlists')}</span>
              </div>
              <span className="text-border" aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{t('hero_quick_stats_no_ads', 'Zero Interruptions')}</span>
              </div>
              <span className="text-border" aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{t('hero_quick_stats_certs', 'Verifiable Proof')}</span>
              </div>
              <span className="text-border hidden sm:inline" aria-hidden="true">·</span>
              <div className="hidden sm:flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{t('hero_trust_no_cc', 'No sign-up required to explore')}</span>
              </div>
            </motion.div>

          </div>

          {/* RIGHT / END COLUMN: SMART INTERACTIVE RECOMMENDATION SHOWCASE */}
          <div className="lg:col-span-5 w-full max-w-xl mx-auto lg:max-w-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="relative bg-card/95 dark:bg-card/85 backdrop-blur-xl border border-border/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl dark:shadow-2xl overflow-hidden text-start group/card"
            >
              
              {/* TOP SMOOTH AUTO-SWITCH PROGRESS BAR */}
              <div className="absolute top-0 inset-x-0 h-1 bg-muted/40 overflow-hidden">
                <div 
                  className={`h-full bg-primary transition-all duration-75 ${
                    isHovered || isPlaying || !isAutoSwitchEnabled ? 'opacity-40' : 'opacity-100'
                  }`}
                  style={{ width: `${switchProgress}%` }}
                />
              </div>

              {/* TOP HEADER: Category Bar & Auto-Switch Controls */}
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-border/60">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  <span className="text-xs font-bold text-foreground truncate">
                    {getCategoryLabel(selectedCategory)}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    ({categoryCourses.length})
                  </span>
                  {selectedCategory === 'All' ? (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground font-medium bg-muted/60 px-1.5 py-0.5 rounded">
                      <Shuffle className="w-2.5 h-2.5" />
                      <span>{t('random_mode_notice', 'Exploring all')}</span>
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      <Check className="w-2.5 h-2.5" />
                      <span>{t('category_mode_notice', { category: getCategoryLabel(selectedCategory) })}</span>
                    </span>
                  )}
                </div>

                {/* Auto Switch Controls & Prev / Next Course */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setIsAutoSwitchEnabled(prev => !prev)}
                    title={isAutoSwitchEnabled ? t('pause_auto_switch', 'Pause auto-switch') : t('resume_auto_switch', 'Resume auto-switch')}
                    className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer border ${
                      isAutoSwitchEnabled
                        ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15'
                        : 'bg-muted text-muted-foreground border-border/60 hover:text-foreground'
                    }`}
                  >
                    {isAutoSwitchEnabled ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3 fill-current" />
                    )}
                    <span className="text-[10px] font-medium hidden sm:inline">
                      {isAutoSwitchEnabled ? t('auto_switch', 'Auto') : t('auto_switch_paused', 'Paused')}
                    </span>
                  </button>

                  <div className="flex items-center border border-border/60 rounded-lg overflow-hidden bg-muted/40">
                    <button
                      onClick={handlePrevCourse}
                      title={t('prev_course', 'Previous course')}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                    <span className="text-[10px] font-mono px-1.5 text-muted-foreground">
                      {activeCourseIndex + 1}/{categoryCourses.length}
                    </span>
                    <button
                      onClick={handleNextCourse}
                      title={t('next_course', 'Next course')}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  </div>
                </div>
              </div>

              {/* REAL CATEGORIES SELECTOR TABS */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-3 border-b border-border/40">
                {availableCategories.map((cat) => {
                  const isCatSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer border ${
                        isCatSelected
                          ? 'bg-foreground text-background border-foreground shadow-xs'
                          : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50'
                      }`}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  );
                })}
              </div>

              {/* ANIMATED COURSE CONTENT CONTAINER WITH DIRECTIONAL MOTION */}
              <AnimatePresence mode="wait" custom={slideDirection}>
                <motion.div
                  key={`${activeCourse.id}-${selectedCategory}-${currentAppLang}`}
                  custom={slideDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  {/* SMART RECOMMENDATION HEADER */}
                  <div className="flex items-center justify-between gap-2 mb-2 px-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t('recommended_for_you', 'Recommended for You')}</span>
                      <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-md border border-primary/20">
                        {t('match_score', '98% Match')}
                      </span>
                    </div>

                    <div className={`flex items-center gap-1 text-[11px] font-medium ${recommendationInfo.color}`}>
                      <recommendationInfo.icon className="w-3.5 h-3.5" />
                      <span>{recommendationInfo.text}</span>
                    </div>
                  </div>

                  {/* ACTIVE COURSE HEADER: Title, Instructor & Focus Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-primary">
                          {getCategoryLabel(activeCourse.category || selectedCategory)}
                        </span>
                        <span className="text-border" aria-hidden="true">·</span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{t('hero_badge_focus', 'Focus Mode: Active')}</span>
                        </span>
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug line-clamp-1">
                        {activeCourse.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {t('by', 'By')} {activeCourse.instructor}
                      </p>
                    </div>

                    {activeCourse.instructorAvatar && (
                      <img 
                        src={activeCourse.instructorAvatar} 
                        alt={activeCourse.instructor}
                        className="w-9 h-9 rounded-xl object-cover border border-border shadow-xs shrink-0"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>

                  {/* VIDEO PLAYER STAGE */}
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-950 border border-border/70 group/player mb-3">
                    {isPlaying ? (
                      <div className="w-full h-full relative">
                        <iframe 
                          src={`https://www.youtube.com/embed/${firstVideo.youtubeId}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3`}
                          title={activeCourse.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                        <button
                          onClick={() => setIsPlaying(false)}
                          className="absolute top-2 end-2 bg-black/80 hover:bg-black text-white px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shadow-lg backdrop-blur-sm z-20 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{t('hero_close_preview', 'Close Player')}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full relative cursor-pointer" onClick={() => setIsPlaying(true)}>
                        <img 
                          src={activeCourse.thumbnail} 
                          alt={activeCourse.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/player:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg group-hover/player:scale-110 transition-all">
                            <Play className="w-5 h-5 fill-current ms-0.5" />
                          </div>
                        </div>

                        <div className="absolute bottom-2 start-2 end-2 flex items-center justify-between text-white text-[11px] font-medium bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md">
                          <span className="truncate max-w-[220px]">{firstVideo.title}</span>
                          <span className="shrink-0 font-mono text-zinc-300">{firstVideo.duration}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* ALL COURSES IN THIS CATEGORY / TRACK SELECTOR STRIP */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <span>
                      {selectedCategory === 'All'
                        ? t('all_tracks_courses', 'All Curated Courses')
                        : t('courses_in_category', { count: categoryCourses.length })}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">({categoryCourses.length})</span>
                  </div>
                  <Link 
                    to={selectedCategory === 'All' ? '/courses' : `/courses?category=${encodeURIComponent(selectedCategory)}`}
                    className="text-primary hover:underline text-[11px] font-medium flex items-center gap-0.5"
                  >
                    <span>{t('view_all_in_category', { category: getCategoryLabel(selectedCategory) })}</span>
                    <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                  </Link>
                </div>

                {/* SCROLLABLE FULL COURSE STRIP - SHOWS ALL COURSES IN CATEGORY */}
                <div 
                  ref={courseListScrollRef}
                  className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth"
                >
                  {categoryCourses.map((cItem, idx) => {
                    const isCurrent = idx === activeCourseIndex;
                    return (
                      <button
                        key={cItem.id || idx}
                        id={`hero-course-item-${cItem.id}`}
                        onClick={() => {
                          setSlideDirection(idx > activeCourseIndex ? 1 : -1);
                          setActiveCourseIndex(idx);
                          setIsPlaying(false);
                          setSwitchProgress(0);
                        }}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-start transition-all shrink-0 cursor-pointer min-w-[180px] sm:min-w-[200px] max-w-[220px] ${
                          isCurrent
                            ? 'bg-primary/10 border-primary text-primary shadow-xs ring-2 ring-primary/25'
                            : 'bg-muted/30 border-border/50 text-foreground/80 hover:bg-muted/70 hover:border-border'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-lg bg-muted overflow-hidden shrink-0 relative">
                          <img 
                            src={cItem.thumbnail} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          {isCurrent && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <Play className="w-3 h-3 text-primary fill-current" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-semibold truncate leading-tight">
                            {cItem.title}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {cItem.instructor} · {cItem.videos?.length || 1} {t('videos', 'videos')}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 1-CLICK LAUNCH BUTTON */}
              <Link
                to={`/course/${activeCourse.id}`}
                className="w-full py-2.5 px-4 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <span>{t('hero_start_course', 'Start This Course')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>

              {/* Subtle Live Active Proof Bar */}
              <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="font-semibold text-foreground">3,400+ {t('track_live_learners', 'active learners')}</span>
                </div>
                <div className="flex items-center gap-1 text-primary font-medium">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('track_verified_badge', 'Verified Credential')}</span>
                </div>
              </div>

            </motion.div>
          </div>

        </div>
      </div>

    </section>
  );
}
