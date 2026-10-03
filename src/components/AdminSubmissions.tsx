import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useStore } from '../store/useStore';
import { FormSubmission, updateSubmissionStatus, deleteSubmission } from '../lib/submissions';
import { 
  Inbox, 
  Search, 
  Filter, 
  Trash2, 
  ExternalLink, 
  Mail, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  User, 
  MessageSquare, 
  Check, 
  X, 
  RefreshCw, 
  FileText, 
  Video, 
  Eye, 
  Youtube,
  Send,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export function AdminSubmissions() {
  const { user, language } = useStore();
  const isRtl = language === 'ar';

  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'dmca' | 'contact' | 'creator'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');
  
  // Modals & Details
  const [selectedSub, setSelectedSub] = useState<FormSubmission | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<FormSubmission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Load from API and subscribe to Firestore
  useEffect(() => {
    setLoading(true);

    const loadApiSubmissions = async () => {
      try {
        const res = await fetch('/api/submissions');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.submissions)) {
            setSubmissions(prev => {
              const map = new Map<string, FormSubmission>();
              data.submissions.forEach((s: FormSubmission) => map.set(s.id, s));
              prev.forEach((s) => map.set(s.id, { ...s, ...map.get(s.id) }));
              return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            });
            setLoading(false);
          }
        }
      } catch (err) {
        console.warn('API submissions fetch warning:', err);
      }
    };

    loadApiSubmissions();

    // Firestore listener
    const unsub = onSnapshot(collection(db, 'form_submissions'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as FormSubmission));
      setSubmissions(prev => {
        const map = new Map<string, FormSubmission>();
        prev.forEach((s) => map.set(s.id, s));
        data.forEach((s) => map.set(s.id, s));
        return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      });
      setLoading(false);
    }, (error) => {
      console.warn('Firestore form_submissions listener warning:', error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Filtered list
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(item => {
      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (item.name || item.takedownName || item.creatorName || '').toLowerCase();
        const email = (item.email || item.takedownEmail || '').toLowerCase();
        const subject = (item.subject || item.takedownReason || '').toLowerCase();
        const message = (item.message || item.takedownDetails || item.notes || '').toLowerCase();
        const url = (item.takedownUrl || item.channelUrl || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !subject.includes(q) && !message.includes(q) && !url.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [submissions, typeFilter, statusFilter, searchQuery]);

  // Counters
  const counts = useMemo(() => {
    return {
      total: submissions.length,
      pending: submissions.filter(s => s.status === 'pending').length,
      dmca: submissions.filter(s => s.type === 'dmca').length,
      contact: submissions.filter(s => s.type === 'contact').length,
      creator: submissions.filter(s => s.type === 'creator').length,
    };
  }, [submissions]);

  // Handle status update
  const handleStatusChange = async (id: string, newStatus: 'pending' | 'reviewed' | 'resolved') => {
    setActionLoadingId(id);
    try {
      await updateSubmissionStatus(id, newStatus, undefined, user?.email || 'admin');
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus, updatedAt: Date.now() } : s));
      if (selectedSub && selectedSub.id === id) {
        setSelectedSub(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle delete
  const handleConfirmDelete = async () => {
    if (!deleteDialog) return;
    setIsDeleting(true);
    try {
      await deleteSubmission(deleteDialog.id);
      setSubmissions(prev => prev.filter(s => s.id !== deleteDialog.id));
      if (selectedSub && selectedSub.id === deleteDialog.id) {
        setSelectedSub(null);
      }
      setDeleteDialog(null);
    } catch (err) {
      console.error('Failed to delete submission', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Just now';
    return new Date(timestamp).toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'dmca':
        return {
          label: isRtl ? 'طلب حقوق / إزالة (DMCA)' : 'DMCA / Content Request',
          classes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          icon: ShieldAlert
        };
      case 'creator':
        return {
          label: isRtl ? 'طلب صانع محتوى / شارة' : 'Creator Badge Claim',
          classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          icon: Sparkles
        };
      case 'contact':
      default:
        return {
          label: isRtl ? 'رسالة تواصل مباشرة' : 'Direct Message',
          classes: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
          icon: MessageSquare
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return {
          label: isRtl ? 'تمت المعالجة' : 'Resolved',
          classes: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
        };
      case 'reviewed':
        return {
          label: isRtl ? 'قيد المتابعة' : 'Reviewed',
          classes: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
        };
      case 'pending':
      default:
        return {
          label: isRtl ? 'جديد / معلق' : 'Pending',
          classes: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div 
          onClick={() => { setTypeFilter('all'); setStatusFilter('all'); }}
          className={cn(
            "p-4 rounded-2xl bg-card border transition-all cursor-pointer",
            typeFilter === 'all' && statusFilter === 'all' ? "border-primary ring-2 ring-primary/20 shadow-xs" : "border-border/80 hover:border-border"
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">{isRtl ? 'إجمالي النماذج' : 'Total Forms'}</span>
            <Inbox className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">{counts.total}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('pending')}
          className={cn(
            "p-4 rounded-2xl bg-card border transition-all cursor-pointer",
            statusFilter === 'pending' ? "border-amber-500 ring-2 ring-amber-500/20 shadow-xs" : "border-border/80 hover:border-border"
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">{isRtl ? 'في الانتظار' : 'Pending'}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500">{counts.pending}</div>
        </div>

        <div 
          onClick={() => { setTypeFilter('dmca'); setStatusFilter('all'); }}
          className={cn(
            "p-4 rounded-2xl bg-card border transition-all cursor-pointer",
            typeFilter === 'dmca' ? "border-rose-500 ring-2 ring-rose-500/20 shadow-xs" : "border-border/80 hover:border-border"
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">{isRtl ? 'طلبات DMCA' : 'DMCA Requests'}</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-500">{counts.dmca}</div>
        </div>

        <div 
          onClick={() => { setTypeFilter('contact'); setStatusFilter('all'); }}
          className={cn(
            "p-4 rounded-2xl bg-card border transition-all cursor-pointer",
            typeFilter === 'contact' ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs" : "border-border/80 hover:border-border"
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">{isRtl ? 'رسائل التواصل' : 'Direct Notes'}</span>
            <MessageSquare className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-500">{counts.contact}</div>
        </div>

        <div 
          onClick={() => { setTypeFilter('creator'); setStatusFilter('all'); }}
          className={cn(
            "p-4 rounded-2xl bg-card border transition-all cursor-pointer col-span-2 sm:col-span-1",
            typeFilter === 'creator' ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs" : "border-border/80 hover:border-border"
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">{isRtl ? 'صناع المحتوى' : 'Creator Claims'}</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-500">{counts.creator}</div>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-card border border-border/80 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? 'البحث بالاسم، البريد الإلكتروني، الرابط، أو النص...' : 'Search by name, email, link, subject or content...'}
            className="w-full ps-9 pe-3 py-2 bg-muted/40 border border-border/60 rounded-xl text-xs sm:text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-muted/40 border border-border/60 text-xs font-medium text-foreground cursor-pointer"
          >
            <option value="all">{isRtl ? 'كافة النماذج' : 'All Form Types'}</option>
            <option value="dmca">{isRtl ? 'طلبات الإزالة (DMCA)' : 'DMCA Requests'}</option>
            <option value="contact">{isRtl ? 'رسائل التواصل المباشرة' : 'Direct Messages'}</option>
            <option value="creator">{isRtl ? 'طلبات توثيق صناع المحتوى' : 'Creator Applications'}</option>
          </select>

          {/* Status dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-muted/40 border border-border/60 text-xs font-medium text-foreground cursor-pointer"
          >
            <option value="all">{isRtl ? 'كافة الحالات' : 'All Statuses'}</option>
            <option value="pending">{isRtl ? 'معلقة (Pending)' : 'Pending'}</option>
            <option value="reviewed">{isRtl ? 'تمت المراجعة (Reviewed)' : 'Reviewed'}</option>
            <option value="resolved">{isRtl ? 'محلولة (Resolved)' : 'Resolved'}</option>
          </select>
        </div>
      </div>

      {/* SUBMISSIONS LIST */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs">{isRtl ? 'جارٍ جلب رسائل ونماذج المستخدمين...' : 'Loading user form submissions...'}</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border/80 rounded-2xl space-y-3">
          <Inbox className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <h3 className="text-base font-bold text-foreground">
            {isRtl ? 'لا توجد طلبات مطابقة' : 'No submissions found'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
              ? (isRtl ? 'حاول تغيير معايير البحث أو التصفية.' : 'Try adjusting your search terms or filters.')
              : (isRtl ? 'لم يتم تقديم أي طلبات أو رسائل حتى الآن.' : 'New submissions from the Contact, Copyright, or Creator forms will appear here in real-time.')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((sub) => {
            const typeBadge = getTypeBadge(sub.type);
            const statusBadge = getStatusBadge(sub.status);
            const TypeIcon = typeBadge.icon;
            const senderName = sub.name || sub.takedownName || sub.creatorName || 'Anonymous';
            const senderEmail = sub.email || sub.takedownEmail || '';
            const targetUrl = sub.takedownUrl || sub.channelUrl;
            const previewText = sub.message || sub.takedownDetails || sub.notes || '';

            return (
              <div 
                key={sub.id}
                className={cn(
                  "p-4 sm:p-5 rounded-2xl bg-card border transition-all hover:shadow-xs",
                  sub.status === 'pending' ? "border-amber-500/40 bg-amber-500/[0.02]" : "border-border/80"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border", typeBadge.classes)}>
                      <TypeIcon className="w-3.5 h-3.5" />
                      <span>{typeBadge.label}</span>
                    </span>

                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border", statusBadge.classes)}>
                      {statusBadge.label}
                    </span>

                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 ms-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(sub.createdAt)}</span>
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => setSelectedSub(sub)}
                      className="px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      title={isRtl ? 'عرض التفاصيل الكاملة' : 'View Full Details'}
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" />
                      <span>{isRtl ? 'عرض' : 'View'}</span>
                    </button>

                    {/* Status Toggle Menu */}
                    {sub.status !== 'resolved' ? (
                      <button
                        onClick={() => handleStatusChange(sub.id, 'resolved')}
                        disabled={actionLoadingId === sub.id}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title={isRtl ? 'تحديد كمكتمل' : 'Mark as Resolved'}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'إتمام' : 'Resolve'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(sub.id, 'pending')}
                        disabled={actionLoadingId === sub.id}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title={isRtl ? 'إعادة كمعلق' : 'Reopen as Pending'}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'إعادة فتح' : 'Reopen'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => setDeleteDialog(sub)}
                      className="p-1.5 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                      title={isRtl ? 'حذف هذا السجل' : 'Delete Submission'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* SENDER INFO & SUBJECT */}
                <div className="space-y-1.5 text-start">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{senderName}</span>
                    </span>

                    {senderEmail && (
                      <a 
                        href={`mailto:${senderEmail}?subject=Re: SkilliQ - ${encodeURIComponent(sub.subject || sub.takedownReason || 'Your Submission')}`}
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        <Mail className="w-3 h-3" />
                        <span>{senderEmail}</span>
                      </a>
                    )}
                  </div>

                  {/* Subject or Reason */}
                  {(sub.subject || sub.takedownReason) && (
                    <div className="text-xs font-semibold text-foreground/90">
                      {sub.subject || sub.takedownReason}
                    </div>
                  )}

                  {/* Target URL if present (DMCA or Creator Channel) */}
                  {targetUrl && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 text-xs font-mono text-muted-foreground max-w-full truncate">
                      <ExternalLink className="w-3 h-3 shrink-0 text-primary" />
                      <a 
                        href={targetUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="truncate hover:text-primary hover:underline"
                      >
                        {targetUrl}
                      </a>
                    </div>
                  )}

                  {/* Message body preview */}
                  {previewText && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pt-1">
                      {previewText}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL DETAILS MODAL */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-2xl rounded-3xl border border-border shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto text-start">
            
            <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold border", getTypeBadge(selectedSub.type).classes)}>
                    {getTypeBadge(selectedSub.type).label}
                  </span>
                  <span className={cn("px-2.5 py-0.5 rounded-lg text-xs font-bold border", getStatusBadge(selectedSub.status).classes)}>
                    {getStatusBadge(selectedSub.status).label}
                  </span>
                </div>
                <h3 className="text-lg font-black text-foreground pt-1">
                  {selectedSub.subject || selectedSub.takedownReason || (isRtl ? 'تفاصيل الطلب' : 'Submission Details')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatDate(selectedSub.createdAt)}
                </p>
              </div>

              <button 
                onClick={() => setSelectedSub(null)}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SENDER DETAILS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs">
              <div>
                <span className="text-muted-foreground block mb-0.5">{isRtl ? 'اسم المرسل / القناة:' : 'Sender Name / Channel:'}</span>
                <span className="font-bold text-foreground text-sm">
                  {selectedSub.name || selectedSub.takedownName || selectedSub.creatorName || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">{isRtl ? 'البريد الإلكتروني للرد:' : 'Email for Reply:'}</span>
                <a 
                  href={`mailto:${selectedSub.email || selectedSub.takedownEmail}`}
                  className="font-bold text-primary hover:underline text-sm inline-flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{selectedSub.email || selectedSub.takedownEmail || 'None'}</span>
                </a>
              </div>
            </div>

            {/* SUBMITTED URL IF ANY */}
            {(selectedSub.takedownUrl || selectedSub.channelUrl) && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  {selectedSub.type === 'creator' 
                    ? (isRtl ? 'رابط قناة يوتيوب أو قائمة التشغيل' : 'YouTube Channel or Playlist Link')
                    : (isRtl ? 'رابط المحتوى المستهدف' : 'Target Course or Video URL')}
                </label>
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/60 font-mono text-xs text-foreground">
                  <span className="truncate">{selectedSub.takedownUrl || selectedSub.channelUrl}</span>
                  <a 
                    href={selectedSub.takedownUrl || selectedSub.channelUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1 shrink-0 hover:bg-primary/90 transition-colors"
                  >
                    <span>{isRtl ? 'فتح الرابط' : 'Open Link'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* FULL MESSAGE / NOTES / REASON */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? 'نص الرسالة أو تفاصيل الطلب الكاملة:' : 'Full Message / Request Details:'}
              </label>
              <div className="p-4 rounded-2xl bg-muted/20 border border-border text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {selectedSub.message || selectedSub.takedownDetails || selectedSub.notes || (isRtl ? 'لا توجد تفاصيل إضافية مكتوبة.' : 'No additional message text provided.')}
              </div>
            </div>

            {/* STATUS TOGGLE & ACTIONS */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">{isRtl ? 'تغيير الحالة:' : 'Change Status:'}</span>
                <select
                  value={selectedSub.status}
                  onChange={(e) => handleStatusChange(selectedSub.id, e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground cursor-pointer"
                >
                  <option value="pending">{isRtl ? 'معلق (Pending)' : 'Pending'}</option>
                  <option value="reviewed">{isRtl ? 'تمت المراجعة (Reviewed)' : 'Reviewed'}</option>
                  <option value="resolved">{isRtl ? 'تم الحل (Resolved)' : 'Resolved'}</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {(selectedSub.email || selectedSub.takedownEmail) && (
                  <a
                    href={`mailto:${selectedSub.email || selectedSub.takedownEmail}?subject=Re: SkilliQ - ${encodeURIComponent(selectedSub.subject || selectedSub.takedownReason || 'Support Inquiry')}`}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                    <span>{isRtl ? 'الرد عبر الإيميل' : 'Reply via Email'}</span>
                  </a>
                )}
                
                <button
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-4 text-start">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {isRtl ? 'حذف هذا السجل نهائياً؟' : 'Permanently Delete Submission?'}
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isRtl 
                ? 'هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.' 
                : 'Are you sure you want to permanently remove this form submission? This action cannot be reversed.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button 
                onClick={() => setDeleteDialog(null)}
                className="px-4 py-2 bg-card border border-border/80 hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                disabled={isDeleting}
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? (isRtl ? 'جارٍ الحذف...' : 'Deleting...') : (isRtl ? 'حذف نهائي' : 'Delete Permanently')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
