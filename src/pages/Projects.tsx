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
  ArrowRight,
  Layers,
  Eye,
  ThumbsUp,
  MessageSquare,
  Rocket,
  Code2,
  Video,
  Wrench,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, filterByLanguage } from '../lib/utils';
import { useStore } from '../store/useStore';
import { ScrollingText } from '../components/ScrollingText';
import { FavoriteButton } from '../components/FavoriteButton';
import { SEO } from '../components/SEO';
import { formatCompactNumber } from '../lib/youtube';
import {
  buildDeduplicatedCategories,
  matchCourseCategory,
  getCategoryDisplayName,
  getCourseTimestamp,
  isCourseNew,
  isProjectCourse,
  isMasterclassCourse,
  isProjectCertificateEligible
} from '../lib/courseUtils';

type FormatFilter = 'all' | 'playlist' | 'masterclass';
type SortOption = 'newest' | 'lessons' | 'title';

export function Projects() {
  const { t, i18n } = useTranslation();
  const { user, courses, progress, favorites, setIsAuthModalOpen, language, isContentLoading, hasLoadedFromDb } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'All';

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // UI states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    const queryFromUrl = searchParams.get('search') || searchParams.get('q');
    if (queryFromUrl !== null && queryFromUrl !== undefined) {
      setSearchQuery(queryFromUrl);
    } else {
      setSearchQuery('');
    }
    const catFromUrl = searchParams.get('category');
    if (catFromUrl) {
      setSelectedCategory(catFromUrl);
      setSelectedSubCategory('All');
      setCurrentPage(1);
    } else {
      setSelectedCategory('All');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams]);

  // Base projects: only courses marked as Real Project Builds (playlists OR long-video masterclasses)
  const baseProjects = useMemo(() => {
    return filterByLanguage(courses, language).filter(c => isProjectCourse(c));
  }, [courses, language]);

  const playlistProjectsCount = useMemo(
    () => baseProjects.filter(c => !isMasterclassCourse(c)).length,
    [baseProjects]
  );

  const longVideoProjectsCount = useMemo(
    () => baseProjects.filter(c => isMasterclassCourse(c)).length,
    [baseProjects]
  );

  // Categories map
  const categoriesData = useMemo(() => {
    return buildDeduplicatedCategories(baseProjects);
  }, [baseProjects]);

  const currentCategoryObj = useMemo(() => {
    return categoriesData.find(c => matchCourseCategory(c.name, selectedCategory));
  }, [categoriesData, selectedCategory]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedSubCategory !== 'All') count++;
    if (formatFilter !== 'all') count++;
    if (searchQuery.trim()) count++;
    if (showFavoritesOnly) count++;
    return count;
  }, [selectedCategory, selectedSubCategory, formatFilter, searchQuery, showFavoritesOnly]);

  // Filtered & sorted projects
  const filteredProjects = useMemo(() => {
    let result = baseProjects.filter(c => {
      const isSingle = isMasterclassCourse(c);
      if (showFavoritesOnly) {
        const favKeyPlaylist = `playlist_${c.id}`;
        const favKeyMasterclass = `masterclass_${c.id}`;
        if (!favorites?.[favKeyPlaylist] && !favorites?.[favKeyMasterclass]) {
          return false;
        }
      }

      if (formatFilter === 'playlist' && isSingle) return false;
      if (formatFilter === 'masterclass' && !isSingle) return false;

      const matchCat = matchCourseCategory(c.category, selectedCategory);
      const matchSub =
        selectedSubCategory === 'All' ||
        (c.subCategory && c.subCategory.trim().toLowerCase() === selectedSubCategory.trim().toLowerCase());

      const matchQuery =
        !searchQuery.trim() ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.instructor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subCategory?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchSub && matchQuery;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'lessons') {
        return (b.videos?.length || 0) - (a.videos?.length || 0);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      const timeA = getCourseTimestamp(a);
      const timeB = getCourseTimestamp(b);
      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return b.id.localeCompare(a.id);
    });

    return result;
  }, [baseProjects, selectedCategory, selectedSubCategory, searchQuery, formatFilter, sortBy, showFavoritesOnly, favorites]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, currentPage]);

  const resetAllFilters = () => {
    setSelectedCategory('All');
    setSelectedSubCategory('All');
    setSearchQuery('');
    setFormatFilter('all');
    setSortBy('newest');
    setShowFavoritesOnly(false);
    setCurrentPage(1);
  };

  const handleCategorySelect = (catName: string) => {
    setSelectedCategory(catName);
    setSelectedSubCategory('All');
    setCurrentPage(1);
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-[1600px] mx-auto transition-colors"
    >
      <SEO
        title={
          isRtl
            ? 'مشاريع عملية حقيقية (تطبيق عملي وبناء مشاريع) | Skilliq'
            : 'Real-World Project Builds (Hands-On Playlists & Full Builds) | Skilliq'
        }
        description={
          isRtl
            ? 'تعلم بالممارسة العملية وبناء المشاريع الحقيقية خطوة بخطوة عبر قوائم تشغيل وفيديوهات مطولة لبناء تطبيقات ومواقع كاملة من الصفر.'
            : 'Learn by building real-world projects from scratch. Practical project playlists and full-length build sessions with zero fluff.'
        }
        canonicalPath="/projects"
        lang={isRtl ? 'ar' : 'en'}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Projects', url: '/projects' }
        ]}
      />

      {/* HERO BANNER */}
      <div className="relative mb-8 sm:mb-12 overflow-hidden rounded-3xl p-6 sm:p-10 md:p-12 bg-gradient-to-br from-card via-card/90 to-emerald-500/10 border border-border shadow-sm">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-4">
            <Rocket className="w-3.5 h-3.5" />
            <span>
              {isRtl ? 'تطبيق عملي 100% · بناء مشاريع حقيقية' : '100% Hands-On Practice · Real Project Builds'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight mb-4">
            {isRtl ? 'المشاريع العملية وبناء التطبيقات الحقيقية' : 'Real-World Project Builds'}
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
            {isRtl
              ? 'قوائم تشغيل عملية وفيديوهات مطولة مخصصة بالكامل لبناء مشاريع حقيقية من الصفر خطوة بخطوة (بدون تنظير ممل — تطبيق عملي مباشر لبناء معرض أعمالك).'
              : 'Curated project playlists and full-length build sessions dedicated strictly to building real production apps from scratch — pure hands-on practice.'}
          </p>

          {/* Format Quick Filter Tabs inside Hero */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => {
                setFormatFilter('all');
                setCurrentPage(1);
              }}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5',
                formatFilter === 'all'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                  : 'bg-background/80 text-foreground border-border hover:bg-muted'
              )}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'جميع المشاريع' : 'All Project Builds'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/15 text-[10px]">
                {baseProjects.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormatFilter('playlist');
                setCurrentPage(1);
              }}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5',
                formatFilter === 'playlist'
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-background/80 text-foreground border-border hover:bg-muted'
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isRtl ? 'قوائم تشغيل مشاريع' : 'Project Playlists'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/15 text-[10px]">
                {playlistProjectsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormatFilter('masterclass');
                setCurrentPage(1);
              }}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5',
                formatFilter === 'masterclass'
                  ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                  : 'bg-background/80 text-foreground border-border hover:bg-muted'
              )}
            >
              <Video className="w-3.5 h-3.5" />
              <span>{isRtl ? 'مشاريع فيديو مطول كامل' : 'Full-Build Long Videos'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/15 text-[10px]">
                {longVideoProjectsCount}
              </span>
            </button>
          </div>
        </div>

        {/* Aggregate metric cards */}
        <div className="mt-8 pt-6 border-t border-border/60 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">{baseProjects.length}</div>
            <div className="text-xs text-muted-foreground font-medium">
              {isRtl ? 'مشروع تطبيقي حقيقي' : 'Real Project Builds'}
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {playlistProjectsCount} / {longVideoProjectsCount}
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              {isRtl ? 'قوائم تشغيل / فيديوهات مطولة' : 'Playlists / Long Builds'}
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="text-2xl sm:text-3xl font-black text-emerald-500">100%</div>
            <div className="text-xs text-muted-foreground font-medium">
              {isRtl ? 'تطبيق عملي وبناء مشاريع' : 'Practical Hands-On Coding'}
            </div>
          </div>
        </div>
      </div>

      {/* TOP CONTROLS: SEARCH & SORT */}
      <div className="space-y-4 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder={
                isRtl
                  ? 'ابحث عن مشروع عملي حسب الاسم، التقنية، أو المدرب...'
                  : 'Search real-world projects by title, tech stack, or instructor...'
              }
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full ps-11 pe-11 py-3.5 sm:py-4 border border-border/80 rounded-2xl bg-card text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium placeholder:font-normal placeholder:text-muted-foreground/70 shadow-sm text-sm sm:text-base outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
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
                onChange={e => {
                  setSortBy(e.target.value as SortOption);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-48 appearance-none bg-card border border-border/80 text-foreground py-3.5 sm:py-4 px-4 pe-9 rounded-2xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none cursor-pointer shadow-sm"
              >
                <option value="newest">{t('sort_newest', 'Newest First')}</option>
                <option value="lessons">{t('sort_lessons', 'Most Steps / Lessons')}</option>
                <option value="title">{t('sort_title_asc', 'Title (A - Z)')}</option>
              </select>
              <div className="absolute inset-y-0 end-0 pe-3.5 flex items-center pointer-events-none text-muted-foreground">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
            </div>

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
          <button
            onClick={() => {
              setShowFavoritesOnly(prev => !prev);
              setCurrentPage(1);
            }}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 shrink-0',
              showFavoritesOnly
                ? 'bg-rose-500 text-white border-rose-500 shadow-xs font-bold'
                : 'bg-card text-rose-500 hover:bg-rose-500/10 border-rose-500/30'
            )}
          >
            <span>❤️ {isRtl ? 'المفضلة' : 'Favorites'}</span>
          </button>

          {categoriesData.map(cat => {
            const isSelected =
              selectedCategory === cat.name ||
              (selectedCategory === 'All' && cat.name === 'All') ||
              (cat.name !== 'All' && matchCourseCategory(cat.name, selectedCategory));
            return (
              <button
                key={cat.name}
                onClick={() => handleCategorySelect(cat.name)}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 shrink-0',
                  isSelected
                    ? 'bg-foreground text-background border-foreground shadow-xs font-bold'
                    : 'bg-card text-muted-foreground hover:text-foreground border-border/70 hover:bg-muted/50'
                )}
              >
                <span>{getCategoryDisplayName(cat.name, isRtl)}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-md',
                    isSelected ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
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

            {/* Project Format Filter */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isRtl ? 'نوع المشروع العملي' : 'Project Build Format'}</span>
              </h3>
              <div className="space-y-1.5">
                {[
                  { id: 'all', label: isRtl ? 'الكل (قوائم تشغيل + فيديو مطول)' : 'All Project Builds' },
                  { id: 'playlist', label: isRtl ? 'قائمة تشغيل خطوة بخطوة (Playlist)' : 'Multi-Part Project Playlist' },
                  { id: 'masterclass', label: isRtl ? 'فيديو مطول شامل (Full Build Video)' : 'Single-Session Full Build' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setFormatFilter(item.id as FormatFilter);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      'w-full text-start px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer border',
                      formatFilter === item.id
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs font-bold'
                        : 'bg-muted/30 border-transparent hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>{item.label}</span>
                    {formatFilter === item.id && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  <span>{t('categories', 'Categories')}</span>
                </h3>
              </div>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pe-1 scrollbar-thin">
                {categoriesData.map(cat => {
                  const isSelected =
                    selectedCategory === cat.name ||
                    (selectedCategory === 'All' && cat.name === 'All') ||
                    (cat.name !== 'All' && matchCourseCategory(cat.name, selectedCategory));
                  return (
                    <button
                      key={cat.name}
                      onClick={() => handleCategorySelect(cat.name)}
                      className={cn(
                        'w-full text-start px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer border',
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs font-bold'
                          : 'bg-muted/30 border-transparent hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <span className="truncate pe-2">{getCategoryDisplayName(cat.name, isRtl)}</span>
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-md shrink-0 font-bold',
                          isSelected
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subcategories */}
            {currentCategoryObj && currentCategoryObj.subCategories.length > 0 && selectedCategory !== 'All' && (
              <div className="pt-2 border-t border-border/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t('topics', 'Topics')}</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedSubCategory('All');
                      setCurrentPage(1);
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer',
                      selectedSubCategory === 'All'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground'
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
                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer',
                        selectedSubCategory === sub
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* PROJECTS MAIN GRID */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground">
              {isRtl
                ? `عرض ${filteredProjects.length} من أصل ${baseProjects.length} مشروع عملي`
                : `Showing ${filteredProjects.length} of ${baseProjects.length} real-world project builds`}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {isRtl ? 'مشاريع حقيقية للتطبيق العملي' : 'Hands-on portfolio builds'}
            </span>
          </div>

          {!hasLoadedFromDb && isContentLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-6 mb-12">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex flex-col bg-card rounded-3xl border border-border/70 overflow-hidden animate-pulse">
                  <div className="aspect-video bg-muted/60" />
                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="h-5 bg-muted/70 rounded-lg w-3/4" />
                    <div className="h-3 bg-muted/50 rounded-lg w-full" />
                    <div className="h-10 bg-muted/80 rounded-xl w-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-6 mb-12">
              {currentItems.map((project, index) => {
                const isSingle = isMasterclassCourse(project);
                const firstDuration = project.videos?.[0]?.duration || '2h 30m';

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="group flex flex-col bg-card rounded-3xl border border-border/80 hover:border-emerald-500/40 overflow-hidden hover:shadow-xl transition-all duration-200 hover:-translate-y-1 text-start"
                  >
                    {/* 16:9 Thumbnail Header */}
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <div className="absolute bottom-3 end-3 z-20">
                        <FavoriteButton
                          itemId={project.id}
                          itemType={isSingle ? 'masterclass' : 'playlist'}
                          size="sm"
                        />
                      </div>

                      {project.language && (
                        <div className="absolute top-3 end-3 z-10 bg-black/75 backdrop-blur text-white px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider shadow-sm">
                          {project.language}
                        </div>
                      )}

                      {project.thumbnail?.trim() ? (
                        <img
                          src={project.thumbnail}
                          alt={project.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 bg-muted text-muted-foreground text-xs font-medium text-center">
                          <span>{project.title}</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/25 group-hover:bg-black/45 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl scale-90 group-hover:scale-100 transition-transform">
                          <PlayCircle className="w-8 h-8 ps-0.5 text-white" />
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="absolute top-3 start-3 flex flex-wrap gap-1.5 z-10 max-w-[82%]">
                        <span className="bg-emerald-600/95 backdrop-blur text-white px-2.5 py-1 rounded-md text-[10.5px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                          <Rocket className="w-3 h-3 text-amber-300 shrink-0" />
                          <span>{isRtl ? 'مشروع عملي' : 'Real Project'}</span>
                        </span>

                        <span
                          className={cn(
                            'px-2 py-1 rounded-md text-[10.5px] font-bold shadow-xs backdrop-blur',
                            isSingle
                              ? 'bg-purple-600/90 text-white'
                              : 'bg-background/95 text-foreground'
                          )}
                        >
                          {isSingle
                            ? isRtl
                              ? 'فيديو مطول شامل'
                              : 'Full-Build Video'
                            : isRtl
                            ? 'قائمة تشغيل عملية'
                            : 'Project Playlist'}
                        </span>

                        {isCourseNew(project, baseProjects) && (
                          <span className="bg-amber-500 text-black px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-black" />
                            <span>{isRtl ? 'جديد' : 'NEW'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 sm:p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-2">
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                          {getCategoryDisplayName(project.category, isRtl)}
                        </span>
                        {project.subCategory && (
                          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {project.subCategory}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold mb-2 line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2 flex-1 leading-relaxed">
                        {project.description}
                      </p>

                      {/* Instructor & Stats strip */}
                      <div className="flex flex-col gap-2 text-xs text-muted-foreground mb-5 bg-muted/30 p-2.5 rounded-xl border border-border/50">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            {isSingle ? (
                              <>
                                <Clock className="w-3.5 h-3.5 text-purple-500" />
                                <span>{firstDuration}</span>
                              </>
                            ) : (
                              <>
                                <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                                <span>
                                  {project.videos.length} {isRtl ? 'خطوة عملية' : 'Build Steps'}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="font-medium text-foreground max-w-[55%] truncate flex items-center gap-1.5">
                            <ScrollingText>{project.instructor}</ScrollingText>
                          </div>
                        </div>

                        {(() => {
                          const cViews = project.totalViews || project.videos.reduce((s, v) => s + (v.viewCount || 0), 0);
                          const cLikes = project.totalLikes || project.videos.reduce((s, v) => s + (v.likeCount || 0), 0);
                          const cComments = project.totalComments || project.videos.reduce((s, v) => s + (v.commentCount || 0), 0);
                          return (
                            <div className="flex items-center justify-between pt-1.5 border-t border-border/50 text-[11px] font-semibold">
                              <span className="inline-flex items-center gap-1 text-foreground">
                                <Eye className="w-3 h-3 text-primary" />
                                <span>{formatCompactNumber(cViews)}</span>
                              </span>
                              <span className="inline-flex items-center gap-1 text-foreground">
                                <ThumbsUp className="w-3 h-3 text-emerald-500" />
                                <span>{formatCompactNumber(cLikes)}</span>
                              </span>
                              <span className="inline-flex items-center gap-1 text-foreground">
                                <MessageSquare className="w-3 h-3 text-amber-500" />
                                <span>{formatCompactNumber(cComments)}</span>
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Reward Strip: Project Playlists earn the Exclusive Project Certificate upon completion; Single-Video Long Builds earn Trophy & XP */}
                      {isProjectCertificateEligible(project) ? (
                        <div className="mb-3 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">
                              {isRtl
                                ? 'أكمل القائمة للحصول على شهادة المشاريع الحصرية + XP'
                                : 'Complete Playlist to Earn Exclusive Project Certificate + XP'}
                            </span>
                          </div>
                          {progress?.[project.id]?.isCompleted && (
                            <Link
                              to={`/certificate/${project.id}`}
                              className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black uppercase hover:bg-emerald-500"
                            >
                              {isRtl ? 'عرض الشهادة' : 'View Cert'}
                            </Link>
                          )}
                        </div>
                      ) : (
                        <div className="mb-3 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate">
                              {isRtl
                                ? 'عند إكمال الفيديو المطول تحصل على كأس الإنجاز + نقاط XP'
                                : 'Complete Full-Build Video to Earn Trophy & XP Points'}
                            </span>
                          </div>
                        </div>
                      )}

                      {user ? (
                        <Link
                          to={`/course/${project.id}`}
                          className="w-full py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm text-center transition-all active:scale-[0.98] shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Rocket className="w-4 h-4" />
                          <span>{isRtl ? 'ابدأ بناء المشروع الآن' : 'Start Building Project'}</span>
                          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                        </Link>
                      ) : (
                        <button
                          onClick={() => setIsAuthModalOpen(true)}
                          className="w-full py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm text-center transition-all active:scale-[0.98] shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Rocket className="w-4 h-4" />
                          <span>{isRtl ? 'سجل الدخول لبناء المشروع' : 'Log in to Build Project'}</span>
                          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {filteredProjects.length === 0 && (
                <div className="col-span-full py-16 sm:py-20 flex flex-col items-center justify-center text-center bg-card border border-dashed border-border rounded-3xl p-6">
                  <Rocket className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
                  <h3 className="text-xl font-bold mb-2 text-foreground">
                    {isRtl ? 'لم يتم العثور على مشاريع مطابقة' : 'No matching project builds found'}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
                    {isRtl
                      ? 'جرب اختيار تصنيف مختلف أو إعادة ضبط الفلاتر لعرض جميع المشاريع العملية.'
                      : 'Try selecting a different category or resetting filters to view all hands-on project builds.'}
                  </p>
                  <button
                    onClick={resetAllFilters}
                    className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all text-xs sm:text-sm shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t('clear_filters', 'Reset Filters')}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 pt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
              </button>

              <div className="flex gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'w-10 h-10 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center transition-all cursor-pointer',
                      currentPage === page
                        ? 'bg-emerald-600 text-white shadow-sm scale-105'
                        : 'bg-card border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground'
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
              >
                <ChevronRight className="w-5 h-5 rtl:rotate-180" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FILTER DRAWER */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-[90] lg:hidden flex justify-end">
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
              className="relative w-full max-w-xs sm:max-w-sm h-full bg-card border-s border-border p-6 pb-8 shadow-2xl overflow-y-auto flex flex-col justify-between z-10 text-start"
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

                {/* Format Filter */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isRtl ? 'نوع المشروع العملي' : 'Project Build Format'}</span>
                  </h3>
                  <div className="space-y-1.5">
                    {[
                      { id: 'all', label: isRtl ? 'الكل (قوائم تشغيل + فيديو مطول)' : 'All Project Builds' },
                      { id: 'playlist', label: isRtl ? 'قائمة تشغيل خطوة بخطوة (Playlist)' : 'Multi-Part Project Playlist' },
                      { id: 'masterclass', label: isRtl ? 'فيديو مطول شامل (Full Build Video)' : 'Single-Session Full Build' }
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setFormatFilter(item.id as FormatFilter);
                          setCurrentPage(1);
                        }}
                        className={cn(
                          'w-full text-start px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between border cursor-pointer',
                          formatFilter === item.id
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-muted/40 border-border/40 text-muted-foreground'
                        )}
                      >
                        <span>{item.label}</span>
                        {formatFilter === item.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div className="mb-6 pt-4 border-t border-border/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>{t('categories', 'Categories')}</span>
                  </h3>
                  <div className="space-y-1.5 max-h-[240px] overflow-y-auto pe-1">
                    {categoriesData.map(cat => {
                      const isSelected =
                        selectedCategory === cat.name ||
                        (selectedCategory === 'All' && cat.name === 'All') ||
                        (cat.name !== 'All' && matchCourseCategory(cat.name, selectedCategory));
                      return (
                        <button
                          key={cat.name}
                          onClick={() => {
                            handleCategorySelect(cat.name);
                            setIsSidebarOpen(false);
                          }}
                          className={cn(
                            'w-full text-start px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer border',
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-xs font-bold'
                              : 'bg-muted/30 border-transparent hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <span className="truncate pe-2">{getCategoryDisplayName(cat.name, isRtl)}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md shrink-0 font-bold bg-muted text-muted-foreground">
                            {cat.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center gap-2">
                <button
                  onClick={resetAllFilters}
                  className="flex-1 py-3 rounded-xl border border-border text-foreground font-bold text-xs hover:bg-muted transition-colors cursor-pointer"
                >
                  {t('clear_filters', 'Reset')}
                </button>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
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
