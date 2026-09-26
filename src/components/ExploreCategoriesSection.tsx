import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Code, 
  Shield, 
  Terminal, 
  Layout, 
  BarChart3, 
  Zap, 
  ArrowRight, 
  Sparkles 
} from 'lucide-react';
import { useStore } from '../store/useStore';

export function ExploreCategoriesSection() {
  const { t, i18n } = useTranslation();
  const { language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const categories = [
    {
      id: 'web-development',
      categoryQuery: 'Web Development',
      name: t('category_Web_Development', 'Web Development'),
      desc: isRtl 
        ? 'بناء مواقع وتطبيقات تفاعلية متكاملة باستخدام React و Next.js و Node.js.' 
        : 'Build modern responsive websites and web apps with React, Next.js, and Node.',
      icon: Code,
      badge: isRtl ? 'المسار الأكثر طلباً' : 'Top In-Demand',
      color: 'from-blue-500/10 via-indigo-500/5 to-transparent',
      borderColor: 'group-hover:border-blue-500/50',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
    },
    {
      id: 'cyber-security',
      categoryQuery: 'Cyber Security',
      name: t('category_Cyber_Security', 'Cyber Security'),
      desc: isRtl 
        ? 'حماية الأنظمة والشبكات، اختبار الاختراق الأخلاقي، وتحليل الثغرات.' 
        : 'Network defense, ethical hacking fundamentals, and digital infrastructure security.',
      icon: Shield,
      badge: isRtl ? 'أمان الأنظمة' : 'Security',
      color: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      borderColor: 'group-hover:border-emerald-500/50',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'programming',
      categoryQuery: 'Programming',
      name: t('category_Programming', 'Programming & Python'),
      desc: isRtl 
        ? 'أساسيات البرمجة، بايثون للمبتدئين، خوارزميات وهياكل البيانات.' 
        : 'Core programming logic, Python scripting, problem-solving, and data structures.',
      icon: Terminal,
      badge: isRtl ? 'الأساس المتين' : 'Foundational',
      color: 'from-amber-500/10 via-orange-500/5 to-transparent',
      borderColor: 'group-hover:border-amber-500/50',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    },
    {
      id: 'design',
      categoryQuery: 'Design',
      name: t('category_Design', 'UI/UX & Design'),
      desc: isRtl 
        ? 'تصميم واجهات المستخدم الحديثة، تجربة الاستخدام، والتصميم ثلاثي الأبعاد.' 
        : 'Figma UI/UX design workflows, modern visual aesthetics, and 3D design.',
      icon: Layout,
      badge: isRtl ? 'إبداع وتصميم' : 'Creative',
      color: 'from-purple-500/10 via-fuchsia-500/5 to-transparent',
      borderColor: 'group-hover:border-purple-500/50',
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
    },
    {
      id: 'digital-marketing',
      categoryQuery: 'digital marketing',
      name: t('category_digital_marketing', 'Digital Marketing'),
      desc: isRtl 
        ? 'تحسين محركات البحث SEO، بناء الحملات الإعلانية، واستراتيجيات النمو الرقمي.' 
        : 'Search engine optimization (SEO), data-driven campaign growth, and marketing strategy.',
      icon: BarChart3,
      badge: isRtl ? 'نمو وتسويق' : 'Growth',
      color: 'from-rose-500/10 via-pink-500/5 to-transparent',
      borderColor: 'group-hover:border-rose-500/50',
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
    },
    {
      id: 'ai-automation',
      categoryQuery: 'AI',
      name: t('category_AI', 'AI & Automation'),
      desc: isRtl 
        ? 'الذكاء الاصطناعي التوليدي، أتمتة الأعمال، وهندسة الأوامر البرمجية.' 
        : 'Generative AI tools, workflow automation, and practical intelligent systems.',
      icon: Zap,
      badge: isRtl ? 'المستقبل' : 'Future-Ready',
      color: 'from-cyan-500/10 via-sky-500/5 to-transparent',
      borderColor: 'group-hover:border-cyan-500/50',
      iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
    }
  ];

  return (
    <section 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="w-full py-16 sm:py-20 bg-muted/20 border-t border-border/60 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('explore_categories_kicker', 'Curated Tracks')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-3">
            {t('explore_categories_title', 'Explore Categories')}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
            {t('explore_categories_subtitle', 'Choose from high-demand technical and creative fields organized into structured learning paths.')}
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                to={`/courses?category=${encodeURIComponent(cat.categoryQuery)}`}
                className={`group relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-card border border-border/70 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 ${cat.borderColor} text-start overflow-hidden cursor-pointer`}
              >
                {/* Subtle top background gradient */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-60 pointer-events-none group-hover:opacity-100 transition-opacity`} 
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cat.iconBg} transition-transform group-hover:scale-110 shadow-xs`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground bg-muted/70 px-2 py-0.5 rounded-md border border-border/50">
                      {cat.badge}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {cat.desc}
                  </p>
                </div>

                <div className="relative z-10 pt-4 mt-4 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  <span>{t('view_track_courses', 'Browse Courses')}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
