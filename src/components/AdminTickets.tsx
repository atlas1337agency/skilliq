import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useStore } from '../store/useStore';
import {
  SupportTicket,
  TicketAttachment,
  TicketPriority,
  TicketStatus,
  addTicketReply,
  updateTicketStatus,
  deleteSupportTicket,
  fetchSupportTickets,
  processTicketAttachmentFile,
  formatFileSize,
  getTicketCategoryLabel,
  mergeTicketsLists,
} from '../lib/tickets';
import {
  LifeBuoy,
  Search,
  Send,
  Image as ImageIcon,
  FileText,
  File as FileIcon,
  Trash2,
  CheckCircle2,
  Clock,
  MessageSquare,
  User,
  Mail,
  X,
  ZoomIn,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Loader2,
  RefreshCw,
  ChevronLeft,
  Paperclip,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getTextDir } from '../lib/community';

export function AdminTickets() {
  const { user, language } = useStore();
  const isRtl = language === 'ar';

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'answered' | 'resolved'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TicketPriority>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<TicketAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [attachmentLoading, setAttachmentLoading] = useState(false);

  // Modals
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<SupportTicket | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedTxtId, setCopiedTxtId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetchSupportTickets(undefined, true).then((initial) => {
      setTickets((prev) => mergeTicketsLists(prev, initial));
      setLoading(false);
    });

    const unsub = onSnapshot(
      collection(db, 'support_tickets'),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as SupportTicket) }));
        setTickets((prev) => mergeTicketsLists(prev, docs));
        setLoading(false);
      },
      (err) => {
        console.warn('Admin support_tickets listener warning:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) || null,
    [tickets, selectedTicketId]
  );

  // Mark ticket as read by admin when opened
  useEffect(() => {
    if (selectedTicket && selectedTicket.unreadByAdmin) {
      updateTicketStatus(selectedTicket.id, { unreadByAdmin: false });
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? { ...t, unreadByAdmin: false } : t))
      );
    }
  }, [selectedTicket?.id, selectedTicket?.unreadByAdmin]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (selectedTicket) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [selectedTicket?.id, selectedTicket?.messages?.length]);

  const counts = useMemo(() => {
    return {
      total: tickets.length,
      unread: tickets.filter((t) => t.unreadByAdmin).length,
      open: tickets.filter((t) => t.status === 'open').length,
      answered: tickets.filter((t) => t.status === 'answered').length,
      resolved: tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
      urgent: tickets.filter((t) => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter === 'open' && t.status !== 'open') return false;
      if (statusFilter === 'answered' && t.status !== 'answered') return false;
      if (statusFilter === 'resolved' && t.status !== 'resolved' && t.status !== 'closed') return false;

      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSubject = (t.subject || '').toLowerCase().includes(q);
        const matchNumber = (t.ticketNumber || '').toLowerCase().includes(q);
        const matchUser = (t.userName || '').toLowerCase().includes(q);
        const matchEmail = (t.userEmail || '').toLowerCase().includes(q);
        const matchMsg = (t.messages || []).some((m) => (m.text || '').toLowerCase().includes(q));
        if (!matchSubject && !matchNumber && !matchUser && !matchEmail && !matchMsg) return false;
      }

      return true;
    });
  }, [tickets, statusFilter, priorityFilter, searchQuery]);

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setAttachmentLoading(true);
    try {
      const processed: TicketAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 4 * 1024 * 1024) continue;
        const att = await processTicketAttachmentFile(file);
        processed.push(att);
      }
      setReplyAttachments((prev) => [...prev, ...processed].slice(0, 6));
    } catch (err) {
      console.error('Admin attachment error:', err);
    } finally {
      setAttachmentLoading(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const f = items[i].getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      setAttachmentLoading(true);
      try {
        const processed: TicketAttachment[] = [];
        for (const file of files) {
          const att = await processTicketAttachmentFile(file);
          processed.push(att);
        }
        setReplyAttachments((prev) => [...prev, ...processed].slice(0, 6));
      } finally {
        setAttachmentLoading(false);
      }
    }
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    if (!replyText.trim() && replyAttachments.length === 0) return;

    setIsSending(true);
    try {
      const updated = await addTicketReply(selectedTicket, {
        senderId: user?.uid || 'admin',
        senderName: isRtl ? 'فريق دعم SkilliQ' : 'SkilliQ Admin Support',
        senderEmail: user?.email || 'support@skilliq1337.online',
        senderAvatar: user?.photoURL || '',
        senderRole: 'admin',
        text:
          replyText.trim() ||
          (isRtl ? 'تم إرفاق ملفات توضيحية من فريق الدعم.' : 'Attached support files from Admin.'),
        attachments: replyAttachments,
      });

      setTickets((prev) => mergeTicketsLists(prev, [updated]));
      setReplyText('');
      setReplyAttachments([]);
    } catch (err) {
      console.error('Failed to send admin reply:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: TicketStatus) => {
    await updateTicketStatus(ticketId, { status, unreadByAdmin: false });
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status, unreadByAdmin: false, updatedAt: Date.now() } : t))
    );
  };

  const handlePriorityChange = async (ticketId: string, priority: TicketPriority) => {
    await updateTicketStatus(ticketId, { priority });
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, priority, updatedAt: Date.now() } : t))
    );
  };

  const confirmDeleteTicket = async () => {
    if (!deleteDialog) return;
    setIsDeleting(true);
    try {
      await deleteSupportTicket(deleteDialog.id);
      setTickets((prev) => prev.filter((t) => t.id !== deleteDialog.id));
      if (selectedTicketId === deleteDialog.id) {
        setSelectedTicketId(null);
      }
      setDeleteDialog(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    const list = await fetchSupportTickets(undefined, true);
    setTickets(list);
    setLoading(false);
  };

  const handleCopyText = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedTxtId(id);
    setTimeout(() => setCopiedTxtId(null), 2000);
  };

  const handleDownloadAttachment = (att: TicketAttachment) => {
    if (att.type === 'text' && !att.content.startsWith('data:')) {
      const blob = new Blob([att.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.name || 'attachment.txt';
      a.click();
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

  const renderStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            {isRtl ? 'بانتظار الرد' : 'Needs Reply'}
          </span>
        );
      case 'answered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/15 text-primary border border-primary/30">
            <MessageSquare className="w-3 h-3" />
            {isRtl ? 'تم الرد' : 'Answered'}
          </span>
        );
      case 'resolved':
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            {isRtl ? 'تم الحل' : 'Resolved'}
          </span>
        );
    }
  };

  const renderPriorityBadge = (priority: TicketPriority) => {
    if (priority === 'urgent') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-rose-500/15 text-rose-500 border border-rose-500/30">
          {isRtl ? 'عاجل جداً' : 'Urgent'}
        </span>
      );
    }
    if (priority === 'high') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-orange-500/15 text-orange-500 border border-orange-500/30">
          {isRtl ? 'مرتفع' : 'High'}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-muted text-muted-foreground border border-border">
        {isRtl ? 'عادي' : 'Normal'}
      </span>
    );
  };

  const renderFileTypeBadge = (att: TicketAttachment) => {
    if (att.type === 'pdf') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          PDF
        </span>
      );
    }
    if (att.type === 'word') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
          WORD
        </span>
      );
    }
    if (att.type === 'image') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          IMG
        </span>
      );
    }
    const ext = att.name.includes('.') ? att.name.split('.').pop()?.toUpperCase().slice(0, 5) : 'FILE';
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-primary/15 text-primary border border-primary/30">
        {ext}
      </span>
    );
  };

  const formatTime = (ts: number) => {
    try {
      return new Date(ts).toLocaleString(isRtl ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Hidden multi-file input (Images, PDF, Word, or any file) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt,.log,.csv,.json,.zip,.rar,.xls,.xlsx,.ppt,.pptx,*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          e.target.value = '';
        }}
      />

      {/* TOP SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-xs text-start">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isRtl ? 'إجمالي التذاكر' : 'Total Tickets'}
            </span>
            <LifeBuoy className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground">{counts.total}</p>
        </div>

        <div className="bg-card border border-amber-500/30 rounded-2xl p-4 shadow-xs text-start">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isRtl ? 'مفتوحة / بانتظار الرد' : 'Open / Pending'}
            </span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{counts.open}</p>
        </div>

        <div className="bg-card border border-rose-500/30 rounded-2xl p-4 shadow-xs text-start">
          <div className="flex items-center justify-between text-rose-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isRtl ? 'رسائل جديدة غير مقروءة' : 'Unread Messages'}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          </div>
          <p className="text-2xl font-black text-rose-500">{counts.unread}</p>
        </div>

        <div className="bg-card border border-primary/30 rounded-2xl p-4 shadow-xs text-start">
          <div className="flex items-center justify-between text-primary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isRtl ? 'تم الرد عليها' : 'Admin Replied'}
            </span>
            <MessageSquare className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-primary">{counts.answered}</p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-card border border-emerald-500/30 rounded-2xl p-4 shadow-xs text-start">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isRtl ? 'محلولة / مغلقة' : 'Resolved'}
            </span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{counts.resolved}</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', labelEn: 'All Tickets', labelAr: 'الكل', count: counts.total },
              { id: 'open', labelEn: 'Needs Reply', labelAr: 'بانتظار الرد', count: counts.open },
              { id: 'answered', labelEn: 'Answered', labelAr: 'تم الرد', count: counts.answered },
              { id: 'resolved', labelEn: 'Resolved', labelAr: 'تم الحل', count: counts.resolved },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                statusFilter === tab.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <span>{isRtl ? tab.labelAr : tab.labelEn}</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  statusFilter === tab.id
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-background text-muted-foreground'
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'all' | TicketPriority)}
            className="px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            <option value="all">{isRtl ? 'كل الأولويات' : 'All Priorities'}</option>
            <option value="urgent">{isRtl ? 'عاجل جداً فقط' : 'Urgent Only'}</option>
            <option value="high">{isRtl ? 'أولوية مرتفعة' : 'High Priority'}</option>
            <option value="normal">{isRtl ? 'أولوية عادية' : 'Normal Priority'}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isRtl
                  ? 'بحث برقم التذكرة، اسم المستخدم، الإيميل...'
                  : 'Search ticket #, user, email, message...'
              }
              className="w-full ps-9 pe-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer"
            title={isRtl ? 'تحديث القائمة' : 'Refresh Tickets'}
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* MASTER-DETAIL SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: TICKETS LIST */}
        <div
          className={cn(
            'lg:col-span-5 xl:col-span-4 bg-card border border-border rounded-3xl overflow-hidden shadow-xs',
            selectedTicket ? 'hidden lg:block' : 'block'
          )}
        >
          <div className="p-4 border-b border-border/70 bg-muted/20 flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              {isRtl ? 'قائمة تذاكر المستخدمين' : 'User Support Queue'} ({filteredTickets.length})
            </span>
            {counts.urgent > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                {counts.urgent} {isRtl ? 'عاجل' : 'Urgent'}
              </span>
            )}
          </div>

          {loading && tickets.length === 0 ? (
            <div className="p-12 text-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                {isRtl ? 'جاري تحميل التذاكر...' : 'Loading support tickets...'}
              </p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <LifeBuoy className="w-10 h-10 text-muted-foreground/50 mx-auto" />
              <p className="text-sm font-bold text-foreground">
                {isRtl ? 'لا توجد تذاكر مطابقة' : 'No Support Tickets Found'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRtl
                  ? 'ستظهر هنا أي تذكرة يفتحها الطلاب مع لقطات الشاشة والملفات المرفقة.'
                  : 'Tickets opened by learners with screenshots, PDFs, Word docs, or files will appear here.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60 max-h-[680px] overflow-y-auto">
              {filteredTickets.map((ticket) => {
                const isSelected = ticket.id === selectedTicket?.id;
                const lastMsg = ticket.messages?.[ticket.messages.length - 1];
                const totalAttachments = (ticket.messages || []).reduce(
                  (acc, m) => acc + (m.attachments?.length || 0),
                  0
                );

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={cn(
                      'p-4 text-start transition-all cursor-pointer hover:bg-muted/40 relative',
                      isSelected && 'bg-primary/5 border-s-4 border-s-primary',
                      ticket.unreadByAdmin && !isSelected && 'bg-amber-500/5'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-mono font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          #{ticket.ticketNumber}
                        </span>
                        {renderPriorityBadge(ticket.priority)}
                        {ticket.unreadByAdmin && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                            {isRtl ? 'جديد' : 'NEW'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(ticket.updatedAt || ticket.createdAt)}
                      </span>
                    </div>

                    <h4
                      dir={getTextDir(ticket.subject)}
                      className="text-sm font-extrabold text-foreground line-clamp-1 mb-1"
                    >
                      {ticket.subject}
                    </h4>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
                      <span className="font-bold text-foreground/90 truncate max-w-[140px]">
                        {ticket.userName}
                      </span>
                      <span>•</span>
                      <span className="truncate max-w-[160px] font-mono">{ticket.userEmail}</span>
                    </div>

                    {lastMsg && (
                      <p
                        dir={getTextDir(lastMsg.text)}
                        className="text-xs text-muted-foreground line-clamp-1 mb-2.5"
                      >
                        <span className="font-bold text-foreground/80">
                          {lastMsg.senderRole === 'admin'
                            ? isRtl
                              ? 'الإدارة: '
                              : 'Admin: '
                            : `${ticket.userName}: `}
                        </span>
                        {lastMsg.text}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      {renderStatusBadge(ticket.status)}
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {totalAttachments > 0 && (
                          <span className="inline-flex items-center gap-1 text-primary font-bold">
                            <Paperclip className="w-3 h-3" />
                            {totalAttachments}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {ticket.messages?.length || 1}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CONVERSATION & ADMIN REPLY */}
        <div
          className={cn(
            'lg:col-span-7 xl:col-span-8 bg-card border border-border rounded-3xl overflow-hidden shadow-xs flex flex-col min-h-[620px]',
            !selectedTicket ? 'hidden lg:flex' : 'flex'
          )}
        >
          {!selectedTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-foreground mb-1">
                {isRtl ? 'اختر تذكرة لعرض المحادثة والرد عليها' : 'Select a Ticket to Inspect & Reply'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                {isRtl
                  ? 'انقر على أي تذكرة من القائمة الجانبية لمعاينة لقطات الشاشة والملفات المرفقة (PDF، Word، صور وغيرها) والرد مباشرة على الطالب.'
                  : 'Click any ticket on the left to inspect attached screenshots, PDFs, Word docs, or other files and reply directly to the student.'}
              </p>
            </div>
          ) : (
            <>
              {/* TICKET HEADER & ADMIN CONTROLS */}
              <div className="p-4 sm:p-6 border-b border-border/80 bg-muted/20 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTicketId(null)}
                      className="lg:hidden p-2 rounded-xl bg-card border border-border text-foreground hover:bg-muted cursor-pointer shrink-0"
                    >
                      <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                    </button>

                    <div className="text-start">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg">
                          #{selectedTicket.ticketNumber}
                        </span>
                        {renderStatusBadge(selectedTicket.status)}
                        {renderPriorityBadge(selectedTicket.priority)}
                        <span className="text-xs text-muted-foreground font-semibold">
                          • {getTicketCategoryLabel(selectedTicket.category, isRtl)}
                        </span>
                      </div>

                      <h2
                        dir={getTextDir(selectedTicket.subject)}
                        className="text-base sm:text-xl font-black text-foreground"
                      >
                        {selectedTicket.subject}
                      </h2>
                    </div>
                  </div>

                  {/* Status & Delete Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) =>
                        handleStatusChange(selectedTicket.id, e.target.value as TicketStatus)
                      }
                      className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                    >
                      <option value="open">{isRtl ? 'الحالة: مفتوحة' : 'Status: Open'}</option>
                      <option value="answered">{isRtl ? 'الحالة: تم الرد' : 'Status: Answered'}</option>
                      <option value="resolved">{isRtl ? 'الحالة: تم الحل' : 'Status: Resolved'}</option>
                      <option value="closed">{isRtl ? 'الحالة: مغلقة' : 'Status: Closed'}</option>
                    </select>

                    <select
                      value={selectedTicket.priority}
                      onChange={(e) =>
                        handlePriorityChange(selectedTicket.id, e.target.value as TicketPriority)
                      }
                      className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                    >
                      <option value="normal">{isRtl ? 'الأولوية: عادية' : 'Priority: Normal'}</option>
                      <option value="high">{isRtl ? 'الأولوية: مرتفعة' : 'Priority: High'}</option>
                      <option value="urgent">{isRtl ? 'الأولوية: عاجلة' : 'Priority: Urgent'}</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setDeleteDialog(selectedTicket)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/25 transition-colors cursor-pointer"
                      title={isRtl ? 'حذف التذكرة' : 'Delete Ticket'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* User Info Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs">
                  <div className="flex items-center gap-2.5">
                    {selectedTicket.userAvatar ? (
                      <img
                        src={selectedTicket.userAvatar}
                        alt={selectedTicket.userName}
                        className="w-8 h-8 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/15 text-primary font-black flex items-center justify-center">
                        {(selectedTicket.userName || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-start">
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{selectedTicket.userName}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5">
                        <Mail className="w-3 h-3" />
                        <span>{selectedTicket.userEmail}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] text-muted-foreground">
                    {isRtl ? 'تاريخ الفتح:' : 'Created:'} {formatTime(selectedTicket.createdAt)}
                  </span>
                </div>
              </div>

              {/* MESSAGES THREAD */}
              <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[480px] bg-background/40">
                {(selectedTicket.messages || []).map((msg) => {
                  const isAdmin = msg.senderRole === 'admin';
                  const msgDir = getTextDir(msg.text);

                  return (
                    <div
                      key={msg.id}
                      className={cn('flex flex-col', isAdmin ? 'items-end' : 'items-start')}
                    >
                      <div className="flex items-center gap-2 mb-1.5 px-1">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-primary">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {msg.senderName || 'SkilliQ Admin'}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-foreground">
                            {msg.senderName || selectedTicket.userName}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>

                      <div
                        className={cn(
                          'max-w-full sm:max-w-[85%] rounded-2xl p-4 space-y-3 border shadow-2xs text-start',
                          isAdmin
                            ? 'bg-primary/10 border-primary/30 text-foreground rounded-ee-sm'
                            : 'bg-card border-border/90 text-foreground rounded-es-sm'
                        )}
                      >
                        {msg.text && (
                          <p
                            dir={msgDir}
                            className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words"
                          >
                            {msg.text}
                          </p>
                        )}

                        {/* Attachments inside message */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="space-y-2.5 pt-2 border-t border-border/50">
                            {msg.attachments.map((att) => (
                              <div key={att.id}>
                                {att.type === 'image' ? (
                                  <div className="space-y-1.5">
                                    <div
                                      onClick={() =>
                                        setLightboxImage({ url: att.content, name: att.name })
                                      }
                                      className="relative group inline-block rounded-xl overflow-hidden border border-border bg-black/5 cursor-pointer max-w-xs sm:max-w-md"
                                    >
                                      <img
                                        src={att.content}
                                        alt={att.name}
                                        className="max-h-72 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                                        <ZoomIn className="w-4 h-4" />
                                        <span>{isRtl ? 'تكبير الصورة' : 'Click to Zoom'}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                      <ImageIcon className="w-3.5 h-3.5 text-primary" />
                                      <span className="truncate max-w-[240px]">{att.name}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadAttachment(att)}
                                        className="text-primary hover:underline font-bold cursor-pointer"
                                      >
                                        {isRtl ? 'تحميل' : 'Download'}
                                      </button>
                                    </div>
                                  </div>
                                ) : att.type === 'text' && !att.content.startsWith('data:') ? (
                                  <div className="rounded-xl border border-border bg-background/95 overflow-hidden">
                                    <div className="px-3 py-2 bg-muted/60 border-b border-border flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground truncate">
                                        <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                                        <span className="truncate">{att.name}</span>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => handleCopyText(att.id, att.content)}
                                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                          title={isRtl ? 'نسخ المحتوى' : 'Copy text'}
                                        >
                                          {copiedTxtId === att.id ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                                          ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDownloadAttachment(att)}
                                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                          title={isRtl ? 'تحميل ملف .txt' : 'Download .txt'}
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                    <pre
                                      dir="ltr"
                                      className="p-3 text-[11px] font-mono text-foreground/90 max-h-56 overflow-y-auto whitespace-pre-wrap break-all bg-zinc-950/5 dark:bg-black/40"
                                    >
                                      {att.content}
                                    </pre>
                                  </div>
                                ) : (
                                  <div className="p-3 rounded-xl border border-border bg-background/95 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <FileIcon className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0 text-start">
                                        <div className="flex items-center gap-1.5">
                                          {renderFileTypeBadge(att)}
                                          <span className="text-xs font-bold text-foreground truncate">
                                            {att.name}
                                          </span>
                                        </div>
                                        {att.size ? (
                                          <span className="text-[10px] text-muted-foreground">
                                            {formatFileSize(att.size)}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadAttachment(att)}
                                      className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>{isRtl ? 'تحميل الملف' : 'Download'}</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* ADMIN REPLY COMPOSER */}
              <form
                onSubmit={handleSendAdminReply}
                onPaste={handlePaste}
                className="p-4 sm:p-5 border-t border-border/80 bg-card space-y-3"
              >
                {replyAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-1">
                    {replyAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted border border-border text-xs"
                      >
                        {att.type === 'image' ? (
                          <img
                            src={att.content}
                            alt={att.name}
                            className="w-6 h-6 rounded object-cover"
                          />
                        ) : (
                          renderFileTypeBadge(att)
                        )}
                        <span className="truncate max-w-[150px] font-semibold text-foreground">
                          {att.name}
                        </span>
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

                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  dir={getTextDir(replyText)}
                  rows={3}
                  placeholder={
                    isRtl
                      ? 'اكتب رد الإدارة هنا... (يرسل إشعاراً فورياً للطالب، ويمكنك لصق صورة مباشرة Ctrl+V أو إرفاق ملفات)'
                      : 'Write admin response here... (Notifies the student immediately; paste images with Ctrl+V or attach files)'
                  }
                  className="w-full rounded-2xl bg-background border border-border px-4 py-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={attachmentLoading}
                      className="px-3.5 py-2 rounded-xl bg-muted/70 hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 border border-border/80 transition-colors cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-primary" />
                      <span>
                        {isRtl
                          ? 'إرفاق ملفات (صور، PDF، Word، أو أي ملف)'
                          : 'Attach Files (Images, PDF, Word, Any File)'}
                      </span>
                    </button>

                    {selectedTicket.status !== 'resolved' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(selectedTicket.id, 'resolved')}
                        className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 border border-emerald-500/25 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'تحديد كمحلولة' : 'Mark Resolved'}</span>
                      </button>
                    )}

                    {attachmentLoading && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        {isRtl ? 'جاري التجهيز...' : 'Processing...'}
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSending || (!replyText.trim() && replyAttachments.length === 0)}
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{isRtl ? 'إرسال رد الإدارة' : 'Send Admin Reply'}</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteDialog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 space-y-4 text-start shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  {isRtl ? 'حذف تذكرة الدعم؟' : 'Delete Support Ticket?'}
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  #{deleteDialog.ticketNumber} • {deleteDialog.userName}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isRtl
                ? 'هل أنت متأكد من حذف هذه التذكرة وكافة الرسائل والمرفقات المرتبطة بها نهائياً؟'
                : 'Are you sure you want to permanently delete this support ticket and all its messages and attachments?'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteDialog(null)}
                className="px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80 cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteTicket}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isRtl ? 'حذف التذكرة' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between text-white mb-3 px-2">
              <span className="text-xs sm:text-sm font-bold truncate">{lightboxImage.name}</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              className="max-h-[82vh] max-w-full object-contain rounded-2xl border border-white/15 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
