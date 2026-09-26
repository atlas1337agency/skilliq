import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

export function ScrollToTopButton() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll position from window or main container
      const winScroll = window.scrollY || document.documentElement.scrollTop;
      const mainEl = document.querySelector('main');
      const mainScroll = mainEl ? mainEl.scrollTop : 0;
      const currentScroll = Math.max(winScroll, mainScroll);

      // Height calculations for progress
      const winHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const mainHeight = mainEl ? mainEl.scrollHeight - mainEl.clientHeight : 0;
      const maxScroll = Math.max(winHeight, mainHeight, 1);

      const progress = Math.min(Math.max((currentScroll / maxScroll) * 100, 0), 100);
      setScrollProgress(progress);

      // Show button after scrolling down 300px
      if (currentScroll > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Circular progress calculations
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.7, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 15 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.2 }}
          aria-label={t('footer_scroll_top', 'Back to top')}
          title={t('footer_scroll_top', 'Back to top')}
          className="fixed bottom-22 md:bottom-8 end-5 md:end-8 z-40 w-12 h-12 rounded-full bg-card/85 hover:bg-card text-foreground backdrop-blur-md border border-border/80 shadow-lg hover:shadow-xl flex items-center justify-center cursor-pointer group transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary/50"
        >
          {/* Subtle Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5">
            <circle
              cx="22"
              cy="22"
              r={radius}
              stroke="currentColor"
              strokeWidth="2.5"
              fill="transparent"
              className="text-border/40"
            />
            <circle
              cx="22"
              cy="22"
              r={radius}
              stroke="currentColor"
              strokeWidth="2.5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-primary transition-all duration-100 ease-out"
            />
          </svg>

          {/* Up Arrow Icon */}
          <ChevronUp className="w-5 h-5 text-foreground group-hover:text-primary group-hover:-translate-y-0.5 transition-all duration-200 relative z-10" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
