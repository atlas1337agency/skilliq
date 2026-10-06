import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { PlayCircle, BookOpen, Code, Terminal, Layout, Database, Shield, ArrowRight, Zap, Award, CheckCircle2, ChevronRight, Video, Users, Github, Youtube, Cloud, Search, BarChart3, Star, Layers, Sparkles, Compass } from 'lucide-react';
import { motion, useScroll, useTransform, useMotionValue, useSpring, useMotionTemplate } from 'motion/react';
import { useStore } from '../store/useStore';
import { cn, filterByLanguage, filterPathsByLanguage } from '../lib/utils';
import { HeroSection } from '../components/HeroSection';
import { ExploreCategoriesSection } from '../components/ExploreCategoriesSection';
import { WhySkilliqSection } from '../components/WhySkilliqSection';
import { BooksSection } from '../components/BooksSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { FinalCTASection } from '../components/FinalCTASection';
import { PopularCoursesSection } from '../components/PopularCoursesSection';
import { OurNetworkSection } from '../components/OurNetworkSection';
import { PopularMasterclassesSection } from '../components/PopularMasterclassesSection';

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

const pathColorMap: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  Code: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'group-hover:border-blue-500/40',
    gradient: 'from-blue-500/15 via-indigo-500/5 to-transparent'
  },
  Shield: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    border: 'group-hover:border-emerald-500/40',
    gradient: 'from-emerald-500/15 via-teal-500/5 to-transparent'
  },
  Zap: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-500',
    border: 'group-hover:border-cyan-500/40',
    gradient: 'from-cyan-500/15 via-sky-500/5 to-transparent'
  },
  Layout: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    border: 'group-hover:border-purple-500/40',
    gradient: 'from-purple-500/15 via-fuchsia-500/5 to-transparent'
  },
  Terminal: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'group-hover:border-amber-500/40',
    gradient: 'from-amber-500/15 via-orange-500/5 to-transparent'
  }
};

