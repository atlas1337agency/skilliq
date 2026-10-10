import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  PlayCircle, 
  BookOpen, 
  ArrowRight, 
  Flame, 
  Award, 
  Layers,
  Eye,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { filterByLanguage, cn } from '../lib/utils';
import { formatCompactNumber } from '../lib/youtube';
import { ScrollingText } from './ScrollingText';
import { FavoriteButton } from './FavoriteButton';

export function PopularCoursesSection() {
  const { t, i18n } = useTranslation();
  const { user, courses, learningPaths, setIsAuthModalOpen, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  // Filter out single-video courses (masterclasses), real project builds, and playlists assigned to paths
  const allPlaylists = useMemo(() => {
    const pathCourseIds = new Set<string>();
    (learningPaths || []).forEach(p => (p.courseIds || []).forEach(id => pathCourseIds.add(id)));
    return filterByLanguage(courses, language).filter(
      c =>
        !(c.isSingleVideo === true || String(c.isSingleVideo).toLowerCase() === 'true') &&
        !(c.isProject === true || String((c as any).isProject).toLowerCase() === 'true') &&
        !pathCourseIds.has(c.id)
    );
  }, [courses, learningPaths, language]);

  // Top 8 popular courses
  const displayedCourses = useMemo(() => {
    return allPlaylists.slice(0, 8);
  }, [allPlaylists]);

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
                <div className="absolute bottom-3 end-3 z-20">
                  <FavoriteButton itemId={course.id} itemType="playlist" size="sm" />
                </div>

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
                
                {/* Lessons, Instructor & Real-Time Stats Bar */}
                <div className="flex flex-col gap-2 text-xs text-muted-foreground mb-5 bg-muted/30 p-2.5 rounded-xl border border-border/50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      <span>{course.videos.length} {t('videos')}</span>
                    </div>
                    <div className="font-medium text-foreground max-w-[55%] truncate flex items-center gap-1.5">
                      <ScrollingText>{course.instructor}</ScrollingText>
                      {(course.subscriberCountText || (course.subscriberCount && course.subscriberCount > 0)) && (
                        <span className="shrink-0 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/20">
                          {course.subscriberCountText || formatCompactNumber(course.subscriberCount)}
                        </span>
                      )}
                    </div>
                  </div>

                  {(() => {
                    const cViews = course.totalViews || course.videos.reduce((s, v) => s + (v.viewCount || 0), 0);
                    const cLikes = course.totalLikes || course.videos.reduce((s, v) => s + (v.likeCount || 0), 0);
                    const cComments = course.totalComments || course.videos.reduce((s, v) => s + (v.commentCount || 0), 0);
                    return (
                      <div className="flex items-center justify-between pt-1.5 border-t border-border/50 text-[11px] font-semibold">
                        <span className="inline-flex items-center gap-1 text-foreground" title={isRtl ? 'المشاهدات' : 'Views'}>
                          <Eye className="w-3 h-3 text-primary" />
                          <span>{formatCompactNumber(cViews)}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-foreground" title={isRtl ? 'الإعجابات' : 'Likes'}>
                          <ThumbsUp className="w-3 h-3 text-emerald-500" />
                          <span>{formatCompactNumber(cLikes)}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-foreground" title={isRtl ? 'التعليقات' : 'Comments'}>
                          <MessageSquare className="w-3 h-3 text-amber-500" />
                          <span>{formatCompactNumber(cComments)}</span>
                        </span>
                      </div>
                    );
                  })()}
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
