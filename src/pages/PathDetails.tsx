import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, BookOpen, Shield, Code, Terminal, Layout, Database } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { filterByLanguage } from '../lib/utils';
import { ScrollingText } from '../components/ScrollingText';

const iconMap: Record<string, any> = {
  Code,
  Terminal,
  Layout,
  Database,
  Shield
};

export function PathDetails() {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, courses, learningPaths, setIsAuthModalOpen, language } = useStore();

  const path = learningPaths.find(p => p.id === pathId);

  if (!path) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <h2 className="text-2xl font-bold mb-4">{t('no_paths_found')}</h2>
        <Link to="/" className="text-primary hover:underline">{t('back_to_dashboard')}</Link>
      </div>
    );
  }

  const pathCourses = filterByLanguage(path.courseIds.map(id => courses.find(c => c.id === id)).filter((c): c is any => Boolean(c)), language);
  const Icon = iconMap[path.icon] || Code;

  return (
    <div className="w-full px-4 md:px-8 py-8 max-w-7xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        {t('back', 'Back')}
      </button>

      {/* Path Header */}
      <div className="mb-12 bg-card border border-border rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 end-0 p-12 opacity-5 pointer-events-none">
          <Icon className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">{path.title}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">{path.description}</p>
          <div className="mt-8 inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-semibold text-sm">
            <BookOpen className="w-4 h-4" />
            {pathCourses.length} {t('playlists_in_this_path')}
          </div>
        </div>
      </div>

      {/* Path Curriculum */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold tracking-tight">{t('path_curriculum')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pathCourses.map((course, index) => {
            if (!course) return null;
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 relative"
              >
                {/* Step Number Badge */}
                <div className="absolute top-4 start-4 bg-background/95 backdrop-blur-md text-foreground border border-border/50 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest z-20 shadow-xl flex items-center justify-center min-w-[70px]">
                  {t('step', 'Step')} {index + 1}
                </div>

                <div className="relative aspect-video overflow-hidden bg-muted">
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
                  <div className="absolute top-3 end-3 flex gap-2">
                    {course.language && (
                      <div className="bg-amber-500/90 backdrop-blur text-white px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                        {course.language}
                      </div>
                    )}
                    <div className="bg-background/90 backdrop-blur text-foreground px-2.5 py-1 rounded-md text-xs font-semibold">
                      {course.category}
                    </div>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1 pt-6">
                  <h3 className="text-xl font-semibold mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">{course.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{course.videos.length} {t('videos')}</span>
                    </div>
                    <div className="flex items-center gap-1 max-w-[50%]">
                      <ScrollingText className="font-medium text-foreground">{course.instructor}</ScrollingText>
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
