import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useStore } from '../store/useStore';
import { formatCompactNumber } from '../lib/youtube';
import heroLearnerImg from '../assets/images/hero_learner_tablet_1791807023063.jpg';
import heroStudentImg from '../assets/images/hero_student_glasses_1791807035009.jpg';
import heroCreatorImg from '../assets/images/hero_creator_projects_1791807044735.jpg';

export function HeroSection() {
  const { t, i18n } = useTranslation();
  const { language, courses, books, learningPaths } = useStore();

  const currentAppLang: 'en' | 'ar' =
    language === 'ar' || i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const isRtl = currentAppLang === 'ar';

  // Real active students count fetched from Firestore publicProfiles + live telemetry presence
  const [realStudentsCount, setRealStudentsCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchRealStudentsMetric() {
      const uniqueStudentIds = new Set<string>();

      try {
        const profilesSnap = await getDocs(collection(db, 'publicProfiles'));
        profilesSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const uid = data?.uid || docSnap.id;
          if (uid) uniqueStudentIds.add(String(uid));
        });
      } catch {}

      try {
        const res = await fetch('/api/telemetry');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.presence)) {
            data.presence.forEach((p: any) => {
              const id = p?.uid || p?.id;
              if (id) uniqueStudentIds.add(String(id));
            });
          }
        }
      } catch {}

      if (isMounted && uniqueStudentIds.size > 0) {
        setRealStudentsCount(uniqueStudentIds.size);
      }
    }

    fetchRealStudentsMetric();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute 100% real platform statistics from actual courses, lessons, educators, books & resources
  const realMetrics = useMemo(() => {
    const safeCourses = Array.isArray(courses) ? courses : [];
    const safeBooks = Array.isArray(books) ? books : [];
    const safePaths = Array.isArray(learningPaths) ? learningPaths : [];

    // 1. Unique Tutors / Educators + Total Video Lessons
    const instructorSet = new Set<string>();
    let totalLessons = 0;
    let totalCourseResources = 0;
    let projectCoursesCount = 0;

    safeCourses.forEach((c) => {
      const instructorKey = (
        c.channelId ||
        c.youtubeChannelName ||
        c.professorName ||
        c.instructor ||
        ''
      )
        .trim()
        .toLowerCase();
      if (instructorKey) instructorSet.add(instructorKey);

      const videosLen = Array.isArray(c.videos) ? c.videos.length : 0;
      totalLessons += videosLen > 0 ? videosLen : 1;

      if (Array.isArray(c.resources)) {
        totalCourseResources += c.resources.length;
      }

      if (c.isProject || String(c.category || '').toLowerCase() === 'projects') {
        projectCoursesCount += 1;
      }
    });

    const tutorsCount = instructorSet.size;
    const tutorsAndLessonsTotal = tutorsCount + totalLessons;

    // 2. Total Real Resources (Course attachments + Video Books + Learning Paths + Hands-on Projects + Curated Playlists)
    const resourcesTotal =
      totalCourseResources +
      safeBooks.length +
      safePaths.length +
      projectCoursesCount +
      safeCourses.length;

    return {
      tutorsCount,
      totalLessons,
      tutorsAndLessonsTotal,
      resourcesTotal,
      coursesCount: safeCourses.length,
      booksCount: safeBooks.length,
      projectsCount: projectCoursesCount,
    };
  }, [courses, books, learningPaths]);

  const activeStudentsDisplay =
    realStudentsCount > 0 ? formatCompactNumber(realStudentsCount) : '1';
  const tutorsLessonsDisplay =
    realMetrics.tutorsAndLessonsTotal > 0
      ? formatCompactNumber(realMetrics.tutorsAndLessonsTotal)
      : '0';
  const resourcesDisplay =
    realMetrics.resourcesTotal > 0
      ? formatCompactNumber(realMetrics.resourcesTotal)
      : '0';

  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative w-full overflow-hidden bg-background pt-6 pb-12 sm:py-12 md:py-16 lg:py-20 border-b border-border/50 transition-colors"
    >
      {/* Subtle Ambient Website Vibe Glow (Adapts to Light & Dark Theme) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.65, 1, 0.65],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-28 start-1/4 w-[28rem] sm:w-[40rem] h-[18rem] sm:h-[24rem] rounded-full bg-primary/10 dark:bg-primary/15 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.6, 0.95, 0.6],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="absolute bottom-0 end-1/4 w-[24rem] sm:w-[36rem] h-[16rem] sm:h-[22rem] rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-[120px]"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-8 xl:gap-12 items-center">
          {/* LEFT / START COLUMN: Editorial Headline, Description, Pill CTAs & Real 3-Column Stats */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-start max-w-xl mx-auto lg:mx-0 w-full"
          >
            {/* Title Size Fixed for Laptop (Clean 2-Line Fit at lg & xl Viewports) */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
              className="text-3xl sm:text-4xl md:text-[42px] lg:text-[36px] xl:text-[42px] 2xl:text-[46px] font-extrabold tracking-tight text-foreground leading-[1.16] lg:leading-[1.15] mb-4 sm:mb-5"
              style={{ textWrap: 'balance' }}
            >
              {isRtl ? (
                <>
                  <span className="block">طريقة جديدة للتعلم</span>
                  <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-sky-500 dark:from-blue-400 dark:via-indigo-300 dark:to-sky-400">
                    واكتساب المعرفة
                  </span>
                </>
              ) : (
                <>
                  <span className="block lg:whitespace-nowrap">A new way to learn</span>
                  <span className="block mt-0.5 lg:whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground to-primary dark:from-white dark:via-slate-100 dark:to-sky-400">
                    &amp; get knowledge
                  </span>
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16, ease: 'easeOut' }}
              className="text-sm sm:text-base lg:text-[15.5px] xl:text-base text-muted-foreground leading-relaxed mb-7 sm:mb-9 max-w-md lg:max-w-lg font-normal"
            >
              {isRtl
                ? 'منصة Skilliq هنا من أجلك مع دورات منظمة، مشاريع عملية حقيقية، ومصادر تعليمية من نخبة المدربين حول العالم — مجاناً وبدون أي تشتيت.'
                : 'Skilliq is here for you with structured courses, real-world projects & materials from skilled educators all around the world.'}
            </motion.p>

            {/* Two Pill CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24, ease: 'easeOut' }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 sm:gap-4 w-full sm:w-auto mb-10 sm:mb-12 lg:mb-14"
            >
              <Link
                to="/courses"
                className="px-7 sm:px-8 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer whitespace-nowrap"
              >
                {isRtl ? 'ابدأ التعلم الآن' : t('start_learning', 'Join the Class')}
              </Link>

              <Link
                to="/paths"
                className="px-7 sm:px-8 py-3 sm:py-3.5 rounded-full bg-transparent hover:bg-muted text-foreground border border-foreground/75 dark:border-foreground/60 font-bold text-xs sm:text-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer whitespace-nowrap"
              >
                {isRtl ? 'استكشف المسارات' : t('explore_paths', 'Learn more')}
              </Link>
            </motion.div>

            {/* Bottom 3-Column Real Data Metrics Bar with Vertical Hairline Dividers */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.32, ease: 'easeOut' }}
              className="flex items-center justify-center lg:justify-start gap-4 sm:gap-7 xl:gap-8 pt-2 w-full"
            >
              {/* Stat 1: Real Active Students */}
              <Link
                to="/leaderboard"
                className="group flex flex-col items-center lg:items-start cursor-pointer"
                title={
                  isRtl
                    ? `${realStudentsCount || 1} طالب مسجل ونشط على المنصة`
                    : `${realStudentsCount || 1} Real Active Learners on Skilliq`
                }
              >
                <span className="text-xl sm:text-2xl lg:text-[24px] xl:text-[26px] font-extrabold text-foreground group-hover:text-primary transition-colors tracking-tight tabular-nums leading-none">
                  {activeStudentsDisplay}
                </span>
                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors mt-1.5 whitespace-nowrap">
                  {isRtl ? 'طالب نشط' : 'Active students'}
                </span>
              </Link>

              <div className="h-9 sm:h-10 w-px bg-border shrink-0" aria-hidden="true" />

              {/* Stat 2: Real Tutors & Video Lessons */}
              <Link
                to="/courses"
                className="group flex flex-col items-center lg:items-start cursor-pointer"
                title={
                  isRtl
                    ? `${realMetrics.tutorsCount} مدرب و ${realMetrics.totalLessons} درس فيديو في ${realMetrics.coursesCount} دورة`
                    : `${realMetrics.tutorsCount} Educators & ${realMetrics.totalLessons} Video Lessons across ${realMetrics.coursesCount} Courses`
                }
              >
                <span className="text-xl sm:text-2xl lg:text-[24px] xl:text-[26px] font-extrabold text-foreground group-hover:text-primary transition-colors tracking-tight tabular-nums leading-none">
                  {tutorsLessonsDisplay}
                </span>
                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors mt-1.5 whitespace-nowrap">
                  {isRtl
                    ? `مدرب ودرس (${realMetrics.coursesCount} دورة)`
                    : 'Tutors & Lessons'}
                </span>
              </Link>

              <div className="h-9 sm:h-10 w-px bg-border shrink-0" aria-hidden="true" />

              {/* Stat 3: Real Resources (Courses, Books, Projects & Materials) */}
              <Link
                to="/books"
                className="group flex flex-col items-center lg:items-start cursor-pointer"
                title={
                  isRtl
                    ? `${realMetrics.resourcesTotal} مصدر تعليمي (${realMetrics.coursesCount} دورة، ${realMetrics.booksCount} كتاب، و ${realMetrics.projectsCount} مشروع)`
                    : `${realMetrics.resourcesTotal} Learning Resources (${realMetrics.coursesCount} Courses, ${realMetrics.booksCount} Books & ${realMetrics.projectsCount} Projects)`
                }
              >
                <div className="h-[24px] xl:h-[26px] flex items-center gap-1.5 text-foreground group-hover:text-primary transition-colors">
                  <span className="text-xl sm:text-2xl lg:text-[24px] xl:text-[26px] font-extrabold tracking-tight tabular-nums leading-none">
                    {resourcesDisplay}
                  </span>
                  <svg
                    className="w-7 h-5 sm:w-8 sm:h-5 group-hover:rotate-6 transition-transform duration-300"
                    viewBox="0 0 44 26"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle
                      cx="15"
                      cy="13"
                      r="9.5"
                      stroke="currentColor"
                      strokeWidth="2.4"
                    />
                    <circle
                      cx="29"
                      cy="13"
                      r="9.5"
                      stroke="currentColor"
                      strokeWidth="2.4"
                    />
                  </svg>
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors mt-1.5 whitespace-nowrap">
                  {isRtl ? 'مصادر ومشاريع' : 'Resources'}
                </span>
              </Link>
            </motion.div>
          </motion.div>

          {/* RIGHT / END COLUMN: Bespoke 3-Card Collage with Modern Animations & Cutout Badges */}
          <div className="lg:col-span-7 w-full max-w-[540px] sm:max-w-[600px] lg:max-w-none mx-auto">
            <div className="relative w-full pt-4 pb-2 px-2 sm:px-6">
              {/* Floating 4-Point Emerald Sparkle Star (Middle Start) */}
              <motion.div
                animate={{
                  y: [0, -7, 0],
                  rotate: [0, 12, 0],
                  scale: [1, 1.12, 1],
                }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-[42%] -start-1 sm:start-0 z-20 text-emerald-600/80 dark:text-emerald-400/80 pointer-events-none"
                aria-hidden="true"
              >
                <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16 0C16 10.5 21.5 16 32 16C21.5 16 16 21.5 16 32C16 21.5 10.5 16 0 16C10.5 16 16 10.5 16 0Z" />
                </svg>
              </motion.div>

              {/* Floating Small Indigo Circle (Top End) */}
              <motion.div
                animate={{
                  y: [0, 8, 0],
                  scale: [1, 1.18, 1],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                className="absolute top-3 sm:top-5 end-6 sm:end-10 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-indigo-400/90 dark:bg-indigo-400 z-20 pointer-events-none"
                aria-hidden="true"
              />

              {/* Collage Main 2-Column Staggered Grid */}
              <div className="grid grid-cols-12 gap-3.5 sm:gap-5 items-start">
                {/* LEFT / START STACK (Top Sky-Blue Portrait + Bottom Wide Emerald Portrait) */}
                <div className="col-span-7 flex flex-col gap-3.5 sm:gap-5">
                  {/* Top-Start Card: Learner with Tablet & Cutout Arrow Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -4 }}
                    className="relative w-[88%] ms-auto"
                  >
                    <Link
                      to="/courses"
                      className="block aspect-square w-full rounded-[26px] sm:rounded-[36px] overflow-hidden bg-[#9ED4F3] dark:bg-sky-500/30 border border-border/40 shadow-sm hover:shadow-xl transition-shadow duration-300 group"
                    >
                      <img
                        src={heroLearnerImg}
                        alt={isRtl ? 'طالبة تتعلم عبر المنصة' : 'Student learning with tablet'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    </Link>

                    {/* Cutout Corner Circle Badge with Diagonal Arrow */}
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -top-4 -end-4 sm:-top-6 sm:-end-6 z-20"
                    >
                      <Link
                        to="/courses"
                        aria-label={isRtl ? 'استكشف الدورات' : 'Explore Courses'}
                        title={isRtl ? 'استكشف الدورات' : 'Explore Courses'}
                        className="w-12 h-12 sm:w-16 sm:h-16 md:w-[72px] md:h-[72px] rounded-full bg-[#9ED4F3] hover:bg-[#82C6EC] dark:bg-sky-500 dark:hover:bg-sky-400 text-white ring-[8px] sm:ring-[12px] ring-background flex items-center justify-center transition-transform duration-200 hover:scale-105 cursor-pointer shadow-sm"
                      >
                        <svg
                          className="w-5 h-5 sm:w-7 sm:h-7 rtl:-scale-x-100"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M7 7l10 10" />
                          <path d="M17 8v9H8" />
                        </svg>
                      </Link>
                    </motion.div>
                  </motion.div>

                  {/* Bottom-Start Wide Card: Creator with Megaphone & Cutout 4-Rings Pill Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 28, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -4 }}
                    className="relative w-full mt-1"
                  >
                    <Link
                      to="/projects"
                      className="block aspect-[16/11] w-full rounded-[26px] sm:rounded-[36px] overflow-hidden bg-[#8AB872] dark:bg-emerald-500/30 border border-border/40 shadow-sm hover:shadow-xl transition-shadow duration-300 group"
                    >
                      <img
                        src={heroCreatorImg}
                        alt={isRtl ? 'مشاريع عملية وتطبيقية' : 'Hands-on student projects'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    </Link>

                    {/* Cutout Top-End Pill Badge with 4 Interlocking White Rings */}
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
                      className="absolute -top-4 -end-8 sm:-top-6 sm:-end-12 z-20"
                    >
                      <Link
                        to="/projects"
                        aria-label={isRtl ? 'المشاريع العملية' : 'Real-World Projects'}
                        title={isRtl ? 'المشاريع العملية' : 'Real-World Projects'}
                        className="px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full bg-[#B8A4F8] hover:bg-[#a68ef5] dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white ring-[8px] sm:ring-[12px] ring-background flex items-center justify-center transition-transform duration-200 hover:scale-105 cursor-pointer shadow-sm"
                      >
                        <svg
                          className="w-12 h-5 sm:w-16 sm:h-6"
                          viewBox="0 0 76 26"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <circle cx="14" cy="13" r="9.5" stroke="currentColor" strokeWidth="1.8" />
                          <circle cx="30" cy="13" r="9.5" stroke="currentColor" strokeWidth="1.8" />
                          <circle cx="46" cy="13" r="9.5" stroke="currentColor" strokeWidth="1.8" />
                          <circle cx="62" cy="13" r="9.5" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                      </Link>
                    </motion.div>
                  </motion.div>
                </div>

                {/* RIGHT / END STACK (Staggered Lavender-Indigo Student Card + Bottom Geometric Accents) */}
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="col-span-5 flex flex-col justify-between h-full pt-10 sm:pt-16"
                >
                  <motion.div whileHover={{ y: -4 }}>
                    <Link
                      to="/paths"
                      className="block aspect-[1/1.05] w-full rounded-[26px] sm:rounded-[36px] overflow-hidden bg-[#B8A4F8] dark:bg-indigo-500/35 border border-border/40 shadow-sm hover:shadow-xl transition-shadow duration-300 group"
                    >
                      <img
                        src={heroStudentImg}
                        alt={isRtl ? 'مسارات التعلم المنظمة' : 'Structured learning paths'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    </Link>
                  </motion.div>

                  {/* Bottom-End Sparkle Star & Sky Circle Accents */}
                  <div
                    className="relative h-24 sm:h-32 w-full pointer-events-none select-none"
                    aria-hidden="true"
                  >
                    {/* 4-Point Emerald Sparkle Star */}
                    <motion.div
                      animate={{
                        rotate: [0, -15, 0],
                        scale: [1, 1.15, 1],
                      }}
                      transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
                      className="absolute top-5 sm:top-7 start-6 sm:start-10 text-emerald-600/80 dark:text-emerald-400/80"
                    >
                      <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 32 32" fill="currentColor">
                        <path d="M16 0C16 10.5 21.5 16 32 16C21.5 16 16 21.5 16 32C16 21.5 10.5 16 0 16C10.5 16 16 10.5 16 0Z" />
                      </svg>
                    </motion.div>

                    {/* Soft Sky-Blue Circle */}
                    <motion.div
                      animate={{
                        y: [0, -8, 0],
                        scale: [1, 1.08, 1],
                      }}
                      transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                      className="absolute bottom-2 sm:bottom-3 end-4 sm:end-8 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#9ED4F3] dark:bg-sky-400/80"
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
