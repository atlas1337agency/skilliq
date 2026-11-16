import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
  Search,
  BookOpen,
  PlayCircle,
  Code2,
  FileCode,
  Layers,
  Sparkles,
  ArrowRight,
  ChevronDown,
  RefreshCw,
  X,
  Check,
  Eye,
  Sliders,
  Terminal,
  ToggleLeft,
  ToggleRight,
  SlidersHorizontal,
  Table
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Course, Video } from '../data/courses';
import { cn } from '../lib/utils';
import {
  CourseQuiz,
  QuizQuestion,
  fetchCustomQuiz,
  saveCustomQuiz,
  deleteCustomQuiz,
  getQuizDocId,
  getQuizForCourse
} from '../lib/quizzes';
import {
  fetchAllCourseFeatures,
  saveCourseFeatures,
  CourseFeaturesConfig
} from '../lib/courseFeatures';

export const AdminQuizzes: React.FC = () => {
  const { allCourses, language } = useStore();
  const isRtl = language === 'ar';

  // State
  const [selectedCourseId, setSelectedCourseId] = useState<string>(allCourses[0]?.id || '');
  const [selectedVideoId, setSelectedVideoId] = useState<string>(''); // '' means course-level quiz
  const [courseSearch, setCourseSearch] = useState('');
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active Editing Quiz
  const [activeQuiz, setActiveQuiz] = useState<CourseQuiz | null>(null);

  // Course Interactive Features State
  const [allFeatures, setAllFeatures] = useState<Record<string, CourseFeaturesConfig>>({});
  const [isSavingFeature, setIsSavingFeature] = useState(false);
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  useEffect(() => {
    fetchAllCourseFeatures().then((feats) => {
      setAllFeatures(feats);
    });
  }, []);

  // Question Editor Modal State
  const [editingQuestion, setEditingQuestion] = useState<{
    index: number | null; // null means new question
    question: QuizQuestion;
  } | null>(null);

  // Selected Course
  const selectedCourse = useMemo(() => {
    return allCourses.find(c => c.id === selectedCourseId) || allCourses[0];
  }, [allCourses, selectedCourseId]);

  // Selected Video (if videoId is set)
  const selectedVideo = useMemo(() => {
    if (!selectedVideoId || !selectedCourse?.videos) return null;
    return selectedCourse.videos.find(v => v.id === selectedVideoId) || null;
  }, [selectedCourse, selectedVideoId]);

  // Filtered Courses for Search
  const filteredCourses = useMemo(() => {
    if (!courseSearch.trim()) return allCourses;
    const q = courseSearch.toLowerCase();
    return allCourses.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.instructor || '').toLowerCase().includes(q) ||
      (c.category || '').toLowerCase().includes(q)
    );
  }, [allCourses, courseSearch]);

  const currentCourseFeatures = useMemo(() => {
    if (!selectedCourse?.id) return null;
    const cid = selectedCourse.id;
    return allFeatures[cid] || {
      courseId: cid,
      enableSandbox: Boolean(selectedCourse.enableSandbox),
      enableFlashcards: Boolean(selectedCourse.enableFlashcards),
      enableLessonQuiz: Boolean(selectedCourse.enableLessonQuiz),
      enableCourseExam: Boolean(selectedCourse.enableCourseExam),
    };
  }, [allFeatures, selectedCourse]);

  const handleToggleFeature = async (courseId: string, feature: 'enableSandbox' | 'enableFlashcards' | 'enableLessonQuiz' | 'enableCourseExam') => {
    const curCourse = allCourses.find(c => c.id === courseId);
    const existing = allFeatures[courseId] || {
      courseId,
      enableSandbox: Boolean(curCourse?.enableSandbox),
      enableFlashcards: Boolean(curCourse?.enableFlashcards),
      enableLessonQuiz: Boolean(curCourse?.enableLessonQuiz),
      enableCourseExam: Boolean(curCourse?.enableCourseExam),
    };
    const newVal = !existing[feature];
    const updated: CourseFeaturesConfig = {
      ...existing,
      [feature]: newVal
    };

    setAllFeatures(prev => ({ ...prev, [courseId]: updated }));
    setIsSavingFeature(true);

    try {
      await saveCourseFeatures(courseId, { [feature]: newVal });
      setStatusMessage({
        type: 'success',
        text: isRtl
          ? `تم تحديث الأداة: ${newVal ? 'مُفعّلة ومتاحة للطلاب الآن' : 'مخفية عن الطلاب الآن'}`
          : `Tool updated: ${newVal ? 'Visible to students' : 'Hidden from students'}`
      });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      setAllFeatures(prev => ({ ...prev, [courseId]: existing }));
      setStatusMessage({
        type: 'error',
        text: isRtl ? 'حدث خطأ أثناء حفظ الإعداد' : 'Failed to save feature setting'
      });
    } finally {
      setIsSavingFeature(false);
    }
  };

  // Load quiz from Firestore or template whenever course or video selection changes
  const loadActiveQuiz = async () => {
    if (!selectedCourse) return;
    setIsLoadingQuiz(true);
    setStatusMessage(null);
    try {
      const existing = await fetchCustomQuiz(selectedCourse.id, selectedVideoId || undefined);
      if (existing) {
        setActiveQuiz(existing);
      } else {
        // Fallback default template
        const base = getQuizForCourse(selectedCourse.id, selectedCourse.title, selectedCourse.category);
        const template: CourseQuiz = {
          ...base,
          id: getQuizDocId(selectedCourse.id, selectedVideoId || undefined),
          courseId: selectedCourse.id,
          videoId: selectedVideoId || undefined,
          videoTitle: selectedVideo?.title,
          title: selectedVideoId && selectedVideo
            ? {
                en: `${selectedVideo.title} — Comprehension Quiz`,
                ar: `اختبار التحصيل لدرس: ${selectedVideo.title}`
              }
            : base.title,
          description: selectedVideoId && selectedVideo
            ? {
                en: `Practical quiz to evaluate comprehension of lesson: ${selectedVideo.title}`,
                ar: `اختبار تدريبي لتقييم استيعاب الطالب لمحتوى درس: ${selectedVideo.title}`
              }
            : base.description,
          xpReward: selectedVideoId ? 50 : 100,
          passingScore: 70
        };
        setActiveQuiz(template);
      }
    } catch (err) {
      console.error('Error loading quiz:', err);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  useEffect(() => {
    loadActiveQuiz();
  }, [selectedCourseId, selectedVideoId]);

  // Handle Save Quiz to Firestore
  const handleSaveQuiz = async () => {
    if (!activeQuiz || !selectedCourse) return;
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await saveCustomQuiz(activeQuiz);
      setStatusMessage({
        type: 'success',
        text: isRtl
          ? 'تم حفظ وتحديث أسئلة الاختبار بنجاح في قاعدة البيانات!'
          : 'Quiz questions saved and updated successfully in Firestore!'
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Error saving quiz:', err);
      setStatusMessage({
        type: 'error',
        text: isRtl
          ? `فشل حفظ الاختبار: ${err.message || 'خطأ غير معروف'}`
          : `Failed to save quiz: ${err.message || 'Unknown error'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Custom Quiz
  const handleDeleteQuiz = async () => {
    if (!activeQuiz) return;
    const confirmMsg = isRtl
      ? 'هل أنت متأكد من حذف هذا الاختبار المخصص؟ سيتم الرجوع للنموذج التلقائي.'
      : 'Are you sure you want to delete this custom quiz? It will revert to the default template.';
    if (!window.confirm(confirmMsg)) return;

    setIsSaving(true);
    try {
      await deleteCustomQuiz(activeQuiz.id);
      setStatusMessage({
        type: 'success',
        text: isRtl ? 'تم حذف الاختبار المخصص بنجاح.' : 'Custom quiz deleted successfully.'
      });
      await loadActiveQuiz();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to delete'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Open modal for new question
  const handleOpenAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q_${Date.now()}`,
      type: 'mcq',
      question: {
        en: '',
        ar: ''
      },
      options: [
        { en: '', ar: '' },
        { en: '', ar: '' },
        { en: '', ar: '' },
        { en: '', ar: '' }
      ],
      correctAnswer: 0,
      explanation: {
        en: '',
        ar: ''
      }
    };
    setEditingQuestion({ index: null, question: newQ });
  };

  // Save question from modal
  const handleSaveQuestionModal = () => {
    if (!editingQuestion || !activeQuiz) return;
    const q = editingQuestion.question;
    if (!q.question.en.trim() && !q.question.ar.trim()) {
      alert(isRtl ? 'يرجى كتابة نص السؤال.' : 'Please enter the question text.');
      return;
    }

    const updatedQuestions = [...activeQuiz.questions];
    if (editingQuestion.index === null) {
      updatedQuestions.push(q);
    } else {
      updatedQuestions[editingQuestion.index] = q;
    }

    setActiveQuiz({
      ...activeQuiz,
      questions: updatedQuestions
    });
    setEditingQuestion(null);
  };

  // Delete question
  const handleDeleteQuestion = (idx: number) => {
    if (!activeQuiz) return;
    const updated = activeQuiz.questions.filter((_, i) => i !== idx);
    setActiveQuiz({
      ...activeQuiz,
      questions: updated
    });
  };

  return (
    <div className="space-y-6 text-start" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-card via-card to-indigo-500/10 border border-border/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
              <span>{isRtl ? 'إدارة الاختبارات التفاعلية اليدوية' : 'Course & Video Quiz Engine'}</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
                Admin Control
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRtl
                ? 'إضافة وتخصيص أسئلة الاختبارات لكل كورس أو لكل درس/فيديو بعينه يدويًا مع دعم الأسئلة العملية وخيارات MCQ.'
                : 'Create and customize manual quiz questions per entire course or per individual video/lesson with code snippets.'}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowMatrixModal(true)}
            type="button"
            className="px-3.5 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-xs"
            title={isRtl ? 'عرض وإدارة الأدوات التفاعلية لجميع الكورسات' : 'Manage interactive tools for all courses'}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{isRtl ? 'صلاحيات ظهور الأدوات لجميع الكورسات' : 'All Courses Tools Matrix'}</span>
          </button>

          <button
            onClick={loadActiveQuiz}
            type="button"
            disabled={isLoadingQuiz}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Reload from Firestore"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingQuiz ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleSaveQuiz}
            type="button"
            disabled={isSaving || !activeQuiz}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isRtl ? 'حفظ الاختبار في السيرفر' : 'Save Quiz Changes'}</span>
          </button>
        </div>
      </div>

      {/* Status feedback toast */}
      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border flex items-center gap-2 text-xs sm:text-sm font-bold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{statusMessage.text}</span>
        </motion.div>
      )}

      {/* 2-Column Responsive Selector: Left: Course & Video Selector / Right: Quiz Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Course & Scope Picker */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <h3 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>{isRtl ? '1. اختر المقرر المستهدف' : '1. Select Course'}</span>
            </h3>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={courseSearch}
                onChange={e => setCourseSearch(e.target.value)}
                placeholder={isRtl ? 'ابحث عن كورس...' : 'Search courses...'}
                className="w-full bg-muted/50 border border-border/80 rounded-xl ps-8 pe-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Courses list */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pe-1">
              {filteredCourses.map(course => {
                const isSelected = course.id === selectedCourseId;
                return (
                  <button
                    key={course.id}
                    onClick={() => {
                      setSelectedCourseId(course.id);
                      setSelectedVideoId('');
                    }}
                    type="button"
                    className={`w-full text-start p-2.5 rounded-xl border transition-all text-xs cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500 text-foreground font-bold shadow-xs ring-1 ring-indigo-500/30'
                        : 'bg-card hover:bg-muted/60 border-border/60 text-muted-foreground'
                    }`}
                  >
                    <div className="truncate">
                      <div className="truncate text-foreground font-semibold">{course.title}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {course.videos?.length || 0} {isRtl ? 'درس' : 'lessons'} • {course.category}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scope Picker: Entire Course vs Specific Video */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <h3 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-indigo-500" />
              <span>{isRtl ? '2. نطاق الاختبار (كورس كامل أو فيديو محدد)' : '2. Quiz Scope'}</span>
            </h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSelectedVideoId('')}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold text-start flex items-center justify-between cursor-pointer transition-all ${
                  selectedVideoId === ''
                    ? 'bg-indigo-500/15 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'bg-muted/40 hover:bg-muted border-border/60 text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-500" />
                  <span>{isRtl ? 'اختبار الدورة النهائي (شهادة الإتمام)' : 'Final Course Certification Exam'}</span>
                </div>
                {selectedVideoId === '' && <Check className="w-4 h-4" />}
              </button>

              <div className="pt-2 border-t border-border/60">
                <div className="text-[11px] font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <PlayCircle className="w-3.5 h-3.5 text-primary" />
                  <span>{isRtl ? 'أو اختر فيديو/درس محدد من الدورة:' : 'Or Select Specific Video Lesson:'}</span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 pe-1">
                  {selectedCourse?.videos && selectedCourse.videos.length > 0 ? (
                    selectedCourse.videos.map((vid, idx) => {
                      const isVidSelected = selectedVideoId === vid.id;
                      return (
                        <button
                          key={vid.id}
                          onClick={() => setSelectedVideoId(vid.id)}
                          type="button"
                          className={`w-full text-start p-2 rounded-xl text-xs flex items-center justify-between gap-2 border transition-all cursor-pointer ${
                            isVidSelected
                              ? 'bg-primary/15 border-primary text-foreground font-bold shadow-xs'
                              : 'bg-card hover:bg-muted/60 border-border/50 text-muted-foreground'
                          }`}
                        >
                          <div className="truncate flex items-center gap-2">
                            <span className="font-mono text-[10px] text-muted-foreground shrink-0">#{idx + 1}</span>
                            <span className="truncate">{vid.title}</span>
                          </div>
                          {isVidSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      {isRtl ? 'لا توجد دروس منفصلة لهذه الدورة' : 'No lessons in this course.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quiz Header Settings & Questions Builder */}
        <div className="lg:col-span-8 space-y-4">
          {activeQuiz ? (
            <div className="space-y-4">
              {/* Interactive Tools Visibility Card for Selected Course */}
              {selectedCourse && (
                <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border/60">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                          <span>{isRtl ? 'الأدوات التفاعلية المتاحة للطلاب في هذا الكورس' : 'Interactive Tools for Students in this Course'}</span>
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {isRtl
                            ? `تحكم بما يظهر للطلاب في شريط كورس (${selectedCourse.title}). الأدوات غير المفعلة هنا لن تظهر للطلاب نهائياً.`
                            : `Control what appears for students in "${selectedCourse.title}". If disabled, students cannot see it.`}
                        </p>
                      </div>
                    </div>
                    {isSavingFeature && (
                      <span className="text-[10px] text-muted-foreground font-mono animate-pulse flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                        <span>{isRtl ? 'جاري الحفظ...' : 'Saving...'}</span>
                      </span>
                    )}
                  </div>

                  {/* 4 Feature Toggles Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {/* 1. Terminal / Sandbox */}
                    <div className={cn(
                      "p-3 rounded-xl border flex items-center justify-between gap-3 transition-all",
                      currentCourseFeatures?.enableSandbox
                        ? "bg-emerald-500/10 border-emerald-500/40"
                        : "bg-muted/30 border-border/70"
                    )}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                          <Terminal className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{isRtl ? 'محاكي الأكواد والطرفية' : 'Code Sandbox & Terminal'}</span>
                        </div>
                        <span className="text-[10.5px] text-muted-foreground block truncate mt-0.5">
                          {currentCourseFeatures?.enableSandbox
                            ? (isRtl ? '✔ يظهر للطلاب' : '✔ Visible to students')
                            : (isRtl ? '✖ مخفي عن الطلاب' : '✖ Hidden from students')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(selectedCourse.id, 'enableSandbox')}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          currentCourseFeatures?.enableSandbox ? "bg-emerald-500" : "bg-muted"
                        )}
                        title={currentCourseFeatures?.enableSandbox ? 'Click to Disable' : 'Click to Enable'}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            currentCourseFeatures?.enableSandbox ? (isRtl ? "-translate-x-5" : "translate-x-5") : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {/* 2. Smart Flashcards */}
                    <div className={cn(
                      "p-3 rounded-xl border flex items-center justify-between gap-3 transition-all",
                      currentCourseFeatures?.enableFlashcards
                        ? "bg-amber-500/10 border-amber-500/40"
                        : "bg-muted/30 border-border/70"
                    )}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{isRtl ? 'بطاقات المراجعة الذكية' : 'Smart Flashcards'}</span>
                        </div>
                        <span className="text-[10.5px] text-muted-foreground block truncate mt-0.5">
                          {currentCourseFeatures?.enableFlashcards
                            ? (isRtl ? '✔ تظهر للطلاب' : '✔ Visible to students')
                            : (isRtl ? '✖ مخفية عن الطلاب' : '✖ Hidden from students')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(selectedCourse.id, 'enableFlashcards')}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          currentCourseFeatures?.enableFlashcards ? "bg-amber-500" : "bg-muted"
                        )}
                        title={currentCourseFeatures?.enableFlashcards ? 'Click to Disable' : 'Click to Enable'}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            currentCourseFeatures?.enableFlashcards ? (isRtl ? "-translate-x-5" : "translate-x-5") : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {/* 3. Lesson Quizzes */}
                    <div className={cn(
                      "p-3 rounded-xl border flex items-center justify-between gap-3 transition-all",
                      currentCourseFeatures?.enableLessonQuiz
                        ? "bg-primary/10 border-primary/40"
                        : "bg-muted/30 border-border/70"
                    )}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                          <Award className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{isRtl ? 'اختبارات الدروس' : 'Lesson Quizzes'}</span>
                        </div>
                        <span className="text-[10.5px] text-muted-foreground block truncate mt-0.5">
                          {currentCourseFeatures?.enableLessonQuiz
                            ? (isRtl ? '✔ يظهر في الشريط وقائمة الدروس' : '✔ Visible in header & playlist')
                            : (isRtl ? '✖ مخفي عن الطلاب' : '✖ Hidden from students')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(selectedCourse.id, 'enableLessonQuiz')}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          currentCourseFeatures?.enableLessonQuiz ? "bg-primary" : "bg-muted"
                        )}
                        title={currentCourseFeatures?.enableLessonQuiz ? 'Click to Disable' : 'Click to Enable'}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            currentCourseFeatures?.enableLessonQuiz ? (isRtl ? "-translate-x-5" : "translate-x-5") : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {/* 4. Course Exam */}
                    <div className={cn(
                      "p-3 rounded-xl border flex items-center justify-between gap-3 transition-all",
                      currentCourseFeatures?.enableCourseExam
                        ? "bg-indigo-500/10 border-indigo-500/40"
                        : "bg-muted/30 border-border/70"
                    )}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                          <Award className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{isRtl ? 'اختبار الدورة والشهادة' : 'Course Exam & Certificate'}</span>
                        </div>
                        <span className="text-[10.5px] text-muted-foreground block truncate mt-0.5">
                          {currentCourseFeatures?.enableCourseExam
                            ? (isRtl ? '✔ يظهر للطلاب' : '✔ Visible to students')
                            : (isRtl ? '✖ مخفي عن الطلاب' : '✖ Hidden from students')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(selectedCourse.id, 'enableCourseExam')}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          currentCourseFeatures?.enableCourseExam ? "bg-indigo-600" : "bg-muted"
                        )}
                        title={currentCourseFeatures?.enableCourseExam ? 'Click to Disable' : 'Click to Enable'}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            currentCourseFeatures?.enableCourseExam ? (isRtl ? "-translate-x-5" : "translate-x-5") : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz Metadata Editor */}
              <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                      {selectedVideo ? (isRtl ? `اختبار درس #${selectedVideoId}` : `Lesson Quiz #${selectedVideoId}`) : (isRtl ? 'اختبار الدورة العام' : 'Course Exam')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDeleteQuiz}
                      type="button"
                      className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      {isRtl ? 'استعادة النموذج التلقائي' : 'Reset to Default'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      {isRtl ? 'عنوان الاختبار (عربي):' : 'Quiz Title (Arabic):'}
                    </label>
                    <input
                      type="text"
                      value={activeQuiz.title.ar}
                      onChange={e => setActiveQuiz({ ...activeQuiz, title: { ...activeQuiz.title, ar: e.target.value } })}
                      className="w-full bg-muted/40 border border-border/80 rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      {isRtl ? 'عنوان الاختبار (إنجليزي):' : 'Quiz Title (English):'}
                    </label>
                    <input
                      type="text"
                      value={activeQuiz.title.en}
                      onChange={e => setActiveQuiz({ ...activeQuiz, title: { ...activeQuiz.title, en: e.target.value } })}
                      className="w-full bg-muted/40 border border-border/80 rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      {isRtl ? 'نسبة النجاح المطلوبة (%):' : 'Passing Score (%):'}
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={activeQuiz.passingScore}
                      onChange={e => setActiveQuiz({ ...activeQuiz, passingScore: Number(e.target.value) || 70 })}
                      className="w-full bg-muted/40 border border-border/80 rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      {isRtl ? 'مكافأة نقاط الخبرة (XP):' : 'XP Reward Points:'}
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={500}
                      value={activeQuiz.xpReward}
                      onChange={e => setActiveQuiz({ ...activeQuiz, xpReward: Number(e.target.value) || 100 })}
                      className="w-full bg-muted/40 border border-border/80 rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Questions List Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                    <span>{isRtl ? 'قائمة الأسئلة والخيارات' : 'Quiz Questions & Answers'}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-bold">
                      {activeQuiz.questions.length} {isRtl ? 'أسئلة' : 'questions'}
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRtl ? 'اضغط "إضافة سؤال جديد" لإنشاء أسئلة اختيار من متعدد أو أسئلة عملية برمجية.' : 'Add MCQs or practical code review questions for your students.'}
                  </p>
                </div>

                <button
                  onClick={handleOpenAddQuestion}
                  type="button"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isRtl ? 'إضافة سؤال جديد' : 'Add Question'}</span>
                </button>
              </div>

              {/* Questions Cards */}
              <div className="space-y-3">
                {activeQuiz.questions.map((q, idx) => {
                  return (
                    <div
                      key={q.id || idx}
                      className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3 transition-all hover:border-border"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                q.type === 'practical' ? 'bg-amber-500/15 text-amber-500' : 'bg-blue-500/15 text-blue-500'
                              }`}>
                                {q.type === 'practical' ? (isRtl ? 'سؤال عملي / كود' : 'Practical Code') : 'MCQ'}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-foreground">
                              {language === 'ar' ? (q.question.ar || q.question.en) : (q.question.en || q.question.ar)}
                            </h4>
                          </div>
                        </div>

                        {/* Actions: Edit / Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditingQuestion({ index: idx, question: JSON.parse(JSON.stringify(q)) })}
                            type="button"
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Edit Question"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(idx)}
                            type="button"
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Code snippet preview if any */}
                      {q.codeSnippet && (
                        <div className="rounded-xl bg-slate-950 p-3 text-xs font-mono text-emerald-400 overflow-x-auto" dir="ltr">
                          <pre className="m-0">{q.codeSnippet}</pre>
                        </div>
                      )}

                      {/* Options List Preview */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = q.correctAnswer === optIdx;
                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                isCorrect
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold'
                                  : 'bg-muted/30 border-border/60 text-muted-foreground'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-muted text-foreground'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="truncate">
                                {language === 'ar' ? (opt.ar || opt.en) : (opt.en || opt.ar)}
                              </span>
                              {isCorrect && <Check className="w-3.5 h-3.5 ms-auto text-emerald-500 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation note */}
                      {(q.explanation.ar || q.explanation.en) && (
                        <div className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/50">
                          <span className="font-bold text-foreground">💡 {isRtl ? 'الشرح العلمي: ' : 'Explanation: '}</span>
                          {language === 'ar' ? (q.explanation.ar || q.explanation.en) : (q.explanation.en || q.explanation.ar)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
              {isRtl ? 'اختر دورة أو درساً لتحميل بيانات الاختبار.' : 'Select a course or video lesson to load quiz.'}
            </div>
          )}
        </div>
      </div>

      {/* QUESTION EDITOR MODAL */}
      <AnimatePresence>
        {editingQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-primary" />
                  <span>
                    {editingQuestion.index === null
                      ? (isRtl ? 'إضافة سؤال جديد للاختبار' : 'Add New Quiz Question')
                      : (isRtl ? `تعديل السؤال رقم ${editingQuestion.index + 1}` : `Edit Question #${editingQuestion.index + 1}`)}
                  </span>
                </h3>
                <button
                  onClick={() => setEditingQuestion(null)}
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form Body */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Question Type */}
                <div className="flex items-center gap-4">
                  <label className="font-bold text-foreground">{isRtl ? 'نوع السؤال:' : 'Question Type:'}</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion({
                        ...editingQuestion,
                        question: { ...editingQuestion.question, type: 'mcq', codeSnippet: undefined }
                      })}
                      className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                        editingQuestion.question.type === 'mcq'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      Multiple Choice (MCQ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingQuestion({
                        ...editingQuestion,
                        question: { ...editingQuestion.question, type: 'practical', codeSnippet: editingQuestion.question.codeSnippet || '// Enter code snippet here' }
                      })}
                      className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                        editingQuestion.question.type === 'practical'
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isRtl ? 'سؤال كود عملي (Practical)' : 'Practical Code'}
                    </button>
                  </div>
                </div>

                {/* Question Text in Arabic & English */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-foreground mb-1">
                      {isRtl ? 'نص السؤال (بالعربية):' : 'Question (Arabic):'}
                    </label>
                    <textarea
                      value={editingQuestion.question.question.ar}
                      onChange={e => setEditingQuestion({
                        ...editingQuestion,
                        question: {
                          ...editingQuestion.question,
                          question: { ...editingQuestion.question.question, ar: e.target.value }
                        }
                      })}
                      rows={3}
                      placeholder={isRtl ? 'اكتب نص السؤال هنا باللغة العربية...' : 'Question text in Arabic...'}
                      className="w-full bg-muted/50 border border-border/80 rounded-xl p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-foreground mb-1">
                      {isRtl ? 'نص السؤال (بالإنجليزية):' : 'Question (English):'}
                    </label>
                    <textarea
                      value={editingQuestion.question.question.en}
                      onChange={e => setEditingQuestion({
                        ...editingQuestion,
                        question: {
                          ...editingQuestion.question,
                          question: { ...editingQuestion.question.question, en: e.target.value }
                        }
                      })}
                      rows={3}
                      placeholder="Question text in English..."
                      className="w-full bg-muted/50 border border-border/80 rounded-xl p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                </div>

                {/* Practical Code Snippet */}
                {editingQuestion.question.type === 'practical' && (
                  <div>
                    <label className="block font-bold text-foreground mb-1">
                      {isRtl ? 'كود الفحص أو البرمجة المشفر (Code Snippet):' : 'Code Snippet (Practical Exercise):'}
                    </label>
                    <textarea
                      value={editingQuestion.question.codeSnippet || ''}
                      onChange={e => setEditingQuestion({
                        ...editingQuestion,
                        question: {
                          ...editingQuestion.question,
                          codeSnippet: e.target.value
                        }
                      })}
                      rows={4}
                      className="w-full bg-slate-950 text-emerald-400 font-mono border border-border/80 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary"
                      dir="ltr"
                    />
                  </div>
                )}

                {/* Options Builder (A, B, C, D) */}
                <div className="space-y-3 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-foreground text-xs sm:text-sm">
                      {isRtl ? 'الخيارات الأربعة (حدد الإجابة الصحيحة):' : 'Answer Options (Select the correct one):'}
                    </label>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      {isRtl
                        ? `الإجابة الصحيحة الحالية: (${String.fromCharCode(65 + editingQuestion.question.correctAnswer)})`
                        : `Current Correct: (${String.fromCharCode(65 + editingQuestion.question.correctAnswer)})`}
                    </span>
                  </div>

                  {editingQuestion.question.options.map((opt, optIdx) => {
                    const isCorrect = editingQuestion.question.correctAnswer === optIdx;
                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-2xl border transition-all ${
                          isCorrect ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30' : 'bg-muted/30 border-border/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="correctOptionRadio"
                              checked={isCorrect}
                              onChange={() => setEditingQuestion({
                                ...editingQuestion,
                                question: { ...editingQuestion.question, correctAnswer: optIdx }
                              })}
                              className="w-4 h-4 text-emerald-600"
                            />
                            <span className="font-bold text-foreground">
                              {isRtl ? `الخيار ${String.fromCharCode(65 + optIdx)} (اضغط هنا لجعله الإجابة الصحيحة)` : `Option ${String.fromCharCode(65 + optIdx)} (Click to set as correct)`}
                            </span>
                          </label>
                          {isCorrect && (
                            <span className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/20">
                              ✓ {isRtl ? 'الإجابة الصحيحة' : 'Correct Answer'}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={opt.ar}
                            onChange={e => {
                              const newOpts = [...editingQuestion.question.options];
                              newOpts[optIdx] = { ...newOpts[optIdx], ar: e.target.value };
                              setEditingQuestion({
                                ...editingQuestion,
                                question: { ...editingQuestion.question, options: newOpts }
                              });
                            }}
                            placeholder={isRtl ? `نص الخيار ${String.fromCharCode(65 + optIdx)} بالعربية` : `Option ${String.fromCharCode(65 + optIdx)} in Arabic`}
                            className="bg-card border border-border/80 rounded-xl p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />

                          <input
                            type="text"
                            value={opt.en}
                            onChange={e => {
                              const newOpts = [...editingQuestion.question.options];
                              newOpts[optIdx] = { ...newOpts[optIdx], en: e.target.value };
                              setEditingQuestion({
                                ...editingQuestion,
                                question: { ...editingQuestion.question, options: newOpts }
                              });
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)} in English`}
                            className="bg-card border border-border/80 rounded-xl p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation in AR & EN */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <label className="block font-bold text-foreground">
                    {isRtl ? 'التفسير العلمي والشرح بعد الإجابة (Explanation):' : 'Technical Explanation (shown after completion):'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <textarea
                      value={editingQuestion.question.explanation.ar}
                      onChange={e => setEditingQuestion({
                        ...editingQuestion,
                        question: {
                          ...editingQuestion.question,
                          explanation: { ...editingQuestion.question.explanation, ar: e.target.value }
                        }
                      })}
                      rows={2}
                      placeholder={isRtl ? 'اكتب الشرح العلمي بالعربية...' : 'Explanation in Arabic...'}
                      className="bg-muted/50 border border-border/80 rounded-xl p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />

                    <textarea
                      value={editingQuestion.question.explanation.en}
                      onChange={e => setEditingQuestion({
                        ...editingQuestion,
                        question: {
                          ...editingQuestion.question,
                          explanation: { ...editingQuestion.question.explanation, en: e.target.value }
                        }
                      })}
                      rows={2}
                      placeholder="Explanation in English..."
                      className="bg-muted/50 border border-border/80 rounded-xl p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuestionModal}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  {isRtl ? 'حفظ السؤال في القائمة' : 'Done & Update Question'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ALL COURSES FEATURE MATRIX MODAL */}
        {showMatrixModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col text-start"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-border flex items-center justify-between gap-3 bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-foreground">
                      {isRtl ? 'مصفوفة تفعيل الأدوات التفاعلية لجميع الكورسات' : 'All Courses Interactive Tools Matrix'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isRtl
                        ? 'تفعيل أو تعطيل ظهور الأدوات (الطرفية البرمجية، البطاقات، اختبار الدرس، اختبار الكورس) بنقرة واحدة.'
                        : 'Enable or disable interactive tools for each course with a single click.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMatrixModal(false)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute start-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={courseSearch}
                    onChange={e => setCourseSearch(e.target.value)}
                    placeholder={isRtl ? 'تصفية الكورسات حسب العنوان أو التصنيف...' : 'Filter courses by title or category...'}
                    className="w-full bg-muted/50 border border-border/80 rounded-xl ps-10 pe-4 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Courses Matrix Table */}
                <div className="space-y-3">
                  {filteredCourses.map(c => {
                    const feat = allFeatures[c.id] || {
                      courseId: c.id,
                      enableSandbox: Boolean(c.enableSandbox),
                      enableFlashcards: Boolean(c.enableFlashcards),
                      enableLessonQuiz: Boolean(c.enableLessonQuiz),
                      enableCourseExam: Boolean(c.enableCourseExam),
                    };

                    return (
                      <div
                        key={c.id}
                        className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 hover:border-border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0 md:max-w-xs">
                          {c.thumbnail ? (
                            <img src={c.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover bg-muted shrink-0 border border-border/60" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-[10px] text-muted-foreground shrink-0">
                              No Img
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-foreground line-clamp-1">{c.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-medium text-muted-foreground truncate">{c.instructor || 'SkilliQ'}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground">{c.category}</span>
                            </div>
                          </div>
                        </div>

                        {/* 4 Feature Toggles */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
                          {/* 1. Sandbox */}
                          <button
                            type="button"
                            onClick={() => handleToggleFeature(c.id, 'enableSandbox')}
                            className={cn(
                              "px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95",
                              feat.enableSandbox
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                                : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <Terminal className="w-3.5 h-3.5 shrink-0" />
                            <span>{isRtl ? 'الطرفية' : 'Sandbox'}</span>
                            <span className="text-[9px] font-mono px-1 rounded bg-black/10 dark:bg-white/10">
                              {feat.enableSandbox ? 'ON' : 'OFF'}
                            </span>
                          </button>

                          {/* 2. Flashcards */}
                          <button
                            type="button"
                            onClick={() => handleToggleFeature(c.id, 'enableFlashcards')}
                            className={cn(
                              "px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95",
                              feat.enableFlashcards
                                ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400"
                                : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span>{isRtl ? 'البطاقات' : 'Flashcards'}</span>
                            <span className="text-[9px] font-mono px-1 rounded bg-black/10 dark:bg-white/10">
                              {feat.enableFlashcards ? 'ON' : 'OFF'}
                            </span>
                          </button>

                          {/* 3. Lesson Quiz */}
                          <button
                            type="button"
                            onClick={() => handleToggleFeature(c.id, 'enableLessonQuiz')}
                            className={cn(
                              "px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95",
                              feat.enableLessonQuiz
                                ? "bg-primary/15 border-primary/40 text-primary"
                                : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <Award className="w-3.5 h-3.5 shrink-0" />
                            <span>{isRtl ? 'اختبار الدرس' : 'Lesson Quiz'}</span>
                            <span className="text-[9px] font-mono px-1 rounded bg-black/10 dark:bg-white/10">
                              {feat.enableLessonQuiz ? 'ON' : 'OFF'}
                            </span>
                          </button>

                          {/* 4. Course Exam */}
                          <button
                            type="button"
                            onClick={() => handleToggleFeature(c.id, 'enableCourseExam')}
                            className={cn(
                              "px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95",
                              feat.enableCourseExam
                                ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-400"
                                : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <Award className="w-3.5 h-3.5 shrink-0" />
                            <span>{isRtl ? 'اختبار الكورس' : 'Course Exam'}</span>
                            <span className="text-[9px] font-mono px-1 rounded bg-black/10 dark:bg-white/10">
                              {feat.enableCourseExam ? 'ON' : 'OFF'}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {isRtl
                    ? `إجمالي المقررات: ${allCourses.length} كورس`
                    : `Total Courses: ${allCourses.length}`}
                </span>
                <button
                  type="button"
                  onClick={() => setShowMatrixModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  {isRtl ? 'إغلاق وحفظ' : 'Done & Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
