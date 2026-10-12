/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { HelmetProvider } from 'react-helmet-async';
import { useStore } from './store/useStore';
import { Layout } from './components/Layout';
import { WhatsNew } from './components/WhatsNew';
import { PushNotificationPopup } from './components/PushNotificationPopup';
import { AuthFeedbackToast } from './components/AuthFeedbackToast';
import { ScrollToTop } from './components/ScrollToTop';
import { GlobalFocusTimerPopup } from './components/GlobalFocusTimerPopup';

// Eagerly load primary discovery pages for zero-latency navigation
import { Home } from './pages/Home';
import { Courses } from './pages/Courses';
import { Books } from './pages/Books';
import { Paths } from './pages/Paths';
import { Projects } from './pages/Projects';
import { Masterclasses } from './pages/Masterclasses';
import { PathDetails } from './pages/PathDetails';
import { About } from './pages/About';
import { Copyright } from './pages/Copyright';
import { Contact } from './pages/Contact';

// Lazy load heavy interactive pages and pre-warm them in the background right after mount
const Course = lazy(() => import('./pages/Course').then(m => ({ default: m.Course })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Certificate = lazy(() => import('./pages/Certificate').then(m => ({ default: m.Certificate })));
const CertificatesList = lazy(() => import('./pages/CertificatesList').then(m => ({ default: m.CertificatesList })));
const Verify = lazy(() => import('./pages/Verify').then(m => ({ default: m.Verify })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const Leaderboard = lazy(() => import('./pages/Leaderboard').then(m => ({ default: m.Leaderboard })));
const Creator = lazy(() => import('./pages/Creator').then(m => ({ default: m.Creator })));
const Community = lazy(() => import('./pages/Community').then(m => ({ default: m.Community })));
const SupportTickets = lazy(() => import('./pages/SupportTickets').then(m => ({ default: m.SupportTickets })));

export default function App() {
  const { loadContent, language } = useStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    loadContent();
    // Pre-warm lazy route modules in the background so navigating to any page is instant
    const timer = setTimeout(() => {
      import('./pages/Course');
      import('./pages/Dashboard');
      import('./pages/Community');
      import('./pages/Leaderboard');
      import('./pages/CertificatesList');
      import('./pages/Certificate');
      import('./pages/Verify');
      import('./pages/Creator');
      import('./pages/SupportTickets');
      import('./pages/Admin');
    }, 150);
    return () => clearTimeout(timer);
  }, [loadContent]);

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language || 'en';
  }, [language, i18n]);

  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <GlobalFocusTimerPopup />
        <AuthFeedbackToast />
        <WhatsNew />
        <PushNotificationPopup />
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="courses" element={<Courses />} />
              <Route path="books" element={<Books />} />
              <Route path="paths" element={<Paths />} />
              <Route path="projects" element={<Projects />} />
              <Route path="project" element={<Projects />} />
              <Route path="masterclasses" element={<Masterclasses />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="certificates" element={<CertificatesList />} />
              <Route path="certificate/:courseId" element={<Certificate />} />
              <Route path="path/:pathId" element={<PathDetails />} />
              <Route path="verify" element={<Verify />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="admin" element={<Admin />} />
              <Route path="about" element={<About />} />
              <Route path="copyright" element={<Copyright />} />
              <Route path="contact" element={<Contact />} />
              <Route path="creator" element={<Creator />} />
              <Route path="creator/:creatorId" element={<Creator />} />
              <Route path="community" element={<Community />} />
              <Route path="community/:postId" element={<Community />} />
              <Route path="support" element={<SupportTickets />} />
            </Route>
            <Route path="/course/:courseId" element={<Course />} />
          </Routes>
        </Suspense>
      </Router>
    </HelmetProvider>
  );
}
