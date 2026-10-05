import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { 
  BookOpen, 
  Search, 
  Play, 
  Youtube, 
  X, 
  Globe, 
  ArrowUpDown,
  Layers,
  Code,
  Shield,
  Zap,
  Sparkles,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { Book } from '../data/courses';
import { cn } from '../lib/utils';
import { FavoriteButton } from '../components/FavoriteButton';
import { 
  BookVideoModal, 
  BookCoverVisual, 
  translateBookCategory, 
  AmazonIcon,
  isBookAvailableInLanguage,
  getLocalizedBookData,
  BOOK_CATEGORY_LABELS_AR
} from '../components/BookVideoModal';

const getCategoryIcon = (cat: string) => {
  const c = (cat || '').toLowerCase();
  if (c.includes('software') || c.includes('program') || c.includes('code')) return Code;
  if (c.includes('cyber') || c.includes('security')) return Shield;
  if (c.includes('ai') || c.includes('data')) return Zap;
  if (c.includes('business') || c.includes('startup')) return Briefcase;
  if (c.includes('productivity') || c.includes('mindset')) return Sparkles;
  return Layers;
};

const normalizeCategoryKey = (cat = '') => {
  const trimmed = cat.trim();
  const lower = trimmed.toLowerCase();
  const matchedKey = Object.keys(BOOK_CATEGORY_LABELS_AR).find(
    k => k.toLowerCase() === lower || BOOK_CATEGORY_LABELS_AR[k] === trimmed
  );
  return matchedKey || trimmed || 'General';
};

export function Books() {
  const { i18n } = useTranslation();
  const { books, favorites, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCategory = searchParams.get('category') || 'all';

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [languageFilter, setLanguageFilter] = useState<'current' | 'all'>('current');
  const [sortBy, setSortBy] = useState<'newest' | 'title' | 'author'>('newest');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const BOOKS_PER_PAGE = 6;

  // Sync URL ?category= and ?book= parameters
  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam) {
      setActiveCategory(catParam);
    }
    const bookParam = searchParams.get('book');
    if (bookParam && books.length > 0) {
      const found = books.find(b => b.id === bookParam);
      if (found) setSelectedBook(found);
    }
  }, [searchParams, books]);

  // Base pool filtered strictly by active language version (unless user toggles 'all')
  const baseBooks = useMemo(() => {
    if (languageFilter === 'all') return books;
    const currentLang = isRtl ? 'ar' : 'en';
    return books.filter(b => isBookAvailableInLanguage(b, currentLang));
  }, [books, isRtl, languageFilter]);

  // All categories with book counts
  const categoriesList = useMemo(() => {
    const counts: Record<string, number> = {};
    baseBooks.forEach(b => {
      const cat = normalizeCategoryKey(b.category);
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const dynamic = Object.keys(counts).map(cat => ({
      id: cat,
      label: translateBookCategory(cat, isRtl),
      count: counts[cat],
      icon: getCategoryIcon(cat)
    }));

    return [
      { id: 'all', label: isRtl ? 'جميع الأقسام' : 'All Categories', count: baseBooks.length, icon: BookOpen },
      ...dynamic
    ];
  }, [baseBooks, isRtl]);

  // Filtered and sorted books
  const filteredBooks = useMemo(() => {
    let result = baseBooks;

    if (showFavoritesOnly) {
      result = result.filter(b => Boolean(favorites?.[`book_${b.id}`]));
    }

    if (activeCategory !== 'all') {
      const targetNorm = normalizeCategoryKey(activeCategory).toLowerCase();
      result = result.filter(
        b => normalizeCategoryKey(b.category).toLowerCase() === targetNorm
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        b =>
          (b.title || '').toLowerCase().includes(q) ||
          (b.author || '').toLowerCase().includes(q) ||
          (b.youtubeName || '').toLowerCase().includes(q) ||
          (b.youtubeNameAr || '').toLowerCase().includes(q) ||
          (b.category || '').toLowerCase().includes(q) ||
          (b.description || '').toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'author') return (a.author || '').localeCompare(b.author || '');
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [baseBooks, activeCategory, searchQuery, sortBy, showFavoritesOnly, favorites]);

  // Reset to page 1 when category, search, language, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery, languageFilter, sortBy, showFavoritesOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / BOOKS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedBooks = useMemo(() => {
    const start = (safePage - 1) * BOOKS_PER_PAGE;
    return filteredBooks.slice(start, start + BOOKS_PER_PAGE);
  }, [filteredBooks, safePage, BOOKS_PER_PAGE]);

  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(clamped);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const handleSelectCategory = (catId: string) => {
    setActiveCategory(catId);
    setCurrentPage(1);
    setMobileCategoriesOpen(false);
    if (catId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', catId);
    }
    setSearchParams(searchParams, { replace: true });
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full min-h-screen bg-background pb-20 text-start">
      <SEO
        title={isRtl ? 'مكتبة الكتب المشروحة بالفيديو | Skilliq' : 'Tech Books Library & Video Summaries | Skilliq'}
        description={
          isRtl
            ? 'استكشف أفضل الكتب التقنية والعلمية وتطوير الذات مشروحة بالفيديو من نخبة صناع المحتوى على يوتيوب.'
            : 'Explore the best software engineering, AI, cybersecurity, and mindset books explained by top YouTube educators.'
        }
        canonicalPath="/books"
        lang={isRtl ? 'ar' : 'en'}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Books Library', url: '/books' }
        ]}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Skilliq Curated Tech Books & Video Summaries',
          description: 'Explore top software engineering, AI, cybersecurity, and productivity books explained via curated video summaries.',
          numberOfItems: baseBooks.length
        }}
      />

      {/* Book Video Popup Modal */}
      <BookVideoModal
        book={selectedBook}
        onClose={() => {
          setSelectedBook(null);
          if (searchParams.has('book')) {
            searchParams.delete('book');
            setSearchParams(searchParams, { replace: true });
          }
        }}
        onSelectBook={(b) => setSelectedBook(b)}
      />

      {/* TOP HERO / SEARCH HEADER */}
      <section className="w-full bg-muted/20 border-b border-border/70 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2.5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
                <BookOpen className="w-4 h-4" />
                <span>{isRtl ? 'مكتبة Skilliq المعرفية' : 'Skilliq Curated Book Library'}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {baseBooks.length} {isRtl ? 'كتاب مشروح' : 'Video Books'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight text-balance">
                {isRtl ? 'مكتبة الكتب العالمية المشروحة بالفيديو' : 'Books & Video Summaries Library'}
              </h1>

              <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                {isRtl
                  ? 'تصفح أقسام الكتب التقنية والمهنية من القائمة الجانبية، وشاهد أفضل الشروحات والملخصات المرئية من نخبة القنوات التعليمية.'
                  : 'Navigate curated book categories in software architecture, AI, cybersecurity, and deep focus—explained by top YouTube creators.'}
              </p>
            </div>

            {/* SEARCH & LANGUAGE FILTER BAR */}
            <div className="w-full lg:w-[420px] space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isRtl
                      ? 'ابحث باسم الكتاب، المؤلف، أو قناة اليوتيوب...'
                      : 'Search by book title, author, or YouTube channel...'
                  }
                  className="w-full ps-10 pe-9 py-3 bg-card border border-border/80 rounded-2xl text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none shadow-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Language Scope Segmented Toggle */}
                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-card border border-border/80 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setLanguageFilter('current')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap",
                      languageFilter === 'current'
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isRtl ? 'الكتب العربية' : 'English Books'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguageFilter('all')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1",
                      languageFilter === 'all'
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Globe className="w-3 h-3" />
                    <span>{isRtl ? 'جميع اللغات' : 'All Languages'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFavoritesOnly(prev => !prev)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1",
                      showFavoritesOnly
                        ? "bg-rose-500 text-white shadow-2xs"
                        : "text-rose-500 hover:bg-rose-500/10"
                    )}
                  >
                    <span>❤️ {isRtl ? 'المفضلة' : 'Favorites'}</span>
                  </button>
                </div>

                {/* Sort Selector */}
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-card border border-border/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="newest">{isRtl ? 'الأحدث إضافة' : 'Newest First'}</option>
                    <option value="title">{isRtl ? 'عنوان الكتاب (أ-ي)' : 'Title (A-Z)'}</option>
                    <option value="author">{isRtl ? 'المؤلف' : 'By Author'}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT WITH SIDE MENU FOR "BROWSE BY BOOK CATEGORY" */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          
          {/* =====================================================================
              SIDE MENU: BROWSE BY BOOK CATEGORY (Desktop Sticky Sidebar + Mobile/Tablet Collapsible & Scroll Bar)
          ===================================================================== */}
          <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24">
            <div className="bg-card border border-border/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-extrabold text-foreground leading-tight">
                      {isRtl ? 'تصفح حسب التصنيف' : 'Browse by Book Category'}
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      {categoriesList.length - 1} {isRtl ? 'أقسام معرفية' : 'Specializations'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {activeCategory !== 'all' && (
                    <button
                      type="button"
                      onClick={() => handleSelectCategory('all')}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer px-2 py-1 rounded-lg bg-primary/5"
                    >
                      {isRtl ? 'الكل' : 'Reset'}
                    </button>
                  )}

                  {/* Mobile / Tablet Drawer Toggle */}
                  <button
                    type="button"
                    onClick={() => setMobileCategoriesOpen(prev => !prev)}
                    className="lg:hidden px-2.5 py-1.5 rounded-xl bg-muted text-foreground text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{mobileCategoriesOpen ? (isRtl ? 'إخفاء' : 'Hide') : (isRtl ? 'الأقسام' : 'Categories')}</span>
                  </button>
                </div>
              </div>

              {/* Mobile / Tablet Quick Horizontal Pill Bar when collapsed */}
              {!mobileCategoriesOpen && (
                <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
                  {categoriesList.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = activeCategory.toLowerCase() === cat.id.toLowerCase();
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat.id)}
                        className={cn(
                          "flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-muted/40 hover:bg-muted text-foreground border-border/70"
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{cat.label}</span>
                        <span className={cn(
                          "text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-md",
                          isSelected ? "bg-black/20 text-primary-foreground" : "bg-card text-muted-foreground"
                        )}>
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Vertical Side Menu Navigation List (Always visible on Laptop lg+, expandable on Mobile/Tablet) */}
              <nav
                aria-label={isRtl ? 'أقسام الكتب' : 'Book Categories'}
                className={cn(
                  "space-y-1.5 pt-1 border-t border-border/60",
                  mobileCategoriesOpen ? "block" : "hidden lg:block"
                )}
              >
                {categoriesList.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = activeCategory.toLowerCase() === cat.id.toLowerCase();
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.id)}
                      className={cn(
                        "w-full group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-start border",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-transparent hover:bg-muted/70 text-foreground border-transparent hover:border-border/70"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                            isSelected
                              ? "bg-white/20 text-primary-foreground"
                              : "bg-muted text-primary group-hover:bg-primary/15"
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{cat.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-lg text-[11px] font-mono tabular-nums font-bold",
                            isSelected
                              ? "bg-black/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground group-hover:text-foreground"
                          )}
                        >
                          {cat.count}
                        </span>
                        {isRtl ? (
                          <ChevronLeft className={cn("w-3.5 h-3.5 transition-transform", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-60")} />
                        ) : (
                          <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-60")} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* =====================================================================
              MAIN BOOKS CATALOG GRID
          ===================================================================== */}
          <div className="flex-1 min-w-0 w-full">
            {/* Active Results Counter & Selected Category Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold text-foreground">
                  {activeCategory === 'all'
                    ? (isRtl ? 'جميع الكتب المشروحة بالفيديو' : 'All Video Book Summaries')
                    : translateBookCategory(activeCategory, isRtl)}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold">
                  {filteredBooks.length}
                </span>
              </div>

              <p className="text-xs text-muted-foreground font-medium">
                {isRtl
                  ? `عرض الصفحة ${safePage} من ${totalPages} (${filteredBooks.length} كتاب)`
                  : `Page ${safePage} of ${totalPages} (${filteredBooks.length} ${filteredBooks.length === 1 ? 'book' : 'books'})`}
              </p>
            </div>

            {filteredBooks.length > 0 ? (
              <>
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {paginatedBooks.map((book, idx) => {
                    const localized = getLocalizedBookData(book, isRtl ? 'ar' : 'en');
                    return (
                      <motion.div
                        layout
                        key={book.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.25) }}
                        onClick={() => setSelectedBook(book)}
                        className="group bg-card border border-border/80 hover:border-primary/40 rounded-3xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-xl transition-all duration-200 hover:-translate-y-1 cursor-pointer text-start relative"
                      >
                        <div className="absolute top-6 end-6 z-30">
                          <FavoriteButton itemId={book.id} itemType="book" size="sm" />
                        </div>
                        <div>
                          {/* 3D Book Cover Presentation */}
                          <div className="px-4 sm:px-6 pt-1 pb-4">
                            <BookCoverVisual book={book} />
                          </div>

                          {/* Metadata Line: Category · SubCategory */}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                            <span className="font-semibold text-primary truncate">
                              {translateBookCategory(book.category, isRtl)}
                            </span>
                            {book.subCategory && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="truncate">{book.subCategory}</span>
                              </>
                            )}
                          </div>

                          {/* Book Title */}
                          <h3 className="text-base sm:text-lg font-extrabold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {book.title}
                          </h3>

                          {/* Book Author */}
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                            <span>{isRtl ? 'تأليف:' : 'By'}</span>
                            <span className="font-semibold text-foreground/90 truncate">{book.author}</span>
                          </p>

                          {/* Short Summary Preview */}
                          {book.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-2.5 leading-relaxed">
                              {book.description.replace(/[*=#>`]/g, '')}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-3.5 border-t border-border/60 space-y-3">
                          {/* Explainer YouTube Profile */}
                          <div className="flex items-center justify-between gap-2 bg-muted/30 p-2 rounded-xl border border-border/50">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="relative shrink-0">
                                <img
                                  src={localized.youtubeAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(localized.youtubeName || 'YT')}&background=ef4444&color=fff&bold=true`}
                                  alt={localized.youtubeName}
                                  className="w-7 h-7 rounded-full object-cover border border-border bg-muted"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(localized.youtubeName || 'YT')}&background=ef4444&color=fff&bold=true`;
                                  }}
                                />
                                <span className="absolute -bottom-0.5 -end-0.5 w-3.5 h-3.5 rounded-full bg-red-600 text-white flex items-center justify-center">
                                  <Youtube className="w-2 h-2" />
                                </span>
                              </div>
                              <div className="min-w-0">
                                <span className="block text-[10px] text-muted-foreground leading-none">
                                  {isRtl ? 'شرح قناة' : 'Explained by'}
                                </span>
                                <span className="block text-xs font-bold text-foreground truncate mt-0.5">
                                  {localized.youtubeName}
                                </span>
                              </div>
                            </div>

                            <span className="text-[11px] font-mono tabular-nums text-muted-foreground shrink-0">
                              {localized.videoDuration}
                            </span>
                          </div>

                          {/* Action Buttons Row: Watch Video + Optional Buy Link for Active Language */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBook(book);
                              }}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-foreground text-background hover:bg-primary hover:text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>{isRtl ? 'مشاهدة الشرح' : 'Watch Summary'}</span>
                            </button>

                            {localized.buyUrl && localized.buyUrl.trim() !== '' && (
                              <a
                                href={localized.buyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#FF9900] to-[#F57C00] hover:from-[#fa8900] hover:to-[#e65100] text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-all shrink-0 shadow-xs"
                                title={isRtl ? 'شراء الكتاب من أمازون' : 'Buy This Book on Amazon'}
                              >
                                <AmazonIcon className="w-3.5 h-3.5 text-slate-950" />
                                <span>{isRtl ? 'شراء' : 'Buy'}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>

              {/* PAGINATION CONTROLS (NEXT / PREVIOUS / PAGE NUMBERS) */}
              {totalPages > 1 && (
                <div className="mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-muted-foreground font-medium">
                    {isRtl
                      ? `عرض ${(safePage - 1) * BOOKS_PER_PAGE + 1} - ${Math.min(safePage * BOOKS_PER_PAGE, filteredBooks.length)} من أصل ${filteredBooks.length} كتاب`
                      : `Showing ${(safePage - 1) * BOOKS_PER_PAGE + 1}–${Math.min(safePage * BOOKS_PER_PAGE, filteredBooks.length)} of ${filteredBooks.length} books`}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    <button
                      type="button"
                      onClick={() => handlePageChange(safePage - 1)}
                      disabled={safePage === 1}
                      className="px-3.5 py-2 rounded-xl bg-card border border-border/80 hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-2xs"
                    >
                      {isRtl ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                      <span>{isRtl ? 'الصفحة السابقة' : 'Previous'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                        const isCurrent = pageNum === safePage;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => handlePageChange(pageNum)}
                            className={cn(
                              "w-9 h-9 rounded-xl text-xs font-mono font-extrabold transition-all cursor-pointer flex items-center justify-center border",
                              isCurrent
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/80"
                            )}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePageChange(safePage + 1)}
                      disabled={safePage === totalPages}
                      className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-xs"
                    >
                      <span>{isRtl ? 'الصفحة التالية' : 'Next Page'}</span>
                      {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
              </>
            ) : (
              /* Empty Filter State */
              <div className="max-w-md mx-auto my-12 p-8 text-center bg-card border border-border/80 rounded-3xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {isRtl ? 'لم يتم العثور على كتب مطابقة' : 'No matching books found'}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRtl
                    ? 'جرب البحث بكلمات أخرى أو التبديل إلى عرض جميع اللغات والأقسام.'
                    : 'Try adjusting your search keywords, selecting another category from the side menu, or switching to All Languages.'}
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      handleSelectCategory('all');
                      setLanguageFilter('all');
                      setShowFavoritesOnly(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
                  >
                    {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset All Filters'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
