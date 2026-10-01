import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  PlayCircle, 
  Youtube, 
  BookOpen, 
  ChevronLeft, 
  Award, 
  BadgeCheck, 
  Layout, 
  Search, 
  X, 
  Filter,
  Sparkles,
  Users,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Send,
  ExternalLink,
  GraduationCap,
  Layers,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useMemo, useState, useEffect } from 'react';
import { cn } from '../lib/utils';

export function Creator() {
  const { creatorId } = useParams<{ creatorId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { courses, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const decodedCreatorId = creatorId ? decodeURIComponent(creatorId).trim() : '';

  // Filter courses for specific creator
  const creatorCourses = useMemo(() => {
    if (!decodedCreatorId) return [];
    return courses.filter(
      c => c.instructor?.toLowerCase().trim() === decodedCreatorId.toLowerCase()
    );
  }, [courses, decodedCreatorId]);

  // Aggregate all unique instructors for Creators Hub Directory
  const allInstructors = useMemo(() => {
    const map = new Map<string, { name: string; avatar: string; coursesCount: number; categories: Set<string> }>();
    courses.forEach(c => {
      const name = c.instructor?.trim();
      if (!name) return;
      if (!map.has(name)) {
        map.set(name, {
          name,
          avatar: c.instructorAvatar?.trim() || '',
          coursesCount: 0,
          categories: new Set()
        });
      }
      const item = map.get(name)!;
      item.coursesCount++;
      if (c.category) item.categories.add(c.category);
    });

    return Array.from(map.values()).sort((a, b) => b.coursesCount - a.coursesCount);
  }, [courses]);

  // Specific creator view state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Hub application form state
  const [hubCreatorName, setHubCreatorName] = useState("");
  const [hubChannelUrl, setHubChannelUrl] = useState("");
  const [hubEmail, setHubEmail] = useState("");
  const [hubNotes, setHubNotes] = useState("");
  const [hubStatus, setHubStatus] = useState<"idle" | "submitting" | "success">("idle");

  useEffect(() => {
    if (decodedCreatorId) {
      document.title = `${decodedCreatorId} - ${isRtl ? 'دورات المدرب على SkilliQ' : 'Instructor Profile on SkilliQ'}`;
    } else {
      document.title = isRtl 
        ? "برنامج صناع المحتوى والمدربين - SkilliQ" 
        : "Creator Program & Educational Hub - SkilliQ";
    }
  }, [decodedCreatorId, isRtl]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    creatorCourses.forEach(c => {
      if (c.category) cats.add(c.category);
    });
    return ["All", ...Array.from(cats)];
  }, [creatorCourses]);

  const filteredCourses = useMemo(() => {
    return creatorCourses.filter(c => {
      const matchCat = selectedCategory === "All" || c.category === selectedCategory;
      const matchQuery = !searchQuery || 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [creatorCourses, selectedCategory, searchQuery]);

  const playlists = filteredCourses.filter(c => !c.isSingleVideo);
  const masterclasses = filteredCourses.filter(c => c.isSingleVideo);
  const creatorAvatar = creatorCourses[0]?.instructorAvatar?.trim() || '';

  const handleHubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hubChannelUrl.trim() || !hubEmail.trim()) return;
    setHubStatus("submitting");
    setTimeout(() => {
      setHubStatus("success");
      setHubCreatorName("");
      setHubChannelUrl("");
      setHubEmail("");
      setHubNotes("");
    }, 600);
  };

  /* =========================================================================
     MODE 1: CREATOR PROGRAM & INSTRUCTORS DIRECTORY (When no creatorId in URL)
     ========================================================================= */
  if (!decodedCreatorId) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full min-h-screen bg-background text-foreground pb-20">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 md:pb-24 border-b border-border/60 bg-gradient-to-b from-card/60 via-background to-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRtl ? 'برنامج دعم صناع المحتوى التعليمي' : 'SkilliQ Creator Recognition Program'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.15] mb-6">
              {isRtl ? (
                <>
                  أنت تصنع المعرفة، <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
                    ونحن نوفر البيئة الأصفى لطلابك.
                  </span>
                </>
              ) : (
                <>
                  You Build Great Content, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
                    We Give Your Learners True Focus.
                  </span>
                </>
              )}
            </h1>

            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              {isRtl 
                ? 'برنامج مجاني ومخصص لأساتذة ومهندسي يوتيوب؛ نربط شروحاتك بمتعلمين جادين ينهون قوائم التشغيل بالكامل مع احتساب 100% من المشاهدات والأرباح لقناتك الرسمية.'
                : 'A dedicated initiative for YouTube educators: we channel high-intent, disciplined learners directly to your playlists while ensuring 100% of watch time and ad revenue remains yours.'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#instructors-grid"
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span>{isRtl ? 'استعراض المدربين على المنصة' : 'Browse Featured Instructors'}</span>
              </a>
              <a
                href="#creator-join-form"
                className="px-6 py-3 rounded-xl bg-card hover:bg-muted text-foreground border border-border/80 font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-98"
              >
                <span>{isRtl ? 'انضم كمدرب موثق' : 'Join as a Verified Creator'}</span>
              </a>
            </div>

          </div>
        </section>

        {/* 3 VALUE PILLARS FOR CREATORS */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-md space-y-3 text-start">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {isRtl ? '١. صفر قرصنة واحترام كامل لعوائدك' : '1. Zero Piracy & 100% Monetization'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl 
                  ? 'يتم تشغيل دروسك من خلال مشغل يوتيوب الرسمي فقط؛ كل ثانية تشغيل وكل إعلان يُحسب مباشرة في حساب AdSense وقناتك.'
                  : 'We embed official YouTube players. 100% of watch hours, ad impressions, and subscribers accrue directly to your official channel.'}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-md space-y-3 text-start">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {isRtl ? '٢. معدلات إكمال ومشاهدة فائقة' : '2. Ultra-High Completion Rates'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl 
                  ? 'طلاب SkilliQ يتعلمون في استوديو خالي من التشتت، مما يدفعهم لإنهاء السلاسل بالكامل ورفع تقييم قناتك في خوارزمية يوتيوب.'
                  : 'Free from distraction rabbit holes, SkilliQ learners watch entire series from start to finish, boosting your YouTube retention scores.'}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-md space-y-3 text-start">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {isRtl ? '٣. شهادات معتمدة صادرة باسم دورتك' : '3. Verified Certificates in Your Name'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl 
                  ? 'يحصل الطلاب الذين يكملون دورتك على شهادة رقمية موثقة تبرز اسمك واسم قناتك، مما يعزز مصداقيتك المهنية عالمياً.'
                  : 'Learners receive cryptographic certificates honoring you as the instructor, amplifying your brand across LinkedIn and portfolios.'}
              </p>
            </div>

          </div>
        </section>

        {/* INSTRUCTORS DIRECTORY GRID */}
        <section id="instructors-grid" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 text-start">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-2">
                <GraduationCap className="w-4 h-4" />
                <span>{isRtl ? 'دليل المدربين المعتمدين' : 'Curated Instructors Directory'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {isRtl ? 'أبرز صناع المحتوى الملهمين على SkilliQ' : 'Featured Educators on SkilliQ'}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm">
              {isRtl 
                ? 'استكشف قائمة بالمدربين والقنوات التي تقدم أفضل الدورات البرمجية والتقنية بالمجان.' 
                : 'Browse creators who share world-class engineering masterclasses with the global community.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allInstructors.map((inst, i) => (
              <Link
                key={i}
                to={`/creator/${encodeURIComponent(inst.name)}`}
                className="p-5 rounded-2xl bg-card border border-border/80 hover:border-primary/50 shadow-xs hover:shadow-md transition-all group flex items-start gap-4 text-start active:scale-99"
              >
                {inst.avatar ? (
                  <img
                    src={inst.avatar}
                    alt={inst.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-border group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-black text-lg">
                    {inst.name.charAt(0)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                      {inst.name}
                    </h3>
                    <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="font-medium">
                      {inst.coursesCount} {isRtl ? 'دورات متوفرة' : 'Playlists'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(inst.categories).slice(0, 2).map((cat, idx) => (
                      <span key={idx} className="text-[10px] text-muted-foreground/80">
                        {idx > 0 && '· '}
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 rtl:rotate-180 self-center" />
              </Link>
            ))}
          </div>
        </section>

        {/* JOIN / CLAIM CREATOR PROFILE FORM */}
        <section id="creator-join-form" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-10 rounded-3xl bg-card border border-border shadow-xl text-start space-y-6">
            
            <div className="space-y-1.5 border-b border-border/60 pb-5">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Youtube className="w-4 h-4 text-rose-500" />
                <span>{isRtl ? 'هل أنت صانع محتوى تعليمي على يوتيوب؟' : 'Are You a YouTube Educator?'}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {isRtl ? 'قدم قناتك لتنظيمها على SkilliQ أو وثّق حسابك' : 'Submit Your Courses or Claim Your Verified Creator Badge'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isRtl 
                  ? 'إذا كانت لديك دورات مجانية ذات جودة عالية على يوتيوب، يسعدنا فهرستها وتوفير شهادات معتمدة لطلابك.'
                  : 'If you have created quality free technical masterclasses on YouTube, we would love to feature you and issue verified credentials in your name.'}
              </p>
            </div>

            {hubStatus === 'success' ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 space-y-2">
                <p className="font-bold text-sm">
                  {isRtl ? 'شكراً لك! تم استلام طلبك بنجاح.' : 'Thank you! Your creator submission was received.'}
                </p>
                <p className="text-xs font-normal opacity-90">
                  {isRtl ? 'سيتواصل معك فريق التنسيق بعد مراجعة القناة وتجهيز الصفحة التوثيقية.' : 'Our curation team will review your channel and follow up within 24 to 48 hours.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleHubSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      {isRtl ? 'اسم المدرب أو القناة' : 'Creator / Channel Name'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={hubCreatorName}
                      onChange={(e) => setHubCreatorName(e.target.value)}
                      placeholder={isRtl ? 'مثال: قناة الأكاديمية البرمجية' : 'e.g. FreeCodeCamp'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      {isRtl ? 'البريد الإلكتروني للتواصل' : 'Contact Email'} *
                    </label>
                    <input
                      type="email"
                      required
                      value={hubEmail}
                      onChange={(e) => setHubEmail(e.target.value)}
                      placeholder="instructor@domain.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isRtl ? 'رابط قناة يوتيوب أو قائمة التشغيل' : 'YouTube Channel or Playlist URL'} *
                  </label>
                  <input
                    type="url"
                    required
                    value={hubChannelUrl}
                    onChange={(e) => setHubChannelUrl(e.target.value)}
                    placeholder="https://youtube.com/@yourchannel or playlist link"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isRtl ? 'نبذة عن الدورة أو مقترح التوثيق (اختياري)' : 'About Your Content / Curriculum Goals (Optional)'}
                  </label>
                  <textarea
                    rows={3}
                    value={hubNotes}
                    onChange={(e) => setHubNotes(e.target.value)}
                    placeholder={isRtl ? 'أخبرنا عن موضوعات دورتك ولماذا ترغب في فهرستها على SkilliQ...' : 'Tell us about your courses, target skills, and any specific requests...'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={hubStatus === 'submitting'}
                  className="py-3 px-8 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
                >
                  <Send className="w-4 h-4 rtl:rotate-180" />
                  <span>{isRtl ? 'إرسال طلب التوثيق والإدراج' : 'Submit Creator Application'}</span>
                </button>
              </form>
            )}

          </div>
        </section>

      </div>
    );
  }

  /* =========================================================================
     MODE 2: SPECIFIC INSTRUCTOR PROFILE (When creatorId is in URL)
     ========================================================================= */
  if (creatorCourses.length === 0) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full px-4 md:px-8 py-20 text-center min-h-[70vh] flex flex-col items-center justify-center">
        <Youtube className="w-16 h-16 text-muted-foreground opacity-20 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{isRtl ? 'لم يتم العثور على المدرب' : 'Creator Not Found'}</h2>
        <p className="text-muted-foreground text-sm mb-6">
          {isRtl ? 'لم نتمكن من العثور على محتوى مرتبط بهذا الاسم حالياً.' : 'We couldn\'t find any playlists for this instructor.'}
        </p>
        <Link 
          to="/creator"
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs shadow hover:bg-primary/90 transition-all"
        >
          {isRtl ? 'استعراض دليل المدربين' : 'Browse All Creators'}
        </Link>
      </div>
    );
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full min-h-screen bg-background text-foreground pb-20">
      
      {/* CREATOR PROFILE HEADER */}
      <section className="relative overflow-hidden pt-10 md:pt-16 pb-12 md:pb-16 border-b border-border/60 bg-gradient-to-b from-card/60 via-background to-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <Link
            to="/creator"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-6 group"
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-180 group-hover:-translate-x-0.5 transition-transform" />
            <span>{isRtl ? 'العودة لدليل المدربين' : 'Back to Creators Hub'}</span>
          </Link>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-start">
            {creatorAvatar ? (
              <img
                src={creatorAvatar}
                alt={decodedCreatorId}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-border/80 shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-primary/10 text-primary flex items-center justify-center font-black text-4xl shadow-md border border-primary/20">
                {decodedCreatorId.charAt(0)}
              </div>
            )}

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
                  {decodedCreatorId}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'مدرب موثق' : 'Verified Instructor'}</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                {isRtl
                  ? `جميع الدورات التدريبية والشروحات المفتوحة للمدرب ${decodedCreatorId} منظمة في مسارات متتابعة بدون إعلانات.`
                  : `Curated masterclasses and playlists by ${decodedCreatorId}, presented in SkilliQ's distraction-free learning engine.`}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-mono text-muted-foreground">
                <span className="font-bold text-foreground">
                  {creatorCourses.length} {isRtl ? 'دورات متوفرة' : 'Curated Playlists'}
                </span>
                <span>·</span>
                <span>
                  {creatorCourses.reduce((acc, c) => acc + (c.videos?.length || 0), 0)} {isRtl ? 'درس فيديو' : 'Total Lessons'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* COURSES CATALOG LIST */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* FILTERS & SEARCH BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'ابحث في دورات المدرب...' : 'Search instructor courses...'}
              className="w-full ps-9 pe-4 py-2 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* COURSES GRID */}
        {filteredCourses.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-card border border-border text-muted-foreground text-xs">
            {isRtl ? 'لا توجد نتائج تطابق بحثك.' : 'No courses match your filter criteria.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <Link 
                key={course.id}
                to={`/course/${course.id}`}
                className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all text-start"
              >
                <div className="aspect-video w-full relative overflow-hidden bg-muted">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <PlayCircle className="w-12 h-12 text-white fill-primary/80" />
                  </div>
                  <div className="absolute bottom-2 end-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-white flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    <span>{course.videos.length} {isRtl ? 'درس' : 'videos'}</span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {course.category || 'Course'}
                    </span>
                    <h3 className="font-bold text-sm text-foreground line-clamp-2 mt-1 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{course.difficulty || 'All Levels'}</span>
                    <span className="text-primary font-bold group-hover:underline inline-flex items-center gap-1">
                      {isRtl ? 'ابدأ الدورة' : 'Start'}
                      <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </section>

    </div>
  );
}
