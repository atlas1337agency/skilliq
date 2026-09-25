import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { X, ExternalLink, Bell } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export function PushNotificationPopup() {
  const { notifications, user } = useStore();
  const [activeNotif, setActiveNotif] = useState<any | null>(null);
  const [sessionSkipped, setSessionSkipped] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // get active notifications
    const active = notifications.filter(n => n.isActive && (!n.targetUserId || (user && n.targetUserId === user.uid)));
    if (active.length === 0) {
      setActiveNotif(null);
      return;
    }

    // Sort by newest
    active.sort((a, b) => b.createdAt - a.createdAt);
    
    // Check local storage for dismissed notifications
    const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
    
    // Find the newest active notification that hasn't been dismissed or skipped in this session
    const newestUnseen = active.find(n => !dismissed.includes(n.id) && !sessionSkipped.includes(n.id));

    if (newestUnseen) {
      setActiveNotif(newestUnseen);
    } else {
      setActiveNotif(null);
    }
  }, [notifications, sessionSkipped, user]);

  const handleDismiss = (dontShowAgain: boolean) => {
    if (!activeNotif) return;

    if (dontShowAgain) {
      const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
      if (!dismissed.includes(activeNotif.id)) dismissed.push(activeNotif.id);
      localStorage.setItem('dismissedNotifications', JSON.stringify(dismissed));
    } else {
      setSessionSkipped(prev => [...prev, activeNotif.id]);
    }
    setActiveNotif(null);
  };

  if (!activeNotif) return null;
  if (!activeNotif.targetUserId && location.pathname !== '/') return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6" dir="auto">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={() => handleDismiss(false)}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-border shadow-2xl relative z-10 flex flex-col no-scrollbar"
        >
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-20" />
          
          <button 
            onClick={() => handleDismiss(false)}
            className="absolute top-4 rtl:start-4 rtl:end-auto end-4 p-2.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors z-30 bg-background/50 backdrop-blur"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
          
          {activeNotif.image && (
            <div className="w-full h-48 sm:h-64 bg-muted relative shrink-0">
              <img src={activeNotif.image} alt={activeNotif.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            </div>
          )}
          
          <div className="p-6 sm:p-8 flex flex-col shrink-0">
            {!activeNotif.image && (
              <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/5 text-primary rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <Bell className="w-7 h-7" />
              </div>
            )}
            
            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${!activeNotif.image ? '' : '-mt-12 relative z-10'}`}>
              {activeNotif.title}
            </h2>
            
            <p className="text-muted-foreground mt-4 text-base sm:text-lg whitespace-pre-wrap leading-relaxed">
              {activeNotif.message}
            </p>
            
            <div className="mt-8 flex flex-col gap-3 w-full">
              {activeNotif.link && (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    if (activeNotif.link.startsWith('/')) {
                      navigate(activeNotif.link);
                    } else {
                      window.location.href = activeNotif.link;
                    }
                    if (activeNotif.title === 'Video Fixed!') {
                      handleDismiss(true);
                    } else {
                      handleDismiss(false);
                    }
                  }}
                  className="w-full bg-primary text-primary-foreground py-3.5 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-md hover:shadow-lg focus:outline-none"
                >
                  {activeNotif.linkLogo && <img src={activeNotif.linkLogo} alt="" className="w-5 h-5 object-contain" />}
                  {activeNotif.title === 'Video Fixed!' ? 'Keep Learning' : 'Learn More'} 
                  {!activeNotif.linkLogo && <ExternalLink className="w-4 h-4 rtl:hidden" />}
                  {!activeNotif.linkLogo && <ExternalLink className="w-4 h-4 hidden rtl:block rotate-180" />}
                </button>
              )}
              
              {activeNotif.links && activeNotif.links.map((link: any, idx: number) => (
                <button 
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    if (link.url.startsWith('/')) {
                      navigate(link.url);
                    } else {
                      window.location.href = link.url;
                    }
                    handleDismiss(false);
                  }}
                  className="w-full bg-secondary text-secondary-foreground py-3.5 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 hover:bg-secondary/80 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-sm focus:outline-none"
                >
                  {link.logo && <img src={link.logo} alt="" className="w-5 h-5 object-contain" />}
                  {link.label} 
                  {!link.logo && <ExternalLink className="w-4 h-4 rtl:hidden" />}
                  {!link.logo && <ExternalLink className="w-4 h-4 hidden rtl:block rotate-180" />}
                </button>
              ))}
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-4">
                <button 
                  onClick={() => handleDismiss(false)}
                  className={`w-full ${activeNotif.title === 'Video Fixed!' ? '' : 'sm:flex-1'} py-3 px-4 rounded-xl font-bold text-center border-2 border-border bg-transparent hover:bg-muted transition-colors text-foreground`}
                >
                  Close
                </button>
                {activeNotif.title !== 'Video Fixed!' && (
                  <button 
                    onClick={() => handleDismiss(true)}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    Don't show me again
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
