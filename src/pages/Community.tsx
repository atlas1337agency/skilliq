import React, { useState, useEffect, useMemo } from 'react';
import { Navigate, Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Heart,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Edit,
  Trash2,
  Pin,
  ExternalLink,
  Link as LinkIcon,
  Search,
  ShieldCheck,
  Calendar,
  Globe,
  Loader2,
  MessageSquareHeart,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  FolderKanban,
  CornerDownRight,
  SlidersHorizontal,
  Filter,
  RotateCcw,
  Sparkles,
  Clock,
  BookOpen,
  Flame,
  Eye,
  Share2,
  Check,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useStore } from '../store/useStore';
import { isSuperAdminEmail } from '../lib/admin';
import {
  CommunityPost,
  ReactionType,
  CommunityCategoryItem,
  fetchCommunityPosts,
  saveCommunityPost,
  deleteCommunityPost,
  reactToCommunityPost,
  fetchCommunityCategories,
  getTextDir,
} from '../lib/community';
import { CommunityPostModal } from '../components/CommunityPostModal';
import { SEO } from '../components/SEO';
import { cn } from '../lib/utils';

type SortOption = 'newest' | 'popular' | 'pinned';

const POSTS_PER_PAGE = 6;

export function Community() {
  const { postId } = useParams<{ postId?: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { user, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [categoriesTree, setCategoriesTree] = useState<CommunityCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Smart Filter & Pagination States
  const [selectedParentCategory, setSelectedParentCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [onlyMyLiked, setOnlyMyLiked] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Admin modal & Lightbox state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<CommunityPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const isAdmin = Boolean(
    user && (user.role === 'admin' || isSuperAdminEmail(user.email))
  );

  // Load and subscribe to community posts & categories
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const loadInitial = async () => {
      try {
        const [postList, catList] = await Promise.all([
          fetchCommunityPosts(),
          fetchCommunityCategories(),
        ]);
        if (isMounted) {
          setPosts(postList);
          setCategoriesTree(catList);
          setLoading(false);
        }
      } catch (e) {
        if (isMounted) setLoading(false);
      }
    };

    loadInitial();

    const unsub = onSnapshot(
      collection(db, 'community_posts'),
      async () => {
        const refreshed = await fetchCommunityPosts();
        if (isMounted) {
          setPosts(refreshed);
          setLoading(false);
        }
      },
      () => {
        loadInitial();
      }
    );

    return () => {
      isMounted = false;
      unsub();
    };
  }, [user]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedParentCategory, selectedSubCategory, searchQuery, sortBy, onlyMyLiked, language]);

  // Scroll to top smoothly when switching between post detail view or pagination pages
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [postId, currentPage]);

  // Strict Private Community Gate: If user is not logged in, redirect to home immediately
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Extract main thumbnail image (checks post.image first, then first markdown ![alt](url) in paragraph)
  const getPostMainThumbnail = (post: CommunityPost): string | null => {
    if (post.image && post.image.trim()) {
      return post.image.trim();
    }
    const mdMatch = (post.paragraph || '').match(/!\[[^\]]*\]\(([^)]+)\)/);
    if (mdMatch && mdMatch[1]) {
      return mdMatch[1].trim();
    }
    return null;
  };

  // Strip markdown formatting for clean card excerpt preview
  const getCleanExcerpt = (paragraph: string, maxLen = 155): string => {
    const cleaned = (paragraph || '')
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // remove inline images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // keep link text
      .replace(/(\*\*|==|\+\+|~~|`|\*)/g, '') // remove inline markers
      .replace(/^#{1,6}\s+/gm, '') // remove headings
      .replace(/^>\s+/gm, '') // remove blockquotes
      .replace(/^[-•]\s+/gm, '') // remove bullets
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned.length <= maxLen) return cleaned;
    return `${cleaned.slice(0, maxLen).trim()}...`;
  };

  // Estimate reading time in minutes
  const getReadingTimeMinutes = (post: CommunityPost): number => {
    const words = `${post.title || ''} ${post.subtitle || ''} ${post.paragraph || ''}`
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 180));
  };

  // Get reaction counts for a post
  const getPostReactionMetrics = (post: CommunityPost) => {
    const reactionsMap = post.reactions || {};
    let loveCount = 0;
    let likeCount = 0;
    let dislikeCount = 0;
    Object.values(reactionsMap).forEach((r) => {
      if (r === 'love') loveCount++;
      else if (r === 'like') likeCount++;
      else if (r === 'dislike') dislikeCount++;
    });
    const myReaction = user?.uid ? reactionsMap[user.uid] : undefined;
    const totalPositive = loveCount * 2 + likeCount;
    return {
      loveCount,
      likeCount,
      dislikeCount,
      totalReactions: loveCount + likeCount + dislikeCount,
      totalPositive,
      myReaction,
    };
  };

  // Language-scoped base posts
  const languageScopedPosts = useMemo(() => {
    return posts.filter((post) => {
      const postLang = post.language || 'all';
      return postLang === 'all' || postLang === language;
    });
  }, [posts, language]);

  // Combine saved category tree with any categories referenced on existing posts + calculate counts
  const mergedCategoriesTree = useMemo(() => {
    const map = new Map<
      string,
      { count: number; subMap: Map<string, number> }
    >();

    categoriesTree.forEach((c) => {
      if (c.name) {
        const sMap = new Map<string, number>();
        (c.subCategories || []).forEach((s) => sMap.set(s, 0));
        map.set(c.name, { count: 0, subMap: sMap });
      }
    });

    languageScopedPosts.forEach((p) => {
      if (p.category) {
        if (!map.has(p.category)) {
          map.set(p.category, { count: 0, subMap: new Map() });
        }
        const entry = map.get(p.category)!;
        entry.count += 1;
        if (p.subCategory) {
          entry.subMap.set(p.subCategory, (entry.subMap.get(p.subCategory) || 0) + 1);
        }
      }
    });

    return Array.from(map.entries()).map(([name, info]) => ({
      name,
      count: info.count,
      subCategories: Array.from(info.subMap.keys()),
      subCounts: Object.fromEntries(info.subMap.entries()),
    }));
  }, [categoriesTree, languageScopedPosts]);

  const activeParentObj = mergedCategoriesTree.find(
    (c) => c.name === selectedParentCategory
  );

  // Filter & Sort posts
  const filteredPosts = useMemo(() => {
    const list = languageScopedPosts.filter((post) => {
      if (selectedParentCategory !== 'All' && post.category !== selectedParentCategory) {
        return false;
      }

      if (selectedSubCategory !== 'All' && post.subCategory !== selectedSubCategory) {
        return false;
      }

      if (onlyMyLiked && user?.uid) {
        const myR = post.reactions?.[user.uid];
        if (myR !== 'love' && myR !== 'like') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (post.title || '').toLowerCase().includes(q);
        const matchSub = (post.subtitle || '').toLowerCase().includes(q);
        const matchPara = (post.paragraph || '').toLowerCase().includes(q);
        const matchCat = (post.category || '').toLowerCase().includes(q);
        const matchSubCat = (post.subCategory || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSub && !matchPara && !matchCat && !matchSubCat) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'pinned') {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      if (sortBy === 'popular') {
        const scoreA = getPostReactionMetrics(a).totalPositive;
        const scoreB = getPostReactionMetrics(b).totalPositive;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      // Default: Pinned first, then Newest
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [
    languageScopedPosts,
    selectedParentCategory,
    selectedSubCategory,
    onlyMyLiked,
    user?.uid,
    searchQuery,
    sortBy,
  ]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedPosts = useMemo(() => {
    const start = (safeCurrentPage - 1) * POSTS_PER_PAGE;
    return filteredPosts.slice(start, start + POSTS_PER_PAGE);
  }, [filteredPosts, safeCurrentPage]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedParentCategory !== 'All') count++;
    if (selectedSubCategory !== 'All') count++;
    if (onlyMyLiked) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedParentCategory, selectedSubCategory, onlyMyLiked, searchQuery]);

  const resetAllFilters = () => {
    setSelectedParentCategory('All');
    setSelectedSubCategory('All');
    setOnlyMyLiked(false);
    setSearchQuery('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Active Single Post (when user clicks a post card or visits /community/:postId)
  const activePost = useMemo(() => {
    if (!postId) return null;
    return posts.find((p) => p.id === postId) || null;
  }, [postId, posts]);

  // Previous / Next posts for organic reading navigation
  const { prevPost, nextPost, recommendedPosts } = useMemo(() => {
    if (!activePost) {
      return { prevPost: null, nextPost: null, recommendedPosts: [] as CommunityPost[] };
    }
    const pool = languageScopedPosts.length > 0 ? languageScopedPosts : posts;
    const idx = pool.findIndex((p) => p.id === activePost.id);
    const prev = idx > 0 ? pool[idx - 1] : null;
    const next = idx !== -1 && idx < pool.length - 1 ? pool[idx + 1] : null;

    // Smart Organic Recommendations: prioritize same subCategory -> same category -> most loved/recent
    const others = pool.filter((p) => p.id !== activePost.id);
    const scored = others.map((candidate) => {
      let score = 0;
      if (
        activePost.subCategory &&
        candidate.subCategory &&
        candidate.subCategory === activePost.subCategory
      ) {
        score += 50;
      }
      if (
        activePost.category &&
        candidate.category &&
        candidate.category === activePost.category
      ) {
        score += 30;
      }
      if (candidate.isPinned) score += 5;
      score += Math.min(20, getPostReactionMetrics(candidate).totalPositive * 2);
      return { candidate, score };
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.candidate.createdAt || 0) - (a.candidate.createdAt || 0);
    });

    return {
      prevPost: prev,
      nextPost: next,
      recommendedPosts: scored.slice(0, 3).map((s) => s.candidate),
    };
  }, [activePost, languageScopedPosts, posts]);

  // Handle Admin Category / Sub-Category Deletion (also cleans up any posts referencing the deleted category)
  const handleCategoryDeleted = async (parentName: string, subName?: string) => {
    if (!parentName) return;

    if (!subName) {
      // Parent category deleted -> clear category & subCategory on any posts using it
      if (selectedParentCategory === parentName) {
        setSelectedParentCategory('All');
        setSelectedSubCategory('All');
      }
      const affected = posts.filter((p) => p.category === parentName);
      if (affected.length > 0) {
        setPosts((prev) =>
          prev.map((p) =>
            p.category === parentName ? { ...p, category: '', subCategory: '' } : p
          )
        );
        for (const p of affected) {
          await saveCommunityPost({ ...p, category: '', subCategory: '', updatedAt: Date.now() });
        }
      }
    } else {
      // Sub-category deleted -> clear subCategory on any posts using it under parentName
      if (selectedParentCategory === parentName && selectedSubCategory === subName) {
        setSelectedSubCategory('All');
      }
      const affected = posts.filter(
        (p) => p.category === parentName && p.subCategory === subName
      );
      if (affected.length > 0) {
        setPosts((prev) =>
          prev.map((p) =>
            p.category === parentName && p.subCategory === subName
              ? { ...p, subCategory: '' }
              : p
          )
        );
        for (const p of affected) {
          await saveCommunityPost({ ...p, subCategory: '', updatedAt: Date.now() });
        }
      }
    }
  };

  // Handle Admin Save Post
  const handleSavePost = async (postData: CommunityPost) => {
    await saveCommunityPost(postData);
    setPosts((prev) => {
      const exists = prev.some((p) => p.id === postData.id);
      const updated = exists
        ? prev.map((p) => (p.id === postData.id ? postData : p))
        : [postData, ...prev];
      return [...updated].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    });
    setIsModalOpen(false);
    setEditingPost(null);
  };

  // Handle Admin Toggle Pin
  const handleTogglePin = async (post: CommunityPost, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin) return;
    const updated: CommunityPost = { ...post, isPinned: !post.isPinned, updatedAt: Date.now() };
    await handleSavePost(updated);
  };

  // Handle Admin Delete Post
  const handleConfirmDelete = async () => {
    if (!deletingPost) return;
    setIsDeleting(true);
    try {
      const deletedId = deletingPost.id;
      await deleteCommunityPost(deletedId);
      setPosts((prev) => prev.filter((p) => p.id !== deletedId));
      setDeletingPost(null);
      if (postId === deletedId) {
        navigate('/community');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Member Reaction (Love, Like, Dislike)
  const handleReaction = async (
    post: CommunityPost,
    type: ReactionType,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    if (!user?.uid) return;
    const currentReaction = post.reactions?.[user.uid] || null;
    const nextReaction: ReactionType | null = currentReaction === type ? null : type;

    const optimisticReactions: Record<string, ReactionType> = { ...(post.reactions || {}) };
    if (!nextReaction) {
      delete optimisticReactions[user.uid];
    } else {
      optimisticReactions[user.uid] = nextReaction;
    }

    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, reactions: optimisticReactions } : p))
    );

    await reactToCommunityPost(post, user.uid, nextReaction);
  };

  const handleSharePost = (post: CommunityPost, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}/community/${post.id}`;
    navigator.clipboard?.writeText(shareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 1800);
  };

  const formatPostDate = (timestamp: number) => {
    try {
      return new Intl.DateTimeFormat(isRtl ? 'ar-MA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(timestamp));
    } catch {
      return '';
    }
  };

  // Smart Inline Formatting Parser (Bold, Italic, Underline, Strike, Highlight, Code, Inline Links)
  const renderInlineTokens = (text: string) => {
    const tokenRegex =
      /(\*\*[^*]+\*\*|==[^=]+==|\+\+[^+]+\+\+|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, idx) => {
      if (!part) return null;

      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={idx} className="font-extrabold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('==') && part.endsWith('==') && part.length > 4) {
        return (
          <mark
            key={idx}
            className="bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-semibold"
          >
            {part.slice(2, -2)}
          </mark>
        );
      }
      if (part.startsWith('++') && part.endsWith('++') && part.length > 4) {
        return (
          <u key={idx} className="underline decoration-primary decoration-2 underline-offset-4">
            {part.slice(2, -2)}
          </u>
        );
      }
      if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
        return (
          <del key={idx} className="line-through text-muted-foreground">
            {part.slice(2, -2)}
          </del>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded-md bg-muted border border-border/70 font-mono text-xs text-primary"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (match) {
          const [, label, url] = match;
          return (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-primary font-bold underline underline-offset-4 hover:text-primary/80 transition-colors"
            >
              <span>{label}</span>
              <ExternalLink className="w-3 h-3 inline shrink-0" />
            </a>
          );
        }
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <em key={idx} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      }

      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  // Smart Block Renderer (Headings, Lists, Quotes, Inline Images, Paragraphs)
  const renderSmartContent = (content: string) => {
    const lines = (content || '').split('\n');
    return (
      <div className="space-y-4 text-sm sm:text-base md:text-[17px] text-foreground/90 leading-relaxed">
        {lines.map((rawLine, idx) => {
          const line = rawLine.trim();
          if (!line) {
            return <div key={idx} className="h-2" />;
          }

          // Inline Image Block: ![alt](url)
          const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
          if (imgMatch) {
            const [, altText, imgUrl] = imgMatch;
            return (
              <figure key={idx} className="my-5 space-y-2">
                <div
                  onClick={() => setLightboxImage(imgUrl)}
                  className="rounded-2xl overflow-hidden border border-border/70 bg-muted/30 max-h-[520px] flex items-center justify-center cursor-zoom-in group shadow-xs"
                >
                  <img
                    src={imgUrl}
                    alt={altText || 'Post image'}
                    className="w-full max-h-[520px] object-cover group-hover:scale-[1.01] transition-transform duration-300"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {altText && altText !== 'Post Image' && (
                  <figcaption className="text-xs text-muted-foreground text-center">
                    {altText}
                  </figcaption>
                )}
              </figure>
            );
          }

          // Heading H2
          if (line.startsWith('## ')) {
            return (
              <h3
                key={idx}
                className="text-lg sm:text-2xl font-black text-foreground pt-3 tracking-tight"
              >
                {renderInlineTokens(line.slice(3))}
              </h3>
            );
          }

          // Heading H3
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-base sm:text-xl font-extrabold text-foreground pt-2">
                {renderInlineTokens(line.slice(4))}
              </h4>
            );
          }

          // Blockquote
          if (line.startsWith('> ')) {
            return (
              <blockquote
                key={idx}
                className="ps-4 py-2.5 border-s-4 border-primary bg-primary/5 rounded-e-2xl italic text-foreground/90 font-medium"
              >
                {renderInlineTokens(line.slice(2))}
              </blockquote>
            );
          }

          // Bullet List Item
          if (line.startsWith('- ') || line.startsWith('• ')) {
            return (
              <div key={idx} className="flex items-start gap-2.5 ps-2">
                <span className="w-2 h-2 rounded-full bg-primary mt-2.5 shrink-0" />
                <div className="flex-1">{renderInlineTokens(line.slice(2))}</div>
              </div>
            );
          }

          // Numbered List Item
          const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2.5 ps-2">
                <span className="text-sm font-extrabold text-primary mt-0.5 shrink-0">
                  {numMatch[1]}.
                </span>
                <div className="flex-1">{renderInlineTokens(numMatch[2])}</div>
              </div>
            );
          }

          return <p key={idx}>{renderInlineTokens(rawLine)}</p>;
        })}
      </div>
    );
  };

  // Reusable Post Card Component (used in both Main Feed Grid and Recommended Posts section)
  const renderPostCard = (post: CommunityPost, index = 0) => {
    const postDir = getTextDir(
      `${post.title || ''} ${post.paragraph || ''}`,
      post.language === 'ar' || isRtl
    );
    const thumbnail = getPostMainThumbnail(post);
    const excerpt = getCleanExcerpt(post.paragraph, 145);
    const readMins = getReadingTimeMinutes(post);
    const { loveCount, likeCount, dislikeCount, myReaction } = getPostReactionMetrics(post);

    return (
      <motion.article
        key={post.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.2) }}
        onClick={() => navigate(`/community/${post.id}`)}
        className={cn(
          'group bg-card rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1 hover:shadow-xl',
          post.isPinned
            ? 'border-amber-500/40 ring-1 ring-amber-500/20 shadow-sm'
            : 'border-border/80 hover:border-primary/40 shadow-xs'
        )}
      >
        {/* MAIN IMAGE THUMBNAIL */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40 border-b border-border/50">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/15 via-primary/5 to-muted flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center mb-2 shadow-inner">
                <MessageSquareHeart className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary/80 line-clamp-1">
                {post.category || (isRtl ? 'مجتمع Skilliq' : 'Skilliq Community')}
              </span>
            </div>
          )}

          {/* Top Overlay Badges (Pinned + Category) */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
            <div className="flex items-center gap-1.5 flex-wrap">
              {post.category && (
                <span className="px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-white text-[11px] font-bold border border-white/15 shadow-sm flex items-center gap-1">
                  <FolderKanban className="w-3 h-3 text-primary" />
                  <span>{post.category}</span>
                  {post.subCategory && (
                    <span className="text-primary-foreground/80">› {post.subCategory}</span>
                  )}
                </span>
              )}
              {post.isPinned && (
                <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-black text-[11px] font-extrabold shadow-sm flex items-center gap-1">
                  <Pin className="w-3 h-3 fill-current" />
                  <span>{isRtl ? 'مثبت' : 'Pinned'}</span>
                </span>
              )}
            </div>

            <span className="px-2.5 py-1 rounded-xl bg-black/65 backdrop-blur-md text-white/90 text-[10px] font-bold border border-white/10 flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" />
              <span>
                {readMins} {isRtl ? 'د قراءة' : 'min read'}
              </span>
            </span>
          </div>

          {/* Admin Quick Controls Overlay on Card */}
          {isAdmin && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-3 end-3 flex items-center gap-1 bg-black/75 backdrop-blur-md p-1 rounded-xl border border-white/15"
            >
              <button
                type="button"
                onClick={(e) => handleTogglePin(post, e)}
                className={cn(
                  'p-1.5 rounded-lg transition-colors cursor-pointer',
                  post.isPinned
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
                title={isRtl ? 'تثبيت / إلغاء تثبيت' : 'Pin / Unpin'}
              >
                <Pin className={cn('w-3.5 h-3.5', post.isPinned && 'fill-current')} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingPost(post);
                  setIsModalOpen(true);
                }}
                className="p-1.5 rounded-lg text-white/80 hover:text-primary hover:bg-white/10 transition-colors cursor-pointer"
                title={isRtl ? 'تعديل المنشور' : 'Edit Post'}
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingPost(post);
                }}
                className="p-1.5 rounded-lg text-white/80 hover:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                title={isRtl ? 'حذف المنشور' : 'Delete Post'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* CARD CONTENT BODY */}
        <div
          dir={postDir}
          className={cn(
            'p-5 flex-1 flex flex-col justify-between gap-4',
            postDir === 'rtl' ? 'text-right' : 'text-left'
          )}
        >
          <div className="space-y-2">
            {/* Author & Date Row */}
            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={post.authorAvatar || '/images/favicon.png'}
                  alt={post.authorName || 'Skilliq Admin'}
                  className="w-5 h-5 rounded-full object-cover border border-border shrink-0"
                  referrerPolicy="no-referrer"
                />
                <span className="font-bold text-foreground/90 truncate">
                  {post.authorName || 'Skilliq Admin'}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
              </div>
              <span className="inline-flex items-center gap-1 shrink-0">
                <Calendar className="w-3 h-3" />
                <span>{formatPostDate(post.createdAt)}</span>
              </span>
            </div>

            {/* Post Title */}
            <h3 className="text-base sm:text-lg font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
              {post.title}
            </h3>

            {/* Post Subtitle */}
            {post.subtitle && (
              <p className="text-xs font-bold text-primary/90 line-clamp-1">
                {post.subtitle}
              </p>
            )}

            {/* Post Excerpt */}
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {excerpt}
            </p>
          </div>

          {/* CARD FOOTER: Quick Reactions + Read Full Post CTA */}
          <div className="pt-3.5 border-t border-border/60 flex items-center justify-between gap-2">
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5"
            >
              <button
                type="button"
                onClick={(e) => handleReaction(post, 'love', e)}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer active:scale-95',
                  myReaction === 'love'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-2xs'
                    : 'bg-muted/40 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 border-border/70'
                )}
                title={isRtl ? 'أحببته' : 'Love'}
              >
                <Heart className={cn('w-3.5 h-3.5', myReaction === 'love' && 'fill-current')} />
                <span>{loveCount}</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleReaction(post, 'like', e)}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer active:scale-95',
                  myReaction === 'like'
                    ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                    : 'bg-muted/40 hover:bg-primary/10 text-muted-foreground hover:text-primary border-border/70'
                )}
                title={isRtl ? 'أعجبني' : 'Like'}
              >
                <ThumbsUp className={cn('w-3.5 h-3.5', myReaction === 'like' && 'fill-current')} />
                <span>{likeCount}</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleReaction(post, 'dislike', e)}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer active:scale-95',
                  myReaction === 'dislike'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border/70'
                )}
                title={isRtl ? 'لم يعجبني' : 'Dislike'}
              >
                <ThumbsDown className={cn('w-3 h-3', myReaction === 'dislike' && 'fill-current')} />
                <span>{dislikeCount}</span>
              </button>
            </div>

            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-primary group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform shrink-0">
              <span>{isRtl ? 'قراءة المقال' : 'Read Post'}</span>
              {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </span>
          </div>
        </div>
      </motion.article>
    );
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full min-h-screen bg-background text-foreground pb-24">
      <SEO
        title={
          activePost
            ? `${activePost.title} | ${isRtl ? 'مجتمع Skilliq' : 'Skilliq Community'}`
            : isRtl
            ? 'مجتمع Skilliq الخاص للأعضاء'
            : 'Skilliq Private Community'
        }
        description={
          activePost
            ? getCleanExcerpt(activePost.paragraph, 160)
            : isRtl
            ? 'مجتمع حصري لأعضاء منصة Skilliq لمتابعة أحدث الإعلانات والمصادر التقنية والفرص المهنية.'
            : 'Exclusive private community feed for Skilliq members featuring curated announcements, resources, and tech updates.'
        }
        image={activePost ? getPostMainThumbnail(activePost) || undefined : undefined}
        canonicalPath={activePost ? `/community/${activePost.id}` : '/community'}
        lang={isRtl ? 'ar' : 'en'}
      />

      {/* ADMIN FULL-SCREEN CREATE / EDIT POST MODAL */}
      <CommunityPostModal
        isOpen={isModalOpen}
        postToEdit={editingPost}
        categoriesTree={mergedCategoriesTree}
        onCategoriesUpdated={setCategoriesTree}
        onCategoryDeleted={handleCategoryDeleted}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPost(null);
        }}
        onSaved={handleSavePost}
      />

      {/* ADMIN DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingPost && (
          <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-3xl border border-border p-6 shadow-2xl space-y-4 text-start"
            >
              <div className="flex items-center gap-3 text-rose-500">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-foreground">
                  {isRtl ? 'حذف المنشور نهائياً؟' : 'Delete Community Post?'}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isRtl
                  ? `هل أنت متأكد من رغبتك في حذف المنشور "${deletingPost.title}"؟ لا يمكن التراجع عن هذا الإجراء.`
                  : `Are you sure you want to permanently delete "${deletingPost.title}"? This action cannot be undone.`}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingPost(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-foreground cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isRtl ? 'حذف نهائي' : 'Delete Post'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IMAGE LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[240] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="fixed top-5 end-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.img
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              src={lightboxImage}
              alt="Post media"
              className="max-w-full max-h-[88vh] rounded-2xl object-contain shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          VIEW 1: DEDICATED FULL POST READER + ORGANIC RECOMMENDATIONS
      ===================================================================== */}
      {postId ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
          {/* Top Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <button
              type="button"
              onClick={() => navigate('/community')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card border border-border/80 hover:border-primary/40 hover:bg-muted/60 text-xs sm:text-sm font-bold text-foreground transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 text-primary" />
              <span>{isRtl ? 'العودة إلى جميع منشورات المجتمع' : 'Back to All Community Posts'}</span>
            </button>

            {activePost && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleSharePost(activePost, e)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-card border border-border/80 hover:bg-muted text-xs font-bold text-foreground transition-colors cursor-pointer"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">
                        {isRtl ? 'تم نسخ الرابط!' : 'Link Copied!'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-primary" />
                      <span>{isRtl ? 'مشاركة المنشور' : 'Share Post'}</span>
                    </>
                  )}
                </button>

                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => handleTogglePin(activePost, e)}
                      className={cn(
                        'p-2.5 rounded-2xl border transition-colors cursor-pointer',
                        activePost.isPinned
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-500'
                          : 'bg-card border-border text-muted-foreground hover:text-foreground'
                      )}
                      title={isRtl ? 'تثبيت / إلغاء تثبيت' : 'Pin / Unpin Post'}
                    >
                      <Pin className={cn('w-4 h-4', activePost.isPinned && 'fill-current')} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPost(activePost);
                        setIsModalOpen(true);
                      }}
                      className="p-2.5 rounded-2xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      title={isRtl ? 'تعديل المنشور' : 'Edit Post'}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingPost(activePost)}
                      className="p-2.5 rounded-2xl border border-border bg-card hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                      title={isRtl ? 'حذف المنشور' : 'Delete Post'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs sm:text-sm font-semibold">
                {isRtl ? 'جاري تحميل المنشور...' : 'Loading post...'}
              </p>
            </div>
          ) : !activePost ? (
            <div className="p-12 rounded-3xl bg-card border border-border text-center space-y-4">
              <MessageSquareHeart className="w-10 h-10 text-primary mx-auto opacity-60" />
              <h2 className="text-xl font-extrabold">
                {isRtl ? 'المنشور غير موجود' : 'Post Not Found'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isRtl
                  ? 'ربما تم حذف هذا المنشور أو نقله.'
                  : 'This community post may have been removed or moved.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/community')}
                className="px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold cursor-pointer"
              >
                {isRtl ? 'العودة للمجتمع' : 'Return to Community'}
              </button>
            </div>
          ) : (
            (() => {
              const postDir = getTextDir(
                `${activePost.title || ''} ${activePost.paragraph || ''}`,
                activePost.language === 'ar' || isRtl
              );
              const { loveCount, likeCount, dislikeCount, myReaction } =
                getPostReactionMetrics(activePost);
              const readMins = getReadingTimeMinutes(activePost);

              return (
                <div className="space-y-10">
                  {/* FULL ARTICLE READER CARD */}
                  <article className="bg-card rounded-3xl border border-border/90 shadow-md overflow-hidden">
                    {/* Article Header Meta */}
                    <div className="p-6 sm:p-8 border-b border-border/60 bg-gradient-to-b from-primary/5 to-transparent">
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        {activePost.category && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedParentCategory(activePost.category);
                              setSelectedSubCategory('All');
                              navigate('/community');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/15 text-primary text-xs font-extrabold hover:bg-primary/25 transition-colors cursor-pointer"
                          >
                            <FolderKanban className="w-3.5 h-3.5" />
                            <span>{activePost.category}</span>
                          </button>
                        )}
                        {activePost.subCategory && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedParentCategory(activePost.category);
                              setSelectedSubCategory(activePost.subCategory || 'All');
                              navigate('/community');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-muted text-foreground/90 text-xs font-bold hover:bg-muted/80 transition-colors cursor-pointer"
                          >
                            <span>{activePost.subCategory}</span>
                          </button>
                        )}
                        {activePost.isPinned && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold">
                            <Pin className="w-3.5 h-3.5 fill-current" />
                            <span>{isRtl ? 'منشور مثبت' : 'Pinned Post'}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ms-auto">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span>
                            {readMins} {isRtl ? 'دقائق قراءة' : 'min read'}
                          </span>
                        </span>
                      </div>

                      <div
                        dir={postDir}
                        className={cn(
                          'space-y-3',
                          postDir === 'rtl' ? 'text-right' : 'text-left'
                        )}
                      >
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground leading-tight tracking-tight">
                          {activePost.title}
                        </h1>
                        {activePost.subtitle && (
                          <p className="text-sm sm:text-lg font-bold text-primary/90 leading-relaxed">
                            {activePost.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Author Info Strip */}
                      <div className="mt-6 pt-5 border-t border-border/50 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={activePost.authorAvatar || '/images/favicon.png'}
                            alt={activePost.authorName || 'Skilliq Admin'}
                            className="w-11 h-11 rounded-2xl object-cover border border-border bg-muted shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="text-start">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-extrabold text-foreground">
                                {activePost.authorName || 'Skilliq Admin'}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                <ShieldCheck className="w-3 h-3" />
                                <span>{isRtl ? 'المشرف الرسمي' : 'Official Admin'}</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formatPostDate(activePost.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Top Quick Reactions */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleReaction(activePost, 'love', e)}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer',
                              myReaction === 'love'
                                ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                                : 'bg-background hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 border-border'
                            )}
                          >
                            <Heart className={cn('w-4 h-4', myReaction === 'love' && 'fill-current')} />
                            <span>{loveCount}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleReaction(activePost, 'like', e)}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer',
                              myReaction === 'like'
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'bg-background hover:bg-primary/10 text-muted-foreground hover:text-primary border-border'
                            )}
                          >
                            <ThumbsUp className={cn('w-4 h-4', myReaction === 'like' && 'fill-current')} />
                            <span>{likeCount}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Main Hero Image (if post.image is set) */}
                    {activePost.image && (
                      <div
                        onClick={() => setLightboxImage(activePost.image || null)}
                        className="w-full bg-muted/30 border-b border-border/50 max-h-[560px] overflow-hidden flex items-center justify-center cursor-zoom-in group"
                      >
                        <img
                          src={activePost.image}
                          alt={activePost.title}
                          className="w-full max-h-[560px] object-cover group-hover:scale-[1.01] transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Full Post Body Content */}
                    <div
                      dir={postDir}
                      className={cn(
                        'p-6 sm:p-10 space-y-6',
                        postDir === 'rtl' ? 'text-right' : 'text-left'
                      )}
                    >
                      {renderSmartContent(activePost.paragraph)}

                      {/* Attached Links */}
                      {activePost.links && activePost.links.length > 0 && (
                        <div className="pt-4 border-t border-border/50 space-y-2.5">
                          <div className="text-xs font-extrabold text-muted-foreground flex items-center gap-1.5">
                            <LinkIcon className="w-4 h-4 text-primary" />
                            <span>{postDir === 'rtl' ? 'روابط ومصادر مرفقة:' : 'Attached Resources & Links:'}</span>
                          </div>
                          <div className="flex flex-wrap gap-2.5">
                            {activePost.links.map((lnk, lIdx) => (
                              <a
                                key={lIdx}
                                href={lnk.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/60 hover:bg-primary/10 border border-border/80 hover:border-primary/40 text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-all"
                              >
                                <span>{lnk.label}</span>
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {activePost.buttons && activePost.buttons.length > 0 && (
                        <div className="pt-4 flex flex-wrap items-center gap-3">
                          {activePost.buttons.map((btn, bIdx) => {
                            const isInternal = btn.url.startsWith('/');
                            const btnClasses = cn(
                              'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all active:scale-98 cursor-pointer shadow-sm',
                              btn.variant === 'secondary'
                                ? 'bg-foreground text-background hover:bg-foreground/90'
                                : btn.variant === 'outline'
                                ? 'bg-background hover:bg-muted text-foreground border border-border'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            );

                            return isInternal ? (
                              <Link key={bIdx} to={btn.url} className={btnClasses}>
                                <span>{btn.label}</span>
                                <ArrowUpRight className="w-4 h-4" />
                              </Link>
                            ) : (
                              <a
                                key={bIdx}
                                href={btn.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={btnClasses}
                              >
                                <span>{btn.label}</span>
                                <ArrowUpRight className="w-4 h-4" />
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Bottom Engagement & Reactions Bar */}
                    <div className="px-6 sm:px-10 py-5 bg-muted/25 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-0.5 text-start">
                        <div className="text-xs sm:text-sm font-extrabold text-foreground">
                          {isRtl ? 'ما رأيك في هذا المنشور؟' : 'What did you think of this post?'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {isRtl
                            ? 'تفاعلك يساعدنا على تقديم محتوى أفضل لأعضاء المجتمع'
                            : 'Your feedback helps us curate the best content for the community'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => handleReaction(activePost, 'love', e)}
                          className={cn(
                            'inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold border transition-all active:scale-95 cursor-pointer',
                            myReaction === 'love'
                              ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                              : 'bg-card hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 border-border'
                          )}
                        >
                          <Heart className={cn('w-4 h-4', myReaction === 'love' && 'fill-current')} />
                          <span>{isRtl ? 'أحببته' : 'Love'}</span>
                          <span className="font-mono px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-xs">
                            {loveCount}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleReaction(activePost, 'like', e)}
                          className={cn(
                            'inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold border transition-all active:scale-95 cursor-pointer',
                            myReaction === 'like'
                              ? 'bg-primary text-primary-foreground border-primary shadow-md'
                              : 'bg-card hover:bg-primary/10 text-muted-foreground hover:text-primary border-border'
                          )}
                        >
                          <ThumbsUp className={cn('w-4 h-4', myReaction === 'like' && 'fill-current')} />
                          <span>{isRtl ? 'أعجبني' : 'Like'}</span>
                          <span className="font-mono px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-xs">
                            {likeCount}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleReaction(activePost, 'dislike', e)}
                          className={cn(
                            'inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border transition-all active:scale-95 cursor-pointer',
                            myReaction === 'dislike'
                              ? 'bg-foreground text-background border-foreground shadow-sm'
                              : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border'
                          )}
                        >
                          <ThumbsDown className={cn('w-4 h-4', myReaction === 'dislike' && 'fill-current')} />
                          <span className="font-mono text-xs">{dislikeCount}</span>
                        </button>
                      </div>
                    </div>
                  </article>

                  {/* PREVIOUS / NEXT POST ORGANIC NAVIGATION */}
                  {(prevPost || nextPost) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {prevPost ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/community/${prevPost.id}`)}
                          className="p-5 rounded-3xl bg-card border border-border/80 hover:border-primary/50 hover:shadow-md transition-all text-start flex flex-col justify-between gap-2 group cursor-pointer"
                        >
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 text-primary group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform" />
                            <span>{isRtl ? 'المنشور السابق' : 'Previous Post'}</span>
                          </span>
                          <span className="text-sm sm:text-base font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {prevPost.title}
                          </span>
                        </button>
                      ) : (
                        <div className="hidden sm:block" />
                      )}

                      {nextPost && (
                        <button
                          type="button"
                          onClick={() => navigate(`/community/${nextPost.id}`)}
                          className="p-5 rounded-3xl bg-card border border-border/80 hover:border-primary/50 hover:shadow-md transition-all text-end flex flex-col justify-between items-end gap-2 group cursor-pointer"
                        >
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <span>{isRtl ? 'المنشور التالي' : 'Next Post'}</span>
                            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 text-primary group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                          </span>
                          <span className="text-sm sm:text-base font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {nextPost.title}
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* RECOMMENDED SIMILAR POSTS TO KEEP USERS READING */}
                  {recommendedPosts.length > 0 && (
                    <div className="pt-6 border-t border-border/70 space-y-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div className="text-start">
                            <h2 className="text-lg sm:text-xl font-black text-foreground">
                              {isRtl ? 'منشورات مقترحة قد تعجبك' : 'Recommended Posts For You'}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                              {isRtl
                                ? 'مواضيع مشابهة في المجتمع لمواصلة القراءة والاستفادة'
                                : 'Handpicked related community posts to keep exploring'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate('/community')}
                          className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <span>{isRtl ? 'عرض الكل' : 'View All'}</span>
                          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommendedPosts.map((rec, i) => renderPostCard(rec, i))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      ) : (
        /* =====================================================================
           VIEW 2: ORGANIC COMMUNITY HUB (CARDS + SIDEBAR FILTER + PAGINATION)
        ===================================================================== */
        <>
          {/* HERO BANNER */}
          <section className="relative overflow-hidden pt-8 sm:pt-12 pb-8 sm:pb-10 border-b border-border/70 bg-gradient-to-b from-primary/5 via-background to-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="text-start">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-3">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      {isRtl ? 'مجتمع حصري للأعضاء المسجلين فقط' : 'Members-Only Private Community'}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
                    {isRtl ? 'مجتمع Skilliq الخاص' : 'Skilliq Private Community'}
                  </h1>

                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                    {isRtl
                      ? 'استكشف أحدث المقالات، الإعلانات الرسمية، المصادر التقنية، والفرص المهنية المصنفة بذكاء لأعضاء المنصة.'
                      : 'Explore official announcements, curated articles, engineering resources, and career insights organized for Skilliq members.'}
                  </p>
                </div>

                {/* Admin Quick Post Trigger */}
                {isAdmin && (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPost(null);
                        setIsModalOpen(true);
                      }}
                      className="px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isRtl ? 'نشر منشور جديد' : 'Create New Post'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* MAIN CONTENT CONTAINER */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
            {/* TOP SEARCH, SORT & MOBILE FILTER TRIGGER BAR */}
            <div className="space-y-4 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 group">
                  <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors absolute top-1/2 -translate-y-1/2 start-4 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isRtl
                        ? 'ابحث في المنشورات بالعنوان أو المحتوى أو التصنيف...'
                        : 'Search posts by title, topic, category, or keyword...'
                    }
                    className="w-full ps-11 pe-10 py-3.5 rounded-2xl bg-card border border-border/80 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute top-1/2 -translate-y-1/2 end-3.5 p-1 rounded-full bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort Select & Mobile Filters Trigger */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative flex-1 sm:flex-initial">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="w-full sm:w-48 appearance-none bg-card border border-border/80 text-foreground py-3.5 px-4 pe-9 rounded-2xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer shadow-xs"
                    >
                      <option value="newest">
                        {isRtl ? 'الأحدث أولاً' : 'Newest First'}
                      </option>
                      <option value="popular">
                        {isRtl ? 'الأكثر تفاعلاً وإعجاباً' : 'Most Popular'}
                      </option>
                      <option value="pinned">
                        {isRtl ? 'المثبتة أولاً' : 'Pinned First'}
                      </option>
                    </select>
                    <SlidersHorizontal className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 end-3.5 pointer-events-none" />
                  </div>

                  {/* Mobile / Tablet Filter Drawer Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="lg:hidden inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-xs cursor-pointer shrink-0"
                  >
                    <Filter className="w-4 h-4" />
                    <span>{isRtl ? 'التصنيفات والفلاتر' : 'Categories'}</span>
                    {activeFiltersCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-background text-foreground text-xs font-black flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Horizontal Category Chips for Fast Switching */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedParentCategory('All');
                    setSelectedSubCategory('All');
                  }}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1.5 shrink-0',
                    selectedParentCategory === 'All'
                      ? 'bg-foreground text-background border-foreground shadow-xs'
                      : 'bg-card text-muted-foreground border-border/80 hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  <span>{isRtl ? 'جميع المنشورات' : 'All Posts'}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-md font-extrabold',
                      selectedParentCategory === 'All'
                        ? 'bg-background/20 text-background'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {languageScopedPosts.length}
                  </span>
                </button>

                {mergedCategoriesTree.map((cat) => {
                  const isSelected = selectedParentCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => {
                        setSelectedParentCategory(cat.name);
                        setSelectedSubCategory('All');
                      }}
                      className={cn(
                        'px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1.5 shrink-0',
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                          : 'bg-card text-muted-foreground border-border/80 hover:text-foreground hover:bg-muted/60'
                      )}
                    >
                      <span>{cat.name}</span>
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-md font-extrabold',
                          isSelected
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Filters Strip */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? 'الفلاتر النشطة:' : 'Active Filters:'}</span>
                  </span>

                  {selectedParentCategory !== 'All' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
                      <span>{selectedParentCategory}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedParentCategory('All');
                          setSelectedSubCategory('All');
                        }}
                        className="hover:opacity-75 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}

                  {selectedSubCategory !== 'All' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
                      <span>{selectedSubCategory}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedSubCategory('All')}
                        className="hover:opacity-75 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}

                  {onlyMyLiked && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-bold">
                      <span>{isRtl ? 'تفاعلاتي المفضلة' : 'Liked by Me'}</span>
                      <button
                        type="button"
                        onClick={() => setOnlyMyLiked(false)}
                        className="hover:opacity-75 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground underline flex items-center gap-1 ms-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{isRtl ? 'إعادة ضبط' : 'Reset All'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* TWO-COLUMN ORGANIC LAYOUT: SIDEBAR FILTER MENU + POST CARDS GRID */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* DESKTOP SMART SIDEBAR FILTER MENU */}
              <aside className="hidden lg:block w-72 shrink-0 sticky top-24 space-y-6">
                <div className="bg-card border border-border/80 p-5 rounded-3xl shadow-xs space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <h2 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-primary" />
                      <span>{isRtl ? 'تصفية وتنظيم المجتمع' : 'Community Filters'}</span>
                    </h2>
                    {activeFiltersCount > 0 && (
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        {isRtl ? 'مسح' : 'Reset'}
                      </button>
                    )}
                  </div>

                  {/* PARENT & SUB-CATEGORIES TREE INSIDE SIDEBAR */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        <span>{isRtl ? 'التصنيفات' : 'Categories'}</span>
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {mergedCategoriesTree.length}
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-[380px] overflow-y-auto pe-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedParentCategory('All');
                          setSelectedSubCategory('All');
                        }}
                        className={cn(
                          'w-full text-start px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer border',
                          selectedParentCategory === 'All'
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'bg-muted/30 border-transparent hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <span>{isRtl ? 'جميع المنشورات' : 'All Categories'}</span>
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-md font-extrabold',
                            selectedParentCategory === 'All'
                              ? 'bg-primary-foreground/20 text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {languageScopedPosts.length}
                        </span>
                      </button>

                      {mergedCategoriesTree.map((cat) => {
                        const isParentSelected = selectedParentCategory === cat.name;
                        return (
                          <div key={cat.name} className="space-y-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedParentCategory(cat.name);
                                setSelectedSubCategory('All');
                              }}
                              className={cn(
                                'w-full text-start px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer border',
                                isParentSelected
                                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                  : 'bg-muted/30 border-transparent hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                              )}
                            >
                              <span className="truncate pe-2">{cat.name}</span>
                              <span
                                className={cn(
                                  'text-[10px] px-1.5 py-0.5 rounded-md font-extrabold shrink-0',
                                  isParentSelected
                                    ? 'bg-primary-foreground/20 text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                )}
                              >
                                {cat.count}
                              </span>
                            </button>

                            {/* Nested Sub-Categories */}
                            {isParentSelected && cat.subCategories.length > 0 && (
                              <div className="ps-3 ms-2 border-s-2 border-primary/30 space-y-1 py-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedSubCategory('All')}
                                  className={cn(
                                    'w-full text-start px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-between cursor-pointer',
                                    selectedSubCategory === 'All'
                                      ? 'bg-primary/15 text-primary'
                                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                  )}
                                >
                                  <span>{isRtl ? 'كل الفرعي' : 'All Sub-topics'}</span>
                                  <span className="text-[10px]">{cat.count}</span>
                                </button>
                                {cat.subCategories.map((sub) => (
                                  <button
                                    key={sub}
                                    type="button"
                                    onClick={() => setSelectedSubCategory(sub)}
                                    className={cn(
                                      'w-full text-start px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-between cursor-pointer',
                                      selectedSubCategory === sub
                                        ? 'bg-primary/15 text-primary'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    )}
                                  >
                                    <span className="truncate">{sub}</span>
                                    <span className="text-[10px]">
                                      {cat.subCounts?.[sub] || 0}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Personal Filter */}
                  <div className="pt-4 border-t border-border/60 space-y-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      {isRtl ? 'تفاعلاتي' : 'My Activity'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setOnlyMyLiked((prev) => !prev)}
                      className={cn(
                        'w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer',
                        onlyMyLiked
                          ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                          : 'bg-muted/30 border-border/60 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Heart className={cn('w-3.5 h-3.5', onlyMyLiked && 'fill-current')} />
                        <span>{isRtl ? 'منشورات أعجبتني' : 'Posts I Liked / Loved'}</span>
                      </span>
                    </button>
                  </div>
                </div>
              </aside>

              {/* MOBILE & TABLET FILTER DRAWER */}
              <AnimatePresence>
                {isMobileSidebarOpen && (
                  <div className="fixed inset-0 z-[220] lg:hidden flex">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="fixed inset-0 bg-black/70 backdrop-blur-xs"
                    />
                    <motion.div
                      initial={{ x: isRtl ? '100%' : '-100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: isRtl ? '100%' : '-100%' }}
                      transition={{ type: 'spring', damping: 26, stiffness: 260 }}
                      className="relative w-80 max-w-[86vw] bg-card h-full z-10 p-5 overflow-y-auto flex flex-col justify-between border-e border-border shadow-2xl"
                    >
                      <div className="space-y-6">
                        <div className="flex items-center justify-between pb-3 border-b border-border">
                          <h3 className="text-base font-extrabold flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-primary" />
                            <span>{isRtl ? 'تصفية المنشورات' : 'Filter Community'}</span>
                          </h3>
                          <button
                            type="button"
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="p-2 rounded-full hover:bg-muted text-muted-foreground"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <div className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-2">
                            {isRtl ? 'التصنيفات' : 'Categories'}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedParentCategory('All');
                              setSelectedSubCategory('All');
                            }}
                            className={cn(
                              'w-full text-start px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between',
                              selectedParentCategory === 'All'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/40 text-muted-foreground'
                            )}
                          >
                            <span>{isRtl ? 'جميع المنشورات' : 'All Posts'}</span>
                            <span>{languageScopedPosts.length}</span>
                          </button>

                          {mergedCategoriesTree.map((cat) => {
                            const isParentSelected = selectedParentCategory === cat.name;
                            return (
                              <div key={cat.name} className="space-y-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedParentCategory(cat.name);
                                    setSelectedSubCategory('All');
                                  }}
                                  className={cn(
                                    'w-full text-start px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between',
                                    isParentSelected
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted/40 text-muted-foreground'
                                  )}
                                >
                                  <span>{cat.name}</span>
                                  <span>{cat.count}</span>
                                </button>

                                {isParentSelected && cat.subCategories.length > 0 && (
                                  <div className="ps-3 ms-2 border-s-2 border-primary/30 space-y-1 py-1">
                                    {cat.subCategories.map((sub) => (
                                      <button
                                        key={sub}
                                        type="button"
                                        onClick={() => setSelectedSubCategory(sub)}
                                        className={cn(
                                          'w-full text-start px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between',
                                          selectedSubCategory === sub
                                            ? 'bg-primary/15 text-primary'
                                            : 'text-muted-foreground'
                                        )}
                                      >
                                        <span>{sub}</span>
                                        <span>{cat.subCounts?.[sub] || 0}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="pt-4 border-t border-border">
                          <button
                            type="button"
                            onClick={() => setOnlyMyLiked((prev) => !prev)}
                            className={cn(
                              'w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-between',
                              onlyMyLiked
                                ? 'bg-rose-500 text-white border-rose-500'
                                : 'bg-muted/40 border-border text-muted-foreground'
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <Heart className={cn('w-3.5 h-3.5', onlyMyLiked && 'fill-current')} />
                              <span>{isRtl ? 'منشورات أعجبتني' : 'Posts I Liked / Loved'}</span>
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border flex gap-2">
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold"
                        >
                          {isRtl ? 'إعادة ضبط' : 'Reset'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsMobileSidebarOpen(false)}
                          className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                        >
                          {isRtl ? 'عرض النتائج' : 'Show Results'}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* MAIN CARDS FEED & PAGINATION */}
              <div className="flex-1 min-w-0 w-full">
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-xs sm:text-sm font-semibold">
                      {isRtl ? 'جاري تحميل منشورات المجتمع...' : 'Loading community posts...'}
                    </p>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="p-10 sm:p-14 rounded-3xl bg-card border border-border/80 text-center space-y-4 shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <MessageSquareHeart className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h3 className="text-lg sm:text-xl font-bold text-foreground">
                        {isRtl ? 'لا توجد منشورات مطابقة' : 'No Community Posts Found'}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {activeFiltersCount > 0
                          ? isRtl
                            ? 'جرب تغيير الفلاتر أو البحث بكلمات أخرى.'
                            : 'Try clearing some filters or searching with different keywords.'
                          : isRtl
                          ? 'ترقب أحدث المنشورات والإعلانات الحصرية من فريق إدارة Skilliq قريباً!'
                          : 'Stay tuned! Exclusive announcements, resources, and updates from the Skilliq admin team will appear here.'}
                      </p>
                    </div>
                    {activeFiltersCount > 0 ? (
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs sm:text-sm cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>{isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}</span>
                      </button>
                    ) : (
                      isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPost(null);
                            setIsModalOpen(true);
                          }}
                          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{isRtl ? 'إنشاء أول منشور' : 'Publish First Post'}</span>
                        </button>
                      )
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Post Cards Grid (Responsive 1 col mobile, 2 cols tablet/laptop) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {paginatedPosts.map((post, index) => renderPostCard(post, index))}
                    </div>

                    {/* SMART PAGINATION BAR */}
                    {totalPages > 1 && (
                      <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-xs text-muted-foreground font-semibold">
                          {isRtl
                            ? `صفحة ${safeCurrentPage} من ${totalPages} (${filteredPosts.length} منشور)`
                            : `Page ${safeCurrentPage} of ${totalPages} (${filteredPosts.length} posts)`}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={safeCurrentPage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="px-3.5 py-2 rounded-xl bg-card border border-border hover:bg-muted disabled:opacity-40 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                            <span>{isRtl ? 'السابق' : 'Previous'}</span>
                          </button>

                          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => setCurrentPage(pageNum)}
                              className={cn(
                                'w-9 h-9 rounded-xl text-xs font-extrabold transition-all cursor-pointer border',
                                pageNum === safeCurrentPage
                                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                  : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                              )}
                            >
                              {pageNum}
                            </button>
                          ))}

                          <button
                            type="button"
                            disabled={safeCurrentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="px-3.5 py-2 rounded-xl bg-card border border-border hover:bg-muted disabled:opacity-40 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <span>{isRtl ? 'التالي' : 'Next'}</span>
                            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
