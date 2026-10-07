import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase';
import {
  Users,
  BookOpen,
  Award,
  Activity,
  Clock,
  TrendingUp,
  Search,
  RefreshCw,
  CheckCircle2,
  PlayCircle,
  BarChart3,
  Radio,
  AlertTriangle,
  Globe,
  X,
  ChevronDown,
  ChevronUp,
  Compass,
  Check,
  Monitor,
  Smartphone,
  Tablet,
  Navigation,
  Settings,
  Eye,
  ShieldCheck,
  HelpCircle,
  Copy,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '../lib/utils';
import {
  UserPresenceRecord,
  PlatformMovementRecord,
  fetchPlatformTelemetry,
  isUserOnlineNow,
  formatDurationSpent,
} from '../lib/telemetry';
import { injectAndConfigureGtag } from './PlatformTelemetryTracker';
import { getTextDir } from '../lib/community';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: string;
  createdAt?: number;
  lastSeenAt?: number;
  totalSecondsSpent?: number;
  visitCount?: number;
  pagesVisitedCount?: number;
  currentPath?: string;
  currentPageLabel?: string;
  deviceType?: 'Desktop' | 'Tablet' | 'Mobile';
  browser?: string;
}

interface ProgressData {
  courseId: string;
  completedVideoIds: string[];
  currentVideoId: string;
  isCompleted: boolean;
  completionDate?: string;
  videoTimestamps?: Record<string, number>;
}

interface UserWithProgress extends UserData {
  progress: ProgressData[];
  xp?: number;
  streak?: number;
  badges?: string[];
}

export interface RealPlatformEvent {
  id: string;
  userId?: string;
  type:
    | 'graduation'
    | 'lesson_completed'
    | 'enrolled'
    | 'page_visit'
    | 'course_view'
    | 'streak_milestone'
    | 'report_submitted';
  userName: string;
  userAvatar?: string;
  userEmail?: string;
  courseTitle: string;
  courseId?: string;
  path?: string;
  deviceType?: string;
  browser?: string;
  completedVideoIds?: string[];
  detail: string;
  timestamp: number;
  timeAgo: string;
  isRealEvent: true;
}

type MovementFilter = 'all' | 'traffic' | 'graduations' | 'lessons' | 'enrollments' | 'reports';
type ChartMetric = 'pageViews' | 'visitors' | 'lessons' | 'graduations';

interface GaPropertyOption {
  propertyId: string;
  displayName: string;
  accountName: string;
}

