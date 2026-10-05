import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  X, 
  Play, 
  Clock, 
  BookOpen, 
  ExternalLink, 
  Youtube, 
  User, 
  CheckCircle2, 
  Sparkles,
  Share2,
  Check,
  Compass,
  ListChecks,
  FileText,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Book } from '../data/courses';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { FavoriteButton } from './FavoriteButton';

export const BOOK_CATEGORY_LABELS_AR: Record<string, string> = {
  'All': 'جميع الكتب',
  'Software Engineering': 'هندسة البرمجيات',
  'AI & Future Tech': 'الذكاء الاصطناعي والمستقبل',
  'Cybersecurity': 'الأمن السيبراني',
  'Productivity & Mindset': 'الإنتاجية وتطوير الذات',
  'Business & Startups': 'ريادة الأعمال والشركات',
  'Design & Product': 'التصميم وبناء المنتجات',
  'Computer Science': 'علوم الحاسوب',
  'Programming': 'البرمجة',
  'Self-Development': 'تطوير الذات'
};

export function translateBookCategory(cat: string, isRtl: boolean): string {
  if (!cat) return isRtl ? 'عام' : 'General';
  if (!isRtl) return cat;
  return BOOK_CATEGORY_LABELS_AR[cat] || cat;
}

/**
 * Helper to check if a book is available in the requested app language ('en' or 'ar')
 * and resolve the localized video/channel/buy fields for that language.
 */
export function isBookAvailableInLanguage(book: Partial<Book>, targetLang: 'en' | 'ar' | string): boolean {
  const isAr = targetLang === 'ar' || targetLang.toLowerCase() === 'arabic';
  const hasEnLink = Boolean(
    (book.youtubeId && book.youtubeId.trim() && book.language !== 'Arabic') ||
    (book.youtubeUrl && book.youtubeUrl.trim() && book.language !== 'Arabic')
  );
  const hasArLink = Boolean(
    (book.youtubeIdAr && book.youtubeIdAr.trim()) ||
    (book.youtubeUrlAr && book.youtubeUrlAr.trim()) ||
    (book.language === 'Arabic' && ((book.youtubeId && book.youtubeId.trim()) || (book.youtubeUrl && book.youtubeUrl.trim())))
  );

  if (isAr) {
    return hasArLink || book.language === 'Both';
  }
  return hasEnLink || book.language === 'Both';
}

export function getLocalizedBookData(book: Partial<Book>, currentLang: 'en' | 'ar' | string) {
  const isAr = currentLang === 'ar' || currentLang.toLowerCase() === 'arabic';
  const hasDedicatedArVideo = Boolean((book.youtubeIdAr && book.youtubeIdAr.trim()) || (book.youtubeUrlAr && book.youtubeUrlAr.trim()));

  if (isAr && hasDedicatedArVideo) {
    return {
      youtubeId: (book.youtubeIdAr || book.youtubeId || '').trim(),
      youtubeUrl: (book.youtubeUrlAr || book.youtubeUrl || '').trim(),
      videoTitle: (book.videoTitleAr || book.videoTitle || book.title || '').trim(),
      videoThumbnail: (book.videoThumbnailAr || book.videoThumbnail || '').trim(),
      videoDuration: (book.videoDurationAr || book.videoDuration || '15:00').trim(),
      youtubeName: (book.youtubeNameAr || book.youtubeName || 'YouTube Educator').trim(),
      youtubeAvatar: (book.youtubeAvatarAr || book.youtubeAvatar || '').trim(),
      youtubeChannelUrl: (book.youtubeChannelUrlAr || book.youtubeChannelUrl || '').trim(),
      buyUrl: (book.buyUrlAr?.trim() ? book.buyUrlAr.trim() : (book.buyUrl || '').trim()),
      buyUrlEn: (book.buyUrl || '').trim(),
      buyUrlAr: (book.buyUrlAr || '').trim()
    };
  }

  return {
    youtubeId: (book.youtubeId || book.youtubeIdAr || '').trim(),
    youtubeUrl: (book.youtubeUrl || book.youtubeUrlAr || '').trim(),
    videoTitle: (book.videoTitle || book.videoTitleAr || book.title || '').trim(),
    videoThumbnail: (book.videoThumbnail || book.videoThumbnailAr || '').trim(),
    videoDuration: (book.videoDuration || book.videoDurationAr || '15:00').trim(),
    youtubeName: (book.youtubeName || book.youtubeNameAr || 'YouTube Educator').trim(),
    youtubeAvatar: (book.youtubeAvatar || book.youtubeAvatarAr || '').trim(),
    youtubeChannelUrl: (book.youtubeChannelUrl || book.youtubeChannelUrlAr || '').trim(),
    buyUrl: isAr
      ? (book.buyUrlAr?.trim() ? book.buyUrlAr.trim() : (book.buyUrl || '').trim())
      : (book.buyUrl?.trim() ? book.buyUrl.trim() : (book.buyUrlAr || '').trim()),
    buyUrlEn: (book.buyUrl || '').trim(),
    buyUrlAr: (book.buyUrlAr || '').trim()
  };
}

