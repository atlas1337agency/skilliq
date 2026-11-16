import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Rocket,
  Plus,
  Star,
  Github,
  Globe,
  MessageSquare,
  ThumbsUp,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  X,
  ExternalLink,
  Code2,
  User,
  Shield,
  Layers,
  ArrowRight,
  Send,
  Heart
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { 
  fetchAllStudentProjects, 
  submitStudentProject, 
  fetchProjectReviews, 
  addPeerReview, 
  toggleProjectLike,
  StudentProject, 
  PeerReview 
} from '../lib/studentProjects';
import { cn } from '../lib/utils';

export function StudentProjectShowcase() {
  const { t, i18n } = useTranslation();
  const { user, publicProfile, setIsAuthModalOpen, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [projects, setProjects] = useState<StudentProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Submit Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    title: '',
    description: '',
    category: 'Web Development',
    githubUrl: '',
    liveDemoUrl: '',
    tagsInput: 'React, TypeScript, Tailwind CSS',
    thumbnailUrl: ''
  });

  // Reviews Drawer / Modal
  const [activeProjectForReviews, setActiveProjectForReviews] = useState<StudentProject | null>(null);
  const [reviewsList, setReviewsList] = useState<PeerReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewFeedback, setReviewFeedback] = useState('');

  // Load projects
  useEffect(() => {
    let mounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const list = await fetchAllStudentProjects();
        if (mounted) setProjects(list);
      } catch (err) {
        console.error('Failed to load student projects:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Open Reviews Modal
  const handleOpenReviews = async (project: StudentProject) => {
    setActiveProjectForReviews(project);
    setIsLoadingReviews(true);
    setReviewFeedback('');
    setReviewRating(5);
    try {
      const revs = await fetchProjectReviews(project.id);
      setReviewsList(revs);
    } catch (e) {
      console.error('Failed to fetch reviews:', e);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Submit new project
  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!submitForm.title.trim() || !submitForm.githubUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const tags = submitForm.tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const usernameSlug = publicProfile?.username || (user.email ? user.email.split('@')[0] : `user_${user.uid.slice(0, 6)}`);

      const newProj = await submitStudentProject({
        userId: user.uid,
        userDisplayName: user.displayName || 'Student Builder',
        userPhotoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Student')}`,
        userUsername: usernameSlug,
        title: submitForm.title.trim(),
        description: submitForm.description.trim(),
        category: submitForm.category,
        githubUrl: submitForm.githubUrl.trim(),
        liveDemoUrl: submitForm.liveDemoUrl.trim() || undefined,
        tags,
        thumbnailUrl: submitForm.thumbnailUrl.trim() || undefined
      });

      setProjects(prev => [newProj, ...prev]);
      setIsSubmitModalOpen(false);
      setSubmitForm({
        title: '',
        description: '',
        category: 'Web Development',
        githubUrl: '',
        liveDemoUrl: '',
        tagsInput: 'React, TypeScript, Tailwind CSS',
        thumbnailUrl: ''
      });
    } catch (err) {
      console.error('Failed to submit student project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit peer review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!activeProjectForReviews || !reviewFeedback.trim()) return;

    setIsSubmittingReview(true);
    try {
      const usernameSlug = publicProfile?.username || (user.email ? user.email.split('@')[0] : `user_${user.uid.slice(0, 6)}`);

      const createdReview = await addPeerReview(activeProjectForReviews.id, {
        projectId: activeProjectForReviews.id,
        userId: user.uid,
        userDisplayName: user.displayName || 'Peer Reviewer',
        userPhotoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Reviewer')}`,
        userUsername: usernameSlug,
        rating: reviewRating,
        feedback: reviewFeedback.trim()
      });

      setReviewsList(prev => [createdReview, ...prev]);

      // Update in parent state
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectForReviews.id) {
          const newCount = p.reviewsCount + 1;
          const newAvg = Number(((p.avgRating * p.reviewsCount + reviewRating) / newCount).toFixed(1));
          return { ...p, reviewsCount: newCount, avgRating: newAvg };
        }
        return p;
      }));

      setReviewFeedback('');
    } catch (err) {
      console.error('Failed to post peer review:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Like project
  const handleLike = async (projectId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const result = await toggleProjectLike(projectId, user.uid);
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const likedBy = p.likedBy || [];
        const isLiked = likedBy.includes(user.uid);
        return {
          ...p,
          likesCount: result.newCount,
          likedBy: isLiked ? likedBy.filter(id => id !== user.uid) : [...likedBy, user.uid]
        };
      }
      return p;
    }));
  };

  // Categories list
  const categories = [
    'All',
    'Web Development',
    'Cybersecurity',
    'AI & Machine Learning',
    'DevOps',
    'Mobile'
  ];

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.userDisplayName.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)));
      return matchCat && matchQuery;
    });
  }, [projects, selectedCategory, searchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* SHOWCASE HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-card via-card/90 to-primary/10 border border-border shadow-sm">
        <div className="absolute top-0 end-0 -mt-8 -me-8 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRtl ? 'مجتمع بناة SkilliQ · كود حقيقي ومراجعات متبادلة' : 'SkilliQ Builders Hub · Real Code & Peer Feedback'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">
              {isRtl ? 'معرض مشاريع الطلاب وتقييم الأقران' : 'Student Project Showcase & Peer Reviews'}
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
              {isRtl
                ? 'شارك تطبيقاتك ومشاريعك المبنية بعد إكمال المسارات، واحصل على نقد كودي بنّاء من زملائك، واكسب +75 XP عند نشر مشروعك و +25 XP لكل مراجعة بنّاءة!'
                : 'Publish what you built from scratch, explore peer code repositories, write constructive reviews, and earn bonus XP on every submission.'}
            </p>
          </div>

          <button
            onClick={() => {
              if (!user) {
                setIsAuthModalOpen(true);
              } else {
                setIsSubmitModalOpen(true);
              }
            }}
            className="px-5 py-3.5 bg-primary hover:bg-primary/95 text-primary-foreground font-black rounded-2xl shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{isRtl ? 'شارك مشروعك العملي (+75 XP)' : 'Submit Your Project (+75 XP)'}</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH STRIP */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer border',
                  isSelected
                    ? 'bg-foreground text-background border-foreground shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground border-border/70 hover:bg-muted/50'
                )}
              >
                {cat === 'All' ? (isRtl ? 'جميع المشاريع' : 'All Categories') : cat}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute inset-y-0 start-3 my-auto w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isRtl ? 'ابحث في مشاريع الطلاب أو التقنيات...' : 'Search projects or tech stacks...'}
            className="w-full ps-9 pe-4 py-2.5 rounded-2xl bg-card border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary shadow-xs"
          />
        </div>
      </div>

      {/* PROJECTS GRID */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card rounded-3xl border border-border p-6 space-y-3 animate-pulse">
              <div className="h-6 bg-muted/60 rounded-lg w-2/3" />
              <div className="h-4 bg-muted/40 rounded-lg w-full" />
              <div className="h-24 bg-muted/30 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-16 text-center bg-card border border-dashed border-border rounded-3xl p-6 flex flex-col items-center justify-center">
          <Rocket className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <h3 className="text-base font-bold mb-1">
            {isRtl ? 'لا توجد مشاريع مطابقة' : 'No Student Projects Found'}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-4">
            {isRtl
              ? 'كن أول من يشارك مشروعه في هذا التصنيف واكسب +75 XP!'
              : 'Be the first student to publish a project in this category and earn +75 XP!'}
          </p>
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow-xs"
          >
            {isRtl ? 'نشر مشروع جديد' : 'Publish Project'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => {
            const isLiked = Boolean(user && project.likedBy?.includes(user.uid));

            return (
              <div
                key={project.id}
                className="group bg-card border border-border/80 hover:border-primary/50 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xs transition-all duration-200 hover:-translate-y-1 text-start"
              >
                {/* Optional Thumbnail */}
                {project.thumbnailUrl && (
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                    />
                    <span className="absolute top-3 start-3 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-white text-[10px] font-bold">
                      {project.category}
                    </span>
                  </div>
                )}

                <div className="p-5 sm:p-6 flex-1 flex flex-col">
                  {/* Category Chip (if no thumbnail) */}
                  {!project.thumbnailUrl && (
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                        {project.category}
                      </span>
                      {project.isFeatured && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>{isRtl ? 'مميز' : 'Featured'}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Title & Author Info */}
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed flex-1">
                    {project.description}
                  </p>

                  {/* Tech Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {project.tags.map(t => (
                        <span
                          key={t}
                          className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-muted/80 text-muted-foreground border border-border/50"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Author Strip & Public Portfolio Link */}
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 mb-4">
                    <Link
                      to={`/p/${project.userUsername || project.userId}`}
                      className="flex items-center gap-2 group/author min-w-0"
                      title={isRtl ? 'عرض الملف المهني والشجرة المهارية' : 'View Public Portfolio'}
                    >
                      <img
                        src={project.userPhotoURL}
                        alt={project.userDisplayName}
                        className="w-7 h-7 rounded-full object-cover border border-border shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-foreground truncate block group-hover/author:text-primary transition-colors">
                          {project.userDisplayName}
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {project.userUsername ? `@${project.userUsername}` : (isRtl ? 'طالب معتمد' : 'Verified Learner')}
                        </span>
                      </div>
                    </Link>

                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{project.avgRating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Action Buttons Toolbar */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1">
                      {/* GitHub Link */}
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                          title="GitHub Repository"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}

                      {/* Live Demo Link */}
                      {project.liveDemoUrl && (
                        <a
                          href={project.liveDemoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                          title="Live Demo"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}

                      {/* Like Button */}
                      <button
                        onClick={() => handleLike(project.id)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer",
                          isLiked 
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/30" 
                            : "bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground"
                        )}
                        title="Upvote Project"
                      >
                        <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current text-rose-500")} />
                        <span>{project.likesCount}</span>
                      </button>
                    </div>

                    {/* Peer Reviews Button */}
                    <button
                      onClick={() => handleOpenReviews(project)}
                      className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{project.reviewsCount} {isRtl ? 'تقييمات' : 'Reviews'}</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBMIT PROJECT MODAL */}
      <AnimatePresence>
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 relative"
            >
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="absolute top-5 end-5 p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Rocket className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-foreground">
                  {isRtl ? 'شارك مشروعك العملي (+75 XP)' : 'Submit Student Project (+75 XP)'}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mb-6">
                {isRtl
                  ? 'انشر كود مشروعك المكتمل ليراه الزملاء ويكتبوا عنه مراجعات نقدية، وسيظهر فورياً في ملفك المهني العام.'
                  : 'Showcase your production project, receive peer code reviews, and pin it to your public portfolio.'}
              </p>

              <form onSubmit={handleSubmitProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isRtl ? 'عنوان المشروع' : 'Project Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={submitForm.title}
                    onChange={e => setSubmitForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Distributed Network Port Scanner & Report Generator"
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isRtl ? 'التصنيف والمجال' : 'Category *'}
                  </label>
                  <select
                    value={submitForm.category}
                    onChange={e => setSubmitForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="Cybersecurity">Cybersecurity & Ethical Hacking</option>
                    <option value="AI & Machine Learning">AI & Machine Learning</option>
                    <option value="DevOps">Cloud & DevOps</option>
                    <option value="Mobile">Mobile Applications</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isRtl ? 'وصف المشروع وما يحلّه' : 'Description & What Problem It Solves *'}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={submitForm.description}
                    onChange={e => setSubmitForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Explain the features, architecture, and what you learned while building this project..."
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      GitHub Repository URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={submitForm.githubUrl}
                      onChange={e => setSubmitForm(prev => ({ ...prev, githubUrl: e.target.value }))}
                      placeholder="https://github.com/username/project"
                      className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Live Demo URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={submitForm.liveDemoUrl}
                      onChange={e => setSubmitForm(prev => ({ ...prev, liveDemoUrl: e.target.value }))}
                      placeholder="https://my-demo-app.vercel.app"
                      className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isRtl ? 'التقنيات المستخدمة (مفصولة بفاصلة)' : 'Tech Stack Tags (comma separated)'}
                  </label>
                  <input
                    type="text"
                    value={submitForm.tagsInput}
                    onChange={e => setSubmitForm(prev => ({ ...prev, tagsInput: e.target.value }))}
                    placeholder="React, TypeScript, Tailwind CSS, Docker, Python"
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isRtl ? 'رابط صورة أو لقطة شاشة للمشروع (اختياري)' : 'Screenshot / Preview Image URL (Optional)'}
                  </label>
                  <input
                    type="url"
                    value={submitForm.thumbnailUrl}
                    onChange={e => setSubmitForm(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 disabled:opacity-50 shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmitting && <Sparkles className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isRtl ? 'نشر المشروع (+75 XP)' : 'Publish Project (+75 XP)'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PEER REVIEWS DRAWER / MODAL */}
      <AnimatePresence>
        {activeProjectForReviews && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 relative flex flex-col max-h-[85vh]"
            >
              <button
                onClick={() => setActiveProjectForReviews(null)}
                className="absolute top-5 end-5 p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="mb-4 pb-4 border-b border-border/60">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                  {activeProjectForReviews.category}
                </span>
                <h3 className="text-xl font-black text-foreground mt-1 mb-1">
                  {activeProjectForReviews.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{isRtl ? 'بواسطة' : 'by'}</span>
                  <Link
                    to={`/p/${activeProjectForReviews.userUsername || activeProjectForReviews.userId}`}
                    className="font-bold text-foreground hover:text-primary transition-colors"
                  >
                    {activeProjectForReviews.userDisplayName}
                  </Link>
                  <span>·</span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{activeProjectForReviews.avgRating.toFixed(1)} / 5</span>
                    <span className="text-muted-foreground font-normal">({reviewsList.length} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Reviews Scroll Area */}
              <div className="flex-1 overflow-y-auto space-y-4 pe-2 scrollbar-thin mb-4">
                {isLoadingReviews ? (
                  <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                    {isRtl ? 'جاري تحميل تقييمات الأقران...' : 'Loading reviews...'}
                  </div>
                ) : reviewsList.length === 0 ? (
                  <div className="py-8 text-center bg-muted/20 rounded-2xl border border-dashed border-border/60 p-4">
                    <Star className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs font-bold text-foreground">
                      {isRtl ? 'لا توجد تقييمات بعد لهذا المشروع' : 'No peer reviews yet for this project'}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {isRtl ? 'كن أول من يقيّم هذا الكود ويكتب ملاحظات بنّاءة (+25 XP)!' : 'Be the first peer to leave constructive feedback (+25 XP)!'}
                    </p>
                  </div>
                ) : (
                  reviewsList.map(review => (
                    <div key={review.id} className="bg-muted/30 p-4 rounded-2xl border border-border/50 text-start">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Link
                          to={`/p/${review.userUsername || review.userId}`}
                          className="flex items-center gap-2 group/revAuthor"
                        >
                          <img
                            src={review.userPhotoURL}
                            alt={review.userDisplayName}
                            className="w-6 h-6 rounded-full object-cover border border-border"
                          />
                          <span className="text-xs font-bold text-foreground group-hover/revAuthor:text-primary transition-colors">
                            {review.userDisplayName}
                          </span>
                        </Link>

                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-3 h-3",
                                i < review.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {review.feedback}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Submit Review Box */}
              <form onSubmit={handleSubmitReview} className="pt-4 border-t border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {isRtl ? 'تقييمك للمشروع (+25 XP)' : 'Your Peer Review & Feedback (+25 XP)'}
                  </span>
                  
                  {/* Star Rating Picker */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setReviewHoverRating(star)}
                        onMouseLeave={() => setReviewHoverRating(0)}
                        className="p-1 text-amber-500 cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "w-5 h-5",
                            (reviewHoverRating || reviewRating) >= star ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={reviewFeedback}
                    onChange={e => setReviewFeedback(e.target.value)}
                    placeholder={isRtl ? 'اكتب ملاحظات بنّاءة واقتراحات لتحسين الكود والتطبيق...' : 'Write constructive feedback, architecture insights, and code improvements...'}
                    className="flex-1 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingReview || !reviewFeedback.trim()}
                    className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-95 disabled:opacity-40 shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    {isSubmittingReview ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{isRtl ? 'إرسال' : 'Submit'}</span>
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
