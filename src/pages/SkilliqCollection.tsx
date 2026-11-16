import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import {
  PlayCircle,
  BookOpen,
  Search,
  X,
  Layers,
  Users,
  Eye,
  ThumbsUp,
  MessageSquare,
  ArrowRight,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Heart,
  Youtube,
  Award,
  PlusCircle
} from 'lucide-react';
import { cn, filterByLanguage } from '../lib/utils';
import { useStore } from '../store/useStore';
import { FavoriteButton } from '../components/FavoriteButton';
import { ShareCourseButton } from '../components/ShareCourseButton';
import { SEO } from '../components/SEO';
import { formatCompactNumber } from '../lib/youtube';
import {
  normalizeCategory,
  matchCourseCategory,
  getCategoryDisplayName,
  getCourseTimestamp,
  getCourseContributors,
  formatContributorsSummary,
  getCoursePath,
  isMultiChannelCourse,
  isCertificateEligible
} from '../lib/courseUtils';

type SortOption = 'newest' | 'lessons' | 'channels' | 'title';

export function SkilliqCollection() {
  const { i18n } = useTranslation();
  const {
    user,
    courses,
    favorites,
    language,
    isContentLoading,
    hasLoadedFromDb
  } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';
  const isAdmin = Boolean(user && ['admin', 'publisher'].includes(user.role));

  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedContributor, setSelectedContributor] = useState(searchParams.get('channel') || 'All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // All approved multi-channel courses matching current UI language
  const baseCollection = useMemo(() => {
    return filterByLanguage(courses, language).filter((c) => isMultiChannelCourse(c));
  }, [courses, language]);

  // Real quantitative stats computed dynamically from live collection data
  const collectionStats = useMemo(() => {
    let totalLessons = 0;
    const uniqueChannels = new Set<string>();
    baseCollection.forEach((c) => {
      totalLessons += (c.videos || []).length;
      getCourseContributors(c).forEach((contrib) => {
        uniqueChannels.add(contrib.name.toLowerCase());
      });
    });
    return {
      totalCourses: baseCollection.length,
      totalLessons,
      totalChannels: uniqueChannels.size
    };
  }, [baseCollection]);

  // Categories present inside Skilliq Collection with counts
  const categoryOptions = useMemo(() => {
    const map = new Map<string, number>();
    baseCollection.forEach((c) => {
      const norm = normalizeCategory(c.category);
      map.set(norm, (map.get(norm) || 0) + 1);
    });
    const list = Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    return [{ name: 'All', count: baseCollection.length }, ...list];
  }, [baseCollection]);

  // Unique channels/teachers contributing across Skilliq Collection
  const contributorOptions = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    baseCollection.forEach((c) => {
      getCourseContributors(c).forEach((contrib) => {
        const key = contrib.name.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(key, { name: contrib.name, count: 1 });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [baseCollection]);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const matched = baseCollection.filter((c) => {
      if (showFavoritesOnly && !favorites?.[`playlist_${c.id}`]) {
        return false;
      }

      if (!matchCourseCategory(c.category, selectedCategory)) {
        return false;
      }

      const contribs = getCourseContributors(c);
      if (selectedContributor !== 'All') {
        const hasChannel = contribs.some(
          (ch) => ch.name.toLowerCase() === selectedContributor.toLowerCase()
        );
        if (!hasChannel) return false;
      }

      if (q) {
        const matchesMain =
          c.title.toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q) ||
          (c.instructor || '').toLowerCase().includes(q) ||
          (c.subCategory || '').toLowerCase().includes(q) ||
          (c.category || '').toLowerCase().includes(q);
        const matchesContributor =
          contribs.some(
            (ch) =>
              ch.name.toLowerCase().includes(q) ||
              ch.professorName.toLowerCase().includes(q)
          ) ||
          (c.videos || []).some(
            (v) =>
              v.title?.toLowerCase().includes(q) ||
              v.channelName?.toLowerCase().includes(q) ||
              v.professorName?.toLowerCase().includes(q)
          );
        if (!matchesMain && !matchesContributor) return false;
      }

      return true;
    });

    return [...matched].sort((a, b) => {
      if (sortBy === 'lessons') {
        return (b.videos?.length || 0) - (a.videos?.length || 0);
      }
      if (sortBy === 'channels') {
        return getCourseContributors(b).length - getCourseContributors(a).length;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      const diff = getCourseTimestamp(b) - getCourseTimestamp(a);
      return diff !== 0 ? diff : b.id.localeCompare(a.id);
    });
  }, [
    baseCollection,
    showFavoritesOnly,
    favorites,
    selectedCategory,
    selectedContributor,
    searchQuery,
    sortBy
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const currentItems = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return filteredCourses.slice(start, start + itemsPerPage);
  }, [filteredCourses, safePage]);

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    selectedContributor !== 'All' ||
    Boolean(searchQuery.trim()) ||
    showFavoritesOnly ||
    sortBy !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedContributor('All');
    setShowFavoritesOnly(false);
    setSortBy('newest');
    setCurrentPage(1);
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-[1440px] mx-auto transition-colors"
    >
      <SEO
        title={
          isRtl
            ? 'مجموعة Skilliq المختارة | دورات مجمعة من عدة قنوات ومعلمين'
            : 'Skilliq Collection | Multi-Channel Curated Playlists'
        }
        description={
          isRtl
            ? 'استكشف مجموعة Skilliq: دورات شاملة تجمع أفضل الدروس من عدة قنوات ومعلمين على يوتيوب في مسار واحد مع شهادة معتمدة توثّق جميع المحاضرين.'
            : 'Explore Skilliq Collection: complete multi-channel curated playlists combining top lessons from multiple YouTube educators into unified courses and verified certificates.'
        }
        canonicalPath="/collection"
        lang={isRtl ? 'ar' : 'en'}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Skilliq Collection', url: '/collection' }
        ]}
      />

      {/* PAGE HEADER */}
      <header className="mb-8 pb-8 border-b border-border/80">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground transition-colors font-medium">
            {isRtl ? 'الرئيسية' : 'Home'}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground font-semibold">
            {isRtl ? 'مجموعة Skilliq المختارة' : 'Skilliq Collection'}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl text-start">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
              <Layers className="w-4 h-4 shrink-0" />
              <span>
                {isRtl
                  ? 'قوائم تعليمية مجمعة من عدة قنوات'
                  : 'Multi-Channel Curated Playlists'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground text-balance">
              {isRtl ? 'مجموعة Skilliq المختارة · Skilliq Collection' : 'Skilliq Collection'}
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
              {isRtl
                ? 'عندما لا تتوفر قائمة تشغيل كاملة من قناة واحدة، نجمع لك أفضل الدروس المطولة من عدة قنوات ومعلمين متخصصين في منهج واحد متسلسل مع شهادة معتمدة باسم جميع المحاضرين.'
                : 'When a single playlist leaves gaps, Skilliq Collection brings together hand-picked lessons from multiple top YouTube educators into one structured playlist and unified certificate crediting every contributor.'}
            </p>
          </div>

          {/* Real Dynamic Metrics */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-card border border-border/80 text-start min-w-[115px] tabular-nums">
              <div className="text-xl sm:text-2xl font-extrabold text-foreground">
                {collectionStats.totalCourses}
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground">
                {isRtl ? 'دورة مجمعة' : 'Curated Courses'}
              </div>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-card border border-border/80 text-start min-w-[115px] tabular-nums">
              <div className="text-xl sm:text-2xl font-extrabold text-foreground">
                {collectionStats.totalLessons}
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground">
                {isRtl ? 'إجمالي الدروس' : 'Combined Lessons'}
              </div>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-card border border-border/80 text-start min-w-[115px] tabular-nums">
              <div className="text-xl sm:text-2xl font-extrabold text-foreground">
                {collectionStats.totalChannels}
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground">
                {isRtl ? 'قناة ومعلم' : 'Featured Channels'}
              </div>
            </div>

            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-primary/90 transition-colors shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isRtl ? 'إضافة دورة جديدة' : 'Add Collection Course'}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* FILTER & SEARCH BAR */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-muted-foreground absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={
                isRtl
                  ? 'ابحث بعنوان الدورة، المجال، أو اسم القناة / المعلم...'
                  : 'Search by course title, topic, channel, or teacher...'
              }
              className="w-full bg-card border border-border/80 rounded-xl ps-10 pe-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Contributor / Sort / Favorites controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {contributorOptions.length > 0 && (
              <select
                value={selectedContributor}
                onChange={(e) => {
                  setSelectedContributor(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label={isRtl ? 'تصفية حسب المعلم أو القناة' : 'Filter by channel or teacher'}
                className="bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
              >
                <option value="All">
                  {isRtl ? 'جميع القنوات والمعلمين' : 'All Channels & Teachers'}
                </option>
                {contributorOptions.map((ch) => (
                  <option key={ch.name} value={ch.name}>
                    {ch.name} ({ch.count})
                  </option>
                ))}
              </select>
            )}

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setCurrentPage(1);
              }}
              aria-label={isRtl ? 'ترتيب النتائج' : 'Sort collection'}
              className="bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="newest">{isRtl ? 'الأحدث أولاً' : 'Newest First'}</option>
              <option value="lessons">{isRtl ? 'الأكثر دروساً' : 'Most Lessons'}</option>
              <option value="channels">{isRtl ? 'الأكثر قنوات مشاركة' : 'Most Channels'}</option>
              <option value="title">{isRtl ? 'ترتيب أبجدي' : 'Title A–Z'}</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setShowFavoritesOnly((prev) => !prev);
                setCurrentPage(1);
              }}
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-colors cursor-pointer',
                showFavoritesOnly
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : 'bg-card text-muted-foreground hover:text-foreground border-border/80'
              )}
            >
              <Heart className={cn('w-4 h-4', showFavoritesOnly && 'fill-current')} />
              <span>{isRtl ? 'المفضلة' : 'Saved'}</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isRtl ? 'إعادة ضبط' : 'Reset'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        {categoryOptions.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            {categoryOptions.map((cat) => {
              const active = matchCourseCategory(cat.name, selectedCategory) &&
                (cat.name === 'All' ? selectedCategory === 'All' : true);
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer tabular-nums inline-flex items-center gap-1.5',
                    active
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-card text-muted-foreground hover:text-foreground border-border/80 hover:bg-muted/60'
                  )}
                >
                  <span>
                    {cat.name === 'All'
                      ? isRtl
                        ? 'الكل'
                        : 'All'
                      : getCategoryDisplayName(cat.name, isRtl)}
                  </span>
                  <span className="opacity-75">({cat.count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* LOADING STATE */}
      {isContentLoading && !hasLoadedFromDb && baseCollection.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-96 rounded-2xl bg-card border border-border/80 animate-pulse"
            />
          ))}
        </div>
      ) : currentItems.length > 0 ? (
        <>
          {/* COLLECTION GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentItems.map((course) => {
              const contributors = getCourseContributors(course);
              const contributorSummary = formatContributorsSummary(contributors, 3);
              const eligibleCert = isCertificateEligible(course);
              const cViews =
                course.totalViews ||
                (course.videos || []).reduce((s, v) => s + (v.viewCount || 0), 0);
              const cLikes =
                course.totalLikes ||
                (course.videos || []).reduce((s, v) => s + (v.likeCount || 0), 0);
              const cComments =
                course.totalComments ||
                (course.videos || []).reduce((s, v) => s + (v.commentCount || 0), 0);

              return (
                <article
                  key={course.id}
                  className="group flex flex-col bg-card rounded-2xl border border-border/80 hover:border-primary/40 overflow-hidden hover:shadow-xl transition-all duration-200 hover:-translate-y-1 text-start"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950">
                    <div className="absolute bottom-3 end-3 z-20 flex items-center gap-1.5">
                      <ShareCourseButton course={course} size="sm" />
                      <FavoriteButton itemId={course.id} itemType="playlist" size="sm" />
                    </div>

                    {course.thumbnail?.trim() ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center text-white/90">
                        <Layers className="w-9 h-9 mb-2 text-blue-400" />
                        <span className="text-xs font-bold line-clamp-2">{course.title}</span>
                      </div>
                    )}

                    {/* Hover Play Button Overlay */}
                    <Link
                      to={getCoursePath(course)}
                      aria-label={course.title}
                      className="absolute inset-0 bg-black/25 group-hover:bg-black/45 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-10"
                    >
                      <div className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-xl scale-90 group-hover:scale-100 transition-transform">
                        <PlayCircle className="w-8 h-8 text-white" />
                      </div>
                    </Link>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    {/* Unboxed Clean Typographic Metadata */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-muted-foreground mb-2.5 tabular-nums">
                      <span className="text-primary font-bold">
                        {getCategoryDisplayName(course.category, isRtl)}
                      </span>
                      {course.subCategory && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{course.subCategory}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>
                        {(course.videos || []).length}{' '}
                        {isRtl ? 'درس' : (course.videos || []).length === 1 ? 'Lesson' : 'Lessons'}
                      </span>
                      {eligibleCert && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Award className="w-3.5 h-3.5 shrink-0" />
                            <span>{isRtl ? 'شهادة' : 'Certificate'}</span>
                          </span>
                        </>
                      )}
                    </div>

                    <Link to={getCoursePath(course)} className="block">
                      <h2 className="text-base sm:text-lg font-bold text-foreground mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {course.title}
                      </h2>
                    </Link>

                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2 flex-1 leading-relaxed">
                      {course.description}
                    </p>

                    {/* Contributing Teachers / Channels Box */}
                    <div className="mb-4 p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-bold text-foreground min-w-0">
                          <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{contributorSummary}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-muted-foreground shrink-0 tabular-nums">
                          {contributors.length}{' '}
                          {isRtl
                            ? 'قنوات'
                            : contributors.length === 1
                            ? 'Channel'
                            : 'Channels'}
                        </span>
                      </div>

                      {contributors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {contributors.slice(0, 4).map((contrib) => (
                            <Link
                              key={contrib.name}
                              to={`/creator/${encodeURIComponent(contrib.name)}`}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card border border-border/80 hover:border-primary/40 text-[11px] font-semibold text-foreground transition-colors"
                              title={contrib.professorName}
                            >
                              {contrib.avatar ? (
                                <img
                                  src={contrib.avatar}
                                  alt={contrib.name}
                                  className="w-4 h-4 rounded-full object-cover shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
                              )}
                              <span className="truncate max-w-[115px]">{contrib.name}</span>
                              <span className="text-[10px] text-muted-foreground tabular-nums">
                                ({contrib.videoCount})
                              </span>
                            </Link>
                          ))}
                          {contributors.length > 4 && (
                            <span className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-muted-foreground tabular-nums">
                              +{contributors.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] font-semibold text-muted-foreground tabular-nums">
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
                    </div>

                    {/* Action CTA */}
                    <Link
                      to={getCoursePath(course)}
                      className="w-full py-2.5 sm:py-3 bg-foreground text-background hover:bg-primary hover:text-primary-foreground rounded-xl font-bold text-xs sm:text-sm text-center transition-all active:scale-[0.98] shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>{isRtl ? 'ابدأ التعلم الآن' : 'Start Curated Course'}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2 tabular-nums">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={safePage === 1}
                className="p-2.5 rounded-xl bg-card border border-border/80 text-foreground disabled:opacity-40 hover:bg-muted transition-colors cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </button>

              <span className="px-4 py-2 text-xs sm:text-sm font-bold text-foreground">
                {safePage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={safePage === totalPages}
                className="p-2.5 rounded-xl bg-card border border-border/80 text-foreground disabled:opacity-40 hover:bg-muted transition-colors cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          )}
        </>
      ) : (
        /* EMPTY STATE */
        <div className="py-16 px-6 rounded-2xl bg-card border border-dashed border-border/80 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Layers className="w-6 h-6" />
          </div>

          {hasActiveFilters ? (
            <>
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                {isRtl ? 'لا توجد دورات مطابقة لبحثك' : 'No matching courses found'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-md">
                {isRtl
                  ? 'جرّب مسح الفلاتر أو البحث بكلمات أو اسم قناة آخر.'
                  : 'Try clearing your active filters or searching for another topic or channel.'}
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isRtl ? 'إعادة ضبط الفلاتر' : 'Reset All Filters'}</span>
              </button>
            </>
          ) : (
            <>
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                {isRtl
                  ? 'لا توجد دورات في مجموعة Skilliq حالياً'
                  : 'No Multi-Channel Curated Playlists yet'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-md">
                {isRtl
                  ? 'عندما تقوم الإدارة بتجميع دروس من عدة قنوات يوتيوب في دورة واحدة متكاملة، ستظهر تلقائياً هنا.'
                  : 'When admins curate a playlist combining lessons from multiple YouTube teachers and channels, it will appear here automatically.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:bg-primary/90 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{isRtl ? 'إنشاء دورة متعددة القنوات' : 'Create in Admin Panel'}</span>
                  </Link>
                )}
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs sm:text-sm font-bold transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{isRtl ? 'تصفح جميع الدورات' : 'Browse All Courses'}</span>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