/**
 * Official Amazon Smile / Store Icon SVG
 */
export function AmazonIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {/* Amazon Iconic Curved Smile Arrow */}
      <path
        d="M2.8 16.4C7.6 20.1 14.5 20.8 20.2 17.5"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path
        d="M18.2 15.2C19.8 15.6 21.3 16.7 21.1 18.3C20.9 19.6 19.7 20.7 18.5 21.3"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Stylized 'a' letterform */}
      <path
        d="M14.7 10.2V7.6C14.7 5.4 13.1 4 10.6 4C8.4 4 6.9 5.1 6.6 6.8M14.7 10.2C14.7 11.7 14.9 12.6 15.4 13.2M14.7 10.2C13.3 10.1 11.4 10.2 9.8 10.6C7.8 11.1 6.5 12.1 6.5 13.6C6.5 15.1 7.8 16.1 9.6 16.1C11.5 16.1 13.4 15 14.7 13.1"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Smart Rich Text Renderer for Book Summaries & Key Takeaways
 */
export function FormattedInlineText({ text }: { text: string }) {
  if (!text) return null;

  const tokenRegex = /(\*\*[^*]+\*\*|==[^=]+==|`[^`]+`|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <strong key={i} className="font-extrabold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('==') && part.endsWith('==') && part.length > 4) {
          return (
            <mark
              key={i}
              className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold border border-amber-500/30"
            >
              {part.slice(2, -2)}
            </mark>
          );
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 rounded-md bg-muted font-mono text-[0.9em] text-primary font-semibold border border-border/70"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return (
            <em key={i} className="italic text-foreground/95 font-medium">
              {part.slice(1, -1)}
            </em>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

export function RichFormattedText({
  content,
  className = ''
}: {
  content: string;
  className?: string;
}) {
  if (!content || !content.trim()) return null;

  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = (keyPrefix: string) => {
    if (!currentList) return;
    if (currentList.type === 'ul') {
      blocks.push(
        <ul key={`${keyPrefix}_ul`} className="space-y-2 my-2.5 ps-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2 shadow-xs" />
              <span className="flex-1">
                <FormattedInlineText text={item} />
              </span>
            </li>
          ))}
        </ul>
      );
    } else {
      blocks.push(
        <ol key={`${keyPrefix}_ol`} className="space-y-2 my-2.5 ps-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <span className="w-5 h-5 rounded-md bg-primary/15 text-primary border border-primary/25 text-[11px] font-mono font-black flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="flex-1">
                <FormattedInlineText text={item} />
              </span>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      flushList(`empty_${index}`);
      return;
    }

    if (line === '---' || line === '***') {
      flushList(`hr_${index}`);
      blocks.push(<hr key={`hr_${index}`} className="border-border/60 my-3" />);
      return;
    }

    if (line.startsWith('### ') || line.startsWith('## ')) {
      flushList(`h_${index}`);
      const headingText = line.replace(/^#{2,3}\s+/, '');
      blocks.push(
        <h4
          key={`h_${index}`}
          className="text-sm sm:text-base font-extrabold text-foreground tracking-tight mt-3.5 mb-1.5 flex items-center gap-2"
        >
          <span className="w-1.5 h-4 rounded-full bg-primary shrink-0" />
          <span>
            <FormattedInlineText text={headingText} />
          </span>
        </h4>
      );
      return;
    }

    if (line.startsWith('> ')) {
      flushList(`q_${index}`);
      const quoteText = line.slice(2).trim();
      blocks.push(
        <blockquote
          key={`q_${index}`}
          className="my-2.5 p-3 sm:p-3.5 rounded-xl bg-primary/5 border-s-4 border-primary text-xs sm:text-sm text-foreground/90 italic leading-relaxed"
        >
          <FormattedInlineText text={quoteText} />
        </blockquote>
      );
      return;
    }

    const ulMatch = line.match(/^([-•*])\s+(.+)$/);
    if (ulMatch) {
      if (currentList && currentList.type !== 'ul') {
        flushList(`switch_${index}`);
      }
      if (!currentList) {
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[2]);
      return;
    }

    const olMatch = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (olMatch) {
      if (currentList && currentList.type !== 'ol') {
        flushList(`switch_${index}`);
      }
      if (!currentList) {
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[2]);
      return;
    }

    flushList(`p_${index}`);
    blocks.push(
      <p key={`p_${index}`} className="text-xs sm:text-sm text-muted-foreground leading-relaxed my-1.5">
        <FormattedInlineText text={line} />
      </p>
    );
  });

  flushList('final');

  return <div className={cn("space-y-1", className)}>{blocks}</div>;
}

export function BookCoverVisual({
  book,
  className = '',
  showDuration = true,
  showPlayOverlay = true
}: {
  book: Partial<Book>;
  className?: string;
  showDuration?: boolean;
  showPlayOverlay?: boolean;
}) {
  const { language } = useStore();
  const [imgError, setImgError] = useState(false);
  const localized = getLocalizedBookData(book, language);

  useEffect(() => {
    setImgError(false);
  }, [book.coverImage, localized.videoThumbnail]);

  const coverSrc = !imgError && book.coverImage?.trim()
    ? book.coverImage.trim()
    : (!imgError && localized.videoThumbnail ? localized.videoThumbnail : '');

  const getPalette = (category = '') => {
    const c = category.toLowerCase();
    if (c.includes('cyber') || c.includes('security')) {
      return 'from-emerald-950 via-slate-900 to-teal-950 border-emerald-500/30';
    }
    if (c.includes('ai') || c.includes('data')) {
      return 'from-indigo-950 via-slate-900 to-amber-950 border-amber-500/30';
    }
    if (c.includes('business') || c.includes('startup')) {
      return 'from-violet-950 via-slate-900 to-indigo-950 border-violet-500/30';
    }
    if (c.includes('productivity') || c.includes('mindset') || c.includes('habit')) {
      return 'from-amber-950 via-slate-900 to-stone-900 border-amber-400/30';
    }
    return 'from-sky-950 via-slate-900 to-blue-950 border-sky-500/30';
  };

  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full rounded-r-2xl rounded-l-md overflow-hidden bg-slate-900 shadow-lg transition-all duration-200 select-none group/cover border border-border/60",
        className
      )}
    >
      {/* Realistic Hardcover Spine Crease & Lighting */}
      <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/55 via-white/15 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-y-0 left-3.5 w-[1px] bg-black/30 z-20 pointer-events-none" />

      {coverSrc ? (
        <img
          src={coverSrc}
          alt={book.title || 'Book Cover'}
          className="w-full h-full object-cover transition-transform duration-300 group-hover/cover:scale-105"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className={cn("w-full h-full bg-gradient-to-br p-5 flex flex-col justify-between text-white relative", getPalette(book.category))}>
          <div className="flex items-center justify-between text-[10px] font-mono text-white/60 border-b border-white/15 pb-2">
            <span className="truncate">{book.category || 'SKILLIQ EDITION'}</span>
            <BookOpen className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          </div>
          <div className="my-auto py-2 ps-2">
            <h4 className="font-extrabold text-sm sm:text-base leading-snug line-clamp-4 text-white tracking-tight">
              {book.title || 'Untitled Book'}
            </h4>
            {book.author && (
              <p className="text-xs text-white/75 mt-2 font-medium line-clamp-2">
                {book.author}
              </p>
            )}
          </div>
          <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-white/60">
            <span>SKILLIQ LIBRARY</span>
            <span>{localized.videoDuration || '15:00'}</span>
          </div>
        </div>
      )}

      {/* Subtle Bottom Scrim for Contrast */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10 pointer-events-none" />

      {/* Video Duration Badge */}
      {showDuration && localized.videoDuration && (
        <div className="absolute bottom-2.5 end-2.5 z-20 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white text-[11px] font-mono tabular-nums font-semibold border border-white/15 shadow-sm">
          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
          <span>{localized.videoDuration}</span>
        </div>
      )}

      {/* Hover Play Video Overlay */}
      {showPlayOverlay && (
        <div className="absolute inset-0 z-20 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl transform scale-90 group-hover/cover:scale-100 transition-transform duration-200">
            <Play className="w-5 h-5 fill-current ms-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}

interface BookVideoModalProps {
  book: Book | null;
  onClose: () => void;
  onSelectBook?: (book: Book) => void;
}

export function BookVideoModal({ book, onClose, onSelectBook }: BookVideoModalProps) {
  const { i18n } = useTranslation();
  const { language, books, allBooks } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';
  const [copied, setCopied] = useState(false);
  const [activeBook, setActiveBook] = useState<Book | null>(book);

  useEffect(() => {
    setActiveBook(book);
  }, [book]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (activeBook) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeBook, onClose]);

  // Real data for books in the EXACT SAME CATEGORY (with smart normalization for EN/AR category names)
  const relatedBooks = useMemo(() => {
    if (!activeBook) return [];
    const targetLang = isRtl ? 'ar' : 'en';
    const pool = books.length > 0 ? books : allBooks;

    const normalizeCat = (cat = '') => {
      const trimmed = cat.trim();
      const lower = trimmed.toLowerCase();
      // Reverse lookup if Arabic label was saved directly as category
      const matchedKey = Object.keys(BOOK_CATEGORY_LABELS_AR).find(
        k => k.toLowerCase() === lower || BOOK_CATEGORY_LABELS_AR[k] === trimmed
      );
      return (matchedKey || trimmed).toLowerCase();
    };

    const currentCatNorm = normalizeCat(activeBook.category);

    // 1. Primary: Same category + available in active language
    const primaryMatches = pool.filter(
      b =>
        b.id !== activeBook.id &&
        normalizeCat(b.category) === currentCatNorm &&
        isBookAvailableInLanguage(b, targetLang)
    );

    if (primaryMatches.length > 0) {
      return primaryMatches.slice(0, 4);
    }

    // 2. Fallback within same category (any language) if only other language exists in that exact category
    return pool
      .filter(b => b.id !== activeBook.id && normalizeCat(b.category) === currentCatNorm)
      .slice(0, 4);
  }, [books, allBooks, activeBook, isRtl]);

  if (!activeBook) return null;

  const currentBook = activeBook;
  const localized = getLocalizedBookData(currentBook, isRtl ? 'ar' : 'en');
  const cleanTakeaways = (currentBook.keyTakeaways || []).filter(k => k.trim());
  const hasTakeaways = cleanTakeaways.length > 0;

  const handleSelectRelated = (rel: Book) => {
    setActiveBook(rel);
    if (onSelectBook) {
      onSelectBook(rel);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/books?book=${encodeURIComponent(currentBook.id)}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        dir={isRtl ? 'rtl' : 'ltr'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 w-screen h-screen bg-background/98 backdrop-blur-2xl flex flex-col overflow-hidden text-start"
      >
        {/* FULL-SCREEN TOP HEADER */}
        <header className="relative z-20 h-16 px-4 sm:px-6 lg:px-10 border-b border-border/70 bg-card/90 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/70 hover:bg-muted text-foreground border border-border/80 text-xs font-bold transition-all cursor-pointer shrink-0"
              title={isRtl ? 'إغلاق والعودة' : 'Close & Return (ESC)'}
            >
              {isRtl ? (
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              ) : (
                <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
              <span className="hidden sm:inline">{isRtl ? 'عودة' : 'Back'}</span>
            </button>

            <div className="h-6 w-[1px] bg-border/70 hidden sm:block shrink-0" />

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Link
                  to={`/books?category=${encodeURIComponent(currentBook.category)}`}
                  onClick={onClose}
                  className="font-bold text-primary hover:underline truncate"
                >
                  {translateBookCategory(currentBook.category, isRtl)}
                </Link>
                <span>·</span>
                <span className="truncate font-medium">{currentBook.author}</span>
                <span>·</span>
                <span className="font-mono tabular-nums text-amber-500 font-semibold flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  {localized.videoDuration || '15:00'}
                </span>
              </div>
              <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-foreground truncate">
                {currentBook.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <FavoriteButton
              itemId={currentBook.id}
              itemType="book"
              variant="pill"
              size="sm"
            />

            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-2 rounded-xl bg-card hover:bg-muted border border-border/80 text-xs font-bold text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isRtl ? 'مشاركة الكتاب' : 'Share Book'}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-muted-foreground" />}
              <span className="hidden sm:inline">
                {copied ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'مشاركة' : 'Share')}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-muted/80 hover:bg-red-500/15 text-muted-foreground hover:text-red-500 border border-border/70 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close full screen modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ORGANIC SINGLE-COLUMN VERTICAL STREAM IN LAPTOP, TABLET & MOBILE */}
        <div className="relative z-10 flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
            
            {/* =====================================================================
                1. 100% WIDTH YOUTUBE VIDEO PLAYER
            ===================================================================== */}
            <div className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-border/80 shadow-2xl">
              {localized.youtubeId ? (
                <iframe
                  key={localized.youtubeId}
                  src={`https://www.youtube.com/embed/${localized.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  title={localized.videoTitle || currentBook.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/70 p-6 text-center">
                  <Youtube className="w-12 h-12 text-red-500 mb-2" />
                  <p className="text-sm font-semibold">
                    {isRtl ? 'الفيديو غير متوفر حالياً' : 'Video preview unavailable'}
                  </p>
                </div>
              )}
            </div>

            {/* =====================================================================
                2. BELOW VIDEO: YOUTUBE PROFILE INFO + BOOK AUTHOR / CATEGORY
            ===================================================================== */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={localized.youtubeAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(localized.youtubeName || 'YT')}&background=ef4444&color=fff&bold=true`}
                    alt={localized.youtubeName}
                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-red-500/30 bg-muted shadow-sm"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(localized.youtubeName || 'YT')}&background=ef4444&color=fff&bold=true`;
                    }}
                  />
                  <span className="absolute -bottom-1 -end-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs">
                    <Youtube className="w-3 h-3" />
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground font-semibold">
                    <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 font-bold">
                      {isRtl ? 'قناة شرح الكتاب' : 'Explained on YouTube by'}
                    </span>
                    <span>·</span>
                    <span className="font-mono tabular-nums text-foreground font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      {localized.videoDuration || '15:00'}
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-extrabold text-foreground truncate mt-1">
                    {localized.youtubeName || (isRtl ? 'صانع محتوى تعليمي' : 'YouTube Educator')}
                  </h2>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span>{isRtl ? 'مؤلف الكتاب:' : 'Book Author:'}</span>
                      <strong className="text-foreground">{currentBook.author}</strong>
                    </span>
                    <span>·</span>
                    <Link
                      to={`/books?category=${encodeURIComponent(currentBook.category)}`}
                      onClick={onClose}
                      className="text-primary font-bold hover:underline"
                    >
                      {translateBookCategory(currentBook.category, isRtl)}
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {localized.youtubeChannelUrl && (
                  <a
                    href={localized.youtubeChannelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/25 text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
                  >
                    <Youtube className="w-4 h-4" />
                    <span>{isRtl ? 'زيارة قناة اليوتيوب' : 'Visit YouTube Channel'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* =====================================================================
                3. BELOW YOUTUBE PROFILE: SUMMARY AND TAKEAWAYS
            ===================================================================== */}
            {(currentBook.description || hasTakeaways) && (
              <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-card border border-border/80 shadow-sm space-y-6">
                {/* Summary */}
                {currentBook.description && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h3 className="text-base sm:text-lg font-extrabold text-foreground">
                        {isRtl ? 'نبذة عن الكتاب وملخص الشرح' : 'About This Book & Summary'}
                      </h3>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/60">
                      <RichFormattedText content={currentBook.description} />
                    </div>
                  </div>
                )}

                {/* Key Takeaways */}
                {hasTakeaways && (
                  <div className={cn("space-y-3.5", currentBook.description && "pt-5 border-t border-border/60")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                          <ListChecks className="w-4 h-4" />
                        </div>
                        <h3 className="text-base sm:text-lg font-extrabold text-foreground">
                          {isRtl ? 'أهم الأفكار والدروس المستفادة' : 'Key Takeaways'}
                        </h3>
                      </div>
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        {cleanTakeaways.length} {isRtl ? 'نقاط رئيسية' : 'Key Points'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cleanTakeaways.map((point, idx) => {
                        const cleanedPoint = point.replace(/^([-•*]|\d+[.)])\s+/, '');
                        return (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl bg-muted/25 hover:bg-muted/45 border border-border/70 transition-colors flex items-start gap-3"
                          >
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-xs font-mono font-black flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <div className="text-xs sm:text-sm text-foreground/95 leading-relaxed flex-1">
                              <FormattedInlineText text={cleanedPoint} />
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 opacity-80" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =====================================================================
                4. BELOW SUMMARY & TAKEAWAYS: RELATED BOOKS EXPLAINED ON VIDEO (REAL SAME BOOK CATEGORY)
            ===================================================================== */}
            {relatedBooks.length > 0 && (
              <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-foreground">
                        {isRtl
                          ? `كتب ذات صلة مشروحة بالفيديو — ${translateBookCategory(currentBook.category, isRtl)}`
                          : `Related Books Explained on Video — ${currentBook.category}`}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {isRtl
                          ? `كتب حقيقية من نفس قسم "${translateBookCategory(currentBook.category, isRtl)}"`
                          : `More curated video book summaries in ${currentBook.category}`}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/books?category=${encodeURIComponent(currentBook.category)}`}
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary transition-colors flex items-center gap-1"
                  >
                    <span>
                      {isRtl
                        ? `تصفح قسم ${translateBookCategory(currentBook.category, isRtl)}`
                        : `All ${currentBook.category} Books`}
                    </span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {relatedBooks.map(rel => {
                    const relLocal = getLocalizedBookData(rel, isRtl ? 'ar' : 'en');
                    return (
                      <button
                        key={rel.id}
                        type="button"
                        onClick={() => handleSelectRelated(rel)}
                        className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-muted/20 hover:bg-muted/60 border border-border/70 hover:border-primary/40 transition-all text-start cursor-pointer group/rel shadow-2xs"
                      >
                        <div className="w-14 sm:w-16 shrink-0">
                          <BookCoverVisual book={rel} showDuration={false} showPlayOverlay={false} className="rounded-r-xl" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary">
                            <span className="truncate">{translateBookCategory(rel.category, isRtl)}</span>
                            <span>·</span>
                            <span className="font-mono text-amber-500 flex items-center gap-0.5 shrink-0">
                              <Clock className="w-2.5 h-2.5" />
                              {relLocal.videoDuration}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-extrabold text-foreground line-clamp-1 group-hover/rel:text-primary transition-colors">
                            {rel.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {isRtl ? 'تأليف:' : 'By'} <span className="font-semibold text-foreground/85">{rel.author}</span>
                          </p>
                          <div className="flex items-center gap-1.5 pt-1">
                            <img
                              src={relLocal.youtubeAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(relLocal.youtubeName || 'YT')}&background=ef4444&color=fff&bold=true`}
                              alt={relLocal.youtubeName}
                              className="w-4 h-4 rounded-full object-cover border border-border shrink-0"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(relLocal.youtubeName || 'YT')}&background=ef4444&color=fff&bold=true`;
                              }}
                            />
                            <span className="text-[11px] font-bold text-muted-foreground truncate">
                              {relLocal.youtubeName}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =====================================================================
                5. BOTTOM ACTION BUTTONS (BUY BOOK FOR CURRENT VERSION + EXPLORE MORE BOOKS)
            ===================================================================== */}
            <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border/80 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
              {localized.buyUrl && localized.buyUrl.trim() !== '' && (
                <a
                  href={localized.buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF9900] via-[#F79400] to-[#F08000] hover:from-[#fa8900] hover:to-[#e65100] text-slate-950 font-black text-xs sm:text-sm md:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.99] cursor-pointer"
                >
                  <AmazonIcon className="w-5 h-5 text-slate-950" />
                  <span>
                    {isRtl ? 'شراء النسخة العربية / الكاملة من الكتاب (Amazon)' : 'Buy This Book on Amazon (English Edition)'}
                  </span>
                  <ExternalLink className="w-4 h-4 opacity-80 shrink-0" />
                </a>
              )}

              <Link
                to="/books"
                onClick={onClose}
                className={cn(
                  "py-4 px-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer",
                  !localized.buyUrl && "w-full"
                )}
              >
                <Compass className="w-4 h-4 shrink-0" />
                <span>{isRtl ? 'استكشف المزيد من الكتب والأقسام' : 'Explore All Books & Categories'}</span>
              </Link>
            </div>

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
