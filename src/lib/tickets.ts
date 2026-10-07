import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

export type TicketCategory =
  | 'technical_issue'
  | 'video_playback'
  | 'certificate_issue'
  | 'account_problem'
  | 'course_request'
  | 'other';

export type TicketPriority = 'normal' | 'high' | 'urgent';

export type TicketStatus = 'open' | 'answered' | 'resolved' | 'closed';

export interface TicketAttachment {
  id: string;
  type: 'image' | 'pdf' | 'word' | 'file' | 'text';
  name: string;
  mimeType?: string;
  /** Data URL or remote URL for image, PDF, Word, or other file */
  content: string;
  size?: number;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail?: string;
  senderAvatar?: string;
  senderRole: 'user' | 'admin';
  text: string;
  attachments?: TicketAttachment[];
  createdAt: number;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  unreadByAdmin: boolean;
  unreadByUser: boolean;
  messages: TicketMessage[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Compresses and resizes an uploaded image file on the client so it stays lightweight
 * (~40KB - 140KB) for fast loading and safe storage inside Firestore documents.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Reads any file (PDF, Word, archive, text, etc.) as a Data URL for downloading/viewing.
 */
export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      resolve(String(e.target?.result || ''));
    };
    reader.readAsDataURL(file);
  });
}

export async function readTextFile(file: File, maxChars = 40000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.onload = (e) => {
      const text = String(e.target?.result || '');
      if (text.length > maxChars) {
        resolve(text.slice(0, maxChars) + '\n\n... [Truncated]');
      } else {
        resolve(text);
      }
    };
    reader.readAsText(file);
  });
}

/**
 * Processes any user-selected file (Images, PDF, Word, or any helpful file) into a TicketAttachment.
 */
export async function processTicketAttachmentFile(file: File): Promise<TicketAttachment> {
  const name = file.name || 'attachment';
  const lower = name.toLowerCase();
  const isImg =
    file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(lower);
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(lower);
  const isWord =
    /\.(doc|docx|rtf|odt)$/i.test(lower) ||
    file.type.includes('word') ||
    file.type.includes('officedocument');

  let content = '';
  let type: TicketAttachment['type'] = 'file';

  if (isImg) {
    type = 'image';
    content = await compressImageFile(file);
  } else {
    if (isPdf) type = 'pdf';
    else if (isWord) type = 'word';
    else type = 'file';
    content = await readFileAsDataUrl(file);
  }

  return {
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    name,
    mimeType: file.type || 'application/octet-stream',
    content,
    size: file.size,
  };
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function generateTicketNumber(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `SQ-${num}`;
}

const LOCAL_STORAGE_KEY = 'skilliq_support_tickets_cache';

function getLocalTickets(): SupportTicket[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function saveLocalTickets(tickets: SupportTicket[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tickets));
  } catch (e) {}
}

export function mergeTicketsLists(...lists: SupportTicket[][]): SupportTicket[] {
  const map = new Map<string, SupportTicket>();
  for (const list of lists) {
    for (const item of list) {
      if (!item || !item.id) continue;
      const existing = map.get(item.id);
      if (!existing) {
        map.set(item.id, item);
      } else {
        const existingMsgs = existing.messages?.length || 0;
        const itemMsgs = item.messages?.length || 0;
        if (
          itemMsgs > existingMsgs ||
          (itemMsgs === existingMsgs && (item.updatedAt || 0) >= (existing.updatedAt || 0))
        ) {
          map.set(item.id, { ...existing, ...item });
        }
      }
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)
  );
}

export async function fetchSupportTickets(
  userId?: string,
  isAdmin = false
): Promise<SupportTicket[]> {
  let apiTickets: SupportTicket[] = [];
  try {
    const url =
      !isAdmin && userId
        ? `/api/tickets?userId=${encodeURIComponent(userId)}`
        : '/api/tickets';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.tickets)) {
        apiTickets = data.tickets;
      }
    }
  } catch (err) {
    console.warn('API tickets fetch warning:', err);
  }

  let firestoreTickets: SupportTicket[] = [];
  try {
    const colRef = collection(db, 'support_tickets');
    const q = !isAdmin && userId ? query(colRef, where('userId', '==', userId)) : colRef;
    const snap = await getDocs(q);
    firestoreTickets = snap.docs.map((d) => ({ id: d.id, ...(d.data() as SupportTicket) }));
  } catch (err) {
    console.warn('Firestore support_tickets fetch warning:', err);
  }

  const localTickets = getLocalTickets().filter((t) => isAdmin || !userId || t.userId === userId);
  const merged = mergeTicketsLists(localTickets, apiTickets, firestoreTickets);
  if (isAdmin) {
    saveLocalTickets(merged);
  }
  return merged;
}

export async function createSupportTicket(params: {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  text: string;
  attachments?: TicketAttachment[];
}): Promise<SupportTicket> {
  const now = Date.now();
  const id = `tkt_${now}_${Math.random().toString(36).substring(2, 7)}`;
  const initialMessage: TicketMessage = {
    id: `msg_${now}_${Math.random().toString(36).substring(2, 6)}`,
    senderId: params.userId,
    senderName: params.userName || 'Student',
    senderEmail: params.userEmail,
    senderAvatar: params.userAvatar || '',
    senderRole: 'user',
    text: params.text.trim(),
    attachments: params.attachments || [],
    createdAt: now,
  };

  const ticket: SupportTicket = {
    id,
    ticketNumber: generateTicketNumber(),
    userId: params.userId,
    userName: params.userName || 'Student',
    userEmail: params.userEmail || '',
    userAvatar: params.userAvatar || '',
    subject: params.subject.trim(),
    category: params.category,
    priority: params.priority,
    status: 'open',
    unreadByAdmin: true,
    unreadByUser: false,
    messages: [initialMessage],
    createdAt: now,
    updatedAt: now,
  };

  const currentLocal = getLocalTickets();
  saveLocalTickets([ticket, ...currentLocal]);

  try {
    await setDoc(doc(db, 'support_tickets', id), ticket);
  } catch (err) {
    console.warn('Firestore create support_ticket warning:', err);
  }

  try {
    await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    });
  } catch (err) {
    console.warn('API create support_ticket warning:', err);
  }

  return ticket;
}

