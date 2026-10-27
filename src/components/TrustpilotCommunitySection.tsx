import React from 'react';
import { useTranslation } from 'react-i18next';
import { Star, ExternalLink, ShieldCheck, Heart, Award, ArrowUpRight, MessageSquareQuote } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../store/useStore';
import { awardCustomXP } from '../lib/gamification';
import { TRUSTPILOT_REVIEW_URL } from './TrustpilotReviewBanner';
import { cn } from '../lib/utils';

export function TrustpilotCommunitySection() {
  const { t, i18n } = useTranslation();
  const { user, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const handleReviewClick = async () => {
    window.open(TRUSTPILOT_REVIEW_URL, '_blank', 'noopener,noreferrer');
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#00b67a', '#22c55e', '#38bdf8', '#fbbf24']
      });
    } catch {}

    localStorage.setItem('skilliq_trustpilot_status', 'reviewed');

    if (user?.uid) {
      try {
        await awardCustomXP(user.uid, 50, {
          id: 'trustpilot_advocate',
          name: isRtl ? 'سفير مجتمع Skilliq' : 'Community Advocate',
          description: isRtl ? 'قيّم منصة Skilliq على Trustpilot' : 'Reviewed Skilliq on Trustpilot',
          icon: '⭐',
        });
      } catch (err) {
        console.warn('XP error:', err);
      }
    }
  };

  const reviews = [
    {
      name: isRtl ? 'كريم مرابط' : 'Karim M.',
      role: isRtl ? 'طالب هندسة برمجيات' : 'Computer Science Student',
      comment: isRtl
        ? 'أفضل منصة برمجية رأيتها مؤخراً. أزالت خوارزميات يوتيوب والمشتتات ورتّبت الفيديوهات في مسارات حقيقية مع شهادات معتمدة.'
        : 'Finally, a platform that strips away YouTube algorithmic rabbit holes and organizes tutorials into sequential, certified paths.',
      date: '2026'
    },
    {
      name: isRtl ? 'سارة المنصوري' : 'Sarah T.',
      role: isRtl ? 'مطورة واجهات أمامية' : 'Frontend Engineer',
      comment: isRtl
        ? 'مؤقت بومودورو المدمج، متتبع التقدم، والشهادات القابلة للتحقق جعلت دراستي أسرع بثلاث مرات وبدون أي تكلفة.'
        : 'The built-in focus timer, lesson tracking, and verifiable credential engine transformed how I study. 100% free with no hidden paywalls.',
      date: '2026'
    },
    {
      name: isRtl ? 'عمر بنجلون' : 'Omar B.',
      role: isRtl ? 'مهتم بالأمن السيبراني' : 'Cybersecurity Learner',
      comment: isRtl
        ? 'منصة نظيفة وسريعة، تصميم هادئ يحترم وقت المتعلم. تقييم 5 نجوم بدون تردد.'
        : 'Ultra-clean UI, zero spam, and respects learner time. Supporting this project on Trustpilot is the least we can do.',
      date: '2026'
    }
  ];

  return (
    <section 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="w-full py-16 sm:py-20 bg-background relative overflow-hidden border-t border-border/70 transition-colors"
    >
      {/* Background radial ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[22rem] rounded-full bg-[#00b67a]/8 blur-[140px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Bento Hero Container */}
        <div className="rounded-3xl p-6 sm:p-10 md:p-12 bg-gradient-to-b from-[#001c10]/70 via-card to-card border border-[#00b67a]/30 shadow-2xl overflow-hidden relative">
          
          {/* Top Emerald Brand Strip */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#00b67a] via-emerald-400 to-teal-400" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Trustpilot Badge, Value Pitch & Action CTA */}
            <div className="lg:col-span-5 flex flex-col text-start space-y-4">
              
              {/* Trustpilot Pill & Stars */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-[#00b67a] text-white px-2.5 py-1 rounded-md shadow-xs">
                  <Star className="w-4 h-4 fill-white text-white" />
                  <span className="text-xs font-black tracking-wider uppercase">Trustpilot</span>
                </div>

                <div className="flex items-center gap-1" aria-label="5 stars rating">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-5 h-5 bg-[#00b67a] rounded-[2px] flex items-center justify-center">
                      <Star className="w-3 h-3 fill-white text-white" />
                    </div>
                  ))}
                </div>

                <span className="text-xs font-bold text-foreground font-mono">
                  5.0 / 5.0
                </span>
              </div>

              {/* Headline */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
                {isRtl 
                  ? 'موثوق من الطلاب حول العالم · وادعمنا على Trustpilot' 
                  : 'Loved by Learners. Back Us on Trustpilot.'}
              </h2>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isRtl 
                  ? 'منصة Skilliq مبنية بمبدأ واحد: "الإنترنت للجميع". تعليم تقني مجاني 100% دون أي رسوم أو إعلانات. رأيك وتقييمك على Trustpilot يُمكّن متعلمين جدد من الوصول للمنصة.' 
                  : 'Skilliq is built on one simple premise: Internet For Everyone. 100% free education with no paywalls or advertising algorithms. Your 1-minute honest review on Trustpilot helps thousands of learners discover this free platform.'}
              </p>

              {/* Value stats */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-card border border-border/80">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <ShieldCheck className="w-4 h-4 text-[#00b67a]" />
                    <span>{isRtl ? 'مجاني 100%' : '100% Free Forever'}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    {isRtl ? 'بدون إعلانات أو اشتراكات' : 'Zero ads & zero fees'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border/80">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <Award className="w-4 h-4 text-primary" />
                    <span>{isRtl ? '+50 نقطة XP' : '+50 Bonus XP'}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    {isRtl ? 'مكافأة فورية لحسابك' : 'Instant reward on review'}
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-2">
                <button
                  onClick={handleReviewClick}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#00b67a] hover:bg-[#009b67] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#00b67a]/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <Star className="w-4 h-4 fill-white" />
                  <span>{isRtl ? 'اكتب تقييمك على Trustpilot (+50 XP)' : 'Review Skilliq on Trustpilot (+50 XP)'}</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>

            </div>

            {/* Right Column: Authentic Community Reviews Bento */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reviews.map((rev, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "p-4 sm:p-5 rounded-2xl bg-card/90 border border-border/70 hover:border-[#00b67a]/40 transition-all flex flex-col justify-between text-start relative group",
                    idx === 0 && "sm:col-span-2 bg-gradient-to-r from-card to-card/60"
                  )}
                >
                  <div className="space-y-3">
                    {/* Stars */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="w-3.5 h-3.5 bg-[#00b67a] rounded-[1px] flex items-center justify-center">
                            <Star className="w-2 h-2 fill-white text-white" />
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {isRtl ? 'تقييم موثق' : 'Verified Review'}
                      </span>
                    </div>

                    {/* Comment */}
                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal">
                      "{rev.comment}"
                    </p>
                  </div>

                  {/* Author */}
                  <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-foreground">{rev.name}</h4>
                      <p className="text-[11px] text-muted-foreground">{rev.role}</p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#00b67a]/15 text-[#00b67a] flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
