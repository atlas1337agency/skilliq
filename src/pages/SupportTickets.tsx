import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useStore } from '../store/useStore';
import {
  SupportTicket,
  TicketAttachment,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  createSupportTicket,
  addTicketReply,
  updateTicketStatus,
  fetchSupportTickets,
  processTicketAttachmentFile,
  formatFileSize,
  getTicketCategoryLabel,
  mergeTicketsLists,
} from '../lib/tickets';
import {
  LifeBuoy,
  Plus,
  Send,
  FileText,
  X,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
  Search,
  ChevronLeft,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Loader2,
  RefreshCw,
  ZoomIn,
  Paperclip,
  RotateCcw,
  Mail,
  FileArchive,
  UploadCloud,
  Info,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { SEO } from '../components/SEO';
import { getTextDir } from '../lib/community';

export interface SupportTicketsProps {
  embedded?: boolean;
}

export function SupportTickets({ embedded = false }: SupportTicketsProps) {
  const { i18n } = useTranslation();
  const { user, language, setIsAuthModalOpen } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    searchParams.get('ticket')
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'answered' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Ticket Modal State
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('technical_issue');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [messageText, setMessageText] = useState('');
  const [newAttachments, setNewAttachments] = useState<TicketAttachment[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Email Spam Notice Popup State
  const [isEmailNoticeOpen, setIsEmailNoticeOpen] = useState(false);
  const [copiedSupportEmail, setCopiedSupportEmail] = useState(false);

  // Reply Composer State
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<TicketAttachment[]>([]);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyAttachmentLoading, setReplyAttachmentLoading] = useState(false);

  // Lightbox Modal State
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);

  const newFileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user's tickets & listen in real-time
  useEffect(() => {
    if (!user) {
      setTickets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchSupportTickets(user.uid, false).then((initial) => {
      setTickets((prev) => mergeTicketsLists(prev, initial));
      setLoading(false);
    });

    const q = query(collection(db, 'support_tickets'), where('userId', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as SupportTicket) }));
        setTickets((prev) => mergeTicketsLists(prev, docs));
        setLoading(false);
      },
      (err) => {
        console.warn('Support tickets listener warning:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  // Sync URL ?ticket= param when not embedded
  useEffect(() => {
    if (!embedded) {
      const paramId = searchParams.get('ticket');
      if (paramId) {
        setSelectedTicketId(paramId);
      }
    }
  }, [searchParams, embedded]);

  const selectedTicket = useMemo(
    () => tickets.find((tk) => tk.id === selectedTicketId) || null,
    [tickets, selectedTicketId]
  );

  // Mark ticket as read by user when opened
  useEffect(() => {
    if (selectedTicket && selectedTicket.unreadByUser) {
      updateTicketStatus(selectedTicket.id, { unreadByUser: false });
      setTickets((prev) =>
        prev.map((tk) => (tk.id === selectedTicket.id ? { ...tk, unreadByUser: false } : tk))
      );
    }
  }, [selectedTicket?.id, selectedTicket?.unreadByUser]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (selectedTicket) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [selectedTicket?.id, selectedTicket?.messages?.length]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((tk) => {
      if (statusFilter === 'open' && tk.status !== 'open') return false;
      if (statusFilter === 'answered' && tk.status !== 'answered') return false;
      if (statusFilter === 'resolved' && tk.status !== 'resolved' && tk.status !== 'closed')
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSub = tk.subject.toLowerCase().includes(q);
        const matchNum = (tk.ticketNumber || '').toLowerCase().includes(q);
        const matchMsg = (tk.messages || []).some((m) => m.text.toLowerCase().includes(q));
        if (!matchSub && !matchNum && !matchMsg) return false;
      }
      return true;
    });
  }, [tickets, statusFilter, searchQuery]);

  // Handle any file attachments (Images, PDF, Word, or any file)
  const processFiles = async (files: FileList | File[], target: 'new' | 'reply') => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    if (target === 'new') setAttachmentLoading(true);
    else setReplyAttachmentLoading(true);

    try {
      const processed: TicketAttachment[] = [];
      for (const file of fileArray) {
        // Limit non-image files to 5MB to keep payloads responsive
        if (!file.type.startsWith('image/') && file.size > 5 * 1024 * 1024) {
          continue;
        }
        const att = await processTicketAttachmentFile(file);
        processed.push(att);
      }

      if (target === 'new') {
        setNewAttachments((prev) => [...prev, ...processed].slice(0, 6));
      } else {
        setReplyAttachments((prev) => [...prev, ...processed].slice(0, 6));
      }
    } catch (err) {
      console.error('Error processing attachment:', err);
    } finally {
      if (target === 'new') setAttachmentLoading(false);
      else setReplyAttachmentLoading(false);
    }
  };

  // Support Ctrl+V clipboard screenshot/file paste
  const handlePaste = (e: React.ClipboardEvent, target: 'new' | 'reply') => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const f = items[i].getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      processFiles(files, target);
    }
  };

  const handleCopySupportEmail = () => {
    navigator.clipboard.writeText('support@skilliq1337.online');
    setCopiedSupportEmail(true);
    setTimeout(() => setCopiedSupportEmail(false), 2500);
  };

  // Submit new ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!subject.trim() || (!messageText.trim() && newAttachments.length === 0)) {
      setCreateError(
        isRtl
          ? 'يرجى كتابة عنوان التذكرة وشرح المشكلة أو إرفاق ملف.'
          : 'Please enter a subject and describe your issue or attach a file.'
      );
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      const created = await createSupportTicket({
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Student',
        userEmail: user.email || '',
        userAvatar: user.photoURL || '',
        subject: subject.trim(),
        category,
        priority,
        text:
          messageText.trim() ||
          (isRtl ? 'تم إرفاق ملفات للتوضيح.' : 'Attached files for reference.'),
        attachments: newAttachments,
      });

      setTickets((prev) => mergeTicketsLists([created], prev));
      setSelectedTicketId(created.id);
      if (!embedded) {
        setSearchParams({ ticket: created.id });
      }
      setIsNewTicketOpen(false);
      setSubject('');
      setMessageText('');
      setNewAttachments([]);
      setCategory('technical_issue');
      setPriority('normal');
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create ticket');
    } finally {
      setIsCreating(false);
    }
  };

  // Send user reply inside ticket conversation
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket) return;
    if (!replyText.trim() && replyAttachments.length === 0) return;

    setIsSendingReply(true);
    try {
      const updated = await addTicketReply(selectedTicket, {
        senderId: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || 'Student',
        senderEmail: user.email || '',
        senderAvatar: user.photoURL || '',
        senderRole: 'user',
        text: replyText.trim() || (isRtl ? 'تم إرسال مرفق.' : 'Sent an attachment.'),
        attachments: replyAttachments,
      });

      setTickets((prev) => mergeTicketsLists([updated], prev));
      setReplyText('');
      setReplyAttachments([]);
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleToggleResolve = async (ticket: SupportTicket) => {
    const nextStatus: TicketStatus = ticket.status === 'resolved' ? 'open' : 'resolved';
    await updateTicketStatus(ticket.id, { status: nextStatus });
    setTickets((prev) =>
      prev.map((tk) =>
        tk.id === ticket.id ? { ...tk, status: nextStatus, updatedAt: Date.now() } : tk
      )
    );
  };

  const handleDownloadAttachment = (att: TicketAttachment) => {
    if (att.type === 'text' && !att.content.startsWith('data:')) {
      const blob = new Blob([att.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.name || 'attachment.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    const a = document.createElement('a');
    a.href = att.content;
    a.download = att.name || 'attachment';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'answered':
        return {
          label: isRtl ? 'تم الرد من الإدارة' : 'Admin Replied',
          classes: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        };
      case 'resolved':
        return {
          label: isRtl ? 'تم الحل' : 'Resolved',
          classes: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
        };
      case 'closed':
        return {
          label: isRtl ? 'مغلقة' : 'Closed',
          classes: 'bg-muted text-muted-foreground border-border',
        };
      case 'open':
      default:
        return {
          label: isRtl ? 'مفتوحة / بانتظار الرد' : 'Open',
          classes: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        };
    }
  };

  const getPriorityBadge = (prio: TicketPriority) => {
    switch (prio) {
      case 'urgent':
        return {
          label: isRtl ? 'عاجل جداً' : 'Urgent',
          classes: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        };
      case 'high':
        return {
          label: isRtl ? 'أولوية عالية' : 'High',
          classes: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        };
      default:
        return {
          label: isRtl ? 'عادي' : 'Normal',
          classes: 'bg-muted text-muted-foreground border-border',
        };
    }
  };

  const getAttachmentBadgeLabel = (att: TicketAttachment) => {
    if (att.type === 'image') return isRtl ? 'صورة / لقطة شاشة' : 'Image / Screenshot';
    if (att.type === 'pdf') return 'PDF Document';
    if (att.type === 'word') return 'Word Document';
    const ext = att.name.includes('.') ? att.name.split('.').pop()?.toUpperCase() : 'FILE';
    return `${ext} File`;
  };

  const formatTime = (ts: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    if (embedded) return null;
    return (
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="w-full px-4 sm:px-6 lg:px-8 py-14 max-w-4xl mx-auto min-h-[75vh] flex items-center justify-center"
      >
        <SEO
          title={isRtl ? 'تذاكر الدعم الفني المباشر | SkilliQ' : 'Support Tickets & Help Desk | SkilliQ'}
          description={
            isRtl
              ? 'افتح تذكرة دعم فني مع إدارة منصة SkilliQ وأرسل الصور وملفات PDF و Word للحصول على مساعدة فورية.'
              : 'Open a support ticket with SkilliQ Admin, attach images, PDF, Word, or any file, and get direct conversational help.'
          }
          canonicalPath="/support"
          lang={isRtl ? 'ar' : 'en'}
        />
        <div className="p-8 sm:p-10 rounded-3xl bg-card border border-border/80 text-center max-w-lg w-full shadow-lg space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
            <LifeBuoy className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            {isRtl ? 'مركز تذاكر الدعم الفني المباشر' : 'Direct Support Tickets'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {isRtl
              ? 'سجل الدخول لفتح تذكرة دعم فني مباشرة مع المشرف، إرفاق الصور وملفات PDF أو Word أو أي ملف، ومتابعة المحادثة والردود لحظة بلحظة.'
              : 'Sign in to open a support ticket with the Admin, attach images, PDF, Word, or any helpful file, and chat directly to resolve any issue.'}
          </p>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-md cursor-pointer"
          >
            {isRtl ? 'تسجيل الدخول للمتابعة' : 'Sign In to Open a Ticket'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={cn(
        'w-full space-y-5 text-start',
        !embedded && 'px-3 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto min-h-[82vh]'
      )}
    >
      {!embedded && (
        <SEO
          title={isRtl ? 'تذاكر الدعم الفني المباشر | SkilliQ' : 'Support Tickets & Help Desk | SkilliQ'}
          description={
            isRtl
              ? 'افتح تذكرة دعم فني مع إدارة منصة SkilliQ وأرسل الصور وملفات PDF و Word للحصول على مساعدة فورية.'
              : 'Open a support ticket with SkilliQ Admin, attach images, PDF, Word, or any file, and get direct conversational help.'
          }
          canonicalPath="/support"
          lang={isRtl ? 'ar' : 'en'}
        />
      )}

      {/* EMAIL SPAM EXPLANATION POPUP MODAL */}
      {isEmailNoticeOpen && (
        <div
          onClick={() => setIsEmailNoticeOpen(false)}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            dir={isRtl ? 'rtl' : 'ltr'}
            className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl p-6 space-y-4 text-start"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {isRtl ? 'التواصل عبر البريد الإلكتروني' : 'Contact Support via Email'}
                  </h3>
                  <p className="text-xs font-mono font-bold text-primary">
                    support@skilliq1337.online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmailNoticeOpen(false)}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm">
                <Info className="w-4 h-4 shrink-0" />
                <span>
                  {isRtl ? 'ملاحظة هامة جداً (يرجى القراءة):' : 'Important Notice (Please Read):'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                {isRtl
                  ? 'أحياناً قد تذهب رسائل الرد الخاصة بنا إلى مجلد الرسائل غير المرغوب فيها (Spam) في Gmail. يرجى تفقد قسم الـ Spam دائماً بعد مراسلتنا — سنتواصل معك ونرد عليك في أقرب وقت!'
                  : 'Sometimes our email replies may go to your Gmail Spam or Junk folder. Please make sure to check your Spam folder after messaging us — we will contact you back shortly!'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopySupportEmail}
                className="flex-1 py-2.5 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSupportEmail ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-500">
                      {isRtl ? 'تم نسخ الإيميل!' : 'Email Copied!'}
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{isRtl ? 'نسخ البريد الإلكتروني' : 'Copy Email Address'}</span>
                  </>
                )}
              </button>

              <a
                href="mailto:support@skilliq1337.online"
                onClick={() => setIsEmailNoticeOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{isRtl ? 'فتح تطبيق البريد' : 'Open Email App'}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between text-white mb-3 px-2">
              <span className="text-xs sm:text-sm font-bold truncate">{lightboxImage.name}</span>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl border border-white/15 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* NEW TICKET POPUP MODAL */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div
            onPaste={(e) => handlePaste(e, 'new')}
            dir={isRtl ? 'rtl' : 'ltr'}
            className="bg-card w-full max-w-2xl rounded-3xl border border-border shadow-2xl p-5 sm:p-7 space-y-5 max-h-[92dvh] overflow-y-auto text-start"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-foreground">
                    {isRtl ? 'فتح تذكرة دعم فني جديدة' : 'Open New Support Ticket'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isRtl
                      ? 'اشرح المشكلة ويمكنك إرفاق الصور أو ملفات PDF أو Word أو أي ملف مساعد'
                      : 'Describe your issue and attach images, PDF, Word, or any helpful file'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewTicketOpen(false)}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  {isRtl ? 'عنوان المشكلة / الموضوع *' : 'Ticket Subject *'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  dir={getTextDir(subject, isRtl)}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={
                    isRtl
                      ? 'مثال: مشكلة في فتح شهادة الدورة أو استفسار تقني'
                      : 'e.g. Video lesson not loading or certificate verification issue'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isRtl ? 'قسم المشكلة' : 'Issue Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    <option value="technical_issue">
                      {getTicketCategoryLabel('technical_issue', isRtl)}
                    </option>
                    <option value="video_playback">
                      {getTicketCategoryLabel('video_playback', isRtl)}
                    </option>
                    <option value="certificate_issue">
                      {getTicketCategoryLabel('certificate_issue', isRtl)}
                    </option>
                    <option value="account_problem">
                      {getTicketCategoryLabel('account_problem', isRtl)}
                    </option>
                    <option value="course_request">
                      {getTicketCategoryLabel('course_request', isRtl)}
                    </option>
                    <option value="other">{getTicketCategoryLabel('other', isRtl)}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isRtl ? 'درجة الأهمية' : 'Priority'}
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    <option value="normal">{isRtl ? 'عادي (Normal)' : 'Normal'}</option>
                    <option value="high">{isRtl ? 'مهم (High)' : 'High Priority'}</option>
                    <option value="urgent">{isRtl ? 'عاجل جداً (Urgent)' : 'Urgent'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  {isRtl
                    ? 'تفاصيل المشكلة (يدعم العربية والإنجليزية + لصق الصور بـ Ctrl+V) *'
                    : 'Problem Description (Supports English & Arabic + Ctrl+V image paste) *'}
                </label>
                <textarea
                  rows={4}
                  dir={getTextDir(messageText, isRtl)}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={
                    isRtl
                      ? 'اكتب تفاصيل المشكلة التي واجهتك هنا...'
                      : 'Describe what happened, steps to reproduce, or any question for the Admin...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              {/* Unified Smart File Attachment Box (Images, PDF, Word, and any helpful file) */}
              <div className="space-y-3">
                <input
                  ref={newFileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.csv,.txt,*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      processFiles(e.target.files, 'new');
                      e.target.value = '';
                    }
                  }}
                />

                <div
                  onClick={() => newFileInputRef.current?.click()}
                  className="p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-primary/5 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 text-center sm:text-start">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-foreground">
                        {isRtl
                          ? 'إرفاق ملفات (صور، PDF، ملفات Word، أو أي ملف يساعد في توضيح المشكلة)'
                          : 'Attach Files (Images, PDF, Word, or any file that helps)'}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {isRtl
                          ? 'اضغط هنا لاختيار الملفات من جهازك أو الصق لقطة شاشة مباشرة (Ctrl+V)'
                          : 'Click to browse files from your device or paste a screenshot (Ctrl+V)'}
                      </p>
                    </div>
                  </div>

                  <span className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-2xs">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'اختيار ملف' : 'Choose Files'}</span>
                  </span>
                </div>

                {attachmentLoading && (
                  <div className="text-xs text-primary font-semibold flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isRtl ? 'جارٍ إرفاق الملف...' : 'Attaching file...'}</span>
                  </div>
                )}

                {/* Preview Attached Files */}
                {newAttachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-2xl bg-muted/30 border border-border/70">
                    {newAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-card border border-border/80"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {att.type === 'image' ? (
                            <img
                              src={att.content}
                              alt={att.name}
                              className="w-11 h-11 rounded-lg object-cover border border-border shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{att.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {getAttachmentBadgeLabel(att)}
                              {att.size ? ` • ${formatFileSize(att.size)}` : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setNewAttachments((prev) => prev.filter((item) => item.id !== att.id))
                          }
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Direct Support Email Info Strip inside New Ticket Popup */}
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    {isRtl ? 'أو تواصل معنا عبر البريد الإلكتروني:' : 'Or contact us via email:'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEmailNoticeOpen(true)}
                  className="text-xs font-mono font-bold text-primary hover:underline flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <span>support@skilliq1337.online</span>
                  <Info className="w-3.5 h-3.5 text-amber-500" />
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isCreating || attachmentLoading}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 rtl:rotate-180" />
                  )}
                  <span>{isRtl ? 'إرسال التذكرة للإدارة' : 'Submit Ticket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 bg-card border border-border/80 rounded-2xl sm:rounded-3xl shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-black text-foreground tracking-tight">
                {isRtl ? 'تذاكر الدعم الفني والمحادثة المباشرة' : 'Support Tickets & Live Help'}
              </h2>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                {isRtl ? 'متصل مع الإدارة' : 'DIRECT ADMIN CHAT'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {isRtl
                ? 'افتح تذكرة إذا واجهت أي مشكلة، أرفق الصور أو ملفات PDF أو Word أو أي ملف، أو راسلنا عبر '
                : 'Open a ticket for any problem, attach images, PDF, Word, or any file, or email us at '}
              <button
                type="button"
                onClick={() => setIsEmailNoticeOpen(true)}
                className="font-mono font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>support@skilliq1337.online</span>
              </button>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsEmailNoticeOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-muted/70 hover:bg-muted text-foreground border border-border/80 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="support@skilliq1337.online"
          >
            <Mail className="w-4 h-4 text-primary shrink-0" />
            <span className="hidden sm:inline">support@skilliq1337.online</span>
            <span className="sm:hidden">{isRtl ? 'البريد' : 'Email'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewTicketOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{isRtl ? 'فتح تذكرة دعم جديدة' : 'Open New Support Ticket'}</span>
          </button>
        </div>
      </div>

      {/* MAIN RESPONSIVE SPLIT VIEW: TICKETS LIST + CONVERSATION THREAD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: USER TICKETS LIST */}
        <div
          className={cn(
            'lg:col-span-5 xl:col-span-4 bg-card border border-border/80 rounded-3xl p-4 space-y-4 shadow-xs',
            selectedTicket ? 'hidden lg:block' : 'block'
          )}
        >
          {/* Search & Status Filter */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isRtl ? 'ابحث برقم التذكرة أو العنوان...' : 'Search ticket # or subject...'
                }
                className="w-full ps-9 pe-3 py-2 bg-muted/40 border border-border/60 rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: 'all', label: isRtl ? 'الكل' : 'All', count: tickets.length },
                {
                  id: 'open',
                  label: isRtl ? 'مفتوحة' : 'Open',
                  count: tickets.filter((t) => t.status === 'open').length,
                },
                {
                  id: 'answered',
                  label: isRtl ? 'تم الرد' : 'Answered',
                  count: tickets.filter((t) => t.status === 'answered').length,
                },
                {
                  id: 'resolved',
                  label: isRtl ? 'محلولة' : 'Resolved',
                  count: tickets.filter((t) => t.status === 'resolved' || t.status === 'closed')
                    .length,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1',
                    statusFilter === tab.id
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>{tab.label}</span>
                  <span className="opacity-80">({tab.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Cards List */}
          {loading ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-primary" />
              <span className="text-xs">
                {isRtl ? 'جارٍ تحميل التذاكر...' : 'Loading tickets...'}
              </span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3 border border-dashed border-border/80 rounded-2xl bg-muted/10">
              <MessageSquare className="w-8 h-8 text-muted-foreground/50 mx-auto" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-foreground">
                  {isRtl ? 'لا توجد تذاكر دعم فني حتى الآن' : 'No support tickets yet'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isRtl
                    ? 'اضغط على "فتح تذكرة دعم جديدة" للتواصل مع الإدارة.'
                    : 'Click "Open New Support Ticket" above if you need assistance.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(true)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isRtl ? 'فتح تذكرة الآن' : 'Create Ticket'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[62vh] overflow-y-auto pe-1">
              {filteredTickets.map((tk) => {
                const isSelected = tk.id === selectedTicketId;
                const statusBadge = getStatusBadge(tk.status);
                const lastMsg = tk.messages?.[tk.messages.length - 1];
                const hasAttachments = tk.messages?.some(
                  (m) => m.attachments && m.attachments.length > 0
                );
                const subDir = getTextDir(tk.subject, isRtl);

                return (
                  <div
                    key={tk.id}
                    onClick={() => {
                      setSelectedTicketId(tk.id);
                      if (!embedded) {
                        setSearchParams({ ticket: tk.id });
                      }
                    }}
                    className={cn(
                      'p-3.5 rounded-2xl border transition-all cursor-pointer text-start relative',
                      isSelected
                        ? 'bg-primary/5 border-primary ring-1 ring-primary/30 shadow-xs'
                        : 'bg-background/70 hover:bg-muted/50 border-border/80'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-muted text-foreground border border-border/70">
                          #{tk.ticketNumber}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-md border',
                            statusBadge.classes
                          )}
                        >
                          {statusBadge.label}
                        </span>
                      </div>

                      {tk.unreadByUser && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black animate-pulse">
                          {isRtl ? 'رد جديد!' : 'NEW REPLY'}
                        </span>
                      )}
                    </div>

                    <h3
                      dir={subDir}
                      className="text-xs sm:text-sm font-bold text-foreground line-clamp-1 mb-1 text-start"
                    >
                      {tk.subject}
                    </h3>

                    {lastMsg && (
                      <p
                        dir={getTextDir(lastMsg.text, isRtl)}
                        className="text-[11px] text-muted-foreground line-clamp-1 mb-2 text-start"
                      >
                        <span className="font-semibold text-foreground/80">
                          {lastMsg.senderRole === 'admin'
                            ? isRtl
                              ? 'الإدارة: '
                              : 'Admin: '
                            : isRtl
                            ? 'أنت: '
                            : 'You: '}
                        </span>
                        {lastMsg.text}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t border-border/50">
                      <span className="truncate">{getTicketCategoryLabel(tk.category, isRtl)}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasAttachments && <Paperclip className="w-3 h-3 text-primary" />}
                        <span>{formatTime(tk.updatedAt || tk.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CONVERSATION THREAD */}
        <div
          className={cn(
            'lg:col-span-7 xl:col-span-8 bg-card border border-border/80 rounded-3xl shadow-xs overflow-hidden flex flex-col min-h-[520px] max-h-[78vh]',
            !selectedTicket ? 'hidden lg:flex' : 'flex'
          )}
        >
          {!selectedTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {isRtl ? 'اختر تذكرة لعرض المحادثة' : 'Select a Ticket to View Conversation'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                {isRtl
                  ? 'اختر أي تذكرة من القائمة الجانبية لمتابعة ردود الإدارة وإرسال الصور أو ملفات PDF و Word، أو افتح تذكرة جديدة.'
                  : 'Choose a ticket from the list to view Admin replies and attached files, or open a new support ticket.'}
              </p>
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(true)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isRtl ? 'فتح تذكرة دعم جديدة' : 'Open New Support Ticket'}</span>
              </button>
            </div>
          ) : (
            <>
              {/* CONVERSATION HEADER */}
              <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTicketId(null);
                        if (!embedded) setSearchParams({});
                      }}
                      className="lg:hidden p-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 cursor-pointer flex items-center gap-1 text-xs font-bold"
                    >
                      <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                      <span>{isRtl ? 'رجوع' : 'Back'}</span>
                    </button>
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-muted border border-border text-foreground">
                      #{selectedTicket.ticketNumber}
                    </span>
                    <span
                      className={cn(
                        'text-[11px] font-bold px-2.5 py-0.5 rounded-md border',
                        getStatusBadge(selectedTicket.status).classes
                      )}
                    >
                      {getStatusBadge(selectedTicket.status).label}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-md border',
                        getPriorityBadge(selectedTicket.priority).classes
                      )}
                    >
                      {getPriorityBadge(selectedTicket.priority).label}
                    </span>
                  </div>
                  <h2
                    dir={getTextDir(selectedTicket.subject, isRtl)}
                    className="text-sm sm:text-base font-black text-foreground truncate text-start"
                  >
                    {selectedTicket.subject}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {getTicketCategoryLabel(selectedTicket.category, isRtl)} •{' '}
                    {formatTime(selectedTicket.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleResolve(selectedTicket)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border',
                      selectedTicket.status === 'resolved'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    )}
                  >
                    {selectedTicket.status === 'resolved' ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'إعادة فتح التذكرة' : 'Re-open Ticket'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'تحديد كمحلولة' : 'Mark Resolved'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* MESSAGES STREAM */}
              <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-4 bg-background/40">
                {(selectedTicket.messages || []).map((msg) => {
                  const isAdminMsg = msg.senderRole === 'admin';
                  const msgDir = getTextDir(msg.text, isRtl);

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex flex-col max-w-[94%] sm:max-w-[82%] space-y-1.5',
                        isAdminMsg ? 'ms-auto items-end' : 'me-auto items-start'
                      )}
                    >
                      {/* Sender Header */}
                      <div className="flex items-center gap-2 px-1">
                        {isAdminMsg ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-black">
                            <ShieldCheck className="w-3 h-3" />
                            <span>{isRtl ? 'إدارة المنصة (Admin)' : 'SkilliQ Admin Support'}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-foreground">
                            {msg.senderName || (isRtl ? 'أنت' : 'You')}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={cn(
                          'p-3.5 sm:p-4 rounded-2xl border shadow-2xs space-y-3 w-full',
                          isAdminMsg
                            ? 'bg-amber-500/[0.08] dark:bg-amber-500/[0.12] border-amber-500/30 text-foreground rounded-ee-xs'
                            : 'bg-card border-border/80 text-foreground rounded-es-xs'
                        )}
                      >
                        {msg.text && (
                          <p
                            dir={msgDir}
                            className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words text-start"
                          >
                            {msg.text}
                          </p>
                        )}

                        {/* Attachments inside message (Images, PDF, Word, or any file) */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="space-y-2.5 pt-1">
                            {msg.attachments.map((att) =>
                              att.type === 'image' ? (
                                <div
                                  key={att.id}
                                  onClick={() =>
                                    setLightboxImage({ url: att.content, name: att.name })
                                  }
                                  className="group relative rounded-xl overflow-hidden border border-border/80 bg-black/20 max-w-sm cursor-pointer"
                                >
                                  <img
                                    src={att.content}
                                    alt={att.name}
                                    className="max-h-64 w-auto object-contain mx-auto transition-transform duration-200 group-hover:scale-[1.02]"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                                    <ZoomIn className="w-4 h-4" />
                                    <span>{isRtl ? 'تكبير الصورة' : 'Click to Enlarge'}</span>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  key={att.id}
                                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-muted/40 hover:bg-muted/60 transition-colors text-start"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                      {att.type === 'pdf' || att.type === 'word' ? (
                                        <FileText className="w-4 h-4" />
                                      ) : (
                                        <FileArchive className="w-4 h-4" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-foreground truncate">
                                        {att.name}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {getAttachmentBadgeLabel(att)}
                                        {att.size ? ` • ${formatFileSize(att.size)}` : ''}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDownloadAttachment(att)}
                                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>{isRtl ? 'تحميل' : 'Download'}</span>
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* REPLY COMPOSER */}
              <form
                onSubmit={handleSendReply}
                onPaste={(e) => handlePaste(e, 'reply')}
                className="p-3 sm:p-4 border-t border-border/80 bg-card space-y-3"
              >
                {/* Pending Reply Attachments */}
                {replyAttachments.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {replyAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-muted/50 border border-border text-xs shrink-0"
                      >
                        {att.type === 'image' ? (
                          <img src={att.content} alt="" className="w-7 h-7 rounded object-cover" />
                        ) : (
                          <FileText className="w-4 h-4 text-primary" />
                        )}
                        <span className="max-w-[130px] truncate font-medium">{att.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setReplyAttachments((prev) => prev.filter((a) => a.id !== att.id))
                          }
                          className="text-muted-foreground hover:text-rose-500 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2">
                  {/* Unified file input for reply (Images, PDF, Word, or any file) */}
                  <input
                    ref={replyFileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.csv,.txt,*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        processFiles(e.target.files, 'reply');
                        e.target.value = '';
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => replyFileInputRef.current?.click()}
                    disabled={replyAttachmentLoading}
                    title={
                      isRtl
                        ? 'إرفاق ملف (صور، PDF، Word، أو أي ملف)'
                        : 'Attach File (Images, PDF, Word, or any file)'
                    }
                    className="p-2.5 rounded-xl bg-muted/60 hover:bg-muted text-primary border border-border/70 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs font-bold">
                      {isRtl ? 'إرفاق ملف' : 'Attach'}
                    </span>
                  </button>

                  <textarea
                    rows={2}
                    dir={getTextDir(replyText, isRtl)}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(e);
                      }
                    }}
                    placeholder={
                      isRtl
                        ? 'اكتب ردك هنا أو أرفق ملف / صورة (Ctrl+V)...'
                        : 'Write a message or attach images, PDF, Word, or any file...'
                    }
                    className="flex-1 px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />

                  <button
                    type="submit"
                    disabled={
                      isSendingReply ||
                      replyAttachmentLoading ||
                      (!replyText.trim() && replyAttachments.length === 0)
                    }
                    className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isSendingReply ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 rtl:rotate-180" />
                    )}
                    <span className="hidden sm:inline">{isRtl ? 'إرسال' : 'Send'}</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
