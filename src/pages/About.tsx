import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  Layers, 
  Award, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Target, 
  Users, 
  HeartHandshake,
  Compass,
  GraduationCap,
  Play
} from 'lucide-react';
import { cn } from '../lib/utils';

export function About() {
  const { t, i18n } = useTranslation();
  const { language, courses, learningPaths } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  useEffect(() => {
    document.title = isRtl 
      ? "عن منصة SkilliQ - منصة التعليم المنهجي الحر" 
      : "About SkilliQ - The Distraction-Free Learning Platform";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content", 
        isRtl 
          ? "تعرف على رؤية ورسالة SkilliQ في تحويل أفضل دورات يوتيوب إلى مسارات تعليمية منظمة خالية من المشتتات والإعلانات."
          : "Discover SkilliQ's mission: transforming the best free educational content into structured, distraction-free learning paths with verifiable certificates."
      );
    }
  }, [isRtl]);

  const stats = [
    {
      value: courses.length > 0 ? `${courses.length}+` : '60+',
      labelEn: 'Curated Playlists',
      labelAr: 'دورة تدريبية متخصصة',
      descEn: 'Handpicked from the world\'s top tech educators',
      descAr: 'منتقاة بعناية من أفضل رواد التعليم في العالم'
    },
    {
      value: learningPaths.length > 0 ? `${learningPaths.length}` : '5',
      labelEn: 'Structured Career Paths',
      labelAr: 'مسارات مهنية متسلسلة',
      descEn: 'From absolute zero to production readiness',
      descAr: 'من الصفر وحتى الاحتراف وسوق العمل'
    },
    {
      value: '100%',
      labelEn: 'Free & Ad-Free',
      labelAr: 'مجانية بالكامل وبدون إعلانات',
      descEn: 'No subscriptions, no paywalls, zero algorithmic traps',
      descAr: 'بلا رسوم خفية أو إعلانات مشتتة لانتباهك'
    },
    {
      value: '24/7',
      labelEn: 'Distraction-Free Focus',
      labelAr: 'استوديو تركيز متكامل',
      descEn: 'Built-in note taker, timestamps, and focus modes',
      descAr: 'تدوين ملاحظات ذكي ونمط تركيز سينمائي'
    }
  ];

  const pillars = [
    {
      icon: Target,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      titleEn: '1. Zero Algorithmic Traps',
      titleAr: '١. وداعاً للخوارزميات المشتتة',
      textEn: 'YouTube contains world-class education, but its recommendation engine is engineered to distract you with entertainment and clickbait. SkilliQ isolates the pure educational signal so you finish what you start.',
      textAr: 'يحتوي يوتيوب على أثمن المحتويات التعليمية في العالم، لكن خوارزمياته مصممة لإبقائك في دوامة الفيديوهات الترفيهية والمشتتات. تقوم SkilliQ بعزل المحتوى التعليمي النقي لتكمل ما بدأته دون انقطاع.'
    },
    {
      icon: Layers,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      titleEn: '2. Sequential Milestone Paths',
      titleAr: '٢. مسارات تعليمية متسلسلة ومحكمة',
      textEn: 'Random tutorials lead to tutorial hell. Our curated paths structure video playlists into logical, step-by-step milestones with clear prerequisites and tangible learning outcomes.',
      textAr: 'الدروس العشوائية تؤدي إلى التشتت والتراجع. تجمع مساراتنا أفضل الدورات في مراحل متتابعة بخطة واضحة تبدأ من الأساسيات وتتدرج بك حتى بناء مشاريع حقيقية.'
    },
    {
      icon: Award,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      titleEn: '3. Verifiable Proof of Skill',
      titleAr: '٣. إثبات مهارات موثق وقابل للتحقق',
      textEn: 'Complete every lesson in a playlist and earn a verifiable cryptographic certificate of completion with unique QR codes to showcase on your LinkedIn, resume, and portfolio.',
      textAr: 'عند إكمال جميع دروس الدورة، تحصل على شهادة إنجاز رقمية موثقة تحتوي على رمز QR فريد يثبت مجهودك ويمكنك مشاركته في سيرتك الذاتية وملفك المهني.'
    },
    {
      icon: HeartHandshake,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      titleEn: '4. Ethical Creator Attribution',
      titleAr: '٤. احترام كامل لحقوق صناع المحتوى',
      textEn: 'We embed original YouTube players directly. Every second you watch generates views, watch time, and ad metrics directly on the original creators’ official channels.',
      textAr: 'نحن نستخدم مشغلات يوتيوب الرسمية مباشرة؛ كل ثانية تقضيها في التعلم تُحسب كـ مشاهدات ووقت تشغيل مباشر لصالح القناة الأصلية لصانع المحتوى دون أي انتهاك.'
    }
  ];

  const steps = [
    {
      number: '01',
      titleEn: 'Discover Curated Tracks',
      titleAr: 'اكتشف المسارات المنتقاة',
      descEn: 'Select from Web Development, Cybersecurity, AI, Python, UI/UX, or Digital Marketing.',
      descAr: 'اختر مجالك المفضل بين تطوير الويب، الأمن السيبراني، الذكاء الاصطناعي، التصميم، أو التسويق.'
    },
    {
      number: '02',
      titleEn: 'Learn in Cinema Focus Mode',
      titleAr: 'تعلم في نمط التركيز السينمائي',
      descEn: 'Enjoy sequential auto-play, quick timestamps, interactive notes, and speed controls.',
      descAr: 'استمتع بالتشغيل التلقائي المتتابع، وحفظ مواضع المشاهدة، وتدوين الملاحظات الذكية.'
    },
    {
      number: '03',
      titleEn: 'Track Real Daily Progress',
      titleAr: 'تتبع تقدمك اليومي خطوة بخطوة',
      descEn: 'Watch your progress bar grow and earn level points as you conquer video lessons.',
      descAr: 'شاهد نسبة إنجازك ترتفع واحصد نقاط الخبرة والتقدم مع كل درس تتقنه.'
    },
    {
      number: '04',
      titleEn: 'Claim & Verify Your Certificate',
      titleAr: 'احصل على شهادتك المعتمدة',
      descEn: 'Generate an instant digital credential with public verification link and QR code.',
      descAr: 'احصل فوراً على شهادة إنجاز رسمية برابط تحقق عام لمشاركتها مع العالم.'
    }
  ];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full min-h-screen bg-background text-foreground pb-20">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 md:pb-24 border-b border-border/60 bg-gradient-to-b from-card/60 via-background to-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRtl ? 'الرؤية والرسالة في SkilliQ' : 'The SkilliQ Vision & Mission'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.15] mb-6">
            {isRtl ? (
              <>
                التعليم التقني المفتوح <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
                  بدون تشتيت أو اشتراكات
                </span>
              </>
            ) : (
              <>
                World-Class Education, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
                  Zero Distractions or Paywalls.
                </span>
              </>
            )}
          </h1>

          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            {isRtl 
              ? 'صُممت منصة SkilliQ لتكون المحرك التعليمي الأصفى في العالم العربي والعالم؛ نحول أفضل شروحات يوتيوب المبعثرة إلى مسارات تعليمية متكاملة تساعدك على اكتساب مهارات حقيقية وسريعة.'
              : 'SkilliQ is built to be the cleanest learning engine on the web. We organize the finest YouTube tutorials into coherent, milestone-driven paths with verifiable credentials.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/courses"
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm shadow-md transition-all active:scale-98 flex items-center gap-2"
            >
              <span>{isRtl ? 'استكشف جميع الدورات' : 'Explore All Courses'}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
            <Link
              to="/paths"
              className="px-6 py-3 rounded-xl bg-card hover:bg-muted text-foreground border border-border/80 font-bold text-sm shadow-xs transition-all active:scale-98 flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-primary" />
              <span>{isRtl ? 'تصفح المسارات المتكاملة' : 'Browse Learning Paths'}</span>
            </Link>
          </div>

        </div>
      </section>

      {/* METRICS STRIP */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((item, idx) => (
            <div 
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-md backdrop-blur-sm text-start"
            >
              <span className="text-2xl sm:text-4xl font-black text-primary font-mono tracking-tight block mb-1">
                {item.value}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-foreground mb-1">
                {isRtl ? item.labelAr : item.labelEn}
              </h4>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">
                {isRtl ? item.descAr : item.descEn}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* THE STORY & PHILOSOPHY */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-5 text-start">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-primary">
              <BookOpen className="w-4 h-4" />
              <span>{isRtl ? 'لماذا أنشأنا SkilliQ؟' : 'Why We Built SkilliQ'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">
              {isRtl ? 'المعرفة موجودة بالمجان، لكن التركيز هو العملة النادرة.' : 'The Knowledge is Already Free. Focus is the Real Luxury.'}
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isRtl 
                ? 'في العصر الرقمي الحالي، يقضي الطلاب والمتعلمون ساعات طويلة في البحث بين مئات الدورات ومقاطع الفيديو دون معرفة من أين يبدأون وأين ينتهون. والأسوأ من ذلك، أن خوارزميات الفيديو مصممة لإثارة الفضول واستهلاك الوقت بدلاً من تحفيز الإنجاز.'
                : 'Every day, brilliant programmers, designers, and engineers publish world-class masterclasses on YouTube for free. Yet, the vast majority of learners never finish what they start. The reason is simple: the platform is designed to maximize engagement, not completion.'}
            </p>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isRtl
                ? 'جاءت SkilliQ لتضع حداً لحالة التشتت؛ قمنا بفرز أفضل سلاسل الدروس، ترتيبها حسب الأقدمية والأهمية، وتوفير بيئة تعليمية هادئة تشبه استوديوهات التعليم الاحترافية مع نظام إنجاز وشهادات معتمدة.'
                : 'SkilliQ was created to fix the completion gap. We strip away recommendations, comment debates, and clickbait, wrapping the finest educational playlists in a distraction-free learning studio with automatic timestamps, smart notes, and verifiable certificates.'}
            </p>

            <div className="pt-2">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-start space-y-1">
                <span className="text-xs font-bold text-foreground block">
                  {isRtl ? '💡 المبدأ الذهبي في SkilliQ:' : '💡 The SkilliQ Gold Standard:'}
                </span>
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  {isRtl 
                    ? '"الإنترنت حق للجميع، والتعليم المتقن يجب ألا تحجبه بوابات الدفع أو تُفسده الإعلانات."'
                    : '"The internet belongs to everyone, and high-tier technical education must never be locked behind exorbitant paywalls or derailed by algorithmic traps."'}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-xl space-y-6 text-start">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span>{isRtl ? 'ما الذي يميز تجربة SkilliQ؟' : 'What Makes SkilliQ Distinct?'}</span>
              </h3>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-foreground mb-0.5">
                      {isRtl ? 'مشغل مخصص بدون إعلانات منبثقة' : 'Dedicated Ad-Free Player Experience'}
                    </h5>
                    <p className="text-muted-foreground leading-relaxed">
                      {isRtl ? 'تشغيل مستمر، حفظ موضع الفيديو، وسرعات تشغيل متعددة مع نمط التركيز الكامل.' : 'Continuous playback, saved timestamps, and fullscreen cinema mode.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-foreground mb-0.5">
                      {isRtl ? 'دفتر ملاحظات متزامن مع كل درس' : 'Synced Note-Taking Per Lesson'}
                    </h5>
                    <p className="text-muted-foreground leading-relaxed">
                      {isRtl ? 'اكتب ملاحظاتك أثناء المشاهدة واحفظها محلياً للرجوع إليها في أي وقت.' : 'Write takeaways as you watch and download them anytime for quick review.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-foreground mb-0.5">
                      {isRtl ? 'مستشار الذكاء الاصطناعي لتخطيط التعلم' : 'AI-Powered Smart Path Advisor'}
                    </h5>
                    <p className="text-muted-foreground leading-relaxed">
                      {isRtl ? 'حدد هدفك التقني ليقوم الذكاء الاصطناعي برسم خارطة طريق مخصصة لدراستك.' : 'Enter your ambition to generate a customized curriculum tailored to your goals.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-foreground mb-0.5">
                      {isRtl ? 'لوحة المتصدرين ونقاط التحصيل' : 'Gamified Progress & Global Leaderboard'}
                    </h5>
                    <p className="text-muted-foreground leading-relaxed">
                      {isRtl ? 'تنافس بنزاهة مع متعلمين جادين من جميع أنحاء العالم وراقب ارتقاء مستواك.' : 'Earn XP for finished videos and see where you rank among serious peers worldwide.'}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 4 CORE PILLARS */}
      <section className="bg-card/40 border-y border-border/60 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>{isRtl ? 'ركائز المنصة' : 'The SkilliQ Creed'}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight mb-4">
            {isRtl ? 'مبادئ راسخة في خدمة المتعلم' : 'Built on Four Uncompromising Pillars'}
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto mb-12">
            {isRtl 
              ? 'كل سطر برمجي وتصميم في SkilliQ موجه لخدمة تركيزك وتحقيق نتائج تعليمية ملموسة.' 
              : 'Every feature and design choice in SkilliQ is optimized for mental clarity and genuine skill acquisition.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-start">
            {pillars.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div 
                  key={idx}
                  className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-md hover:border-primary/40 transition-colors space-y-3"
                >
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border", p.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    {isRtl ? p.titleAr : p.titleEn}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {isRtl ? p.textAr : p.textEn}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* HOW IT WORKS (ROADMAP) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
          <Zap className="w-4 h-4" />
          <span>{isRtl ? 'طريقة العمل' : 'How SkilliQ Works'}</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight mb-12">
          {isRtl ? 'رحلتك من البداية وحتى الشهادة' : 'Your Learning Journey in 4 Simple Steps'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-start">
          {steps.map((st, i) => (
            <div 
              key={i}
              className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="text-3xl font-black font-mono text-primary/30">
                  {st.number}
                </span>
                <h4 className="text-sm font-bold text-foreground">
                  {isRtl ? st.titleAr : st.titleEn}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRtl ? st.descAr : st.descEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM INVITATION CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-primary/10 via-indigo-500/10 to-purple-600/10 border border-primary/20 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {isRtl ? 'جاهز لبدء رحلتك التعليمية بدون تشتيت؟' : 'Ready to Experience Distraction-Free Learning?'}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {isRtl
              ? 'انضم إلى آلاف الطلاب الذين اختاروا التركيز واكتساب المهارات الحقيقية بالمجان وبلا إعلانات.'
              : 'Join thousands of focused learners who chose mastery over distractions. 100% free, forever.'}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/courses"
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 active:scale-98"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isRtl ? 'ابدأ التعلم الآن' : 'Start Learning Now'}</span>
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 rounded-xl bg-card border border-border hover:bg-muted text-foreground font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-98"
            >
              <span>{isRtl ? 'تواصل معنا' : 'Get in Touch'}</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
