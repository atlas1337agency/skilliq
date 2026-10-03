import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop: Automatically scrolls the window and all scrollable containers
 * to the top upon route changes and link clicks.
 */
export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Scroll window, html, and body immediately to top on route change
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // In case main or another layout container has its own scrollbar
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    const appEl = document.getElementById('root');
    if (appEl) {
      appEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname, search]);

  useEffect(() => {
    const handleGlobalLinkClick = (event: MouseEvent) => {
      // Find closest anchor tag
      const target = (event.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      // If it's an internal link (starts with / or # or relative, not target="_blank" or external http)
      if (href && !href.startsWith('http') && !href.startsWith('mailto:') && target.target !== '_blank') {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        const mainEl = document.querySelector('main');
        if (mainEl) {
          mainEl.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }
      }
    };

    document.addEventListener('click', handleGlobalLinkClick, { passive: true });
    return () => {
      document.removeEventListener('click', handleGlobalLinkClick);
    };
  }, []);

  return null;
}
