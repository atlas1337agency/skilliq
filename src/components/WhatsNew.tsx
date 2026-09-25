import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { X, Sparkles, ArrowRight, PlayCircle, Code, Layout } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function WhatsNew() {
  const { allCourses, learningPaths } = useStore();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [newItems, setNewItems] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // Collect all items with createdAt
    const items = [
      ...allCourses.filter(c => c.createdAt && c.isApproved).map(c => ({
        ...c,
        type: c.isSingleVideo ? 'masterclass' : 'course',
      })),
      ...learningPaths.filter(p => p.createdAt).map(p => ({
        ...p,
        type: 'path',
      }))
    ];

    // Sort by newest
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const lastSeen = localStorage.getItem('lastSeenNewsTimestamp');
    const lastTimestamp = lastSeen ? parseInt(lastSeen, 10) : 0;

    const freshItems = items.filter(item => (item.createdAt || 0) > lastTimestamp);

    if (freshItems.length > 0) {
      setNewItems(freshItems);
      setIsOpen(true);
      
      // Update last seen
      const newestTimestamp = freshItems[0].createdAt;
      if (newestTimestamp) {
        localStorage.setItem('lastSeenNewsTimestamp', newestTimestamp.toString());
      }
    }
  }, [allCourses, learningPaths]);

  if (!isOpen) return null;

  const displayItems = showAll ? newItems : newItems.slice(0, 3);
  const hiddenCount = newItems.length - 3;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`bg-card w-full ${showAll ? 'max-w-4xl h-[90vh]' : 'max-w-xl'} rounded-2xl border border-border shadow-2xl relative z-10 overflow-hidden flex flex-col`}
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 rtl:start-4 rtl:end-auto end-4 p-2 hover:bg-muted rounded-full transition-colors z-20"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <div className="p-6 md:p-8 flex flex-col items-center border-b border-border bg-muted/20">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-center">{t('whats_new', "What's New! 🎉")}</h2>
            <p className="text-muted-foreground text-center mt-2 max-w-sm">
              We've added some exciting new content for you to explore. Check out the latest updates below.
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
            {displayItems.map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={item.id} 
                className="flex items-start gap-4 p-4 rounded-xl border border-border bg-background hover:border-primary/50 transition-colors group"
              >
                <div className="w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center relative">
                  {(item.type === 'course' || item.type === 'masterclass') ? (
                    item.thumbnail ? (
                       <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                       <PlayCircle className="w-6 h-6 text-muted-foreground" />
                    )
                  ) : (
                    <Layout className="w-6 h-6 text-primary" />
                  )}
                  <div className="absolute top-1 start-1 bg-primary text-primary-foreground text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shadow-sm">
                    {item.type === 'course' ? 'Playlist' : item.type === 'masterclass' ? 'Masterclass' : 'Path'}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg mb-1 truncate">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                </div>
                
                <Link 
                  to={item.type === 'path' ? `/path/${item.id}` : `/course/${item.id}`}
                  onClick={() => setIsOpen(false)}
                  className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                >
                  <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                </Link>
              </motion.div>
            ))}
          </div>

          {!showAll && hiddenCount > 0 && (
            <div className="p-4 border-t border-border flex justify-center bg-muted/10">
              <button 
                onClick={() => setShowAll(true)}
                className="font-bold text-primary hover:text-primary/80 transition-colors"
              >
                {t('see_more', `See ${hiddenCount} more ${hiddenCount === 1 ? 'item' : 'items'}`)}
              </button>
            </div>
          )}
          
          <div className="p-6 pt-0 mt-auto flex justify-center">
             {!showAll && hiddenCount === 0 && (
               <button 
                  onClick={() => setIsOpen(false)}
                  className="w-full max-w-xs py-3 bg-primary text-primary-foreground rounded-full font-bold shadow hover:bg-primary/90 transition-all"
                >
                  {t('awesome', "Awesome!")}
                </button>
             )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
