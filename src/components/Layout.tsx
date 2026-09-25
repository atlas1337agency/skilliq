import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { cn } from '../lib/utils';
import { Footer } from './Footer';

export function Layout() {
  const location = useLocation();
  const isCoursePage = location.pathname.includes('/course/');

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {!isCoursePage && <Header />}
      <div className="flex flex-1 overflow-hidden">
        <main className={cn("flex-1 overflow-y-auto flex flex-col", !isCoursePage && "pb-20 md:pb-0")}>
          <div className="flex-1">
            <Outlet />
          </div>
          {!isCoursePage && <Footer />}
        </main>
      </div>
      {!isCoursePage && <BottomNav />}
    </div>
  );
}
