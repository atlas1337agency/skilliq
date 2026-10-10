import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Map,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Wrench,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  PlayCircle,
  Clock,
  Layers,
  Sparkles,
  Image as ImageIcon,
  Compass,
  Maximize2,
  Minimize2,
  X,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  LayoutGrid,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Code,
  Terminal,
  Layout,
  Database,
  Shield,
  Zap,
  Search,
  Move,
  Crosshair,
  ChevronsUpDown,
  Target
} from 'lucide-react';
import {
  Course,
  LearningPath,
  LearningPathRoadmapStep,
  LearningPathRoadmapResource
} from '../data/courses';
import { cn } from '../lib/utils';

interface PathGraphicRoadmapProps {
  path: LearningPath;
  courses: Course[];
  progress?: Record<string, Record<string, boolean>>;
  language?: 'en' | 'ar';
  isPreview?: boolean;
}

const iconMap: Record<string, any> = {
  Code,
  Terminal,
  Layout,
  Database,
  Shield,
  Zap,
  Layers,
  Compass
};

// Vibrant Mind-Elixir inspired branch color palette that adapts to Light & Dark mode
const BRANCH_COLORS = [
  {
    name: 'pink',
    stroke: '#ec4899',
    border: 'border-pink-500/70 dark:border-pink-400/70',
    bg: 'bg-pink-500/10 dark:bg-pink-500/15',
    pillBg: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white',
    text: 'text-pink-600 dark:text-pink-400',
    glow: 'shadow-pink-500/20',
    ring: 'ring-pink-500/40'
  },
  {
    name: 'blue',
    stroke: '#3b82f6',
    border: 'border-blue-500/70 dark:border-blue-400/70',
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    pillBg: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
    text: 'text-blue-600 dark:text-blue-400',
    glow: 'shadow-blue-500/20',
    ring: 'ring-blue-500/40'
  },
  {
    name: 'violet',
    stroke: '#8b5cf6',
    border: 'border-violet-500/70 dark:border-violet-400/70',
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
    pillBg: 'bg-gradient-to-r from-violet-500 to-purple-600 text-white',
    text: 'text-violet-600 dark:text-violet-400',
    glow: 'shadow-violet-500/20',
    ring: 'ring-violet-500/40'
  },
  {
    name: 'emerald',
    stroke: '#10b981',
    border: 'border-emerald-500/70 dark:border-emerald-400/70',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    pillBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
    text: 'text-emerald-600 dark:text-emerald-400',
    glow: 'shadow-emerald-500/20',
    ring: 'ring-emerald-500/40'
  },
  {
    name: 'amber',
    stroke: '#f59e0b',
    border: 'border-amber-500/70 dark:border-amber-400/70',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    pillBg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    text: 'text-amber-600 dark:text-amber-400',
    glow: 'shadow-amber-500/20',
    ring: 'ring-amber-500/40'
  },
  {
    name: 'cyan',
    stroke: '#06b6d4',
    border: 'border-cyan-500/70 dark:border-cyan-400/70',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    pillBg: 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white',
    text: 'text-cyan-600 dark:text-cyan-400',
    glow: 'shadow-cyan-500/20',
    ring: 'ring-cyan-500/40'
  },
  {
    name: 'rose',
    stroke: '#f43f5e',
    border: 'border-rose-500/70 dark:border-rose-400/70',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    pillBg: 'bg-gradient-to-r from-rose-500 to-pink-600 text-white',
    text: 'text-rose-600 dark:text-rose-400',
    glow: 'shadow-rose-500/20',
    ring: 'ring-rose-500/40'
  }
];

function renderFormattedInline(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|==.*?==|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('==') && part.endsWith('==')) {
      return (
        <mark
          key={idx}
          className="bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-semibold"
        >
          {part.slice(2, -2)}
        </mark>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs text-primary border border-border/60"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function renderFormattedBlock(text?: string) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-xs sm:text-sm text-muted-foreground leading-relaxed" dir="auto">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={i} className="text-sm sm:text-base font-black text-foreground pt-1">
              {renderFormattedInline(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          return (
            <div key={i} className="flex items-start gap-2 ps-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <div className="flex-1">{renderFormattedInline(trimmed.slice(2))}</div>
            </div>
          );
        }
        return <p key={i}>{renderFormattedInline(trimmed)}</p>;
      })}
    </div>
  );
}

type MindMapPopupData =
  | {
      kind: 'stage';
      step: LearningPathRoadmapStep;
      stepIndex: number;
      color: (typeof BRANCH_COLORS)[0];
      linkedCourse?: Course;
      completionPercent: number;
      isDone: boolean;
    }
  | {
      kind: 'root';
    }
  | {
      kind: 'toolkit';
      tools: LearningPathRoadmapResource[];
      resources: LearningPathRoadmapResource[];
    };

