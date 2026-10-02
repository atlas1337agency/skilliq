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
  const realCategories = useMemo(() => {
    const cats = new Set<string>();
    filteredCoursesForLang.forEach(c => {
      if (c.category && c.category.trim()) cats.add(c.category.trim());
    });
    return Array.from(cats);
  }, [filteredCoursesForLang]);

  const availableCategories = useMemo(() => {
    return ['All', ...realCategories];
  }, [realCategories]);

  // Mobile mode detection (< 768px, phone screens)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Selected category in smart showcase card: On tablet/stacked mode, default to the first real category
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      const cats: string[] = [];
      filteredCoursesForLang.forEach(c => {
        if (c.category && c.category.trim() && !cats.includes(c.category.trim())) cats.push(c.category.trim());
      });
      return cats[0] || 'All';
    }
    return 'All';
  });

  // Ensure on tablet/stacked mode we never stay on 'All'
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && selectedCategory === 'All' && realCategories.length > 0) {
      setSelectedCategory(realCategories[0]);
    }
  }, [selectedCategory, realCategories]);

  const [activeCourseIndex, setActiveCourseIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isAutoSwitchEnabled, setIsAutoSwitchEnabled] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [switchProgress, setSwitchProgress] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<number>(1); // 1 = forward, -1 = backward

  const courseListScrollRef = useRef<HTMLDivElement>(null);

  // Sync category if it doesn't exist in current language
  useEffect(() => {
    if (selectedCategory !== 'All' && !availableCategories.includes(selectedCategory)) {
      const fallbackCat = (typeof window !== 'undefined' && window.innerWidth < 1024)
        ? (realCategories[0] || 'All')
        : 'All';
      setSelectedCategory(fallbackCat);
      setActiveCourseIndex(0);
      setIsPlaying(false);
      setSwitchProgress(0);
    }
  }, [availableCategories, selectedCategory, realCategories]);

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
    if (isMobile || !isAutoSwitchEnabled || isHovered || isPlaying) return;

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
      className="relative w-full overflow-hidden bg-background py-6 sm:py-10 md:py-14 lg:py-20 border-b border-border/50"
    >
      {/* Strict CSS Guarantee: Completely hide All Tracks in mobile mode (< 1024px) */}
      <style>{`
        @media (max-width: 1023px) {
          .hero-all-tracks-only {
            display: none !important;
          }
        }
      `}</style>
      
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 xl:gap-14 items-center">
          
          {/* LEFT / START COLUMN: Clean Editorial Narrative & Actions */}
          <div className="flex flex-col text-center lg:text-start lg:col-span-7 max-w-2xl mx-auto lg:max-w-none w-full">
            
            {/* Minimalist Live Status Kicker */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 rounded-full bg-primary/5 dark:bg-primary/10 border border-primary/20 mb-4 sm:mb-6 w-fit self-center lg:self-start text-xs sm:text-sm text-muted-foreground shadow-2xs"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-medium text-foreground">
                <span className="hidden sm:inline">{t('hero_kicker', 'The Distraction-Free Learning Engine')}</span>
                <span className="inline sm:hidden">{t('hero_kicker_mobile', 'Distraction-Free Learning')}</span>
              </span>
              <span className="text-muted-foreground/60 shrink-0 font-bold" aria-hidden="true">·</span>
              <span className="text-primary font-bold whitespace-nowrap shrink-0">
                {t('hero_quick_stats_zero_cost', '100% Free Always')}
              </span>
            </motion.div>

            {/* Master Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06 }}
              className="text-2xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.18] sm:leading-[1.12] text-foreground mb-3 sm:mb-5"
              style={{ textWrap: 'balance' }}
            >
              <span>{t('hero_title_1', 'Learn Without Distractions.')}</span>
              <br className="hidden sm:inline" />{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-400 inline-block mt-0.5 sm:mt-1">
                {t('hero_title_accent', 'Build Real Skills.')}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="text-xs sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-6 sm:mb-8 font-normal leading-relaxed"
            >
              {t('hero_subtitle', 'Skilliq is a structured learning platform that organizes the best free YouTube courses into clear paths. Stay focused, save time, and actually finish what you start.')}
            </motion.p>

            {/* Curated Popular Categories Quick-Toggles */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.18 }}
              className="flex items-center justify-start sm:justify-center lg:justify-start gap-1.5 sm:gap-2 mb-5 sm:mb-7 text-xs text-muted-foreground overflow-x-auto no-scrollbar py-1 w-full max-w-full sm:flex-wrap"
            >
              <span className="font-medium text-foreground/80 shrink-0 me-0.5">
                {t('hero_popular_label', 'Popular:')}
              </span>
              {/* Desktop-only All Tracks chip */}
              <button
                onClick={() => handleCategorySelect('All')}
                className={`hero-all-tracks-only hidden lg:inline-block px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border shrink-0 ${
                  selectedCategory === 'All'
                    ? 'bg-foreground text-background border-foreground shadow-xs'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50'
                }`}
              >
                {getCategoryLabel('All')}
              </button>

              {/* Real popular categories - ALWAYS real categories only */}
              {realCategories.slice(0, 5).map((catName) => (
                <button
                  key={catName}
                  onClick={() => handleCategorySelect(catName)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border shrink-0 ${
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
              className="grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2.5 sm:gap-3.5 w-full sm:w-auto mb-5 sm:mb-7"
            >
              <Link
                to="/courses"
                className="group px-3.5 sm:px-6 py-2.5 sm:py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs sm:text-base hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-xs"
              >
                <span className="truncate">{t('start_learning', 'Start Learning Free')}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/paths"
                className="px-3.5 sm:px-5 py-2.5 sm:py-3.5 bg-card hover:bg-muted/70 text-foreground border border-border/80 rounded-xl font-semibold text-xs sm:text-base hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-xs cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
                <span className="truncate">{t('explore_paths', 'Explore Paths')}</span>
              </Link>
            </motion.div>

            {/* Quiet Proofline Trust Markers */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-3 sm:gap-x-6 text-[11px] sm:text-xs text-muted-foreground pt-3.5 sm:pt-4 border-t border-border/50"
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

          {/* RIGHT / END COLUMN: SMART INTERACTIVE RECOMMENDATION SHOWCASE - HIDDEN ON MOBILE (< 768px), SHOWN ON TABLET & LAPTOP */}
          <div className="hidden md:block lg:col-span-5 w-full max-w-2xl lg:max-w-none mx-auto mt-6 lg:mt-0">
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

              {/* TOP HEADER: Category Bar & Course Navigation */}
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-border/60">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  <span className="text-xs font-bold text-foreground truncate">
                    {selectedCategory === 'All'
                      ? (isMobile ? (activeCourse?.category || (realCategories[0] || 'Courses')) : getCategoryLabel(selectedCategory))
                      : getCategoryLabel(selectedCategory)}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    ({categoryCourses.length})
                  </span>
                </div>

                {/* Prev / Next Course Navigation Arrows */}
                <div className="flex items-center border border-border/60 rounded-lg overflow-hidden bg-muted/40 shrink-0">
                  <button
                    onClick={handlePrevCourse}
                    title={t('prev_course', 'Previous course')}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                  <span className="text-[10px] font-mono px-2 text-muted-foreground">
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

              {/* REAL CATEGORIES SELECTOR TABS */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-3 border-b border-border/40">
                {/* Desktop-only All Tracks tab */}
                <button
                  onClick={() => handleCategorySelect('All')}
                  className={`hero-all-tracks-only hidden lg:inline-block px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer border ${
                    selectedCategory === 'All'
                      ? 'bg-foreground text-background border-foreground shadow-xs'
                      : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50'
                  }`}
                >
                  {getCategoryLabel('All')}
                </button>

                {/* Real categories tabs - ALWAYS real categories only */}
                {realCategories.map((cat) => {
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
                        ? (isMobile ? `${activeCourse?.category || 'Curated'} Courses` : t('all_tracks_courses', 'All Curated Courses'))
                        : t('courses_in_category', { count: categoryCourses.length })}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">({categoryCourses.length})</span>
                  </div>
                  <Link 
                    to={selectedCategory === 'All' ? '/courses' : `/courses?category=${encodeURIComponent(selectedCategory)}`}
                    className="text-primary hover:underline text-[11px] font-medium flex items-center gap-0.5"
                  >
                    <span>
                      {selectedCategory === 'All'
                        ? t('view_all_courses', 'Explore all courses')
                        : t('view_all_in_category', { category: getCategoryLabel(selectedCategory) })}
                    </span>
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
