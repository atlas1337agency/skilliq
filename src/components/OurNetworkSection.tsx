import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ExternalLink } from 'lucide-react';
import { useStore } from '../store/useStore';

interface NetworkPartner {
  id: string;
  name: string;
  nameAr: string;
  logo: string;
  link: string;
}

const NETWORK_PARTNERS: NetworkPartner[] = [
  {
    id: 'cdd',
    name: 'Club des Dirigeants (CDD)',
    nameAr: 'نادي المسيرين بالمغرب (CDD)',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnimF4K0u7yoTEXQ5yk1fwYFCt6kEKEpWEcuQvyTkM9g&s=10',
    link: 'https://www.clubdesdirigeants.ma',
  },
  {
    id: 'bni-morocco',
    name: 'BNI Morocco',
    nameAr: 'شبكة الأعمال الدولية بالمغرب (BNI Morocco)',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaCky5kEX64E7LDFIQ9M7jQ-SPcIP2iAFiSjn5axxHuA&s',
    link: 'https://bnimorocco.com',
  },
  {
    id: 'cjd-maroc',
    name: 'CJD Maroc',
    nameAr: 'مركز المسيرين الشباب بالمغرب (CJD Maroc)',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTRG0EyPoKWVSkdMOQei6aExI18Q8CW_gIavIjCcbyFLHWSWLTZRlmSr0&s=10',
    link: 'https://cjd.ma',
  },
  {
    id: 'rem',
    name: 'Réseau Entreprendre Maroc',
    nameAr: 'شبكة المقاولة بالمغرب (Réseau Entreprendre Maroc)',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7gsbNRWYAWB7Tm9t_z1PvB2Rfcn2Pjdb8AQdquvc-nLqz9WQkzot9vFWC&s=10',
    link: 'https://www.reseau-entreprendre.org/maroc/',
  },
  {
    id: 'cad',
    name: 'Club Afrique Développement',
    nameAr: 'نادي إفريقيا والتنمية (Club Afrique Développement)',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTx8t8RLIG-5N5KWMtxTu61lOJP1473TSGXxYMUJtSrYhXgmjjT7Akzunc&s=10',
    link: 'https://clubafriquedeveloppement.com',
  },
  {
    id: 'the-bridge',
    name: 'The Bridge',
    nameAr: 'ذا بريدج للأعمال (The Bridge)',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7iKrlwxNbiKwloDrfDP8f8dPyPnQ5PvPsmfRYgMhmE_PjH07VvvLLfthi&s=10',
    link: 'https://www.thebridge.business',
  },
  {
    id: 'cgem',
    name: 'CGEM',
    nameAr: 'الاتحاد العام لمقاولات المغرب (CGEM)',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/06/LOGO_CGEM_OFFICIEL_2023.jpg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original',
    link: 'https://cgem.ma',
  },
  {
    id: 'check-mate',
    name: 'Check Mate',
    nameAr: 'تشيك ميت (Check Mate)',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwzUU-5iiCtefPEXGmHgb7Ck0yqHbGBvCzihrdU-QwDQ&s=10',
    link: 'https://www.checkmate.ma',
  },
  {
    id: 'digital-now',
    name: 'Digital Now',
    nameAr: 'ديجيتال ناو (Digital Now)',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlgG8UtU4O1wMbWo_uqEvHJfAcIks32BQ46u5if8YeEED4GEGerD1488Rb&s=10',
    link: 'https://digitalnow.ma',
  },
  {
    id: 'tikitino',
    name: 'Tikitino',
    nameAr: 'تيكيتينو (Tikitino)',
    logo: 'https://tikitino.ma/storage/platform/icon%20txikitino.png',
    link: 'https://www.tikitino.ma',
  },
  {
    id: 'club-business-maroc',
    name: 'Club Business Maroc',
    nameAr: 'نادي الأعمال بالمغرب (Club Business Maroc)',
    logo: 'https://club-business-maroc.com/wp-content/uploads/2026/05/1777140603608.jpeg',
    link: 'https://club-business-maroc.com',
  },
];

export function OurNetworkSection() {
  const { t, i18n } = useTranslation();
  const { language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  // Duplicate list for seamless infinite loop
  const slidingPartners = [...NETWORK_PARTNERS, ...NETWORK_PARTNERS];

  return (
    <section dir={isRtl ? 'rtl' : 'ltr'} className="w-full transition-colors overflow-hidden">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-border/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span>{t('our_network_kicker', 'Ecosystem & Communities')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            {t('our_network_title', 'Our Network')}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            {t(
              'our_network_subtitle',
              'Connected to leading entrepreneurial and business communities across Morocco and Africa.'
            )}
          </p>
        </div>
      </div>

      {/* AUTOMATIC SLIDING CAROUSEL (Laptop, Tablet & Mobile) */}
      <div className="relative w-full py-2" dir="ltr">
        {/* Soft Left & Right Edge Fade Masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-16 md:w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 md:w-24 bg-gradient-to-l from-background to-transparent z-10" />

        <div className="flex w-max animate-network-slide hover:[animation-play-state:paused] active:[animation-play-state:paused]">
          {slidingPartners.map((partner, index) => {
            const displayName = isRtl ? partner.nameAr : partner.name;

            return (
              <div
                key={`${partner.id}-${index}`}
                className="px-2 sm:px-3 shrink-0"
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                <a
                  href={partner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative w-52 sm:w-60 md:w-64 h-full flex flex-col items-center justify-between bg-card hover:bg-muted/40 rounded-3xl border border-border/80 hover:border-primary/40 p-5 sm:p-6 text-center transition-all duration-200 hover:shadow-xl hover:-translate-y-1.5 cursor-pointer"
                  aria-label={displayName}
                >
                  {/* External link badge */}
                  <div className="absolute top-3.5 end-3.5 w-7 h-7 rounded-full bg-muted/60 group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary flex items-center justify-center transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>

                  {/* Uniform Size Logo Container */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border border-border/60 p-3 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200 shrink-0 mb-4">
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Partner Name */}
                  <div className="flex flex-col items-center justify-center flex-1 w-full">
                    <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug min-h-[2.5rem] flex items-center justify-center">
                      {displayName}
                    </h3>
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                      <span>{t('our_network_visit', 'Visit Community')}</span>
                    </span>
                  </div>
                </a>
              </div>
            );
          })}
        </div>

        <style>{`
          @keyframes networkSlide {
            0% {
              transform: translate3d(0, 0, 0);
            }
            100% {
              transform: translate3d(-50%, 0, 0);
            }
          }
          .animate-network-slide {
            animation: networkSlide 38s linear infinite;
            will-change: transform;
          }
        `}</style>
      </div>
    </section>
  );
}
