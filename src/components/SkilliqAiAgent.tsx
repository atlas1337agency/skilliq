import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc } from 'firebase/firestore';
import {
  Sparkles,
  Bot,
  Send,
  X,
  Maximize2,
  Minimize2,
  BookOpen,
  Rocket,
  Layers,
  LifeBuoy,
  CheckCircle2,
  ArrowRight,
  Compass,
  Video,
  Check,
  Loader2,
  Trash2,
  PenTool,
  CornerDownLeft,
  ChevronRight,
  PlayCircle
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { db } from '../firebase';
import { createSupportTicket, TicketCategory, TicketPriority } from '../lib/tickets';
import { cn, filterByLanguage } from '../lib/utils';
import { isProjectCourse, isMasterclassCourse } from '../lib/courseUtils';

interface AgentRecommendation {
  type: 'course' | 'project' | 'masterclass' | 'path' | 'book';
  id: string;
  title: string;
  subtitle?: string;
  url: string;
}

interface AgentRoadmap {
  title: string;
  steps: {
    step: number;
    title: string;
    duration: string;
  }[];
}

interface AgentSuggestedAction {
  type: 'create_ticket' | 'save_note';
  // Ticket fields
  subject?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  message?: string;
  // Note fields
  courseId?: string;
  courseTitle?: string;
  videoId?: string;
  videoTitle?: string;
  noteText?: string;
  tag?: 'important' | 'code' | 'idea' | 'question';
}

interface LearnedUserMemory {
  preferredField?: string;
  preferredTools: string[];
  requestedMissingTopics: string[];
  interactionCount: number;
  updatedAt: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  recommendations?: AgentRecommendation[];
  roadmap?: AgentRoadmap | null;
  followUpSuggestions?: string[];
  suggestedAction?: AgentSuggestedAction | null;
  actionCompleted?: boolean;
}

/**
 * Custom Animated Neural AI Orb Icon for SkilliQ AI Agent
 */
function NeuralOrbIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-emerald-400 opacity-90 blur-[1px]"
      />
      <span className="relative z-10 flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 text-white shadow-inner">
        <Sparkles className="w-3/5 h-3/5 text-white drop-shadow-xs" />
      </span>
    </div>
  );
}

