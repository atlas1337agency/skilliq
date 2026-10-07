import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Loader2,
  Search,
  UserCheck,
  Download,
  Trash2,
  UserX,
  BookOpen,
  Award,
  Activity,
  Clock,
  Radio,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  PlayCircle,
  CheckCircle2,
  Navigation,
  RefreshCw,
  X,
  Flame,
  LifeBuoy,
  AlertTriangle,
  Sparkles,
  Users,
  Compass,
  Heart,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { isSuperAdminEmail } from '../lib/admin';
import { cn } from '../lib/utils';
import {
  UserPresenceRecord,
  PlatformMovementRecord,
  PresenceTrailItem,
  fetchPlatformTelemetry,
  isUserOnlineNow,
  formatDurationSpent,
} from '../lib/telemetry';

interface CourseProgressItem {
  courseId: string;
  completedVideoIds: string[];
  currentVideoId: string;
  isCompleted: boolean;
  completionDate?: string;
  videoTimestamps?: Record<string, number>;
}

interface AdminUserData {
  uid: string;
  isGuest?: boolean;
  email?: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  xp?: number;
  streak?: number;
  enrolledCount: number;
  completedCount: number;
  lessonsCompletedCount: number;
  progressList: CourseProgressItem[];
  // Real telemetry fields
  totalSecondsSpent: number;
  sessionSecondsSpent: number;
  visitCount: number;
  pagesVisitedCount: number;
  firstVisitAt?: number;
  lastSeenAt?: number;
  currentPath?: string;
  currentPageLabel?: string;
  deviceType?: 'Desktop' | 'Tablet' | 'Mobile';
  browser?: string;
  recentTrail?: PresenceTrailItem[];
}

interface UnifiedPlatformEvent {
  id: string;
  uid?: string | null;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  isGuest?: boolean;
  category:
    | 'navigation'
    | 'course_view'
    | 'lesson_completed'
    | 'graduation'
    | 'favorite'
    | 'support_ticket'
    | 'report';
  title: string;
  detail: string;
  path?: string;
  deviceType?: string;
  browser?: string;
  timestamp: number;
}

