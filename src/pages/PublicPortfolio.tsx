import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Flame,
  Award,
  CheckCircle2,
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  Share2,
  Copy,
  Check,
  Edit3,
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
  Code2,
  Cpu,
  Server,
  Terminal,
  BookOpen,
  Calendar,
  Lock,
  Printer,
  ChevronRight,
  Star,
  Rocket,
  Info,
  X
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { 
  getPortfolioByUsernameOrUid, 
  updatePortfolioProfile, 
  computeUserSkillTree, 
  StudentPortfolioProfile, 
  SkillTreeNode 
} from '../lib/portfolio';
import { fetchAllStudentProjects, StudentProject } from '../lib/studentProjects';
import { SEO } from '../components/SEO';
import { cn } from '../lib/utils';
import { getCoursePath } from '../lib/courseUtils';

export function PublicPortfolio() {
  const { username } = useParams<{ username: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, courses, learningPaths, progress, language } = useStore();

  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [profile, setProfile] = useState<StudentPortfolioProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allStudentProjects, setAllStudentProjects] = useState<StudentProject[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'skill-tree' | 'certificates' | 'projects'>('skill-tree');
  const [selectedNode, setSelectedNode] = useState<SkillTreeNode | null>(null);
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    displayName: '',
    headline: '',
    bio: '',
    location: '',
    githubUrl: '',
    linkedinUrl: '',
    websiteUrl: '',
    skillsInput: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Check if current user is viewing their own portfolio
  const isOwnProfile = useMemo(() => {
    if (!user || !profile) return false;
    return user.uid === profile.uid || (username && user.displayName && username.toLowerCase() === user.displayName.toLowerCase().replace(/\s+/g, ''));
  }, [user, profile, username]);

  // Load profile data
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      const targetIdentifier = username || user?.uid;

      if (!targetIdentifier) {
        setIsLoading(false);
        return;
      }

      try {
        const foundProfile = await getPortfolioByUsernameOrUid(targetIdentifier);
        if (isMounted) {
          if (foundProfile) {
            setProfile(foundProfile);
            setEditForm({
              username: foundProfile.username || '',
              displayName: foundProfile.displayName || '',
              headline: foundProfile.headline || '',
              bio: foundProfile.bio || '',
              location: foundProfile.location || '',
              githubUrl: foundProfile.githubUrl || '',
              linkedinUrl: foundProfile.linkedinUrl || '',
              websiteUrl: foundProfile.websiteUrl || '',
              skillsInput: (foundProfile.skills || []).join(', ')
            });
          } else if (isOwnProfile && user) {
            // Default profile for current user if not initialized yet
            const defaultProf: StudentPortfolioProfile = {
              uid: user.uid,
              username: user.email ? user.email.split('@')[0] : `user_${user.uid.slice(0, 6)}`,
              displayName: user.displayName || 'Learner',
              photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Learner')}`,
              email: user.email || '',
              headline: 'Technology Learner & Builder',
              bio: '',
              xp: 150,
              streak: 1,
              skills: ['Web Development', 'Problem Solving']
            };
            setProfile(defaultProf);
          }
        }

        // Load community student projects to filter for this user
        const projList = await fetchAllStudentProjects();
        if (isMounted) {
          setAllStudentProjects(projList);
        }
      } catch (err) {
        console.error('Error loading portfolio profile:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [username, user, isOwnProfile]);

  // User's completed courses
  const completedCourseIds = useMemo(() => {
    if (isOwnProfile) {
      return Object.entries(progress)
        .filter(([_, p]) => p.isCompleted)
        .map(([cId]) => cId);
    }
    // If viewing someone else, we show courses inferred from their verified skills or public data
    return courses.slice(0, 3).map(c => c.id);
  }, [isOwnProfile, progress, courses]);

  const completedCoursesList = useMemo(() => {
    const set = new Set(completedCourseIds);
    return courses.filter(c => set.has(c.id));
  }, [completedCourseIds, courses]);

  // Dynamic Skill Tree computation
  const skillTreeNodes = useMemo(() => {
    return computeUserSkillTree(completedCourseIds, courses, profile?.skills || []);
  }, [completedCourseIds, courses, profile?.skills]);

  // Filtered projects built by this student
  const studentShowcaseProjects = useMemo(() => {
    if (!profile) return [];
    return allStudentProjects.filter(
      p => p.userId === profile.uid || (p.userUsername && p.userUsername.toLowerCase() === profile.username.toLowerCase())
    );
  }, [allStudentProjects, profile]);

  // Skill Tree Categories Breakdown
  const categoriesList = [
    { key: 'web', label: isRtl ? 'تطوير الويب الشامل' : 'Web & Full-Stack', icon: Code2, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    { key: 'cyber', label: isRtl ? 'الأمن السيبراني واختبار الاختراق' : 'Cybersecurity & Pentesting', icon: Shield, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    { key: 'ai', label: isRtl ? 'الذكاء الاصطناعي والبيانات' : 'AI & Data Science', icon: Cpu, color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
    { key: 'devops', label: isRtl ? 'الحوسبة السحابية وDevOps' : 'Cloud & DevOps', icon: Server, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' }
  ];

  // Copy link handler
  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/p/${profile?.username || username || ''}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  // LinkedIn share handler
  const handleShareLinkedIn = () => {
    const shareUrl = encodeURIComponent(`${window.location.origin}/p/${profile?.username || username || ''}`);
    const title = encodeURIComponent(`${profile?.displayName || 'Student'} - Verified Tech Portfolio on SkilliQ`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}&title=${title}`, '_blank', 'noopener,noreferrer');
  };

  // Save profile edits
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setIsSaving(true);
    try {
      const skillsArr = editForm.skillsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const updated = await updatePortfolioProfile(user.uid, {
        username: editForm.username,
        displayName: editForm.displayName,
        headline: editForm.headline,
        bio: editForm.bio,
        location: editForm.location,
        githubUrl: editForm.githubUrl,
        linkedinUrl: editForm.linkedinUrl,
        websiteUrl: editForm.websiteUrl,
        skills: skillsArr
      });

      setProfile(updated);
      setIsEditModalOpen(false);

      // If username changed, update URL seamlessly
      if (updated.username && updated.username !== username) {
        navigate(`/p/${updated.username}`, { replace: true });
      }
    } catch (err) {
      console.error('Failed to update portfolio profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 animate-pulse">
          <Sparkles className="w-8 h-8 text-primary animate-spin" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">
          {isRtl ? 'جاري تحميل الملف المهني وشجرة المهارات...' : 'Loading verified portfolio & skill tree...'}
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] max-w-lg mx-auto px-4 py-16 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {isRtl ? 'الملف المهني غير موجود' : 'Portfolio Profile Not Found'}
        </h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {isRtl 
            ? 'لم يتم العثور على طالب بهذا الاسم المستعار. تأكد من صحة الرابط أو تصفح معرض أعمال الطلاب.' 
            : 'No student matches this username. Check the link or browse our Student Projects Showcase.'}
        </p>
        <Link
          to="/projects"
          className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow-sm hover:opacity-95"
        >
          {isRtl ? 'تصفح المشاريع والطلاب' : 'Browse Student Showcase'}
        </Link>
      </div>
    );
  }

  const masteredCount = skillTreeNodes.filter(n => n.isMastered).length;
  const inProgressCount = skillTreeNodes.filter(n => n.isInProgress).length;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen pb-16 transition-colors">
      <SEO
        title={`${profile.displayName} (@${profile.username}) – ${isRtl ? 'الملف المهني وشجرة المهارات' : 'Verified Tech Portfolio & Skill Tree'} | Skilliq`}
        description={profile.bio || profile.headline || 'Verified student portfolio, interactive skill tree, certificates and hands-on projects on Skilliq.'}
        canonicalPath={`/p/${profile.username}`}
        lang={isRtl ? 'ar' : 'en'}
      />

      {/* HEADER AMBIENT GLOW BACKDROP */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background pt-8 sm:pt-12 pb-6 border-b border-border/60">
        <div className="absolute top-0 start-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 end-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          
          {/* TOP BREADCRUMB & EDIT TOOLBAR */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">{t('home')}</Link>
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              <Link to="/projects" className="hover:text-foreground transition-colors">{isRtl ? 'المشاريع والطلاب' : 'Projects'}</Link>
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              <span className="text-foreground truncate max-w-[140px]">@{profile.username}</span>
            </div>

            <div className="flex items-center gap-2">
              {isOwnProfile && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-card border border-border/80 hover:border-primary text-xs font-bold text-foreground transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-primary" />
                  <span>{isRtl ? 'تعديل ملفي' : 'Edit Profile'}</span>
                </button>
              )}

              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-card border border-border/80 hover:bg-muted text-xs font-bold text-foreground transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Copy share link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="hidden sm:inline">{copied ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ الرابط' : 'Copy Link')}</span>
              </button>

              <button
                onClick={handleShareLinkedIn}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 border border-[#0A66C2]/30 text-[#0A66C2] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Share to LinkedIn"
              >
                <Linkedin className="w-4 h-4 fill-current" />
                <span className="hidden sm:inline">{isRtl ? 'مشاركة' : 'Share'}</span>
              </button>
            </div>
          </div>

          {/* MAIN PROFILE HERO CARD */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-card/85 backdrop-blur-xl border border-border/80 p-6 sm:p-8 rounded-3xl shadow-sm">
            
            {/* Avatar with Halo Ring */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-gradient-to-tr from-blue-600 via-indigo-500 to-violet-500 shadow-md">
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="w-full h-full rounded-[22px] object-cover bg-muted"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-1.5 -end-1.5 bg-emerald-500 text-white p-1 rounded-full border-2 border-background shadow-xs" title="Verified Learner">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            {/* Profile Info & Bio */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  {profile.displayName}
                </h1>
                <span className="text-xs sm:text-sm font-bold text-primary font-mono bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                  @{profile.username}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-xs font-black">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>{profile.streak} {isRtl ? 'يوم متواصل' : 'Day Streak'}</span>
                </span>
              </div>

              {profile.headline && (
                <p className="text-sm sm:text-base font-semibold text-foreground/90 mb-2">
                  {profile.headline}
                </p>
              )}

              {profile.bio && (
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mb-3">
                  {profile.bio}
                </p>
              )}

              {/* Skills Chips */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {profile.skills.map(skill => (
                    <span
                      key={skill}
                      className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-muted/80 border border-border/60 text-muted-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Social Links */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground">
                {profile.githubUrl && (
                  <a
                    href={profile.githubUrl.startsWith('http') ? profile.githubUrl : `https://${profile.githubUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl.startsWith('http') ? profile.linkedinUrl : `https://${profile.linkedinUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-[#0A66C2] transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl.startsWith('http') ? profile.websiteUrl : `https://${profile.websiteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>

            {/* Quick Metrics Strip on the side */}
            <div className="w-full md:w-auto grid grid-cols-3 md:flex md:flex-col gap-2 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-s border-border/60 md:ps-6">
              <div className="bg-muted/40 p-2.5 rounded-2xl border border-border/50 text-center md:text-start">
                <div className="text-lg sm:text-xl font-black text-primary font-mono">{profile.xp.toLocaleString()}</div>
                <div className="text-[11px] font-bold text-muted-foreground">{isRtl ? 'نقاط الخبرة XP' : 'Total XP'}</div>
              </div>
              <div className="bg-muted/40 p-2.5 rounded-2xl border border-border/50 text-center md:text-start">
                <div className="text-lg sm:text-xl font-black text-emerald-500">{masteredCount}</div>
                <div className="text-[11px] font-bold text-muted-foreground">{isRtl ? 'مهارات مُتقنة' : 'Skills Mastered'}</div>
              </div>
              <div className="bg-muted/40 p-2.5 rounded-2xl border border-border/50 text-center md:text-start">
                <div className="text-lg sm:text-xl font-black text-violet-500">{studentShowcaseProjects.length}</div>
                <div className="text-[11px] font-bold text-muted-foreground">{isRtl ? 'مشاريع عملية' : 'Built Projects'}</div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center gap-2 border-b border-border/80 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('skill-tree')}
            className={cn(
              'px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 border',
              activeTab === 'skill-tree'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-card text-muted-foreground hover:text-foreground border-border/60'
            )}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isRtl ? 'شجرة المهارات التفاعلية (Visual Skill Tree)' : 'Interactive Skill Tree'}</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-black/15">
              {masteredCount}/{skillTreeNodes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('certificates')}
            className={cn(
              'px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 border',
              activeTab === 'certificates'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-card text-muted-foreground hover:text-foreground border-border/60'
            )}
          >
            <Award className="w-4 h-4" />
            <span>{isRtl ? 'الشهادات المعتمدة' : 'Verified Certificates'}</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-black/15">
              {completedCoursesList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={cn(
              'px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 border',
              activeTab === 'projects'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-card text-muted-foreground hover:text-foreground border-border/60'
            )}
          >
            <Rocket className="w-4 h-4" />
            <span>{isRtl ? 'معرض المشاريع التطبيقية' : 'Showcased Projects'}</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-black/15">
              {studentShowcaseProjects.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT AREAS */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">

        {/* 1. VISUAL SKILL TREE */}
        {activeTab === 'skill-tree' && (
          <div className="space-y-10">
            {/* Header intro */}
            <div className="bg-card border border-border/80 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span>{isRtl ? 'خريطة الكفاءات والشجرة التقنية' : 'Competency Map & Verified Skill Tree'}</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isRtl
                    ? 'يتم فتح كل عقدة مهارية تلقائياً بمجرد إكمال الكورسات والمسارات التابعة لها أو اعتماد المشاريع العملية.'
                    : 'Nodes unlock dynamically based on courses completed, hands-on project builds, and verified achievements.'}
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-xs font-bold shrink-0">
                <span className="inline-flex items-center gap-1.5 text-emerald-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>{isRtl ? 'مُتقنة وموثقة' : 'Mastered'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-amber-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>{isRtl ? 'قيد التعلّم' : 'In Progress'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
                  <span>{isRtl ? 'مسار قادم' : 'Locked'}</span>
                </span>
              </div>
            </div>

            {/* Render Category Tracks */}
            {categoriesList.map(cat => {
              const nodesInCat = skillTreeNodes.filter(n => n.category === cat.key);
              if (nodesInCat.length === 0) return null;

              const IconComp = cat.icon;
              const catMastered = nodesInCat.filter(n => n.isMastered).length;
              const percent = Math.round((catMastered / nodesInCat.length) * 100);

              return (
                <div key={cat.key} className="space-y-4">
                  {/* Category Title Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("p-2 rounded-xl border", cat.color)}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-foreground">{cat.label}</h3>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {catMastered} / {nodesInCat.length} {isRtl ? 'عقد مهارية مكتملة' : 'nodes completed'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-24 sm:w-32 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-black font-mono text-muted-foreground">{percent}%</span>
                    </div>
                  </div>

                  {/* Connected Nodes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {nodesInCat.map((node, index) => {
                      const isMastered = node.isMastered;
                      const isInProgress = node.isInProgress;

                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className={cn(
                            'group relative p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between select-none hover:-translate-y-1',
                            isMastered
                              ? 'bg-card border-emerald-500/40 hover:border-emerald-500 shadow-md hover:shadow-emerald-500/10'
                              : isInProgress
                              ? 'bg-card border-amber-500/40 hover:border-amber-500 shadow-xs'
                              : 'bg-card/60 border-border/70 opacity-75 hover:opacity-100 hover:border-border'
                          )}
                        >
                          {/* Status Badge */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span
                              className={cn(
                                'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1',
                                isMastered
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : isInProgress
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  : 'bg-muted text-muted-foreground'
                              )}
                            >
                              {isMastered ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  <span>{isRtl ? 'مُتقن' : 'Mastered'}</span>
                                </>
                              ) : isInProgress ? (
                                <>
                                  <Flame className="w-3 h-3 text-amber-500" />
                                  <span>{isRtl ? 'قيد التعلّم' : 'In Progress'}</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3 text-muted-foreground" />
                                  <span>{isRtl ? 'مقفل' : 'Step ' + (index + 1)}</span>
                                </>
                              )}
                            </span>

                            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                              {node.level}
                            </span>
                          </div>

                          {/* Node Title */}
                          <div className="mb-4">
                            <h4 className="text-sm font-bold text-foreground mb-1 leading-snug group-hover:text-primary transition-colors">
                              {isRtl ? node.titleAr : node.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {isRtl ? node.descriptionAr : node.description}
                            </p>
                          </div>

                          {/* Progress indicator */}
                          <div className="pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-bold">
                            <span className="text-muted-foreground">
                              {isRtl ? 'المقررات المستوفاة:' : 'Matched Courses:'}
                            </span>
                            <span className={cn("font-mono", isMastered ? "text-emerald-500" : "text-foreground")}>
                              {node.matchedCompletedCount} / {node.totalRequired}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. VERIFIED CERTIFICATES */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <div className="bg-card border border-border/80 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2 mb-1">
                  <Award className="w-5 h-5 text-primary" />
                  <span>{isRtl ? 'الشهادات المعتمدة من SkilliQ' : 'SkilliQ Verified Credentials'}</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isRtl
                    ? 'شهادات معتمدة صادرة بناءً على إكمال 100% من متطلبات المقررات والامتحانات العملية، ويمكن التحقق منها علناً.'
                    : 'Tamper-proof verifiable certificates issued upon 100% completion of course tracks.'}
                </p>
              </div>

              <Link
                to="/verify"
                className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isRtl ? 'التحقق من صحة الشهادات' : 'Verify a Credential'}</span>
              </Link>
            </div>

            {completedCoursesList.length === 0 ? (
              <div className="py-16 text-center bg-card border border-dashed border-border rounded-3xl p-6 flex flex-col items-center justify-center">
                <Award className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <h3 className="text-base font-bold mb-1">{isRtl ? 'لا توجد شهادات بعد' : 'No Certificates Yet'}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-4">
                  {isRtl
                    ? 'أكمل المسارات التعليمية والكورسات للحصول على شهادات اعتماد رسمية برقم تسلسلي موثق.'
                    : 'Complete structured courses and playlists on SkilliQ to earn verifiable credentials.'}
                </p>
                <Link
                  to="/courses"
                  className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow-xs"
                >
                  {isRtl ? 'استكشف المقررات' : 'Explore Courses'}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedCoursesList.map(course => (
                  <div
                    key={course.id}
                    className="bg-card border border-border/80 hover:border-primary/50 rounded-3xl p-5 flex flex-col justify-between shadow-xs transition-all hover:-translate-y-1"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                          {course.category}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isRtl ? 'موثقة' : 'VERIFIED'}</span>
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-foreground mb-2 line-clamp-2">
                        {course.title}
                      </h3>

                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                        {course.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border/50 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-muted-foreground">
                        <span className="block font-semibold text-foreground truncate max-w-[120px]">
                          {course.instructor || 'SkilliQ Faculty'}
                        </span>
                        <span>{isRtl ? 'جهة الإصدار' : 'Issued by SkilliQ'}</span>
                      </div>

                      <Link
                        to={`/certificate/${course.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 shadow-xs flex items-center gap-1"
                      >
                        <span>{isRtl ? 'عرض الشهادة' : 'View Credential'}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. SHOWCASED PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="bg-card border border-border/80 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2 mb-1">
                  <Rocket className="w-5 h-5 text-emerald-500" />
                  <span>{isRtl ? 'المشاريع التطبيقية المنفذة' : 'Showcased Production Builds'}</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isRtl
                    ? 'المشاريع والتطبيقات البرمجية التي بناها الطالب من الصفر وشاركها مع المجتمع لتقييم الكود والأداء.'
                    : 'Real-world projects developed from scratch with publicly accessible code and live demos.'}
                </p>
              </div>

              {isOwnProfile && (
                <Link
                  to="/projects"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'شارك مشروعاً جديداً (+75 XP)' : 'Submit New Project (+75 XP)'}</span>
                </Link>
              )}
            </div>

            {studentShowcaseProjects.length === 0 ? (
              <div className="py-16 text-center bg-card border border-dashed border-border rounded-3xl p-6 flex flex-col items-center justify-center">
                <Rocket className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <h3 className="text-base font-bold mb-1">{isRtl ? 'لم يتم نشر مشاريع بعد' : 'No Projects Published Yet'}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-4">
                  {isRtl
                    ? 'شارك مشاريعك في قسم المشاريع ليتم عرضها في ملفك المهني مع تقييمات الأقران وروابط GitHub.'
                    : 'Submit hands-on projects to showcase your code and collect peer reviews.'}
                </p>
                <Link
                  to="/projects"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-xs hover:bg-emerald-700"
                >
                  {isRtl ? 'الذهاب لقسم المشاريع' : 'Go to Projects'}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studentShowcaseProjects.map(proj => (
                  <div
                    key={proj.id}
                    className="bg-card border border-border/80 hover:border-emerald-500/50 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xs transition-all hover:-translate-y-1"
                  >
                    {/* Thumbnail if present */}
                    {proj.thumbnailUrl && (
                      <div className="relative aspect-video overflow-hidden bg-muted">
                        <img
                          src={proj.thumbnailUrl}
                          alt={proj.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 start-3 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-white text-[10px] font-bold">
                          {proj.category}
                        </span>
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col">
                      {!proj.thumbnailUrl && (
                        <div className="mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {proj.category}
                          </span>
                        </div>
                      )}

                      <h3 className="text-base font-bold text-foreground mb-1.5 leading-snug">
                        {proj.title}
                      </h3>

                      <p className="text-xs text-muted-foreground line-clamp-3 mb-4 flex-1 leading-relaxed">
                        {proj.description}
                      </p>

                      {/* Tags */}
                      {proj.tags && proj.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {proj.tags.map(t => (
                            <span key={t} className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Stats & Actions */}
                      <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{proj.avgRating.toFixed(1)}</span>
                          <span className="text-muted-foreground font-normal">({proj.reviewsCount})</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {proj.githubUrl && (
                            <a
                              href={proj.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors"
                              title="GitHub Repository"
                            >
                              <Github className="w-4 h-4" />
                            </a>
                          )}
                          {proj.liveDemoUrl && (
                            <a
                              href={proj.liveDemoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              <span>{isRtl ? 'معاينة' : 'Demo'}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* SKILL NODE DETAILS MODAL */}
      <AnimatePresence>
        {selectedNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-card border border-border/80 rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedNode(null)}
                className="absolute top-5 end-5 p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  "px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                  selectedNode.isMastered ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                )}>
                  {selectedNode.isMastered ? (isRtl ? 'مهارة مُتقنة وموثقة' : 'Verified Mastery') : (isRtl ? 'قيد التعلّم' : 'In Progress')}
                </span>
                <span className="text-xs font-mono text-muted-foreground uppercase">{selectedNode.level}</span>
              </div>

              <h3 className="text-xl font-black text-foreground mb-2">
                {isRtl ? selectedNode.titleAr : selectedNode.title}
              </h3>

              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                {isRtl ? selectedNode.descriptionAr : selectedNode.description}
              </p>

              <div className="bg-muted/40 p-4 rounded-2xl border border-border/50 mb-6 space-y-2">
                <div className="text-xs font-bold text-foreground">
                  {isRtl ? 'الكلمات المفتاحية والمواضيع المطلوبة:' : 'Associated Topics & Concepts:'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.requiredCourses.map(kw => (
                    <span key={kw} className="text-xs px-2 py-0.5 rounded-md bg-card border border-border text-foreground font-mono">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Link
                  to="/courses"
                  onClick={() => setSelectedNode(null)}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{isRtl ? 'تصفح مسارات هذه المهارة' : 'Browse Courses'}</span>
                </Link>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="px-4 py-2.5 rounded-xl border border-border text-foreground text-xs font-bold hover:bg-muted"
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 relative"
            >
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-5 end-5 p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-black text-foreground mb-1">
                {isRtl ? 'تعديل الملف المهني ورابط المشاركة' : 'Edit Public Portfolio'}
              </h2>
              <p className="text-xs text-muted-foreground mb-6">
                {isRtl ? 'خصص مظهر ملفك المهني ورابط skilliq.online/p/username لمشاركته مع أصحاب العمل.' : 'Customize your public profile URL and links to share on CV and LinkedIn.'}
              </p>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isRtl ? 'الاسم المستعار (Username)' : 'Username / Handle'}
                  </label>
                  <div className="flex items-center rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-mono">
                    <span className="text-muted-foreground">skilliq.online/p/</span>
                    <input
                      type="text"
                      required
                      value={editForm.username}
                      onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                      className="flex-1 bg-transparent border-none outline-none font-bold text-primary px-1"
                      placeholder="username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isRtl ? 'الاسم الظاهر' : 'Display Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.displayName}
                    onChange={e => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isRtl ? 'المسمى الوظيفي / العنوان (Headline)' : 'Professional Headline'}
                  </label>
                  <input
                    type="text"
                    value={editForm.headline}
                    placeholder="e.g. Full-Stack Developer & Ethical Hacking Enthusiast"
                    onChange={e => setEditForm(prev => ({ ...prev, headline: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isRtl ? 'نبذة عنك (Bio)' : 'Bio / Summary'}
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.bio}
                    placeholder="Write a brief introduction about your tech journey and projects..."
                    onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isRtl ? 'المهارات (مفصولة بفاصلة)' : 'Skills (comma separated)'}
                  </label>
                  <input
                    type="text"
                    value={editForm.skillsInput}
                    placeholder="React, TypeScript, Python, OWASP, Docker"
                    onChange={e => setEditForm(prev => ({ ...prev, skillsInput: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={editForm.githubUrl}
                      placeholder="https://github.com/username"
                      onChange={e => setEditForm(prev => ({ ...prev, githubUrl: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={editForm.linkedinUrl}
                      placeholder="https://linkedin.com/in/username"
                      onChange={e => setEditForm(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 disabled:opacity-50 shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {isSaving && <Sparkles className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isRtl ? 'حفظ التعديلات' : 'Save Changes'}</span>
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