function PartnersSection() {
  const { t, i18n } = useTranslation();
  const { language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      className="w-full bg-gradient-to-b from-muted/30 via-background to-background border-y border-border/70 py-12 sm:py-16 overflow-hidden relative"
    >
      {/* Subtle Ambient Glows */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-red-500/5 blur-3xl" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-extrabold uppercase tracking-wider mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>
              {isRtl
                ? 'تكامل رسمي يحترم حقوق الملكية الفكرية'
                : t('trusted_integrated_with', 'Trusted by & Integrated With')}
            </span>
          </div>

          <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight">
            {isRtl
              ? 'كيف يعمل Skilliq بالتكامل المباشر مع YouTube؟'
              : 'How Skilliq Works with Official YouTube Streams'}
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-2.5 leading-relaxed">
            {isRtl
              ? 'لا يقوم Skilliq بتحميل أو إعادة رفع أي فيديو على خوادمه مطلقاً. تعمل المنصة كطبقة تعليمية ذكية فوق المشغل الرسمي لـ YouTube لحماية حقوق صناع المحتوى بالكامل.'
              : 'Skilliq never hosts, downloads, or re-uploads video files. We operate as a smart educational workspace over the official YouTube IFrame API—100% compliant with creator copyright.'}
          </p>
        </div>

        {/* VISUAL ARCHITECTURE FLOW DIAGRAM (Responsive across Mobile, Tablet, and Laptop + Full RTL/LTR Support) */}
        <div className="bg-card/90 backdrop-blur-md border border-border/80 rounded-3xl p-5 sm:p-8 lg:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 md:gap-3 lg:gap-6 max-w-4xl mx-auto">
            {/* NODE 1: LEARNER BROWSER (Plain Non-Clickable Text for skilliq1337.online) */}
            <div className="flex flex-col items-center text-center w-full md:w-48 lg:w-56 shrink-0 select-none">
              <div
                dir="ltr"
                className="w-36 h-24 sm:w-40 sm:h-26 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border-2 border-blue-500/40 flex flex-col overflow-hidden shadow-xs"
              >
                {/* Browser Top Bar */}
                <div className="h-5.5 bg-blue-600 flex items-center gap-1 px-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/90 shrink-0" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
                  <span className="ms-auto text-[8px] sm:text-[8.5px] font-mono text-white font-bold truncate">
                    skilliq1337.online
                  </span>
                </div>
                {/* Browser Wireframe Layout */}
                <div className="flex-1 p-2 grid grid-cols-3 gap-1.5 bg-background/80">
                  <div className="col-span-2 rounded bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="col-span-1 flex flex-col gap-1">
                    <div className="h-1/2 rounded bg-blue-500/15" />
                    <div className="h-1/2 rounded bg-blue-500/25" />
                  </div>
                </div>
              </div>

              <span className="mt-3 text-sm sm:text-base font-extrabold text-foreground">
                {isRtl ? 'متصفح المتعلم' : 'Learner Browser'}
              </span>
              <span className="text-[11px] font-mono font-bold text-primary mt-0.5">
                skilliq1337.online
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                {isRtl
                  ? 'ملاحظات ذكية، تتبع التقدم، وشهادات'
                  : 'Smart Notes, Progress & Certificates'}
              </span>
            </div>

            {/* CONNECTOR 1: BROWSER <---> SKILLIQ */}
            <div className="flex md:flex-1 items-center justify-center w-full py-0.5 md:py-0">
              {/* Tablet & Laptop Horizontal Connector (Respects RTL & LTR) */}
              <div className="hidden md:flex items-center w-full">
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    isRtl
                      ? 'bg-gradient-to-l from-blue-500/50 to-primary'
                      : 'bg-gradient-to-r from-blue-500/50 to-primary'
                  )}
                />
                <div
                  className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-primary/10 border-2 border-primary text-primary flex items-center justify-center shadow-xs shrink-0 mx-1.5"
                  title={isRtl ? 'طبقة التعلم الذكية' : 'Distraction-Free Learning Layer'}
                >
                  <Award className="w-4 h-4" />
                </div>
                <div className="h-0.5 flex-1 bg-primary relative">
                  <ArrowRight
                    className={cn(
                      'w-4 h-4 text-primary absolute -top-2',
                      isRtl ? '-left-2 rotate-180' : '-right-2'
                    )}
                  />
                </div>
              </div>

              {/* Mobile Vertical Connector */}
              <div className="flex md:hidden flex-col items-center">
                <div className="w-0.5 h-4 bg-blue-500/50" />
                <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary text-primary flex items-center justify-center">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div className="w-0.5 h-4 bg-primary" />
              </div>
            </div>

            {/* NODE 2: CENTER HUB — SKILLIQ SMART EDUCATION LAYER */}
            <div className="flex flex-col items-center text-center shrink-0 relative">
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-full bg-card border-[3px] border-primary shadow-xl flex flex-col items-center justify-center p-3 sm:p-4 ring-8 ring-primary/10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-md mb-1.5 sm:mb-2 overflow-hidden p-1.5">
                  <img
                    src="/images/favicon.png"
                    alt="Skilliq Favicon"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('/public/images/favicon.png')) {
                        target.src = '/public/images/favicon.png';
                      }
                    }}
                  />
                </div>
                <span className="text-sm sm:text-base lg:text-lg font-black tracking-tight text-foreground">
                  SKILLIQ
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-primary mt-0.5 leading-tight">
                  {isRtl ? 'بيئة التعلم الذكية' : 'Smart Learning Layer'}
                </span>
              </div>
            </div>

            {/* CONNECTOR 2: SKILLIQ <---> YOUTUBE ORIGIN SERVER */}
            <div className="flex md:flex-1 items-center justify-center w-full py-0.5 md:py-0">
              {/* Tablet & Laptop Horizontal Connector (Respects RTL & LTR) */}
              <div className="hidden md:flex items-center w-full">
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    isRtl
                      ? 'bg-gradient-to-l from-primary to-[#FF0000]'
                      : 'bg-gradient-to-r from-primary to-[#FF0000]'
                  )}
                />
                <div
                  className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-red-500/10 border-2 border-[#FF0000] text-[#FF0000] flex items-center justify-center shadow-xs shrink-0 mx-1.5"
                  title={
                    isRtl
                      ? 'واجهة YouTube الرسمية وحماية حقوق الملكية'
                      : 'Official YouTube IFrame API & Copyright Safe'
                  }
                >
                  <Shield className="w-4 h-4" />
                </div>
                <div className="h-0.5 flex-1 bg-[#FF0000] relative">
                  <ArrowRight
                    className={cn(
                      'w-4 h-4 text-[#FF0000] absolute -top-2',
                      isRtl ? '-left-2 rotate-180' : '-right-2'
                    )}
                  />
                </div>
              </div>

              {/* Mobile Vertical Connector */}
              <div className="flex md:hidden flex-col items-center">
                <div className="w-0.5 h-4 bg-primary" />
                <div className="w-8 h-8 rounded-full bg-red-500/10 border-2 border-[#FF0000] text-[#FF0000] flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="w-0.5 h-4 bg-[#FF0000]" />
              </div>
            </div>

            {/* NODE 3: YOUTUBE ORIGIN SERVER & ORIGINAL CREATORS */}
            <div className="flex flex-col items-center text-center w-full md:w-48 lg:w-56 shrink-0 select-none">
              <div className="w-36 h-24 sm:w-40 sm:h-26 rounded-2xl bg-red-500/10 dark:bg-red-500/15 border-2 border-[#FF0000]/50 flex flex-col items-center justify-center p-3 shadow-xs relative">
                {/* Official YouTube Play Badge */}
                <svg className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 drop-shadow-xs" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
                    fill="#FF0000"
                  />
                  <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF" />
                </svg>
                <span className="mt-1 text-[10px] font-mono font-bold text-red-600 dark:text-red-400">
                  {isRtl ? 'واجهة YouTube الرسمية' : 'YouTube Origin API'}
                </span>
              </div>

              <span className="mt-3 text-sm sm:text-base font-extrabold text-foreground">
                {isRtl ? 'خادم YouTube الأصلي' : 'YouTube Origin Server'}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                {isRtl
                  ? 'المشاهدات والاشتراكات تذهب للمنشئ الأصلي 100%'
                  : '100% Views & Subs Go to Original Creator'}
              </span>
            </div>
          </div>

          {/* 3 COPYRIGHT & CREATOR RESPECT PILLARS (Responsive 1 col mobile, 3 cols tablet/laptop) */}
          <div className="mt-8 pt-6 border-t border-border/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex items-start gap-3 text-start">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-[#FF0000] flex items-center justify-center shrink-0 mt-0.5">
                <Youtube className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-foreground">
                  {isRtl
                    ? 'مشغل YouTube المدمج الرسمي'
                    : 'Official YouTube IFrame Embed'}
                </h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-relaxed">
                  {isRtl
                    ? 'يتم بث جميع الدروس مباشرة من خوادم YouTube الرسمية. كل مشاهدة وإعجاب واشتراك يُحتسب مباشرة لصالح قناة المعلم الأصلي.'
                    : 'Every video streams directly from YouTube’s origin servers. All views, watch time, and subscriptions count directly toward the original creator.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex items-start gap-3 text-start">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-foreground">
                  {isRtl
                    ? 'إضافة أدوات تعلم ذكية بدون تعديل الفيديو'
                    : 'Value-Add Learning Workspace'}
                </h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-relaxed">
                  {isRtl
                    ? 'يوفر Skilliq تنظيم المسارات، تدوين الملاحظات بالثانية، تتبع الإنجاز، والشهادات دون المساس بملف الفيديو الأصلي.'
                    : 'Skilliq provides structured roadmaps, timestamped smart notes, progress tracking, and verifiable certificates around public educational playlists.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex items-start gap-3 text-start sm:col-span-2 lg:col-span-1">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-foreground">
                  {isRtl
                    ? 'احترام كامل لحقوق النشر والملكية (DMCA)'
                    : '100% Copyright & Creator Respect'}
                </h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-relaxed">
                  {isRtl
                    ? 'نلتزم بشروط خدمة YouTube API وننسب كل دورة لصاحبها مع رابط مباشر لقناته الرسمية.'
                    : 'Fully compliant with YouTube API Terms of Service with prominent creator attribution, direct channel links, and instant takedown support.'}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Link to Full Copyright Policy */}
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] sm:text-xs text-muted-foreground px-1 text-center sm:text-start">
            <span>
              {isRtl
                ? '🔒 جميع العلامات التجارية وحقوق الفيديوهات محفوظة لأصحابها الأصليين على YouTube.'
                : '🔒 All video copyrights and trademarks belong to their respective original creators on YouTube.'}
            </span>
            <Link
              to="/copyright"
              className="font-bold text-primary hover:underline inline-flex items-center justify-center sm:justify-start gap-1 shrink-0"
            >
              <span>
                {isRtl
                  ? 'اقرأ سياسة حقوق الملكية الفكرية الكاملة'
                  : 'Read our Copyright & Creator Policy'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContinueLearningSection() {
  const { t } = useTranslation();
  const { user, courses, progress, language } = useStore();

  if (!user) return null;

  const ongoingCourses = filterByLanguage(courses, language).filter(c => {
    const p = progress[c.id];
    return p && p.completedVideoIds.length > 0 && !p.isCompleted;
  });

  if (ongoingCourses.length === 0) return null;

  return (
    <section className="w-full py-12 bg-muted/20 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <PlayCircle className="w-6 h-6 text-primary" />
            {t('continue_learning', 'Continue Learning')}, {user.displayName || t('demo_student', 'Student')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t('jump_back_in', 'Jump back in and complete your ongoing courses by category.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ongoingCourses.slice(0, 4).map((course, index) => {
             const userProgress = progress[course.id];
             const totalVideos = course.videos.length || 1;
             const completedVideos = userProgress.completedVideoIds.length;
             const progressPercentage = Math.round((completedVideos / totalVideos) * 100);

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="group flex gap-4 bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all hover:border-primary/30 relative"
              >
                <div className="relative w-32 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  {course.thumbnail ? (
                    <img 
                      src={course.thumbnail} 
                      alt="" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <Code className="w-6 h-6 text-primary/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <PlayCircle className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-primary mb-1">
                    {course.category}
                  </div>
                  <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  
                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                      <span>{progressPercentage}% {t('completed', 'Completed')}</span>
                      <span>{completedVideos}/{totalVideos}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-150 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  <Link 
                    to={`/course/${course.id}`}
                    className="absolute inset-0 z-10"
                    aria-label={`Continue ${course.title}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Home() {
  const { t } = useTranslation();
  const { user, courses, learningPaths, setIsAuthModalOpen, language } = useStore();

  const isRtl = language === 'ar';
  const featuredPaths = filterPathsByLanguage(learningPaths, courses, language).slice(0, 4);

  return (
    <div className="w-full">
      <SEO
        title={isRtl ? 'Skilliq – منصة التعلم المنظم والدورات المجانية' : 'Skilliq – Free Structured Learning Platform & Masterclasses'}
        description={
          isRtl
            ? 'اكتشف Skilliq: بيئة تعليمية احترافية خالية من المشتتات تجمع أفضل دورات يوتيوب في مسارات تعلم منظمة وشهادات معتمدة مجاناً.'
            : 'Discover Skilliq: A distraction-free learning platform with curated YouTube courses, structured career paths, and free masterclasses in tech, AI, and cybersecurity.'
        }
        canonicalPath="/"
        lang={isRtl ? 'ar' : 'en'}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Featured Learning Paths & Free Tech Courses on Skilliq',
          itemListElement: featuredPaths.map((p, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: p.title,
            description: p.description,
            url: `${typeof window !== 'undefined' ? window.location.origin : 'https://skilliq.vercel.app'}/path/${p.id}`
          }))
        }}
      />
      <HeroSection />
      <PartnersSection />

      <ContinueLearningSection />
      
      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 space-y-24">
        
        {/* Featured Paths - Only rendered if there is content for current language */}
        {featuredPaths && featuredPaths.length > 0 && (
          <section dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10 pb-4 border-b border-border/80">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('curated_roadmaps_badge', 'Career-Ready Roadmaps')}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                  {t('featured_learning_paths', 'Featured Learning Paths')}
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
                  {t('structured_curriculums', 'Structured curriculums to guide your journey from zero to mastery.')}
                </p>
              </div>

              <Link 
                to="/paths" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card hover:bg-muted text-foreground border border-border/80 text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all group shrink-0 w-fit"
              >
                <span>{t('view_all', 'View all')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {featuredPaths.map((path, index) => {
                const Icon = iconMap[path.icon] || Code;
                const style = pathColorMap[path.icon] || pathColorMap.Code;
                const pathCourses = path.courseIds
                  .map(id => courses.find(c => c.id === id))
                  .filter((c): c is any => Boolean(c));

                return (
                  <motion.div
                    key={path.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`group relative bg-card border border-border/80 rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:shadow-xl transition-all duration-200 hover:-translate-y-1 ${style.border} overflow-hidden text-start`}
                  >
                    {/* Top ambient card glow */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-40 pointer-events-none group-hover:opacity-100 transition-opacity`} />

                    <div className="relative z-10">
                      {/* Header row: Icon, Badge, Course count */}
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl ${style.bg} ${style.text} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                          <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/40">
                            {isRtl ? 'مسار مهني' : 'Career Track'}
                          </span>
                          <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                            {path.courseIds.length} {t('playlists_in_this_path').split(' ')[0]}
                          </span>
                        </div>
                      </div>

                      {/* Path Title */}
                      <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {path.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-2">
                        {path.description}
                      </p>

                      {/* Visual Roadmap Sequence Preview */}
                      {pathCourses.length > 0 && (
                        <div className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-muted/30 border border-border/50">
                          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-primary" />
                            <span>{t('path_roadmap_preview', 'Curriculum Sequence')}</span>
                          </div>

                          <div className="space-y-2">
                            {pathCourses.slice(0, 3).map((c, cIdx) => (
                              <div key={c.id || cIdx} className="flex items-center gap-2 text-xs text-foreground/90">
                                <span className="w-5 h-5 rounded-md bg-background border border-border flex items-center justify-center font-mono text-[10px] font-bold text-muted-foreground shrink-0">
                                  {cIdx + 1}
                                </span>
                                <span className="truncate font-medium">{c.title}</span>
                              </div>
                            ))}
                            {pathCourses.length > 3 && (
                              <div className="text-[11px] text-muted-foreground font-semibold ps-7">
                                +{pathCourses.length - 3} {isRtl ? 'دورات أخرى في المنهج' : 'more courses in this track'}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Card Footer */}
                    <div className="relative z-10 pt-4 border-t border-border/50 flex items-center justify-between gap-3 mt-auto">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <Award className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="hidden sm:inline">{t('paths_stat_certs', 'Verifiable Certificate')}</span>
                        <span className="sm:hidden">{t('certificate', 'Certificate')}</span>
                      </div>

                      <Link 
                        to={`/path/${path.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all active:scale-[0.98] group/btn"
                      >
                        <span>{t('start_path', 'Start Path')}</span>
                        <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Popular Courses & Playlists Section */}
        <PopularCoursesSection />

        {/* Our Network Section */}
        <OurNetworkSection />

        {/* Popular Masterclasses Section */}
        <PopularMasterclassesSection />
      </div>
      {/* SECTIONS BEFORE FOOTER */}
      <ExploreCategoriesSection />
      <WhySkilliqSection />
      <BooksSection />
      <HowItWorksSection />
      <FinalCTASection />
    </div>
  );
}
