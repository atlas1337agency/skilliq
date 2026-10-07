import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
  MousePointerClick,
  Globe,
  Pin,
  AlignRight,
  AlignLeft,
  Check,
  Loader2,
  FolderKanban,
  FolderPlus,
  CornerDownRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CommunityPost,
  CommunityPostLink,
  CommunityPostButton,
  CommunityCategoryItem,
  fetchCommunityCategories,
  saveCommunityCategories,
  saveCommunityPost,
  hasArabicScript,
} from '../lib/community';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

interface CommunityPostModalProps {
  isOpen: boolean;
  postToEdit?: CommunityPost | null;
  categoriesTree?: CommunityCategoryItem[];
  onCategoriesUpdated?: (tree: CommunityCategoryItem[]) => void;
  onCategoryDeleted?: (parentName: string, subName?: string) => void;
  onClose: () => void;
  onSaved: (post: CommunityPost) => void;
}

export function CommunityPostModal({
  isOpen,
  postToEdit,
  categoriesTree = [],
  onCategoriesUpdated = () => {},
  onCategoryDeleted,
  onClose,
  onSaved,
}: CommunityPostModalProps) {
  const { user, language: uiLanguage } = useStore();
  const isUiRtl = uiLanguage === 'ar';

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [paragraph, setParagraph] = useState('');
  const [image, setImage] = useState('');
  const [selectedParentCat, setSelectedParentCat] = useState('');
  const [selectedSubCat, setSelectedSubCat] = useState('');
  const [postLang, setPostLang] = useState<'all' | 'en' | 'ar'>('all');
  const [writeDir, setWriteDir] = useState<'rtl' | 'ltr'>(isUiRtl ? 'rtl' : 'ltr');
  const [isPinned, setIsPinned] = useState(false);
  const [links, setLinks] = useState<CommunityPostLink[]>([]);
  const [buttons, setButtons] = useState<CommunityPostButton[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Parent & Sub-Category inline builder state
  const [isCategoryBuilderOpen, setIsCategoryBuilderOpen] = useState(false);
  const [newParentName, setNewParentName] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [savingCats, setSavingCats] = useState(false);

  // Smart Rich Content Toolbar Popovers (Insert Link / Insert Image inside content)
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeInsertTool, setActiveInsertTool] = useState<'none' | 'link' | 'image'>('none');
  const [inlineLinkText, setInlineLinkText] = useState('');
  const [inlineLinkUrl, setInlineLinkUrl] = useState('');
  const [inlineImageUrl, setInlineImageUrl] = useState('');
  const [inlineImageCaption, setInlineImageCaption] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (postToEdit) {
      setTitle(postToEdit.title || '');
      setSubtitle(postToEdit.subtitle || '');
      setParagraph(postToEdit.paragraph || '');
      setImage(postToEdit.image || '');
      setSelectedParentCat(postToEdit.category || '');
      setSelectedSubCat(postToEdit.subCategory || '');
      setPostLang(postToEdit.language || 'all');
      setIsPinned(Boolean(postToEdit.isPinned));
      setLinks(Array.isArray(postToEdit.links) ? postToEdit.links : []);
      setButtons(Array.isArray(postToEdit.buttons) ? postToEdit.buttons : []);
      if (
        postToEdit.language === 'ar' ||
        hasArabicScript(postToEdit.title) ||
        hasArabicScript(postToEdit.paragraph)
      ) {
        setWriteDir('rtl');
      } else {
        setWriteDir('ltr');
      }
    } else {
      setTitle('');
      setSubtitle('');
      setParagraph('');
      setImage('');
      setSelectedParentCat(categoriesTree[0]?.name || '');
      setSelectedSubCat('');
      setPostLang(isUiRtl ? 'ar' : 'all');
      setWriteDir(isUiRtl ? 'rtl' : 'ltr');
      setIsPinned(false);
      setLinks([]);
      setButtons([]);
    }
    setError('');
    setActiveInsertTool('none');
  }, [postToEdit, isOpen, isUiRtl]);

  // Keep selectedParentCat synced when first category is created
  useEffect(() => {
    if (!selectedParentCat && categoriesTree.length > 0) {
      setSelectedParentCat(categoriesTree[0].name);
    }
  }, [categoriesTree, selectedParentCat]);

  if (!isOpen) return null;

  const currentParentObj = categoriesTree.find((c) => c.name === selectedParentCat);
  const availableSubCats = currentParentObj?.subCategories || [];

  const handlePostLangChange = (val: 'all' | 'en' | 'ar') => {
    setPostLang(val);
    if (val === 'ar') setWriteDir('rtl');
    if (val === 'en') setWriteDir('ltr');
  };

  // Add Parent Category
  const handleAddParentCategory = async () => {
    const clean = newParentName.trim();
    if (!clean) return;
    if (categoriesTree.some((c) => c.name.toLowerCase() === clean.toLowerCase())) {
      setSelectedParentCat(clean);
      setNewParentName('');
      return;
    }
    setSavingCats(true);
    const updated = [...categoriesTree, { name: clean, subCategories: [] }];
    onCategoriesUpdated(updated);
    setSelectedParentCat(clean);
    setSelectedSubCat('');
    setNewParentName('');
    await saveCommunityCategories(updated);
    setSavingCats(false);
  };

  // Delete Parent Category
  const handleDeleteParentCategory = async (parentName: string) => {
    if (!parentName) return;
    setSavingCats(true);
    const updated = categoriesTree.filter((c) => c.name !== parentName);
    onCategoriesUpdated(updated);
    if (onCategoryDeleted) {
      onCategoryDeleted(parentName);
    }
    if (selectedParentCat === parentName) {
      setSelectedParentCat(updated[0]?.name || '');
      setSelectedSubCat('');
    }
    await saveCommunityCategories(updated);
    setSavingCats(false);
  };

  // Add Sub-Category under selectedParentCat
  const handleAddSubCategory = async () => {
    const cleanSub = newSubName.trim();
    if (!cleanSub || !selectedParentCat) return;
    setSavingCats(true);
    const updated = categoriesTree.map((cat) => {
      if (cat.name !== selectedParentCat) return cat;
      const exists = cat.subCategories.some(
        (s) => s.toLowerCase() === cleanSub.toLowerCase()
      );
      if (exists) return cat;
      return { ...cat, subCategories: [...cat.subCategories, cleanSub] };
    });
    onCategoriesUpdated(updated);
    setSelectedSubCat(cleanSub);
    setNewSubName('');
    await saveCommunityCategories(updated);
    setSavingCats(false);
  };

  // Remove Sub-Category
  const handleDeleteSubCategory = async (parentName: string, subName: string) => {
    if (!parentName || !subName) return;
    setSavingCats(true);
    const updated = categoriesTree.map((cat) => {
      if (cat.name !== parentName) return cat;
      return {
        ...cat,
        subCategories: cat.subCategories.filter((s) => s !== subName),
      };
    });
    onCategoriesUpdated(updated);
    if (onCategoryDeleted) {
      onCategoryDeleted(parentName, subName);
    }
    if (selectedSubCat === subName) {
      setSelectedSubCat('');
    }
    await saveCommunityCategories(updated);
    setSavingCats(false);
  };

  // Smart Rich Formatting Helper for Paragraph Textarea
  const applyFormatting = (
    prefix: string,
    suffix: string,
    defaultPlaceholder: string,
    blockLine = false
  ) => {
    const el = textareaRef.current;
    if (!el) {
      setParagraph((prev) => `${prev}${blockLine ? '\n' : ''}${prefix}${defaultPlaceholder}${suffix}`);
      return;
    }

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const selectedText = paragraph.substring(start, end) || defaultPlaceholder;
    const before = paragraph.substring(0, start);
    const after = paragraph.substring(end);

    const needsNewline = blockLine && before.length > 0 && !before.endsWith('\n');
    const insertion = `${needsNewline ? '\n' : ''}${prefix}${selectedText}${suffix}`;
    const nextValue = `${before}${insertion}${after}`;
    setParagraph(nextValue);

    setTimeout(() => {
      el.focus();
      const newCursorPos = before.length + insertion.length;
      el.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handleInsertInlineLink = () => {
    if (!inlineLinkUrl.trim()) return;
    const label = inlineLinkText.trim() || inlineLinkUrl.trim();
    const url = inlineLinkUrl.trim();
    applyFormatting(`[${label}](`, `${url})`, '');
    setInlineLinkText('');
    setInlineLinkUrl('');
    setActiveInsertTool('none');
  };

  const handleInsertInlineImage = () => {
    if (!inlineImageUrl.trim()) return;
    const alt = inlineImageCaption.trim() || 'Post Image';
    const url = inlineImageUrl.trim();
    applyFormatting(`\n![${alt}](`, `${url})\n`, '');
    setInlineImageUrl('');
    setInlineImageCaption('');
    setActiveInsertTool('none');
  };

  const addLinkRow = () => {
    setLinks((prev) => [...prev, { label: '', url: '' }]);
  };

  const updateLinkRow = (idx: number, field: keyof CommunityPostLink, value: string) => {
    setLinks((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const removeLinkRow = (idx: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const addButtonRow = () => {
    setButtons((prev) => [...prev, { label: '', url: '', variant: 'primary' }]);
  };

  const updateButtonRow = (idx: number, field: keyof CommunityPostButton, value: string) => {
    setButtons((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const removeButtonRow = (idx: number) => {
    setButtons((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(isUiRtl ? 'يرجى إدخال عنوان المنشور' : 'Please enter a post title.');
      return;
    }
    if (!paragraph.trim()) {
      setError(isUiRtl ? 'يرجى إدخال محتوى المنشور' : 'Please enter post paragraph content.');
      return;
    }

    const cleanLinks = links
      .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
      .filter((l) => l.label && l.url);

    const cleanButtons = buttons
      .map((b) => ({
        label: b.label.trim(),
        url: b.url.trim(),
        variant: b.variant || 'primary',
      }))
      .filter((b) => b.label && b.url);

    setSaving(true);
    setError('');

    try {
      const now = Date.now();
      const postData: CommunityPost = {
        id: postToEdit?.id || `post_${now}_${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        subtitle: subtitle.trim(),
        paragraph: paragraph.trim(),
        image: image.trim(),
        category: selectedParentCat.trim(),
        subCategory: selectedSubCat.trim(),
        language: postLang,
        isPinned,
        links: cleanLinks,
        buttons: cleanButtons,
        authorName: postToEdit?.authorName || user?.displayName || 'Skilliq Admin',
        authorAvatar: postToEdit?.authorAvatar || user?.photoURL || '/images/favicon.png',
        reactions: postToEdit?.reactions || {},
        createdAt: postToEdit?.createdAt || now,
        updatedAt: now,
      };

      onSaved(postData);
    } catch (err: any) {
      setError(err?.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        dir={isUiRtl ? 'rtl' : 'ltr'}
        className="fixed inset-0 z-[220] bg-background flex flex-col w-screen h-[100dvh] overflow-hidden"
      >
        {/* FULL-SCREEN STICKY HEADER */}
        <header className="px-4 sm:px-6 lg:px-10 py-3.5 sm:py-4 border-b border-border/80 bg-card/90 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0 text-start">
              <h2 className="text-base sm:text-xl font-black text-foreground truncate">
                {postToEdit
                  ? isUiRtl
                    ? 'تعديل منشور المجتمع'
                    : 'Edit Community Post'
                  : isUiRtl
                  ? 'إنشاء منشور جديد في المجتمع'
                  : 'Create New Community Post'}
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                {isUiRtl
                  ? 'محرر ذكي بملء الشاشة — تحكم بالتصنيفات الرئيسية والفرعية، تنسيق النصوص، الصور، والروابط.'
                  : 'Full-screen studio editor — parent & sub-categories, rich text formatting, inline images & links.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">{isUiRtl ? 'إغلاق' : 'Close'}</span>
            </button>
          </div>
        </header>

        {/* FULL-SCREEN SCROLLABLE FORM BODY */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto bg-background"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs sm:text-sm font-bold">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* MAIN EDITOR COLUMN (8 COLS ON LAPTOP) */}
              <div className="lg:col-span-8 space-y-6">
                {/* 1. FIRST FIELD: MAIN POST COVER IMAGE (OPTIONAL) */}
                <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border/80 shadow-2xs space-y-3 text-start">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-xs sm:text-sm font-extrabold text-foreground flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      <span>
                        {isUiRtl
                          ? 'الصورة الرئيسية للمنشور (Post Main Image URL - اختياري)'
                          : 'First Main Post Image URL (Optional)'}
                      </span>
                    </label>
                    <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                      {isUiRtl ? 'تظهر في أعلى المنشور كغلاف رئيسي' : 'Displayed first as main post cover'}
                    </span>
                  </div>

                  <input
                    type="url"
                    dir="ltr"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />

                  {image.trim() && (
                    <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-muted/40 max-h-64 flex items-center justify-center">
                      <img
                        src={image.trim()}
                        alt="Main post cover preview"
                        className="max-h-64 w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="absolute top-2.5 end-2.5 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>{isUiRtl ? 'إزالة الصورة' : 'Remove'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. TITLE & SUBTITLE CARD */}
                <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border/80 shadow-2xs space-y-4 text-start">
                  <div>
                    <label className="block text-xs sm:text-sm font-extrabold text-foreground mb-1.5">
                      {isUiRtl ? 'عنوان المنشور (Post Title) *' : 'Post Title *'}
                    </label>
                    <input
                      type="text"
                      required
                      dir={writeDir}
                      value={title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTitle(val);
                        if (val.length <= 4 && hasArabicScript(val)) setWriteDir('rtl');
                      }}
                      placeholder={
                        writeDir === 'rtl'
                          ? 'اكتب عنواناً قوياً وجذاباً للمنشور...'
                          : 'Enter an engaging headline for your community post...'
                      }
                      className={cn(
                        'w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm sm:text-base font-extrabold focus:outline-none focus:ring-2 focus:ring-primary/40',
                        writeDir === 'rtl' ? 'text-right' : 'text-left'
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-extrabold text-foreground mb-1.5">
                      {isUiRtl ? 'العنوان الفرعي (Subtitle - اختياري)' : 'Subtitle (Optional)'}
                    </label>
                    <input
                      type="text"
                      dir={writeDir}
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder={
                        writeDir === 'rtl'
                          ? 'ملخص سريع أو عنوان فرعي داعم...'
                          : 'Supporting subtitle or brief summary...'
                      }
                      className={cn(
                        'w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40',
                        writeDir === 'rtl' ? 'text-right' : 'text-left'
                      )}
                    />
                  </div>
                </div>

                {/* 3. SMART RICH PARAGRAPH / CONTENT EDITOR */}
                <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border/80 shadow-2xs space-y-3 text-start">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-xs sm:text-sm font-extrabold text-foreground">
                      {isUiRtl ? 'محتوى المنشور الذكي (Paragraph / Content) *' : 'Smart Paragraph / Content *'}
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      {isUiRtl
                        ? 'يدعم تنسيق النص العريض، القوائم، وإدراج الروابط والصور داخل المقال'
                        : 'Supports Bold, Headings, Lists, Inline Links & Inline Images'}
                    </span>
                  </div>

                  {/* RICH FORMATTING TOOLBAR */}
                  <div className="flex flex-wrap items-center gap-1 p-2 rounded-2xl bg-muted/40 border border-border/80">
                    <button
                      type="button"
                      onClick={() => applyFormatting('**', '**', isUiRtl ? 'نص عريض' : 'bold text')}
                      className="p-2 rounded-xl hover:bg-background text-foreground transition-colors cursor-pointer"
                      title={isUiRtl ? 'خط عريض (Bold)' : 'Bold'}
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('*', '*', isUiRtl ? 'نص مائل' : 'italic text')}
                      className="p-2 rounded-xl hover:bg-background text-foreground transition-colors cursor-pointer"
                      title={isUiRtl ? 'خط مائل (Italic)' : 'Italic'}
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('++', '++', isUiRtl ? 'نص مسطر' : 'underlined text')}
                      className="p-2 rounded-xl hover:bg-background text-foreground transition-colors cursor-pointer"
                      title={isUiRtl ? 'تسطير (Underline)' : 'Underline'}
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('~~', '~~', isUiRtl ? 'نص مشطوب' : 'strikethrough')}
                      className="p-2 rounded-xl hover:bg-background text-foreground transition-colors cursor-pointer"
                      title={isUiRtl ? 'يتوسطه خط (Strikethrough)' : 'Strikethrough'}
                    >
                      <Strikethrough className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('==', '==', isUiRtl ? 'نص مميز' : 'highlighted text')}
                      className="px-2.5 py-1.5 rounded-xl hover:bg-background text-amber-600 dark:text-amber-400 font-bold text-xs transition-colors cursor-pointer"
                      title={isUiRtl ? 'تمييز بلون (Highlight)' : 'Highlight Text'}
                    >
                      {isUiRtl ? 'تمييز' : 'Highlight'}
                    </button>

                    <span className="h-5 w-px bg-border mx-1" />

                    <button
                      type="button"
                      onClick={() => applyFormatting('## ', '', isUiRtl ? 'عنوان رئيسي' : 'Section Heading', true)}
                      className="p-2 rounded-xl hover:bg-background text-foreground transition-colors cursor-pointer"
                      title={isUiRtl ? 'عنوان كبير (H2)' : 'Heading H2'}
                    >
                      <Heading2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('### ', '', isUiRtl ? 'عنوان فرعي' : 'Subheading', true)}
                      className="p-2 rounded-xl hover:bg-background text-foreground transition-colors cursor-pointer"
                      title={isUiRtl ? 'عنوان متوسط (H3)' : 'Subheading H3'}
                    >
                      <Heading3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('- ', '', isUiRtl ? 'عنصر قائمة' : 'List item', true)}
                      className="p-2 rounded-xl hover:bg-background text-foreground transition-colors cursor-pointer"
                      title={isUiRtl ? 'قائمة نقطية (Bullet List)' : 'Bullet List'}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('1. ', '', isUiRtl ? 'عنصر مرقم' : 'Numbered item', true)}
                      className="p-2 rounded-xl hover:bg-background text-foreground transition-colors cursor-pointer"
                      title={isUiRtl ? 'قائمة رقمية (Numbered List)' : 'Numbered List'}
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('> ', '', isUiRtl ? 'اقتباس مهم' : 'Important quote', true)}
                      className="p-2 rounded-xl hover:bg-background text-foreground transition-colors cursor-pointer"
                      title={isUiRtl ? 'اقتباس (Quote)' : 'Blockquote'}
                    >
                      <Quote className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('`', '`', 'code')}
                      className="p-2 rounded-xl hover:bg-background text-foreground transition-colors cursor-pointer"
                      title={isUiRtl ? 'كود برمجي (Inline Code)' : 'Inline Code'}
                    >
                      <Code className="w-4 h-4" />
                    </button>

                    <span className="h-5 w-px bg-border mx-1" />

                    {/* INSERT LINK INSIDE PARAGRAPH BUTTON */}
                    <button
                      type="button"
                      onClick={() =>
                        setActiveInsertTool(activeInsertTool === 'link' ? 'none' : 'link')
                      }
                      className={cn(
                        'px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer',
                        activeInsertTool === 'link'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background hover:bg-primary/10 text-primary border border-border/80'
                      )}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>{isUiRtl ? '+ رابط داخل النص' : '+ Insert Link'}</span>
                    </button>

                    {/* INSERT IMAGE INSIDE PARAGRAPH BUTTON */}
                    <button
                      type="button"
                      onClick={() =>
                        setActiveInsertTool(activeInsertTool === 'image' ? 'none' : 'image')
                      }
                      className={cn(
                        'px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer',
                        activeInsertTool === 'image'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-background hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-border/80'
                      )}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{isUiRtl ? '+ صورة داخل النص' : '+ Insert Image'}</span>
                    </button>
                  </div>

                  {/* INLINE LINK INSERT HELPER */}
                  {activeInsertTool === 'link' && (
                    <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/25 space-y-2.5">
                      <div className="text-xs font-bold text-primary flex items-center justify-between">
                        <span>
                          {isUiRtl
                            ? 'إدراج رابط قابل للنقر داخل الفقرة'
                            : 'Insert Clickable Link Inside Paragraph'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveInsertTool('none')}
                          className="text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <input
                          type="text"
                          dir={writeDir}
                          value={inlineLinkText}
                          onChange={(e) => setInlineLinkText(e.target.value)}
                          placeholder={isUiRtl ? 'النص الظاهر للرابط...' : 'Link Text (e.g. Read Documentation)'}
                          className="sm:col-span-5 px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground"
                        />
                        <input
                          type="url"
                          dir="ltr"
                          value={inlineLinkUrl}
                          onChange={(e) => setInlineLinkUrl(e.target.value)}
                          placeholder="https://..."
                          className="sm:col-span-5 px-3 py-2 rounded-xl bg-background border border-border text-xs font-mono text-foreground"
                        />
                        <button
                          type="button"
                          onClick={handleInsertInlineLink}
                          className="sm:col-span-2 py-2 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
                        >
                          {isUiRtl ? 'إدراج' : 'Insert'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* INLINE IMAGE INSERT HELPER */}
                  {activeInsertTool === 'image' && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/25 space-y-2.5">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                        <span>
                          {isUiRtl
                            ? 'إدراج صورة إضافية داخل محتوى الفقرة'
                            : 'Insert Inline Image Inside Paragraph Content'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveInsertTool('none')}
                          className="text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <input
                          type="url"
                          dir="ltr"
                          value={inlineImageUrl}
                          onChange={(e) => setInlineImageUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="sm:col-span-6 px-3 py-2 rounded-xl bg-background border border-border text-xs font-mono text-foreground"
                        />
                        <input
                          type="text"
                          dir={writeDir}
                          value={inlineImageCaption}
                          onChange={(e) => setInlineImageCaption(e.target.value)}
                          placeholder={isUiRtl ? 'وصف الصورة (اختياري)...' : 'Image caption (optional)...'}
                          className="sm:col-span-4 px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground"
                        />
                        <button
                          type="button"
                          onClick={handleInsertInlineImage}
                          className="sm:col-span-2 py-2 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                        >
                          {isUiRtl ? 'إدراج' : 'Insert'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MAIN SMART TEXTAREA */}
                  <textarea
                    ref={textareaRef}
                    rows={12}
                    required
                    dir={writeDir}
                    value={paragraph}
                    onChange={(e) => {
                      const val = e.target.value;
                      setParagraph(val);
                      if (val.length <= 4 && hasArabicScript(val)) setWriteDir('rtl');
                    }}
                    placeholder={
                      writeDir === 'rtl'
                        ? 'اكتب محتوى المنشور هنا... يمكنك استخدام شريط الأدوات في الأعلى لتنسيق الخط العريض (**نص**)، القوائم، العناوين، أو إدراج صور وروابط مباشرة داخل النص.'
                        : 'Write your rich post content here... Use the toolbar above to format bold text (**bold**), headings, bullet lists, or embed clickable links and images directly inside the paragraph.'
                    }
                    className={cn(
                      'w-full px-4 py-3.5 rounded-2xl bg-background border border-border text-foreground text-xs sm:text-sm md:text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y min-h-[240px]',
                      writeDir === 'rtl' ? 'text-right' : 'text-left'
                    )}
                  />
                </div>

                {/* 4. ATTACHED LINKS & CTA BUTTONS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Attached Links */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border/80 space-y-3 text-start">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-extrabold text-foreground flex items-center gap-1.5">
                        <LinkIcon className="w-4 h-4 text-primary" />
                        <span>{isUiRtl ? 'الروابط المرفقة' : 'Attached Links'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={addLinkRow}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isUiRtl ? 'إضافة رابط' : 'Add Link'}</span>
                      </button>
                    </div>

                    {links.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">
                        {isUiRtl ? 'لا توجد روابط إضافية مرفقة.' : 'No extra external links added.'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {links.map((lnk, idx) => (
                          <div key={idx} className="space-y-1.5 p-2.5 rounded-2xl bg-muted/30 border border-border/60">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                dir={writeDir}
                                value={lnk.label}
                                onChange={(e) => updateLinkRow(idx, 'label', e.target.value)}
                                placeholder={isUiRtl ? 'عنوان الرابط...' : 'Link Label'}
                                className="flex-1 px-3 py-1.5 rounded-xl bg-background border border-border text-xs text-foreground"
                              />
                              <button
                                type="button"
                                onClick={() => removeLinkRow(idx)}
                                className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <input
                              type="url"
                              dir="ltr"
                              value={lnk.url}
                              onChange={(e) => updateLinkRow(idx, 'url', e.target.value)}
                              placeholder="https://..."
                              className="w-full px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-mono text-foreground"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Call-to-Action Buttons */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border/80 space-y-3 text-start">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-extrabold text-foreground flex items-center gap-1.5">
                        <MousePointerClick className="w-4 h-4 text-primary" />
                        <span>{isUiRtl ? 'أزرار التفاعل (Buttons)' : 'Action Buttons'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={addButtonRow}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isUiRtl ? 'إضافة زر' : 'Add Button'}</span>
                      </button>
                    </div>

                    {buttons.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">
                        {isUiRtl ? 'لا توجد أزرار مضافة حالياً.' : 'No CTA buttons added yet.'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {buttons.map((btn, idx) => (
                          <div key={idx} className="space-y-1.5 p-2.5 rounded-2xl bg-muted/30 border border-border/60">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                dir={writeDir}
                                value={btn.label}
                                onChange={(e) => updateButtonRow(idx, 'label', e.target.value)}
                                placeholder={isUiRtl ? 'نص الزر...' : 'Button Label'}
                                className="flex-1 px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-semibold text-foreground"
                              />
                              <select
                                value={btn.variant || 'primary'}
                                onChange={(e) => updateButtonRow(idx, 'variant', e.target.value)}
                                className="px-2 py-1.5 rounded-xl bg-background border border-border text-xs text-foreground cursor-pointer"
                              >
                                <option value="primary">{isUiRtl ? 'أساسي' : 'Primary'}</option>
                                <option value="secondary">{isUiRtl ? 'ثانوي' : 'Secondary'}</option>
                                <option value="outline">{isUiRtl ? 'إطار' : 'Outline'}</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => removeButtonRow(idx)}
                                className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <input
                              type="url"
                              dir="ltr"
                              value={btn.url}
                              onChange={(e) => updateButtonRow(idx, 'url', e.target.value)}
                              placeholder="https://... or /courses"
                              className="w-full px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-mono text-foreground"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SIDEBAR SETTINGS COLUMN (4 COLS ON LAPTOP) */}
              <div className="lg:col-span-4 space-y-6">
                {/* 1. PARENT & SUB-CATEGORIES MANAGER CARD (STARTS EMPTY BY DEFAULT) */}
                <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border/80 shadow-2xs space-y-4 text-start">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-primary" />
                      <h3 className="text-xs sm:text-sm font-extrabold text-foreground">
                        {isUiRtl ? 'التصنيفات (الرئيسية والفرعية)' : 'Categories & Sub-Categories'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCategoryBuilderOpen(!isCategoryBuilderOpen)}
                      className="px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>
                        {isCategoryBuilderOpen
                          ? isUiRtl
                            ? 'إخفاء الإدارة'
                            : 'Done'
                          : isUiRtl
                          ? '+ إدارة / إضافة'
                          : '+ Manage / Add'}
                      </span>
                    </button>
                  </div>

                  {categoriesTree.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-muted/40 border border-dashed border-border text-center space-y-2">
                      <p className="text-xs font-bold text-foreground">
                        {isUiRtl
                          ? 'لا توجد تصنيفات مضافة حتى الآن'
                          : 'No categories created yet'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {isUiRtl
                          ? 'أضف أول تصنيف رئيسي (Parent Category) وتصنيفات فرعية (Sub-Categories) بالأسفل.'
                          : 'Create your first Parent Category and Sub-Categories below.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Parent Category Select + Direct Delete Button */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-muted-foreground">
                            {isUiRtl ? 'التصنيف الرئيسي (Parent Category)' : 'Parent Category'}
                          </label>
                          {selectedParentCat && (
                            <button
                              type="button"
                              disabled={savingCats}
                              onClick={() => handleDeleteParentCategory(selectedParentCat)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[10px] font-bold transition-colors cursor-pointer"
                              title={
                                isUiRtl
                                  ? `حذف التصنيف الرئيسي "${selectedParentCat}"`
                                  : `Delete Parent Category "${selectedParentCat}"`
                              }
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{isUiRtl ? 'حذف التصنيف' : 'Delete Category'}</span>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <select
                            value={selectedParentCat}
                            onChange={(e) => {
                              setSelectedParentCat(e.target.value);
                              setSelectedSubCat('');
                            }}
                            className="flex-1 px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                          >
                            <option value="">
                              {isUiRtl ? '— بدون تصنيف —' : '— Uncategorized —'}
                            </option>
                            {categoriesTree.map((cat) => (
                              <option key={cat.name} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                          {selectedParentCat && (
                            <button
                              type="button"
                              disabled={savingCats}
                              onClick={() => handleDeleteParentCategory(selectedParentCat)}
                              className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 transition-colors cursor-pointer shrink-0"
                              title={
                                isUiRtl
                                  ? `حذف التصنيف الرئيسي "${selectedParentCat}"`
                                  : `Delete Parent Category "${selectedParentCat}"`
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Sub-Category Select + Direct Delete Button */}
                      {selectedParentCat && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                              <CornerDownRight className="w-3 h-3 text-primary" />
                              <span>
                                {isUiRtl ? 'التصنيف الفرعي (Sub-Category)' : 'Sub-Category'}
                              </span>
                            </label>
                            {selectedSubCat && (
                              <button
                                type="button"
                                disabled={savingCats}
                                onClick={() =>
                                  handleDeleteSubCategory(selectedParentCat, selectedSubCat)
                                }
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[10px] font-bold transition-colors cursor-pointer"
                                title={
                                  isUiRtl
                                    ? `حذف التصنيف الفرعي "${selectedSubCat}"`
                                    : `Delete Sub-Category "${selectedSubCat}"`
                                }
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>{isUiRtl ? 'حذف الفرعي' : 'Delete Sub-Category'}</span>
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <select
                              value={selectedSubCat}
                              onChange={(e) => setSelectedSubCat(e.target.value)}
                              className="flex-1 px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                            >
                              <option value="">
                                {availableSubCats.length === 0
                                  ? isUiRtl
                                    ? '— لا توجد تصنيفات فرعية بعد —'
                                    : '— No sub-categories yet —'
                                  : isUiRtl
                                  ? '— اختر تصنيفاً فرعياً (اختياري) —'
                                  : '— Select sub-category (optional) —'}
                              </option>
                              {availableSubCats.map((sub) => (
                                <option key={sub} value={sub}>
                                  {sub}
                                </option>
                              ))}
                            </select>
                            {selectedSubCat && (
                              <button
                                type="button"
                                disabled={savingCats}
                                onClick={() =>
                                  handleDeleteSubCategory(selectedParentCat, selectedSubCat)
                                }
                                className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 transition-colors cursor-pointer shrink-0"
                                title={
                                  isUiRtl
                                    ? `حذف التصنيف الفرعي "${selectedSubCat}"`
                                    : `Delete Sub-Category "${selectedSubCat}"`
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* INLINE BUILDER TO ADD PARENT & SUB CATEGORIES */}
                  {(isCategoryBuilderOpen || categoriesTree.length === 0) && (
                    <div className="pt-3 border-t border-border/70 space-y-3">
                      {/* Create New Parent Category */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-foreground">
                          {isUiRtl ? 'إضافة تصنيف رئيسي جديد (Parent):' : 'Add New Parent Category:'}
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            dir={writeDir}
                            value={newParentName}
                            onChange={(e) => setNewParentName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddParentCategory();
                              }
                            }}
                            placeholder={
                              isUiRtl ? 'مثال: أخبار التقنية...' : 'e.g. Tech Announcements...'
                            }
                            className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground"
                          />
                          <button
                            type="button"
                            disabled={savingCats}
                            onClick={handleAddParentCategory}
                            className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer shrink-0"
                          >
                            {isUiRtl ? 'إضافة' : 'Add'}
                          </button>
                        </div>
                      </div>

                      {/* Create New Sub-Category under selected Parent */}
                      {selectedParentCat && (
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-foreground">
                            {isUiRtl
                              ? `إضافة تصنيف فرعي داخل "${selectedParentCat}":`
                              : `Add Sub-Category under "${selectedParentCat}":`}
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              dir={writeDir}
                              value={newSubName}
                              onChange={(e) => setNewSubName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddSubCategory();
                                }
                              }}
                              placeholder={
                                isUiRtl ? 'مثال: ذكاء اصطناعي...' : 'e.g. AI & Automation...'
                              }
                              className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground"
                            />
                            <button
                              type="button"
                              disabled={savingCats}
                              onClick={handleAddSubCategory}
                              className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer shrink-0"
                            >
                              {isUiRtl ? '+ فرعي' : '+ Sub'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Existing Category Tree List with Delete Controls */}
                      {categoriesTree.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pt-1">
                          {categoriesTree.map((cat) => (
                            <div
                              key={cat.name}
                              className="p-2.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-foreground">
                                  {cat.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteParentCategory(cat.name)}
                                  className="text-rose-500 hover:bg-rose-500/10 p-1 rounded-lg cursor-pointer"
                                  title={isUiRtl ? 'حذف التصنيف الرئيسي' : 'Delete Parent Category'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {cat.subCategories.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {cat.subCategories.map((sub) => (
                                    <span
                                      key={sub}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background border border-border text-[10px] font-semibold text-muted-foreground"
                                    >
                                      <span>{sub}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSubCategory(cat.name, sub)}
                                        className="hover:text-rose-500 cursor-pointer"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. LANGUAGE TARGET & WRITING DIRECTION CARD */}
                <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border/80 shadow-2xs space-y-4 text-start">
                  <div>
                    <label className="block text-xs font-extrabold text-foreground mb-2 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-primary" />
                      <span>
                        {isUiRtl ? 'إظهار المنشور في نسخة:' : 'Display in Platform Version:'}
                      </span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePostLangChange('all')}
                        className={cn(
                          'py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer',
                          postLang === 'all'
                            ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                            : 'bg-background text-muted-foreground border-border hover:text-foreground'
                        )}
                      >
                        {isUiRtl ? 'الكل (AR+EN)' : 'Both (All)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePostLangChange('ar')}
                        className={cn(
                          'py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer',
                          postLang === 'ar'
                            ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                            : 'bg-background text-muted-foreground border-border hover:text-foreground'
                        )}
                      >
                        {isUiRtl ? 'العربية فقط' : 'Arabic Only'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePostLangChange('en')}
                        className={cn(
                          'py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer',
                          postLang === 'en'
                            ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                            : 'bg-background text-muted-foreground border-border hover:text-foreground'
                        )}
                      >
                        {isUiRtl ? 'الإنجليزية فقط' : 'English Only'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-foreground mb-2 flex items-center gap-1.5">
                      {writeDir === 'rtl' ? (
                        <AlignRight className="w-4 h-4 text-primary" />
                      ) : (
                        <AlignLeft className="w-4 h-4 text-primary" />
                      )}
                      <span>{isUiRtl ? 'اتجاه كتابة النص:' : 'Writing Text Direction:'}</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWriteDir('rtl')}
                        className={cn(
                          'py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                          writeDir === 'rtl'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-background text-muted-foreground border-border hover:text-foreground'
                        )}
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                        <span>العربية (RTL)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setWriteDir('ltr')}
                        className={cn(
                          'py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                          writeDir === 'ltr'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-background text-muted-foreground border-border hover:text-foreground'
                        )}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                        <span>English (LTR)</span>
                      </button>
                    </div>
                  </div>

                  {/* Pin Post Toggle */}
                  <div className="pt-2 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => setIsPinned(!isPinned)}
                      className={cn(
                        'w-full py-2.5 px-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer',
                        isPinned
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Pin className={cn('w-4 h-4', isPinned && 'fill-current')} />
                      <span>
                        {isUiRtl ? 'تثبيت المنشور في أعلى المجتمع' : 'Pin Post to Top of Community'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FULL-SCREEN STICKY FOOTER ACTION BAR */}
          <div className="sticky bottom-0 z-20 px-4 sm:px-6 lg:px-10 py-3.5 sm:py-4 border-t border-border/80 bg-card/95 backdrop-blur-xl flex items-center justify-between gap-3">
            <div className="text-[11px] sm:text-xs text-muted-foreground hidden sm:block">
              {selectedParentCat ? (
                <span>
                  {isUiRtl ? 'التصنيف المختار: ' : 'Selected Category: '}
                  <strong className="text-foreground">{selectedParentCat}</strong>
                  {selectedSubCat ? ` › ${selectedSubCat}` : ''}
                </span>
              ) : (
                <span>{isUiRtl ? 'بدون تصنيف محدد' : 'No category selected'}</span>
              )}
            </div>

            <div className="flex items-center gap-2.5 ms-auto w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 sm:px-5 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                {isUiRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 sm:px-8 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm font-extrabold shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>
                  {postToEdit
                    ? isUiRtl
                      ? 'حفظ تعديلات المنشور'
                      : 'Save Post Changes'
                    : isUiRtl
                    ? 'نشر المنشور الآن'
                    : 'Publish Community Post'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </AnimatePresence>
  );
}
