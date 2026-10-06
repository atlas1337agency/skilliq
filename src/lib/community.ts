import { collection, getDocs, setDoc, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export type ReactionType = 'love' | 'like' | 'dislike';

export interface CommunityPostLink {
  label: string;
  url: string;
}

export interface CommunityPostButton {
  label: string;
  url: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface CommunityCategoryItem {
  name: string;
  subCategories: string[];
}

export interface CommunityPost {
  id: string;
  title: string;
  subtitle?: string;
  paragraph: string;
  image?: string;
  category: string;
  subCategory?: string;
  language: 'all' | 'en' | 'ar';
  links?: CommunityPostLink[];
  buttons?: CommunityPostButton[];
  isPinned?: boolean;
  authorName?: string;
  authorAvatar?: string;
  reactions?: Record<string, ReactionType>;
  createdAt: number;
  updatedAt?: number;
}

/**
 * Detects whether a given text string contains Arabic script to ensure
 * accurate RTL rendering regardless of the active UI language.
 */
export function hasArabicScript(text?: string): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

export function getTextDir(text?: string, fallbackRtl = false): 'rtl' | 'ltr' {
  if (!text || !text.trim()) return fallbackRtl ? 'rtl' : 'ltr';
  return hasArabicScript(text) ? 'rtl' : 'ltr';
}

export async function fetchCommunityCategories(): Promise<CommunityCategoryItem[]> {
  let categories: CommunityCategoryItem[] = [];

  try {
    const raw = localStorage.getItem('skilliq_community_categories');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) categories = parsed;
    }
  } catch (e) {}

  try {
    const res = await fetch('/api/community/categories');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        categories = data.categories;
      }
    }
  } catch (e) {
    console.warn('API community categories read warning:', e);
  }

  try {
    const snap = await getDoc(doc(db, 'community_categories', 'tree'));
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.categories)) {
        categories = data.categories;
      }
    }
  } catch (e) {
    console.warn('Firestore community_categories read warning:', e);
  }

  try {
    localStorage.setItem('skilliq_community_categories', JSON.stringify(categories));
  } catch (e) {}

  return categories;
}

export async function saveCommunityCategories(categories: CommunityCategoryItem[]): Promise<void> {
  try {
    localStorage.setItem('skilliq_community_categories', JSON.stringify(categories));
  } catch (e) {}

  try {
    await fetch('/api/community/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories }),
    });
  } catch (e) {
    console.warn('API save community categories warning:', e);
  }

  try {
    await setDoc(doc(db, 'community_categories', 'tree'), {
      categories,
      updatedAt: Date.now(),
    });
  } catch (e) {
    console.warn('Firestore save community categories warning:', e);
  }
}

export async function fetchCommunityPosts(): Promise<CommunityPost[]> {
  let firestorePosts: CommunityPost[] = [];
  try {
    const snap = await getDocs(collection(db, 'community_posts'));
    snap.forEach((d) => {
      firestorePosts.push({ id: d.id, ...(d.data() as CommunityPost) });
    });
  } catch (e) {
    console.warn('Firestore community_posts read warning:', e);
  }

  let apiPosts: CommunityPost[] = [];
  let serverDeletedIds: string[] = [];
  try {
    const res = await fetch('/api/community');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.posts)) {
        apiPosts = data.posts;
      }
      if (Array.isArray(data.deletedIds)) {
        serverDeletedIds = data.deletedIds;
      }
    }
  } catch (e) {
    console.warn('API community read warning:', e);
  }

  let localDeletedIds: string[] = [];
  try {
    const raw = localStorage.getItem('deleted_community_post_ids');
    if (raw) localDeletedIds = JSON.parse(raw);
  } catch (e) {}

  const deletedSet = new Set([...localDeletedIds, ...serverDeletedIds]);

  const map = new Map<string, CommunityPost>();
  apiPosts.forEach((p) => {
    if (p && p.id && !deletedSet.has(p.id)) {
      map.set(p.id, p);
    }
  });
  firestorePosts.forEach((p) => {
    if (p && p.id && !deletedSet.has(p.id)) {
      const existing = map.get(p.id);
      const mergedReactions = {
        ...(existing?.reactions || {}),
        ...(p.reactions || {}),
      };
      map.set(p.id, { ...existing, ...p, reactions: mergedReactions });
    }
  });

  const merged = Array.from(map.values());
  merged.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  return merged;
}

export async function saveCommunityPost(post: CommunityPost): Promise<void> {
  try {
    const raw = localStorage.getItem('deleted_community_post_ids');
    if (raw) {
      const list = JSON.parse(raw) as string[];
      if (list.includes(post.id)) {
        localStorage.setItem(
          'deleted_community_post_ids',
          JSON.stringify(list.filter((id) => id !== post.id))
        );
      }
    }
  } catch (e) {}

  try {
    await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    });
  } catch (e) {
    console.warn('API save community post warning:', e);
  }

  try {
    await setDoc(doc(db, 'community_posts', post.id), post);
  } catch (e) {
    console.warn('Firestore save community post warning:', e);
  }
}

export async function deleteCommunityPost(postId: string): Promise<void> {
  try {
    const raw = localStorage.getItem('deleted_community_post_ids');
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(postId)) {
      list.push(postId);
      localStorage.setItem('deleted_community_post_ids', JSON.stringify(list));
    }
  } catch (e) {}

  try {
    await fetch(`/api/community/${encodeURIComponent(postId)}`, {
      method: 'DELETE',
    });
  } catch (e) {
    console.warn('API delete community post warning:', e);
  }

  try {
    await deleteDoc(doc(db, 'community_posts', postId));
  } catch (e) {
    console.warn('Firestore delete community post warning:', e);
  }
}

export async function reactToCommunityPost(
  post: CommunityPost,
  userId: string,
  reaction: ReactionType | null
): Promise<Record<string, ReactionType>> {
  const nextReactions: Record<string, ReactionType> = { ...(post.reactions || {}) };
  if (!reaction) {
    delete nextReactions[userId];
  } else {
    nextReactions[userId] = reaction;
  }

  try {
    await fetch(`/api/community/${encodeURIComponent(post.id)}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, reaction }),
    });
  } catch (e) {
    console.warn('API react community post warning:', e);
  }

  try {
    await updateDoc(doc(db, 'community_posts', post.id), {
      reactions: nextReactions,
    });
  } catch (e) {
    console.warn('Firestore react community post warning:', e);
  }

  return nextReactions;
}