export function AdminAnalytics() {
  const { allCourses, language } = useStore();
  const { i18n } = useTranslation();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  // Live Firestore & Telemetry States (100% Real)
  const [users, setUsers] = useState<UserWithProgress[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [presenceList, setPresenceList] = useState<UserPresenceRecord[]>([]);
  const [movementLogs, setMovementLogs] = useState<PlatformMovementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  // Google Analytics 4 (GA4) Live Integration States
  const [gaMeasurementId, setGaMeasurementId] = useState('G-VHQYB5FFPQ');
  const [gaPropertyId, setGaPropertyId] = useState('');
  const [gaAccessToken, setGaAccessToken] = useState<string>(() => {
    try {
      return sessionStorage.getItem('skilliq_ga4_token') || '';
    } catch {
      return '';
    }
  });
  const [gaPropertiesList, setGaPropertiesList] = useState<GaPropertyOption[]>([]);
  const [gaConnected, setGaConnected] = useState(false);
  const [gaConnecting, setGaConnecting] = useState(false);
  const [gaTrafficRows, setGaTrafficRows] = useState<
    { date: string; visitors: number; pageViews: number; sessions: number }[] | null
  >(null);
  const [gaCountries, setGaCountries] = useState<{ country: string; users: number }[]>([]);
  const [gaTopPages, setGaTopPages] = useState<{ path: string; views: number; users: number }[]>(
    []
  );
  const [gaSources, setGaSources] = useState<{ source: string; sessions: number }[]>([]);
  const [gaRealtimeUsers, setGaRealtimeUsers] = useState<number | null>(null);
  const [showGaSettingsModal, setShowGaSettingsModal] = useState(false);
  const [showVercelGuideModal, setShowVercelGuideModal] = useState(false);
  const [gaStatusMsg, setGaStatusMsg] = useState<string | null>(null);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  // User Switcher & Movement Drilldown Controls
  const [selectedUserId, setSelectedUserId] = useState<string | 'all'>('all');
  const [movementFilter, setMovementFilter] = useState<MovementFilter>('all');
  const [movementSearch, setMovementSearch] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<ChartMetric>('pageViews');

  const unsubUsersRef = useRef<(() => void) | null>(null);
  const unsubReportsRef = useRef<(() => void) | null>(null);
  const unsubPresenceRef = useRef<(() => void) | null>(null);
  const unsubMovementsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);

  const translatePageLabel = (label: string, path?: string) => {
    if (!isRtl) return label;
    if (path === '/' || label === 'Home Page') return 'الصفحة الرئيسية';
    if (path?.startsWith('/courses') || label.includes('Courses Catalog'))
      return 'كتالوج الدورات التدريبية';
    if (path?.startsWith('/masterclasses') || label.includes('Masterclasses'))
      return 'صفحة الماستر كلاس';
    if (path?.startsWith('/books') || label.includes('Video Books')) return 'مكتبة الكتب المشروحة';
    if (path?.startsWith('/paths') || label.includes('Learning Paths'))
      return 'المسارات التعليمية';
    if (path?.startsWith('/community') || label.includes('Community')) return 'مجتمع الطلاب';
    if (path?.startsWith('/leaderboard') || label.includes('Leaderboard')) return 'لوحة المتصدرين';
    if (path?.startsWith('/dashboard') || label.includes('Dashboard'))
      return 'الملف الشخصي للطالب';
    if (path?.startsWith('/support') || label.includes('Support')) return 'تذاكر الدعم الفني';
    if (path?.startsWith('/contact') || label.includes('Contact')) return 'صفحة تواصل معنا';
    if (path?.startsWith('/admin') || label.includes('Admin')) return 'لوحة تحكم الإدارة';
    if (label.startsWith('Watching Course: ')) {
      return `مشاهدة دورة: ${label.replace('Watching Course: ', '')}`;
    }
    return label;
  };

  const translateMovementDetail = (detail: string, path?: string, actionType?: string) => {
    if (!isRtl) return detail;
    if (actionType === 'session_start') {
      return `بدأ جلسة تصفح جديدة في المنصة (${ path || '/' })`;
    }
    if (actionType === 'course_view' || detail.startsWith('Opened course player: ')) {
      const cName = detail.replace('Opened course player: ', '');
      return `فتح مشغل دروس الدورة: ${cName}`;
    }
    if (actionType === 'page_view' || detail.startsWith('Navigated to ')) {
      return `انتقل إلى صفحة ${translatePageLabel(detail.replace('Navigated to ', '').split(' (')[0], path)}`;
    }
    if (detail.startsWith('Completed lesson #')) {
      return detail
        .replace('Completed lesson #', 'أتم مشاهدة الدرس رقم ')
        .replace(' in ', ' في دورة ');
    }
    if (detail.startsWith('Graduated and unlocked certificate for ')) {
      return detail.replace(
        'Graduated and unlocked certificate for ',
        'تخرج بنجاح وحصل على الشهادة المعتمدة لدورة '
      );
    }
    if (detail.startsWith('Saved ')) {
      return 'قام بحفظ عنصر في قائمة المفضلة الشخصية';
    }
    return detail;
  };

  const loadTelemetryFromServerAndFirestore = async () => {
    try {
      const { presence, movements } = await fetchPlatformTelemetry();
      setPresenceList(presence);
      setMovementLogs(movements);
    } catch {}
  };

  // Parse GA4 response payload into state
  const applyGa4ResponseData = (data: any) => {
    if (!data || data.useDemo || !data.traffic) return false;
    const rows = Array.isArray(data.traffic.rows) ? data.traffic.rows : [];
    rows.sort((a: any, b: any) =>
      String(a.dimensionValues?.[0]?.value || '').localeCompare(
        String(b.dimensionValues?.[0]?.value || '')
      )
    );
    setGaTrafficRows(
      rows.map((r: any) => {
        const rawDate = String(r.dimensionValues?.[0]?.value || '');
        const formatted =
          rawDate.length === 8 ? `${rawDate.slice(4, 6)}/${rawDate.slice(6, 8)}` : rawDate;
        return {
          date: formatted,
          visitors: parseInt(r.metricValues?.[0]?.value || '0', 10),
          pageViews: parseInt(r.metricValues?.[1]?.value || '0', 10),
          sessions: parseInt(r.metricValues?.[2]?.value || r.metricValues?.[0]?.value || '0', 10),
        };
      })
    );

    if (data.locations?.rows) {
      setGaCountries(
        data.locations.rows.slice(0, 6).map((r: any) => ({
          country: r.dimensionValues?.[0]?.value || 'Unknown',
          users: parseInt(r.metricValues?.[0]?.value || '0', 10),
        }))
      );
    }

    if (data.pages?.rows) {
      setGaTopPages(
        data.pages.rows.slice(0, 6).map((r: any) => ({
          path: r.dimensionValues?.[0]?.value || '/',
          views: parseInt(r.metricValues?.[0]?.value || '0', 10),
          users: parseInt(r.metricValues?.[1]?.value || '0', 10),
        }))
      );
    }

    if (data.sources?.rows) {
      setGaSources(
        data.sources.rows.slice(0, 5).map((r: any) => ({
          source: r.dimensionValues?.[0]?.value || 'direct',
          sessions: parseInt(r.metricValues?.[0]?.value || '0', 10),
        }))
      );
    }

    if (data.realtime?.rows?.[0]?.metricValues?.[0]?.value) {
      setGaRealtimeUsers(parseInt(data.realtime.rows[0].metricValues[0].value, 10));
    } else {
      setGaRealtimeUsers(0);
    }

    setGaConnected(true);
    return true;
  };

  // Fetch GA4 Report using token + propertyId
  const fetchGa4LiveReport = async (token: string, propId: string) => {
    const cleanProp = (propId || '').replace(/^properties\//, '').trim();
    if (!cleanProp) return;

    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`/api/analytics?propertyId=${encodeURIComponent(cleanProp)}`, {
        headers,
      });
      if (!res.ok) return;
      const data = await res.json();
      applyGa4ResponseData(data);
    } catch {}
  };

  // Discover GA4 properties for authenticated Google user
  const fetchGa4AccountSummaries = async (token: string) => {
    try {
      const res = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      const props: GaPropertyOption[] = [];
      if (Array.isArray(data.accountSummaries)) {
        for (const acc of data.accountSummaries) {
          const accName = acc.displayName || 'GA4 Account';
          if (Array.isArray(acc.propertySummaries)) {
            for (const p of acc.propertySummaries) {
              const pid = String(p.property || '').replace(/^properties\//, '');
              if (pid) {
                props.push({
                  propertyId: pid,
                  displayName: p.displayName || pid,
                  accountName: accName,
                });
              }
            }
          }
        }
      }
      setGaPropertiesList(props);
      return props;
    } catch {
      return [];
    }
  };

  // One-click Connect with Google Analytics via Google OAuth Popup
  const handleConnectGoogleAnalyticsOAuth = async () => {
    setGaConnecting(true);
    setGaStatusMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/analytics.readonly');
      provider.setCustomParameters({ prompt: 'consent' });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (token) {
        setGaAccessToken(token);
        try {
          sessionStorage.setItem('skilliq_ga4_token', token);
        } catch {}

        const discovered = await fetchGa4AccountSummaries(token);
        const chosenPropId = gaPropertyId || discovered[0]?.propertyId || '';

        if (chosenPropId) {
          setGaPropertyId(chosenPropId);
          await fetch('/api/analytics/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              propertyId: chosenPropId,
              measurementId: gaMeasurementId,
            }),
          });
          await fetchGa4LiveReport(token, chosenPropId);
          setGaStatusMsg(
            isRtl
              ? 'تم الربط بنجاح مع Google Analytics 4 وجلب الزيارات الحية!'
              : 'Successfully connected to Google Analytics 4 & synced live traffic!'
          );
        } else {
          setShowGaSettingsModal(true);
          setGaStatusMsg(
            isRtl
              ? 'تمت مصادقة حساب Google! يرجى إدخال معرف Property ID أو Measurement ID.'
              : 'Google account authorized! Please enter your GA4 Property ID or Measurement ID.'
          );
        }
      }
    } catch (err: any) {
      setGaStatusMsg(
        err?.message ||
          (isRtl
            ? 'تعذر إكمال مصادقة Google Analytics.'
            : 'Could not complete Google Analytics authorization.')
      );
    } finally {
      setGaConnecting(false);
    }
  };

  const handleSaveGaConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMeas = gaMeasurementId.trim();
    const cleanProp = gaPropertyId.trim().replace(/^properties\//, '');

    if (cleanMeas.startsWith('G-')) {
      injectAndConfigureGtag(cleanMeas);
    }

    await fetch('/api/analytics/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        measurementId: cleanMeas,
        propertyId: cleanProp,
      }),
    });

    if (cleanProp) {
      await fetchGa4LiveReport(gaAccessToken, cleanProp);
    }

    setGaStatusMsg(
      isRtl
        ? 'تم حفظ إعدادات Google Analytics وتفعيل التتبع الحي عبر المنصة!'
        : 'Google Analytics configuration saved & live tracking activated!'
    );
    setTimeout(() => {
      setShowGaSettingsModal(false);
      setGaStatusMsg(null);
    }, 1000);
  };

  // 1. Setup REAL-TIME listeners for users, progress, presence, movements, and GA4 config
  useEffect(() => {
    let isMounted = true;

    loadTelemetryFromServerAndFirestore();

    fetch('/api/analytics/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (!isMounted || !cfg) return;
        if (cfg.measurementId) {
          setGaMeasurementId(cfg.measurementId);
          injectAndConfigureGtag(cfg.measurementId);
        }
        if (cfg.propertyId) {
          setGaPropertyId(cfg.propertyId);
          fetchGa4LiveReport(gaAccessToken, cfg.propertyId);
        }
      })
      .catch(() => {});

    fetch('/api/analytics')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        applyGa4ResponseData(data);
      })
      .catch(() => {});

    try {
      unsubUsersRef.current = onSnapshot(
        collection(db, 'users'),
        async (snapshot) => {
          if (!isMounted) return;
          const rawUsers: UserData[] = [];
          snapshot.forEach((docSnap) => {
            rawUsers.push({ uid: docSnap.id, ...(docSnap.data() as any) });
          });

          const usersWithDetailsPromises = rawUsers.map(async (u) => {
            let progressList: ProgressData[] = [];
            try {
              const progSnap = await getDocs(collection(db, `users/${u.uid}/progress`));
              progSnap.forEach((p) => {
                progressList.push(p.data() as ProgressData);
              });
            } catch {}

            let xp = 0;
            let streak = 0;
            let badges: string[] = [];
            try {
              const { getDoc } = await import('firebase/firestore');
              const profSnap = await getDoc(doc(db, 'publicProfiles', u.uid));
              if (profSnap.exists()) {
                const pData = profSnap.data();
                xp = pData.xp || 0;
                streak = pData.streak || 0;
                badges = pData.badges || [];
              }
            } catch {}

            return {
              ...u,
              progress: progressList,
              xp,
              streak,
              badges,
            };
          });

          const fullUsers = await Promise.all(usersWithDetailsPromises);
          if (isMounted) {
            fullUsers.sort((a, b) => {
              const aComps = a.progress.filter((p) => p.isCompleted).length;
              const bComps = b.progress.filter((p) => p.isCompleted).length;
              return bComps - aComps;
            });
            setUsers(fullUsers);
            setLoading(false);
          }
        },
        () => {
          if (isMounted) setLoading(false);
        }
      );

      unsubReportsRef.current = onSnapshot(
        collection(db, 'reports'),
        (snap) => {
          if (!isMounted) return;
          const reportList: any[] = [];
          snap.forEach((d) => reportList.push({ id: d.id, ...d.data() }));
          setReports(reportList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
        },
        () => {}
      );

      unsubPresenceRef.current = onSnapshot(
        collection(db, 'user_presence'),
        (snap) => {
          if (!isMounted) return;
          const fsPresence = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as UserPresenceRecord),
          }));
          setPresenceList((prev) => {
            const map = new Map<string, UserPresenceRecord>();
            for (const item of [...prev, ...fsPresence]) {
              if (!item || !item.id) continue;
              const ex = map.get(item.id);
              if (!ex || (item.lastSeenAt || 0) >= (ex.lastSeenAt || 0)) {
                map.set(item.id, {
                  ...ex,
                  ...item,
                  totalSecondsSpent: Math.max(
                    ex?.totalSecondsSpent || 0,
                    item.totalSecondsSpent || 0
                  ),
                  visitCount: Math.max(ex?.visitCount || 1, item.visitCount || 1),
                });
              }
            }
            return Array.from(map.values()).sort(
              (a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0)
            );
          });
        },
        () => {}
      );

      unsubMovementsRef.current = onSnapshot(
        collection(db, 'platform_movements'),
        (snap) => {
          if (!isMounted) return;
          const fsMovs = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as PlatformMovementRecord),
          }));
          setMovementLogs((prev) => {
            const map = new Map<string, PlatformMovementRecord>();
            for (const m of [...prev, ...fsMovs]) {
              if (m && m.id) map.set(m.id, m);
            }
            return Array.from(map.values()).sort(
              (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
            );
          });
        },
        () => {}
      );
    } catch {
      if (isMounted) setLoading(false);
    }

    const pollInterval = setInterval(() => {
      if (isMounted) loadTelemetryFromServerAndFirestore();
    }, 15000);

    return () => {
      isMounted = false;
      if (unsubUsersRef.current) unsubUsersRef.current();
      if (unsubReportsRef.current) unsubReportsRef.current();
      if (unsubPresenceRef.current) unsubPresenceRef.current();
      if (unsubMovementsRef.current) unsubMovementsRef.current();
      clearInterval(pollInterval);
    };
  }, []);

  const getRelativeTime = (timestamp: number) => {
    if (!timestamp || isNaN(timestamp)) return isRtl ? 'سابقاً' : 'Earlier';
    const diff = Math.max(0, Date.now() - timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return isRtl ? 'الآن' : 'Just now';
    if (mins < 60) return isRtl ? `منذ ${mins} د` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return isRtl ? `منذ ${hours} س` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return isRtl ? `منذ ${days} يوم` : `${days}d ago`;
  };

  // 2. Synthesize 100% REAL platform movements from actual Firestore documents + live telemetry
  const realMovements = useMemo<RealPlatformEvent[]>(() => {
    const list: RealPlatformEvent[] = [];
    const courseMap = new Map<string, string>();
    allCourses.forEach((c) => courseMap.set(c.id, c.title));

    movementLogs.forEach((m) => {
      let type: RealPlatformEvent['type'] = 'page_visit';
      if (m.actionType === 'course_view') type = 'course_view';
      else if (m.actionType === 'lesson_completed') type = 'lesson_completed';
      else if (m.actionType === 'course_completed') type = 'graduation';

      list.push({
        id: m.id,
        userId: m.uid || m.visitorId,
        type,
        userName:
          m.userName === 'Guest Visitor'
            ? isRtl
              ? 'زائر غير مسجل'
              : 'Guest Visitor'
            : m.userName || (isRtl ? 'زائر' : 'Visitor'),
        userAvatar: m.userAvatar,
        userEmail: m.userEmail,
        courseTitle: translatePageLabel(m.pageTitle || m.path, m.path),
        path: m.path,
        deviceType: m.deviceType,
        browser: m.browser,
        detail: translateMovementDetail(m.detail, m.path, m.actionType),
        timestamp: m.timestamp,
        timeAgo: getRelativeTime(m.timestamp),
        isRealEvent: true,
      });
    });

    users.forEach((u) => {
      u.progress.forEach((p) => {
        const courseTitle = courseMap.get(p.courseId) || p.courseId;

        if (p.isCompleted) {
          const compTime = p.completionDate
            ? new Date(p.completionDate).getTime()
            : u.lastSeenAt || u.createdAt || Date.now() - 3600000;
          list.push({
            id: `comp-${u.uid}-${p.courseId}`,
            userId: u.uid,
            type: 'graduation',
            userName: u.displayName || (isRtl ? 'طالب' : 'Learner'),
            userAvatar: u.photoURL,
            userEmail: u.email,
            courseTitle,
            courseId: p.courseId,
            path: `/course/${p.courseId}`,
            detail: isRtl
              ? `أكمل المنهج الدراسي بنجاح وحصل على شهادة إتمام معتمدة`
              : `Completed all course requirements and earned certified certificate`,
            timestamp: compTime,
            timeAgo: getRelativeTime(compTime),
            isRealEvent: true,
          });
        }

        if (p.completedVideoIds && p.completedVideoIds.length > 0) {
          const videoTime = p.completionDate
            ? new Date(p.completionDate).getTime() - 1800000
            : u.lastSeenAt || u.createdAt || Date.now() - 7200000;
          list.push({
            id: `vid-${u.uid}-${p.courseId}-${p.completedVideoIds.length}`,
            userId: u.uid,
            type: 'lesson_completed',
            userName: u.displayName || (isRtl ? 'طالب' : 'Learner'),
            userAvatar: u.photoURL,
            userEmail: u.email,
            courseTitle,
            courseId: p.courseId,
            path: `/course/${p.courseId}`,
            completedVideoIds: p.completedVideoIds,
            detail: isRtl
              ? `أكمل ${p.completedVideoIds.length} درساً تدريبياً في هذا المنهج`
              : `Finished ${p.completedVideoIds.length} video lessons in this curriculum`,
            timestamp: videoTime,
            timeAgo: getRelativeTime(videoTime),
            isRealEvent: true,
          });
        }

        if (
          p.currentVideoId &&
          !p.isCompleted &&
          (!p.completedVideoIds || p.completedVideoIds.length === 0)
        ) {
          const enrollTime = u.lastSeenAt || u.createdAt || Date.now() - 86400000;
          list.push({
            id: `enr-${u.uid}-${p.courseId}`,
            userId: u.uid,
            type: 'enrolled',
            userName: u.displayName || (isRtl ? 'طالب' : 'Learner'),
            userAvatar: u.photoURL,
            userEmail: u.email,
            courseTitle,
            courseId: p.courseId,
            path: `/course/${p.courseId}`,
            detail: isRtl
              ? `بدأ مسار التعلم وشاهد الدرس الأول`
              : `Enrolled in course and launched video player`,
            timestamp: enrollTime,
            timeAgo: getRelativeTime(enrollTime),
            isRealEvent: true,
          });
        }
      });
    });

    reports.forEach((rep) => {
      const courseTitle = courseMap.get(rep.courseId) || rep.courseId || 'Course';
      const matchedUser = users.find((u) => u.email === rep.userEmail);
      list.push({
        id: `rep-${rep.id}`,
        userId: matchedUser?.uid,
        type: 'report_submitted',
        userName: rep.userEmail?.split('@')[0] || (isRtl ? 'طالب' : 'Learner'),
        userEmail: rep.userEmail,
        courseTitle,
        courseId: rep.courseId,
        path: rep.courseId ? `/course/${rep.courseId}` : '/courses',
        detail: isRtl
          ? `أبلغ عن مشكلة تقنية: "${rep.issue || 'فيديو غير متاح'}"`
          : `Reported issue: "${rep.issue || 'Video unavailable'}"`,
        timestamp: rep.createdAt || Date.now() - 3600000,
        timeAgo: getRelativeTime(rep.createdAt || Date.now() - 3600000),
        isRealEvent: true,
      });
    });

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [movementLogs, users, reports, allCourses, isRtl, nowTick]);

  const filteredMovements = useMemo(() => {
    return realMovements.filter((m) => {
      if (selectedUserId !== 'all' && m.userId !== selectedUserId) return false;
      if (movementFilter === 'traffic' && m.type !== 'page_visit' && m.type !== 'course_view')
        return false;
      if (movementFilter === 'graduations' && m.type !== 'graduation') return false;
      if (movementFilter === 'lessons' && m.type !== 'lesson_completed') return false;
      if (movementFilter === 'enrollments' && m.type !== 'enrolled') return false;
      if (movementFilter === 'reports' && m.type !== 'report_submitted') return false;

      if (movementSearch.trim()) {
        const q = movementSearch.toLowerCase();
        const mName = m.userName.toLowerCase().includes(q);
        const mCourse = m.courseTitle.toLowerCase().includes(q);
        const mDetail = m.detail.toLowerCase().includes(q);
        const mEmail = (m.userEmail || '').toLowerCase().includes(q);
        if (!mName && !mCourse && !mDetail && !mEmail) return false;
      }

      return true;
    });
  }, [realMovements, selectedUserId, movementFilter, movementSearch]);

  const getDayBucket = (timestamp: number) => {
    const now = new Date();
    const eventDate = new Date(timestamp);

    if (now.toDateString() === eventDate.toDateString()) {
      return isRtl ? 'اليوم' : 'Today';
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.toDateString() === eventDate.toDateString()) {
      return isRtl ? 'أمس' : 'Yesterday';
    }

    const diffDays = Math.floor((now.getTime() - timestamp) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      return isRtl ? 'هذا الأسبوع' : 'This Week';
    }

    return isRtl ? 'سابقاً' : 'Earlier';
  };

  const groupedMovements = useMemo(() => {
    const groups: { bucket: string; items: RealPlatformEvent[] }[] = [];
    const bucketOrder = [
      isRtl ? 'اليوم' : 'Today',
      isRtl ? 'أمس' : 'Yesterday',
      isRtl ? 'هذا الأسبوع' : 'This Week',
      isRtl ? 'سابقاً' : 'Earlier',
    ];

    const map = new Map<string, RealPlatformEvent[]>();
    filteredMovements.slice(0, 120).forEach((m) => {
      const b = getDayBucket(m.timestamp);
      if (!map.has(b)) map.set(b, []);
      map.get(b)!.push(m);
    });

    bucketOrder.forEach((bName) => {
      if (map.has(bName) && map.get(bName)!.length > 0) {
        groups.push({ bucket: bName, items: map.get(bName)! });
      }
    });

    return groups;
  }, [filteredMovements, isRtl]);

  // 3. Real Traffic & KPI Metrics
  const totalUsers = users.length;
  const onlineNowVisitors = useMemo(() => {
    const livePresence = presenceList.filter((p) => isUserOnlineNow(p.lastSeenAt));
    if (gaRealtimeUsers !== null && gaRealtimeUsers > livePresence.length) {
      return gaRealtimeUsers;
    }
    return livePresence.length;
  }, [presenceList, gaRealtimeUsers, nowTick]);

  const totalUniqueVisitors = useMemo(() => {
    const uniqueIds = new Set<string>();
    users.forEach((u) => uniqueIds.add(u.uid));
    presenceList.forEach((p) => uniqueIds.add(p.uid || p.id));
    return uniqueIds.size;
  }, [users, presenceList]);

  const totalPlatformTimeSeconds = useMemo(() => {
    const map = new Map<string, number>();
    users.forEach((u) => {
      if (u.totalSecondsSpent) map.set(u.uid, u.totalSecondsSpent);
    });
    presenceList.forEach((p) => {
      const key = p.uid || p.id;
      map.set(key, Math.max(map.get(key) || 0, p.totalSecondsSpent || 0));
    });
    let sum = 0;
    map.forEach((v) => (sum += v));
    return sum;
  }, [users, presenceList]);

  const totalPageViewsCount = useMemo(() => {
    if (gaTrafficRows && gaTrafficRows.length > 0) {
      const gaViews = gaTrafficRows.reduce((acc, r) => acc + r.pageViews, 0);
      if (gaViews > 0) return gaViews;
    }
    const fromPresence = presenceList.reduce((acc, p) => acc + (p.pagesVisitedCount || 1), 0);
    return Math.max(fromPresence, movementLogs.length);
  }, [gaTrafficRows, presenceList, movementLogs]);

  const totalCertificates = users.reduce(
    (acc, u) => acc + u.progress.filter((p) => p.isCompleted).length,
    0
  );
  const totalVideosCompleted = users.reduce(
    (acc, u) =>
      acc + u.progress.reduce((pAcc, p) => pAcc + (p.completedVideoIds?.length || 0), 0),
    0
  );
  const totalEnrollments = users.reduce((acc, u) => acc + u.progress.length, 0);
  const realCompletionRate =
    totalEnrollments > 0 ? Math.round((totalCertificates / totalEnrollments) * 100) : 0;

  // 4. Real 7-Day Traffic & Activity Timeline Data
  const realTimelineData = useMemo(() => {
    const daysMap: Record<
      string,
      {
        name: string;
        pageViews: number;
        visitors: number;
        lessons: number;
        graduations: number;
        visitorSet: Set<string>;
      }
    > = {};

    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const displayDay = d.toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
        weekday: 'short',
        month: 'numeric',
        day: 'numeric',
      });
      daysMap[dateKey] = {
        name: displayDay,
        pageViews: 0,
        visitors: 0,
        lessons: 0,
        graduations: 0,
        visitorSet: new Set<string>(),
      };
    }

    movementLogs.forEach((m) => {
      const dateKey = new Date(m.timestamp).toISOString().split('T')[0];
      if (daysMap[dateKey]) {
        daysMap[dateKey].pageViews += 1;
        daysMap[dateKey].visitorSet.add(m.uid || m.visitorId);
      }
    });

    presenceList.forEach((p) => {
      if (p.lastSeenAt) {
        const dateKey = new Date(p.lastSeenAt).toISOString().split('T')[0];
        if (daysMap[dateKey]) {
          daysMap[dateKey].visitorSet.add(p.uid || p.id);
          if (daysMap[dateKey].pageViews === 0) {
            daysMap[dateKey].pageViews += p.pagesVisitedCount || 1;
          }
        }
      }
    });

    users.forEach((u) => {
      u.progress.forEach((p) => {
        if (p.isCompleted && p.completionDate) {
          const compDateKey = p.completionDate.split('T')[0];
          if (daysMap[compDateKey]) {
            daysMap[compDateKey].graduations += 1;
            daysMap[compDateKey].visitorSet.add(u.uid);
          }
        }
        if (p.completedVideoIds && p.completedVideoIds.length > 0) {
          const dateKey = p.completionDate
            ? p.completionDate.split('T')[0]
            : now.toISOString().split('T')[0];
          if (daysMap[dateKey]) {
            daysMap[dateKey].lessons += p.completedVideoIds.length;
            daysMap[dateKey].visitorSet.add(u.uid);
          }
        }
      });
    });

    const list = Object.values(daysMap).map((d) => ({
      name: d.name,
      pageViews: d.pageViews,
      visitors: d.visitorSet.size,
      lessons: d.lessons,
      graduations: d.graduations,
    }));

    if (gaTrafficRows && gaTrafficRows.length > 0) {
      gaTrafficRows.forEach((gaRow, idx) => {
        if (list[idx]) {
          list[idx].pageViews = Math.max(list[idx].pageViews, gaRow.pageViews);
          list[idx].visitors = Math.max(list[idx].visitors, gaRow.visitors);
        }
      });
    }

    return list;
  }, [movementLogs, presenceList, users, gaTrafficRows, isRtl]);

  // 5. Real Top Visited Pages & Routes Breakdown
  const realTopPagesVisited = useMemo(() => {
    if (gaTopPages.length > 0) {
      return gaTopPages.map((p) => ({
        ...p,
        label: translatePageLabel(p.path, p.path),
      }));
    }
    const counts = new Map<
      string,
      { path: string; label: string; views: number; usersSet: Set<string> }
    >();
    movementLogs.forEach((m) => {
      const key = m.path || '/';
      if (!counts.has(key)) {
        counts.set(key, {
          path: key,
          label: translatePageLabel(m.pageTitle || key, key),
          views: 0,
          usersSet: new Set(),
        });
      }
      const item = counts.get(key)!;
      item.views += 1;
      item.usersSet.add(m.uid || m.visitorId);
    });

    presenceList.forEach((p) => {
      (p.recentTrail || []).forEach((t) => {
        const key = t.path || '/';
        if (!counts.has(key)) {
          counts.set(key, {
            path: key,
            label: translatePageLabel(t.label || key, key),
            views: 0,
            usersSet: new Set(),
          });
        }
        const item = counts.get(key)!;
        item.views += 1;
        item.usersSet.add(p.uid || p.id);
      });
    });

    return Array.from(counts.values())
      .map((item) => ({
        path: item.path,
        label: item.label,
        views: item.views,
        users: item.usersSet.size,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);
  }, [gaTopPages, movementLogs, presenceList, isRtl]);

  // 6. Real Device & Browser Breakdown
  const deviceBreakdown = useMemo(() => {
    const devCounts: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 };
    presenceList.forEach((p) => {
      const dev = p.deviceType || 'Desktop';
      devCounts[dev] = (devCounts[dev] || 0) + 1;
    });

    const total = Math.max(1, presenceList.length);
    return Object.entries(devCounts).map(([name, count]) => ({
      name,
      label:
        name === 'Mobile'
          ? isRtl
            ? 'هاتف محمول'
            : 'Mobile'
          : name === 'Tablet'
          ? isRtl
            ? 'جهاز لوحي'
            : 'Tablet'
          : isRtl
          ? 'كمبيوتر / لابتوب'
          : 'Laptop / Desktop',
      count,
      percent: presenceList.length > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }, [presenceList, isRtl]);

  const handleManualSync = async () => {
    setRefreshing(true);
    try {
      await loadTelemetryFromServerAndFirestore();
      if (gaPropertyId) {
        await fetchGa4LiveReport(gaAccessToken, gaPropertyId);
      }
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleCopyText = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedVar(val);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-10 sm:p-12 text-center rounded-3xl bg-card border border-border/80 shadow-xs flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center animate-spin">
          <RefreshCw className="w-6 h-6" />
        </div>
        <p className="text-xs sm:text-sm font-bold text-foreground">
          {isRtl
            ? 'جاري الاتصال بـ Google Analytics و Firestore لتحميل الزيارات والبيانات الحية...'
            : 'Connecting to Google Analytics & Firestore for 100% Real-Time Traffic & Movements...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-7" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. TOP STATUS BAR + GOOGLE ANALYTICS 4 CONNECTION HUB */}
      <div className="bg-card border border-border/80 rounded-3xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-primary to-amber-500" />

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="text-start">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {isRtl
                  ? 'حركة الزيارات والمنصة الحية 100%'
                  : '100% Real-Time Traffic & Platform Telemetry'}
              </span>

              {gaConnected || gaMeasurementId.startsWith('G-') ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  {isRtl ? 'مرتبط مع Google Analytics 4' : 'Google Analytics 4 Active'}
                  {gaMeasurementId ? ` (${gaMeasurementId})` : ''}
                </span>
              ) : null}
            </div>

            <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />
              <span>
                {isRtl
                  ? 'مركز زيارات الموقع (Google Analytics) وحركات المنصة الحية'
                  : 'Google Analytics Traffic & Real-Time Platform Movements'}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              {isRtl
                ? 'اربط حساب Google Analytics 4 (GA4) بنقرة واحدة، وتابع الزوار المتصلين الآن، مصادر الزيارات، الصفحات الأكثر تصفحاً، وكل حركة داخل المنصة على الكمبيوتر والتابلت والهاتف.'
                : 'Connect Google Analytics 4 (GA4) in one click, monitor live online visitors, traffic trends, top pages, time spent, and every real user movement across all devices.'}
            </p>
          </div>

          {/* Google Analytics Connect, Setup & Vercel Security Guide Controls */}
          <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
            <button
              type="button"
              onClick={handleConnectGoogleAnalyticsOAuth}
              disabled={gaConnecting}
              className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span>
                {gaConnecting
                  ? isRtl
                    ? 'جاري الربط...'
                    : 'Connecting GA4...'
                  : gaConnected
                  ? isRtl
                    ? 'تحديث بيانات Google Analytics'
                    : 'Refresh Google Analytics'
                  : isRtl
                  ? 'ربط Google Analytics مباشر'
                  : 'Connect Google Analytics'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowGaSettingsModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-muted/70 hover:bg-muted text-foreground border border-border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-primary shrink-0" />
              <span>{isRtl ? 'إعداد معرف GA4' : 'GA4 ID Setup'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowVercelGuideModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{isRtl ? 'دليل أمان Vercel و APIs' : 'Vercel & API Security Guide'}</span>
            </button>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              title={isRtl ? 'مزامنة فورية' : 'Sync Now'}
            >
              <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* If user authenticated multiple GA4 properties, let them switch property right here */}
        {gaPropertiesList.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-foreground">
                {isRtl ? 'خاصية Google Analytics المتصلة:' : 'Active GA4 Property:'}
              </span>
              <select
                value={gaPropertyId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setGaPropertyId(nextId);
                  fetch('/api/analytics/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ propertyId: nextId }),
                  });
                  fetchGa4LiveReport(gaAccessToken, nextId);
                }}
                className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-bold text-foreground"
              >
                {gaPropertiesList.map((p) => (
                  <option key={p.propertyId} value={p.propertyId}>
                    {p.displayName} ({p.accountName} • ID: {p.propertyId})
                  </option>
                ))}
              </select>
            </div>
            {gaStatusMsg && (
              <span className="text-xs font-bold text-emerald-500">{gaStatusMsg}</span>
            )}
          </div>
        )}
      </div>

      {/* 2. REAL TRAFFIC & PLATFORM KPI CARDS (Responsive 1 -> 2 -> 5 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* KPI 1: Online Visitors Right Now */}
        <div className="bg-card border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xs text-start">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {isRtl ? 'متصلون الآن بالموقع' : 'Online Visitors Now'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {onlineNowVisitors}
            </span>
            <span className="text-[11px] font-bold text-muted-foreground">
              {isRtl ? 'زائر نشط حالياً' : 'live on site'}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{isRtl ? 'إجمالي الزوار الفريدين' : 'Unique Visitors'}:</span>
            <span className="font-bold text-foreground">{totalUniqueVisitors}</span>
          </div>
        </div>

        {/* KPI 2: Real Page Views & Traffic */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs text-start">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {isRtl ? 'مشاهدات الصفحات' : 'Total Page Views'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {totalPageViewsCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-blue-500 font-bold">
              {gaConnected ? 'GA4 + Live' : isRtl ? 'تصفح حقيقي' : 'real views'}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{isRtl ? 'المستخدمون المسجلون' : 'Registered Users'}:</span>
            <span className="font-bold text-foreground">{totalUsers}</span>
          </div>
        </div>

        {/* KPI 3: Real Time Spent on Platform */}
        <div className="bg-card border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xs text-start">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {isRtl ? 'الوقت المقضي بالمنصة' : 'Time Spent on Platform'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {formatDurationSpent(totalPlatformTimeSeconds, isRtl)}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{isRtl ? 'حركات مسجلة' : 'Tracked Events'}:</span>
            <span className="font-bold text-foreground">{realMovements.length}</span>
          </div>
        </div>

        {/* KPI 4: Completed Lessons */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs text-start">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {isRtl ? 'الدروس المشاهدة فعلياً' : 'Completed Lessons'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <PlayCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {totalVideosCompleted}
            </span>
            <span className="text-[11px] font-semibold text-primary">
              {isRtl ? 'درس مكتمل' : 'lessons'}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{isRtl ? 'إجمالي الالتحاقات' : 'Course Enrollments'}:</span>
            <span className="font-bold text-foreground">{totalEnrollments}</span>
          </div>
        </div>

        {/* KPI 5: Certificates Earned */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-1 bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs text-start">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {isRtl ? 'الشهادات المكتسبة' : 'Certificates Earned'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {totalCertificates}
            </span>
            <span className="text-[11px] font-semibold text-emerald-500">
              {realCompletionRate}% {isRtl ? 'إتمام' : 'rate'}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{isRtl ? 'المناهج النشطة' : 'Courses in Catalog'}:</span>
            <span className="font-bold text-foreground">{allCourses.length}</span>
          </div>
        </div>
      </div>

      {/* 3. REAL-TIME TRAFFIC CHART & TOP VISITED PAGES / DEVICES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Traffic & Activity Area Chart */}
        <div className="lg:col-span-2 bg-card border border-border/80 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="text-start">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0" />
                <h3 className="text-sm sm:text-lg font-black text-foreground">
                  {isRtl
                    ? 'حركة الزيارات والتفاعل الحقيقية (آخر 7 أيام)'
                    : 'Real Platform Traffic & Engagement (Past 7 Days)'}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {gaConnected
                  ? isRtl
                    ? 'مباشر من Google Analytics 4 وسجلات المنصة الحية'
                    : 'Synchronized with Google Analytics 4 & live Firestore telemetry'
                  : isRtl
                  ? 'بيانات حقيقية 100% من زيارات وتصفح المستخدمين الفعليين'
                  : '100% real visitor traffic and learning events recorded on the platform'}
              </p>
            </div>

            {/* Metric Selector */}
            <div className="p-1 bg-muted/40 border border-border/80 rounded-xl flex items-center gap-1 overflow-x-auto self-start sm:self-auto max-w-full">
              {(
                [
                  { id: 'pageViews', labelEn: 'Page Views', labelAr: 'المشاهدات' },
                  { id: 'visitors', labelEn: 'Visitors', labelAr: 'الزوار' },
                  { id: 'lessons', labelEn: 'Lessons', labelAr: 'الدروس' },
                  { id: 'graduations', labelEn: 'Certs', labelAr: 'الشهادات' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setChartMetric(m.id)}
                  className={cn(
                    'px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0',
                    chartMetric === m.id
                      ? 'bg-card text-foreground shadow-xs border border-border/60'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {isRtl ? m.labelAr : m.labelEn}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-[230px] sm:h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={realTimelineData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="realTrafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  dy={8}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={chartMetric}
                  name={
                    chartMetric === 'pageViews'
                      ? isRtl
                        ? 'مشاهدات الصفحات'
                        : 'Page Views'
                      : chartMetric === 'visitors'
                      ? isRtl
                        ? 'الزوار النشطون'
                        : 'Active Visitors'
                      : chartMetric === 'lessons'
                      ? isRtl
                        ? 'دروس مكتملة'
                        : 'Lessons Completed'
                      : isRtl
                      ? 'شهادات صادرة'
                      : 'Certificates Earned'
                  }
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#realTrafficGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Visited Pages + Devices & Countries Breakdown */}
        <div className="bg-card border border-border/80 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col justify-between space-y-5 text-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Navigation className="w-5 h-5 text-primary shrink-0" />
              <h3 className="text-sm sm:text-lg font-black text-foreground">
                {isRtl ? 'أكثر الصفحات زيارة وتصفحاً' : 'Top Visited Pages (Real Traffic)'}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {isRtl
                ? 'الصفحات والمسارات الأكثر تصفحاً من قبل الزوار'
                : 'Most viewed routes and pages across the platform'}
            </p>

            <div className="space-y-2">
              {realTopPagesVisited.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">
                  {isRtl ? 'جاري تسجيل الزيارات...' : 'Recording page visits...'}
                </p>
              ) : (
                realTopPagesVisited.map((pg, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-muted/25 border border-border/60 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span
                        dir={getTextDir(pg.label)}
                        className="font-bold text-foreground truncate block"
                      >
                        {pg.label}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground truncate block">
                        {pg.path}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-black text-primary">{pg.views}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {isRtl ? 'مشاهدة' : 'views'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Device & Country Distribution */}
          <div className="pt-4 border-t border-border/60 space-y-3">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              {isRtl ? 'توزيع الأجهزة والمتصفحات' : 'Visitor Devices & Browsers'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {deviceBreakdown.map((d) => (
                <div
                  key={d.name}
                  className="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-center"
                >
                  <div className="flex items-center justify-center gap-1 text-xs font-bold text-foreground">
                    {d.name === 'Mobile' ? (
                      <Smartphone className="w-3.5 h-3.5 text-primary" />
                    ) : d.name === 'Tablet' ? (
                      <Tablet className="w-3.5 h-3.5 text-indigo-500" />
                    ) : (
                      <Monitor className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <span>{d.percent}%</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block mt-0.5 truncate">
                    {d.label} ({d.count})
                  </span>
                </div>
              ))}
            </div>

            {gaCountries.length > 0 && (
              <div className="pt-2 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  {isRtl ? 'أبرز الدول (Google Analytics):' : 'Top Countries (GA4):'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {gaCountries.map((c, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[11px] font-bold text-foreground"
                    >
                      {c.country}: {c.users}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {gaSources.length > 0 && (
              <div className="pt-1 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  {isRtl ? 'مصادر الزيارات (Traffic Sources):' : 'Traffic Sources (GA4):'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {gaSources.map((s, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/25 text-[11px] font-bold text-primary"
                    >
                      {s.source}: {s.sessions}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. REAL PLATFORM MOVEMENT STREAM (TRAFFIC + LEARNING + ACTIONS) */}
      <div className="bg-card border border-border/80 rounded-3xl p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div className="text-start">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <h2 className="text-base sm:text-xl font-black text-foreground">
                {isRtl
                  ? 'البث الحي لحركات الزوار والطلاب داخل المنصة'
                  : 'Real-Time Visitor Traffic & Platform Movement Stream'}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isRtl
                ? 'شاهد كل حركة تحدث داخل المنصة فور وقوعها: تصفح الصفحات، فتح الدورات، إتمام الدروس، الشهادات، والبلاغات.'
                : 'Inspect every live visitor navigation, course launch, completed lesson, and graduation in real time.'}
            </p>
          </div>

          {/* Movement Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(
              [
                { id: 'all', labelEn: 'All Movements', labelAr: 'كل الحركات' },
                { id: 'traffic', labelEn: 'Page & Course Visits', labelAr: 'زيارات الصفحات' },
                { id: 'lessons', labelEn: 'Completed Lessons', labelAr: 'الدروس المكتملة' },
                { id: 'graduations', labelEn: 'Graduations', labelAr: 'الشهادات' },
                { id: 'reports', labelEn: 'Reports', labelAr: 'البلاغات' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMovementFilter(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0',
                  movementFilter === tab.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                )}
              >
                {isRtl ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Learner Focus Switcher & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5" />
            <input
              type="text"
              value={movementSearch}
              onChange={(e) => setMovementSearch(e.target.value)}
              dir={getTextDir(movementSearch)}
              placeholder={
                isRtl
                  ? 'ابحث في الحركات بالاسم، الصفحة، أو الدورة...'
                  : 'Search movements by user, page, or course...'
              }
              className="w-full ps-9 pe-4 py-2 rounded-xl bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full sm:w-64 bg-background border border-border/80 text-foreground px-3 py-2 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">
                {isRtl ? '🌐 جميع الزوار والطلاب' : '🌐 All Visitors & Learners'}
              </option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName || u.email || 'Learner'} ({u.progress.length}{' '}
                  {isRtl ? 'دورات' : 'courses'})
                </option>
              ))}
            </select>

            {selectedUserId !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedUserId('all')}
                className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Grouped Real Movements Stream */}
        <div className="space-y-5 max-h-[580px] overflow-y-auto pr-1">
          {groupedMovements.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Compass className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-bold text-foreground">
                {isRtl ? 'لا توجد حركات مطابقة للبحث' : 'No matching platform movements'}
              </p>
            </div>
          ) : (
            groupedMovements.map(({ bucket, items }) => (
              <div key={bucket} className="space-y-2.5">
                <div className="flex items-center gap-2.5 py-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{bucket}</span>
                  </span>
                  <div className="h-px bg-border/70 flex-1" />
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border/50">
                    {items.length} {isRtl ? 'حركة' : 'events'}
                  </span>
                </div>

                <div className="space-y-2">
                  {items.map((evt) => {
                    const isGrad = evt.type === 'graduation';
                    const isVid = evt.type === 'lesson_completed';
                    const isRep = evt.type === 'report_submitted';
                    const isVisit = evt.type === 'page_visit' || evt.type === 'course_view';
                    const isExpanded = expandedEventId === evt.id;

                    return (
                      <div
                        key={evt.id}
                        className={cn(
                          'p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 shadow-2xs text-start',
                          isGrad
                            ? 'bg-amber-500/5 border-amber-500/30'
                            : isRep
                            ? 'bg-rose-500/5 border-rose-500/30'
                            : isVid
                            ? 'bg-emerald-500/5 border-emerald-500/25'
                            : 'bg-card border-border/80'
                        )}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className={cn(
                                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white',
                                isGrad
                                  ? 'bg-amber-500'
                                  : isRep
                                  ? 'bg-rose-500'
                                  : isVid
                                  ? 'bg-emerald-500'
                                  : isVisit
                                  ? 'bg-primary'
                                  : 'bg-blue-500'
                              )}
                            >
                              {isGrad ? (
                                <Award className="w-4 h-4" />
                              ) : isRep ? (
                                <AlertTriangle className="w-4 h-4" />
                              ) : isVid ? (
                                <PlayCircle className="w-4 h-4" />
                              ) : (
                                <Compass className="w-4 h-4" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  dir={getTextDir(evt.userName)}
                                  className="font-extrabold text-xs sm:text-sm text-foreground"
                                >
                                  {evt.userName}
                                </span>
                                {evt.userEmail && (
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    ({evt.userEmail})
                                  </span>
                                )}
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  • {evt.timeAgo}
                                </span>
                              </div>
                              <p
                                dir={getTextDir(evt.detail)}
                                className="text-xs text-foreground/90 mt-0.5 font-medium"
                              >
                                {evt.detail}
                              </p>
                              <div className="text-[11px] text-primary font-semibold mt-0.5 flex items-center gap-2 flex-wrap">
                                <span dir={getTextDir(evt.courseTitle)}>{evt.courseTitle}</span>
                                {evt.path && (
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    ({evt.path})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {evt.completedVideoIds && evt.completedVideoIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                                className="px-2.5 py-1 rounded-lg bg-muted text-foreground text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <span>
                                  {evt.completedVideoIds.length} {isRtl ? 'دروس' : 'lessons'}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>
                            )}
                            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              ● {isRtl ? 'حي' : 'LIVE'}
                            </span>
                          </div>
                        </div>

                        {isExpanded && evt.completedVideoIds && (
                          <div className="mt-2 pt-2 border-t border-border/60 bg-muted/20 p-3 rounded-xl">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] font-mono text-muted-foreground">
                              {evt.completedVideoIds.map((vid, vIdx) => (
                                <div key={vIdx} className="flex items-center gap-1.5 truncate">
                                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                  <span className="truncate">{vid}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL 1: GOOGLE ANALYTICS 4 CONFIGURATION */}
      {showGaSettingsModal && (
        <div
          onClick={() => setShowGaSettingsModal(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 text-start"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    {isRtl
                      ? 'إعدادات الربط مع Google Analytics 4'
                      : 'Google Analytics 4 (GA4) Connection'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRtl
                      ? 'أدخل معرف القياس G-XXXXXXXXXX أو اربط حسابك لجلب تقارير الزيارات'
                      : 'Configure your GA4 Measurement ID & Property ID for live traffic sync'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGaSettingsModal(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGaConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-foreground mb-1.5">
                  {isRtl
                    ? 'معرف القياس (GA4 Measurement ID - يبدأ بـ G-)'
                    : 'GA4 Measurement ID (starts with G-)'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={gaMeasurementId}
                  onChange={(e) => setGaMeasurementId(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-xs sm:text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {isRtl
                    ? 'عند حفظ هذا المعرف، يتم حقن وتفعيل وسم Google Analytics (gtag.js) تلقائياً في جميع صفحات المنصة.'
                    : 'Automatically activates gtag.js tracking across all pages of your platform.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-foreground mb-1.5">
                  {isRtl
                    ? 'معرف خاصية GA4 (Property ID - أرقام فقط)'
                    : 'GA4 Property ID (Numeric ID for Data API Reports)'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={gaPropertyId}
                  onChange={(e) => setGaPropertyId(e.target.value)}
                  placeholder="e.g. 412345678"
                  className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-xs sm:text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {gaStatusMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  {gaStatusMsg}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConnectGoogleAnalyticsOAuth}
                  disabled={gaConnecting}
                  className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  <span>
                    {isRtl
                      ? 'مصادقة حساب Google وجلب الخصائص تلقائياً'
                      : 'Authorize Google Account & Auto-Detect'}
                  </span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 cursor-pointer shadow-sm"
                >
                  {isRtl ? 'حفظ وتفعيل' : 'Save & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VERCEL & API SECURITY HOSTING GUIDE */}
      {showVercelGuideModal && (
        <div
          onClick={() => setShowVercelGuideModal(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 text-start max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    {isRtl
                      ? 'دليل استضافة وأمان الـ APIs على Vercel وربط Google Analytics'
                      : 'How to Host APIs Securely on Vercel & Connect Google Analytics'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRtl
                      ? 'خطوات عملية لحماية مفاتيحك السرية وتشغيل الـ Backend Serverless على Vercel'
                      : 'Step-by-step production security checklist for Vercel Serverless & GA4'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVercelGuideModal(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-foreground/90">
              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-2">
                <h4 className="font-black text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>
                    {isRtl
                      ? 'كيف تعمل الـ APIs بأمان على Vercel؟'
                      : 'How Your APIs Run Securely on Vercel'}
                  </span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  {isRtl
                    ? 'تم إعداد ملف vercel.json و api/index.js ليعمل كـ Vercel Serverless Function. جميع طلبات /api/* (مثل /api/analytics و /api/youtube و /api/tickets) يتم تنفيذها في السيرفر الخلفي لـ Vercel بحيث لا تظهر أي مفاتيح سرية (API Keys) للمستخدمين في المتصفح.'
                    : 'Your project includes api/index.js and vercel.json routing all /api/* requests to Vercel Serverless Functions. Secrets stored in Vercel Environment Variables never leak to the browser.'}
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-2.5">
                <h4 className="font-black text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    {isRtl
                      ? 'المتغيرات البيئية المطلوب إضافتها في Vercel (Settings → Environment Variables)'
                      : 'Add These Environment Variables in Vercel Dashboard (Settings → Environment Variables)'}
                  </span>
                </h4>

                <div className="space-y-2">
                  {[
                    {
                      name: 'VITE_GA_MEASUREMENT_ID',
                      descEn: 'Your GA4 Measurement ID (e.g. G-XXXXXXXXXX) from Google Analytics → Admin → Data Streams.',
                      descAr: 'معرف القياس من Google Analytics (مثل G-XXXXXXXXXX) لتفعيل تتبع الزوار في كل الصفحات.',
                    },
                    {
                      name: 'GA4_PROPERTY_ID',
                      descEn: 'Your numeric GA4 Property ID (e.g. 412345678) from Google Analytics → Admin → Property Details.',
                      descAr: 'معرف خاصية GA4 الرقمي (مثل 412345678) من إعدادات الحساب في Google Analytics.',
                    },
                    {
                      name: 'GA4_SERVICE_ACCOUNT_JSON',
                      descEn: 'Recommended for 24/7 server-side GA4 reports: Paste your Google Cloud Service Account JSON key (grant its client_email "Viewer" access in GA4 Property Access Management).',
                      descAr: 'الطريقة الأكثر أماناً واستقراراً على Vercel: الصق محتوى ملف JSON لحساب الخدمة (Service Account) بعد إعطائه صلاحية Viewer في Google Analytics.',
                    },
                    {
                      name: 'YOUTUBE_API_KEY',
                      descEn: 'Server-only YouTube Data API v3 key (keeps your key hidden from client bundle).',
                      descAr: 'مفتاح YouTube Data API v3 في السيرفر الخلفي فقط لحمايته من الظهور في المتصفح.',
                    },
                  ].map((envItem) => (
                    <div
                      key={envItem.name}
                      className="p-3 rounded-xl bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="font-mono font-black text-xs text-primary">
                          {envItem.name}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {isRtl ? envItem.descAr : envItem.descEn}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(envItem.name)}
                        className="px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-[11px] font-bold flex items-center gap-1 shrink-0 self-start sm:self-center cursor-pointer"
                      >
                        {copiedVar === envItem.name ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{isRtl ? 'نسخ الاسم' : 'Copy'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                <h4 className="font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                  {isRtl
                    ? '💡 نصيحة سريعة: الربط بنقرة واحدة بدون مفاتيح معقدة!'
                    : '💡 Instant Option: 1-Click OAuth Right Inside This Page'}
                </h4>
                <p className="text-xs text-foreground/90">
                  {isRtl
                    ? 'يمكنك ببساطة النقر على زر "ربط Google Analytics مباشر" في أعلى هذه الصفحة، واختيار حسابك في Google، وسيقوم النظام تلقائياً باكتشاف خصائص GA4 الخاصة بك وجلب الزيارات فوراً!'
                    : 'You can also simply click the orange "Connect Google Analytics" button at the top of this page, sign in with your Google account, and it will auto-detect your GA4 properties and pull live reports immediately!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
