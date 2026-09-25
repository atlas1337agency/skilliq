import { Link } from 'react-router-dom';
import { Code, Terminal, Layout, Database, Shield, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore';
import { useState, useMemo } from 'react';
import { cn, filterPathsByLanguage } from '../lib/utils';
import { useTranslation } from 'react-i18next';

const iconMap: Record<string, any> = {
  Code,
  Terminal,
  Layout,
  Database,
  Shield
};

export function Paths() {
  const { t } = useTranslation();
  const { learningPaths, courses, language } = useStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 6;

  const filteredPaths = useMemo(() => {
    return filterPathsByLanguage(learningPaths, courses, language).filter(path => {
      if (!searchQuery) return true;
      const lowerQuery = searchQuery.toLowerCase();
      return path.title.toLowerCase().includes(lowerQuery) || 
             path.description.toLowerCase().includes(lowerQuery);
    });
  }, [learningPaths, courses, language, searchQuery]);

  const totalPages = Math.ceil(filteredPaths.length / itemsPerPage);
  
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPaths.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPaths, currentPage]);

  return (
    <div className="w-full px-4 md:px-8 py-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">{t('learning_paths')}</h1>
        <p className="text-muted-foreground text-lg">{t('structured_curriculums_expert')}</p>
      </div>

      <div className="mb-8">
        <div className="relative w-full max-w-2xl">
          <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder={t('search_paths') || 'Search learning paths...'}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full ps-11 pe-10 py-3.5 border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium placeholder:font-normal shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute inset-y-0 end-0 pe-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {currentItems.map((path, index) => {
          const Icon = iconMap[path.icon] || Code;
          return (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row gap-6 hover:shadow-xl transition-all duration-75 hover:-translate-y-1"
            >
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 flex flex-col">
                <h3 className="text-xl font-bold mb-2">{path.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">{path.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-sm font-medium text-foreground">{path.courseIds.length} {t('playlists_in_this_path').split(' ')[0]}</span>
                  <Link 
                    to={`/path/${path.id}`}
                    className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-lg"
                  >
                    {t('view_all')} &rarr;
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredPaths.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-card border border-dashed border-border rounded-3xl">
            <Layout className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2">No learning paths found</h3>
            <p className="text-muted-foreground">Try clearing your search query.</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="mt-6 px-6 py-2 bg-primary/10 text-primary font-semibold rounded-full hover:bg-primary/20 transition-colors"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-full border border-border bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-10 h-10 rounded-full text-sm font-bold flex items-center justify-center transition-all",
                  currentPage === page 
                    ? "bg-primary text-primary-foreground shadow-md scale-110" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-full border border-border bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5 rtl:rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}
