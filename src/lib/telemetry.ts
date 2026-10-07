import {
  collection,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface PresenceTrailItem {
  path: string;
  label: string;
  timestamp: number;
}

export interface UserPresenceRecord {
  id: string;
  uid?: string | null;
  isGuest: boolean;
  displayName: string;
  email: string;
  photoURL?: string;
  currentPath: string;
  currentPageLabel: string;
  deviceType: 'Desktop' | 'Tablet' | 'Mobile';
  browser: string;
  totalSecondsSpent: number;
  sessionSecondsSpent: number;
  visitCount: number;
  pagesVisitedCount: number;
  firstVisitAt: number;
  lastSeenAt: number;
  recentTrail: PresenceTrailItem[];
}

export type PlatformActionType =
  | 'session_start'
  | 'page_view'
  | 'course_view'
  | 'lesson_completed'
  | 'course_completed'
  | 'favorite_toggled'
  | 'support_ticket';

export interface PlatformMovementRecord {
  id: string;
  visitorId: string;
  uid?: string | null;
  isGuest: boolean;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  actionType: PlatformActionType;
  path: string;
  pageTitle: string;
  detail: string;
  deviceType: 'Desktop' | 'Tablet' | 'Mobile';
  browser: string;
  timestamp: number;
}

const VISITOR_STORAGE_KEY = 'skilliq_real_visitor_id';
const TELEMETRY_STATS_KEY = 'skilliq_real_telemetry_stats';
const SESSION_ACTIVE_KEY = 'skilliq_active_session_started';

export function getOrCreateVisitorId(uid?: string | null): string {
  if (uid) return uid;
  try {
    let guestId = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem(VISITOR_STORAGE_KEY, guestId);
    }
    return guestId;
  } catch {
    return `guest_${Date.now()}`;
  }
}

export function detectDeviceType(): 'Desktop' | 'Tablet' | 'Mobile' {
  if (typeof window === 'undefined') return 'Desktop';
  const ua = navigator.userAgent || '';
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua)) {
    return 'Mobile';
  }
  if (window.innerWidth < 768) return 'Mobile';
  if (window.innerWidth < 1024) return 'Tablet';
  return 'Desktop';
}

export function detectBrowserName(): string {
  if (typeof navigator === 'undefined') return 'Browser';
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('Firefox/')) return 'Firefox';
  return 'Web Browser';
}

interface LocalTelemetryStats {
  firstVisitAt: number;
  totalSecondsSpent: number;
  visitCount: number;
  pagesVisitedCount: number;
  recentTrail: PresenceTrailItem[];
}

export function getLocalTelemetryStats(): LocalTelemetryStats {
  const now = Date.now();
  try {
    const raw = localStorage.getItem(TELEMETRY_STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        firstVisitAt: Number(parsed.firstVisitAt) || now,
        totalSecondsSpent: Number(parsed.totalSecondsSpent) || 0,
        visitCount: Number(parsed.visitCount) || 1,
        pagesVisitedCount: Number(parsed.pagesVisitedCount) || 1,
        recentTrail: Array.isArray(parsed.recentTrail) ? parsed.recentTrail : [],
      };
    }
  } catch {}
  return {
    firstVisitAt: now,
    totalSecondsSpent: 0,
    visitCount: 1,
    pagesVisitedCount: 1,
    recentTrail: [],
  };
}

export function saveLocalTelemetryStats(stats: LocalTelemetryStats): void {
  try {
    localStorage.setItem(TELEMETRY_STATS_KEY, JSON.stringify(stats));
  } catch {}
}

export function checkAndIncrementVisitSession(): boolean {
  try {
    const alreadyStarted = sessionStorage.getItem(SESSION_ACTIVE_KEY);
    if (!alreadyStarted) {
      sessionStorage.setItem(SESSION_ACTIVE_KEY, String(Date.now()));
      const stats = getLocalTelemetryStats();
      stats.visitCount = (stats.visitCount || 0) + 1;
      saveLocalTelemetryStats(stats);
      return true;
    }
  } catch {}
  return false;
}

export function resolvePageLabel(
  pathname: string,
  courses: { id: string; title: string }[] = [],
  books: { id: string; title: string }[] = [],
  paths: { id: string; title: string }[] = []
): string {
  if (pathname === '/' || pathname === '') return 'Home Page';
  if (pathname.startsWith('/course/')) {
    const courseId = decodeURIComponent(pathname.replace('/course/', '').split('/')[0]);
    const match = courses.find((c) => c.id === courseId);
    return match ? `Watching Course: ${match.title}` : `Course Player (${courseId})`;
  }
  if (pathname.startsWith('/path/')) {
    const pathId = decodeURIComponent(pathname.replace('/path/', '').split('/')[0]);
    const match = paths.find((p) => p.id === pathId);
    return match ? `Learning Path: ${match.title}` : `Learning Path (${pathId})`;
  }
  if (pathname.startsWith('/certificate/')) {
    return 'Viewing Certificate Document';
  }
  if (pathname.startsWith('/verify')) {
    return 'Certificate Verification Portal';
  }
  if (pathname.startsWith('/courses')) return 'Browsing Courses Catalog';
  if (pathname.startsWith('/masterclasses')) return 'Browsing Masterclasses';
  if (pathname.startsWith('/books')) return 'Browsing Video Books';
  if (pathname.startsWith('/paths')) return 'Browsing Learning Paths';
  if (pathname.startsWith('/community')) return 'Community Hub & Discussions';
  if (pathname.startsWith('/leaderboard')) return 'Student Leaderboard';
  if (pathname.startsWith('/dashboard')) return 'Student Profile & Dashboard';
  if (pathname.startsWith('/certificates')) return 'My Earned Certificates';
  if (pathname.startsWith('/support')) return 'Support Tickets & Help Desk';
  if (pathname.startsWith('/contact')) return 'Contact Us Page';
  if (pathname.startsWith('/about')) return 'About SkilliQ';
  if (pathname.startsWith('/creator')) return 'Creator Profile';
  if (pathname.startsWith('/admin')) return 'Admin Command Center';
  return pathname;
}

