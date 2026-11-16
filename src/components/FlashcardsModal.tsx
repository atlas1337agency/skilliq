import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Layers,
  RotateCw,
  Check,
  RefreshCcw,
  Sparkles,
  Flame,
  Award,
  ChevronRight,
  ChevronLeft,
  Terminal,
  Shield,
  Code2,
  Globe,
  Volume2,
  VolumeX,
  Copy,
  BookOpen,
  Shuffle,
  Lightbulb,
  Keyboard
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  FLASHCARD_DECKS,
  Flashcard,
  getFlashcardProgress,
  saveFlashcardResult
} from '../lib/flashcards';
import { awardCustomXP } from '../lib/gamification';

interface FlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: 'linux' | 'security' | 'web' | 'networking' | 'all';
}

export const FlashcardsModal: React.FC<FlashcardsModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'all'
}) => {
  const { language, user } = useStore();
  const isRtl = language === 'ar';

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progress, setProgress] = useState(getFlashcardProgress());
  const [recentXpEarned, setRecentXpEarned] = useState<number | null>(null);
  const [hasCopiedSnippet, setHasCopiedSnippet] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Filter cards by category
  const filteredCards = FLASHCARD_DECKS.filter(card => {
    if (activeCategory === 'all') return true;
    return card.category === activeCategory;
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setProgress(getFlashcardProgress());
      setRecentXpEarned(null);
    }
  }, [isOpen, activeCategory]);

  const currentCard: Flashcard | undefined = filteredCards[currentIndex];
  const totalInDeck = filteredCards.length;

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleNextCard = useCallback(() => {
    setIsFlipped(false);
    if (currentIndex < totalInDeck - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  }, [currentIndex, totalInDeck]);

  const handlePrevCard = useCallback(() => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(totalInDeck - 1);
    }
  }, [currentIndex, totalInDeck]);

  const handleReviewAnswer = useCallback(async (gotItRight: boolean) => {
    if (!currentCard) return;

    const { xpEarned } = saveFlashcardResult(currentCard.id, gotItRight);
    setProgress(getFlashcardProgress());

    if (gotItRight && xpEarned > 0) {
      setRecentXpEarned(xpEarned);
      if (user?.uid) {
        try {
          await awardCustomXP(user.uid, xpEarned, {
            id: 'flashcard_scholar',
            name: isRtl ? 'المراجع المتألق' : 'Flashcard Scholar',
            description: isRtl ? 'راجع بطاقات المراجعة الذكية واكتسب XP' : 'Mastered technical flashcards with spaced repetition',
            icon: '🃏'
          });
        } catch (err) {
          console.error('Failed to update stats:', err);
        }
      }
      setTimeout(() => {
        setRecentXpEarned(null);
      }, 1500);
    }

    setTimeout(() => {
      handleNextCard();
    }, 250);
  }, [currentCard, user?.uid, isRtl, handleNextCard]);

  // Keyboard navigation support
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        isRtl ? handlePrevCard() : handleNextCard();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        isRtl ? handleNextCard() : handlePrevCard();
      } else if (e.key === '1') {
        e.preventDefault();
        handleReviewAnswer(false);
      } else if (e.key === '2') {
        e.preventDefault();
        handleReviewAnswer(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleFlip, handleNextCard, handlePrevCard, handleReviewAnswer, isRtl]);

  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isRtl ? 'ar-SA' : 'en-US';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyCode = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setHasCopiedSnippet(true);
    setTimeout(() => setHasCopiedSnippet(false), 1400);
  };

  const handleShuffleDeck = () => {
    const randomIdx = Math.floor(Math.random() * totalInDeck);
    setCurrentIndex(randomIdx);
    setIsFlipped(false);
  };

  if (!isOpen) return null;

  const masteredCount = Object.values(progress).filter((p: any) => p?.status === 'mastered').length;
  const cardProgressState = currentCard ? progress[currentCard.id] : undefined;
  const isCardMastered = cardProgressState?.status === 'mastered';

  const categories = [
    { id: 'all', label: { en: 'All Decks', ar: 'جميع البطاقات' }, icon: Layers, count: FLASHCARD_DECKS.length },
    { id: 'linux', label: { en: 'Linux & SysAdmin', ar: 'لينكس وإدارة النظم' }, icon: Terminal, count: FLASHCARD_DECKS.filter(c => c.category === 'linux').length },
    { id: 'security', label: { en: 'OWASP & Defense', ar: 'الأمان وثغرات OWASP' }, icon: Shield, count: FLASHCARD_DECKS.filter(c => c.category === 'security').length },
    { id: 'web', label: { en: 'Full-Stack Web', ar: 'هندسة الويب المتكاملة' }, icon: Code2, count: FLASHCARD_DECKS.filter(c => c.category === 'web').length },
    { id: 'networking', label: { en: 'Networking Protocols', ar: 'الشبكات والبروتوكولات' }, icon: Globe, count: FLASHCARD_DECKS.filter(c => c.category === 'networking').length }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{language === 'ar' ? 'بطاقات المراجعة الذكية الحديثة' : 'Modern Technical Flashcards'}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  SRS 2.0
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'ar' ? 'ترسيخ المصطلحات والأوامر البرمجية بالتكرار المتباعد (+XP)' : 'Daily micro-learning to solidify core engineering knowledge'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-bold text-slate-200">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>{masteredCount} {language === 'ar' ? 'بطاقة متقنة' : 'Mastered'}</span>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="px-6 py-2.5 border-b border-slate-800/80 bg-slate-900/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm shadow-amber-500/25 ring-1 ring-amber-400'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? cat.label.ar : cat.label.en}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Flashcard Area */}
        <div className="p-5 sm:p-6 space-y-4">
          {currentCard ? (
            <div className="space-y-4">
              {/* Progress & Shortcuts Helper Bar */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[11px]">
                    {currentCard.category}
                  </span>
                  {isCardMastered && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {language === 'ar' ? 'متقنة' : 'Mastered'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShuffleDeck}
                    type="button"
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={language === 'ar' ? 'ترتيب عشوائي' : 'Shuffle Deck'}
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-xs font-bold text-slate-300">
                    {currentIndex + 1} / {totalInDeck}
                  </span>
                </div>
              </div>

              {/* Progress Line */}
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${((currentIndex + 1) / totalInDeck) * 100}%` }}
                />
              </div>

              {/* 3D Modern Flip Flashcard */}
              <div
                onClick={handleFlip}
                className="relative min-h-[320px] sm:min-h-[360px] cursor-pointer select-none rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 border border-slate-700/80 bg-gradient-to-br from-slate-800/90 via-slate-900 to-slate-950 shadow-xl hover:border-amber-500/50 group"
              >
                {/* Floating XP Reward Popover */}
                <AnimatePresence>
                  {recentXpEarned && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: -20, scale: 1.1 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-4 right-4 z-20 px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-lg shadow-amber-400/40"
                    >
                      <Flame className="w-4 h-4 fill-current" />
                      +{recentXpEarned} XP!
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Card Top Actions: Difficulty & Flip clue */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                    currentCard.difficulty === 'hard'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : currentCard.difficulty === 'medium'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {currentCard.difficulty}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const text = isFlipped
                          ? (language === 'ar' ? currentCard.answer.ar : currentCard.answer.en)
                          : (language === 'ar' ? currentCard.question.ar : currentCard.question.en);
                        handleSpeakText(text);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Listen with Text-to-Speech"
                    >
                      {isSpeaking ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold group-hover:underline">
                      <RotateCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                      <span>{language === 'ar' ? 'انقر للقلب' : 'Click to flip'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body (Front vs Back) */}
                <div className="py-4 my-auto">
                  <AnimatePresence mode="wait">
                    {!isFlipped ? (
                      <motion.div
                        key="front"
                        initial={{ opacity: 0, rotateY: 90 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        exit={{ opacity: 0, rotateY: -90 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 text-center"
                      >
                        <h3 className="text-lg sm:text-2xl font-black text-white leading-snug tracking-tight">
                          {language === 'ar' ? currentCard.question.ar : currentCard.question.en}
                        </h3>

                        {currentCard.codeSnippet && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="relative inline-block max-w-full rounded-2xl bg-black/80 px-4 py-3 text-left font-mono text-xs sm:text-sm text-emerald-400 border border-slate-800 shadow-inner group/code"
                            dir="ltr"
                          >
                            <button
                              onClick={() => handleCopyCode(currentCard.codeSnippet || '')}
                              type="button"
                              className="absolute top-2 right-2 p-1 rounded-md bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
                              title="Copy snippet"
                            >
                              {hasCopiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <pre className="m-0 whitespace-pre-wrap pe-8">{currentCard.codeSnippet}</pre>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="back"
                        initial={{ opacity: 0, rotateY: -90 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        exit={{ opacity: 0, rotateY: 90 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between text-xs font-black uppercase text-emerald-400">
                          <span>{language === 'ar' ? 'الإجابة والتحليل التقني:' : 'Answer & Analysis:'}</span>
                          <span className="text-[11px] text-slate-400 font-mono">SRS +5 XP</span>
                        </div>
                        <div className="text-sm sm:text-base text-slate-200 whitespace-pre-line leading-relaxed font-medium">
                          {language === 'ar' ? currentCard.answer.ar : currentCard.answer.en}
                        </div>

                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-amber-300">
                          <span className="font-bold flex items-center gap-1.5 mb-1 text-amber-400">
                            <Lightbulb className="w-4 h-4" />
                            {language === 'ar' ? 'الخلاصة الذهبية:' : 'Key Takeaway:'}
                          </span>
                          <p className="leading-relaxed">
                            {language === 'ar' ? currentCard.keyTakeaway.ar : currentCard.keyTakeaway.en}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer hint */}
                <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Keyboard className="w-3.5 h-3.5 opacity-60" />
                  <span>
                    {isFlipped
                      ? (language === 'ar' ? 'اضغط 1 (بحاجة لمراجعة) أو 2 (أتقنتها)' : 'Press [1] Need Review or [2] Mastered')
                      : (language === 'ar' ? 'المسافة (Space) للقلب • الأسهم للتبديل' : 'Press [Space] to flip • [←] [→] to navigate')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  onClick={handlePrevCard}
                  type="button"
                  className="p-3 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
                  title={language === 'ar' ? 'السابق' : 'Previous'}
                >
                  {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>

                <div className="flex-1 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleReviewAnswer(false)}
                    type="button"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    <span>{language === 'ar' ? 'بحاجة لمراجعة (1)' : 'Need Review (1)'}</span>
                  </button>

                  <button
                    onClick={() => handleReviewAnswer(true)}
                    type="button"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>{language === 'ar' ? 'أتقنتها جيداً (+5 XP)' : 'Mastered (+5 XP)'}</span>
                  </button>
                </div>

                <button
                  onClick={handleNextCard}
                  type="button"
                  className="p-3 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
                  title={language === 'ar' ? 'التالي' : 'Next'}
                >
                  {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              {language === 'ar' ? 'لا توجد بطاقات في هذا التصنيف' : 'No cards found in this category.'}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
