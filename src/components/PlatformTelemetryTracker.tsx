import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  getOrCreateVisitorId,
  detectDeviceType,
  detectBrowserName,
  getLocalTelemetryStats,
  saveLocalTelemetryStats,
  checkAndIncrementVisitSession,
  resolvePageLabel,
  syncUserPresence,
  recordPlatformMovement,
  UserPresenceRecord,
} from '../lib/telemetry';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    __gaLoadedId?: string;
  }
}

export function injectAndConfigureGtag(measurementId: string) {
  const cleanId = (measurementId || '').trim();
  if (!cleanId || !cleanId.startsWith('G-') || typeof window === 'undefined') return;

  localStorage.setItem('skilliq_ga_measurement_id', cleanId);

  if (window.__gaLoadedId === cleanId) return;
  window.__gaLoadedId = cleanId;

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer!.push(args);
  }
  window.gtag = window.gtag || gtag;
  window.gtag('js', new Date());
  window.gtag('config', cleanId, {
    send_page_view: true,
  });

  const existingScript = document.querySelector(
    `script[src*="googletagmanager.com/gtag/js"]`
  );
  if (!existingScript) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cleanId)}`;
    document.head.appendChild(script);
  }
}

export function PlatformTelemetryTracker() {
  const location = useLocation();
  const { user, allCourses, allBooks, learningPaths } = useStore();

  const sessionSecondsRef = useRef<number>(0);
  const lastLoggedPathRef = useRef<string>('');
  const lastSyncTimeRef = useRef<number>(0);
  const [gaMeasurementId, setGaMeasurementId] = useState<string>(() => {
    try {
      return localStorage.getItem('skilliq_ga_measurement_id') || 'G-VHQYB5FFPQ';
    } catch {
      return 'G-VHQYB5FFPQ';
    }
  });

  // Load GA4 Measurement ID from backend config if set
  useEffect(() => {
    fetch('/api/analytics/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (cfg?.measurementId && cfg.measurementId.startsWith('G-')) {
          setGaMeasurementId(cfg.measurementId);
          injectAndConfigureGtag(cfg.measurementId);
        } else if (gaMeasurementId && gaMeasurementId.startsWith('G-')) {
          injectAndConfigureGtag(gaMeasurementId);
        }
      })
      .catch(() => {
        if (gaMeasurementId && gaMeasurementId.startsWith('G-')) {
          injectAndConfigureGtag(gaMeasurementId);
        }
      });
  }, []);

  const buildAndSyncPresence = (forcePath?: string) => {
    const pathname = forcePath || location.pathname;
    const stats = getLocalTelemetryStats();
    const visitorId = getOrCreateVisitorId(user?.uid);
    const pageLabel = resolvePageLabel(pathname, allCourses, allBooks, learningPaths);

    const record: UserPresenceRecord = {
      id: visitorId,
      uid: user?.uid || null,
      isGuest: !user?.uid,
      displayName: user?.displayName || (user?.email ? user.email.split('@')[0] : 'Guest Visitor'),
      email: user?.email || '',
      photoURL: user?.photoURL || '',
      currentPath: pathname,
      currentPageLabel: pageLabel,
      deviceType: detectDeviceType(),
      browser: detectBrowserName(),
      totalSecondsSpent: stats.totalSecondsSpent,
      sessionSecondsSpent: sessionSecondsRef.current,
      visitCount: stats.visitCount,
      pagesVisitedCount: stats.pagesVisitedCount,
      firstVisitAt: stats.firstVisitAt,
      lastSeenAt: Date.now(),
      recentTrail: stats.recentTrail.slice(0, 15),
    };

    lastSyncTimeRef.current = Date.now();
    syncUserPresence(record);
  };

  // 1. Check session start once on mount
  useEffect(() => {
    const isNewSession = checkAndIncrementVisitSession();
    if (isNewSession) {
      const pageLabel = resolvePageLabel(location.pathname, allCourses, allBooks, learningPaths);
      recordPlatformMovement({
        uid: user?.uid || null,
        userName: user?.displayName || (user?.email ? user.email.split('@')[0] : 'Guest Visitor'),
        userEmail: user?.email || '',
        userAvatar: user?.photoURL || '',
        actionType: 'session_start',
        path: location.pathname,
        pageTitle: pageLabel,
        detail: `Started a new platform visit on ${pageLabel}`,
      });
    }
  }, []);

  // 2. Track every real route navigation & page movement + fire GA4 page_view
  useEffect(() => {
    const pathname = location.pathname;
    if (lastLoggedPathRef.current === pathname) return;
    lastLoggedPathRef.current = pathname;

    const pageLabel = resolvePageLabel(pathname, allCourses, allBooks, learningPaths);
    const stats = getLocalTelemetryStats();
    stats.pagesVisitedCount = (stats.pagesVisitedCount || 0) + 1;

    const newTrailItem = {
      path: pathname,
      label: pageLabel,
      timestamp: Date.now(),
    };

    const existingTrail = Array.isArray(stats.recentTrail) ? stats.recentTrail : [];
    if (existingTrail.length === 0 || existingTrail[0].path !== pathname) {
      stats.recentTrail = [newTrailItem, ...existingTrail].slice(0, 15);
    }

    saveLocalTelemetryStats(stats);
    buildAndSyncPresence(pathname);

    // Send real page_view to Google Analytics 4 if gtag is active
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: pathname,
        page_title: pageLabel,
        page_location: window.location.href,
      });
    }

    const isCourse = pathname.startsWith('/course/');
    recordPlatformMovement({
      uid: user?.uid || null,
      userName: user?.displayName || (user?.email ? user.email.split('@')[0] : 'Guest Visitor'),
      userEmail: user?.email || '',
      userAvatar: user?.photoURL || '',
      actionType: isCourse ? 'course_view' : 'page_view',
      path: pathname,
      pageTitle: pageLabel,
      detail: isCourse
        ? `Opened course player: ${pageLabel.replace('Watching Course: ', '')}`
        : `Navigated to ${pageLabel} (${pathname})`,
    });
  }, [location.pathname, user?.uid, allCourses.length]);

  // 3. Active 1-second timer (only counts time when browser tab is visible) + 15s live heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      sessionSecondsRef.current += 1;
      const stats = getLocalTelemetryStats();
      stats.totalSecondsSpent = (stats.totalSecondsSpent || 0) + 1;
      saveLocalTelemetryStats(stats);

      if (Date.now() - lastSyncTimeRef.current >= 15000) {
        buildAndSyncPresence();
      }
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        buildAndSyncPresence();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname, user?.uid, allCourses.length]);

  return null;
}