export async function syncUserPresence(record: UserPresenceRecord): Promise<void> {
  // 1. Send to backend /api/telemetry/presence (works for both guests and authenticated users)
  try {
    await fetch('/api/telemetry/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
  } catch {}

  // 2. Sync to Firestore user_presence collection & users/{uid} document
  try {
    await setDoc(doc(db, 'user_presence', record.id), record, { merge: true });
    if (record.uid) {
      await setDoc(
        doc(db, 'users', record.uid),
        {
          lastSeenAt: record.lastSeenAt,
          totalSecondsSpent: record.totalSecondsSpent,
          sessionSecondsSpent: record.sessionSecondsSpent,
          visitCount: record.visitCount,
          pagesVisitedCount: record.pagesVisitedCount,
          currentPath: record.currentPath,
          currentPageLabel: record.currentPageLabel,
          deviceType: record.deviceType,
          browser: record.browser,
          recentTrail: record.recentTrail,
        },
        { merge: true }
      );
    }
  } catch {}
}

export async function recordPlatformMovement(params: {
  uid?: string | null;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  actionType: PlatformActionType;
  path: string;
  pageTitle: string;
  detail: string;
}): Promise<void> {
  const now = Date.now();
  const visitorId = getOrCreateVisitorId(params.uid);
  const event: PlatformMovementRecord = {
    id: `mov_${now}_${Math.random().toString(36).substring(2, 7)}`,
    visitorId,
    uid: params.uid || null,
    isGuest: !params.uid,
    userName: params.userName || (params.uid ? 'Learner' : 'Guest Visitor'),
    userEmail: params.userEmail || '',
    userAvatar: params.userAvatar || '',
    actionType: params.actionType,
    path: params.path,
    pageTitle: params.pageTitle,
    detail: params.detail,
    deviceType: detectDeviceType(),
    browser: detectBrowserName(),
    timestamp: now,
  };

  try {
    await fetch('/api/telemetry/movement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch {}

  try {
    await setDoc(doc(db, 'platform_movements', event.id), event);
  } catch {}
}

export async function fetchPlatformTelemetry(): Promise<{
  presence: UserPresenceRecord[];
  movements: PlatformMovementRecord[];
}> {
  let apiPresence: UserPresenceRecord[] = [];
  let apiMovements: PlatformMovementRecord[] = [];

  try {
    const res = await fetch('/api/telemetry');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.presence)) apiPresence = data.presence;
      if (Array.isArray(data.movements)) apiMovements = data.movements;
    }
  } catch {}

  let fsPresence: UserPresenceRecord[] = [];
  let fsMovements: PlatformMovementRecord[] = [];

  try {
    const pSnap = await getDocs(collection(db, 'user_presence'));
    fsPresence = pSnap.docs.map((d) => ({ id: d.id, ...(d.data() as UserPresenceRecord) }));
  } catch {}

  try {
    const mSnap = await getDocs(collection(db, 'platform_movements'));
    fsMovements = mSnap.docs.map((d) => ({ id: d.id, ...(d.data() as PlatformMovementRecord) }));
  } catch {}

  const presenceMap = new Map<string, UserPresenceRecord>();
  for (const item of [...apiPresence, ...fsPresence]) {
    if (!item || !item.id) continue;
    const existing = presenceMap.get(item.id);
    if (!existing || (item.lastSeenAt || 0) >= (existing.lastSeenAt || 0)) {
      presenceMap.set(item.id, {
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

  const movementMap = new Map<string, PlatformMovementRecord>();
  for (const mov of [...apiMovements, ...fsMovements]) {
    if (!mov || !mov.id) continue;
    movementMap.set(mov.id, mov);
  }

  return {
    presence: Array.from(presenceMap.values()).sort(
      (a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0)
    ),
    movements: Array.from(movementMap.values()).sort(
      (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
    ),
  };
}

export function isUserOnlineNow(lastSeenAt?: number, thresholdMs = 95000): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - lastSeenAt <= thresholdMs;
}

export function formatDurationSpent(seconds?: number, isRtl = false): string {
  const totalSec = Math.max(0, Math.floor(seconds || 0));
  if (totalSec === 0) return isRtl ? 'أقل من دقيقة' : '< 1m';
  if (totalSec < 60) return isRtl ? `${totalSec} ثانية` : `${totalSec}s`;

  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hours > 0) {
    return isRtl
      ? `${hours} ساعة و ${mins} د`
      : `${hours}h ${mins}m`;
  }
  if (mins < 5 && secs > 0) {
    return isRtl ? `${mins} د ${secs} ث` : `${mins}m ${secs}s`;
  }
  return isRtl ? `${mins} دقيقة` : `${mins}m`;
}
