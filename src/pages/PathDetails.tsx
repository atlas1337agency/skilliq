import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PlayCircle,
  BookOpen,
  Shield,
  Code,
  Terminal,
  Layout,
  Database,
  Award,
  CheckCircle2,
  Eye,
  ThumbsUp,
  MessageSquare,
  Zap,
  Layers,
  Compass,
  Sparkles,
  GitBranch,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { filterByLanguage } from '../lib/utils';
import { formatCompactNumber } from '../lib/youtube';
import { ScrollingText } from '../components/ScrollingText';
import { FavoriteButton } from '../components/FavoriteButton';
import { ShareCourseButton } from '../components/ShareCourseButton';
import { SEO } from '../components/SEO';
import { isCertificateEligible, resolveCourseEducator, getCoursePath } from '../lib/courseUtils';
import { PathGraphicRoadmap } from '../components/PathGraphicRoadmap';

const iconMap: Record<string, any> = {
  Code,
  Terminal,
  Layout,
  Database,
  Shield,
  Zap,
  Layers,
  Compass
};

export function PathDetails() {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, courses, learningPaths, progress, setIsAuthModalOpen, language } = useStore();

  const path = learningPaths.find(p => p.id === pathId);

  if (!path) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-foreground">{t('no_paths_found', 'Learning Path Not Found')}</h2>
        <Link to="/paths" className="text-primary hover:underline font-semibold">
          {t('back_to_dashboard', 'Back to Learning Paths')}
        </Link>
      </div>
    );
  }

  // Detect Arabic either from UI language or path content
  const hasArabicText = /[\u0600-\u06FF]/.test(`${path.title || ''} ${path.description || ''}`);
  const isRtl = language === 'ar' || i18n.language === 'ar' || hasArabicText;

  // Resolve sequential courses in path (preserve exact admin order; fallback to all linked if language filter would empty an explicit path)
  const allLinkedCourses = (path.courseIds || [])
    .map(id => courses.find(c => c.id === id))
    .filter((c): c is any => Boolean(c));
  const langFiltered = filterByLanguage(allLinkedCourses, language);
  const pathCourses = langFiltered.length > 0 ? langFiltered : allLinkedCourses;

  const Icon = iconMap[path.icon] || Code;

  // Resolve hierarchy relationships
  const parentPath = path.parentId ? learningPaths.find(p => p.id === path.parentId) : null;
  const childTracks = (path.childPathIds || [])
    .map(cId => learningPaths.find(p => p.id === cId))
    .filter((p): p is any => Boolean(p));
  const isParentTrack = Boolean(path.isParent || childTracks.length > 0);
  const sisterTracks = (parentPath?.childPathIds || [])
    .filter(id => id !== path.id)
    .map(id => learningPaths.find(p => p.id === id))
    .filter((p): p is any => Boolean(p));

  // Calculate overall path completion progress for the student
  const completedCount = pathCourses.filter(c => Boolean(progress[c.id]?.isCompleted)).length;
  const completionPct = pathCourses.length > 0 ? Math.round((completedCount / pathCourses.length) * 100) : 0;

  const handleBack = () => {
    if (window.history.length > 1 && window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/paths');
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="w-full px-4 sm:px-6 md:px-8 py-6 sm:py-10 max-w-7xl mx-auto text-start"
    >
      <SEO
        title={`${path.title} – Structured Learning Path | Skilliq`}
        description={path.description}
        canonicalPath={`/path/${path.id}`}
        lang={isRtl ? 'ar' : 'en'}
        image={pathCourses[0]?.thumbnail}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Learning Paths', url: '/paths' },
          { name: path.title, url: `/path/${path.id}` }
        ]}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: path.title,
          description: path.description,
          numberOfItems: pathCourses.length,
          itemListElement: pathCourses.map((c, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            item: {
              '@type': 'Course',
              name: c.title,
              description: c.description,
              provider: {
                '@type': 'EducationalOrganization',
                name: 'Skilliq'
              },
              url: `${typeof window !== 'undefined' ? window.location.origin : 'https://skilliq.vercel.app'}/course/${c.id}`
            }
          }))
        }}
      />

      <button
        onClick={handleBack}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 sm:mb-8 transition-colors font-semibold text-sm cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        <span>{isRtl ? 'العودة إلى المسارات' : t('back', 'Back to Learning Paths')}</span>
      </button>

      {/* Path Header Hero */}
      <div className="mb-8 sm:mb-10 bg-card border border-border rounded-3xl p-6 sm:p-8 md:p-11 relative overflow-hidden shadow-xs">
        <div className="absolute top-0 end-0 p-8 sm:p-12 opacity-5 pointer-events-none">
          <Icon className="w-48 h-48 sm:w-64 sm:h-64" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            {parentPath && (
              <div className="mb-3.5 flex items-center gap-2 flex-wrap">
                <Link
                  to={`/path/${parentPath.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                >
                  <GitBranch className="w-3.5 h-3.5 shrink-0" />
                  <span>{isRtl ? 'ضمن المسار الرئيسي:' : 'Part of Career Track:'}</span>
                  <span className="underline font-black">{parentPath.title}</span>
                </Link>
                {path.specializationField && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-muted text-foreground border border-border">
                    {path.specializationField}
                  </span>
                )}
                {path.level && (
                  <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                    {path.level === 'foundation' ? (isRtl ? 'تأسيسي' : 'Foundation') : (isRtl ? 'تخصصي' : 'Specialization')}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden p-2">
                {path.iconUrl ? (
                  <img
                    src={path.iconUrl}
                    alt={path.title}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                )}
              </div>
              <div className="text-xs text-muted-foreground font-semibold flex items-center flex-wrap gap-1.5">
                <span className="text-primary font-bold">
                  {isParentTrack 
                    ? (isRtl ? '🌟 مسار مهني شامل وتخصصات' : '🌟 Parent Career Hub')
                    : parentPath
                    ? (isRtl ? '🌿 تخصص فرعي مركز' : '🌿 Focused Specialization')
                    : (isRtl ? 'مسار تعليمي متسلسل' : 'Structured Career Learning Path')}
                </span>
                {path.category && (
                  <>
                    <span aria-hidden="true" className="mx-1">·</span>
                    <span className="font-bold text-foreground bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                      {path.category}
                    </span>
                  </>
                )}
                <span aria-hidden="true" className="mx-1">·</span>
                <span>
                  {pathCourses.length} {isRtl ? 'قوائم تشغيل مرتبة' : t('playlists_in_this_path', 'Sequential Playlists')}
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4 tracking-tight leading-tight">
              {path.title}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
              {path.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                <BookOpen className="w-4 h-4 text-primary shrink-0" />
                <span>
                  {pathCourses.length} {isRtl ? 'دورات تدريبية بالترتيب' : t('playlists_in_this_path', 'Playlists in this path')}
                </span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <Award className="w-4 h-4 shrink-0" />
                <span>
                  {isRtl
                    ? 'شهادة موثقة لكل قائمة تشغيل مكتملة'
                    : 'Verified Certificate for Every Completed Playlist'}
                </span>
              </span>
              <div className="ms-auto sm:ms-2">
                <FavoriteButton itemId={path.id} itemType="path" variant="pill" size="md" />
              </div>
            </div>
          </div>

          {/* Student Path Completion Summary Card */}
          {pathCourses.length > 0 && (
            <div className="w-full lg:w-72 p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border/80 shrink-0 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">
                  {isRtl ? 'تقدمك في المسار' : 'Your Path Progress'}
                </span>
                <span className="font-mono text-foreground">
                  {completedCount} / {pathCourses.length} ({completionPct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {completedCount === pathCourses.length && pathCourses.length > 0
                  ? isRtl
                    ? 'أحسنت! لقد أتممت جميع الدورات في هذا المسار.'
                    : 'Congratulations! You have completed all playlists in this path.'
                  : isRtl
                    ? 'ابدأ من الخطوة 1 وتدرج بالترتيب لإتقان المهارات بدون تشتت.'
                    : 'Start at Step 1 and follow each playlist in sequence.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* WHAT'S NEXT: CHOOSE YOUR SPECIALIZATION FIELD (For Parent Career Hubs) */}
      {isParentTrack && childTracks.length > 0 && (
        <div className="mb-10 sm:mb-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-violet-500/10 via-card to-card border border-violet-500/30 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 font-bold text-xs mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isRtl ? 'اختر تخصصك المفضل' : 'Choose Your Specialization Field'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                {isRtl ? 'الخطوة التالية: اختر التخصص الذي تحبه في هذا المسار' : "What's Next: Choose Your Specialized Field"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                {isRtl
                  ? 'يحتوي هذا المسار المهني الشامل على عدة فروع وتخصصات. يمكنك البدء بالأساسيات أو التوجه مباشرة للتخصص الدقيق الذي ترغب في احترافه:'
                  : 'This comprehensive career track branches into dedicated specializations. Start with the core foundations or dive directly into the focused field you love:'}
              </p>
            </div>
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-xl shrink-0">
              {childTracks.length} {isRtl ? 'تخصصات متفرعة متاحة' : 'Specialization branches available'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {childTracks.map((child: any, idx: number) => {
              const ChildIcon = iconMap[child.icon] || Shield;
              return (
                <div
                  key={child.id}
                  className="group relative bg-card/90 border border-border/80 hover:border-violet-500/50 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all text-start"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                          <ChildIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                            {child.level ? (child.level === 'foundation' ? (isRtl ? 'المرحلة: تأسيسي' : 'Foundation Stage') : (isRtl ? 'المرحلة: تخصصي' : 'Specialization Stage')) : (isRtl ? `تخصص ${idx + 1}` : `Branch ${idx + 1}`)}
                          </span>
                          {child.specializationField && (
                            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                              {child.specializationField}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                        {child.courseIds.length} {isRtl ? 'دورات' : 'courses'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                      {child.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                      {child.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {isRtl ? 'خريطة طريق وشهادة موثقة' : 'Roadmap & Certificate'}
                    </span>
                    <Link
                      to={`/path/${child.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-98 transition-all"
                    >
                      <span>{isRtl ? 'دخول هذا التخصص' : 'Explore Field'}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Graphic Explain & Roadmap (Collapsible Show/Hide for Distraction-Free UX) */}
      <PathGraphicRoadmap
        path={path}
        courses={courses}
        progress={progress}
        language={isRtl ? 'ar' : 'en'}
      />

      {/* Path Curriculum */}
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {isRtl ? 'المنهج التدريبي المتسلسل للمسار' : t('path_curriculum', 'Sequential Path Curriculum')}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {isRtl
                ? 'تم ترتيب قوائم التشغيل هذه بعناية لتبدأ من الأساسيات وحتى الاحتراف التام.'
                : 'Follow these video playlists in exact numerical order from Step 1 to completion.'}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-muted-foreground">
            {pathCourses.length} {isRtl ? 'خطوات عملية' : 'Sequential Steps'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {pathCourses.map((course, index) => {
            if (!course) return null;
            const courseProg = progress[course.id];
            const isCompleted = Boolean(courseProg?.isCompleted);
            const canGetCert = isCertificateEligible(course);
            const educator = resolveCourseEducator(course);

            return (
              <div
                key={course.id}
                className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 relative"
              >
                {/* Step Number Badge */}
                <div className="absolute top-3.5 start-3.5 bg-background/95 backdrop-blur-md text-foreground border border-border/60 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider z-20 shadow-md flex items-center justify-center pointer-events-none">
                  {isRtl ? `الخطوة ${index + 1}` : `${t('step', 'Step')} ${index + 1}`}
                </div>

                <div className="relative aspect-video overflow-hidden bg-muted">
                  <div className="absolute bottom-3 end-3 z-20 flex items-center gap-1.5">
                    <ShareCourseButton course={course} size="sm" />
                    <FavoriteButton itemId={course.id} itemType={course.isSingleVideo ? 'masterclass' : 'playlist'} size="sm" />
                  </div>
                  {course.thumbnail?.trim() ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <span className="text-muted-foreground font-medium text-center text-xs">{course.title}</span>
                    </div>
                  )}
                  <Link
                    to={getCoursePath(course)}
                    aria-label={course.title}
                    className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-10"
                  >
                    <PlayCircle className="w-14 h-14 text-white" />
                  </Link>
                  <div className="absolute top-3.5 end-3.5 flex gap-1.5 pointer-events-none z-10">
                    {isCompleted && (
                      <div className="bg-emerald-500 text-white px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'مكتمل' : 'Completed'}</span>
                      </div>
                    )}
                    <div className="bg-background/90 backdrop-blur text-foreground px-2.5 py-1 rounded-md text-xs font-semibold">
                      {course.category}
                    </div>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <Link to={getCoursePath(course)} className="block">
                    <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                  </Link>
                  <p className="text-muted-foreground text-xs sm:text-sm mb-4 line-clamp-2 flex-1 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="flex flex-col gap-2 text-xs text-muted-foreground mb-4 bg-muted/30 p-2.5 rounded-xl border border-border/50">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>
                          {course.videos.length} {isRtl ? 'درس' : t('videos', 'videos')}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 max-w-[55%] truncate"
                        title={`${educator.professorName} (${educator.youtubeChannelName})`}
                      >
                        <ScrollingText className="font-medium text-foreground">{educator.professorName}</ScrollingText>
                        {(course.subscriberCountText || (course.subscriberCount && course.subscriberCount > 0)) && (
                          <span className="shrink-0 text-[10px] font-bold text-red-600 dark:text-red-400">
                            {course.subscriberCountText || formatCompactNumber(course.subscriberCount)}
                          </span>
                        )}
                      </div>
                    </div>

                    {(() => {
                      const cViews = course.totalViews || course.videos.reduce((s: number, v: any) => s + (v.viewCount || 0), 0);
                      const cLikes = course.totalLikes || course.videos.reduce((s: number, v: any) => s + (v.likeCount || 0), 0);
                      const cComments = course.totalComments || course.videos.reduce((s: number, v: any) => s + (v.commentCount || 0), 0);
                      return (
                        <div className="flex items-center justify-between pt-1.5 border-t border-border/50 text-[11px] font-semibold">
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
                      );
                    })()}
                  </div>

                  {user && isCompleted && canGetCert ? (
                    <div className="mt-auto space-y-2">
                      <Link
                        to={`/certificate/${course.id}`}
                        className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-center hover:bg-emerald-700 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                      >
                        <Award className="w-4 h-4" />
                        <span>{isRtl ? 'عرض الشهادة الموثقة' : t('view_certificate', 'View Certificate')}</span>
                      </Link>
                      <Link
                        to={getCoursePath(course)}
                        className="w-full py-2 bg-muted text-foreground rounded-xl font-semibold text-center hover:bg-muted/80 transition-all block text-xs"
                      >
                        {isRtl ? 'إعادة مشاهدة الدروس' : 'Re-watch Playlist'}
                      </Link>
                    </div>
                  ) : (
                    <Link
                      to={getCoursePath(course)}
                      className="w-full mt-auto py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-center hover:bg-primary/90 transition-all active:scale-[0.98] shadow-xs text-xs sm:text-sm"
                    >
                      {isRtl ? 'ابدأ التعلم الآن' : t('start_learning', 'Start Learning')}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SISTER TRACKS IN SAME CAREER PATH (For Child Specialization Pages) */}
      {sisterTracks.length > 0 && parentPath && (
        <div className="mt-12 sm:mt-16 p-6 sm:p-8 rounded-3xl bg-muted/30 border border-border/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
                <GitBranch className="w-4 h-4" />
                <span>{isRtl ? `تخصصات أخرى ضمن مسار: ${parentPath.title}` : `Other Specializations in ${parentPath.title}`}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                {isRtl ? 'استكشف مجالات أخرى في هذا المسار' : 'Explore Sister Specializations'}
              </h3>
            </div>
            <Link
              to={`/path/${parentPath.id}`}
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>{isRtl ? 'عرض المسار الرئيسي الشامل' : 'View Parent Career Hub'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {sisterTracks.map((sister: any) => (
              <Link
                key={sister.id}
                to={`/path/${sister.id}`}
                className="p-4 rounded-2xl bg-card border border-border/80 hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between group text-start"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {sister.specializationField || (sister.level === 'foundation' ? (isRtl ? 'تأسيسي' : 'Foundation') : (isRtl ? 'تخصصي' : 'Specialization'))}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {sister.courseIds.length} {isRtl ? 'دورات' : 'courses'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                    {sister.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {sister.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/60 text-xs font-bold text-primary flex items-center justify-end gap-1">
                  <span>{isRtl ? 'انتقل إلى التخصص' : 'Switch Field'}</span>
                  <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
