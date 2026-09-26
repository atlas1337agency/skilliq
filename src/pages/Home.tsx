import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PlayCircle, BookOpen, Code, Terminal, Layout, Database, Shield, ArrowRight, Zap, Award, CheckCircle2, ChevronRight, Video, Users, Github, Youtube, Cloud, Search, BarChart3, Star, Layers, Sparkles, Compass } from 'lucide-react';
import { motion, useScroll, useTransform, useMotionValue, useSpring, useMotionTemplate } from 'motion/react';
import { useStore } from '../store/useStore';
import { filterByLanguage, filterPathsByLanguage } from '../lib/utils';
import { HeroSection } from '../components/HeroSection';
import { ExploreCategoriesSection } from '../components/ExploreCategoriesSection';
import { WhySkilliqSection } from '../components/WhySkilliqSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { FinalCTASection } from '../components/FinalCTASection';
import { PopularCoursesSection } from '../components/PopularCoursesSection';
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
  const { t } = useTranslation();
  const partners = [
    { name: 'YouTube', icon: Youtube },
    { name: 'GitHub', icon: Github },
    { name: 'Vercel', icon: Zap },
    { name: 'Firebase', icon: Database },
    { name: 'Google Cloud', icon: Cloud },
    { name: 'Google Analytics', icon: BarChart3 }
  ];

  return (
    <div className="w-full bg-background border-y border-border/50 py-8 overflow-hidden relative">
      <div className="absolute start-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10"></div>
      <div className="absolute end-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10"></div>
      
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">{t('trusted_integrated_with', 'Trusted by & Integrated With')}</p>
      
      <div className="flex whitespace-nowrap animate-marquee">
        {/* Double the array for seamless infinite scroll */}
        {[...partners, ...partners, ...partners].map((partner, idx) => {
          const Icon = partner.icon;
          return (
            <div key={idx} className="flex items-center gap-2 mx-8 text-foreground/60 hover:text-foreground transition-colors cursor-pointer grayscale hover:grayscale-0">
              <Icon className="w-6 h-6" />
              <span className="font-bold text-lg">{partner.name}</span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
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
      <Helmet>
        <title>Skilliq | Free Structured Learning Platform & Masterclasses</title>
        <meta name="description" content="Skilliq offers a premium, distraction-free learning environment. Access curated courses, masterclasses, and guided paths in tech, design, and cybersecurity entirely for free." />
      </Helmet>
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

        {/* Popular Masterclasses Section */}
        <PopularMasterclassesSection />
      </div>
      {/* SECTIONS BEFORE FOOTER */}
      <ExploreCategoriesSection />
      <WhySkilliqSection />
      <HowItWorksSection />
      <FinalCTASection />
    </div>
  );
}
