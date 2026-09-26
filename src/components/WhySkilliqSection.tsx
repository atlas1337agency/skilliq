import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Clock, 
  Terminal, 
  Users, 
  Briefcase, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useStore } from '../store/useStore';

export function WhySkilliqSection() {
  const { t, i18n } = useTranslation();
  const { language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const pillars = [
    {
      id: 'pace',
      title: t('why_pace_title', 'Learn at your pace'),
      description: t('why_pace_desc', 'Study whenever and wherever you want.'),
      icon: Clock,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      id: 'practical',
      title: t('why_practical_title', 'Practical skills'),
      description: t('why_practical_desc', 'Learn through real projects, not just theory.'),
      icon: Terminal,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'experts',
      title: t('why_experts_title', 'Learn from experts'),
      description: t('why_experts_desc', 'Courses built by people who actually work in the field.'),
      icon: Users,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      id: 'portfolio',
      title: t('why_portfolio_title', 'Build your portfolio'),
      description: t('why_portfolio_desc', 'Turn what you learn into projects you can show.'),
      icon: Briefcase,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10 border-amber-500/20'
    }
  ];

  return (
    <section 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="w-full py-16 sm:py-20 bg-background border-t border-border/60 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRtl ? 'تجربة تعلم استثنائية' : 'The SKILLIQ Standard'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-3">
            {t('why_skilliq_title', 'Why SKILLIQ?')}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
            {t('why_skilliq_subtitle', 'A focused learning experience built to bridge the gap between watching tutorials and building real capability.')}
          </p>
        </div>

        {/* 4 Responsive Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.id}
                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-card border border-border/70 hover:border-border hover:shadow-lg transition-all duration-200 text-start"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border ${pillar.bg} ${pillar.color} transition-transform group-hover:scale-105 shadow-xs`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">
                    {pillar.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-4 mt-5 border-t border-border/40 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{isRtl ? 'متاح دائماً مجاناً' : 'Standard on SKILLIQ'}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
