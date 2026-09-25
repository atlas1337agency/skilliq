import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, BookOpen, Award, LayoutDashboard } from 'lucide-react';
import { cn } from '../lib/utils';

export function Sidebar() {
  const { t } = useTranslation();

  const links = [
    { to: '/', icon: Home, label: t('home') },
    { to: '/masterclasses', icon: BookOpen, label: t('masterclasses') || 'Masterclasses' },
    { to: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/certificates', icon: Award, label: t('certificates') },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col border-e border-border bg-card h-[calc(100vh-4rem)] sticky top-16">
      <nav className="flex-1 space-y-2 p-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-muted",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