export async function addTicketReply(
  ticket: SupportTicket,
  reply: {
    senderId: string;
    senderName: string;
    senderEmail?: string;
    senderAvatar?: string;
    senderRole: 'user' | 'admin';
    text: string;
    attachments?: TicketAttachment[];
  }
): Promise<SupportTicket> {
  const now = Date.now();
  const newMessage: TicketMessage = {
    id: `msg_${now}_${Math.random().toString(36).substring(2, 6)}`,
    senderId: reply.senderId,
    senderName: reply.senderName,
    senderEmail: reply.senderEmail || '',
    senderAvatar: reply.senderAvatar || '',
    senderRole: reply.senderRole,
    text: reply.text.trim(),
    attachments: reply.attachments || [],
    createdAt: now,
  };

  const nextStatus: TicketStatus =
    reply.senderRole === 'admin'
      ? 'answered'
      : ticket.status === 'resolved' || ticket.status === 'closed' || ticket.status === 'answered'
      ? 'open'
      : ticket.status;

  const updatedTicket: SupportTicket = {
    ...ticket,
    status: nextStatus,
    unreadByAdmin: reply.senderRole === 'user',
    unreadByUser: reply.senderRole === 'admin',
    messages: [...(ticket.messages || []), newMessage],
    updatedAt: now,
  };

  const local = getLocalTickets();
  saveLocalTickets(mergeTicketsLists(local, [updatedTicket]));

  try {
    await setDoc(doc(db, 'support_tickets', ticket.id), updatedTicket);
  } catch (err) {
    console.warn('Firestore reply support_ticket warning:', err);
  }

  try {
    await fetch(`/api/tickets/${encodeURIComponent(ticket.id)}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: newMessage,
        status: nextStatus,
        unreadByAdmin: updatedTicket.unreadByAdmin,
        unreadByUser: updatedTicket.unreadByUser,
      }),
    });
  } catch (err) {
    console.warn('API reply support_ticket warning:', err);
  }

  if (reply.senderRole === 'admin' && ticket.userId) {
    try {
      const notifId = `notif_ticket_${now}_${Math.random().toString(36).substring(2, 6)}`;
      const notifRef = doc(db, 'notifications', notifId);
      await setDoc(notifRef, {
        id: notifId,
        title: `💬 Support Reply on #${ticket.ticketNumber}`,
        message: `Admin replied to your ticket "${ticket.subject}": "${reply.text.slice(0, 120)}${
          reply.text.length > 120 ? '...' : ''
        }"`,
        targetUserId: ticket.userId,
        link: `/support?ticket=${ticket.id}`,
        isActive: true,
        createdAt: now,
      });
    } catch (e) {}
  }

  return updatedTicket;
}

export async function updateTicketStatus(
  ticketId: string,
  updates: Partial<Pick<SupportTicket, 'status' | 'unreadByAdmin' | 'unreadByUser' | 'priority'>>
): Promise<void> {
  const now = Date.now();
  const payload = { ...updates, updatedAt: now };

  const local = getLocalTickets().map((t) => (t.id === ticketId ? { ...t, ...payload } : t));
  saveLocalTickets(local);

  try {
    await updateDoc(doc(db, 'support_tickets', ticketId), payload);
  } catch (err) {
    console.warn('Firestore updateTicketStatus warning:', err);
  }

  try {
    await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('API updateTicketStatus warning:', err);
  }
}

export async function deleteSupportTicket(ticketId: string): Promise<void> {
  const local = getLocalTickets().filter((t) => t.id !== ticketId);
  saveLocalTickets(local);

  try {
    await deleteDoc(doc(db, 'support_tickets', ticketId));
  } catch (err) {
    console.warn('Firestore deleteSupportTicket warning:', err);
  }

  try {
    await fetch(`/api/tickets/${encodeURIComponent(ticketId)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('API deleteSupportTicket warning:', err);
  }
}

export function getTicketCategoryLabel(cat: TicketCategory, isRtl: boolean): string {
  const map: Record<TicketCategory, { en: string; ar: string }> = {
    technical_issue: { en: 'Technical Issue / Bug', ar: 'مشكلة تقنية أو خطأ بالمنصة' },
    video_playback: { en: 'Video / Lesson Problem', ar: 'مشكلة في تشغيل الفيديو أو الدرس' },
    certificate_issue: { en: 'Certificate & Progress', ar: 'مشكلة في الشهادات أو التقدم' },
    account_problem: { en: 'Account & Profile', ar: 'مشكلة في الحساب والملف الشخصي' },
    course_request: { en: 'Course / Book Request', ar: 'طلب دورة أو كتاب جديد' },
    other: { en: 'General Inquiry', ar: 'استفسار عام أو أخرى' },
  };
  return isRtl ? map[cat]?.ar || map.other.ar : map[cat]?.en || map.other.en;
}
