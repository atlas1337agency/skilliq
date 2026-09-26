import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  PlayCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Video, 
  Search, 
  X, 
  Filter, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  SlidersHorizontal,
  RotateCcw,
  ArrowRight,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, filterByLanguage } from '../lib/utils';
import { useStore } from '../store/useStore';
import { ScrollingText } from '../components/ScrollingText';

type DurationFilter = 'all' | 'under_1h' | '1_to_3h' | 'over_3h';
type SortOption = 'newest' | 'title';

function parseDurationMinutes(duration?: string): number {
  if (!duration) return 90; // Default estimate
  const str = duration.toLowerCase().trim();

  // Pattern like "2h 30m" or "3h+" or "4h"
  if (str.includes('h')) {
    const hoursMatch = str.match(/(\d+)\s*h/);
    const minsMatch = str.match(/(\d+)\s*m/);
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const mins = minsMatch ? parseInt(minsMatch[1], 10) : 0;
    return hours * 60 + mins;
  }

  // Pattern like "02:15:30" or "45:00"
  if (str.includes(':')) {
    const parts = str.split(':').map(p => parseInt(p, 10));
    if (parts.length === 3) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 2) {
      return parts[0];
    }
  }

  return 90;
}

export function Masterclasses() {
  const { t, i18n } = useTranslation();
  const { user, courses, setIsAuthModalOpen, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || "All";
  const initialSearch = searchParams.get('search') || searchParams.get('q') || "";

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // UI states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    const catFromUrl = searchParams.get('category');
    if (catFromUrl) {
      setSelectedCategory(catFromUrl);
    }
    const queryFromUrl = searchParams.get('search') || searchParams.get('q');
    if (queryFromUrl !== null && queryFromUrl !== undefined) {
      setSearchQuery(queryFromUrl);
    }
  }, [searchParams]);

  // Base masterclasses (single video courses)
  const baseMasterclasses = useMemo(() => {
    return filterByLanguage(courses, language).filter(c => {
      return c.isSingleVideo === true || String(c.isSingleVideo).toLowerCase() === 'true';
    });
  }, [courses, language]);

  // Categories map with item counts
  const categoriesData = useMemo(() => {
    const map: Record<string, { count: number; subCategories: Set<string> }> = {};
    baseMasterclasses.forEach(c => {
      const cat = c.category || 'Other';
      if (!map[cat]) {
        map[cat] = { count: 0, subCategories: new Set() };
      }
      map[cat].count += 1;
      if (c.subCategory) {
        map[cat].subCategories.add(c.subCategory);
      }
    });

    const list = Object.keys(map).map(k => ({
      name: k,
      count: map[k].count,
      subCategories: Array.from(map[k].subCategories)
    }));

    return [
      { name: "All", count: baseMasterclasses.length, subCategories: [] },
      ...list
    ];
  }, [baseMasterclasses]);

  const currentCategoryObj = useMemo(() => {
    return categoriesData.find(c => c.name === selectedCategory);
  }, [categoriesData, selectedCategory]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedSubCategory !== 'All') count++;
    if (durationFilter !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedCategory, selectedSubCategory, durationFilter, searchQuery]);

  // Filtered masterclasses
  const filteredMasterclasses = useMemo(() => {
    let result = baseMasterclasses.filter(c => {
      const matchCat = selectedCategory === "All" || c.category === selectedCategory;
      const matchSub = selectedSubCategory === "All" || c.subCategory === selectedSubCategory;
      const matchQuery = !searchQuery.trim() || 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.instructor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subCategory?.toLowerCase().includes(searchQuery.toLowerCase());

      // Duration filter
      let matchDuration = true;
      const durationMinutes = parseDurationMinutes(c.videos?.[0]?.duration);
      if (durationFilter === 'under_1h') {
        matchDuration = durationMinutes < 60;
      } else if (durationFilter === '1_to_3h') {
        matchDuration = durationMinutes >= 60 && durationMinutes <= 180;
      } else if (durationFilter === 'over_3h') {
        matchDuration = durationMinutes > 180;
      }

      return matchCat && matchSub && matchQuery && matchDuration;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    if (sortBy === 'newest') {
      result.reverse();
    }

    return result;
  }, [baseMasterclasses, selectedCategory, selectedSubCategory, searchQuery, durationFilter, sortBy]);

  const totalPages = Math.ceil(filteredMasterclasses.length / itemsPerPage);
  
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMasterclasses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMasterclasses, currentPage]);

  const resetAllFilters = () => {
    setSelectedCategory("All");
    setSelectedSubCategory("All");
    setSearchQuery("");
    setDurationFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const handleCategorySelect = (catName: string) => {
    setSelectedCategory(catName);
    setSelectedSubCategory("All");
    setCurrentPage(1);
  };

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-[1600px] mx-auto transition-colors"
    >
      {/* HERO BANNER */}
      <div className="relative mb-8 sm:mb-12 overflow-hidden rounded-3xl p-6 sm:p-10 md:p-12 bg-gradient-to-br from-card via-card/90 to-purple-500/5 border border-border shadow-sm">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-4">
            <Flame className="w-3.5 h-3.5 text-primary" />
            <span>{t('masterclasses_hero_badge', 'Intensive Deep Dives')}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight mb-4">
            {t('masterclasses', 'Masterclasses')}
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
            {t('masterclasses_hero_desc', 'Single-session deep dives and intensive masterclasses designed for rapid, focused skill acquisition.')}
          </p>

          {/* Value badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium text-foreground">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 border border-border shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isRtl ? 'جلسة واحدة شاملة' : 'Single Intensive Session'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 border border-border shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>{isRtl ? 'مشاريع حقيقية تطبيقية' : 'Hands-on Real Projects'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 border border-border shadow-xs">
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('paths_stat_certs', 'Verifiable Certificates')}</span>
            </div>
          </div>
        </div>

        {/* Aggregate metrics */}
        <div className="mt-8 pt-6 border-t border-border/60 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">{baseMasterclasses.length}</div>
            <div className="text-xs text-muted-foreground font-medium">{t('masterclasses', 'Masterclasses')}</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">50+</div>
            <div className="text-xs text-muted-foreground font-medium">{isRtl ? 'ساعات تدريب مكثف' : 'Deep-Dive Hours'}</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="text-2xl sm:text-3xl font-black text-emerald-500">100%</div>
            <div className="text-xs text-muted-foreground font-medium">{isRtl ? 'مجاني بدون إعلانات' : 'Free & Ad-Free'}</div>
          </div>
        </div>
      </div>

      {/* TOP CONTROLS: SEARCH & MOBILE TRIGGER */}
      <div className="space-y-4 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder={t('search_courses', 'Search masterclasses by title, topic, or instructor...')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full ps-11 pe-11 py-3.5 sm:py-4 border border-border/80 rounded-2xl bg-card text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium placeholder:font-normal placeholder:text-muted-foreground/70 shadow-sm text-sm sm:text-base outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute inset-y-0 end-0 pe-4 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-5 w-5 bg-muted rounded-full p-1" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortOption);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-48 appearance-none bg-card border border-border/80 text-foreground py-3.5 sm:py-4 px-4 pe-9 rounded-2xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none cursor-pointer shadow-sm"
              >
                <option value="newest">{t('sort_newest', 'Newest First')}</option>
                <option value="title">{t('sort_title_asc', 'Title (A - Z)')}</option>
              </select>
              <div className="absolute inset-y-0 end-0 pe-3.5 flex items-center pointer-events-none text-muted-foreground">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center gap-2 px-4 py-3.5 sm:py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-sm text-xs sm:text-sm shrink-0 cursor-pointer"
            >
              <Filter className="w-4 h-4" />
              <span>{t('filters', 'Filters')}</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-background text-foreground text-xs flex items-center justify-center font-black">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* HORIZONTAL CATEGORY SCROLL CHIPS */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categoriesData.map(cat => (
            <button
              key={cat.name}
              onClick={() => handleCategorySelect(cat.name)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 shrink-0",
                selectedCategory === cat.name
                  ? "bg-foreground text-background border-foreground shadow-xs font-bold"
                  : "bg-card text-muted-foreground hover:text-foreground border-border/70 hover:bg-muted/50"
              )}
            >
              <span>{cat.name === 'All' ? t('all') : cat.name}</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-md",
                selectedCategory === cat.name 
                  ? "bg-background/20 text-background" 
                  : "bg-muted text-muted-foreground"
              )}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* ACTIVE FILTER PILLS */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Filter className="w-3 h-3 text-primary" />
              <span>{t('active_filters', 'Active Filters')}:</span>
            </span>

            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                <span>{selectedCategory}</span>
                <button 
                  onClick={() => setSelectedCategory('All')} 
                  className="hover:opacity-75 cursor-pointer"
                  aria-label="Remove category filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {selectedSubCategory !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                <span>{selectedSubCategory}</span>
                <button 
                  onClick={() => setSelectedSubCategory('All')} 
                  className="hover:opacity-75 cursor-pointer"
                  aria-label="Remove topic filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {durationFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                <span>
                  {durationFilter === 'under_1h' && t('filter_mc_under_1h', 'Under 1 Hour')}
                  {durationFilter === '1_to_3h' && t('filter_mc_1_to_3h', '1 - 3 Hours')}
                  {durationFilter === 'over_3h' && t('filter_mc_over_3h', 'Deep Dive (3h+)')}
                </span>
                <button 
                  onClick={() => setDurationFilter('all')} 
                  className="hover:opacity-75 cursor-pointer"
                  aria-label="Remove duration filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                <span>"{searchQuery}"</span>
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="hover:opacity-75 cursor-pointer"
                  aria-label="Remove search filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            <button
              onClick={resetAllFilters}
              className="text-xs font-bold text-muted-foreground hover:text-foreground underline flex items-center gap-1 ms-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('clear_filters', 'Reset Filters')}</span>
            </button>
          </div>
        )}
      </div>

      {/* TWO COLUMN GRID WITH SIDEBAR */}
      <div className="flex flex-col lg:flex-row gap-8 relative items-start">
        
        {/* DESKTOP SMART SIDEBAR */}
        <aside className="hidden lg:block w-72 shrink-0 sticky top-24 space-y-6">
          <div className="bg-card border border-border/80 p-6 rounded-3xl shadow-sm flex flex-col gap-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <span>{t('smart_filters', 'Smart Filters')}</span>
              </h2>
              {activeFiltersCount > 0 && (
                <button 
                  onClick={resetAllFilters}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  {t('clear_filters', 'Reset')}
                </button>
              )}
            </div>

            {/* Duration Filter */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{t('filter_by_duration', 'Duration')}</span>
              </h3>
              <div className="space-y-1.5">
                {[
                  { id: 'all', label: t('filter_mc_all', 'All Durations') },
                  { id: 'under_1h', label: t('filter_mc_under_1h', 'Under 1 Hour') },
                  { id: '1_to_3h', label: t('filter_mc_1_to_3h', '1 - 3 Hours') },
                  { id: 'over_3h', label: t('filter_mc_over_3h', 'Deep Dive (3h+)') }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setDurationFilter(item.id as DurationFilter);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "w-full text-start px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer border",
                      durationFilter === item.id
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/30 border-transparent hover:bg-muted/70 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{item.label}</span>
                    {durationFilter === item.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategories / Topics */}
            {currentCategoryObj && currentCategoryObj.subCategories.length > 0 && selectedCategory !== 'All' && (
              <div className="pt-2 border-t border-border/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t('topics', 'Topics')}</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedSubCategory("All");
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer",
                      selectedSubCategory === "All"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All
                  </button>
                  {currentCategoryObj.subCategories.map(sub => (
                    <button
                      key={sub}
                      onClick={() => {
                        setSelectedSubCategory(sub);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer",
                        selectedSubCategory === sub
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reassurance Info Card */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-bold text-foreground mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>{isRtl ? 'جلسات عملية متكاملة' : 'Intensive Focus'}</span>
              </div>
              <p className="leading-relaxed">
                {isRtl 
                  ? 'تم تصميم الماستر كلاس لتعلم تقنية محددة في جلسة واحدة شاملة دون تشتيت.' 
                  : 'Masterclasses are curated for single-session mastery, taking you through complete project builds.'}
              </p>
            </div>

          </div>
        </aside>

        {/* MASTERCLASSES MAIN GRID */}
        <div className="flex-1 min-w-0 w-full">
          
          {/* Header result stats */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground">
              {t('filter_results_count', { 
                count: filteredMasterclasses.length, 
                total: baseMasterclasses.length, 
                defaultValue: `Showing ${filteredMasterclasses.length} of ${baseMasterclasses.length} masterclasses` 
              })}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {isRtl ? 'تدريب مكثف في جلسة واحدة' : 'Single-session deep dives'}
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-6 mb-12">
            {currentItems.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="group flex flex-col bg-card rounded-3xl border border-border/80 overflow-hidden hover:shadow-xl transition-all duration-200 hover:-translate-y-1 text-start"
              >
                {/* 16:9 Thumbnail Header */}
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {course.language && (
                    <div className="absolute top-3 end-3 z-10 bg-black/75 backdrop-blur text-white px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider shadow-sm">
                      {course.language}
                    </div>
                  )}

                  {course.thumbnail?.trim() ? (
                    <img 
                      src={course.thumbnail} 
                      alt={course.title} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 bg-muted text-muted-foreground text-xs font-medium text-center">
                      <span>{course.title}</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/45 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-xl scale-90 group-hover:scale-100 transition-transform">
                      <PlayCircle className="w-8 h-8 ps-0.5 text-white" />
                    </div>
                  </div>

                  {/* Badges on Thumbnail */}
                  <div className="absolute top-3 start-3 flex flex-wrap gap-1.5 z-10">
                    <span className="bg-primary/95 backdrop-blur text-white px-2.5 py-1 rounded-md text-[11px] font-bold shadow-xs">
                      {t('masterclass', 'Masterclass')}
                    </span>
                    <span className="bg-background/95 backdrop-blur text-foreground px-2 py-1 rounded-md text-[11px] font-bold shadow-xs">
                      {course.category}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 sm:p-6 flex flex-col flex-1">
                  <h3 className="text-base sm:text-lg font-bold mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2 flex-1 leading-relaxed">
                    {course.description}
                  </p>
                  
                  {/* Instructor & Duration strip */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-5 bg-muted/30 p-2.5 rounded-xl border border-border/50">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>{course.videos[0]?.duration || '2h+'}</span>
                    </div>
                    <div className="font-medium text-foreground max-w-[50%] truncate">
                      <ScrollingText>{course.instructor}</ScrollingText>
                    </div>
                  </div>

                  {/* Action Button */}
                  {user ? (
                    <Link 
                      to={`/course/${course.id}`}
                      className="w-full py-2.5 sm:py-3 bg-foreground text-background hover:bg-primary hover:text-primary-foreground rounded-xl font-bold text-xs sm:text-sm text-center transition-all active:scale-[0.98] shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{t('start_learning', 'Start Masterclass')}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </Link>
                  ) : (
                    <button 
                      onClick={() => setIsAuthModalOpen(true)}
                      className="w-full py-2.5 sm:py-3 bg-foreground text-background hover:bg-primary hover:text-primary-foreground rounded-xl font-bold text-xs sm:text-sm text-center transition-all active:scale-[0.98] shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{t('login_to_start', 'Log in to Start')}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Empty State */}
            {filteredMasterclasses.length === 0 && (
              <div className="col-span-full py-16 sm:py-20 flex flex-col items-center justify-center text-center bg-card border border-dashed border-border rounded-3xl p-6">
                <Video className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
                <h3 className="text-xl font-bold mb-2 text-foreground">{t('no_courses_found', 'No masterclasses found')}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
                  {t('try_different_category', 'Try selecting a different category or clearing your search filters.')}
                </p>
                <button 
                  onClick={resetAllFilters}
                  className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all text-xs sm:text-sm shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t('clear_filters', 'Reset Filters')}</span>
                </button>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 pt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
              </button>
              
              <div className="flex gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-10 h-10 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center transition-all cursor-pointer",
                      currentPage === page 
                        ? "bg-primary text-primary-foreground shadow-sm scale-105" 
                        : "bg-card border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5 rtl:rotate-180" />
              </button>
            </div>
          )}

        </div>

      </div>

      {/* MOBILE / TABLET FILTER DRAWER */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ x: isRtl ? -320 : 320 }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? -320 : 320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full max-w-xs sm:max-w-sm h-full bg-card border-s border-border p-6 shadow-2xl overflow-y-auto flex flex-col justify-between z-10 text-start"
            >
              <div>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-border/60">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                    <span>{t('smart_filters', 'Smart Filters')}</span>
                  </h2>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Duration Filter */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{t('filter_by_duration', 'Duration')}</span>
                  </h3>
                  <div className="space-y-1.5">
                    {[
                      { id: 'all', label: t('filter_mc_all', 'All Durations') },
                      { id: 'under_1h', label: t('filter_mc_under_1h', 'Under 1 Hour') },
                      { id: '1_to_3h', label: t('filter_mc_1_to_3h', '1 - 3 Hours') },
                      { id: 'over_3h', label: t('filter_mc_over_3h', 'Deep Dive (3h+)') }
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setDurationFilter(item.id as DurationFilter);
                          setCurrentPage(1);
                        }}
                        className={cn(
                          "w-full text-start px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between border cursor-pointer",
                          durationFilter === item.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/40 border-border/40 text-muted-foreground"
                        )}
                      >
                        <span>{item.label}</span>
                        {durationFilter === item.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subcategories */}
                {currentCategoryObj && currentCategoryObj.subCategories.length > 0 && selectedCategory !== 'All' && (
                  <div className="mb-6 pt-4 border-t border-border/50">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{t('topics', 'Topics')}</span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedSubCategory("All");
                          setCurrentPage(1);
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer",
                          selectedSubCategory === "All"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/40 border-border/50 text-muted-foreground"
                        )}
                      >
                        All
                      </button>
                      {currentCategoryObj.subCategories.map(sub => (
                        <button
                          key={sub}
                          onClick={() => {
                            setSelectedSubCategory(sub);
                            setCurrentPage(1);
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer",
                            selectedSubCategory === sub
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/40 border-border/50 text-muted-foreground"
                          )}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-border/60 flex items-center gap-2">
                <button
                  onClick={resetAllFilters}
                  className="flex-1 py-3 rounded-xl border border-border text-foreground font-bold text-xs hover:bg-muted transition-colors cursor-pointer"
                >
                  {t('clear_filters', 'Reset')}
                </button>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                >
                  {t('apply_filters', 'Apply Filters')}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
