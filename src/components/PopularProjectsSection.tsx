import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  PlayCircle,
  BookOpen,
  Clock,
  ArrowRight,
  Rocket,
  Award,
  Trophy,
  Sparkles,
  Eye,
  ThumbsUp,
  MessageSquare,
  Code2,
  Video,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { filterByLanguage, cn } from '../lib/utils';
import { formatCompactNumber } from '../lib/youtube';
import {
  getCategoryDisplayName,
  isCourseNew,
  isProjectCourse,
  isMasterclassCourse,
  isProjectCertificateEligible,
  getCourseTimestamp,
  getCoursePath
} from '../lib/courseUtils';
import { ScrollingText } from './ScrollingText';
import { FavoriteButton } from './FavoriteButton';
import { ShareCourseButton } from './ShareCourseButton';

type FormatFilter = 'all' | 'playlist' | 'masterclass';

export function PopularProjectsSection() {
  const { t, i18n } = useTranslation();
  const { user, courses, progress, setIsAuthModalOpen, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const [visibleCount, setVisibleCount] = useState<number>(4);

  // Filter real-world project builds for the active language (Admin-added only)
  const allProjects = useMemo(() => {
    return filterByLanguage(courses, language)
      .filter(c => isProjectCourse(c) && !c.id.startsWith('project-'))
      .sort((a, b) => getCourseTimestamp(b) - getCourseTimestamp(a));
  }, [courses, language]);

  const playlistProjectsCount = useMemo(
    () => allProjects.filter(c => !isMasterclassCourse(c)).length,
    [allProjects]
  );

  const longVideoProjectsCount = useMemo(
    () => allProjects.filter(c => isMasterclassCourse(c)).length,
    [allProjects]
  );

  const filteredProjects = useMemo(() => {
    if (formatFilter === 'playlist') {
      return allProjects.filter(c => !isMasterclassCourse(c));
    }
    if (formatFilter === 'masterclass') {
      return allProjects.filter(c => isMasterclassCourse(c));
    }
    return allProjects;
  }, [allProjects, formatFilter]);

  const displayedProjects = useMemo(() => {
    return filteredProjects.slice(0, visibleCount);
  }, [filteredProjects, visibleCount]);

  const hasMoreToExpand = visibleCount < filteredProjects.length;

  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      className="w-full py-16 sm:py-20 bg-background border-t border-border/60 transition-colors relative overflow-hidden"
    >
      {/* Subtle ambient glow */}
      <div className="pointer-events-none absolute top-0 end-1/4 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* SECTION HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 pb-5 border-b border-border/80">
          <div className="text-start max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2.5">
              <Rocket className="w-3.5 h-3.5" />
              <span>
                {isRtl
                  ? 'تطبيق عملي 100% · بناء مشاريع حقيقية'
                  : '100% Hands-On Practice · Real Project Builds'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              {isRtl
                ? 'المشاريع العملية وبناء التطبيقات الحقيقية'
                : t('real_world_projects', 'Real-World Project Builds')}
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1.5 leading-relaxed">
              {isRtl
                ? 'تعلم بالممارسة العملية وبناء المشاريع الحقيقية خطوة بخطوة عبر قوائم تشغيل وفيديوهات مطولة لبناء معرض أعمالك الاحترافي.'
                : 'Learn by building real production apps from scratch. Step-by-step project playlists and full-length build sessions with zero fluff.'}
            </p>
          </div>

          {/* Format Quick Filter Tabs + View All Link */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 shrink-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setFormatFilter('all');
                  setVisibleCount(4);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5',
                  formatFilter === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground border-border/80 hover:bg-muted/60'
                )}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{isRtl ? 'الكل' : 'All'}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/15 text-[10px]">
                  {allProjects.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormatFilter('playlist');
                  setVisibleCount(4);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5',
                  formatFilter === 'playlist'
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground border-border/80 hover:bg-muted/60'
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isRtl ? 'قوائم تشغيل' : 'Playlists'}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/15 text-[10px]">
                  {playlistProjectsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormatFilter('masterclass');
                  setVisibleCount(4);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5',
                  formatFilter === 'masterclass'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground border-border/80 hover:bg-muted/60'
                )}
              >
                <Video className="w-3.5 h-3.5" />
                <span>{isRtl ? 'فيديو مطول' : 'Full Builds'}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/15 text-[10px]">
                  {longVideoProjectsCount}
                </span>
              </button>
            </div>

            <Link
              to="/projects"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card hover:bg-muted text-foreground border border-border/80 text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all group shrink-0 cursor-pointer"
            >
              <span>{isRtl ? 'عرض جميع المشاريع' : 'View All Projects'}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* PROJECTS RESPONSIVE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedProjects.map((project) => {
              const isSingle = isMasterclassCourse(project);
              const firstDuration = project.videos?.[0]?.duration || '2h 30m';

              return (
                <div
                  key={project.id}
                  className="group flex flex-col bg-card rounded-3xl border border-border/80 hover:border-emerald-500/40 overflow-hidden hover:shadow-xl transition-all duration-200 hover:-translate-y-1.5 text-start"
                >
                  {/* 16:9 Thumbnail Header */}
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <div className="absolute bottom-3 end-3 z-20 flex items-center gap-1.5">
                      <ShareCourseButton course={project} size="sm" />
                      <FavoriteButton
                        itemId={project.id}
                        itemType={isSingle ? 'masterclass' : 'playlist'}
                        size="sm"
                      />
                    </div>

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

                    {/* Hover Play Button Overlay */}
                    <Link
                      to={getCoursePath(project)}
                      aria-label={project.title}
                      className="absolute inset-0 bg-black/25 group-hover:bg-black/45 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-10"
                    >
                      <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl scale-90 group-hover:scale-100 transition-transform">
                        <PlayCircle className="w-8 h-8 ps-0.5 text-white" />
                      </div>
                    </Link>

                    {/* Smart NEW Badge (Only on last 3 newest courses) */}
                    {isCourseNew(project, allProjects) && (
                      <div className="absolute top-3 start-3 z-10 pointer-events-none">
                        <span className="bg-amber-500 text-black px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-black" />
                          <span>{isRtl ? 'جديد' : 'NEW'}</span>
                        </span>
                      </div>
                    )}
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

                    <Link to={getCoursePath(project)} className="block">
                      <h3 className="text-base sm:text-lg font-bold mb-2 line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {project.title}
                      </h3>
                    </Link>

                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2 flex-1 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Steps/Duration, Instructor & Stats Bar */}
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
                        const cViews =
                          project.totalViews ||
                          project.videos.reduce((s, v) => s + (v.viewCount || 0), 0);
                        const cLikes =
                          project.totalLikes ||
                          project.videos.reduce((s, v) => s + (v.likeCount || 0), 0);
                        const cComments =
                          project.totalComments ||
                          project.videos.reduce((s, v) => s + (v.commentCount || 0), 0);
                        return (
                          <div className="flex items-center justify-between pt-1.5 border-t border-border/50 text-[11px] font-semibold">
                            <span
                              className="inline-flex items-center gap-1 text-foreground"
                              title={isRtl ? 'المشاهدات' : 'Views'}
                            >
                              <Eye className="w-3 h-3 text-primary" />
                              <span>{formatCompactNumber(cViews)}</span>
                            </span>
                            <span
                              className="inline-flex items-center gap-1 text-foreground"
                              title={isRtl ? 'الإعجابات' : 'Likes'}
                            >
                              <ThumbsUp className="w-3 h-3 text-emerald-500" />
                              <span>{formatCompactNumber(cLikes)}</span>
                            </span>
                            <span
                              className="inline-flex items-center gap-1 text-foreground"
                              title={isRtl ? 'التعليقات' : 'Comments'}
                            >
                              <MessageSquare className="w-3 h-3 text-amber-500" />
                              <span>{formatCompactNumber(cComments)}</span>
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Action CTA Button */}
                    <Link
                      to={getCoursePath(project)}
                      className="w-full py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm text-center transition-all active:scale-[0.98] shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Rocket className="w-4 h-4" />
                      <span>{isRtl ? 'ابدأ بناء المشروع الآن' : 'Start Building Project'}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              );
            })}

          {displayedProjects.length === 0 && (
            <div className="col-span-full py-12 px-6 rounded-3xl bg-card border border-dashed border-border/80 flex flex-col items-center justify-center text-center">
              <Rocket className="w-10 h-10 text-emerald-500/50 mb-3" />
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
                {isRtl
                  ? 'لا توجد مشاريع عملية مضافة في هذا التصنيف حالياً'
                  : 'No project builds added in this category yet'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                {isRtl
                  ? 'تصفح صفحة المشاريع العملية لاستكشاف جميع المشاريع المضافة من قبل الإدارة.'
                  : 'Visit the Projects page to explore all hands-on project builds added by the admin.'}
              </p>
            </div>
          )}
        </div>

        {/* SHOW MORE / EXPLORE ALL PROJECTS FOOTER */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          {hasMoreToExpand && (
            <button
              type="button"
              onClick={() => setVisibleCount(prev => prev + 4)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-card hover:bg-muted text-foreground border border-border/80 font-extrabold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>
                {isRtl
                  ? `عرض المزيد من المشاريع (+${filteredProjects.length - visibleCount})`
                  : `Show More Projects (+${filteredProjects.length - visibleCount})`}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
          )}

          <Link
            to="/projects"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-sm hover:shadow-lg transition-all active:scale-[0.98] group cursor-pointer"
          >
            <Rocket className="w-4 h-4" />
            <span>
              {isRtl
                ? 'عرض المزيد في صفحة المشاريع العملية'
                : 'Show More on Projects Page'}
            </span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