export function AdminUsers() {
  const { t, i18n } = useTranslation();
  const { user: currentUser, allCourses, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [rawUsers, setRawUsers] = useState<Record<string, any>>({});
  const [publicProfiles, setPublicProfiles] = useState<Record<string, any>>({});
  const [userProgressMap, setUserProgressMap] = useState<Record<string, CourseProgressItem[]>>({});
  const [presenceList, setPresenceList] = useState<UserPresenceRecord[]>([]);
  const [movementLogs, setMovementLogs] = useState<PlatformMovementRecord[]>([]);
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'directory' | 'live_radar' | 'movements'>(
    'directory'
  );

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<
    'all' | 'online' | 'admin' | 'publisher' | 'student' | 'guest' | 'blocked'
  >('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<
    'all' | 'navigation' | 'learning' | 'graduations' | 'support'
  >('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [inspectingUser, setInspectingUser] = useState<AdminUserData | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  // Re-evaluate online status every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const loadAllRealTelemetry = async () => {
    try {
      const { presence, movements } = await fetchPlatformTelemetry();
      setPresenceList(presence);
      setMovementLogs(movements);
    } catch (e) {
      console.warn('Telemetry fetch warning:', e);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    loadAllRealTelemetry();

    // 1. Live listener on 'users'
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      async (snap) => {
        if (!isMounted) return;
        const uMap: Record<string, any> = {};
        const uids: string[] = [];
        snap.forEach((d) => {
          uMap[d.id] = { uid: d.id, ...d.data() };
          uids.push(d.id);
        });
        setRawUsers(uMap);
        setLoading(false);

        // Fetch each user's real course progress subcollection
        const progEntries = await Promise.all(
          uids.map(async (uid) => {
            try {
              const pSnap = await getDocs(collection(db, `users/${uid}/progress`));
              const list: CourseProgressItem[] = [];
              pSnap.forEach((docSnap) => list.push(docSnap.data() as CourseProgressItem));
              return [uid, list] as const;
            } catch {
              return [uid, []] as const;
            }
          })
        );
        if (isMounted) {
          const nextProg: Record<string, CourseProgressItem[]> = {};
          for (const [uid, list] of progEntries) {
            nextProg[uid] = list;
          }
          setUserProgressMap(nextProg);
        }
      },
      (err) => {
        console.error('Error listening to users:', err);
        if (isMounted) setLoading(false);
      }
    );

    // 2. Live listener on 'publicProfiles'
    const unsubProfiles = onSnapshot(
      collection(db, 'publicProfiles'),
      (snap) => {
        if (!isMounted) return;
        const pMap: Record<string, any> = {};
        snap.forEach((d) => {
          pMap[d.id] = { uid: d.id, ...d.data() };
        });
        setPublicProfiles(pMap);
      },
      () => {}
    );

    // 3. Live listener on 'user_presence'
    const unsubPresence = onSnapshot(
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
            const existing = map.get(item.id);
            if (!existing || (item.lastSeenAt || 0) >= (existing.lastSeenAt || 0)) {
              map.set(item.id, {
                ...existing,
                ...item,
                totalSecondsSpent: Math.max(
                  existing?.totalSecondsSpent || 0,
                  item.totalSecondsSpent || 0
                ),
                visitCount: Math.max(existing?.visitCount || 1, item.visitCount || 1),
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

    // 4. Live listener on 'platform_movements'
    const unsubMovements = onSnapshot(
      collection(db, 'platform_movements'),
      (snap) => {
        if (!isMounted) return;
        const fsMovements = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as PlatformMovementRecord),
        }));
        setMovementLogs((prev) => {
          const map = new Map<string, PlatformMovementRecord>();
          for (const item of [...prev, ...fsMovements]) {
            if (item && item.id) map.set(item.id, item);
          }
          return Array.from(map.values()).sort(
            (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
          );
        });
      },
      () => {}
    );

    // 5. Live listener on 'support_tickets' & 'reports' for unified platform activity
    const unsubTickets = onSnapshot(
      collection(db, 'support_tickets'),
      (snap) => {
        if (!isMounted) return;
        setTicketsList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => {}
    );

    const unsubReports = onSnapshot(
      collection(db, 'reports'),
      (snap) => {
        if (!isMounted) return;
        setReportsList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => {}
    );

    // Poll /api/telemetry every 15s for any guest sessions
    const apiPoll = setInterval(() => {
      if (isMounted) loadAllRealTelemetry();
    }, 15000);

    return () => {
      isMounted = false;
      unsubUsers();
      unsubProfiles();
      unsubPresence();
      unsubMovements();
      unsubTickets();
      unsubReports();
      clearInterval(apiPoll);
    };
  }, []);

  // Merge all real users + presence records
  const mergedUsers = useMemo<AdminUserData[]>(() => {
    const map = new Map<string, AdminUserData>();

    // 1. Add all registered users from 'users' & 'publicProfiles'
    const allUids = new Set([
      ...Object.keys(rawUsers),
      ...Object.keys(publicProfiles),
    ]);

    allUids.forEach((uid) => {
      const u = rawUsers[uid] || {};
      const p = publicProfiles[uid] || {};
      const prog = userProgressMap[uid] || [];
      const email = u.email || p.email || '';
      const displayName = u.displayName || p.displayName || (email ? email.split('@')[0] : 'Learner');
      const photoURL = u.photoURL || p.photoURL || '';
      const role = u.role || (isSuperAdminEmail(email) ? 'admin' : 'student');

      const completedCount = prog.filter((item) => item.isCompleted).length;
      const lessonsCompletedCount = prog.reduce(
        (acc, item) => acc + (item.completedVideoIds?.length || 0),
        0
      );

      // Estimate minimum authentic learning time if user completed lessons before live timer was added
      // (only if totalSecondsSpent is 0 but they have real completed lessons in Firestore)
      const recordedSeconds = Number(u.totalSecondsSpent) || 0;

      map.set(uid, {
        uid,
        isGuest: false,
        email,
        displayName,
        photoURL,
        role,
        xp: p.xp || 0,
        streak: p.streak || 1,
        enrolledCount: prog.length,
        completedCount,
        lessonsCompletedCount,
        progressList: prog,
        totalSecondsSpent: recordedSeconds,
        sessionSecondsSpent: Number(u.sessionSecondsSpent) || 0,
        visitCount: Number(u.visitCount) || (prog.length > 0 || p.xp > 0 ? 1 : 0),
        pagesVisitedCount: Number(u.pagesVisitedCount) || prog.length,
        firstVisitAt: u.createdAt || undefined,
        lastSeenAt: u.lastSeenAt || (p.lastActiveDate ? new Date(p.lastActiveDate).getTime() : undefined),
        currentPath: u.currentPath || '',
        currentPageLabel: u.currentPageLabel || '',
        deviceType: u.deviceType || 'Desktop',
        browser: u.browser || '',
        recentTrail: Array.isArray(u.recentTrail) ? u.recentTrail : [],
      });
    });

    // 2. Merge live 'user_presence' records (both logged-in users and real Guest Visitors)
    presenceList.forEach((pres) => {
      const targetId = pres.uid || pres.id;
      const existing = map.get(targetId);
      if (existing) {
        existing.totalSecondsSpent = Math.max(
          existing.totalSecondsSpent || 0,
          pres.totalSecondsSpent || 0
        );
        existing.sessionSecondsSpent = pres.sessionSecondsSpent || existing.sessionSecondsSpent || 0;
        existing.visitCount = Math.max(existing.visitCount || 1, pres.visitCount || 1);
        existing.pagesVisitedCount = Math.max(
          existing.pagesVisitedCount || 1,
          pres.pagesVisitedCount || 1
        );
        existing.lastSeenAt = Math.max(existing.lastSeenAt || 0, pres.lastSeenAt || 0);
        existing.firstVisitAt = existing.firstVisitAt || pres.firstVisitAt;
        existing.currentPath = pres.currentPath || existing.currentPath;
        existing.currentPageLabel = pres.currentPageLabel || existing.currentPageLabel;
        existing.deviceType = pres.deviceType || existing.deviceType;
        existing.browser = pres.browser || existing.browser;
        if (Array.isArray(pres.recentTrail) && pres.recentTrail.length > 0) {
          existing.recentTrail = pres.recentTrail;
        }
      } else {
        // Real Guest Visitor session
        map.set(targetId, {
          uid: targetId,
          isGuest: true,
          email: '',
          displayName: pres.displayName || (isRtl ? 'زائر (غير مسجل)' : 'Guest Visitor'),
          photoURL: '',
          role: 'guest',
          xp: 0,
          streak: 0,
          enrolledCount: 0,
          completedCount: 0,
          lessonsCompletedCount: 0,
          progressList: [],
          totalSecondsSpent: pres.totalSecondsSpent || 0,
          sessionSecondsSpent: pres.sessionSecondsSpent || 0,
          visitCount: pres.visitCount || 1,
          pagesVisitedCount: pres.pagesVisitedCount || 1,
          firstVisitAt: pres.firstVisitAt,
          lastSeenAt: pres.lastSeenAt,
          currentPath: pres.currentPath,
          currentPageLabel: pres.currentPageLabel,
          deviceType: pres.deviceType || 'Desktop',
          browser: pres.browser || 'Browser',
          recentTrail: Array.isArray(pres.recentTrail) ? pres.recentTrail : [],
        });
      }
    });

    // Sort: Online users first, then most recently seen, then highest XP
    return Array.from(map.values()).sort((a, b) => {
      const aOnline = isUserOnlineNow(a.lastSeenAt) ? 1 : 0;
      const bOnline = isUserOnlineNow(b.lastSeenAt) ? 1 : 0;
      if (bOnline !== aOnline) return bOnline - aOnline;
      if ((b.lastSeenAt || 0) !== (a.lastSeenAt || 0)) {
        return (b.lastSeenAt || 0) - (a.lastSeenAt || 0);
      }
      return (b.xp || 0) - (a.xp || 0);
    });
  }, [rawUsers, publicProfiles, userProgressMap, presenceList, nowTick, isRtl]);

  // Keep inspectingUser fresh if open
  const activeInspectingUser = useMemo(() => {
    if (!inspectingUser) return null;
    return mergedUsers.find((u) => u.uid === inspectingUser.uid) || inspectingUser;
  }, [mergedUsers, inspectingUser]);

  // Build 100% Real Unified Platform Events ("What Happened Inside Platform")
  const unifiedEvents = useMemo<UnifiedPlatformEvent[]>(() => {
    const events: UnifiedPlatformEvent[] = [];
    const courseTitleMap = new Map<string, string>();
    allCourses.forEach((c) => courseTitleMap.set(c.id, c.title));

    // A. Real-time navigation & action logs from platform_movements
    movementLogs.forEach((m) => {
      let category: UnifiedPlatformEvent['category'] = 'navigation';
      if (m.actionType === 'course_view') category = 'course_view';
      else if (m.actionType === 'lesson_completed') category = 'lesson_completed';
      else if (m.actionType === 'course_completed') category = 'graduation';
      else if (m.actionType === 'favorite_toggled') category = 'favorite';
      else if (m.actionType === 'support_ticket') category = 'support_ticket';

      events.push({
        id: m.id,
        uid: m.uid || m.visitorId,
        userName: m.userName || (isRtl ? 'زائر' : 'Guest Visitor'),
        userEmail: m.userEmail,
        userAvatar: m.userAvatar,
        isGuest: m.isGuest,
        category,
        title: m.pageTitle || m.path,
        detail: m.detail,
        path: m.path,
        deviceType: m.deviceType,
        browser: m.browser,
        timestamp: m.timestamp,
      });
    });

    // B. Historical & Live Course Progress Events from Firestore users/{uid}/progress
    mergedUsers.forEach((u) => {
      u.progressList.forEach((p) => {
        const cTitle = courseTitleMap.get(p.courseId) || p.courseId;
        if (p.isCompleted) {
          const ts = p.completionDate
            ? new Date(p.completionDate).getTime()
            : u.lastSeenAt || Date.now() - 3600000;
          events.push({
            id: `grad_${u.uid}_${p.courseId}`,
            uid: u.uid,
            userName: u.displayName || 'Learner',
            userEmail: u.email,
            userAvatar: u.photoURL,
            isGuest: false,
            category: 'graduation',
            title: cTitle,
            detail: isRtl
              ? `أتم جميع دروس الدورة وحصل على الشهادة المعتمدة`
              : `Completed 100% of "${cTitle}" and unlocked verified certificate`,
            path: `/course/${p.courseId}`,
            deviceType: u.deviceType,
            browser: u.browser,
            timestamp: ts,
          });
        } else if (p.completedVideoIds && p.completedVideoIds.length > 0) {
          const ts = u.lastSeenAt || Date.now() - 7200000;
          events.push({
            id: `prog_${u.uid}_${p.courseId}_${p.completedVideoIds.length}`,
            uid: u.uid,
            userName: u.displayName || 'Learner',
            userEmail: u.email,
            userAvatar: u.photoURL,
            isGuest: false,
            category: 'lesson_completed',
            title: cTitle,
            detail: isRtl
              ? `شاهد وأكمل ${p.completedVideoIds.length} درساً في دورة "${cTitle}"`
              : `Completed ${p.completedVideoIds.length} video lessons in "${cTitle}"`,
            path: `/course/${p.courseId}`,
            deviceType: u.deviceType,
            browser: u.browser,
            timestamp: ts,
          });
        }
      });
    });

    // C. Real Support Tickets opened by users
    ticketsList.forEach((tkt) => {
      events.push({
        id: `tkt_${tkt.id}`,
        uid: tkt.userId,
        userName: tkt.userName || 'Student',
        userEmail: tkt.userEmail,
        userAvatar: tkt.userAvatar,
        isGuest: false,
        category: 'support_ticket',
        title: `#${tkt.ticketNumber}: ${tkt.subject}`,
        detail: isRtl
          ? `فتح تذكرة دعم فني جديدة (${tkt.messages?.length || 1} رسائل)`
          : `Opened support ticket #${tkt.ticketNumber} (${tkt.messages?.length || 1} messages)`,
        path: '/support',
        timestamp: tkt.updatedAt || tkt.createdAt || Date.now(),
      });
    });

    // D. Real Broken Video / Issue Reports
    reportsList.forEach((rep) => {
      events.push({
        id: `rep_${rep.id}`,
        uid: rep.userId || rep.userEmail,
        userName: rep.userEmail ? rep.userEmail.split('@')[0] : 'Student',
        userEmail: rep.userEmail,
        isGuest: false,
        category: 'report',
        title: rep.courseTitle || rep.courseId || 'Course Report',
        detail: isRtl
          ? `أبلغ عن عطل في درس: "${rep.videoTitle || rep.issue || 'فيديو'}"`
          : `Reported issue on lesson: "${rep.videoTitle || rep.issue || 'Video'}"`,
        path: rep.courseId ? `/course/${rep.courseId}` : '/courses',
        timestamp: rep.createdAt || Date.now(),
      });
    });

    return events.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [movementLogs, mergedUsers, ticketsList, reportsList, allCourses, isRtl]);

  // Platform Summary Metrics (100% Real)
  const stats = useMemo(() => {
    const registeredUsers = mergedUsers.filter((u) => !u.isGuest);
    const guestVisitors = mergedUsers.filter((u) => u.isGuest);
    const onlineUsers = mergedUsers.filter((u) => isUserOnlineNow(u.lastSeenAt));
    const totalSecondsAllUsers = mergedUsers.reduce(
      (acc, u) => acc + (u.totalSecondsSpent || 0),
      0
    );
    const totalVisitsCount = mergedUsers.reduce(
      (acc, u) => acc + Math.max(1, u.visitCount || 0),
      0
    );
    const totalPagesViewed = mergedUsers.reduce(
      (acc, u) => acc + (u.pagesVisitedCount || 0),
      0
    );
    const activeWithTime = mergedUsers.filter((u) => (u.totalSecondsSpent || 0) > 0).length;
    const avgSecondsPerActiveUser =
      activeWithTime > 0 ? Math.round(totalSecondsAllUsers / activeWithTime) : 0;

    return {
      totalVisitors: mergedUsers.length,
      registeredCount: registeredUsers.length,
      guestCount: guestVisitors.length,
      onlineNowCount: onlineUsers.length,
      totalSecondsAllUsers,
      avgSecondsPerActiveUser,
      totalVisitsCount,
      totalPagesViewed,
      totalMovements: unifiedEvents.length,
    };
  }, [mergedUsers, unifiedEvents, nowTick]);

  const filteredUsers = useMemo(() => {
    return mergedUsers.filter((u) => {
      if (roleFilter === 'online' && !isUserOnlineNow(u.lastSeenAt)) return false;
      if (roleFilter === 'guest' && !u.isGuest) return false;
      if (
        roleFilter !== 'all' &&
        roleFilter !== 'online' &&
        roleFilter !== 'guest' &&
        u.role !== roleFilter
      ) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = (u.displayName || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchUid = (u.uid || '').toLowerCase().includes(q);
        const matchPage = (u.currentPageLabel || u.currentPath || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchUid && !matchPage) return false;
      }
      return true;
    });
  }, [mergedUsers, roleFilter, search, nowTick]);

  const filteredEvents = useMemo(() => {
    return unifiedEvents.filter((ev) => {
      if (selectedUserFilter !== 'all' && ev.uid !== selectedUserFilter) return false;
      if (movementTypeFilter === 'navigation' && ev.category !== 'navigation' && ev.category !== 'course_view')
        return false;
      if (movementTypeFilter === 'learning' && ev.category !== 'lesson_completed' && ev.category !== 'course_view')
        return false;
      if (movementTypeFilter === 'graduations' && ev.category !== 'graduation') return false;
      if (
        movementTypeFilter === 'support' &&
        ev.category !== 'support_ticket' &&
        ev.category !== 'report'
      )
        return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const mUser = (ev.userName || '').toLowerCase().includes(q);
        const mEmail = (ev.userEmail || '').toLowerCase().includes(q);
        const mTitle = (ev.title || '').toLowerCase().includes(q);
        const mDetail = (ev.detail || '').toLowerCase().includes(q);
        if (!mUser && !mEmail && !mTitle && !mDetail) return false;
      }
      return true;
    });
  }, [unifiedEvents, selectedUserFilter, movementTypeFilter, search]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUser?.uid && newRole !== 'admin') {
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (err: any) {
      console.error('Failed to update user role:', err);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail?: string, isGuest?: boolean) => {
    if (isSuperAdminEmail(userEmail)) return;
    if (
      !window.confirm(
        isRtl
          ? 'هل أنت متأكد من حذف هذا المستخدم وبياناته نهائياً؟'
          : 'Are you sure you want to permanently delete this user record?'
      )
    ) {
      return;
    }

    try {
      if (!isGuest) {
        await deleteDoc(doc(db, 'users', userId));
        try {
          await deleteDoc(doc(db, 'publicProfiles', userId));
        } catch {}
      }
      try {
        await deleteDoc(doc(db, 'user_presence', userId));
      } catch {}
      setPresenceList((prev) => prev.filter((p) => p.id !== userId && p.uid !== userId));
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadAllRealTelemetry();
    setTimeout(() => setRefreshing(false), 400);
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      let csv =
        '\uFEFFUser ID,Type,Display Name,Email,Role,Status,Time Spent (Seconds),Time Spent (Formatted),Visits Count,Pages Viewed,Current Page,Last Seen,XP,Streak,Enrolled Courses,Completed Courses\n';
      mergedUsers.forEach((u) => {
        const safeName = (u.displayName || 'Unknown').replace(/"/g, '""');
        const safeEmail = (u.email || '').replace(/"/g, '""');
        const safePage = (u.currentPageLabel || u.currentPath || '').replace(/"/g, '""');
        const onlineStr = isUserOnlineNow(u.lastSeenAt) ? 'ONLINE NOW' : 'Offline';
        const lastSeenStr = u.lastSeenAt ? new Date(u.lastSeenAt).toISOString() : '';
        csv += `"${u.uid}","${u.isGuest ? 'Guest' : 'Registered'}","${safeName}","${safeEmail}","${
          u.role || 'student'
        }","${onlineStr}",${u.totalSecondsSpent || 0},"${formatDurationSpent(
          u.totalSecondsSpent,
          false
        )}",${u.visitCount || 1},${u.pagesVisitedCount || 0},"${safePage}","${lastSeenStr}",${
          u.xp || 0
        },${u.streak || 0},${u.enrolledCount || 0},${u.completedCount || 0}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `SkilliQ_Users_And_Real_Activity_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  };

  const formatRelativeAgo = (ts?: number) => {
    if (!ts) return isRtl ? 'لم يسجل نشاط بعد' : 'No recent ping';
    const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (diffSec < 45) return isRtl ? 'متصل الآن' : 'Just now';
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return isRtl ? `منذ ${mins} د` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return isRtl ? `منذ ${hours} س` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return isRtl ? `منذ ${days} يوم` : `${days}d ago`;
  };

  const renderDeviceIcon = (device?: string) => {
    if (device === 'Mobile') return <Smartphone className="w-3.5 h-3.5 text-primary" />;
    if (device === 'Tablet') return <Tablet className="w-3.5 h-3.5 text-indigo-500" />;
    return <Monitor className="w-3.5 h-3.5 text-emerald-500" />;
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">
      {/* 1. HEADER & REAL-TIME STATUS BANNER */}
      <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-primary to-indigo-500" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="text-start">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {isRtl
                  ? 'تتبع حي وحقيقي 100% للزوار والوقت والحركات'
                  : '100% Real-Time Visitor, Time Spent & Movement Radar'}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                • {stats.onlineNowCount} {isRtl ? 'متصل الآن' : 'Online Now'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-primary" />
              <span>
                {isRtl
                  ? 'إدارة المستخدمين وتتبع الزيارات والوقت والحركات الحية'
                  : 'Users, Real Visits, Time Spent & Live Platform Movements'}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isRtl
                ? 'راقب في الوقت الفعلي عدد زوار المنصة، المدة الزمنية الحقيقية التي يقضيها كل مستخدم، الصفحات التي يتصفحها الآن، وكل حركة تحدث داخل المنصة.'
                : 'Monitor real platform visitors, exact active time spent per user, live pages being viewed right now, and every real movement across the platform.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={handleManualRefresh}
              className="px-3.5 py-2 rounded-xl bg-muted/70 hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 border border-border transition-all cursor-pointer"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-primary', refreshing && 'animate-spin')} />
              <span>{isRtl ? 'تحديث فوري' : 'Sync Live'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExporting || mergedUsers.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>
                {isExporting
                  ? isRtl
                    ? 'جاري التصدير...'
                    : 'Exporting...'
                  : isRtl
                  ? 'تصدير تقرير المستخدمين والوقت (CSV)'
                  : 'Export Users & Time Report (CSV)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Online Right Now */}
        <div className="bg-card border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xs text-start">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {isRtl ? 'متواجدون الآن داخل المنصة' : 'Online Inside Platform Now'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.onlineNowCount}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {isRtl ? 'مستخدم / زائر نشط حالياً' : 'active right now'}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{isRtl ? 'نبض الاتصال المباشر' : 'Live Heartbeat Window'}:</span>
            <span className="font-mono font-bold text-foreground">15s Real-Time</span>
          </div>
        </div>

        {/* Card 2: Total Platform Visitors & Registered Users */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs text-start">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {isRtl ? 'إجمالي زوار ومستخدمي المنصة' : 'Total Platform Visitors'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.totalVisitors}
            </span>
            <span className="text-xs text-muted-foreground">
              ({stats.registeredCount} {isRtl ? 'مسجل' : 'registered'} • {stats.guestCount}{' '}
              {isRtl ? 'زائر' : 'guests'})
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{isRtl ? 'إجمالي مرات الزيارة (Sessions)' : 'Total Platform Visits'}:</span>
            <span className="font-bold text-foreground">{stats.totalVisitsCount}</span>
          </div>
        </div>

        {/* Card 3: Real Time Spent Inside Platform */}
        <div className="bg-card border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xs text-start">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {isRtl ? 'الوقت الفعلي المقضي بالمنصة' : 'Real Time Spent on Platform'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {formatDurationSpent(stats.totalSecondsAllUsers, isRtl)}
            </span>
            <span className="text-xs text-muted-foreground">
              {isRtl ? 'إجمالي الوقت النشط' : 'total active time'}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{isRtl ? 'متوسط وقت الجلسة للمستخدم' : 'Avg Time per Active User'}:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {formatDurationSpent(stats.avgSecondsPerActiveUser, isRtl)}
            </span>
          </div>
        </div>

        {/* Card 4: Total Page Views & Real Movements */}
        <div className="bg-card border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-xs text-start">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">
              {isRtl ? 'حركات المنصة وتصفح الصفحات' : 'Tracked Movements & Views'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.totalMovements}
            </span>
            <span className="text-xs text-muted-foreground">
              {isRtl ? 'حركة مسجلة' : 'real events'}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{isRtl ? 'إجمالي الصفحات المتصفحة' : 'Total Pages Navigated'}:</span>
            <span className="font-bold text-foreground">{stats.totalPagesViewed}</span>
          </div>
        </div>
      </div>

      {/* 3. SUB-NAVIGATION TABS INSIDE USERS SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/80 p-2 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubView('directory')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer',
              activeSubView === 'directory'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Users className="w-4 h-4" />
            <span>
              {isRtl
                ? 'المستخدمون والزوار والوقت المقضي'
                : 'Users, Visits & Time Spent'}
            </span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px]',
                activeSubView === 'directory'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {mergedUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('live_radar')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer',
              activeSubView === 'live_radar'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Radio className="w-4 h-4" />
            <span>
              {isRtl
                ? 'الرادار الحي (أين يتواجد المستخدمون الآن)'
                : 'Live Visitor Radar (Where Users Are Now)'}
            </span>
            {stats.onlineNowCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-black">
                {stats.onlineNowCount} {isRtl ? 'متصل' : 'LIVE'}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('movements')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer',
              activeSubView === 'movements'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Activity className="w-4 h-4" />
            <span>
              {isRtl
                ? 'سجل الحركات الفوري (ماذا يحدث داخل المنصة)'
                : 'Live Platform Movement Stream (What Happened)'}
            </span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px]',
                activeSubView === 'movements'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {unifiedEvents.length}
            </span>
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS TOOLBAR */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5" />
          <input
            type="text"
            placeholder={
              isRtl
                ? 'ابحث بالاسم، البريد الإلكتروني، الصفحة الحالية، أو النشاط...'
                : 'Search by user name, email, current page, or activity...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 bg-card border border-border/80 rounded-2xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
          />
        </div>

        {activeSubView !== 'movements' ? (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
            {(
              [
                { id: 'all', labelEn: 'All Visitors & Users', labelAr: 'الكل' },
                { id: 'online', labelEn: 'Online Now', labelAr: 'متصل الآن' },
                { id: 'student', labelEn: 'Students', labelAr: 'الطلاب' },
                { id: 'guest', labelEn: 'Guest Visitors', labelAr: 'زوار غير مسجلين' },
                { id: 'admin', labelEn: 'Admins', labelAr: 'المشرفون' },
                { id: 'publisher', labelEn: 'Publishers', labelAr: 'الناشرون' },
                { id: 'blocked', labelEn: 'Blocked', labelAr: 'المحظورون' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs shrink-0',
                  roleFilter === tab.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
                )}
              >
                {isRtl ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {/* User Filter Dropdown for Movements */}
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-card border border-border/80 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="all">
                {isRtl ? '🌐 جميع المستخدمين والزوار' : '🌐 All Users & Visitors'}
              </option>
              {mergedUsers.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName} {u.email ? `(${u.email})` : ''}
                </option>
              ))}
            </select>

            {(
              [
                { id: 'all', labelEn: 'All Events', labelAr: 'كل الحركات' },
                { id: 'navigation', labelEn: 'Page Visits', labelAr: 'تصفح الصفحات' },
                { id: 'learning', labelEn: 'Lessons & Courses', labelAr: 'مشاهدة الدروس' },
                { id: 'graduations', labelEn: 'Certificates', labelAr: 'الشهادات' },
                { id: 'support', labelEn: 'Tickets & Reports', labelAr: 'التذاكر والبلاغات' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setMovementTypeFilter(f.id)}
                className={cn(
                  'px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs shrink-0',
                  movementTypeFilter === f.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
                )}
              >
                {isRtl ? f.labelAr : f.labelEn}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================
          VIEW 1: USERS, VISITS & TIME SPENT DIRECTORY
         ========================================================= */}
      {activeSubView === 'directory' && (
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 text-muted-foreground gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-semibold">
                {isRtl
                  ? 'جاري تحميل بيانات المستخدمين والزيارات الحقيقية...'
                  : 'Loading real users, visits, and time spent telemetry...'}
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border/80 p-6">
              <UserX className="w-10 h-10 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-sm font-bold text-foreground">
                {isRtl ? 'لا يوجد مستخدمون مطابقون للبحث' : 'No matching users or visitors found'}
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-xs">
              {/* DESKTOP & TABLET TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/80">
                    <tr>
                      <th className="px-5 py-3.5 text-start">
                        {isRtl ? 'المستخدم / الحالة' : 'User & Live Status'}
                      </th>
                      <th className="px-4 py-3.5 text-start">
                        {isRtl ? 'الوقت المقضي والزيارات' : 'Time Spent & Visits'}
                      </th>
                      <th className="px-4 py-3.5 text-start">
                        {isRtl ? 'الصفحة الحالية / آخر حركة' : 'Current Page / Last Movement'}
                      </th>
                      <th className="px-4 py-3.5 text-center">
                        {isRtl ? 'التقدم الدراسي' : 'Learning Progress'}
                      </th>
                      <th className="px-4 py-3.5 text-start">{isRtl ? 'الصلاحية' : 'Role'}</th>
                      <th className="px-5 py-3.5 text-end">{isRtl ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredUsers.map((u) => {
                      const isAdminUser = isSuperAdminEmail(u.email);
                      const online = isUserOnlineNow(u.lastSeenAt);

                      return (
                        <tr
                          key={u.uid}
                          className={cn(
                            'hover:bg-muted/30 transition-colors',
                            online && 'bg-emerald-500/[0.03]'
                          )}
                        >
                          {/* User Info & Online Status */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                {u.photoURL ? (
                                  <img
                                    src={u.photoURL}
                                    alt=""
                                    className="w-10 h-10 rounded-full border border-border object-cover bg-muted"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-primary/15 text-primary font-black text-sm flex items-center justify-center border border-primary/20">
                                    {(u.displayName || 'U').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span
                                  className={cn(
                                    'absolute -bottom-0.5 -end-0.5 w-3.5 h-3.5 rounded-full border-2 border-card',
                                    online ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-600'
                                  )}
                                  title={online ? 'Online Now' : 'Offline'}
                                />
                              </div>

                              <div className="min-w-0 text-start">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-foreground truncate max-w-[170px]">
                                    {u.displayName || 'Learner'}
                                  </span>
                                  {online && (
                                    <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                      {isRtl ? 'متصل الآن' : 'LIVE NOW'}
                                    </span>
                                  )}
                                  {u.isGuest && (
                                    <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold uppercase bg-muted text-muted-foreground border border-border">
                                      {isRtl ? 'زائر' : 'Guest'}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] font-mono text-muted-foreground truncate block max-w-[200px]">
                                  {u.email || u.uid}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                  {renderDeviceIcon(u.deviceType)}
                                  <span>
                                    {u.deviceType || 'Desktop'}
                                    {u.browser ? ` • ${u.browser}` : ''} •{' '}
                                    {formatRelativeAgo(u.lastSeenAt)}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Time Spent & Visits */}
                          <td className="px-4 py-3.5 text-start">
                            <div className="space-y-1">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-extrabold text-xs">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{formatDurationSpent(u.totalSecondsSpent, isRtl)}</span>
                              </div>
                              <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                                <span>
                                  <strong className="text-foreground">{u.visitCount || 1}</strong>{' '}
                                  {isRtl ? 'زيارات' : 'visits'}
                                </span>
                                <span>•</span>
                                <span>
                                  <strong className="text-foreground">
                                    {u.pagesVisitedCount || 0}
                                  </strong>{' '}
                                  {isRtl ? 'صفحة' : 'pages'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Current Page / Last Movement */}
                          <td className="px-4 py-3.5 text-start">
                            {u.currentPageLabel || u.currentPath ? (
                              <div className="space-y-1 max-w-[240px]">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground truncate">
                                  <Compass className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span className="truncate">
                                    {u.currentPageLabel || u.currentPath}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-muted-foreground truncate block">
                                  {u.currentPath}
                                </span>
                              </div>
                            ) : u.progressList.length > 0 ? (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-bold text-foreground block">
                                  {isRtl ? 'يتابع الدورات التدريبية' : 'Active in Courses'}
                                </span>
                                <span className="text-[10px]">
                                  {u.lessonsCompletedCount}{' '}
                                  {isRtl ? 'درس مكتمل' : 'lessons completed'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* Learning Progress & XP */}
                          <td className="px-4 py-3.5 text-center">
                            <div className="inline-flex flex-col items-center gap-1">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-primary">
                                  {(u.xp || 0).toLocaleString()} XP
                                </span>
                                <span className="text-orange-500 font-bold">
                                  • {u.streak || 1}d
                                </span>
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {u.enrolledCount} {isRtl ? 'دورات' : 'courses'} •{' '}
                                <span className="text-emerald-500 font-bold">
                                  {u.completedCount} {isRtl ? 'شهادات' : 'certs'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Role Selector */}
                          <td className="px-4 py-3.5 text-start">
                            {u.isGuest ? (
                              <span className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-[11px] font-bold">
                                {isRtl ? 'زائر' : 'Guest'}
                              </span>
                            ) : (
                              <select
                                value={u.role || 'student'}
                                onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                                disabled={isAdminUser}
                                className="bg-card border border-border/80 text-foreground px-2.5 py-1.5 rounded-lg text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer disabled:opacity-50"
                              >
                                <option value="student">Student</option>
                                <option value="publisher">Publisher</option>
                                <option value="admin">Admin</option>
                                <option value="blocked">Blocked</option>
                              </select>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-end">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInspectingUser(u)}
                                className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                title={
                                  isRtl
                                    ? 'معاينة سجل حركات المستخدم والوقت بالتفصيل'
                                    : 'Inspect full user movements & time spent'
                                }
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{isRtl ? 'سجل الحركة' : 'Movements'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.uid, u.email, u.isGuest)}
                                disabled={isAdminUser}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-30 cursor-pointer"
                                title={isRtl ? 'حذف' : 'Delete'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden divide-y divide-border/60">
                {filteredUsers.map((u) => {
                  const isAdminUser = isSuperAdminEmail(u.email);
                  const online = isUserOnlineNow(u.lastSeenAt);

                  return (
                    <div key={u.uid} className="p-4 space-y-3 text-start">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            {u.photoURL ? (
                              <img
                                src={u.photoURL}
                                alt=""
                                className="w-10 h-10 rounded-full border border-border object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/15 text-primary font-black flex items-center justify-center">
                                {(u.displayName || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span
                              className={cn(
                                'absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full border-2 border-card',
                                online ? 'bg-emerald-500' : 'bg-zinc-400'
                              )}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-foreground truncate">
                                {u.displayName}
                              </span>
                              {online && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-500">
                                  LIVE
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground truncate block">
                              {u.email || u.uid}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setInspectingUser(u)}
                            className="px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{isRtl ? 'الحركات' : 'Journey'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.uid, u.email, u.isGuest)}
                            disabled={isAdminUser}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/60 text-[11px]">
                        <div>
                          <span className="text-muted-foreground block text-[10px]">
                            {isRtl ? 'الوقت المقضي:' : 'Time Spent:'}
                          </span>
                          <span className="font-extrabold text-amber-600 dark:text-amber-400">
                            {formatDurationSpent(u.totalSecondsSpent, isRtl)} ({u.visitCount || 1}{' '}
                            {isRtl ? 'زيارة' : 'visits'})
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">
                            {isRtl ? 'الصفحة الحالية:' : 'Current Page:'}
                          </span>
                          <span className="font-bold text-foreground truncate block">
                            {u.currentPageLabel || u.currentPath || formatRelativeAgo(u.lastSeenAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================
          VIEW 2: LIVE VISITOR RADAR (WHERE USERS ARE RIGHT NOW)
         ========================================================= */}
      {activeSubView === 'live_radar' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((u) => {
            const online = isUserOnlineNow(u.lastSeenAt);
            const trail = Array.isArray(u.recentTrail) ? u.recentTrail.slice(0, 5) : [];

            return (
              <div
                key={u.uid}
                className={cn(
                  'bg-card border rounded-3xl p-5 space-y-4 shadow-xs text-start transition-all',
                  online ? 'border-emerald-500/40 bg-emerald-500/[0.02]' : 'border-border/80'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {u.photoURL ? (
                        <img
                          src={u.photoURL}
                          alt=""
                          className="w-11 h-11 rounded-2xl object-cover border border-border"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-primary/15 text-primary font-black flex items-center justify-center">
                          {(u.displayName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={cn(
                          'absolute -bottom-1 -end-1 w-3.5 h-3.5 rounded-full border-2 border-card',
                          online ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                        )}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-black text-foreground truncate">
                          {u.displayName}
                        </h4>
                        {online ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-white">
                            {isRtl ? 'متصل الآن' : 'ONLINE'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelativeAgo(u.lastSeenAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground truncate">
                        {u.email || (isRtl ? 'زائر مباشر' : 'Direct Visitor')}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setInspectingUser(u)}
                    className="p-2 rounded-xl bg-muted hover:bg-primary/15 hover:text-primary text-muted-foreground transition-colors cursor-pointer shrink-0"
                    title={isRtl ? 'تفاصيل الحركة' : 'Full Journey'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Time & Visits Strip */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-muted/40 border border-border/60 text-center">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      {isRtl ? 'إجمالي الوقت' : 'Total Time'}
                    </span>
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                      {formatDurationSpent(u.totalSecondsSpent, isRtl)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      {isRtl ? 'عدد الزيارات' : 'Visits'}
                    </span>
                    <span className="text-xs font-black text-foreground">{u.visitCount || 1}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      {isRtl ? 'الصفحات' : 'Pages'}
                    </span>
                    <span className="text-xs font-black text-primary">
                      {u.pagesVisitedCount || 1}
                    </span>
                  </div>
                </div>

                {/* Current Active Location */}
                <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    {online
                      ? isRtl
                        ? 'يتصفح الآن:'
                        : 'Currently Viewing:'
                      : isRtl
                      ? 'آخر صفحة تمت زيارتها:'
                      : 'Last Visited Page:'}
                  </span>
                  <p className="text-xs font-bold text-foreground truncate">
                    {u.currentPageLabel || u.currentPath || (isRtl ? 'الصفحة الرئيسية' : 'Home Page')}
                  </p>
                  {u.currentPath && (
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      {u.currentPath}
                    </p>
                  )}
                </div>

                {/* Recent Breadcrumb Trail */}
                {trail.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      {isRtl ? 'مسار تنقل المستخدم الأخير:' : 'Recent Navigation Trail:'}
                    </span>
                    <div className="space-y-1">
                      {trail.slice(0, 3).map((tItem, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 text-[11px] px-2.5 py-1.5 rounded-xl bg-muted/30 border border-border/50"
                        >
                          <span className="truncate font-medium text-foreground/90">
                            {tItem.label || tItem.path}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                            {formatRelativeAgo(tItem.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================
          VIEW 3: REAL-TIME PLATFORM MOVEMENT STREAM ("WHAT HAPPENED")
         ========================================================= */}
      {activeSubView === 'movements' && (
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="text-base sm:text-lg font-black text-foreground">
                {isRtl
                  ? 'السجل الحي لجميع حركات وأحداث المنصة'
                  : 'Real-Time Stream of Everything Happening Inside Platform'}
              </h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {filteredEvents.length} {isRtl ? 'حركة حقيقية' : 'real events'}
            </span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <Compass className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-sm font-bold text-foreground">
                {isRtl ? 'لا توجد حركات مطابقة للفلتر الحالي' : 'No platform movements match filter'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60 max-h-[680px] overflow-y-auto">
              {filteredEvents.slice(0, 150).map((ev) => {
                let badgeColor = 'bg-blue-500/15 text-blue-500 border-blue-500/30';
                let IconComp = Compass;
                if (ev.category === 'graduation') {
                  badgeColor = 'bg-amber-500/15 text-amber-500 border-amber-500/30';
                  IconComp = Award;
                } else if (ev.category === 'lesson_completed') {
                  badgeColor = 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
                  IconComp = CheckCircle2;
                } else if (ev.category === 'course_view') {
                  badgeColor = 'bg-primary/15 text-primary border-primary/30';
                  IconComp = PlayCircle;
                } else if (ev.category === 'favorite') {
                  badgeColor = 'bg-rose-500/15 text-rose-500 border-rose-500/30';
                  IconComp = Heart;
                } else if (ev.category === 'support_ticket') {
                  badgeColor = 'bg-purple-500/15 text-purple-500 border-purple-500/30';
                  IconComp = LifeBuoy;
                } else if (ev.category === 'report') {
                  badgeColor = 'bg-orange-500/15 text-orange-500 border-orange-500/30';
                  IconComp = AlertTriangle;
                }

                return (
                  <div
                    key={ev.id}
                    className="py-3.5 px-2 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-start"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5',
                          badgeColor
                        )}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-foreground">
                            {ev.userName}
                          </span>
                          {ev.userEmail && (
                            <span className="text-[11px] font-mono text-muted-foreground">
                              ({ev.userEmail})
                            </span>
                          )}
                          <span className="text-xs font-bold text-primary">• {ev.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{ev.detail}</p>
                        {ev.path && (
                          <span className="text-[10px] font-mono text-muted-foreground/80">
                            {ev.path} {ev.deviceType ? `• ${ev.deviceType}` : ''}{' '}
                            {ev.browser ? `(${ev.browser})` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-muted-foreground shrink-0 self-end sm:self-center">
                      {formatRelativeAgo(ev.timestamp)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          MODAL: FULL USER JOURNEY, TIME SPENT & MOVEMENT INSPECTOR
         ========================================================= */}
      {activeInspectingUser && (
        <div
          onClick={() => setInspectingUser(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6 text-start max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  {activeInspectingUser.photoURL ? (
                    <img
                      src={activeInspectingUser.photoURL}
                      alt=""
                      className="w-14 h-14 rounded-2xl object-cover border border-border"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary font-black text-xl flex items-center justify-center">
                      {(activeInspectingUser.displayName || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span
                    className={cn(
                      'absolute -bottom-1 -end-1 w-4 h-4 rounded-full border-2 border-card',
                      isUserOnlineNow(activeInspectingUser.lastSeenAt)
                        ? 'bg-emerald-500'
                        : 'bg-zinc-400'
                    )}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-foreground">
                      {activeInspectingUser.displayName}
                    </h3>
                    {isUserOnlineNow(activeInspectingUser.lastSeenAt) && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white">
                        {isRtl ? 'متصل الآن' : 'ONLINE NOW'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">
                    {activeInspectingUser.email || activeInspectingUser.uid}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary KPI Grid for this User */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">
                  {isRtl ? 'الوقت الكلي بالمنصة' : 'Total Time Spent'}
                </span>
                <span className="text-lg font-black text-foreground">
                  {formatDurationSpent(activeInspectingUser.totalSecondsSpent, isRtl)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  {isRtl ? 'عدد الزيارات والصفحات' : 'Visits & Pages'}
                </span>
                <span className="text-lg font-black text-foreground">
                  {activeInspectingUser.visitCount || 1} {isRtl ? 'زيارة' : 'visits'} •{' '}
                  {activeInspectingUser.pagesVisitedCount || 0} {isRtl ? 'صفحة' : 'pages'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/25">
                <span className="text-[10px] font-bold uppercase text-primary block">
                  {isRtl ? 'الدروس المكتملة' : 'Completed Lessons'}
                </span>
                <span className="text-lg font-black text-foreground">
                  {activeInspectingUser.lessonsCompletedCount}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">
                  {isRtl ? 'الشهادات والنقاط' : 'Certs & XP'}
                </span>
                <span className="text-lg font-black text-foreground">
                  {activeInspectingUser.completedCount} • {activeInspectingUser.xp || 0} XP
                </span>
              </div>
            </div>

            {/* Current Page Info */}
            {activeInspectingUser.currentPageLabel && (
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Navigation className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-primary block">
                      {isRtl ? 'الصفحة الحالية / الأخيرة:' : 'Current / Last Active Page:'}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-foreground">
                      {activeInspectingUser.currentPageLabel} ({activeInspectingUser.currentPath})
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  {formatRelativeAgo(activeInspectingUser.lastSeenAt)}
                </span>
              </div>
            )}

            {/* Recent Page Navigation Trail */}
            {activeInspectingUser.recentTrail && activeInspectingUser.recentTrail.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  {isRtl
                    ? 'مسار الصفحات التي زارها المستخدم مؤخراً (خطوة بخطوة)'
                    : 'Step-by-Step Recent Page Navigation Trail'}
                </h4>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {activeInspectingUser.recentTrail.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-primary/15 text-primary font-black text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-foreground truncate">{item.label}</span>
                        <span className="text-[11px] font-mono text-muted-foreground truncate">
                          ({item.path})
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                        {formatRelativeAgo(item.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enrolled Courses & Progress */}
            {activeInspectingUser.progressList.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  {isRtl ? 'تفصيل تقدم المستخدم في الدورات' : 'Enrolled Courses & Lesson Progress'}
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activeInspectingUser.progressList.map((prog) => {
                    const courseObj = allCourses.find((c) => c.id === prog.courseId);
                    const totalVids = courseObj?.videos?.length || 1;
                    const doneVids = prog.completedVideoIds?.length || 0;
                    const pct = Math.min(100, Math.round((doneVids / totalVids) * 100));

                    return (
                      <div
                        key={prog.courseId}
                        className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-foreground">
                            {courseObj?.title || prog.courseId}
                          </span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-md text-[10px] font-black',
                              prog.isCompleted
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : 'bg-primary/15 text-primary'
                            )}
                          >
                            {prog.isCompleted
                              ? isRtl
                                ? 'مكتملة 100%'
                                : 'Completed'
                              : `${doneVids}/${totalVids} (${pct}%)`}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              prog.isCompleted ? 'bg-emerald-500' : 'bg-primary'
                            )}
                            style={{ width: `${prog.isCompleted ? 100 : pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
