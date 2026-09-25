import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, PlayCircle, Map, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { WolfLogo } from './WolfLogo';

export function BottomNav() {
  const { t } = useTranslation();
  const { user } = useStore();

  const links = [
    { to: '/', icon: Home, label: t('home') },
    { to: '/paths', icon: Map, label: t('paths') },
    { to: '/central', isCentral: true },
    { to: '/courses', icon: PlayCircle, label: t('courses') },
    { to: '/masterclasses', icon: BookOpen, label: t('masterclasses') || 'Masterclasses' },
  ];

  return (
    <div className="md:hidden fixed bottom-6 start-4 end-4 z-50 flex justify-center pb-safe pointer-events-none">
      <nav className="flex h-14 w-full max-w-sm items-center justify-between rounded-full border border-border/50 bg-background/70 backdrop-blur-xl px-2 sm:px-4 shadow-2xl pointer-events-auto shadow-black/10 dark:shadow-black/40">
        {links.map((link, index) => {
          if (link.isCentral) {
            return (
              <div key="central" className="relative -top-5 flex-shrink-0 mx-1 sm:mx-2">
                <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse z-0" />
                <div className="relative z-10 w-12 h-12 bg-gradient-to-tr from-card to-background border-[3px] border-border rounded-full p-2 shadow-xl flex items-center justify-center group overflow-hidden">
                  <WolfLogo />
                </div>
              </div>
            );
          }

          return (
            <NavLink
              key={index}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center p-1 sm:p-2 rounded-xl transition-all duration-75 w-12 sm:w-14",
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )
              }
            >
              {link.icon && <link.icon className="h-4 w-4 md:h-5 md:w-5 mb-0.5" />}
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight truncate w-full text-center">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