export function SkilliqAiAgent() {
  const { user, userName, courses, books, learningPaths, categories, progress, language } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const isRtl = language === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSlowSearch, setIsSlowSearch] = useState(false);

  // Self-Learning Student Memory State (persists across sessions & syncs to Firestore)
  const [learnedMemory, setLearnedMemory] = useState<LearnedUserMemory>({
    preferredTools: [],
    requestedMissingTopics: [],
    interactionCount: 0,
    updatedAt: Date.now()
  });

  // Action Execution Feedback States
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Record<string, string>>({});

  // Custom Quick Ticket Modal inside Agent
  const [quickTicketDraft, setQuickTicketDraft] = useState<{
    msgId: string;
    subject: string;
    category: TicketCategory;
    priority: TicketPriority;
    message: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Detect active course if student is currently watching a course (/course/:courseId)
  const activeCourseContext = useMemo(() => {
    const match = location.pathname.match(/^\/course\/([^/]+)/);
    if (!match || !match[1]) return null;
    const courseId = match[1];
    const found = courses.find(c => c.id === courseId);
    if (!found) return null;
    const cProg = progress[courseId];
    const currentVid =
      found.videos?.find(v => v.id === cProg?.currentVideoId) || found.videos?.[0] || null;
    return {
      id: found.id,
      title: found.title,
      instructor: found.instructor,
      category: found.category,
      subCategory: found.subCategory,
      isProject: isProjectCourse(found),
      isSingleVideo: isMasterclassCourse(found),
      currentVideoId: currentVid?.id || 'v1',
      currentVideoTitle: currentVid?.title || found.title,
      videos: (found.videos || []).slice(0, 10).map(v => ({
        id: v.id,
        title: v.title,
        duration: v.duration
      }))
    };
  }, [location.pathname, courses, progress]);

  // Build Live Page-Linked Index directly from useStore() so whenever Admin adds/edits any Course, Masterclass, Project, Book, or Path, the AI Agent sees it immediately!
  const livePageIndexStats = useMemo(() => {
    const coursePlaylists = courses.filter(c => !isProjectCourse(c) && !isMasterclassCourse(c));
    const masterclasses = courses.filter(c => !isProjectCourse(c) && isMasterclassCourse(c));
    const projects = courses.filter(c => isProjectCourse(c));
    const allCats = Array.from(
      new Set([
        ...courses.map(c => c.category).filter(Boolean),
        ...books.map(b => b.category).filter(Boolean)
      ])
    );
    return {
      coursesCount: coursePlaylists.length,
      masterclassesCount: masterclasses.length,
      projectsCount: projects.length,
      booksCount: books.length,
      pathsCount: learningPaths.length,
      categories: allCats
    };
  }, [courses, books, learningPaths]);

  // Storage keys per logged-in user
  const chatStorageKey = useMemo(() => {
    return user?.uid ? `skilliq_ai_agent_chat_v3_${user.uid}_${language}` : '';
  }, [user?.uid, language]);

  const memoryStorageKey = useMemo(() => {
    return user?.uid ? `skilliq_ai_agent_memory_${user.uid}` : '';
  }, [user?.uid]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Load saved conversation, learned memory & check first-login welcome animation
  useEffect(() => {
    if (!user?.uid) {
      setIsOpen(false);
      setShowWelcomePopup(false);
      return;
    }

    const displayName = user.displayName || userName || (isRtl ? 'صديقي المتعلم' : 'Explorer');

    // Load self-learned user preferences
    try {
      const savedMem = localStorage.getItem(`skilliq_ai_agent_memory_${user.uid}`);
      if (savedMem) {
        const parsedMem = JSON.parse(savedMem);
        if (parsedMem && typeof parsedMem === 'object') {
          setLearnedMemory(parsedMem);
        }
      }
    } catch {}

    // Load previous messages from localStorage or initialize with live page-linked welcome message
    try {
      const savedRaw = localStorage.getItem(`skilliq_ai_agent_chat_v3_${user.uid}_${language}`);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } else {
        const initialMsg: ChatMessage = {
          id: `welcome_init_${language}`,
          role: 'assistant',
          content: isRtl
            ? `مرحباً بك يا **${displayName}**! 👋✨ أنا **مساعد SkilliQ الذكي** المرتبط مباشرة بجميع صفحات المنصة (أتحدث العربية والدارجة المغربية والإنجليزية):\n\n• **صفحة الدورات (\`/courses\`)**: ${livePageIndexStats.coursesCount} قوائم تشغيل (Playlists)\n• **صفحة الماستركلاس (\`/masterclasses\`)**: ${livePageIndexStats.masterclassesCount} فيديو واحد مطول\n• **صفحة المشاريع (\`/projects\`)**: ${livePageIndexStats.projectsCount} مشاريع (Playlists & Masterclasses)\n• **صفحة الكتب (\`/books\`)**: ${livePageIndexStats.booksCount} كتب مشروحة بالفيديو\n• **صفحة المسارات (\`/paths\`)**: ${livePageIndexStats.pathsCount} خرائط طريق\n\nاكتب أي **كلمة مفتاحية، اسم قسم، أو عنوان** وسأقارنه مع جميع الصفحات وأرشح لك المطابق فوراً!`
            : `Hi **${displayName}**! 👋✨ I am your **SkilliQ Copilot** live-linked to every page on the platform:\n\n• **Courses Page (\`/courses\`)**: ${livePageIndexStats.coursesCount} Course Playlists\n• **Masterclasses Page (\`/masterclasses\`)**: ${livePageIndexStats.masterclassesCount} Single Long Videos\n• **Projects Page (\`/projects\`)**: ${livePageIndexStats.projectsCount} Projects (Playlists & Masterclasses)\n• **Books Page (\`/books\`)**: ${livePageIndexStats.booksCount} Video Books\n• **Paths Page (\`/paths\`)**: ${livePageIndexStats.pathsCount} Career Roadmaps\n\nType any **keyword, category, title, or page question** and I will scan the live pages for you!`,
          timestamp: Date.now(),
          followUpSuggestions: isRtl
            ? [
                'ماذا يوجد في صفحة الدورات؟',
                'ماذا يوجد في صفحة الماستركلاس؟',
                'ماذا يوجد في صفحة المشاريع؟',
                'ماذا يوجد في صفحة الكتب؟',
                'ماذا يوجد في صفحة المسارات؟',
                'اشرح لي هذه الصفحة'
              ]
            : [
                'What is inside Courses page?',
                'What is inside Masterclasses page?',
                'What is inside Projects page?',
                'What is inside Books page?',
                'What is inside Paths page?',
                'Explain this current page'
              ]
        };
        setMessages([initialMsg]);
      }
    } catch {}

    // Check first-time login greeting animation for this user
    const greetingKey = `skilliq_ai_welcomed_${user.uid}`;
    const hasSeenWelcome = localStorage.getItem(greetingKey);
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setShowWelcomePopup(true);
        localStorage.setItem(greetingKey, 'true');
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [
    user?.uid,
    user?.displayName,
    userName,
    isRtl,
    language,
    livePageIndexStats.coursesCount,
    livePageIndexStats.masterclassesCount,
    livePageIndexStats.projectsCount,
    livePageIndexStats.booksCount,
    livePageIndexStats.pathsCount
  ]);

  // Persist messages per user & language
  useEffect(() => {
    if (!user?.uid || !chatStorageKey || messages.length === 0) return;
    try {
      localStorage.setItem(chatStorageKey, JSON.stringify(messages.slice(-30)));
    } catch {}
  }, [messages, chatStorageKey, user?.uid]);

  // Show reassuring "Please wait, do not close conversation" message if search takes > 900ms
  useEffect(() => {
    if (!isLoading) {
      setIsSlowSearch(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsSlowSearch(true);
    }, 900);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  }, [messages, isOpen, isLoading, isSlowSearch]);

  const quickActions = useMemo(() => {
    if (activeCourseContext) {
      return [
        {
          label: isRtl ? 'لخّص الدورة واحفظ ملاحظة' : 'Summarize & Save Note',
          prompt: isRtl
            ? `أعطني ملخصاً شاملاً لدورة "${activeCourseContext.title}" واحفظه في ملاحظاتي الذكية`
            : `Give me a complete summary of "${activeCourseContext.title}" and save it to my Smart Notes`,
          icon: PenTool
        },
        {
          label: isRtl ? 'اشرح هذه الصفحة' : 'Explain This Page',
          prompt: isRtl ? 'اشرح لي هذه الصفحة' : 'Explain this current page',
          icon: Sparkles
        },
        {
          label: isRtl ? 'صفحة المشاريع (/projects)' : 'Projects Page (/projects)',
          prompt: isRtl ? 'ماذا يوجد في صفحة المشاريع؟' : 'What is inside Projects page?',
          icon: Rocket
        },
        {
          label: isRtl ? 'تذكرة للإدارة' : 'Open Ticket to Admin',
          prompt: isRtl ? 'فتح تذكرة للإدارة' : 'Open Ticket to Admin',
          icon: LifeBuoy
        }
      ];
    }

    return [
      {
        label: isRtl ? 'الدورات (Playlists)' : 'Courses (Playlists)',
        prompt: isRtl ? 'ماذا يوجد في صفحة الدورات؟' : 'What is inside Courses page?',
        icon: PlayCircle
      },
      {
        label: isRtl ? 'الماستركلاس (Single Video)' : 'Masterclasses',
        prompt: isRtl ? 'ماذا يوجد في صفحة الماستركلاس؟' : 'What is inside Masterclasses page?',
        icon: Video
      },
      {
        label: isRtl ? 'المشاريع (Projects)' : 'Projects Page',
        prompt: isRtl ? 'ماذا يوجد في صفحة المشاريع؟' : 'What is inside Projects page?',
        icon: Rocket
      },
      {
        label: isRtl ? 'الكتب (Books)' : 'Books Page',
        prompt: isRtl ? 'ماذا يوجد في صفحة الكتب؟' : 'What is inside Books page?',
        icon: BookOpen
      },
      {
        label: isRtl ? 'المسارات (Paths)' : 'Paths Page',
        prompt: isRtl ? 'ماذا يوجد في صفحة المسارات؟' : 'What is inside Paths page?',
        icon: Compass
      },
      {
        label: isRtl ? 'تذكرة للإدارة' : 'Ticket to Admin',
        prompt: isRtl ? 'فتح تذكرة للإدارة' : 'Open Ticket to Admin',
        icon: LifeBuoy
      }
    ];
  }, [activeCourseContext, isRtl]);

  // Exclusive to logged-in users ONLY
  if (!user) {
    return null;
  }

  const displayName = user.displayName || userName || (isRtl ? 'المتعلم' : 'Student');

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt !== undefined ? customPrompt : input).trim();
    if (!textToSend || isLoading) return;

    if (customPrompt === undefined) {
      setInput('');
    }
    setShowWelcomePopup(false);

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const isMsgArabicOrDarija =
        isRtl ||
        /[\u0600-\u06FF]/.test(textToSend) ||
        /\b(salam|slm|wach|kifach|bghit|chno|achno|3afak|afak|khoya|khti|mzyan|dyal|dial|darija)\b/i.test(
          textToSend
        );
      const targetCatalogLang = isMsgArabicOrDarija ? 'ar' : language;
      const langCourses = filterByLanguage(courses, targetCatalogLang);

      // Combine language-matched courses first + all remaining courses so the agent sees 100% of the live platform catalog!
      const combinedCourses = [
        ...langCourses,
        ...courses.filter(c => !langCourses.some(lc => lc.id === c.id))
      ];

      const serializeCourseItem = (c: any) => ({
        id: c.id,
        title: c.title,
        description: (c.description || '').slice(0, 150),
        instructor: c.instructor,
        category: c.category,
        subCategory: c.subCategory,
        language: c.language,
        isProject: isProjectCourse(c),
        isSingleVideo: isMasterclassCourse(c),
        videosCount: Array.isArray(c.videos) ? c.videos.length : 1
      });

      // Build explicit 5-Page Index payload so the server compares keywords directly against every page's live categories & titles
      const pageIndex = {
        coursesPage: {
          route: '/courses',
          items: combinedCourses
            .filter(c => !isProjectCourse(c) && !isMasterclassCourse(c))
            .map(serializeCourseItem)
        },
        masterclassesPage: {
          route: '/masterclasses',
          items: combinedCourses
            .filter(c => !isProjectCourse(c) && isMasterclassCourse(c))
            .map(serializeCourseItem)
        },
        projectsPage: {
          route: '/projects',
          items: combinedCourses.filter(c => isProjectCourse(c)).map(serializeCourseItem)
        },
        booksPage: {
          route: '/books',
          items: (books || []).map(b => ({
            id: b.id,
            title: b.title,
            titleAr: (b as any).titleAr,
            category: b.category,
            author: b.author,
            authorAr: (b as any).authorAr,
            description: (b.description || '').slice(0, 140)
          }))
        },
        pathsPage: {
          route: '/paths',
          items: (learningPaths || []).map(p => ({
            id: p.id,
            title: p.title,
            titleAr: (p as any).titleAr,
            description: (p.description || '').slice(0, 140),
            courseIds: p.courseIds || [],
            courseTitles: (p.courseIds || [])
              .map(cid => courses.find(c => c.id === cid)?.title)
              .filter(Boolean)
          }))
        }
      };

      const catalogSummary = {
        categories: (categories || []).map(cat => cat.name),
        courses: combinedCourses.map(serializeCourseItem),
        paths: pageIndex.pathsPage.items,
        books: pageIndex.booksPage.items
      };

      const res = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: displayName,
          language: isMsgArabicOrDarija ? 'ar' : language,
          message: textToSend,
          currentPath: location.pathname,
          history: nextMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          currentCourse: activeCourseContext,
          pageIndex,
          catalogSummary,
          clientMemory: learnedMemory
        })
      });

      const data = await res.json();

      // Save updated self-learned user memory locally & to Firestore
      if (data.learnedMemory) {
        setLearnedMemory(data.learnedMemory);
        if (memoryStorageKey) {
          try {
            localStorage.setItem(memoryStorageKey, JSON.stringify(data.learnedMemory));
          } catch {}
        }
        if (user.uid !== '1') {
          setDoc(
            doc(db, 'users', user.uid, 'aiAgentMemory', 'profile'),
            {
              ...data.learnedMemory,
              userId: user.uid,
              userName: displayName,
              updatedAt: Date.now()
            },
            { merge: true }
          ).catch(() => {});
        }
      }

      const assistantMsgId = `a_${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content:
          data.reply ||
          (isRtl
            ? 'إليك النتائج المطابقة من صفحات منصة SkilliQ:'
            : 'Here are the matching results across SkilliQ pages:'),
        timestamp: Date.now(),
        recommendations: data.recommendations || [],
        roadmap: data.roadmap || null,
        followUpSuggestions: data.followUpSuggestions || [],
        suggestedAction: data.suggestedAction || null
      };

      setMessages(prev => [...prev, assistantMsg]);

      // If suggested action is create_ticket, pre-populate quick ticket form immediately
      if (data.suggestedAction?.type === 'create_ticket') {
        setQuickTicketDraft({
          msgId: assistantMsgId,
          subject: data.suggestedAction.subject || (isRtl ? 'طلب إضافة دورة / دعم فني' : 'Course Request / Support'),
          category: data.suggestedAction.category || 'course_request',
          priority: data.suggestedAction.priority || 'normal',
          message: data.suggestedAction.message || textToSend
        });
      }
    } catch (err) {
      console.error('AI Agent error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: isRtl
            ? 'عذراً، حدث خطأ مؤقت في الاتصال. يرجى المحاولة مرة أخرى.'
            : 'Sorry, a temporary connection error occurred. Please try again.',
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Automate saving a Smart Note directly to user's course notes (localStorage + Firestore)
  const handleExecuteSaveNote = async (msgId: string, action: AgentSuggestedAction) => {
    if (!user?.uid) return;
    const targetCourseId = action.courseId || activeCourseContext?.id || courses[0]?.id || 'default';
    const targetCourseTitle =
      action.courseTitle || activeCourseContext?.title || courses[0]?.title || 'SkilliQ Course';
    const targetVideoId = action.videoId || activeCourseContext?.currentVideoId || 'v1';
    const targetVideoTitle =
      action.videoTitle || activeCourseContext?.currentVideoTitle || targetCourseTitle;
    const noteContent = action.noteText || '';

    if (!noteContent.trim()) return;

    setExecutingActionId(msgId);
    try {
      const noteId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newNoteObj = {
        id: noteId,
        courseId: targetCourseId,
        courseTitle: targetCourseTitle,
        videoId: targetVideoId,
        videoTitle: targetVideoTitle,
        timestamp: 0,
        tag: action.tag || 'important',
        text: noteContent.trim(),
        createdAt: new Date().toISOString()
      };

      // 1. Save to localStorage key used by Course.tsx
      const localKey = `skilliq_smart_notes_${user.uid}_${targetCourseId}`;
      let existing: any[] = [];
      try {
        const raw = localStorage.getItem(localKey);
        if (raw) existing = JSON.parse(raw);
      } catch {}
      localStorage.setItem(localKey, JSON.stringify([newNoteObj, ...existing]));

      // 2. Save to Firestore
      if (user.uid !== '1') {
        await setDoc(doc(db, 'users', user.uid, 'notes', noteId), newNoteObj).catch(() => {});
      }

      setCompletedActions(prev => ({
        ...prev,
        [msgId]: isRtl
          ? `✅ تم حفظ الملخص والملاحظة بنجاح في دورة "${targetCourseTitle}"!`
          : `✅ Saved directly to your Smart Notes in "${targetCourseTitle}"!`
      }));
    } catch (e) {
      console.error('Failed to save note via AI Agent:', e);
    } finally {
      setExecutingActionId(null);
    }
  };

  // Automate creating a Support Ticket to Admin
  const handleExecuteCreateTicket = async (msgId: string) => {
    if (!user?.uid || !quickTicketDraft) return;
    setExecutingActionId(msgId);
    try {
      const ticket = await createSupportTicket({
        userId: user.uid,
        userName: displayName,
        userEmail: user.email || '',
        userAvatar: user.photoURL || '',
        subject: quickTicketDraft.subject,
        category: quickTicketDraft.category,
        priority: quickTicketDraft.priority,
        text: quickTicketDraft.message
      });

      setCompletedActions(prev => ({
        ...prev,
        [msgId]: isRtl
          ? `✅ تم فتح التذكرة رقم #${ticket.ticketNumber} وإرسال طلبك للإدارة بنجاح!`
          : `✅ Ticket #${ticket.ticketNumber} created & sent directly to Admin!`
      }));
      setQuickTicketDraft(null);
    } catch (e) {
      console.error('Failed to create support ticket via AI Agent:', e);
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleClearChat = () => {
    const resetMsg: ChatMessage = {
      id: `reset_${Date.now()}`,
      role: 'assistant',
      content: isRtl
        ? `تم مسح المحادثة بنجاح يا **${displayName}**! أنا متصل بصفحات **الدورات، الماستركلاس، المشاريع، الكتب، والمسارات** — اكتب أي كلمة مفتاحية أو اختر صفحة بالأسفل:`
        : `Chat cleared, **${displayName}**! I am live-linked to the **Courses, Masterclasses, Projects, Books, and Paths** pages—type any keyword or pick a page below:`,
      timestamp: Date.now(),
      followUpSuggestions: isRtl
        ? ['ماذا يوجد في صفحة الدورات؟', 'ماذا يوجد في صفحة المشاريع؟', 'ماذا يوجد في صفحة الكتب؟', 'اشرح لي هذه الصفحة']
        : ['What is inside Courses page?', 'What is inside Projects page?', 'What is inside Books page?', 'Explain this current page']
    };
    setMessages([resetMsg]);
    if (chatStorageKey) {
      localStorage.setItem(chatStorageKey, JSON.stringify([resetMsg]));
    }
  };

  const getRecTypeLabel = (type: string) => {
    if (!isRtl) return type;
    switch (type) {
      case 'project':
        return 'مشروع عملي';
      case 'path':
        return 'مسار تعليمي';
      case 'book':
        return 'كتاب';
      case 'masterclass':
        return 'ماستركلاس';
      default:
        return 'دورة';
    }
  };

  const formatTime = (ts: number) => {
    try {
      return new Date(ts).toLocaleTimeString(isRtl ? 'ar-MA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  // Render clean formatted markdown-like text inside chat bubbles
  const renderFormattedContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
      return (
        <span key={idx} className="block min-h-[1.2rem] leading-relaxed">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
              return (
                <strong key={pIdx} className="font-extrabold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
              return (
                <code
                  key={pIdx}
                  className="px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono text-[11px] font-bold"
                >
                  {part.slice(1, -1)}
                </code>
              );
            }
            return <React.Fragment key={pIdx}>{part}</React.Fragment>;
          })}
        </span>
      );
    });
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed bottom-20 md:bottom-6 right-3 sm:right-5 md:right-6 z-50 flex flex-col items-end pointer-events-none"
    >
      {/* 1. FIRST-LOGIN ANIMATED WELCOME BUBBLE ("Hi [User]! 👋") */}
      <AnimatePresence>
        {showWelcomePopup && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.9, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 16, scale: 0.92, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            className="pointer-events-auto mb-3.5 w-[calc(100vw-24px)] max-w-[340px] sm:max-w-[360px] rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_20px_50px_-12px_rgba(37,99,235,0.28)] p-4 relative overflow-hidden"
          >
            {/* Ambient Gradient Glow */}
            <div className="absolute -top-12 -end-12 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-emerald-400/20 blur-2xl pointer-events-none" />

            <button
              onClick={() => setShowWelcomePopup(false)}
              className="absolute top-3 end-3 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Dismiss welcome"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25 relative">
                <motion.div
                  animate={{ rotate: [0, 16, -10, 16, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.2 }}
                  className="text-xl select-none"
                >
                  👋
                </motion.div>
                <span className="absolute -bottom-0.5 -end-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
              </div>

              <div className="pe-5 flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 dark:bg-blue-400/15 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{isRtl ? 'مرتبط بجميع صفحات المنصة' : 'Live Page-Linked Copilot'}</span>
                </div>

                <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                  {isRtl ? `أهلاً بك يا ${displayName}!` : `Hi ${displayName}!`}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {isRtl
                    ? 'أنا مرتبط مباشرة بصفحات الدورات، الماستركلاس، المشاريع، الكتب، والمسارات! اكتب أي كلمة مفتاحية وسأقارنها مع أقسام وعناوين الصفحات فوراً.'
                    : "I'm live-linked to Courses, Masterclasses, Projects, Books & Paths! Ask any keyword or page question and I'll match it across all pages."}
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowWelcomePopup(false);
                    setIsOpen(true);
                  }}
                  className="mt-3 w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'تحدث مع المساعد الذكي الآن' : 'Start Smart Conversation'}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MAIN CHAT POPUP CONVERSATION & FLOATING LAUNCHER */}
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="skilliq-agent-popup"
            initial={{ opacity: 0, y: 28, scale: 0.92, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 24, scale: 0.94, filter: 'blur(6px)' }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className={cn(
              'pointer-events-auto relative flex flex-col overflow-hidden rounded-[26px] sm:rounded-[30px] border transition-all duration-300',
              'bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl',
              'border-slate-200/90 dark:border-slate-800/90',
              'shadow-[0_24px_70px_-15px_rgba(15,23,42,0.32)] dark:shadow-[0_24px_70px_-15px_rgba(0,0,0,0.75)]',
              isExpanded
                ? 'w-[calc(100vw-24px)] sm:w-[580px] lg:w-[680px] h-[calc(100dvh-115px)] sm:h-[80vh] max-h-[760px]'
                : 'w-[calc(100vw-24px)] sm:w-[405px] md:w-[435px] h-[calc(100dvh-120px)] sm:h-[72vh] max-h-[640px]'
            )}
          >
            {/* Top Subtle Animated Accent Line */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 shrink-0" />

            {/* CLEAN MODERN HEADER (Supports Light & Dark Mode Seamlessly) */}
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <NeuralOrbIcon className="w-10 h-10 sm:w-11 sm:h-11" />
                  <span className="absolute -bottom-0.5 -end-0.5 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm sm:text-[15px] text-slate-900 dark:text-white tracking-tight truncate">
                      {isRtl ? 'مساعد SkilliQ الذكي' : 'SkilliQ AI Agent'}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {isRtl ? 'متزامن لحظياً' : 'Live Synced'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                    {isRtl
                      ? `مرتبط بـ: ${livePageIndexStats.coursesCount} دورة • ${livePageIndexStats.masterclassesCount} ماستركلاس • ${livePageIndexStats.projectsCount} مشاريع • ${livePageIndexStats.booksCount} كتب`
                      : `Linked: ${livePageIndexStats.coursesCount} Courses • ${livePageIndexStats.masterclassesCount} Masterclasses • ${livePageIndexStats.projectsCount} Projects • ${livePageIndexStats.booksCount} Books`}
                  </p>
                </div>
              </div>

              {/* Header Control Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleClearChat}
                  title={isRtl ? 'مسح المحادثة' : 'Clear Chat'}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsExpanded(prev => !prev)}
                  title={isRtl ? 'تكبير / تصغير النافذة' : 'Expand / Collapse'}
                  className="hidden sm:flex w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 items-center justify-center transition-colors cursor-pointer"
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close AI Agent"
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-500 hover:text-white dark:bg-slate-800/90 dark:hover:bg-rose-600 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ACTIVE COURSE CONTEXT BAR (If user is inside a course page) */}
            {activeCourseContext && (
              <div className="px-4 py-2 bg-blue-50/90 dark:bg-blue-950/40 border-b border-blue-200/60 dark:border-blue-800/50 flex items-center justify-between gap-2 text-[11px] shrink-0">
                <div className="flex items-center gap-1.5 min-w-0 text-blue-700 dark:text-blue-300 font-bold">
                  <Video className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span className="truncate">
                    {isRtl ? 'الدورة الحالية:' : 'Watching:'} {activeCourseContext.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      isRtl
                        ? `لخّص لي دورة "${activeCourseContext.title}" واحفظ الملخص في ملاحظاتي الذكية`
                        : `Summarize "${activeCourseContext.title}" and save it to my Smart Notes`
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shrink-0 transition-colors cursor-pointer shadow-2xs"
                >
                  {isRtl ? '+ تلخيص وحفظ ملاحظة' : '+ Summarize & Save'}
                </button>
              </div>
            )}

            {/* CHAT MESSAGES STREAM */}
            <div className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-4 space-y-4 bg-slate-50/70 dark:bg-slate-950/50">
              {messages.map(msg => {
                const isUser = msg.role === 'user';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'flex flex-col gap-2',
                      isUser ? 'items-end' : 'items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-end gap-2 max-w-[92%] sm:max-w-[88%]',
                        isUser ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      {/* Assistant Mini Avatar */}
                      {!isUser && (
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs mb-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={cn(
                          'rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] transition-colors',
                          isUser
                            ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white rounded-ee-xs shadow-md shadow-blue-600/15'
                            : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-es-xs shadow-2xs'
                        )}
                      >
                        {renderFormattedContent(msg.content)}
                        <div
                          className={cn(
                            'text-[9px] mt-1.5 font-semibold select-none flex items-center gap-1',
                            isUser
                              ? 'text-blue-100/80 justify-end'
                              : 'text-slate-400 dark:text-slate-500 justify-end'
                          )}
                        >
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>

                    {/* INTERACTIVE CONSULTATIVE FOLLOW-UP REPLIES (Page / Category / Keyword buttons) */}
                    {!isUser && msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && (
                      <div className="w-full max-w-[92%] ms-9 flex flex-wrap gap-1.5 pt-0.5">
                        {msg.followUpSuggestions.map((suggestion, sIdx) => (
                          <motion.button
                            key={sIdx}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={isLoading}
                            onClick={() => handleSendMessage(suggestion)}
                            className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white dark:hover:text-white border border-blue-500/25 hover:border-blue-600 text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3 h-3 shrink-0" />
                            <span>{suggestion}</span>
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {/* ROADMAP VISUALIZER CARD */}
                    {msg.roadmap && msg.roadmap.steps && msg.roadmap.steps.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-[92%] ms-9 rounded-2xl bg-white dark:bg-slate-900 border border-blue-500/30 dark:border-blue-500/40 p-3.5 shadow-sm space-y-2.5"
                      >
                        <div className="flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400">
                          <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Compass className="w-3.5 h-3.5" />
                          </div>
                          <span>{msg.roadmap.title}</span>
                        </div>
                        <div className="space-y-2 relative before:absolute before:top-3 before:bottom-3 before:start-[19px] before:w-0.5 before:bg-blue-500/20">
                          {msg.roadmap.steps.map(st => (
                            <div
                              key={st.step}
                              className="relative flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs"
                            >
                              <span className="relative z-10 w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                                {st.step}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white leading-snug">
                                  {st.title}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                                  ⏱ {st.duration}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* RECOMMENDED CATALOG CARDS (Courses, Projects, Masterclasses, Paths, Books) */}
                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="w-full max-w-[92%] ms-9 grid grid-cols-1 gap-2">
                        {msg.recommendations.map((rec, rIdx) => (
                          <Link
                            key={`${rec.id}_${rIdx}`}
                            to={rec.url || `/course/${rec.id}`}
                            onClick={() => setIsOpen(false)}
                            className="group flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-blue-50/60 dark:hover:bg-slate-800/90 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={cn(
                                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs',
                                  rec.type === 'project'
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                    : rec.type === 'path'
                                    ? 'bg-gradient-to-br from-violet-500 to-purple-600'
                                    : rec.type === 'book'
                                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                    : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                )}
                              >
                                {rec.type === 'project' ? (
                                  <Rocket className="w-4 h-4" />
                                ) : rec.type === 'path' ? (
                                  <Layers className="w-4 h-4" />
                                ) : rec.type === 'book' ? (
                                  <BookOpen className="w-4 h-4" />
                                ) : (
                                  <Video className="w-4 h-4" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                                    {getRecTypeLabel(rec.type)}
                                  </span>
                                  <h5 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate transition-colors">
                                    {rec.title}
                                  </h5>
                                </div>
                                {rec.subtitle && (
                                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    {rec.subtitle}
                                  </p>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* AUTOMATED TASK 1: SAVE SUMMARY / SMART NOTE */}
                    {msg.suggestedAction?.type === 'save_note' && (
                      <div className="w-full max-w-[92%] ms-9 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                            <PenTool className="w-3.5 h-3.5" />
                            <span>
                              {isRtl ? 'حفظ تلقائي في المفكرة الذكية' : 'Smart Note Automation'}
                            </span>
                          </span>
                        </div>

                        {completedActions[msg.id] ? (
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{completedActions[msg.id]}</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={executingActionId === msg.id}
                            onClick={() => handleExecuteSaveNote(msg.id, msg.suggestedAction!)}
                            className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          >
                            {executingActionId === msg.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {isRtl
                                ? 'حفظ هذا الملخص في مفكرتي الذكية الآن'
                                : 'Save Summary to My Smart Notes Now'}
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* AUTOMATED TASK 2: DIRECT SUPPORT / COURSE REQUEST TICKET CREATION */}
                    {msg.suggestedAction?.type === 'create_ticket' && (
                      <div className="w-full max-w-[92%] ms-9 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/30 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                            <LifeBuoy className="w-4 h-4" />
                            <span>
                              {isRtl
                                ? 'إرسال تذكرة / طلب إضافة دورة للإدارة'
                                : 'Direct Admin Ticket / Course Request'}
                            </span>
                          </span>
                        </div>

                        {completedActions[msg.id] ? (
                          <div className="space-y-2">
                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span>{completedActions[msg.id]}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                navigate('/support');
                              }}
                              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <span>
                                {isRtl ? 'عرض التذكرة في صفحة الدعم' : 'View Ticket in Support Center'}
                              </span>
                              <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                            </button>
                          </div>
                        ) : (
                          quickTicketDraft &&
                          quickTicketDraft.msgId === msg.id && (
                            <div className="space-y-2 text-xs">
                              <input
                                type="text"
                                value={quickTicketDraft.subject}
                                onChange={e =>
                                  setQuickTicketDraft({ ...quickTicketDraft, subject: e.target.value })
                                }
                                placeholder={isRtl ? 'عنوان التذكرة أو اسم الدورة المطلوبة' : 'Ticket Subject / Requested Course'}
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs outline-none focus:border-blue-500"
                              />
                              <textarea
                                rows={2}
                                value={quickTicketDraft.message}
                                onChange={e =>
                                  setQuickTicketDraft({ ...quickTicketDraft, message: e.target.value })
                                }
                                placeholder={
                                  isRtl
                                    ? 'أضف أي تفاصيل إضافية للأدمن لإضافة الدورة لك...'
                                    : 'Add any details for the Admin to add this course for you...'
                                }
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-none focus:border-blue-500 resize-none"
                              />
                              <button
                                type="button"
                                disabled={executingActionId === msg.id}
                                onClick={() => handleExecuteCreateTicket(msg.id)}
                                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                              >
                                {executingActionId === msg.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                                )}
                                <span>
                                  {isRtl ? 'إرسال التذكرة للإدارة الآن' : 'Submit Ticket to Admin Now'}
                                </span>
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Modern Fast Typing Indicator + Reassuring "Please wait, do not close conversation" Notice */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5"
                >
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl rounded-es-xs px-4 py-3 space-y-1.5 shadow-2xs max-w-[85%]">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <motion.span
                          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.7, repeat: Infinity, delay: 0 }}
                          className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"
                        />
                        <motion.span
                          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.7, repeat: Infinity, delay: 0.16 }}
                          className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"
                        />
                        <motion.span
                          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.7, repeat: Infinity, delay: 0.32 }}
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                        {isRtl
                          ? 'جاري مقارنة كلماتك مع أقسام وعناوين الصفحات...'
                          : 'Comparing keywords with page categories & titles...'}
                      </span>
                    </div>

                    {isSlowSearch && (
                      <p className="text-[10.5px] font-medium text-blue-600 dark:text-blue-400 leading-snug">
                        {isRtl
                          ? '⏳ يرجى الانتظار لحظة، أنا أبحث لك عن أفضل نتيجة — لا تغلق المحادثة...'
                          : "⏳ Please wait a moment while I search the platform for you — please don't close the conversation..."}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* SMART SUGGESTION CHIPS BAR (Direct Links to All 5 Pages) */}
            <div className="px-3 py-2 bg-white/90 dark:bg-slate-900/90 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {quickActions.map((qa, idx) => {
                const Icon = qa.icon;
                return (
                  <motion.button
                    key={idx}
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSendMessage(qa.prompt)}
                    disabled={isLoading}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100/90 hover:bg-blue-500/10 dark:bg-slate-800/90 dark:hover:bg-blue-500/20 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-500/40 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <Icon className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>{qa.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* MODERN GLASS COMPOSER */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0"
            >
              <div className="flex items-center gap-2 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500/15 px-3 py-1.5 transition-all">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    isRtl
                      ? 'اكتب أي كلمة مفتاحية، قسم، أو اسأل عن أي صفحة (React, UI/UX, N8N, الكتب)...'
                      : 'Ask any keyword, category, title, or page question (React, UI/UX, N8N, Books)...'
                  }
                  className="flex-1 max-h-20 bg-transparent py-1.5 text-xs sm:text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none resize-none leading-relaxed"
                />

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  disabled={!input.trim() || isLoading}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-sm shadow-blue-600/20"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        ) : (
          /* 3. REDESIGNED MODERN SMART FLOATING LAUNCHER BUTTON (Light & Dark Mode Adaptive) */
          <motion.button
            key="skilliq-agent-launcher"
            type="button"
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            whileHover={{ y: -3, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => {
              setIsOpen(true);
              setShowWelcomePopup(false);
            }}
            className={cn(
              'pointer-events-auto group relative flex items-center gap-3 p-1.5 pe-4 rounded-full cursor-pointer transition-all duration-300',
              'bg-white/95 hover:bg-white dark:bg-slate-900/95 dark:hover:bg-slate-900 backdrop-blur-xl',
              'border border-slate-200/90 dark:border-slate-700/90 hover:border-blue-500/50 dark:hover:border-blue-400/50',
              'shadow-[0_12px_35px_-8px_rgba(37,99,235,0.35)] dark:shadow-[0_12px_35px_-8px_rgba(37,99,235,0.45)]'
            )}
          >
            {/* Subtle Ambient Hover Glow */}
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 opacity-0 group-hover:opacity-20 blur-md transition-opacity pointer-events-none" />

            {/* Animated Neural AI Orb */}
            <div className="relative">
              <NeuralOrbIcon className="w-9 h-9 sm:w-10 sm:h-10" />
              <span className="absolute -top-0.5 -end-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-900" />
              </span>
            </div>

            {/* Smart Label + Status */}
            <div className="flex flex-col items-start text-start">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-[13px] font-black tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  {isRtl ? 'مساعد SkilliQ الذكي' : 'SkilliQ AI Agent'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap flex items-center gap-1">
                <span>{isRtl ? 'اسألني أي شيء' : 'Ask me anything'}</span>
                <CornerDownLeft className="w-2.5 h-2.5 opacity-75" />
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
