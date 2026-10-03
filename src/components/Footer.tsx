import { useMemo } from 'react';
import { 
  ChevronUp, 
  ShieldCheck, 
  BookOpen, 
  Layers, 
  Award, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';

export function Footer() {
  const { t, i18n } = useTranslation();
  const { language, theme, categories, courses } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';
  const isDark = theme === 'dark';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dynamicTracks = useMemo(() => {
    const set = new Set<string>();
    
    // Add categories from registered categories
    if (Array.isArray(categories)) {
      categories.forEach(c => {
        const name = c.name?.trim();
        if (name && name.toLowerCase() !== 'all') {
          set.add(name);
        }
      });
    }

    // Add categories from active courses
    if (Array.isArray(courses)) {
      courses.forEach(c => {
        const cat = c.category?.trim();
        if (cat && cat.toLowerCase() !== 'all') {
          set.add(cat);
        }
      });
    }

    // Rank categories by course count
    const counts = new Map<string, number>();
    set.forEach(cat => {
      const count = courses.filter(c => c.category?.toLowerCase() === cat.toLowerCase()).length;
      counts.set(cat, count);
    });

    const sorted = Array.from(set).sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0));

    if (sorted.length === 0) {
      return ['Web Development', 'Cyber Security', 'Programming', 'Design', 'AI & Machine Learning'];
    }

    return sorted.slice(0, 5);
  }, [categories, courses]);

  const getCategoryDisplay = (cat: string) => {
    const key = cat.toLowerCase();
    if (isRtl) {
      if (key.includes('web')) return 'تطوير الويب (Web Development)';
      if (key.includes('cyber') || key.includes('security')) return 'الأمن السيبراني (Cyber Security)';
      if (key.includes('prog') || key.includes('python')) return 'البرمجة وبايثون (Programming & Python)';
      if (key.includes('design') || key.includes('ui')) return 'تصميم الواجهات (UI/UX & 3D Design)';
      if (key.includes('market')) return 'التسويق الرقمي (Digital Marketing)';
      if (key.includes('ai') || key.includes('machine')) return 'الذكاء الاصطناعي (AI & ML)';
      if (key.includes('data')) return 'علم البيانات (Data Science)';
      if (key.includes('cloud') || key.includes('devops')) return 'الحوسبة السحابية (Cloud & DevOps)';
      return cat;
    }
    return cat;
  };

  return (
    <footer 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="w-full border-t border-border/80 bg-card/60 dark:bg-card/40 backdrop-blur-md pt-12 sm:pt-16 pb-8 mt-16 sm:mt-20 relative z-10 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* MAIN 4-COLUMN RESPONSIVE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8 pb-12 sm:pb-16 border-b border-border/60">
          
          {/* BRAND & VALUE STATEMENT COLUMN (Spans 4 columns on desktop) */}
          <div className="sm:col-span-2 lg:col-span-4 flex flex-col text-start">
            <Link to="/" className="inline-flex items-center mb-4 group w-fit py-1">
              <img
                key={isDark ? 'footer-logo-dark' : 'footer-logo-light'}
                src={isDark ? '/images/logo_dark.png' : '/images/logo_light.png'}
                alt="Skilliq"
                className="h-10 sm:h-12 w-auto max-w-[200px] sm:max-w-[240px] object-contain transition-all duration-150 group-hover:scale-105"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('/public/images/')) {
                    target.src = isDark ? '/public/images/logo_dark.png' : '/public/images/logo_light.png';
                  }
                }}
              />
            </Link>

            <p className="text-xs sm:text-sm font-semibold text-primary mb-2">
              {t('footer_tagline', 'The Distraction-Free Learning Engine')}
            </p>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5 max-w-sm">
              {t('footer_description', 'Skilliq is a free structured learning platform that organizes the best courses into sequential paths without ads or algorithmic rabbit holes.')}
            </p>

            {/* Operational System Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/60 text-[11px] font-medium text-muted-foreground w-fit mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>{t('footer_status_active', 'All Systems Operational')}</span>
            </div>

            {/* Creator Attribution */}
            <div className="text-xs text-muted-foreground">
              <span>{t('footer_built_by', 'Curated & Built by :')}{' '}</span>
              <a 
                href="https://atlasvcard.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-foreground hover:text-primary transition-colors hover:underline inline-flex items-center gap-0.5"
              >
                <span>ATLAS</span>
                <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* COLUMN 1: LEARN & EXPLORE (Spans 2 columns on desktop) */}
          <div className="lg:col-span-2 flex flex-col text-start">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span>{t('footer_learn_title', 'Learn & Explore')}</span>
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link 
                  to="/courses" 
                  className="text-muted-foreground hover:text-primary transition-colors inline-block py-0.5"
                >
                  {t('footer_all_courses', 'All Playlists')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/paths" 
                  className="text-muted-foreground hover:text-primary transition-colors inline-block py-0.5"
                >
                  {t('footer_learning_paths', 'Curated Paths')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/masterclasses" 
                  className="text-muted-foreground hover:text-primary transition-colors inline-block py-0.5"
                >
                  {t('footer_masterclasses', 'Masterclasses')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/leaderboard" 
                  className="text-muted-foreground hover:text-primary transition-colors inline-block py-0.5"
                >
                  {t('footer_leaderboard', 'Leaderboard')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/verify" 
                  className="text-muted-foreground hover:text-primary transition-colors inline-block py-0.5"
                >
                  {t('footer_verify_title', 'Verify Certificates')}
                </Link>
              </li>
              <li>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-whats-new'))}
                  className="text-primary font-bold hover:underline transition-colors inline-flex items-center gap-1.5 py-0.5 cursor-pointer text-start"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'ما الجديد! (أحدث الدورات)' : "What's New! (Latest Releases)"}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN 2: POPULAR TRACKS (Spans 3 columns on desktop) */}
          <div className="lg:col-span-3 flex flex-col text-start">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('footer_tracks_title', 'Featured Tracks')}</span>
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {dynamicTracks.map((cat) => (
                <li key={cat}>
                  <Link 
                    to={`/courses?category=${encodeURIComponent(cat)}`} 
                    className="text-muted-foreground hover:text-primary transition-colors inline-block py-0.5"
                  >
                    {getCategoryDisplay(cat)}
                  </Link>
                </li>
              ))}
              <li>
                <Link 
                  to="/paths" 
                  className="text-primary font-bold hover:underline transition-colors inline-flex items-center gap-1 py-0.5"
                >
                  <span>{isRtl ? 'جميع المسارات المتسلسلة ←' : 'All Curated Paths →'}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: PLATFORM & PLEDGE (Spans 3 columns on desktop) */}
          <div className="lg:col-span-3 flex flex-col text-start">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('footer_platform_title', 'Platform & Trust')}</span>
            </h4>
            
            <ul className="space-y-2.5 text-xs sm:text-sm mb-5">
              <li>
                <Link 
                  to="/about" 
                  className="text-muted-foreground hover:text-primary transition-colors inline-block py-0.5"
                >
                  {isRtl ? 'عن المنصة (About Us)' : 'About Us'}
                </Link>
              </li>
              <li>
                <Link 
                  to="/copyright" 
                  className="text-muted-foreground hover:text-primary transition-colors inline-block py-0.5"
                >
                  {isRtl ? 'حقوق الملكية وإخلاء المسؤولية' : 'Copyright & Disclaimer'}
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-muted-foreground hover:text-primary transition-colors inline-block py-0.5"
                >
                  {isRtl ? 'تواصل معنا (Contact Us)' : 'Contact Us'}
                </Link>
              </li>
              <li>
                <Link 
                  to="/creator" 
                  className="text-muted-foreground hover:text-primary transition-colors inline-block py-0.5"
                >
                  {isRtl ? 'برنامج صناع المحتوى (Creator Program)' : 'Original Creator Program'}
                </Link>
              </li>
            </ul>

            {/* 100% FREE FOREVER CARD */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-foreground">
                  {t('footer_free_always', '100% Free Forever')}
                </span>
                <Award className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {t('footer_free_desc', 'No subscriptions, no hidden fees, no ads. Built for learners worldwide.')}
              </p>
            </div>

          </div>

        </div>

        {/* BOTTOM COPYRIGHT & SCROLL-TO-TOP STRIP */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="text-center sm:text-start">
            <span>© {new Date().getFullYear()} Skilliq. {t('all_rights_reserved', 'All rights reserved.')}</span>
            <span className="hidden sm:inline mx-2 text-border">·</span>
            <span className="block sm:inline mt-1 sm:mt-0 font-serif italic text-foreground/60">
              "Internet For Everyone"
            </span>
          </div>

          {/* Back to top smooth button */}
          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors text-xs font-medium cursor-pointer"
          >
            <span>{t('footer_scroll_top', 'Back to top')}</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
}
