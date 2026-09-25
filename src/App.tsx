/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HelmetProvider } from 'react-helmet-async';
import { useStore } from './store/useStore';
import { Layout } from './components/Layout';
import { WhatsNew } from './components/WhatsNew';
import { PushNotificationPopup } from './components/PushNotificationPopup';
import { CustomCursor } from './components/CustomCursor';

import { Home } from './pages/Home';
import { Courses } from './pages/Courses';
import { Paths } from './pages/Paths';
import { Course } from './pages/Course';
import { Dashboard } from './pages/Dashboard';
import { Certificate } from './pages/Certificate';
import { CertificatesList } from './pages/CertificatesList';
import { PathDetails } from './pages/PathDetails';
import { Masterclasses } from './pages/Masterclasses';
import { Verify } from './pages/Verify';
import { Admin } from './pages/Admin';
import { Leaderboard } from './pages/Leaderboard';
import { About } from './pages/About';
import { Copyright } from './pages/Copyright';
import { Contact } from './pages/Contact';
import { Creator } from './pages/Creator';

export default function App() {
  const { loadContent, language } = useStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language || 'en';
  }, [language, i18n]);

  return (
    <HelmetProvider>
      <CustomCursor />
      <Router>
        <WhatsNew />
        <PushNotificationPopup />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="courses" element={<Courses />} />
            <Route path="paths" element={<Paths />} />
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
            <Route path="creator/:creatorId" element={<Creator />} />
          </Route>
          <Route path="/course/:courseId" element={<Course />} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
}
