import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  PlayCircle, 
  BookOpen, 
  ArrowRight, 
  Flame, 
  Award, 
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { filterByLanguage, cn } from '../lib/utils';
import { ScrollingText } from './ScrollingText';

export function PopularCoursesSection() {
  const { t, i18n } = useTranslation();
  const { user, courses, setIsAuthModalOpen, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Filter out single-video courses (masterclasses)
  const allPlaylists = useMemo(() => {
    return filterByLanguage(courses, language).filter(
      c => !(c.isSingleVideo === true || String(c.isSingleVideo).toLowerCase() === 'true')
    );
  }, [courses, language]);

  // Extract available categories with count
  const categoryFilters = useMemo(() => {
    const counts: Record<string, number> = {};
    allPlaylists.forEach(c => {
      const cat = c.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const list = Object.keys(counts).map(cat => ({
      id: cat,
      label: cat,
      count: counts[cat]
    }));

    return [
      { id: 'all', label: t('quick_filter_all', 'All Topics'), count: allPlaylists.length },
      ...list
    ];
  }, [allPlaylists, t]);

  // Filtered courses based on active category tab
  const displayedCourses = useMemo(() => {
    const list = activeCategory === 'all'
      ? allPlaylists
      : allPlaylists.filter(c => (c.category || '').toLowerCase() === activeCategory.toLowerCase());
    return list.slice(0, 8); // Top 8 popular courses
  }, [allPlaylists, activeCategory]);

  return (
    <section dir={isRtl ? 'rtl' : 'ltr'} className="w-full transition-colors">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-border/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">
            <Flame className="w-3.5 h-3.5" />
            <span>{t('popular_courses_kicker', 'Trending Playlists')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            {t('popular_courses_title', 'Popular Courses & Playlists')}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            {t('popular_courses_subtitle', "Explore high-impact multi-lesson playlists curated from the world's best tech educators.")}
          </p>
        </div>

        <Link 
          to="/courses" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card hover:bg-muted text-foreground border border-border/80 text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all group shrink-0 w-fit cursor-pointer"
        >
          <span>{t('view_all_playlists', 'View All Playlists')}</span>
          <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* SMART CATEGORY FILTER CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
        {categoryFilters.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 shrink-0",
              activeCategory === tab.id
                ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                : "bg-card text-muted-foreground hover:text-foreground border-border/70 hover:bg-muted/60"
            )}
          >
            <span>{tab.label}</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-md",
              activeCategory === tab.id 
                ? "bg-background/20 text-background" 
                : "bg-muted text-muted-foreground"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* COURSES RESPONSIVE GRID */}
      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {displayedCourses.map((course, index) => (
            <motion.div
              layout
              key={course.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              className="group flex flex-col bg-card rounded-3xl border border-border/80 overflow-hidden hover:shadow-xl transition-all duration-200 hover:-translate-y-1.5 text-start"
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

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/45 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-xl scale-90 group-hover:scale-100 transition-transform">
                    <PlayCircle className="w-8 h-8 ps-0.5 text-white" />
                  </div>
                </div>

                {/* Category & Subcategory Badges */}
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
                
                {/* Lessons & Instructor Bar */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-5 bg-muted/30 p-2.5 rounded-xl border border-border/50">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    <span>{course.videos.length} {t('videos')}</span>
                  </div>
                  <div className="font-medium text-foreground max-w-[50%] truncate">
                    <ScrollingText>{course.instructor}</ScrollingText>
                  </div>
                </div>

                {/* Action CTA Button */}
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
        </AnimatePresence>
      </motion.div>

    </section>
  );
}
