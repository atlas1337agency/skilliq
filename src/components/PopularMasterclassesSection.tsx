import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  PlayCircle, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Flame,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { filterByLanguage, cn } from '../lib/utils';
import { ScrollingText } from './ScrollingText';

function parseDurationMinutes(duration?: string): number {
  if (!duration) return 90;
  const str = duration.toLowerCase().trim();

  if (str.includes('h')) {
    const hoursMatch = str.match(/(\d+)\s*h/);
    const minsMatch = str.match(/(\d+)\s*m/);
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const mins = minsMatch ? parseInt(minsMatch[1], 10) : 0;
    return hours * 60 + mins;
  }

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

export function PopularMasterclassesSection() {
  const { t, i18n } = useTranslation();
  const { user, courses, setIsAuthModalOpen, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Single-video masterclasses only
  const allMasterclasses = useMemo(() => {
    return filterByLanguage(courses, language).filter(
      c => c.isSingleVideo === true || String(c.isSingleVideo).toLowerCase() === 'true'
    );
  }, [courses, language]);

  // Smart filter options
  const filterTabs = useMemo(() => {
    return [
      { id: 'all', label: t('quick_filter_all', 'All Masterclasses') },
      { id: 'deep_dive', label: t('duration_deep_dive', 'Deep Dives (2h+)') },
      { id: 'short_workshop', label: t('duration_short_workshop', 'Workshops (< 2h)') },
    ];
  }, [t]);

  // Filtered masterclasses
  const displayedMasterclasses = useMemo(() => {
    let list = allMasterclasses;
    if (activeFilter === 'deep_dive') {
      list = allMasterclasses.filter(c => parseDurationMinutes(c.videos?.[0]?.duration) >= 120);
    } else if (activeFilter === 'short_workshop') {
      list = allMasterclasses.filter(c => parseDurationMinutes(c.videos?.[0]?.duration) < 120);
    }
    return list.slice(0, 8); // Top 8 masterclasses
  }, [allMasterclasses, activeFilter]);

  return (
    <section dir={isRtl ? 'rtl' : 'ltr'} className="w-full transition-colors">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-border/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('popular_masterclasses_kicker', 'Single-Session Deep Dives')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            {t('popular_masterclasses_title', 'Curated Masterclasses')}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            {t('popular_masterclasses_subtitle', 'Zero fluff, single-session comprehensive deep dives built for immediate practical implementation.')}
          </p>
        </div>

        <Link 
          to="/masterclasses" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card hover:bg-muted text-foreground border border-border/80 text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all group shrink-0 w-fit cursor-pointer"
        >
          <span>{t('view_all_masterclasses', 'View All Masterclasses')}</span>
          <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* SMART FILTER CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 shrink-0",
              activeFilter === tab.id
                ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                : "bg-card text-muted-foreground hover:text-foreground border-border/70 hover:bg-muted/60"
            )}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* MASTERCLASSES RESPONSIVE GRID */}
      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {displayedMasterclasses.map((course, index) => (
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

                {/* Masterclass & Category Badges */}
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
                
                {/* Duration & Instructor Bar */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-5 bg-muted/30 p-2.5 rounded-xl border border-border/50">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{course.videos[0]?.duration || '2h+'}</span>
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
        </AnimatePresence>
      </motion.div>

    </section>
  );
}
