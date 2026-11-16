import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  PlayCircle,
  BookOpen,
  ArrowRight,
  Layers,
  Users,
  Eye,
  ThumbsUp,
  MessageSquare,
  PlusCircle,
  Youtube
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { filterByLanguage, cn } from '../lib/utils';
import { formatCompactNumber } from '../lib/youtube';
import {
  getCategoryDisplayName,
  getCourseContributors,
  formatContributorsSummary,
  getCoursePath,
  getCourseTimestamp,
  isMultiChannelCourse
} from '../lib/courseUtils';
import { FavoriteButton } from './FavoriteButton';
import { ShareCourseButton } from './ShareCourseButton';

export function SkilliqCollectionSection() {
  const { i18n } = useTranslation();
  const { user, courses, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';
  const isAdmin = Boolean(user && ['admin', 'publisher'].includes(user.role));

  const collectionCourses = useMemo(() => {
    return filterByLanguage(courses, language)
      .filter((c) => isMultiChannelCourse(c))
      .sort((a, b) => getCourseTimestamp(b) - getCourseTimestamp(a));
  }, [courses, language]);

  const displayedCourses = useMemo(() => {
    return collectionCourses.slice(0, 6);
  }, [collectionCourses]);

  // Hide empty section from learners until admin publishes at least one Multi-Channel Curated Playlist
  if (collectionCourses.length === 0 && !isAdmin) {
    return null;
  }

  return (
    <section dir={isRtl ? 'rtl' : 'ltr'} className="w-full transition-colors">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-5 border-b border-border/80">
        <div className="max-w-2xl text-start">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
            <Layers className="w-4 h-4 shrink-0" />
            <span>
              {isRtl
                ? 'قوائم مجمعة من عدة قنوات ومعلمين'
                : 'Multi-Channel Curated Playlists'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground text-balance">
            {isRtl ? 'مجموعة Skilliq المختارة · Skilliq Collection' : 'Skilliq Collection'}
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1.5 leading-relaxed">
            {isRtl
              ? 'دورات متكاملة تجمع أفضل الدروس من عدة قنوات ومعلمين على يوتيوب في منهج واحد منظم مع شهادة معتمدة توثّق جميع المحاضرين.'
              : 'Complete playlists assembled lesson-by-lesson across multiple YouTube teachers and channels into one cohesive curriculum and unified certificate.'}
          </p>
        </div>

        <Link
          to="/collection"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card hover:bg-muted text-foreground border border-border/80 text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all group shrink-0 w-fit cursor-pointer"
        >
          <span>{isRtl ? 'استكشاف المجموعة الكاملة' : 'Explore Skilliq Collection'}</span>
          <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* ADMIN EMPTY STATE PROMPT */}
      {displayedCourses.length === 0 && isAdmin && (
        <div className="p-8 rounded-2xl bg-card border border-dashed border-border/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-start">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              {isRtl
                ? 'لا توجد دورات في مجموعة Skilliq بعد'
                : 'No Multi-Channel Curated Playlists yet'}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              {isRtl
                ? 'عند إضافة دورة وتفعيل خيار "Multi-Channel Curated Playlist" أو دمج فيديوهات من عدة قنوات يوتيوب في لوحة الإدارة، ستظهر هنا وفي صفحة Skilliq Collection تلقائياً.'
                : 'Any course created with "Multi-Channel Curated Playlist" enabled or combining lessons from 2+ YouTube channels in Admin will automatically appear here and on /collection.'}
            </p>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:bg-primary/90 transition-colors shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isRtl ? 'إضافة دورة من الإدارة' : 'Add in Admin Panel'}</span>
          </Link>
        </div>
      )}

      {/* COLLECTION GRID */}
      {displayedCourses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCourses.map((course) => {
            const contributors = getCourseContributors(course);
            const contributorSummary = formatContributorsSummary(contributors, 3);
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
                      <Layers className="w-8 h-8 mb-2 text-blue-400" />
                      <span className="text-xs font-bold line-clamp-2">{course.title}</span>
                    </div>
                  )}

                  {/* Play overlay */}
                  <Link
                    to={getCoursePath(course)}
                    aria-label={course.title}
                    className="absolute inset-0 bg-black/25 group-hover:bg-black/45 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-10"
                  >
                    <div className="w-13 h-13 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-xl scale-90 group-hover:scale-100 transition-transform">
                      <PlayCircle className="w-7 h-7 text-white" />
                    </div>
                  </Link>
                </div>

                {/* Body */}
                <div className="p-5 sm:p-6 flex flex-col flex-1">
                  {/* Unboxed Clean Metadata Row */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-muted-foreground mb-2.5 tabular-nums">
                    <span className="text-primary font-bold">
                      {getCategoryDisplayName(course.category, isRtl)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {(course.videos || []).length}{' '}
                      {isRtl ? 'درس' : (course.videos || []).length === 1 ? 'Lesson' : 'Lessons'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-foreground/85">
                      <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>
                        {contributors.length || 1}{' '}
                        {isRtl
                          ? 'قنوات'
                          : (contributors.length || 1) === 1
                          ? 'Channel'
                          : 'Channels'}
                      </span>
                    </span>
                  </div>

                  <Link to={getCoursePath(course)} className="block">
                    <h3 className="text-base sm:text-lg font-bold text-foreground mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                  </Link>

                  <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2 flex-1 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Combined Channels / Teachers Strip */}
                  <div className="mb-4 p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center -space-x-2 rtl:space-x-reverse shrink-0">
                        {contributors.slice(0, 3).map((contrib) =>
                          contrib.avatar ? (
                            <img
                              key={contrib.name}
                              src={contrib.avatar}
                              alt={contrib.name}
                              className="w-6 h-6 rounded-full object-cover ring-2 ring-card bg-muted"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div
                              key={contrib.name}
                              className="w-6 h-6 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 ring-2 ring-card flex items-center justify-center"
                            >
                              <Youtube className="w-3 h-3" />
                            </div>
                          )
                        )}
                      </div>
                      <span className="text-xs font-semibold text-foreground truncate">
                        {contributorSummary}
                      </span>
                    </div>

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

                  {/* CTA */}
                  <Link
                    to={getCoursePath(course)}
                    className={cn(
                      'w-full py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-center transition-all active:scale-[0.98] shadow-xs flex items-center justify-center gap-2 cursor-pointer',
                      'bg-foreground text-background hover:bg-primary hover:text-primary-foreground'
                    )}
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
      )}
    </section>
  );
}
