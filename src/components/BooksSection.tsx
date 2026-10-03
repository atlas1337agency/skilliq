import React, { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Youtube, 
  ShoppingBag, 
  Sparkles,
  Compass,
  Layers
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore';
import { Book } from '../data/courses';
import { filterByLanguage, cn } from '../lib/utils';
import { 
  BookVideoModal, 
  BookCoverVisual, 
  translateBookCategory, 
  AmazonIcon,
  isBookAvailableInLanguage,
  getLocalizedBookData
} from './BookVideoModal';

export function BooksSection() {
  const { t, i18n } = useTranslation();
  const { books, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';
  const currentLang = isRtl ? 'ar' : 'en';

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Strictly filter books that have a video link for the active language version (EN vs AR)
  const languageBooks = useMemo(() => {
    return books.filter(b => isBookAvailableInLanguage(b, currentLang));
  }, [books, currentLang]);

  // Extract categories with counts
  const categoryTabs = useMemo(() => {
    const counts: Record<string, number> = {};
    languageBooks.forEach(b => {
      const cat = b.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const dynamicTabs = Object.keys(counts).map(cat => ({
      id: cat,
      label: translateBookCategory(cat, isRtl),
      count: counts[cat]
    }));

    return [
      { id: 'all', label: isRtl ? 'جميع الكتب' : 'All Books', count: languageBooks.length },
      ...dynamicTabs
    ];
  }, [languageBooks, isRtl]);

  // Filtered books for the active category
  const displayedBooks = useMemo(() => {
    if (activeCategory === 'all') return languageBooks;
    return languageBooks.filter(b => (b.category || '').toLowerCase() === activeCategory.toLowerCase());
  }, [languageBooks, activeCategory]);

  // Smooth horizontal slide handler (RTL-aware)
  const handleSlide = (direction: 'prev' | 'next') => {
    if (!sliderRef.current) return;
    const container = sliderRef.current;
    const scrollAmount = Math.max(container.clientWidth * 0.75, 280);
    const sign = direction === 'next' ? (isRtl ? -1 : 1) : (isRtl ? 1 : -1);
    container.scrollBy({ left: scrollAmount * sign, behavior: 'smooth' });
  };

  if (!books || books.length === 0) return null;

  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      className="w-full py-16 sm:py-20 bg-background border-t border-border/60 transition-colors relative overflow-hidden"
    >
      {/* Book Video Popup Modal */}
      <BookVideoModal
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onSelectBook={(b) => setSelectedBook(b)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SECTION HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="max-w-2xl text-start">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mb-2">
              <BookOpen className="w-4 h-4" />
              <span>{isRtl ? 'مكتبة الكتب المشروحة بالفيديو' : 'Video Book Summaries & Tech Library'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight text-balance">
              {isRtl ? 'كتب عالمية بشرح نخبة صناع المحتوى' : 'Essential Books Explained by Top Creators'}
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-2 leading-relaxed">
              {isRtl
                ? 'اضغط على غلاف أي كتاب لمشاهدة شرحه بالفيديو مباشرة، والتعرف على القناة الشارحة، وتصفح أقسام الكتب أو شراء النسخة الكاملة.'
                : 'Click any book cover to watch its curated video explanation, discover the YouTube educator behind it, and explore key takeaways.'}
            </p>
          </div>

          {/* SLIDER CONTROLS + EXPLORE MORE BOOKS CTA */}
          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSlide('prev')}
                className="w-10 h-10 rounded-xl bg-card hover:bg-muted border border-border/80 text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
                aria-label={isRtl ? 'السابق' : 'Previous books'}
              >
                {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={() => handleSlide('next')}
                className="w-10 h-10 rounded-xl bg-card hover:bg-muted border border-border/80 text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
                aria-label={isRtl ? 'التالي' : 'Next books'}
              >
                {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>

            <Link
              to="/books"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm font-bold shadow-xs transition-all group whitespace-nowrap cursor-pointer"
            >
              <span>{isRtl ? 'استكشف المزيد من الكتب' : 'Explore More Books'}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* INTERACTIVE CATEGORY FILTER BAR */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {categoryTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 border",
                activeCategory === tab.id
                  ? "bg-foreground text-background border-foreground shadow-xs"
                  : "bg-card text-muted-foreground hover:text-foreground border-border/70 hover:bg-muted/60"
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                "text-[11px] font-mono tabular-nums",
                activeCategory === tab.id ? "text-background/80" : "text-muted-foreground"
              )}>
                ({tab.count})
              </span>
            </button>
          ))}
        </div>

        {/* BOOKS COVERS HORIZONTAL SLIDER */}
        <div
          ref={sliderRef}
          className="flex items-stretch gap-5 sm:gap-6 overflow-x-auto pb-6 pt-1 snap-x snap-mandatory no-scrollbar scroll-smooth"
        >
          {displayedBooks.map((book, index) => {
            const localized = getLocalizedBookData(book, currentLang);
            return (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.3) }}
                onClick={() => setSelectedBook(book)}
                className="group w-[210px] sm:w-[235px] md:w-[250px] shrink-0 snap-start flex flex-col justify-between bg-card border border-border/80 hover:border-primary/40 rounded-2xl p-3.5 sm:p-4 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 cursor-pointer text-start"
              >
                <div>
                  {/* 3D Book Cover Frame */}
                  <div className="mb-3.5 px-2 pt-1">
                    <BookCoverVisual book={book} />
                  </div>

                  {/* Unboxed Category & Language Metadata */}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1 truncate">
                    <span className="font-semibold text-primary truncate">
                      {translateBookCategory(book.category, isRtl)}
                    </span>
                    {localized.buyUrl && (
                      <>
                        <span aria-hidden="true">·</span>
                        <a
                          href={localized.buyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline font-bold shrink-0"
                          title={isRtl ? 'شراء الكتاب من أمازون' : 'Buy Book on Amazon'}
                        >
                          <AmazonIcon className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'شراء' : 'Buy'}</span>
                        </a>
                      </>
                    )}
                  </div>

                  {/* Book Title */}
                  <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {book.title}
                  </h3>

                  {/* Book Author */}
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {isRtl ? 'المؤلف: ' : 'By '}<span className="text-foreground/90 font-medium">{book.author}</span>
                  </p>
                </div>

                {/* YouTube Explainer Profile Footer */}
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
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

                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors shrink-0">
                    <Play className="w-3.5 h-3.5 fill-current ms-0.5" />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* FINAL SLIDE CARD: EXPLORE MORE BOOKS & CATEGORIES */}
          <Link
            to="/books"
            className="group w-[210px] sm:w-[235px] md:w-[250px] shrink-0 snap-start flex flex-col items-center justify-center text-center bg-muted/25 hover:bg-muted/50 border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Compass className="w-7 h-7" />
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-foreground mb-1.5">
              {isRtl ? 'استكشف المزيد من الكتب' : 'Explore More Books'}
            </h3>

            <p className="text-xs text-muted-foreground leading-relaxed mb-5">
              {isRtl
                ? `تصفح المكتبة الكاملة (${books.length}+ كتاب) وتنقل بين جميع التخصصات والأقسام.`
                : `Browse the full library (${books.length}+ books) and navigate across all categories.`}
            </p>

            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs group-hover:bg-primary/90 transition-all">
              <span>{isRtl ? 'تصفح جميع الكتب' : 'Browse Library'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>

      </div>
    </section>
  );
}
