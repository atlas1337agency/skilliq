import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PlayCircle, Youtube, BookOpen, ChevronLeft, Award, BadgeCheck, Layout, Search, X, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useMemo, useState } from 'react';
import { cn } from '../lib/utils';

export function Creator() {
  const { creatorId } = useParams<{ creatorId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { courses, language } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const decodedCreatorId = creatorId ? decodeURIComponent(creatorId) : '';

  const creatorCourses = useMemo(() => {
    return courses.filter(
      c => c.instructor?.toLowerCase().trim() === decodedCreatorId.toLowerCase().trim()
    );
  }, [courses, decodedCreatorId]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    creatorCourses.forEach(c => {
      if (c.category) cats.add(c.category);
    });
    return ["All", ...Array.from(cats)];
  }, [creatorCourses]);

  const filteredCourses = useMemo(() => {
    return creatorCourses.filter(c => {
      const matchCat = selectedCategory === "All" || c.category === selectedCategory;
      const matchQuery = !searchQuery || 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [creatorCourses, selectedCategory, searchQuery]);

  const playlists = filteredCourses.filter(c => !c.isSingleVideo);
  const masterclasses = filteredCourses.filter(c => c.isSingleVideo);

  const creatorAvatar = creatorCourses[0]?.instructorAvatar?.trim() || '';

  if (!decodedCreatorId || creatorCourses.length === 0) {
    return (
      <div className="w-full px-4 md:px-8 py-20 text-center min-h-[70vh] flex flex-col items-center justify-center">
        <Youtube className="w-16 h-16 text-muted-foreground opacity-20 mb-4" />
        <h2 className="text-2xl font-bold mb-4">{t('creator_not_found', 'Creator Not Found')}</h2>
        <p className="text-muted-foreground mb-6">We couldn't find any content for this creator.</p>
        <Link 
          to="/courses"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold shadow hover:bg-primary/90 transition-all active:scale-95 inline-block"
        >
          {t('browse_entire_catalog', 'Browse All Courses')}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 py-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium">
          <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          {t('back', 'Back')}
        </button>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden p-2 border border-border rounded-xl bg-card text-foreground"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 relative">
        {/* Filter Sidebar */}
        <AnimatePresence>
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: window.innerWidth >= 1024 ? 320 : '100%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="shrink-0 flex flex-col gap-6"
            >
              <div className="sticky top-24 bg-card border border-border p-5 rounded-3xl shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" /> {t('filters', 'Filters')}
                </h2>
                
                <div className="relative w-full mb-8">
                  <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    placeholder={t('search_courses', 'Search...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full ps-10 pe-10 py-3 border border-border rounded-2xl bg-background text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:font-normal"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 end-0 pe-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div>
                  <h3 className="text-xs uppercase font-extrabold text-muted-foreground mb-4 tracking-widest ps-2">{t('categories', 'Categories')}</h3>
                  <div className="flex flex-col gap-1.5">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={cn(
                          "text-start px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-75 flex justify-between items-center group",
                          selectedCategory === category 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {category === 'All' ? t('all', 'All') : category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="flex-1 min-w-0">
          {/* Header section */}
          <div className="mb-12 bg-card rounded-3xl border border-border overflow-hidden shadow-sm relative">
            <div className="h-32 md:h-48 bg-primary/10 w-full absolute top-0 start-0 z-0 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-primary/20 via-purple-500/10 to-primary/5"></div>
            </div>
            <div className="relative z-10 px-6 py-8 md:px-12 md:py-12 mt-12 md:mt-24 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
              {creatorAvatar ? (
                <img 
                  src={creatorAvatar} 
                  alt={decodedCreatorId} 
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background shadow-xl shrink-0 object-cover bg-background"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background shadow-xl shrink-0 bg-muted flex items-center justify-center">
                  <Youtube className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground opacity-50" />
                </div>
              )}
              <div className="flex-1 text-center md:text-start pb-4">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2 flex items-center justify-center md:justify-start gap-3">
                  {decodedCreatorId}
                  <BadgeCheck className="w-8 h-8 text-blue-500 shrink-0" />
                </h1>
                <p className="text-muted-foreground text-lg font-medium">{t('original_creator', 'Original Creator')}</p>
              </div>
            </div>
          </div>

          {filteredCourses.length === 0 && (
            <div className="w-full py-20 text-center flex flex-col items-center justify-center bg-card rounded-3xl border border-dashed border-border">
              <Youtube className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-xl font-bold mb-2">No courses found matching criteria</h3>
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="mt-4 px-6 py-2 bg-primary/10 text-primary font-bold rounded-full hover:bg-primary/20 transition-all"
              >
                Clear Filters
              </button>
            </div>
          )}

      {playlists.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Layout className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold">{t('playlists', 'Playlists')} ({playlists.length})</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {playlists.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-75 hover:-translate-y-1.5"
              >
                <Link to={`/course/${course.id}`} className="block relative aspect-video overflow-hidden bg-muted">
                  {course.language && (
                    <div className="absolute top-3 end-3 z-10 bg-black/70 backdrop-blur text-white px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-widest shadow-sm">
                      {course.language}
                    </div>
                  )}
                  {course.thumbnail?.trim() ? (
                    <img 
                      src={course.thumbnail} 
                      alt={course.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 flex items-center justify-center p-4">
                      <span className="text-muted-foreground font-medium text-center">{course.title}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-75 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="w-16 h-16 bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center shadow-2xl ps-1 text-white scale-90 group-hover:scale-100 transition-transform duration-75">
                      <PlayCircle className="w-10 h-10" />
                    </div>
                  </div>
                </Link>
                <div className="p-5 flex flex-col flex-1">
                  <Link to={`/course/${course.id}`} className="block mb-2 group-hover:text-primary transition-colors">
                    <h3 className="text-lg font-bold line-clamp-2 leading-tight">{course.title}</h3>
                  </Link>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1 leading-relaxed">{course.description}</p>
                  
                  <div className="flex items-center text-sm text-muted-foreground mt-auto bg-muted/30 p-2.5 rounded-lg border border-border/50">
                    <BookOpen className="w-4 h-4 mr-2" />
                    <span className="font-semibold">{course.videos.length} {t('videos', 'Videos')}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {masterclasses.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Award className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold">{t('masterclasses', 'Masterclasses')} ({masterclasses.length})</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {masterclasses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-75 hover:-translate-y-1.5"
              >
                <Link to={`/course/${course.id}`} className="block relative aspect-video overflow-hidden bg-muted">
                  {course.language && (
                    <div className="absolute top-3 end-3 z-10 bg-black/70 backdrop-blur text-white px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-widest shadow-sm">
                      {course.language}
                    </div>
                  )}
                  {course.thumbnail?.trim() ? (
                    <img 
                      src={course.thumbnail} 
                      alt={course.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 flex items-center justify-center p-4">
                      <span className="text-muted-foreground font-medium text-center">{course.title}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-75 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="w-16 h-16 bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center shadow-2xl ps-1 text-white scale-90 group-hover:scale-100 transition-transform duration-75">
                      <PlayCircle className="w-10 h-10" />
                    </div>
                  </div>
                </Link>
                <div className="p-5 flex flex-col flex-1">
                  <Link to={`/course/${course.id}`} className="block mb-2 group-hover:text-primary transition-colors">
                    <h3 className="text-lg font-bold line-clamp-2 leading-tight">{course.title}</h3>
                  </Link>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1 leading-relaxed">{course.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
        </div>
      </div>
    </div>
  );
}
