import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PlayCircle, BookOpen, Code, Terminal, Layout, Database, Shield, ArrowRight, Zap, Target, Award, CheckCircle2, ChevronRight, Video, Users, Github, Youtube, Cloud, Search, BarChart3, Star, Layers } from 'lucide-react';
import { motion, useScroll, useTransform, useMotionValue, useSpring, useMotionTemplate } from 'motion/react';
import { useStore } from '../store/useStore';
import { filterByLanguage, filterPathsByLanguage } from '../lib/utils';

const iconMap: Record<string, any> = {
  Code,
  Terminal,
  Layout,
  Database,
  Shield
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

function ModernHero() {
  const { t } = useTranslation();
  const { language } = useStore();
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <section 
      className="relative w-full overflow-hidden bg-background pt-12 pb-20 lg:pt-16 lg:pb-32 min-h-[80vh] group"
      onMouseMove={handleMouseMove}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:32px_32px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_20%,transparent_100%)]"></div>
        <div className="absolute -top-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen pointer-events-none animate-pulse duration-10000"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-fuchsia-500/10 blur-[120px] mix-blend-screen pointer-events-none animate-pulse duration-7000"></div>
      </div>
      
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100 z-0 hidden md:block"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              800px circle at ${mouseX}px ${mouseY}px,
              rgba(var(--primary-rgb), 0.08),
              transparent 80%
            )
          `,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Content Area */}
          <motion.div 
            className="flex flex-col text-center lg:text-start lg:col-span-7 z-10"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
            }}
          >
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/40 backdrop-blur-md mb-8 hover:bg-card/60 transition-colors mx-auto lg:mx-0 w-fit shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-muted-foreground">{t('hero_trust', '100% Free • Curated Content • No Distractions')}</span>
            </motion.div>
            
            <motion.h1 
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight mb-6 leading-[1.05]"
            >
              <span className="text-foreground inline-block">{t('hero_title_1', 'Learn Without')}</span><br />
              <span className="text-foreground inline-block">Distractions.</span><br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-fuchsia-500 to-cyan-500 inline-block mt-1">{t('hero_title_2', 'Build Real Skills.')}</span>
            </motion.h1>
            
            <motion.p 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed font-medium"
            >
              {t('hero_subtitle', 'Skilliq is a structured learning platform that organizes the best free YouTube courses into clear paths. Stay focused, save time, and actually finish what you start.')}
            </motion.p>
            
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center lg:justify-start"
            >
              <Link 
                to="/courses" 
                className="group relative px-8 py-4 bg-foreground text-background rounded-full font-bold text-lg hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-3 w-full sm:w-auto overflow-hidden"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-20 bg-gradient-to-b from-transparent via-transparent to-black"></span>
                <span className="relative flex items-center gap-2">{t('start_learning')} <ArrowRight className="w-5 h-5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" /></span>
              </Link>
              
              <Link 
                to="/paths"
                className="px-8 py-4 bg-card border border-border text-foreground hover:bg-muted rounded-full font-bold text-lg transition-all flex items-center justify-center gap-3 w-full sm:w-auto shadow-sm hover:shadow-md"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <Layers className="w-5 h-5 text-fuchsia-500" /> {t('explore_paths')}
              </Link>
            </motion.div>

            <motion.div
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
              className="mt-12 text-center lg:text-start"
            >
              <p className="font-serif select-none italic text-2xl sm:text-3xl text-muted-foreground" style={{ fontFamily: 'var(--font-serif), Georgia, serif', letterSpacing: '-0.02em' }}>
                "Internet For Everyone"
              </p>
              <p className="font-mono text-xs text-primary/80 mt-2 tracking-[0.2em]">— N E X A 1 3 3 7</p>
            </motion.div>
          </motion.div>

          {/* Right Visual Area - Interactive Bento/Cards */}
          <motion.div 
            className="lg:col-span-5 relative hidden md:block"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
          >
            <div className="relative w-full aspect-square">
              {/* Center Element */}
              <motion.div 
                animate={{ y: [-8, 8, -8] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-card/80 backdrop-blur-2xl border border-border/80 rounded-full shadow-2xl flex items-center justify-center z-20"
              >
                <div className="absolute inset-0 rounded-full border border-primary/20 animate-[spin_10s_linear_infinite]"></div>
                <div className="w-24 h-24 bg-gradient-to-tr from-primary to-fuchsia-500 rounded-full blur-xl opacity-40 absolute"></div>
                <PlayCircle className="w-16 h-16 text-foreground relative z-10" />
              </motion.div>

              {/* Floating Card 1 */}
              <motion.div 
                animate={{ y: [10, -10, 10], rotate: [-2, 2, -2] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-[10%] right-[10%] w-44 bg-card border border-border shadow-xl rounded-2xl p-4 z-30 backdrop-blur-xl"
              >
                <div className="flex gap-3 items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                    <Code className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold">Web Dev</div>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full mb-2">
                  <div className="w-[75%] h-full bg-blue-500 rounded-full"></div>
                </div>
                <div className="text-[10px] text-muted-foreground text-right">75% Complete</div>
              </motion.div>

              {/* Floating Card 2 */}
              <motion.div 
                animate={{ y: [-15, 15, -15], rotate: [2, -2, 2] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-[20%] left-[5%] w-48 bg-card border border-border shadow-xl rounded-2xl p-4 z-30 backdrop-blur-xl"
              >
                <div className="flex gap-3 items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold leading-tight">Cybersecurity Masterclass</div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 w-fit px-2 py-1 rounded">
                  <CheckCircle2 className="w-3 h-3" /> Certified
                </div>
              </motion.div>

              {/* Floating Card 3 */}
              <motion.div 
                animate={{ y: [12, -12, 12], x: [-5, 5, -5] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-[10%] right-[5%] w-32 h-32 bg-card border border-border shadow-xl rounded-2xl p-4 z-10 backdrop-blur-xl flex flex-col items-center justify-center text-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-500">
                  <Terminal className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-muted-foreground">AI & ML Path</div>
              </motion.div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const { t } = useTranslation();
  return (
    <section className="py-20 relative overflow-hidden bg-zinc-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-fuchsia-500/20 opacity-30"></div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black mb-4 sm:mb-6 leading-tight">{t('smarter_way', 'A Smarter Way to Learn Online')}</h2>
            <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
              {t('smarter_way_desc', 'Online learning is powerful, but it’s easy to lose focus. Skilliq solves that by organizing high-quality content into structured learning paths.')}
            </p>
            <ul className="space-y-4">
              {[
                { title: t('step_1'), icon: Target },
                { title: t('step_2'), icon: Video },
                { title: t('step_3'), icon: Terminal },
                { title: t('step_4'), icon: Award }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={i} className="flex items-center gap-3 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 backdrop-blur-sm">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{item.title}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-fuchsia-500 blur-2xl opacity-20 rounded-full"></div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative shadow-2xl">
               <div className="flex items-center gap-4 mb-8 pb-8 border-b border-zinc-800">
                  <div className="bg-fuchsia-500/10 text-fuchsia-500 p-3 rounded-2xl">
                    <Layers className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{t('choose_your_path')}</div>
                    <div className="text-zinc-400 text-sm">{t('choose_your_path_desc')}</div>
                  </div>
               </div>
               <div className="space-y-6">
                 <div className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-xl">
                   <span className="text-white font-medium">Cybersecurity</span>
                   <Shield className="w-5 h-5 text-emerald-400" />
                 </div>
                 <div className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-xl">
                   <span className="text-white font-medium">Fullstack Development</span>
                   <Code className="w-5 h-5 text-blue-400" />
                 </div>
                 <div className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-xl">
                   <span className="text-white font-medium">Interior Design</span>
                   <Layout className="w-5 h-5 text-orange-400" />
                 </div>
                 <div className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-xl">
                   <span className="text-white font-medium">Artificial Intelligence</span>
                   <Zap className="w-5 h-5 text-fuchsia-400" />
                 </div>
                 <div className="text-center text-zinc-500 text-sm mt-4 italic">More coming soon</div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ValuePropsSection() {
  const { t } = useTranslation();
  const props = [
    {
      icon: Database,
      title: t('curated_not_created'),
      description: t('curated_desc')
    },
    {
      icon: Code,
      title: 'Playlists & Masterclasses',
      description: (
        <ul className="mt-2 space-y-1 text-sm list-disc pl-4">
          <li>{t('playlists_desc')}</li>
          <li>{t('masterclasses_desc')}</li>
        </ul>
      )
    },
    {
      icon: Award,
      title: t('stay_consistent'),
      description: (
        <>
          <p className="mb-2">{t('stay_consistent_desc')}</p>
          <p className="text-xs text-muted-foreground italic font-semibold">{t('cert_note')}</p>
        </>
      )
    }
  ];

  return (
    <section className="w-full py-20 bg-muted/30 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{t('why_learn', 'Why learn with Skilliq?')}</h2>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <span className="px-4 py-2 bg-background border border-border rounded-full text-sm font-bold text-foreground">✓ {t('no_distractions', 'No distractions')}</span>
            <span className="px-4 py-2 bg-background border border-border rounded-full text-sm font-bold text-foreground">✓ {t('no_random_content', 'No random content')}</span>
            <span className="px-4 py-2 bg-background border border-border rounded-full text-sm font-bold text-foreground">✓ {t('no_paid_barriers', 'No paid barriers')}</span>
            <span className="px-4 py-2 bg-background border border-border rounded-full text-sm font-bold text-foreground">✓ {t('only_structured_learning', 'Only structured learning')}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {props.map((prop, idx) => {
            const Icon = prop.icon;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-card border border-border p-8 rounded-3xl hover:shadow-lg transition-all flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{prop.title}</h3>
                <div className="text-muted-foreground leading-relaxed w-full bg-transparent">{prop.description}</div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  const { t } = useTranslation();
  
  return (
    <section className="w-full py-32 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay opacity-10"></div>
      <div className="max-w-4xl mx-auto px-4 text-center relative z-10 flex flex-col items-center">
        <Award className="w-16 h-16 mb-8 opacity-90" />
        <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">{t('final_cta')}</h2>
        <Link 
          to="/courses" 
          className="mt-8 px-10 py-5 bg-background text-foreground rounded-full font-black text-xl hover:scale-105 transition-transform shadow-2xl flex items-center gap-3"
        >
          {t('enter_nexa')} <ArrowRight className="w-6 h-6" />
        </Link>
      </div>
    </section>
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

  const featuredCourses = filterByLanguage(courses, language).filter(c => !c.isSingleVideo).slice(0, 4);
  const featuredPaths = filterPathsByLanguage(learningPaths, courses, language).slice(0, 2);

  return (
    <div className="w-full">
      <Helmet>
        <title>Skilliq | Free Structured Learning Platform & Masterclasses</title>
        <meta name="description" content="Skilliq offers a premium, distraction-free learning environment. Access curated courses, masterclasses, and guided paths in tech, design, and cybersecurity entirely for free." />
      </Helmet>
      <ModernHero />
      <PartnersSection />

      <ContinueLearningSection />
      
      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 space-y-24">
        
        {/* Featured Paths */}
        <section>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2"><Layout className="w-6 h-6 text-primary" /> {t('featured_learning_paths', 'Featured Learning Paths')}</h2>
              <p className="text-muted-foreground">{t('structured_curriculums', 'Structured curriculums to guide your journey from zero to mastery.')}</p>
            </div>
            <Link to="/paths" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full font-semibold transition-all group w-fit">
              {t('view_all', 'View all')} <Layers className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredPaths.map((path, index) => {
              const Icon = iconMap[path.icon] || Code;
              return (
                <motion.div
                  key={path.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-card border border-border rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row gap-6 hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold mb-3">{path.title}</h3>
                    <p className="text-muted-foreground mb-6 line-clamp-3">{path.description}</p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                      <span className="text-sm font-medium text-foreground bg-muted px-3 py-1 rounded-full">{path.courseIds.length} {t('playlists_in_this_path', 'Playlists')}</span>
                      <Link 
                        to={`/path/${path.id}`}
                        className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 w-fit group"
                      >
                        {t('start_path', 'Start Path')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Featured Courses (Playlists) */}
        <section>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary" /> {t('popular_courses', 'Popular Playlists')}</h2>
              <p className="text-muted-foreground">{t('dive_straight', 'Dive straight into a specific technology or topic.')}</p>
            </div>
            <Link to="/courses" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full font-semibold transition-all group w-fit">
              {t('explore_all', 'View all')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredCourses.slice(0, 4).map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {course.language && (
                    <div className="absolute top-3 end-3 z-10 bg-black/70 backdrop-blur text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                      {course.language}
                    </div>
                  )}
                  {course.thumbnail?.trim() ? (
                    <img 
                      src={course.thumbnail} 
                      alt={course.title} 
                      className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                     <div className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-105 flex items-center justify-center p-4">
                      <span className="text-muted-foreground font-medium text-center">{course.title}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <PlayCircle className="w-16 h-16 text-white" />
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-xl font-semibold mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">{course.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{course.videos.length} {t('videos')}</span>
                    </div>
                  </div>

                  {user ? (
                    <Link 
                      to={`/course/${course.id}`}
                      className="w-full mt-auto py-2.5 bg-foreground text-background rounded-xl font-bold text-center hover:bg-foreground/90 transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
                    >
                      {t('start_learning')}
                    </Link>
                  ) : (
                    <button 
                      onClick={() => setIsAuthModalOpen(true)}
                      className="w-full mt-auto py-2.5 bg-foreground text-background rounded-xl font-bold text-center hover:bg-foreground/90 transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
                    >
                      {t('login_to_start')}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Masterclasses Section */}
        <section>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2"><Video className="w-6 h-6 text-primary" /> {t('masterclasses', 'Masterclasses')}</h2>
              <p className="text-muted-foreground">{t('dive_straight', 'Long-form comprehensive tutorials in a single video')}</p>
            </div>
            <Link to="/masterclasses" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full font-semibold transition-all group w-fit">
              {t('explore_all', 'View all')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filterByLanguage(courses, language).filter(c => c.isSingleVideo).slice(0, 4).map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {course.language && (
                    <div className="absolute top-3 end-3 z-10 bg-black/70 backdrop-blur text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                      {course.language}
                    </div>
                  )}
                  {course.thumbnail?.trim() ? (
                    <img 
                      src={course.thumbnail} 
                      alt={course.title} 
                      className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-105 flex items-center justify-center p-4">
                      <span className="text-muted-foreground font-medium text-center">{course.title}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <PlayCircle className="w-16 h-16 text-white" />
                  </div>
                  <div className="absolute top-3 start-3 flex gap-2">
                    <div className="bg-primary/90 backdrop-blur text-white px-2.5 py-1 rounded-md text-xs font-bold">
                      {t('masterclass', 'Masterclass')}
                    </div>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-xl font-semibold mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">{course.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-1">
                      <Terminal className="w-4 h-4" />
                      <span>{course.videos[0]?.duration || '2h+'}</span>
                    </div>
                  </div>

                  {user ? (
                    <Link 
                      to={`/course/${course.id}`}
                      className="w-full mt-auto py-2.5 bg-foreground text-background rounded-xl font-bold text-center hover:bg-foreground/90 transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
                    >
                      {t('start_learning')}
                    </Link>
                  ) : (
                    <button 
                      onClick={() => setIsAuthModalOpen(true)}
                      className="w-full mt-auto py-2.5 bg-foreground text-background rounded-xl font-bold text-center hover:bg-foreground/90 transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
                    >
                      {t('login_to_start')}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
      <ValuePropsSection />
      <StatsSection />
      <FinalCTA />
    </div>
  );
}
