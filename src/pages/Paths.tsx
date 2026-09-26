import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Code, 
  Terminal, 
  Layout, 
  Database, 
  Shield, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  X, 
  Sparkles, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Zap, 
  Compass,
  BookOpen
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore';
import { cn, filterPathsByLanguage } from '../lib/utils';
import { useTranslation } from 'react-i18next';

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

export function Paths() {
  const { t, i18n } = useTranslation();
  const { learningPaths, courses, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const itemsPerPage = 6;

  // Language filtered paths
  const availablePaths = useMemo(() => {
    return filterPathsByLanguage(learningPaths, courses, language);
  }, [learningPaths, courses, language]);

  // Search & category filtered paths
  const filteredPaths = useMemo(() => {
    return availablePaths.filter(path => {
      // Category filter
      if (selectedCategory !== 'all') {
        const pathCourses = path.courseIds.map(id => courses.find(c => c.id === id)).filter(Boolean);
        const matchesCategory = pathCourses.some(c => 
          (c?.category || '').toLowerCase() === selectedCategory.toLowerCase()
        );
        if (!matchesCategory) return false;
      }

      // Search query
      if (!searchQuery) return true;
      const lowerQuery = searchQuery.toLowerCase();
      const inTitle = path.title.toLowerCase().includes(lowerQuery);
      const inDesc = path.description.toLowerCase().includes(lowerQuery);
      
      // Also search course titles inside the path
      const pathCourses = path.courseIds.map(id => courses.find(c => c.id === id)).filter(Boolean);
      const inCourses = pathCourses.some(c => c?.title?.toLowerCase().includes(lowerQuery));

      return inTitle || inDesc || inCourses;
    });
  }, [availablePaths, courses, searchQuery, selectedCategory]);

  const totalPages = Math.ceil(filteredPaths.length / itemsPerPage);
  
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPaths.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPaths, currentPage]);

  // Aggregate stats
  const totalCoursesInPaths = useMemo(() => {
    const ids = new Set<string>();
    availablePaths.forEach(p => p.courseIds.forEach(id => ids.add(id)));
    return ids.size;
  }, [availablePaths]);

  // Category filter tabs
  const categoryFilters = [
    { id: 'all', label: t('paths_filter_all', 'All Tracks') },
    { id: 'Web Development', label: t('category_Web_Development', 'Web Development') },
    { id: 'Cyber Security', label: t('category_Cyber_Security', 'Cyber Security') },
    { id: 'Programming', label: t('category_Programming', 'Programming') },
    { id: 'Design', label: t('category_Design', 'Design & 3D') },
    { id: 'AI', label: t('category_AI', 'AI & Automation') }
  ];

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto transition-colors"
    >
      {/* HERO SECTION */}
      <div className="relative mb-10 sm:mb-12 overflow-hidden rounded-3xl p-6 sm:p-10 md:p-12 bg-gradient-to-br from-card via-card/90 to-primary/5 border border-border shadow-sm">
        
        {/* Soft background ambient blur */}
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-4 sm:mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('curated_roadmaps_badge', 'Career-Ready Roadmaps')}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight mb-4">
            {t('paths_hero_title', 'Structured Learning Paths')}
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8">
            {t('paths_hero_desc', 'Step-by-step sequential curriculums engineered to take you from foundational basics to job-ready capability without wasted time or ads.')}
          </p>

          {/* Value props pills */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium text-foreground">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 border border-border shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('footer_free_always', '100% Free Forever')}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 border border-border shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              <span>{isRtl ? 'تسلسل تعليمي موجه' : 'Sequential Curriculum'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 border border-border shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>{t('paths_stat_certs', 'Verifiable Certificates')}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="mt-8 pt-6 border-t border-border/60 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">{availablePaths.length}</div>
            <div className="text-xs text-muted-foreground font-medium">{t('paths_stat_tracks', 'Curated Paths')}</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">{totalCoursesInPaths}</div>
            <div className="text-xs text-muted-foreground font-medium">{t('paths_stat_courses', 'Sequential Playlists')}</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="text-2xl sm:text-3xl font-black text-emerald-500">100%</div>
            <div className="text-xs text-muted-foreground font-medium">{isRtl ? 'مجاني بدون اشتراكات' : 'Free & Unlocked'}</div>
          </div>
        </div>

      </div>

      {/* SEARCH AND CATEGORY FILTER BAR */}
      <div className="space-y-4 mb-8 sm:mb-10">
        
        {/* Search Input */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder={t('paths_search_placeholder', 'Search paths by title, skills, or stack...')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full ps-11 pe-12 py-3.5 sm:py-4 border border-border/80 rounded-2xl bg-card text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium placeholder:font-normal placeholder:text-muted-foreground/70 shadow-sm text-sm sm:text-base"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute inset-y-0 end-0 pe-4 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Category Pills & Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          
          {/* Scrollable Category Chips */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categoryFilters.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border",
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card text-muted-foreground hover:text-foreground border-border/70 hover:bg-muted/50"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Results count */}
          <div className="text-xs font-semibold text-muted-foreground shrink-0 text-start">
            <span>{t('paths_showing_count', { count: filteredPaths.length, defaultValue: `Showing ${filteredPaths.length} curated paths` })}</span>
          </div>

        </div>

      </div>

      {/* PATH CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12">
        {currentItems.map((path, index) => {
          const Icon = iconMap[path.icon] || Code;
          const style = pathColorMap[path.icon] || pathColorMap.Code;
          
          // Resolve sequential courses in path
          const pathCourses = path.courseIds
            .map(id => courses.find(c => c.id === id))
            .filter((c): c is any => Boolean(c));

          return (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
              className={`group relative bg-card border border-border/80 rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:shadow-xl transition-all duration-200 hover:-translate-y-1 ${style.border} overflow-hidden text-start`}
            >
              {/* Top ambient card glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-40 pointer-events-none group-hover:opacity-100 transition-opacity`} />

              <div className="relative z-10">
                
                {/* Header row: Icon, Badge, Course count */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className={`w-13 h-13 rounded-2xl ${style.bg} ${style.text} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
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
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-2">
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
                        <div key={c.id || cIdx} className="flex items-center gap-2.5 text-xs text-foreground/90">
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

        {/* Empty State */}
        {filteredPaths.length === 0 && (
          <div className="col-span-full py-16 sm:py-20 px-4 flex flex-col items-center justify-center text-center bg-card border border-dashed border-border/80 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
              <Compass className="w-8 h-8 opacity-40" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {t('no_paths_found', 'No learning paths found')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
              {isRtl ? 'جرب البحث بكلمة مختلفة أو اختر مجالاً آخر.' : 'Try adjusting your search query or selecting a different category filter.'}
            </p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all text-xs sm:text-sm shadow-sm cursor-pointer"
            >
              {t('clear_filters', 'Reset Filters')}
            </button>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 pt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </button>
          
          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-10 h-10 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center transition-all cursor-pointer",
                  currentPage === page 
                    ? "bg-primary text-primary-foreground shadow-sm scale-105" 
                    : "bg-card border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5 rtl:rotate-180" />
          </button>
        </div>
      )}

    </div>
  );
}