export function PathGraphicRoadmap({
  path,
  courses,
  progress = {},
  language = 'en',
  isPreview = false
}: PathGraphicRoadmapProps) {
  const roadmap = path.graphicRoadmap;

  // Detect Arabic content or Arabic UI language
  const hasArabicInRoadmap = /[\u0600-\u06FF]/.test(
    `${path.title || ''} ${roadmap?.title || ''} ${roadmap?.subtitle || ''} ${roadmap?.steps?.[0]?.title || ''}`
  );
  const isAr = language === 'ar' || hasArabicInRoadmap;

  const storageKey = `skilliq_path_roadmap_visible_${path.id}`;
  const checklistStorageKey = `skilliq_path_roadmap_checked_${path.id}`;

  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (isPreview) return true;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) return saved === 'true';
    } catch {
      // ignore storage errors
    }
    return roadmap?.defaultExpanded !== false;
  });

  // Self-checked manual milestones so students can mark stages complete even before finishing all videos
  const [checkedStageIds, setCheckedStageIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(checklistStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  const toggleManualStageDone = (stepId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCheckedStageIds(prev => {
      const next = { ...prev, [stepId]: !prev[stepId] };
      try {
        localStorage.setItem(checklistStorageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Interactive Mind Map Canvas States
  const [viewMode, setViewMode] = useState<'mindmap' | 'stepper'>('mindmap');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [focusedStageIdx, setFocusedStageIdx] = useState<number | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [nodeSearchQuery, setNodeSearchQuery] = useState<string>('');
  const [expandedBranches, setExpandedBranches] = useState<Record<number, boolean>>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Interactive Node Details Popup State
  const [selectedPopup, setSelectedPopup] = useState<MindMapPopupData | null>(null);

  // Drag / Pan Refs
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const didDragMoveRef = useRef<boolean>(false);
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isPreview) {
      try {
        localStorage.setItem(storageKey, String(isVisible));
      } catch {
        // ignore
      }
    }
  }, [isVisible, storageKey, isPreview]);

  // Lock body scroll when Mind Map is in Fullscreen mode & support Escape key
  useEffect(() => {
    if (!isFullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPopup) {
          setSelectedPopup(null);
        } else {
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, selectedPopup]);

  // Build steps from explicit graphicRoadmap.steps OR fallback to path.courseIds
  const steps: LearningPathRoadmapStep[] = useMemo(() => {
    if (roadmap?.steps && roadmap.steps.length > 0) {
      return roadmap.steps;
    }
    return (path.courseIds || [])
      .map((cId, idx) => {
        const found = courses.find(c => c.id === cId);
        if (!found) return null;
        return {
          id: `auto_step_${found.id}_${idx}`,
          title: found.title,
          subtitle: isAr ? `المرحلة ${idx + 1} · ${found.category}` : `Stage ${idx + 1} · ${found.category}`,
          description: found.description,
          durationEstimate: `${found.videos?.length || 0} ${isAr ? 'درس فيديو' : 'Video Lessons'}`,
          imageUrl: found.thumbnail,
          linkedCourseId: found.id,
          skills: [found.category, found.subCategory || ''].filter(Boolean),
          tools: [],
          resources: (found.resources || []).map(r => ({
            title: r.title,
            url: r.url,
            logoUrl: r.logoUrl,
            type: 'doc' as const
          }))
        };
      })
      .filter(Boolean) as LearningPathRoadmapStep[];
  }, [roadmap?.steps, path.courseIds, courses, isAr]);

  // Initialize all branches expanded by default
  useEffect(() => {
    const initial: Record<number, boolean> = {};
    steps.forEach((_, idx) => {
      initial[idx] = true;
    });
    setExpandedBranches(initial);
  }, [steps.length]);

  const toggleAllBranches = (expand: boolean) => {
    const next: Record<number, boolean> = {};
    steps.forEach((_, idx) => {
      next[idx] = expand;
    });
    setExpandedBranches(next);
  };

  const resetViewToCenter = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoomLevel(1);
    setFocusedStageIdx(null);
  }, []);

  // Mouse & Touch Drag-to-Pan Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Don't start drag if clicking a button or input inside toolbar
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-pan="true"]')) return;

    setIsDragging(true);
    didDragMoveRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      didDragMoveRef.current = true;
    }
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Wheel Zoom inside Fullscreen or when holding Ctrl/Meta
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isFullscreen || e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoomLevel(z => Math.min(1.6, Math.max(0.55, +(z + delta).toFixed(2))));
    }
  };

  const essentialTools: LearningPathRoadmapResource[] = roadmap?.essentialTools || [];
  const globalResources: LearningPathRoadmapResource[] = roadmap?.globalResources || [];

  const hasAnyContent =
    (roadmap ? roadmap.enabled !== false : true) &&
    (steps.length > 0 ||
      Boolean(roadmap?.overviewText) ||
      Boolean(roadmap?.diagramImageUrl) ||
      essentialTools.length > 0 ||
      globalResources.length > 0);

  if (!hasAnyContent) {
    return null;
  }

  const getStepCompletion = (
    step?: LearningPathRoadmapStep,
    idx?: number
  ): { percent: number; isDone: boolean; course?: Course; stepKey: string } => {
    const stepKey = step?.id || `stage_${idx || 0}`;
    const manualDone = Boolean(checkedStageIds[stepKey]);
    if (!step?.linkedCourseId) {
      return { percent: manualDone ? 100 : 0, isDone: manualDone, stepKey };
    }
    const linkedCourse = courses.find(c => c.id === step.linkedCourseId);
    if (!linkedCourse || !linkedCourse.videos || linkedCourse.videos.length === 0) {
      return { percent: manualDone ? 100 : 0, isDone: manualDone, course: linkedCourse, stepKey };
    }
    const cProg = progress[linkedCourse.id] || {};
    const completedCount = linkedCourse.videos.filter(v => cProg[v.id]).length;
    const pct = Math.round((completedCount / linkedCourse.videos.length) * 100);
    return {
      percent: manualDone ? 100 : pct,
      isDone: manualDone || pct === 100,
      course: linkedCourse,
      stepKey
    };
  };

  const completedStagesCount = steps.filter((s, idx) => getStepCompletion(s, idx).isDone).length;
  const recommendedNextStageIndex = steps.findIndex((s, idx) => !getStepCompletion(s, idx).isDone);
  const safeActiveIndex = Math.min(activeStepIndex, Math.max(0, steps.length - 1));
  const activeStep: LearningPathRoadmapStep | undefined = steps[safeActiveIndex];

  // Check if a step matches the smart search filter
  const matchesSearch = (step: LearningPathRoadmapStep): boolean => {
    if (!nodeSearchQuery.trim()) return true;
    const q = nodeSearchQuery.toLowerCase();
    const inTitle = (step.title || '').toLowerCase().includes(q);
    const inSub = (step.subtitle || '').toLowerCase().includes(q);
    const inDesc = (step.description || '').toLowerCase().includes(q);
    const inSkills = (step.skills || []).some(s => s.toLowerCase().includes(q));
    const inTools = (step.tools || []).some(t => t.title.toLowerCase().includes(q));
    const inRes = (step.resources || []).some(r => r.title.toLowerCase().includes(q));
    return inTitle || inSub || inDesc || inSkills || inTools || inRes;
  };

  const indexedSteps = steps.map((step, index) => ({
    step,
    index,
    color: BRANCH_COLORS[index % BRANCH_COLORS.length],
    meta: getStepCompletion(step, index),
    isMatch: matchesSearch(step),
    isRecommendedNext: index === recommendedNextStageIndex
  }));

  const visibleIndexedSteps =
    focusedStageIdx !== null
      ? indexedSteps.filter(item => item.index === focusedStageIdx)
      : indexedSteps;

  const leftBranchSteps = visibleIndexedSteps.filter((_, i) => i % 2 === 0);
  const rightBranchSteps = visibleIndexedSteps.filter((_, i) => i % 2 === 1);

  const RootIcon = iconMap[path.icon] || Code;

  const openStagePopup = (index: number) => {
    if (didDragMoveRef.current) return;
    const item = indexedSteps[index];
    if (!item) return;
    setActiveStepIndex(index);
    setSelectedPopup({
      kind: 'stage',
      step: item.step,
      stepIndex: item.index,
      color: item.color,
      linkedCourse: item.meta.course,
      completionPercent: item.meta.percent,
      isDone: item.meta.isDone
    });
  };

  // Renders an animated Mind-Elixir style branch with smooth Bezier SVG curves and collapsible sub-branches
  const renderMindMapBranch = (
    item: (typeof indexedSteps)[0],
    side: 'start' | 'end'
  ) => {
    const { step, index, color, meta, isMatch, isRecommendedNext } = item;
    const skills = (step.skills || []).slice(0, 5);
    const tools = (step.tools || []).slice(0, 3);
    const resources = (step.resources || []).slice(0, 3);
    const hasSubLeaves = skills.length > 0 || tools.length > 0 || resources.length > 0 || Boolean(meta.course);
    const isSubExpanded = expandedBranches[index] !== false;

    return (
      <motion.div
        key={step.id || index}
        layout
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{
          opacity: nodeSearchQuery.trim() && !isMatch ? 0.28 : 1,
          scale: nodeSearchQuery.trim() && isMatch ? 1.03 : 1,
          y: 0
        }}
        transition={{ duration: 0.28, delay: index * 0.04 }}
        className={cn(
          'relative flex items-center gap-1.5 sm:gap-2 group/branch select-none',
          side === 'start' ? 'flex-row-reverse text-end' : 'flex-row text-start'
        )}
      >
        {/* Main Stage Node Pill (Mind-Elixir Node Style with hover elevation & status badge) */}
        <div className="relative flex items-center gap-1.5">
          <div
            onClick={() => openStagePopup(index)}
            className={cn(
              'relative z-10 w-60 sm:w-68 p-4 rounded-2xl bg-card/95 backdrop-blur-md hover:bg-card border-2 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-0.5 text-start shrink-0',
              color.border,
              color.glow,
              isRecommendedNext && 'ring-4 ring-primary/25',
              nodeSearchQuery.trim() && isMatch && 'ring-4 ring-amber-400/60'
            )}
          >
            {/* Recommended Next Pulse Badge */}
            {isRecommendedNext && (
              <div className="absolute -top-2.5 end-3 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{isAr ? 'ابدأ هنا الآن' : 'Next Up'}</span>
              </div>
            )}

            {/* Stage Number, Duration & Manual Check Toggle */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-lg text-[10px] font-black tracking-wide uppercase inline-flex items-center gap-1 shadow-2xs',
                  color.pillBg
                )}
              >
                <span>{isAr ? `المرحلة ${index + 1}` : `Stage ${index + 1}`}</span>
              </span>

              <div className="flex items-center gap-1.5">
                {step.durationEstimate && (
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md border border-border/50">
                    {step.durationEstimate}
                  </span>
                )}

                <button
                  type="button"
                  data-no-pan="true"
                  onClick={e => toggleManualStageDone(meta.stepKey, e)}
                  title={
                    meta.isDone
                      ? isAr
                        ? 'تم الإنجاز (اضغط للإلغاء)'
                        : 'Completed (Click to toggle)'
                      : isAr
                        ? 'تحديد المرحلة كمكتملة'
                        : 'Mark stage as completed'
                  }
                  className={cn(
                    'w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer border',
                    meta.isDone
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-2xs'
                      : 'bg-muted/60 hover:bg-emerald-500/15 text-muted-foreground hover:text-emerald-500 border-border/70'
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stage Title */}
            <div className="text-xs sm:text-sm font-black text-foreground leading-snug line-clamp-2 mb-1.5" dir="auto">
              {step.title}
            </div>

            {/* Progress Bar if Linked Course has progress */}
            {meta.percent > 0 && (
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-emerald-500"
                  style={{ width: `${meta.percent}%` }}
                />
              </div>
            )}

            {/* Quick Sub-counts & Click Prompt */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50 text-[10px] font-bold text-muted-foreground">
              <div className="flex items-center gap-2 truncate">
                {skills.length > 0 && (
                  <span className={color.text}>
                    {skills.length} {isAr ? 'مهارات' : 'Skills'}
                  </span>
                )}
                {(tools.length > 0 || resources.length > 0) && (
                  <span>
                    · {tools.length + resources.length} {isAr ? 'أدوات وروابط' : 'Tools/Links'}
                  </span>
                )}
              </div>
              <span className={cn('inline-flex items-center gap-1 font-black shrink-0', color.text)}>
                <span>{isAr ? 'التفاصيل' : 'Open Node'}</span>
                <Maximize2 className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>

          {/* Expand / Collapse Sub-branch Node Toggle Button (Like Mind-Elixir +/- circle) */}
          {hasSubLeaves && (
            <button
              type="button"
              data-no-pan="true"
              onClick={e => {
                e.stopPropagation();
                setExpandedBranches(prev => ({ ...prev, [index]: !isSubExpanded }));
              }}
              title={isSubExpanded ? (isAr ? 'طي الفروع الفرعية' : 'Collapse sub-branches') : (isAr ? 'فتح الفروع الفرعية' : 'Expand sub-branches')}
              className="w-6 h-6 rounded-full bg-card border-2 flex items-center justify-center text-[11px] font-black shadow-sm hover:scale-110 transition-transform cursor-pointer shrink-0 z-20"
              style={{ borderColor: color.stroke, color: color.stroke }}
            >
              {isSubExpanded ? '−' : '+'}
            </button>
          )}
        </div>

        {/* Animated Leaf Sub-Branches (Skills, Tools, Resources, Linked Playlist) */}
        <AnimatePresence initial={false}>
          {hasSubLeaves && isSubExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: 'auto' }}
              exit={{ opacity: 0, scale: 0.9, width: 0 }}
              transition={{ duration: 0.22 }}
              className={cn(
                'flex items-center overflow-hidden',
                side === 'start' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {/* Colored Horizontal Branch Stem */}
              <div className="w-5 h-0.5 shrink-0" style={{ backgroundColor: color.stroke }} />

              {/* Leaf Sub-Branches Stack (Mind-Elixir style sub-nodes with colored underlines & badges) */}
              <div
                className={cn(
                  'space-y-1.5 py-1.5 border-y-0',
                  side === 'start' ? 'border-e-2 pe-3.5 text-end' : 'border-s-2 ps-3.5 text-start'
                )}
                style={{ borderColor: color.stroke }}
              >
                {/* Linked Course Leaf */}
                {meta.course && (
                  <div
                    onClick={() => openStagePopup(index)}
                    className="group/leaf block w-full text-start cursor-pointer"
                  >
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/25 text-primary text-[11px] font-bold transition-all hover:scale-102 max-w-[220px] shadow-2xs"
                      dir="auto"
                    >
                      <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{meta.course.title}</span>
                    </div>
                  </div>
                )}

                {/* Skills Leaves */}
                {skills.map((skill, sIdx) => (
                  <div
                    key={`skill-${sIdx}`}
                    onClick={() => openStagePopup(index)}
                    className="cursor-pointer group/leaf"
                  >
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-t-md bg-card/70 hover:bg-card text-[11px] font-bold text-foreground/90 hover:text-foreground transition-all border-b-2 shadow-2xs"
                      style={{ borderColor: color.stroke }}
                      dir="auto"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: color.stroke }}
                      />
                      <span className="truncate max-w-[195px]">{skill}</span>
                    </div>
                  </div>
                ))}

                {/* Tools Leaves */}
                {tools.map((tItem, tIdx) => (
                  <div
                    key={`tool-${tIdx}`}
                    onClick={() => openStagePopup(index)}
                    className="cursor-pointer"
                  >
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-black transition-all"
                      dir="auto"
                    >
                      {tItem.logoUrl ? (
                        <img src={tItem.logoUrl} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
                      ) : (
                        <Wrench className="w-3 h-3 shrink-0" />
                      )}
                      <span className="truncate max-w-[185px]">{tItem.title}</span>
                    </div>
                  </div>
                ))}

                {/* Resource Leaves */}
                {resources.slice(0, 2).map((rItem, rIdx) => (
                  <div
                    key={`res-${rIdx}`}
                    onClick={() => openStagePopup(index)}
                    className="cursor-pointer"
                  >
                    <div
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/5 hover:bg-primary/15 text-[10px] font-bold text-primary transition-colors"
                      dir="auto"
                    >
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate max-w-[185px]">{rItem.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Interactive Mind Map Canvas Content (Shared between normal view & Fullscreen modal)
  const renderInteractiveMindMapWorkspace = () => (
    <div
      className={cn(
        'relative bg-slate-50/95 dark:bg-zinc-950/95 border border-border/80 overflow-hidden shadow-inner flex flex-col transition-all',
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none h-[100dvh] w-screen border-0'
          : 'rounded-3xl min-h-[540px] sm:min-h-[640px]'
      )}
    >
      {/* Subtle Dot-Matrix Mind-Elixir Canvas Background that moves with Pan */}
      <div
        className="absolute inset-0 opacity-45 dark:opacity-25 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1.25px, transparent 1.25px)',
          backgroundSize: `${24 * zoomLevel}px ${24 * zoomLevel}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      />

      {/* TOP SMART CONTROL BAR: Search Nodes, Expand/Collapse All, Drag Hint, Fullscreen Toggle */}
      <div
        data-no-pan="true"
        className="relative z-30 px-3.5 sm:px-5 py-3 border-b border-border/70 bg-card/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5"
      >
        {/* Left: Interactive Status + Smart Node Search */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-black">
            <Move className="w-3.5 h-3.5" />
            <span>
              {isAr
                ? 'اسحب بالماوس أو اللمس للتحريك · اضغط على أي عقدة للتفاصيل'
                : 'Drag to Pan · Click any node for full details'}
            </span>
          </div>

          {/* Smart Search Filter inside Mind Map */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3" />
            <input
              type="text"
              dir="auto"
              value={nodeSearchQuery}
              onChange={e => setNodeSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'ابحث داخل الخريطة (مهارة، أداة، مرحلة)...'
                  : 'Filter nodes by skill, tool, or topic...'
              }
              className="w-full ps-8 pe-7 py-1.5 rounded-xl bg-muted/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {nodeSearchQuery && (
              <button
                type="button"
                onClick={() => setNodeSearchQuery('')}
                className="absolute top-1/2 -translate-y-1/2 end-2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Expand/Collapse Branches + Focus Reset + Fullscreen Button */}
        <div className="flex flex-wrap items-center gap-1.5">
          {focusedStageIdx !== null && (
            <button
              type="button"
              onClick={() => setFocusedStageIdx(null)}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-black hover:bg-amber-500/25 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isAr ? 'إلغاء وضع التركيز' : 'Exit Focus Mode'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const allOpen = Object.values(expandedBranches).every(v => v !== false);
              toggleAllBranches(!allOpen);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-muted/70 hover:bg-muted text-foreground border border-border/70 text-[11px] font-bold cursor-pointer flex items-center gap-1"
            title={isAr ? 'فتح أو طي جميع الفروع الفرعية' : 'Expand or Collapse All Sub-branches'}
          >
            <ChevronsUpDown className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">
              {Object.values(expandedBranches).every(v => v !== false)
                ? isAr
                  ? 'طي الفروع'
                  : 'Collapse Leaves'
                : isAr
                  ? 'فتح الفروع'
                  : 'Expand Leaves'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(prev => !prev)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs',
              isFullscreen
                ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600'
                : 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
            )}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'إنهاء ملء الشاشة' : 'Exit Full Screen'}</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'ملء الشاشة' : 'Full Screen'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* DRAGGABLE & ZOOMABLE INTERACTIVE CANVAS VIEWPORT (Works on Desktop, Tablet & Mobile) */}
      <div
        ref={canvasViewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className={cn(
          'relative z-10 flex-1 overflow-auto sm:overflow-hidden flex items-center justify-center p-6 sm:p-10 select-none',
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
      >
        <div
          className="transition-transform duration-75 ease-out origin-center"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoomLevel})`
          }}
        >
          {/* RADIAL TWO-SIDED MIND-ELIXIR TREE (Desktop & Tablet Landscape) */}
          <div className="hidden md:flex items-center justify-center gap-4 lg:gap-8 min-w-max py-6 px-4">
            {/* LEFT / START BRANCHES COLUMN */}
            <div className="flex flex-col items-end justify-center space-y-6">
              {leftBranchSteps.map(item => renderMindMapBranch(item, 'start'))}
            </div>

            {/* CENTER ROOT NODE + CURVED SVG BEZIER CONNECTORS */}
            <div className="relative flex flex-col items-center justify-center shrink-0 px-2">
              {/* Top Global Toolkit Branch Node */}
              {(essentialTools.length > 0 || globalResources.length > 0) && (
                <div className="flex flex-col items-center mb-5">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => {
                      if (!didDragMoveRef.current) {
                        setSelectedPopup({
                          kind: 'toolkit',
                          tools: essentialTools,
                          resources: globalResources
                        });
                      }
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border-2 border-amber-500/70 text-amber-700 dark:text-amber-300 text-xs font-black flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>
                      {isAr
                        ? `الأدوات والمراجع الشاملة (${essentialTools.length + globalResources.length})`
                        : `Essential Toolkit & Docs (${essentialTools.length + globalResources.length})`}
                    </span>
                  </motion.button>
                  <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500 to-indigo-500" />
                </div>
              )}

              <div className="relative flex items-center">
                {/* Left Smooth Bezier Curves Fan */}
                {leftBranchSteps.length > 0 && (
                  <svg
                    className="w-14 lg:w-20 h-64 overflow-visible shrink-0 -me-1 pointer-events-none"
                    viewBox="0 0 80 240"
                    fill="none"
                  >
                    {leftBranchSteps.map((b, i) => {
                      const total = leftBranchSteps.length;
                      const endY = total === 1 ? 120 : 20 + (i * 200) / Math.max(1, total - 1);
                      return (
                        <path
                          key={b.index}
                          d={
                            isAr
                              ? `M 0 120 C 40 120, 40 ${endY}, 80 ${endY}`
                              : `M 80 120 C 40 120, 40 ${endY}, 0 ${endY}`
                          }
                          stroke={b.color.stroke}
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      );
                    })}
                  </svg>
                )}

                {/* Central Mind-Elixir Root Pill */}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    if (!didDragMoveRef.current) {
                      setSelectedPopup({ kind: 'root' });
                    }
                  }}
                  className="relative z-20 px-7 py-5 rounded-3xl bg-slate-900 dark:bg-indigo-950 text-white border-4 border-primary/70 shadow-2xl cursor-pointer max-w-[270px] text-center group/root"
                >
                  <div className="w-13 h-13 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-2.5 p-2">
                    {path.iconUrl ? (
                      <img
                        src={path.iconUrl}
                        alt={path.title}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <RootIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="text-sm lg:text-base font-black tracking-tight leading-snug mb-1.5" dir="auto">
                    {path.title}
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-400/30">
                    <Sparkles className="w-3 h-3" />
                    <span>
                      {isAr
                        ? `${steps.length} مراحل · اضغط للدليل الشامل`
                        : `${steps.length} Stages · Click for Guide`}
                    </span>
                  </span>
                </motion.button>

                {/* Right Smooth Bezier Curves Fan */}
                {rightBranchSteps.length > 0 && (
                  <svg
                    className="w-14 lg:w-20 h-64 overflow-visible shrink-0 -ms-1 pointer-events-none"
                    viewBox="0 0 80 240"
                    fill="none"
                  >
                    {rightBranchSteps.map((b, i) => {
                      const total = rightBranchSteps.length;
                      const endY = total === 1 ? 120 : 20 + (i * 200) / Math.max(1, total - 1);
                      return (
                        <path
                          key={b.index}
                          d={
                            isAr
                              ? `M 80 120 C 40 120, 40 ${endY}, 0 ${endY}`
                              : `M 0 120 C 40 120, 40 ${endY}, 80 ${endY}`
                          }
                          stroke={b.color.stroke}
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>

            {/* RIGHT / END BRANCHES COLUMN */}
            <div className="flex flex-col items-start justify-center space-y-6">
              {rightBranchSteps.map(item => renderMindMapBranch(item, 'end'))}
            </div>
          </div>

          {/* MOBILE & SMALL TABLET INTERACTIVE TREE (Below md) */}
          <div className="md:hidden w-[88vw] max-w-md space-y-4 py-2">
            {/* Mobile Root Node */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => {
                  if (!didDragMoveRef.current) setSelectedPopup({ kind: 'root' });
                }}
                className="w-full p-4 rounded-3xl bg-slate-900 dark:bg-indigo-950 text-white border-2 border-primary/70 shadow-xl flex items-center gap-3.5 text-start cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 p-2">
                  {path.iconUrl ? (
                    <img
                      src={path.iconUrl}
                      alt={path.title}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <RootIcon className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold">
                    {isAr ? 'المركز الرئيسي للمسار (اضغط للشرح)' : 'Root Path Node (Tap for Guide)'}
                  </div>
                  <div className="text-sm font-black truncate" dir="auto">
                    {path.title}
                  </div>
                </div>
                <Maximize2 className="w-4 h-4 text-cyan-300 shrink-0" />
              </div>

              {(essentialTools.length > 0 || globalResources.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    if (!didDragMoveRef.current) {
                      setSelectedPopup({
                        kind: 'toolkit',
                        tools: essentialTools,
                        resources: globalResources
                      });
                    }
                  }}
                  className="mt-3 px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/50 text-amber-700 dark:text-amber-300 text-xs font-black flex items-center gap-2 cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>
                    {isAr
                      ? `الأدوات والمراجع الشاملة (${essentialTools.length + globalResources.length})`
                      : `Global Toolkit & Docs (${essentialTools.length + globalResources.length})`}
                  </span>
                </button>
              )}
            </div>

            {/* Mobile Vertical Branching Nodes */}
            <div className="relative ps-4 border-s-2 border-primary/40 space-y-3.5">
              {visibleIndexedSteps.map(({ step, index, color, meta, isMatch, isRecommendedNext }) => {
                const skills = (step.skills || []).slice(0, 4);
                const toolsCount = (step.tools?.length || 0) + (step.resources?.length || 0);
                return (
                  <div
                    key={step.id || index}
                    className={cn(
                      'relative transition-opacity',
                      nodeSearchQuery.trim() && !isMatch && 'opacity-30'
                    )}
                  >
                    <div
                      className="absolute top-6 -start-4 w-4 h-0.5"
                      style={{ backgroundColor: color.stroke }}
                    />
                    <div
                      onClick={() => openStagePopup(index)}
                      className={cn(
                        'w-full p-4 rounded-2xl bg-card border-2 shadow-sm text-start cursor-pointer space-y-2',
                        color.border,
                        isRecommendedNext && 'ring-2 ring-primary/30'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase',
                            color.pillBg
                          )}
                        >
                          {isAr ? `المرحلة ${index + 1}` : `Stage ${index + 1}`}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {step.durationEstimate && (
                            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                              {step.durationEstimate}
                            </span>
                          )}
                          <button
                            type="button"
                            data-no-pan="true"
                            onClick={e => toggleManualStageDone(meta.stepKey, e)}
                            className={cn(
                              'w-6 h-6 rounded-lg flex items-center justify-center border',
                              meta.isDone
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'bg-muted/60 text-muted-foreground border-border'
                            )}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-sm font-black text-foreground leading-snug" dir="auto">
                        {step.title}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {meta.course && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                            <PlayCircle className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{meta.course.title}</span>
                          </span>
                        )}
                        {skills.map((sk, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded-md bg-muted text-foreground text-[10px] font-semibold border border-border/60"
                          >
                            {sk}
                          </span>
                        ))}
                        {toolsCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                            +{toolsCount} {isAr ? 'أدوات وروابط' : 'tools/links'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FLOATING BOTTOM-END MIND-ELIXIR DOCK (Zoom In, Zoom Out, Return to Center, Fullscreen) */}
        <div
          data-no-pan="true"
          className="absolute bottom-4 end-4 z-30 flex items-center gap-1 p-1.5 rounded-2xl bg-card/95 backdrop-blur-md border border-border/80 shadow-xl"
        >
          <button
            type="button"
            onClick={() => setZoomLevel(z => Math.max(0.55, +(z - 0.12).toFixed(2)))}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={isAr ? 'تصغير (Zoom Out)' : 'Zoom Out'}
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-mono font-black text-foreground px-1.5 min-w-[44px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            type="button"
            onClick={() => setZoomLevel(z => Math.min(1.6, +(z + 0.12).toFixed(2)))}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={isAr ? 'تكبير (Zoom In)' : 'Zoom In'}
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-border mx-0.5" />

          <button
            type="button"
            onClick={resetViewToCenter}
            className="px-2.5 py-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title={isAr ? 'إعادة التوسيط (Return to Center)' : 'Return to Center'}
          >
            <Crosshair className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">{isAr ? 'توسيط' : 'Center'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(prev => !prev)}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={isAr ? 'ملء الشاشة' : 'Full Screen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* BOTTOM QUICK FOCUS & STAGE JUMP BAR */}
      <div
        data-no-pan="true"
        className="relative z-30 px-4 py-2.5 border-t border-border/70 bg-card/95 flex items-center gap-2 overflow-x-auto no-scrollbar"
      >
        <span className="text-[11px] font-black text-muted-foreground shrink-0 flex items-center gap-1">
          <Target className="w-3.5 h-3.5 text-primary" />
          <span>{isAr ? 'الانتقال السريع أو التركيز:' : 'Quick Stage Jump / Focus:'}</span>
        </span>

        <button
          type="button"
          onClick={() => {
            setFocusedStageIdx(null);
            setPan({ x: 0, y: 0 });
          }}
          className={cn(
            'px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer shrink-0 transition-colors',
            focusedStageIdx === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          {isAr ? 'عرض الكل' : 'All Branches'}
        </button>

        {indexedSteps.map(({ step, index, color, meta }) => (
          <div key={step.id || index} className="inline-flex items-center shrink-0">
            <button
              type="button"
              onClick={() => openStagePopup(index)}
              className={cn(
                'px-2.5 py-1 rounded-s-lg text-[11px] font-bold cursor-pointer transition-all border flex items-center gap-1.5',
                color.border,
                color.bg,
                'text-foreground hover:brightness-95'
              )}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color.stroke }}
              />
              <span className="truncate max-w-[135px]" dir="auto">
                {index + 1}. {step.title}
              </span>
              {meta.isDone && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setFocusedStageIdx(prev => (prev === index ? null : index));
                setPan({ x: 0, y: 0 });
              }}
              title={isAr ? 'التركيز على هذا الفرع فقط (Focus Mode)' : 'Focus on this branch only'}
              className={cn(
                'px-1.5 py-1 rounded-e-lg border border-s-0 text-[10px] font-black cursor-pointer transition-colors',
                color.border,
                focusedStageIdx === index
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground'
              )}
            >
              <Crosshair className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section
      dir={isAr ? 'rtl' : 'ltr'}
      className="mb-10 sm:mb-12 rounded-3xl bg-card border border-border/80 shadow-sm overflow-hidden transition-all"
    >
      {/* TOP BAR: Title, Quick Stats, View Switcher & Show/Hide Toggle */}
      <div className="p-4 sm:p-6 md:p-7 bg-gradient-to-br from-primary/10 via-card to-card border-b border-border/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
          {path.iconUrl ? (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-card border border-primary/25 p-2 flex items-center justify-center shrink-0 shadow-xs">
              <img
                src={path.iconUrl}
                alt={path.title}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center shrink-0 shadow-xs">
              <Map className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
          )}

          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-primary/15 text-primary text-[11px] font-black uppercase tracking-wider">
                <GitBranch className="w-3 h-3" />
                <span>
                  {isAr
                    ? 'الخريطة الذهنية التفاعلية للمسار'
                    : 'Interactive Mind-Map & Graphic Roadmap'}
                </span>
              </span>

              {steps.length > 0 && (
                <span className="text-[11px] font-bold text-muted-foreground bg-muted/80 px-2.5 py-0.5 rounded-md border border-border/60">
                  {steps.length} {isAr ? 'مراحل تفاعلية' : 'Interactive Nodes'}
                </span>
              )}

              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                {completedStagesCount}/{steps.length} {isAr ? 'مكتمل' : 'Completed'}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-foreground tracking-tight leading-snug" dir="auto">
              {roadmap?.title ||
                (isAr
                  ? `خريطة الطريق التفاعلية: ${path.title}`
                  : `${path.title} — Interactive Mind Map`)}
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl" dir="auto">
              {roadmap?.subtitle ||
                (isAr
                  ? 'حرك الخريطة بالماوس أو اللمس، كبر أو صغر العرض، واضغط على أي عقدة لعرض نافذة التفاصيل والأدوات والروابط.'
                  : 'Pan with your cursor or touch, zoom in/out, go full screen, and click any node to inspect tools, resources, and playlists.')}
            </p>
          </div>
        </div>

        {/* Right Controls: View Switcher + Distraction-Free Show/Hide Button */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-center">
          {isVisible && (
            <div className="inline-flex items-center p-1 rounded-xl bg-muted/70 border border-border/70">
              <button
                type="button"
                onClick={() => setViewMode('mindmap')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer',
                  viewMode === 'mindmap'
                    ? 'bg-card text-primary shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>{isAr ? 'خريطة ذهنية' : 'Mind Map'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('stepper')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer',
                  viewMode === 'stepper'
                    ? 'bg-card text-primary shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isAr ? 'بطاقات متسلسلة' : 'Step Cards'}</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsVisible(prev => !prev)}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer border shadow-2xs',
              isVisible
                ? 'bg-background hover:bg-muted text-foreground border-border/80'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 border-primary'
            )}
          >
            {isVisible ? (
              <>
                <EyeOff className="w-4 h-4" />
                <span>{isAr ? 'إخفاء الخريطة للتركيز' : 'Hide Roadmap'}</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span>{isAr ? 'إظهار الخريطة التفاعلية' : 'Show Interactive Roadmap'}</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* COLLAPSIBLE BODY */}
      {isVisible && (
        <div className="p-4 sm:p-6 md:p-8 space-y-8">
          {/* 1. INTERACTIVE MIND MAP WORKSPACE */}
          {viewMode === 'mindmap' && steps.length > 0 && renderInteractiveMindMapWorkspace()}

          {/* 2. STEPPER CARDS VIEW (When switched to 'stepper') */}
          {viewMode === 'stepper' && steps.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                {steps.map((step, idx) => {
                  const isSelected = idx === safeActiveIndex;
                  const meta = getStepCompletion(step, idx);
                  return (
                    <button
                      key={step.id || idx}
                      type="button"
                      onClick={() => setActiveStepIndex(idx)}
                      className={cn(
                        'group relative flex items-center gap-3 p-3 rounded-2xl border text-start transition-all cursor-pointer shrink-0 min-w-[210px] sm:min-w-[240px]',
                        isSelected
                          ? 'bg-primary/10 border-primary shadow-sm'
                          : 'bg-card hover:bg-muted/40 border-border/70'
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-black shrink-0',
                          meta.isDone
                            ? 'bg-emerald-500 text-white'
                            : isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {meta.isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase text-primary">
                          {isAr ? `المرحلة ${idx + 1}` : `Stage ${idx + 1}`}
                        </div>
                        <div className="text-xs font-bold text-foreground truncate" dir="auto">
                          {step.title}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {activeStep && (
                <div className="p-5 sm:p-6 rounded-3xl bg-muted/15 border border-border/80 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-black text-primary uppercase">
                        {isAr ? `المرحلة ${safeActiveIndex + 1}` : `Stage ${safeActiveIndex + 1}`}
                      </span>
                      <h4 className="text-lg sm:text-xl font-black text-foreground" dir="auto">
                        {activeStep.title}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => openStagePopup(safeActiveIndex)}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer flex items-center gap-1.5"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'فتح نافذة التفاصيل الكاملة' : 'Open Full Stage Popup'}</span>
                    </button>
                  </div>
                  {activeStep.description && renderFormattedBlock(activeStep.description)}
                </div>
              )}
            </div>
          )}

          {/* 3. OPTIONAL INFOGRAPHIC / ARCHITECTURE DIAGRAM BANNER */}
          {roadmap?.diagramImageUrl && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span>
                    {isAr ? 'المخطط البصري الشامل للمسار' : 'Visual Architecture & Path Infographic'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxImage(roadmap.diagramImageUrl || null)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تكبير الصورة' : 'Full Screen'}</span>
                </button>
              </div>
              <div
                onClick={() => setLightboxImage(roadmap.diagramImageUrl || null)}
                className="relative rounded-2xl overflow-hidden border border-border/80 bg-muted/30 max-h-[380px] flex items-center justify-center cursor-zoom-in"
              >
                <img
                  src={roadmap.diagramImageUrl}
                  alt={roadmap.title || path.title}
                  className="w-full h-auto max-h-[380px] object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* INTERACTIVE NODE DETAILS POPUP MODAL (Opens when user clicks any Mind Map Node) */}
      <AnimatePresence>
        {selectedPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
            onClick={() => setSelectedPopup(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.2 }}
              dir={isAr ? 'rtl' : 'ltr'}
              onClick={e => e.stopPropagation()}
              className="bg-card w-full sm:max-w-3xl max-h-[92dvh] rounded-t-3xl sm:rounded-3xl border border-border/80 shadow-2xl flex flex-col overflow-hidden text-start my-auto"
            >
              {/* STAGE NODE POPUP */}
              {selectedPopup.kind === 'stage' && (() => {
                const { step, stepIndex, color, linkedCourse } = selectedPopup;
                const liveMeta = getStepCompletion(step, stepIndex);
                return (
                  <>
                    {/* Modal Header */}
                    <div className="p-4 sm:p-6 border-b border-border/80 bg-muted/30 flex items-start justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider',
                              color.pillBg
                            )}
                          >
                            {isAr
                              ? `المرحلة ${stepIndex + 1} من ${steps.length}`
                              : `Stage ${stepIndex + 1} of ${steps.length}`}
                          </span>

                          {step.durationEstimate && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-card border border-border text-xs font-bold text-muted-foreground">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <span>{step.durationEstimate}</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleManualStageDone(liveMeta.stepKey)}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all border',
                              liveMeta.isDone
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'bg-card hover:bg-emerald-500/10 text-foreground border-border'
                            )}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {liveMeta.isDone
                                ? isAr
                                  ? 'مكتملة ✓'
                                  : 'Completed ✓'
                                : isAr
                                  ? 'تحديد كمكتملة'
                                  : 'Mark Completed'}
                            </span>
                          </button>
                        </div>

                        <h3 className="text-lg sm:text-2xl font-black text-foreground leading-snug" dir="auto">
                          {step.title}
                        </h3>

                        {step.subtitle && (
                          <p className="text-xs sm:text-sm text-muted-foreground font-semibold" dir="auto">
                            {step.subtitle}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedPopup(null)}
                        className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
                      {step.description && (
                        <div className="p-4 rounded-2xl bg-muted/25 border border-border/70 space-y-2">
                          <div className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Compass className="w-4 h-4 text-primary" />
                            <span>
                              {isAr ? 'شرح المرحلة وخطة الدراسة' : 'Stage Learning Guide & What to Master'}
                            </span>
                          </div>
                          {renderFormattedBlock(step.description)}
                        </div>
                      )}

                      {step.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border border-border/80 bg-muted/20">
                          <img
                            src={step.imageUrl}
                            alt={step.title}
                            className="w-full max-h-64 object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {step.skills && step.skills.length > 0 && (
                        <div className="space-y-2.5">
                          <div className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-primary" />
                            <span>
                              {isAr ? 'المهارات والمفاهيم الأساسية في هذه المرحلة' : 'Core Skills & Concepts Covered'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {step.skills.map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className={cn(
                                  'px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5',
                                  color.border,
                                  color.bg,
                                  'text-foreground'
                                )}
                                dir="auto"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span>{skill}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {((step.tools && step.tools.length > 0) ||
                        (step.resources && step.resources.length > 0)) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {step.tools && step.tools.length > 0 && (
                            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
                              <div className="text-xs font-black text-foreground flex items-center gap-1.5">
                                <Wrench className="w-4 h-4 text-amber-500" />
                                <span>
                                  {isAr ? 'الأدوات والبرامج المطلوبة' : 'Required Tools for This Stage'}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {step.tools.map((tItem, tIdx) => (
                                  <a
                                    key={tIdx}
                                    href={tItem.url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/30 hover:bg-primary/10 border border-border/60 hover:border-primary/40 transition-all text-xs font-bold text-foreground"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      {tItem.logoUrl ? (
                                        <img
                                          src={tItem.logoUrl}
                                          alt={tItem.title}
                                          className="w-4 h-4 object-contain shrink-0"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <Wrench className="w-3.5 h-3.5 text-primary shrink-0" />
                                      )}
                                      <span className="truncate" dir="auto">
                                        {tItem.title}
                                      </span>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {step.resources && step.resources.length > 0 && (
                            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
                              <div className="text-xs font-black text-foreground flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4 text-primary" />
                                <span>
                                  {isAr ? 'روابط ومصادر التعلم' : 'Study Links & Documentation'}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {step.resources.map((rItem, rIdx) => (
                                  <a
                                    key={rIdx}
                                    href={rItem.url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/30 hover:bg-primary/10 border border-border/60 hover:border-primary/40 transition-all text-xs font-bold text-foreground"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      {rItem.logoUrl ? (
                                        <img
                                          src={rItem.logoUrl}
                                          alt={rItem.title}
                                          className="w-4 h-4 object-contain shrink-0"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
                                      )}
                                      <span className="truncate" dir="auto">
                                        {rItem.title}
                                      </span>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {linkedCourse && (
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5 min-w-0">
                            {linkedCourse.thumbnail && (
                              <img
                                src={linkedCourse.thumbnail}
                                alt={linkedCourse.title}
                                className="w-20 h-13 rounded-xl object-cover shrink-0 border border-border/60"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div className="min-w-0">
                              <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
                                {isAr ? 'قائمة التشغيل المرتبطة بهذه المرحلة' : 'Linked Course Playlist'}
                              </span>
                              <div className="text-sm font-black text-foreground truncate" dir="auto">
                                {linkedCourse.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {linkedCourse.videos?.length || 0} {isAr ? 'درس فيديو' : 'video lessons'} ·{' '}
                                {liveMeta.percent}% {isAr ? 'مكتمل' : 'completed'}
                              </div>
                            </div>
                          </div>

                          {!isPreview && (
                            <Link
                              to={`/course/${linkedCourse.id}`}
                              onClick={() => {
                                setSelectedPopup(null);
                                setIsFullscreen(false);
                              }}
                              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shadow-xs shrink-0"
                            >
                              <PlayCircle className="w-4 h-4" />
                              <span>
                                {liveMeta.percent > 0
                                  ? isAr
                                    ? 'متابعة الدورة'
                                    : 'Continue Playlist'
                                  : isAr
                                    ? 'ابدأ مشاهدة الدورة'
                                    : 'Start Playlist'}
                              </span>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Modal Footer: Prev / Next Stage Navigation */}
                    <div className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        disabled={stepIndex === 0}
                        onClick={() => openStagePopup(stepIndex - 1)}
                        className="px-3.5 py-2 rounded-xl bg-card border border-border/80 hover:bg-muted disabled:opacity-40 text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                        <span>{isAr ? 'المرحلة السابقة' : 'Previous Node'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPopup(null)}
                        className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold text-foreground cursor-pointer"
                      >
                        {isAr ? 'إغلاق' : 'Close'}
                      </button>

                      <button
                        type="button"
                        disabled={stepIndex >= steps.length - 1}
                        onClick={() => openStagePopup(stepIndex + 1)}
                        className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{isAr ? 'المرحلة التالية' : 'Next Node'}</span>
                        <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                      </button>
                    </div>
                  </>
                );
              })()}

              {/* ROOT NODE OVERVIEW POPUP */}
              {selectedPopup.kind === 'root' && (
                <>
                  <div className="p-5 sm:p-6 border-b border-border/80 bg-slate-900 text-white flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 p-2">
                        {path.iconUrl ? (
                          <img src={path.iconUrl} alt={path.title} className="w-full h-full object-contain" />
                        ) : (
                          <RootIcon className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold block">
                          {isAr ? 'نظرة شاملة على المسار التعليمي' : 'Learning Path Overview & Study Guide'}
                        </span>
                        <h3 className="text-lg sm:text-xl font-black truncate" dir="auto">
                          {path.title}
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPopup(null)}
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
                    <p className="text-xs sm:text-sm text-foreground leading-relaxed" dir="auto">
                      {path.description}
                    </p>

                    {roadmap?.overviewText && (
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-2">
                        <div className="text-xs font-black text-primary uppercase">
                          {isAr ? 'دليل البدء السريع بدون تشتيت' : 'How to Study This Path Without Distraction'}
                        </div>
                        {renderFormattedBlock(roadmap.overviewText)}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-xs font-black text-foreground uppercase">
                        {isAr ? `جميع مراحل المسار (${steps.length})` : `All Roadmap Stages (${steps.length})`}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {indexedSteps.map(({ step, index, color, meta }) => (
                          <button
                            key={step.id || index}
                            type="button"
                            onClick={() => openStagePopup(index)}
                            className={cn(
                              'p-3 rounded-xl border text-start transition-all cursor-pointer flex items-center justify-between gap-2 hover:bg-muted/40',
                              color.border
                            )}
                          >
                            <div className="min-w-0">
                              <div className={cn('text-[10px] font-black uppercase flex items-center gap-1', color.text)}>
                                <span>{isAr ? `المرحلة ${index + 1}` : `Stage ${index + 1}`}</span>
                                {meta.isDone && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                              </div>
                              <div className="text-xs font-bold text-foreground truncate" dir="auto">
                                {step.title}
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground rtl:rotate-180 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* GLOBAL TOOLKIT & RESOURCES POPUP */}
              {selectedPopup.kind === 'toolkit' && (
                <>
                  <div className="p-5 sm:p-6 border-b border-border/80 bg-muted/30 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-foreground">
                          {isAr
                            ? 'الأدوات الأساسية والمراجع الشاملة للمسار'
                            : 'Essential Path Toolkit & Global Reference Links'}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {isAr
                            ? 'جميع البرامج والمصادر الرسمية التي تحتاجها طوال رحلتك في هذا المسار'
                            : 'All software, compilers, and official docs required across this learning path'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPopup(null)}
                      className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-amber-500" />
                        <span>{isAr ? 'البرامج والأدوات' : 'Essential Software & Tools'}</span>
                      </h4>
                      {selectedPopup.tools.map((tItem, idx) => (
                        <a
                          key={idx}
                          href={tItem.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 p-3 rounded-xl bg-muted/25 hover:bg-primary/10 border border-border/70 text-xs font-bold text-foreground transition-all"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {tItem.logoUrl ? (
                              <img src={tItem.logoUrl} alt="" className="w-4 h-4 object-contain shrink-0" />
                            ) : (
                              <Wrench className="w-3.5 h-3.5 text-primary shrink-0" />
                            )}
                            <span className="truncate" dir="auto">
                              {tItem.title}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        </a>
                      ))}
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                        <span>{isAr ? 'المراجع والتوثيقات الرسمية' : 'Official Documentation & Guides'}</span>
                      </h4>
                      {selectedPopup.resources.map((rItem, idx) => (
                        <a
                          key={idx}
                          href={rItem.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 p-3 rounded-xl bg-muted/25 hover:bg-primary/10 border border-border/70 text-xs font-bold text-foreground transition-all"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {rItem.logoUrl ? (
                              <img src={rItem.logoUrl} alt="" className="w-4 h-4 object-contain shrink-0" />
                            ) : (
                              <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
                            )}
                            <span className="truncate" dir="auto">
                              {rItem.title}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN IMAGE LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-6xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-11 end-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Roadmap visual diagram"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/15 shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </section>
  );
}
