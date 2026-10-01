import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  PlayCircle, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  X, 
  Filter, 
  Sparkles, 
  Award, 
  Clock, 
  CheckCircle2, 
  SlidersHorizontal,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, filterByLanguage } from '../lib/utils';
import { useStore } from '../store/useStore';
import { ScrollingText } from '../components/ScrollingText';

type LengthFilter = 'all' | 'short' | 'medium' | 'long';
type SortOption = 'newest' | 'lessons' | 'title';

export function Courses() {
  const { t, i18n } = useTranslation();
  const { user, courses, setIsAuthModalOpen, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || searchParams.get('q') || "";
  const initialCategory = searchParams.get('category') || "All";

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [lengthFilter, setLengthFilter] = useState<LengthFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  // UI states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    const queryFromUrl = searchParams.get('search') || searchParams.get('q');
    if (queryFromUrl !== null && queryFromUrl !== undefined) {
      setSearchQuery(queryFromUrl);
    } else {
      setSearchQuery("");
    }
    const catFromUrl = searchParams.get('category');
    if (catFromUrl) {
      setSelectedCategory(catFromUrl);
      setSelectedSubCategory("All");
      setCurrentPage(1);
    } else {
      setSelectedCategory("All");
    }
    // Scroll smoothly to top on searchParams change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams]);

  // Base playlists (exclude single-video masterclasses)
  const basePlaylists = useMemo(() => {
    return filterByLanguage(courses, language).filter(c => {
      return !(c.isSingleVideo === true || String(c.isSingleVideo).toLowerCase() === 'true');
    });
  }, [courses, language]);

  // Categories map with item counts
  const categoriesData = useMemo(() => {
    const map: Record<string, { count: number; subCategories: Set<string> }> = {};
    basePlaylists.forEach(c => {
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
      { name: "All", count: basePlaylists.length, subCategories: [] },
      ...list
    ];
  }, [basePlaylists]);

  const currentCategoryObj = useMemo(() => {
    return categoriesData.find(c => c.name === selectedCategory);
  }, [categoriesData, selectedCategory]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedSubCategory !== 'All') count++;
    if (lengthFilter !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedCategory, selectedSubCategory, lengthFilter, searchQuery]);

  // Filtered & sorted courses
  const filteredCourses = useMemo(() => {
    let result = basePlaylists.filter(c => {
      // Category
      const matchCat = selectedCategory === "All" || 
        c.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase() ||
        c.category === selectedCategory ||
        (selectedCategory.toLowerCase().includes('marketing') && c.category?.toLowerCase().includes('marketing')) ||
        (selectedCategory.toLowerCase().includes('programming') && (c.category?.toLowerCase().includes('programming') || c.category?.toLowerCase().includes('python'))) ||
        (selectedCategory.toLowerCase().includes('design') && (c.category?.toLowerCase().includes('design') || c.category?.toLowerCase().includes('ui')));
      // SubCategory
      const matchSub = selectedSubCategory === "All" || c.subCategory === selectedSubCategory;
      // Search
      const matchQuery = !searchQuery.trim() || 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.instructor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subCategory?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Course length
      let matchLength = true;
      const videoCount = c.videos?.length || 0;
      if (lengthFilter === 'short') {
        matchLength = videoCount < 10;
      } else if (lengthFilter === 'medium') {
        matchLength = videoCount >= 10 && videoCount <= 25;
      } else if (lengthFilter === 'long') {
        matchLength = videoCount > 25;
      }

      return matchCat && matchSub && matchQuery && matchLength;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'lessons') {
        return (b.videos?.length || 0) - (a.videos?.length || 0);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      // 'newest' default
      return 0;
    });

    if (sortBy === 'newest') {
      result.reverse();
    }

    return result;
  }, [basePlaylists, selectedCategory, selectedSubCategory, searchQuery, lengthFilter, sortBy]);

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCourses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCourses, currentPage]);

  const totalVideosCount = useMemo(() => {
    return basePlaylists.reduce((acc, c) => acc + (c.videos?.length || 0), 0);
  }, [basePlaylists]);

  const resetAllFilters = () => {
    setSelectedCategory("All");
    setSelectedSubCategory("All");
    setSearchQuery("");
    setLengthFilter("all");
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
      <div className="relative mb-8 sm:mb-12 overflow-hidden rounded-3xl p-6 sm:p-10 md:p-12 bg-gradient-to-br from-card via-card/90 to-primary/5 border border-border shadow-sm">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('courses_hero_badge', 'Curated Catalog')}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight mb-4">
            {t('all_courses', 'All Playlists')}
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
            {t('courses_hero_desc', 'Curated sequential playlists organized from beginner to advanced. Distraction-free, zero ads, 100% free.')}
          </p>

          {/* Quick value badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium text-foreground">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 border border-border shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('footer_free_always', '100% Free Forever')}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 border border-border shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>{isRtl ? 'تسلسل منظم بدون إعلانات' : 'No Ads & No Algorithm Feeds'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 border border-border shadow-xs">
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('paths_stat_certs', 'Verifiable Certificates')}</span>
            </div>
          </div>
        </div>

        {/* Aggregate metric cards */}
        <div className="mt-8 pt-6 border-t border-border/60 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">{basePlaylists.length}</div>
            <div className="text-xs text-muted-foreground font-medium">{t('courses', 'Playlists')}</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">{totalVideosCount}+</div>
            <div className="text-xs text-muted-foreground font-medium">{t('videos', 'Lessons')}</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="text-2xl sm:text-3xl font-black text-emerald-500">100%</div>
            <div className="text-xs text-muted-foreground font-medium">{isRtl ? 'مجاني بدون رسوم خفية' : 'Free & Unlocked'}</div>
          </div>
        </div>
      </div>

      {/* TOP CONTROLS: SEARCH & MOBILE FILTER TRIGGER */}
      <div className="space-y-4 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder={t('search_courses', 'Search playlists by title, topic, or instructor...')}
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
                <option value="lessons">{t('sort_lessons', 'Most Lessons')}</option>
                <option value="title">{t('sort_title_asc', 'Title (A - Z)')}</option>
              </select>
              <div className="absolute inset-y-0 end-0 pe-3.5 flex items-center pointer-events-none text-muted-foreground">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
            </div>

            {/* Mobile Filter Sheet Button */}
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

        {/* ACTIVE FILTER PILLS STRIP */}
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

            {lengthFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                <span>
                  {lengthFilter === 'short' && t('filter_duration_short', 'Short (< 10 videos)')}
                  {lengthFilter === 'medium' && t('filter_duration_medium', 'Medium (10 - 25 videos)')}
                  {lengthFilter === 'long' && t('filter_duration_long', 'In-Depth (25+ videos)')}
                </span>
                <button 
                  onClick={() => setLengthFilter('all')} 
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

      {/* MAIN TWO-COLUMN CONTENT */}
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

            {/* Filter by Length */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{t('filter_by_length', 'Course Length')}</span>
              </h3>
              <div className="space-y-1.5">
                {[
                  { id: 'all', label: t('filter_duration_all', 'All Lengths') },
                  { id: 'short', label: t('filter_duration_short', 'Short (< 10 videos)') },
                  { id: 'medium', label: t('filter_duration_medium', 'Medium (10 - 25 videos)') },
                  { id: 'long', label: t('filter_duration_long', 'In-Depth (25+ videos)') }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setLengthFilter(item.id as LengthFilter);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "w-full text-start px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer border",
                      lengthFilter === item.id
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/30 border-transparent hover:bg-muted/70 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{item.label}</span>
                    {lengthFilter === item.id && <CheckCircle2 className="w-3.5 h-3.5" />}
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

            {/* Quick summary card */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-bold text-foreground mb-1">
                <Award className="w-4 h-4 text-emerald-500" />
                <span>{t('paths_stat_certs', 'Verifiable Certificates')}</span>
              </div>
              <p className="leading-relaxed">
                {isRtl 
                  ? 'أنهِ كافة فيديوهات القائمة واحصل على شهادة موثقة تثبت مهاراتك.' 
                  : 'Complete all playlist lessons and earn a tamper-proof certificate of achievement.'}
              </p>
            </div>

          </div>
        </aside>

        {/* COURSES MAIN GRID */}
        <div className="flex-1 min-w-0 w-full">
          
          {/* Header result stats */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground">
              {t('filter_results_count', { 
                count: filteredCourses.length, 
                total: basePlaylists.length, 
                defaultValue: `Showing ${filteredCourses.length} of ${basePlaylists.length} playlists` 
              })}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {isRtl ? 'مرتبة لضمان التعلم المركز' : 'Organized for distraction-free learning'}
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

                  {/* Category Pill */}
                  <div className="absolute top-3 start-3 flex flex-wrap gap-1.5 z-10">
                    <span className="bg-background/95 backdrop-blur text-foreground px-2.5 py-1 rounded-md text-[11px] font-bold shadow-xs">
                      {course.category}
                    </span>
                    {course.subCategory && (
                      <span className="bg-primary/90 backdrop-blur text-primary-foreground px-2 py-1 rounded-md text-[11px] font-bold shadow-xs">
                        {course.subCategory}
                      </span>
                    )}
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
                  
                  {/* Instructor & Video count strip */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-5 bg-muted/30 p-2.5 rounded-xl border border-border/50">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      <span>{course.videos.length} {t('videos')}</span>
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
                      <span>{t('start_learning', 'Start Learning')}</span>
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
            {filteredCourses.length === 0 && (
              <div className="col-span-full py-16 sm:py-20 flex flex-col items-center justify-center text-center bg-card border border-dashed border-border rounded-3xl p-6">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
                <h3 className="text-xl font-bold mb-2 text-foreground">{t('no_courses_found', 'No courses found')}</h3>
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

      {/* MOBILE / TABLET FILTER SLIDE-OVER DRAWER */}
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

                {/* Length Filter */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{t('filter_by_length', 'Course Length')}</span>
                  </h3>
                  <div className="space-y-1.5">
                    {[
                      { id: 'all', label: t('filter_duration_all', 'All Lengths') },
                      { id: 'short', label: t('filter_duration_short', 'Short (< 10 videos)') },
                      { id: 'medium', label: t('filter_duration_medium', 'Medium (10 - 25 videos)') },
                      { id: 'long', label: t('filter_duration_long', 'In-Depth (25+ videos)') }
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setLengthFilter(item.id as LengthFilter);
                          setCurrentPage(1);
                        }}
                        className={cn(
                          "w-full text-start px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between border cursor-pointer",
                          lengthFilter === item.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/40 border-border/40 text-muted-foreground"
                        )}
                      >
                        <span>{item.label}</span>
                        {lengthFilter === item.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topics / Subcategories */}
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

              {/* Bottom Drawer Actions */}
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
