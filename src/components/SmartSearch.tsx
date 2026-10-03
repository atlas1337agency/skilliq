import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  ArrowRight, 
  Layers, 
  BookOpen, 
  Sparkles, 
  Flame, 
  Command, 
  PlayCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { filterByLanguage, filterPathsByLanguage } from '../lib/utils';
import { Course, LearningPath } from '../data/courses';

/**
 * Normalizes text for smart bilingual and tolerant search:
 * - Strips Arabic diacritics/tashkeel
 * - Normalizes Alef variants (أ, إ, آ -> ا)
 * - Normalizes Taa Marbuta (ة -> ه)
 * - Normalizes Alif Maqsura (ى -> ي)
 * - Case-insensitive for Latin characters
 */
export function normalizeSearchQuery(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآء]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();
}

interface SmartSearchProps {
  mode?: 'both' | 'inline' | 'modal';
  isMobileModalOpen?: boolean;
  onCloseMobileModal?: () => void;
  className?: string;
  inputClassName?: string;
}

export function SmartSearch({ 
  mode = 'both',
  isMobileModalOpen = false, 
  onCloseMobileModal,
  className = '',
  inputClassName = ''
}: SmartSearchProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { courses: storeCourses, learningPaths, language } = useStore();
  const currentAppLang: 'en' | 'ar' = (language === 'ar' || i18n.language === 'ar') ? 'ar' : 'en';
  const isRtl = currentAppLang === 'ar';

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Platform detection for ⌘K vs Ctrl+K
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform || ''));
    }
  }, []);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.innerWidth < 768 && onCloseMobileModal) {
          // Open mobile search
          window.dispatchEvent(new CustomEvent('open-smart-search'));
        } else {
          inputRef.current?.focus();
          setIsOpen(true);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        if (onCloseMobileModal) onCloseMobileModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCloseMobileModal]);

  // Click outside listener for desktop dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autofocus when mobile modal opens
  useEffect(() => {
    if (isMobileModalOpen) {
      setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 100);
    }
  }, [isMobileModalOpen]);

  // Filter courses and paths by active language
  const availableCourses = useMemo(() => {
    return filterByLanguage(storeCourses || [], currentAppLang);
  }, [storeCourses, currentAppLang]);

  const availablePaths = useMemo(() => {
    return filterPathsByLanguage(learningPaths || [], storeCourses || [], currentAppLang);
  }, [learningPaths, storeCourses, currentAppLang]);

  // Popular search tags depending on language
  const popularTopics = useMemo(() => {
    if (isRtl) {
      return [
        { label: 'الأمن السيبراني', term: 'امن' },
        { label: 'تطوير الويب', term: 'web' },
        { label: 'بايثون', term: 'python' },
        { label: 'التسويق الرقمي', term: 'تسويق' },
        { label: 'الذكاء الاصطناعي', term: 'ذكاء' },
        { label: 'تصميم UI/UX', term: 'تصميم' }
      ];
    }
    return [
      { label: 'Cyber Security', term: 'cyber' },
      { label: 'Web Development', term: 'web' },
      { label: 'Python', term: 'python' },
      { label: 'Digital Marketing', term: 'marketing' },
      { label: 'AI & Data', term: 'ai' },
      { label: 'UI/UX Design', term: 'design' }
    ];
  }, [isRtl]);

  // Perform smart search
  const searchResults = useMemo(() => {
    const cleanQuery = normalizeSearchQuery(query);
    if (!cleanQuery) {
      return { courses: [], paths: [], totalCount: 0 };
    }

    const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);

    // Match courses
    const matchedCourses = availableCourses.filter(course => {
      const titleNorm = normalizeSearchQuery(course.title || '');
      const instructorNorm = normalizeSearchQuery(course.instructor || '');
      const categoryNorm = normalizeSearchQuery(course.category || '');
      const descNorm = normalizeSearchQuery(course.description || '');

      const fullHaystack = `${titleNorm} ${instructorNorm} ${categoryNorm} ${descNorm}`;
      return queryTokens.every(token => fullHaystack.includes(token));
    });

    // Match learning paths
    const matchedPaths = availablePaths.filter(path => {
      const titleNorm = normalizeSearchQuery(path.title || '');
      const descNorm = normalizeSearchQuery(path.description || '');
      const fullHaystack = `${titleNorm} ${descNorm}`;
      return queryTokens.every(token => fullHaystack.includes(token));
    });

    return {
      courses: matchedCourses.slice(0, 5),
      paths: matchedPaths.slice(0, 2),
      totalCount: matchedCourses.length + matchedPaths.length
    };
  }, [query, availableCourses, availablePaths]);

  // Top trending / suggested courses when query is empty
  const suggestedCourses = useMemo(() => {
    return availableCourses.slice(0, 3);
  }, [availableCourses]);

  const handleSubmit = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const finalQuery = (customQuery !== undefined ? customQuery : query).trim();
    setIsOpen(false);
    if (onCloseMobileModal) onCloseMobileModal();
    if (finalQuery) {
      navigate(`/courses?search=${encodeURIComponent(finalQuery)}`);
    } else {
      navigate('/courses');
    }
  };

  const handleSelectTopic = (topicTerm: string) => {
    setQuery(topicTerm);
    handleSubmit(undefined, topicTerm);
  };

  // Reusable search results list component
  const ResultsContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="space-y-4">
      {/* WHEN QUERY IS EMPTY: Show Popular Topic Chips & Trending courses */}
      {!query.trim() ? (
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>{isRtl ? 'المواضيع الشائعة' : 'Popular Topics'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {popularTopics.map((topic, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectTopic(topic.term)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-muted/60 hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-border/60 transition-all font-medium text-foreground/80 cursor-pointer text-start"
                >
                  {topic.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick recommendations */}
          {suggestedCourses.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>{isRtl ? 'دورات مقترحة لك' : 'Recommended For You'}</span>
              </div>
              <div className="space-y-1">
                {suggestedCourses.map(course => (
                  <Link
                    key={course.id}
                    to={`/course/${course.id}`}
                    onClick={() => {
                      setIsOpen(false);
                      if (onCloseMobileModal) onCloseMobileModal();
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/70 transition-colors group cursor-pointer"
                  >
                    <div className="w-10 h-8 rounded-lg bg-muted overflow-hidden shrink-0 relative">
                      <img 
                        src={course.thumbnail} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {course.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {course.instructor} · {course.category}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary rtl:rotate-180 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* WHEN USER HAS TYPED A QUERY */
        <div className="space-y-3">
          {searchResults.totalCount === 0 ? (
            <div className="py-6 text-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-foreground mb-1">
                {isRtl ? `لم يتم العثور على نتائج لـ "${query}"` : `No results found for "${query}"`}
              </p>
              <p className="text-[11px] text-muted-foreground mb-3">
                {isRtl ? 'جرب البحث بكلمات أخرى أو تصفح كل الدورات' : 'Try searching with different keywords or browse all courses'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setIsOpen(false);
                  if (onCloseMobileModal) onCloseMobileModal();
                  navigate('/courses');
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
              >
                {isRtl ? 'تصفح جميع الدورات' : 'Browse All Courses'}
              </button>
            </div>
          ) : (
            <>
              {/* Learning Paths Matches */}
              {searchResults.paths.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 px-1 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-indigo-500" />
                    <span>{isRtl ? 'مسارات التعلم' : 'Learning Paths'}</span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.paths.map(path => (
                      <Link
                        key={path.id}
                        to={`/paths`}
                        onClick={() => {
                          setIsOpen(false);
                          if (onCloseMobileModal) onCloseMobileModal();
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/70 transition-colors group cursor-pointer border border-border/40"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {path.title}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {path.courseIds?.length || 0} {isRtl ? 'دورات في هذا المسار' : 'courses in track'}
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full shrink-0">
                          {isRtl ? 'مسار' : 'Path'}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Courses Matches */}
              {searchResults.courses.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 px-1 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-primary" />
                    <span>{isRtl ? 'الدورات' : 'Courses'}</span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.courses.map(course => (
                      <Link
                        key={course.id}
                        to={`/course/${course.id}`}
                        onClick={() => {
                          setIsOpen(false);
                          if (onCloseMobileModal) onCloseMobileModal();
                        }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/70 transition-colors group cursor-pointer"
                      >
                        <div className="w-12 h-8 rounded-lg bg-muted overflow-hidden shrink-0 relative">
                          <img 
                            src={course.thumbnail} 
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {course.title}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {course.instructor} · <span className="text-primary/90">{course.category}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary rtl:rotate-180 transition-transform" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* View all results link */}
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="w-full text-center py-2.5 px-3 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors border border-primary/20 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <span>{isRtl ? `عرض جميع النتائج لـ "${query}"` : `View all results for "${query}"`}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* DESKTOP & TABLET INLINE SMART SEARCH */}
      {mode !== 'modal' && (
        <div 
          ref={containerRef} 
          className={`relative ${className}`}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <form 
            onSubmit={handleSubmit}
            className="relative flex items-center"
          >
            <div className="relative w-full flex items-center">
              <Search className="w-4 h-4 absolute start-3 text-muted-foreground pointer-events-none transition-colors" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={isRtl ? 'ابحث في الدورات والمسارات...' : 'Search courses, paths...'}
                className={`w-full bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border/70 focus:border-primary/70 rounded-full ps-8 pe-14 sm:ps-9 sm:pe-16 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${inputClassName}`}
              />

              <div className="absolute end-2 flex items-center gap-1">
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-background/80 border border-border/80 rounded shadow-2xs select-none">
                    {isMac ? '⌘K' : 'Ctrl+K'}
                  </kbd>
                )}
              </div>
            </div>
          </form>

          {/* DESKTOP / TABLET DROPDOWN RESULTS */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                className="absolute top-full start-0 end-0 mt-2 bg-card/98 backdrop-blur-2xl border border-border/80 rounded-2xl shadow-2xl overflow-hidden z-50 p-3 sm:p-4 text-start max-h-[460px] overflow-y-auto"
                style={{ minWidth: '320px', maxWidth: '440px' }}
              >
                <ResultsContent />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* MOBILE FULL-SCREEN SMART SEARCH MODAL */}
      {mode !== 'inline' && (
        <AnimatePresence>
          {isMobileModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col p-4 sm:p-6"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {/* Mobile Header Bar */}
              <div className="flex items-center gap-2 mb-4">
                <form 
                  onSubmit={handleSubmit}
                  className="relative flex-1 flex items-center"
                >
                  <Search className="w-4 h-4 absolute start-3 text-muted-foreground pointer-events-none" />
                  <input
                    ref={mobileInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={isRtl ? 'ابحث عن الدورات، المسارات، المهارات...' : 'Search courses, paths, skills...'}
                    className="w-full bg-muted/60 border border-border rounded-xl ps-9 pe-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        mobileInputRef.current?.focus();
                      }}
                      className="absolute end-2.5 p-1 rounded-md text-muted-foreground hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </form>

                <button
                  type="button"
                  onClick={onCloseMobileModal}
                  className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
              </div>

              {/* Mobile Scrollable Results Area */}
              <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
                <ResultsContent isMobile={true} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
