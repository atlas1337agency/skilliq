import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../store/useStore';
import { getQuizForCourse, loadQuizWithFallback, CourseQuiz } from '../lib/quizzes';
import { awardCustomXP } from '../lib/gamification';

interface InteractiveQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  videoId?: string;
  videoTitle?: string;
  courseTitle?: string;
  courseCategory?: string;
  onQuizPassed?: (score: number) => void;
}

export const InteractiveQuizModal: React.FC<InteractiveQuizModalProps> = ({
  isOpen,
  onClose,
  courseId,
  videoId,
  videoTitle,
  courseTitle,
  courseCategory,
  onQuizPassed
}) => {
  const { language, user } = useStore();
  const isRtl = language === 'ar';
  
  const [quiz, setQuiz] = useState<CourseQuiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scorePercentage, setScorePercentage] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Load or reset quiz when modal opens or course/video changes
  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      // Set initial synchronous fallback immediately to avoid blank flash
      const initialFallback = getQuizForCourse(courseId, courseTitle, courseCategory);
      setQuiz(initialFallback);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setIsSubmitted(false);
      setScorePercentage(0);
      setCorrectCount(0);
      setTimerSeconds(0);
      setIsTimerRunning(true);

      // Fetch custom questions from Firestore (supports video-specific or course-specific)
      loadQuizWithFallback(courseId, videoId, courseTitle, courseCategory)
        .then(customQ => {
          if (isMounted && customQ) {
            setQuiz(customQ);
          }
        })
        .catch(err => {
          console.warn('Fallback to local quiz:', err);
        });
    } else {
      setIsTimerRunning(false);
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, courseId, videoId, videoTitle, courseTitle, courseCategory]);

  // Quiz timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && !isSubmitted) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isSubmitted]);

  if (!isOpen || !quiz) return null;

  const currentQuestion = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isPassed = scorePercentage >= quiz.passingScore;

  const handleSelectOption = (index: number) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: index
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    let correct = 0;
    quiz.questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct += 1;
      }
    });

    const percentage = Math.round((correct / totalQuestions) * 100);
    setCorrectCount(correct);
    setScorePercentage(percentage);
    setIsSubmitted(true);
    setIsTimerRunning(false);

    if (percentage >= quiz.passingScore) {
      // Trigger confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // canvas-confetti fallback
      }

      // Award XP
      if (user?.uid) {
        try {
          await awardCustomXP(user.uid, quiz.xpReward, {
            id: 'quiz_master',
            name: language === 'ar' ? 'فارس الاختبارات التقنية' : 'Quiz Champion',
            description: language === 'ar' ? 'اجتاز اختبار الكفاءة بنجاح' : 'Passed certification exam with excellence',
            icon: '🎓'
          });
        } catch (err) {
          console.error('Failed to update quiz stats:', err);
        }
      }

      if (onQuizPassed) {
        onQuizPassed(percentage);
      }
    }
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScorePercentage(0);
    setCorrectCount(0);
    setTimerSeconds(0);
    setIsTimerRunning(true);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {language === 'ar' ? quiz.title.ar : quiz.title.en}
                </h2>
                {videoTitle && (
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] border border-indigo-500/20">
                    {language === 'ar' ? `درس: ${videoTitle}` : `Lesson: ${videoTitle}`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span>{language === 'ar' ? `درجة النجاح: ${quiz.passingScore}%` : `Passing Score: ${quiz.passingScore}%`}</span>
                <span>•</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">+{quiz.xpReward} XP</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{formatTimer(timerSeconds)}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {!isSubmitted && (
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800">
            <motion.div
              className="h-full bg-indigo-600"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Body Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key={`q-${currentIndex}`}
                initial={{ opacity: 0, x: isRtl ? -15 : 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRtl ? 15 : -15 }}
                className="space-y-6"
              >
                {/* Question Info Bar */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold">
                    {language === 'ar' ? `السؤال ${currentIndex + 1} من ${totalQuestions}` : `Question ${currentIndex + 1} of ${totalQuestions}`}
                  </span>
                  <span className="capitalize">
                    {currentQuestion.type === 'practical' 
                      ? (language === 'ar' ? 'سؤال تطبيقي / تحليل كود' : 'Practical Code Analysis')
                      : (language === 'ar' ? 'اختيار من متعدد' : 'Multiple Choice')}
                  </span>
                </div>

                {/* Question Text */}
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                  {language === 'ar' ? currentQuestion.question.ar : currentQuestion.question.en}
                </h3>

                {/* Code Snippet if practical */}
                {currentQuestion.codeSnippet && (
                  <div className="relative rounded-2xl bg-slate-950 p-4 border border-slate-800 overflow-x-auto text-left font-mono text-sm text-emerald-400 shadow-inner" dir="ltr">
                    <pre className="m-0 leading-relaxed">{currentQuestion.codeSnippet}</pre>
                  </div>
                )}

                {/* Options List */}
                <div className="space-y-3 pt-2">
                  {currentQuestion.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentQuestion.id] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(optIdx)}
                        className={`w-full flex items-start text-start gap-3.5 p-4 rounded-2xl border transition-all text-sm sm:text-base font-medium ${
                          isSelected
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500/50'
                            : 'bg-slate-50/60 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className="flex-1 leading-relaxed">
                          {language === 'ar' ? opt.ar : opt.en}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Footer Controls */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                    <span>{language === 'ar' ? 'السابق' : 'Previous'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {isLastQuestion ? (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={selectedAnswers[currentQuestion.id] === undefined}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-indigo-500/20 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{language === 'ar' ? 'إنهاء وتصحيح الاختبار' : 'Submit & Grade Exam'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleNext}
                        disabled={selectedAnswers[currentQuestion.id] === undefined}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-indigo-500/20 transition-all"
                      >
                        <span>{language === 'ar' ? 'التالي' : 'Next'}</span>
                        {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Results Screen */
              <motion.div
                key="quiz-results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 text-center space-y-6"
              >
                <div className="relative inline-block">
                  <div className={`w-24 h-24 rounded-3xl mx-auto flex items-center justify-center shadow-xl ${
                    isPassed
                      ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-500/25'
                      : 'bg-gradient-to-tr from-amber-500 to-rose-400 text-white shadow-rose-500/25'
                  }`}>
                    {isPassed ? <Trophy className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
                  </div>
                  {isPassed && (
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ repeat: Infinity, duration: 2.5 }}
                      className="absolute -top-2 -right-2 bg-amber-400 text-amber-950 p-1.5 rounded-xl shadow"
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    {isPassed
                      ? (language === 'ar' ? 'تهانينا! لقد اجتزت الاختبار بنجاح' : 'Outstanding! You Passed the Exam')
                      : (language === 'ar' ? 'لم تجتز درجة النجاح هذه المرة' : 'Review & Try Again')}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1.5">
                    {isPassed
                      ? (language === 'ar' 
                          ? `حققت ${scorePercentage}% متجاوزاً الحد الأدنى للشهادة (${quiz.passingScore}%). تم تأكيد كفاءتك وإضافة ${quiz.xpReward} XP لحسابك!`
                          : `You scored ${scorePercentage}% exceeding the requirement (${quiz.passingScore}%). Your certificate is unlocked and ${quiz.xpReward} XP was added to your account!`)
                      : (language === 'ar'
                          ? `حققت ${scorePercentage}%. تحتاج إلى ${quiz.passingScore}% على الأقل لاجتياز الاختبار والحصول على الشهادة. راجع التفسيرات أدناه ثم أعد المحاولة.`
                          : `You scored ${scorePercentage}%. A minimum of ${quiz.passingScore}% is required to unlock your verified certificate. Review explanations below and retry.`)}
                  </p>
                </div>

                {/* Score breakdown metrics */}
                <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-400 font-medium">{language === 'ar' ? 'الدرجة' : 'Score'}</div>
                    <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{scorePercentage}%</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-400 font-medium">{language === 'ar' ? 'الإجابات الصحيحة' : 'Correct'}</div>
                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{correctCount} / {totalQuestions}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-400 font-medium">{language === 'ar' ? 'الوقت' : 'Time'}</div>
                    <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{formatTimer(timerSeconds)}</div>
                  </div>
                </div>

                {/* Answers & Explanations Review Accordion */}
                <div className="text-start space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-500" />
                    <span>{language === 'ar' ? 'مراجعة الإجابات والشروحات التقنية:' : 'Answers & Technical Review:'}</span>
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {quiz.questions.map((q, idx) => {
                      const userAns = selectedAnswers[q.id];
                      const isCorrect = userAns === q.correctAnswer;
                      return (
                        <div
                          key={q.id}
                          className={`p-3.5 rounded-xl border text-xs sm:text-sm ${
                            isCorrect
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {idx + 1}. {language === 'ar' ? q.question.ar : q.question.en}
                            </span>
                            <span className={`shrink-0 font-bold ${isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {isCorrect ? '✓' : '✗'}
                            </span>
                          </div>
                          <div className="mt-2 text-slate-600 dark:text-slate-400">
                            <p>
                              <strong className="text-slate-700 dark:text-slate-300">{language === 'ar' ? 'الإجابة الصحيحة: ' : 'Correct Answer: '}</strong>
                              {language === 'ar' ? q.options[q.correctAnswer].ar : q.options[q.correctAnswer].en}
                            </p>
                            <p className="mt-1 text-slate-500 italic bg-white/60 dark:bg-slate-900/40 p-2 rounded-lg">
                              💡 {language === 'ar' ? q.explanation.ar : q.explanation.en}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Final Actions */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleRetake}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{language === 'ar' ? 'إعادة الاختبار' : 'Retake Exam'}</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-colors"
                  >
                    <span>{language === 'ar' ? 'متابعة الدورة' : 'Done & Return to Course'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
