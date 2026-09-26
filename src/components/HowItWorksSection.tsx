import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Compass, 
  Video, 
  Laptop, 
  Award,
  Layers
} from 'lucide-react';
import { useStore } from '../store/useStore';

export function HowItWorksSection() {
  const { t, i18n } = useTranslation();
  const { language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const steps = [
    {
      number: '01',
      title: t('how_step_1_title', 'Choose a Skill'),
      desc: t('how_step_1_desc', 'Select from hand-picked curriculum tracks designed for real-world job roles.'),
      icon: Compass,
      accent: 'from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400'
    },
    {
      number: '02',
      title: t('how_step_2_title', 'Learn Distraction-Free'),
      desc: t('how_step_2_desc', 'Experience sequential lessons stripped of ads, algorithm feeds, and clickbait.'),
      icon: Video,
      accent: 'from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400'
    },
    {
      number: '03',
      title: t('how_step_3_title', 'Build Practical Projects'),
      desc: t('how_step_3_desc', 'Synthesize knowledge into working code, designs, and tangible assets.'),
      icon: Laptop,
      accent: 'from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400'
    },
    {
      number: '04',
      title: t('how_step_4_title', 'Earn Verified Proof'),
      desc: t('how_step_4_desc', 'Complete lessons, monitor your progress, and claim verifiable credentials.'),
      icon: Award,
      accent: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400'
    }
  ];

  return (
    <section 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="w-full py-16 sm:py-20 bg-muted/20 border-t border-border/60 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>{t('how_it_works_kicker', 'Simple, Proven Methodology')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-3">
            {t('how_it_works_title', 'How SKILLIQ Works')}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
            {t('how_it_works_subtitle', 'Four clear steps from finding a skill to mastering it with verifiable proof.')}
          </p>
        </div>

        {/* 4 Steps Timeline / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.number}
                className="relative bg-card border border-border/70 rounded-2xl p-6 flex flex-col justify-between hover:border-border hover:shadow-md transition-all text-start"
              >
                <div>
                  {/* Top Step Number & Icon */}
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-muted-foreground/30">
                      {step.number}
                    </span>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.accent} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/40 text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>{isRtl ? `المرحلة ${index + 1} من 4` : `Phase ${index + 1} of 4`}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
