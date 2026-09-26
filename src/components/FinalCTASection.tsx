import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Check } from 'lucide-react';
import { useStore } from '../store/useStore';

export function FinalCTASection() {
  const { t, i18n } = useTranslation();
  const { language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  return (
    <section 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="w-full py-16 sm:py-24 bg-background relative overflow-hidden border-t border-border/60 transition-colors"
    >
      {/* Soft Ambient Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] sm:w-[48rem] h-[18rem] sm:h-[26rem] rounded-full bg-primary/10 blur-[130px]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Card wrapper */}
        <div className="relative rounded-3xl p-8 sm:p-12 md:p-16 bg-gradient-to-b from-card to-card/60 border border-border/80 shadow-xl overflow-hidden">
          
          {/* Top highlight bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />

          {/* Kicker badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-4 sm:mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRtl ? 'ابدأ مسيرتك الآن' : 'Start Today'}</span>
          </div>

          {/* Main Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight mb-4 max-w-2xl mx-auto">
            {t('final_cta_heading', 'Your next skill starts here.')}
          </h2>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-medium mb-8 max-w-xl mx-auto leading-relaxed">
            {t('final_cta_subheading', "Choose a skill. Start learning. Build what's next.")}
          </p>

          {/* Call to action button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link
              to="/courses"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <span>{t('final_cta_button', 'Explore Courses')}</span>
              <ArrowRight className="w-5 h-5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Trust points */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-muted-foreground pt-4 border-t border-border/50">
            <div className="flex items-center gap-1.5 font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isRtl ? 'مجاني 100% دائماً' : '100% Free Forever'}</span>
            </div>
            <span className="text-border" aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5 font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isRtl ? 'بدون اشتراك أو بطاقة ائتمان' : 'No Credit Card Required'}</span>
            </div>
            <span className="text-border" aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5 font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isRtl ? 'شهادات إتمام موثقة' : 'Verifiable Credentials'}</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
