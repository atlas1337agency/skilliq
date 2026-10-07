import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Pin,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Search,
  MessageSquareHeart,
  Loader2,
  ExternalLink,
  FolderKanban,
  RefreshCw,
} from 'lucide-react';
import {
  CommunityPost,
  CommunityCategoryItem,
  fetchCommunityPosts,
  fetchCommunityCategories,
  saveCommunityPost,
  deleteCommunityPost,
  getTextDir,
} from '../lib/community';
import { CommunityPostModal } from './CommunityPostModal';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export function AdminCommunity() {
  const { language } = useStore();
  const isRtl = language === 'ar';

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [categoriesTree, setCategoriesTree] = useState<CommunityCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState<'all' | 'ar' | 'en'>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<CommunityPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPostsAndCategories = async () => {
    setLoading(true);
    try {
      const [postList, catList] = await Promise.all([
        fetchCommunityPosts(),
        fetchCommunityCategories(),
      ]);
      setPosts(Array.isArray(postList) ? postList : []);
      setCategoriesTree(Array.isArray(catList) ? catList : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPostsAndCategories();
  }, []);

  // Merge stored categories with any categories found on existing posts
  const effectiveCategoriesTree = useMemo(() => {
    const map = new Map<string, Set<string>>();
    categoriesTree.forEach((c) => {
      if (c?.name) {
        map.set(c.name, new Set(Array.isArray(c.subCategories) ? c.subCategories : []));
      }
    });
    posts.forEach((p) => {
      if (p?.category) {
        if (!map.has(p.category)) map.set(p.category, new Set());
        if (p.subCategory) {
          map.get(p.category)!.add(p.subCategory);
        }
      }
    });
    return Array.from(map.entries()).map(([name, subs]) => ({
      name,
      subCategories: Array.from(subs),
    }));
  }, [categoriesTree, posts]);

  const handleSave = async (postData: CommunityPost) => {
    await saveCommunityPost(postData);
    await loadPostsAndCategories();
    setIsModalOpen(false);
    setEditingPost(null);
  };

  const handleTogglePin = async (post: CommunityPost) => {
    const updated: CommunityPost = {
      ...post,
      isPinned: !post.isPinned,
      updatedAt: Date.now(),
    };
    await saveCommunityPost(updated);
    await loadPostsAndCategories();
  };

  const handleConfirmDelete = async () => {
    if (!deletingPost) return;
    setIsDeleting(true);
    try {
      await deleteCommunityPost(deletingPost.id);
      setPosts((prev) => prev.filter((p) => p.id !== deletingPost.id));
      setDeletingPost(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = posts.filter((p) => {
    if (langFilter !== 'all' && (p.language || 'all') !== langFilter && p.language !== 'all') {
      return false;
    }
    if (catFilter !== 'all' && p.category !== catFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (p.title || '').toLowerCase().includes(q) ||
        (p.subtitle || '').toLowerCase().includes(q) ||
        (p.paragraph || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.subCategory || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <CommunityPostModal
        isOpen={isModalOpen}
        postToEdit={editingPost}
        categoriesTree={effectiveCategoriesTree}
        onCategoriesUpdated={(nextTree) => setCategoriesTree(nextTree)}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPost(null);
        }}
        onSaved={handleSave}
      />

      {deletingPost && (
        <div className="fixed inset-0 z-[230] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 space-y-4">
            <h3 className="text-base font-extrabold text-foreground">
              {isRtl ? 'حذف منشور المجتمع؟' : 'Delete Community Post?'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isRtl
                ? `هل تريد حذف "${deletingPost.title}" نهائياً؟`
                : `Permanently delete "${deletingPost.title}"?`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingPost(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isRtl ? 'حذف نهائي' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-card border border-border/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">
            {isRtl ? 'إدارة المجتمع الخاص (Private Community)' : 'Manage Private Community'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRtl
              ? 'أنشئ وعدّل وثبّت واحذف منشورات وأقسام المجتمع الخاص للأعضاء باللغتين العربية والإنجليزية.'
              : 'Create, edit, pin, and organize private community posts and categories in Arabic & English.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/community"
            className="px-3.5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold flex items-center gap-1.5 border border-border cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-primary" />
            <span>{isRtl ? 'فتح صفحة المجتمع' : 'View Live Community'}</span>
          </Link>

          <button
            type="button"
            onClick={loadPostsAndCategories}
            className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer"
            title={isRtl ? 'تحديث' : 'Refresh'}
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingPost(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'منشور جديد' : 'New Community Post'}</span>
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRtl ? 'ابحث في المنشورات...' : 'Search posts by title or content...'}
            className="w-full ps-9 pe-3.5 py-2 rounded-xl bg-card border border-border text-xs sm:text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          {effectiveCategoriesTree.length > 0 && (
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-2.5 py-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-primary shrink-0" />
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              >
                <option value="all">{isRtl ? 'جميع الأقسام' : 'All Categories'}</option>
                {effectiveCategoriesTree.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Language Filter */}
          <div className="flex items-center gap-1.5">
            {(['all', 'ar', 'en'] as const).map((lf) => (
              <button
                key={lf}
                type="button"
                onClick={() => setLangFilter(lf)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer',
                  langFilter === lf
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground'
                )}
              >
                {lf === 'all'
                  ? isRtl
                    ? 'الكل'
                    : 'All'
                  : lf === 'ar'
                  ? 'العربية (AR)'
                  : 'English (EN)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 rounded-3xl bg-card border border-border/80 text-center space-y-3">
          <MessageSquareHeart className="w-8 h-8 text-primary mx-auto" />
          <p className="text-sm font-bold text-foreground">
            {isRtl ? 'لا توجد منشورات بعد' : 'No community posts found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((post) => {
            const dir = getTextDir(post.title, post.language === 'ar' || isRtl);
            const reactions = post.reactions || {};
            let love = 0,
              like = 0,
              dislike = 0;
            Object.values(reactions).forEach((r) => {
              if (r === 'love') love++;
              else if (r === 'like') like++;
              else if (r === 'dislike') dislike++;
            });

            return (
              <div
                key={post.id}
                className="p-5 rounded-2xl bg-card border border-border/80 flex flex-col justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-2.5" dir={dir}>
                  <div
                    className="flex items-center justify-between gap-2"
                    dir={isRtl ? 'rtl' : 'ltr'}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {post.category && (
                        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                          {post.category}
                          {post.subCategory ? ` • ${post.subCategory}` : ''}
                        </span>
                      )}
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {post.language || 'all'}
                      </span>
                      {post.isPinned && (
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                          {isRtl ? 'مثبت' : 'Pinned'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(post)}
                        title={isRtl ? 'تثبيت المنشور' : 'Pin Post'}
                        className={cn(
                          'p-1.5 rounded-lg border cursor-pointer',
                          post.isPinned
                            ? 'text-amber-500 border-amber-500/30 bg-amber-500/10'
                            : 'text-muted-foreground border-border hover:text-foreground'
                        )}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPost(post);
                          setIsModalOpen(true);
                        }}
                        title={isRtl ? 'تعديل' : 'Edit'}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingPost(post)}
                        title={isRtl ? 'حذف' : 'Delete'}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-foreground line-clamp-1">
                    {post.title}
                  </h3>
                  {post.subtitle && (
                    <p className="text-xs font-semibold text-primary/90 line-clamp-1">
                      {post.subtitle}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">
                    {post.paragraph}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3 font-mono">
                    <span className="inline-flex items-center gap-1 text-rose-500 font-bold">
                      <Heart className="w-3.5 h-3.5 fill-current" /> {love}
                    </span>
                    <span className="inline-flex items-center gap-1 text-primary font-bold">
                      <ThumbsUp className="w-3.5 h-3.5 fill-current" /> {like}
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground font-bold">
                      <ThumbsDown className="w-3.5 h-3.5" /> {dislike}
                    </span>
                  </div>
                  <span className="text-[11px]">
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
