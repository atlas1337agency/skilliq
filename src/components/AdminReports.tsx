import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  writeBatch, 
  deleteDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useStore } from '../store/useStore';
import { CourseReport, Course } from '../data/courses';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Search, 
  ExternalLink, 
  Play, 
  RotateCcw, 
  Filter, 
  User, 
  Mail, 
  MessageSquare, 
  BookOpen, 
  Video, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  X, 
  RefreshCw,
  Edit,
  VolumeX,
  Lock,
  FileQuestion,
  HelpCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AdminReportsProps {
  onEditCourse?: (course: Course) => void;
}

function deduplicateReportsList(rawReports: CourseReport[]): CourseReport[] {
  const seenIds = new Set<string>();
  const seenFingerprints = new Set<string>();
  const deduplicated: CourseReport[] = [];

  for (const r of rawReports) {
    if (!r.id || seenIds.has(r.id)) continue;

    // Fingerprint based on video + user/email + rounded timestamp (within 2-minute window)
    const timeWindow = Math.floor((r.createdAt || 0) / 120000);
    const identifier = r.userId || r.userEmail || r.userName || 'unknown';
    const fingerprint = `${r.videoId}_${identifier}_${timeWindow}`;

    if (seenFingerprints.has(fingerprint)) {
      continue;
    }

    seenIds.add(r.id);
    seenFingerprints.add(fingerprint);
    deduplicated.push(r);
  }

  return deduplicated.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function AdminReports({ onEditCourse }: AdminReportsProps) {
  const { user, allCourses, language, loadContent } = useStore();
  const isRtl = language === 'ar';

  const [reports, setReports] = useState<CourseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [issueFilter, setIssueFilter] = useState<string>('all');
  const [previewVideo, setPreviewVideo] = useState<{ id: string; title: string; courseTitle: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<CourseReport | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load reports from API & subscribe to Firestore
  useEffect(() => {
    setLoading(true);

    const loadApiReports = async () => {
      try {
        const res = await fetch('/api/reports');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.reports)) {
            setReports((prev) => {
              const map = new Map<string, CourseReport>();
              data.reports.forEach((r: CourseReport) => map.set(r.id, r));
              prev.forEach((r) => map.set(r.id, { ...r, ...map.get(r.id) }));
              return deduplicateReportsList(Array.from(map.values()));
            });
            setLoading(false);
          }
        }
      } catch (err) {
        console.warn('API reports fetch warning:', err);
      }
    };

    loadApiReports();

    const reportsCol = collection(db, 'reports');
    const unsubscribe = onSnapshot(
      reportsCol,
      (snapshot) => {
        const reportList: CourseReport[] = [];
        snapshot.docs.forEach((d) => {
          reportList.push({ id: d.id, ...d.data() } as CourseReport);
        });
        setReports((prev) => {
          const map = new Map<string, CourseReport>();
          prev.forEach((r) => map.set(r.id, r));
          reportList.forEach((r) => map.set(r.id, r));
          return deduplicateReportsList(Array.from(map.values()));
        });
        setLoading(false);
      },
      (error) => {
        console.warn('Firestore reports listener warning:', error);
        loadApiReports();
      }
    );

    return () => unsubscribe();
  }, []);

  // Compute Metrics
  const metrics = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter((r) => r.status === 'pending').length;
    const resolved = reports.filter((r) => r.status === 'resolved').length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;
    return { total, pending, resolved, rate };
  }, [reports]);

  // Unique issues for filter dropdown
  const issueTypes = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.issue) set.add(r.issue);
    });
    return Array.from(set);
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (issueFilter !== 'all' && r.issue !== issueFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCourse = r.courseTitle?.toLowerCase().includes(q);
        const matchVideo = r.videoTitle?.toLowerCase().includes(q);
        const matchUser = r.userName?.toLowerCase().includes(q);
        const matchEmail = r.userEmail?.toLowerCase().includes(q);
        const matchIssue = r.issue?.toLowerCase().includes(q);
        const matchDetails = r.details?.toLowerCase().includes(q);
        const matchYt = r.youtubeId?.toLowerCase().includes(q);
        return matchCourse || matchVideo || matchUser || matchEmail || matchIssue || matchDetails || matchYt;
      }
      return true;
    });
  }, [reports, statusFilter, issueFilter, searchQuery]);

  // Resolve a report (and notify learner if registered)
  const handleResolve = async (report: CourseReport) => {
    setActionLoadingId(report.id);
    try {
      // 1. API resolve
      try {
        await fetch(`/api/reports/${report.id}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolvedBy: user?.email })
        });
      } catch (err) {
        console.warn('API resolve error:', err);
      }

      // 2. Firestore resolve & notification
      try {
        const q = query(
          collection(db, 'reports'),
          where('videoId', '==', report.videoId),
          where('status', '==', 'pending')
        );
        const snap = await getDocs(q);

        const batch = writeBatch(db);
        const userIdsNotified = new Set<string>();

        snap.docs.forEach((d, index) => {
          batch.update(d.ref, {
            status: 'resolved',
            resolvedAt: Date.now(),
            resolvedBy: user?.email || 'admin'
          });

          const data = d.data() as CourseReport;
          if (data.userId && data.userId !== 'guest' && data.userId !== 'anonymous' && !userIdsNotified.has(data.userId)) {
            userIdsNotified.add(data.userId);
            const newNotifRef = doc(collection(db, 'notifications'));
            batch.set(newNotifRef, {
              id: newNotifRef.id,
              title: isRtl ? 'تم إصلاح الفيديو المُبلّغ عنه!' : 'Broken Video Resolved!',
              message: isRtl 
                ? `تم فحص وتحديث درس "${data.videoTitle}" في دورة "${data.courseTitle}". شكراً لمساعدتك!`
                : `The video "${data.videoTitle}" in "${data.courseTitle}" has been inspected and updated. Thank you for reporting!`,
              targetUserId: data.userId,
              link: `/course/${data.courseId}`,
              createdAt: Date.now() + index,
              isActive: true
            });
          }
        });

        await batch.commit();
      } catch (err) {
        console.warn('Firestore resolve warning:', err);
      }

      // Optimistic local state update
      setReports(prev => prev.map(r => r.id === report.id || r.videoId === report.videoId ? { ...r, status: 'resolved', resolvedAt: Date.now() } : r));
      await loadContent();
    } catch (e) {
      console.error('Failed to resolve report:', e);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reopen a report
  const handleReopen = async (report: CourseReport) => {
    setActionLoadingId(report.id);
    try {
      try {
        await updateDoc(doc(db, 'reports', report.id), {
          status: 'pending'
        });
      } catch (err) {
        console.warn('Firestore reopen warning:', err);
      }
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'pending' } : r));
    } catch (e) {
      console.error('Failed to reopen report:', e);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete a report
  const confirmDelete = async () => {
    if (!deleteDialog) return;
    setIsDeleting(true);
    try {
      try {
        await fetch(`/api/reports/${deleteDialog.id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('API delete error:', err);
      }
      try {
        await deleteDoc(doc(db, 'reports', deleteDialog.id));
      } catch (err) {
        console.warn('Firestore delete error:', err);
      }
      setReports(prev => prev.filter(r => r.id !== deleteDialog.id));
      setDeleteDialog(null);
    } catch (e) {
      console.error('Failed to delete report:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format relative timestamp
  const formatTimeAgo = (timestamp: number) => {
    if (!timestamp) return '';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return isRtl ? 'الآن' : 'Just now';
    if (diff < 3600) {
      const mins = Math.floor(diff / 60);
      return isRtl ? `منذ ${mins} دقيقة` : `${mins}m ago`;
    }
    if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return isRtl ? `منذ ${hours} ساعة` : `${hours}h ago`;
    }
    const days = Math.floor(diff / 86400);
    return isRtl ? `منذ ${days} يوم` : `${days}d ago`;
  };

  // Icon selector based on issue type
  const getIssueIcon = (issue?: string) => {
    if (!issue) return <HelpCircle className="w-3.5 h-3.5" />;
    const lower = issue.toLowerCase();
    if (lower.includes('audio') || lower.includes('sound') || lower.includes('صوت')) {
      return <VolumeX className="w-3.5 h-3.5 text-amber-500" />;
    }
    if (lower.includes('private') || lower.includes('copyright') || lower.includes('خاص') || lower.includes('حقوق')) {
      return <Lock className="w-3.5 h-3.5 text-purple-500" />;
    }
    if (lower.includes('wrong') || lower.includes('غير مطابق') || lower.includes('content')) {
      return <FileQuestion className="w-3.5 h-3.5 text-blue-500" />;
    }
    return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                <span>{isRtl ? 'مركز بلاغات الدروس والفيديوهات' : 'Lesson & Video Reports Center'}</span>
                {metrics.pending > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="Pending Action" />
                )}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRtl
                  ? 'مراجعة المشاكل التقنية المُبلّغ عنها من الطلاب مع إشعار تلقائي بالحل.'
                  : 'Review learner-submitted issues with automated resolution alerts sent back to students.'}
              </p>
            </div>
          </div>
        </div>

        {/* Realtime Live Badge */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/80 shadow-xs text-xs font-semibold text-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{isRtl ? 'مزامنة حية مباشرة' : 'Real-time Sync Active'}</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
            <span>{isRtl ? 'إجمالي البلاغات' : 'Total Reports'}</span>
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">{metrics.total}</div>
          <div className="text-[11px] text-muted-foreground">{isRtl ? 'منذ البداية' : 'All-time received'}</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-amber-500/30 shadow-xs space-y-1 relative overflow-hidden">
          <div className="absolute top-0 end-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-bold">
            <span>{isRtl ? 'قيد المراجعة' : 'Pending Review'}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.pending}</div>
          <div className="text-[11px] text-muted-foreground">{isRtl ? 'يتطلب فحص الإدارة' : 'Requires admin action'}</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-emerald-500/30 shadow-xs space-y-1 relative overflow-hidden">
          <div className="absolute top-0 end-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <span>{isRtl ? 'تم إصلاحها' : 'Resolved'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.resolved}</div>
          <div className="text-[11px] text-muted-foreground">{isRtl ? 'تم إشعار المتعلمين' : 'Students notified'}</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
            <span>{isRtl ? 'معدل الحل' : 'Resolution Rate'}</span>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">{metrics.rate}%</div>
          <div className="text-[11px] text-muted-foreground">{isRtl ? 'كفاءة الصيانة' : 'Health coverage'}</div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-muted/40 rounded-2xl border border-border/80">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'بحث باسم الدورة، الدرس، الطالب، أو الملاحظات...' : 'Search by course, video, student, or notes...'}
              className="w-full bg-background border border-border/80 rounded-xl ps-9 pe-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Issue Type Filter */}
          {issueTypes.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0 hidden sm:block" />
              <select
                value={issueFilter}
                onChange={(e) => setIssueFilter(e.target.value)}
                className="bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary/30 focus:outline-none cursor-pointer"
              >
                <option value="all">{isRtl ? 'كل أنواع المشاكل' : 'All Issue Types'}</option>
                {issueTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border/70 text-xs font-bold shrink-0 self-start sm:self-auto">
          {[
            { id: 'all', label: isRtl ? 'الكل' : 'All', count: metrics.total },
            { id: 'pending', label: isRtl ? 'قيد المراجعة' : 'Pending', count: metrics.pending },
            { id: 'resolved', label: isRtl ? 'تم الحل' : 'Resolved', count: metrics.resolved }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                statusFilter === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full",
                statusFilter === tab.id
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3 bg-card rounded-3xl border border-border/80">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-bold">{isRtl ? 'جاري تحميل البلاغات من قاعدة البيانات...' : 'Loading student reports from database...'}</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-muted/20 border border-dashed border-border/80 rounded-3xl space-y-3">
          <div className="w-12 h-12 bg-emerald-500/15 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {statusFilter === 'pending'
                ? (isRtl ? 'لا توجد بلاغات قيد المراجعة!' : 'No pending reports!')
                : (isRtl ? 'لا توجد بلاغات تطابق البحث' : 'No reports match your filters')}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {statusFilter === 'pending'
                ? (isRtl ? 'جميع فيديوهات المنصة تعمل بكفاءة تامة.' : 'All course lessons and streams are healthy and functioning normally.')
                : (isRtl ? 'جرّب تعديل كلمات البحث أو الفلاتر المختارة.' : 'Try adjusting your search terms or clearing the selected filters.')}
            </p>
          </div>
          {(searchQuery || statusFilter !== 'all' || issueFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setIssueFilter('all');
              }}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset all filters'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredReports.map((rep) => {
            const isResolved = rep.status === 'resolved';
            const isPending = rep.status === 'pending';
            const targetCourse = allCourses.find((c) => c.id === rep.courseId);

            return (
              <div
                key={rep.id}
                className={cn(
                  "p-4 sm:p-5 rounded-3xl bg-card border shadow-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4",
                  isPending ? "border-amber-500/30 hover:border-amber-500/50" : "border-border/80 opacity-90"
                )}
              >
                {/* Main Report Details */}
                <div className="space-y-2.5 min-w-0 flex-1">
                  {/* Top Status & Timestamp Strip */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1.5",
                        isResolved
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      )}
                    >
                      {isResolved ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isRtl ? 'تم الحل' : 'RESOLVED'}</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>{isRtl ? 'قيد المراجعة' : 'PENDING'}</span>
                        </>
                      )}
                    </span>

                    {/* Issue Tag */}
                    {rep.issue && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-muted border border-border/80 text-foreground flex items-center gap-1.5">
                        {getIssueIcon(rep.issue)}
                        <span>{rep.issue}</span>
                      </span>
                    )}

                    {/* Relative Time */}
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(rep.createdAt)}</span>
                      <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">
                        ({new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    </span>
                  </div>

                  {/* Course & Lesson Headline */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      <span className="font-semibold">{rep.courseTitle}</span>
                    </div>

                    <h4 className="font-black text-sm sm:text-base text-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{rep.videoTitle}</span>
                      <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px] text-muted-foreground border border-border/60">
                        ID: {rep.youtubeId}
                      </code>
                    </h4>
                  </div>

                  {/* Student Description / Notes */}
                  {rep.details && (
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 text-xs text-foreground/90 flex items-start gap-2 max-w-2xl">
                      <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-[11px] text-muted-foreground uppercase tracking-wide block">
                          {isRtl ? 'ملاحظة الطالب:' : 'Learner Description:'}
                        </span>
                        <p className="leading-relaxed whitespace-pre-wrap">{rep.details}</p>
                      </div>
                    </div>
                  )}

                  {/* Reporter Meta & Resolution Meta */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-0.5">
                    <div className="flex items-center gap-1.5 font-medium">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{rep.userName || 'Learner'}</span>
                      {(!rep.userId || rep.userId === 'guest' || rep.userId === 'anonymous') && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-muted border border-border text-muted-foreground">
                          {isRtl ? 'زائر' : 'Guest'}
                        </span>
                      )}
                    </div>

                    {rep.userEmail && (
                      <div className="flex items-center gap-1.5 font-medium">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        <a href={`mailto:${rep.userEmail}`} className="hover:text-primary transition-colors underline decoration-dotted">
                          {rep.userEmail}
                        </a>
                      </div>
                    )}

                    {isResolved && rep.resolvedAt && (
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <Check className="w-3 h-3" />
                        <span>
                          {isRtl ? 'أُصلح بواسطة الإدارة ' : 'Resolved by team '}
                          {formatTimeAgo(rep.resolvedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons Strip */}
                <div className="flex items-center gap-2 self-stretch lg:self-center shrink-0 flex-wrap justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-border/60">
                  {/* Test Video Button */}
                  <button
                    onClick={() =>
                      setPreviewVideo({
                        id: rep.youtubeId,
                        title: rep.videoTitle,
                        courseTitle: rep.courseTitle
                      })
                    }
                    className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title={isRtl ? 'معاينة الفيديو واختبار الصوت والتشغيل' : 'Test playback and audio'}
                  >
                    <Play className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                    <span>{isRtl ? 'اختبار الفيديو' : 'Test Video'}</span>
                  </button>

                  {/* Open YouTube Direct Link */}
                  <a
                    href={`https://www.youtube.com/watch?v=${rep.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all cursor-pointer"
                    title={isRtl ? 'فتح في YouTube' : 'Open in YouTube'}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {/* Edit Course Button */}
                  {targetCourse && onEditCourse && (
                    <button
                      onClick={() => onEditCourse(targetCourse)}
                      className="px-3 py-2 bg-card border border-border/80 hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Edit className="w-3.5 h-3.5 text-primary" />
                      <span>{isRtl ? 'تعديل الدورة' : 'Edit Course'}</span>
                    </button>
                  )}

                  {/* Resolve or Reopen Button */}
                  {isPending ? (
                    <button
                      onClick={() => handleResolve(rep)}
                      disabled={actionLoadingId === rep.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
                    >
                      {actionLoadingId === rep.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>{isRtl ? 'تم الإصلاح وإشعار الطالب' : 'Mark Fixed & Notify'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReopen(rep)}
                      disabled={actionLoadingId === rep.id}
                      className="px-3 py-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'إعادة الفتح' : 'Reopen'}</span>
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => setDeleteDialog(rep)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                    title={isRtl ? 'حذف البلاغ' : 'Delete Report'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-[280] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-2xl rounded-3xl border border-border shadow-2xl p-5 relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground">{previewVideo.title}</h3>
                <p className="text-xs text-muted-foreground">{previewVideo.courseTitle} (ID: {previewVideo.id})</p>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-inner border border-border">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${previewVideo.id}?autoplay=1&enablejsapi=1`}
                title={previewVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-muted-foreground">
                {isRtl ? 'تحقق مما إذا كان الفيديو يعمل أو محذوفاً على يوتيوب.' : 'Inspect if the stream is live or blocked on YouTube.'}
              </span>
              <a
                href={`https://www.youtube.com/watch?v=${previewVideo.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <span>{isRtl ? 'فتح في يوتيوب' : 'Open YouTube'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog && (
        <div className="fixed inset-0 z-[290] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl p-6 relative space-y-4 text-start">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-foreground">
                {isRtl ? 'تأكيد حذف البلاغ' : 'Confirm Delete Report'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl
                  ? `هل أنت متأكد من حذف بلاغ الدرس "${deleteDialog.videoTitle}"؟ لا يمكن التراجع عن هذا الإجراء.`
                  : `Are you sure you want to delete the report for "${deleteDialog.videoTitle}"? This action cannot be undone.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setDeleteDialog(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? (isRtl ? 'جاري الحذف...' : 'Deleting...') : (isRtl ? 'حذف البلاغ' : 'Delete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
