import { useEffect, useState } from 'react';
import { 
  Timer, 
  Pause, 
  Play, 
  RotateCcw, 
  X, 
  Minimize2, 
  Maximize2, 
  Sparkles, 
  Coffee, 
  Flame, 
  Volume2,
  Sliders,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFocusTimer, triggerFocusAlarmSoundAndVibrate } from '../store/useFocusTimer';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export function GlobalFocusTimerPopup() {
  const { language } = useStore();
  const isRtl = language === 'ar';
  
  const {
    timeLeft,
    initialDuration,
    isRunning,
    mode,
    isMinimized,
    showFloatingPopup,
    hasFinishedModal,
    customMinutesInput,
    pauseFocus,
    resumeFocus,
    resetFocus,
    stopFocus,
    setMinimized,
    tick,
    dismissFinishedModal,
    startFocus,
    startBreak,
    setMode,
  } = useFocusTimer();

  // State to toggle custom time editor inside the popup
  const [showTimeEditor, setShowTimeEditor] = useState(false);
  const [editingMinutes, setEditingMinutes] = useState(customMinutesInput || 25);
  const [editorMode, setEditorMode] = useState<'work' | 'break'>(mode);

  // Sync internal edit inputs when mode changes
  useEffect(() => {
    setEditorMode(mode);
    setEditingMinutes(mode === 'break' ? 5 : (customMinutesInput || 25));
  }, [mode, customMinutesInput]);

  // Run the global interval loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, tick]);

  if (!showFloatingPopup && !hasFinishedModal) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const progressPercent = Math.max(0, Math.min(100, Math.round(((initialDuration - timeLeft) / (initialDuration || 1)) * 100)));

  const handleApplyCustomTime = () => {
    const mins = Math.max(1, Math.min(180, Number(editingMinutes) || 25));
    if (editorMode === 'break') {
      startBreak(mins);
    } else {
      startFocus(mins, 'work');
    }
    setShowTimeEditor(false);
  };

  return (
    <>
      {/* 1. Finished Alarm & Celebration Alert Modal */}
      <AnimatePresence>
        {hasFinishedModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              dir={isRtl ? 'rtl' : 'ltr'}
              className="bg-card w-full max-w-sm rounded-3xl border border-primary/40 shadow-2xl p-5 sm:p-6 text-center space-y-4"
            >
              {/* Prominent Icon with Coffee Cup in break */}
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border shadow-sm transition-all",
                mode === 'break' 
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-500 shadow-amber-500/10" 
                  : "bg-primary/10 border-primary/30 text-primary shadow-primary/10"
              )}>
                {mode === 'break' ? (
                  <Coffee className="w-8 h-8 animate-bounce text-amber-500" />
                ) : (
                  <Sparkles className="w-8 h-8 animate-bounce text-primary" />
                )}
              </div>

              <div className="space-y-1 px-1">
                <h3 className="text-base sm:text-lg md:text-xl font-black text-foreground tracking-tight leading-snug">
                  {mode === 'break' 
                    ? (isRtl ? 'أحسنت! أتممت جلسة التركيز بنجاح' : 'Focus Session Complete!') 
                    : (isRtl ? 'انتهت الاستراحة! جاهز للعودة؟' : 'Break Time Finished!')}
                </h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  {mode === 'break' 
                    ? (isRtl ? 'تم إضافة +15 XP لحسابك. خذ استراحة واشرب كوب قهوة منعش!' : 'You earned +15 XP! Take a relaxing coffee break.')
                    : (isRtl ? 'حان وقت جولة جديدة من التعلم والتركيز العميق.' : 'Time to dive into your next deep work interval.')}
                </p>
              </div>

              {/* Sound alert test button */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-muted/50 border border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium text-[11px] sm:text-xs">
                  <Volume2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{isRtl ? 'صوت المنبه والاهتزاز' : 'Alarm sound & vibration'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => triggerFocusAlarmSoundAndVibrate()}
                  className="px-2 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold cursor-pointer shrink-0"
                >
                  {isRtl ? 'اختبار' : 'Replay'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                {mode === 'break' ? (
                  <button
                    type="button"
                    onClick={() => {
                      dismissFinishedModal();
                      startBreak(5);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 transition-transform"
                  >
                    <Coffee className="w-4 h-4 shrink-0 text-slate-950" />
                    <span className="truncate">{isRtl ? 'بدء استراحة قهوة (5د)' : 'Start 5m Coffee Break'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      dismissFinishedModal();
                      startFocus(25, 'work');
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-transform"
                  >
                    <Flame className="w-4 h-4 shrink-0" />
                    <span className="truncate">{isRtl ? 'جلسة تركيز جديدة (25د)' : 'Start Next 25m'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={dismissFinishedModal}
                  className="py-2.5 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs sm:text-sm cursor-pointer active:scale-95 transition-transform"
                >
                  {isRtl ? 'إغلاق' : 'Dismiss'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Floating Persistent HUD Popup (Positioned on the LEFT to never block the AI chatbot on the right) */}
      {showFloatingPopup && (
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          className="fixed bottom-20 md:bottom-6 left-3 sm:left-5 md:left-6 z-[60] transition-all duration-300 pointer-events-auto"
        >
          {isMinimized ? (
            /* Minimized Pill View - Responsive for Laptop, Tablet, Mobile */
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => setMinimized(false)}
              className={cn(
                "group flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl shadow-2xl backdrop-blur-md cursor-pointer border transition-all active:scale-95",
                mode === 'break'
                  ? "bg-amber-500/15 dark:bg-amber-950/70 border-amber-500/50 hover:border-amber-500 text-amber-700 dark:text-amber-300"
                  : "bg-card/95 hover:bg-card border-primary/40 hover:border-primary text-foreground"
              )}
            >
              <div className="relative shrink-0">
                {mode === 'break' ? (
                  <Coffee className="w-4 h-4 text-amber-500 animate-bounce" />
                ) : (
                  <Timer className="w-4 h-4 text-primary animate-pulse" />
                )}
              </div>
              <span className="font-mono font-bold text-xs sm:text-sm tabular-nums">
                {formattedTime}
              </span>
              <span className={cn(
                "text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0",
                mode === 'break' 
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black" 
                  : "bg-primary/10 text-primary"
              )}>
                {mode === 'break' ? (
                  <>
                    <Coffee className="w-3 h-3 shrink-0" />
                    <span className="whitespace-nowrap">{isRtl ? 'استراحة قهوة' : 'Coffee Break'}</span>
                  </>
                ) : (
                  <span>{isRtl ? 'تركيز' : 'Focus'}</span>
                )}
              </span>
              <Maximize2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </motion.div>
          ) : (
            /* Expanded Interactive Card View */
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className={cn(
                "w-72 sm:w-80 md:w-84 max-w-[calc(100vw-24px)] rounded-2xl border shadow-2xl backdrop-blur-md p-3.5 sm:p-4 space-y-3 transition-colors",
                mode === 'break'
                  ? "bg-amber-50/95 dark:bg-slate-900/95 border-amber-500/50 dark:border-amber-500/40"
                  : "bg-card/95 border-border"
              )}
            >
              {/* Header with Prominent Coffee Cup Icon */}
              <div className="flex items-center justify-between pb-2 border-b border-border/70">
                <div className="flex items-center gap-2 min-w-0">
                  {mode === 'break' ? (
                    <div className="p-1 sm:p-1.5 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/30 shrink-0">
                      <Coffee className="w-4 h-4 text-amber-500" />
                    </div>
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  )}
                  <span className={cn(
                    "text-xs sm:text-sm font-bold truncate",
                    mode === 'break' ? "text-amber-600 dark:text-amber-400 font-black" : "text-foreground"
                  )}>
                    {mode === 'break' 
                      ? (isRtl ? 'استراحة قهوة' : 'Coffee Break') 
                      : (isRtl ? 'مساعد التركيز' : 'Focus Session')}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* In-Video Custom Time Editor Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowTimeEditor(!showTimeEditor)}
                    title={isRtl ? 'تخصيص الوقت والمدة' : 'Customize Time & Duration'}
                    className={cn(
                      "p-1.5 rounded-md transition-colors cursor-pointer",
                      showTimeEditor 
                        ? "bg-primary text-primary-foreground font-bold" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setMinimized(true)}
                    title={isRtl ? 'تصغير' : 'Minimize'}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={stopFocus}
                    title={isRtl ? 'إغلاق' : 'Close'}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* IN-VIDEO CUSTOM TIME & DURATION EDITOR */}
              {showTimeEditor ? (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                    <span>{isRtl ? 'تخصيص المدة داخل الفيديو:' : 'Set Duration (In Video):'}</span>
                    <span className="font-mono text-foreground">{editingMinutes}m</span>
                  </div>

                  {/* Mode Selector */}
                  <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-background rounded-lg border border-border/60 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setEditorMode('work');
                        setEditingMinutes(25);
                      }}
                      className={cn(
                        "py-1 px-2 rounded-md font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer",
                        editorMode === 'work' ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Timer className="w-3 h-3" />
                      <span>{isRtl ? 'تركيز' : 'Focus'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditorMode('break');
                        setEditingMinutes(5);
                      }}
                      className={cn(
                        "py-1 px-2 rounded-md font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer",
                        editorMode === 'break' ? "bg-amber-500 text-slate-950 font-black shadow-2xs" : "text-muted-foreground hover:text-amber-500"
                      )}
                    >
                      <Coffee className="w-3 h-3" />
                      <span className="whitespace-nowrap">{isRtl ? 'استراحة قهوة' : 'Coffee Break'}</span>
                    </button>
                  </div>

                  {/* Quick Presets */}
                  <div className="grid grid-cols-4 gap-1">
                    {(editorMode === 'break' ? [3, 5, 10, 15] : [15, 25, 45, 60]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setEditingMinutes(m)}
                        className={cn(
                          "py-1 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer text-center",
                          editingMinutes === m
                            ? editorMode === 'break' ? "bg-amber-500 text-slate-950" : "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>

                  {/* Exact Number Input */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <label className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {isRtl ? 'وقت مخصص (دقيقة):' : 'Custom mins:'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={editingMinutes}
                      onChange={(e) => setEditingMinutes(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}
                      className="w-16 bg-background border border-border/80 rounded-lg px-1.5 py-0.5 text-xs font-mono font-bold text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomTime}
                      className={cn(
                        "flex-1 py-1 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs",
                        editorMode === 'break' ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-black" : "bg-primary hover:bg-primary/90 text-primary-foreground"
                      )}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>{isRtl ? 'تطبيق وبدء' : 'Apply & Start'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Big Digital Clock Display */}
                  <div className="text-center py-1">
                    <div className={cn(
                      "text-3xl sm:text-4xl font-mono font-extrabold tabular-nums tracking-tight",
                      mode === 'break' ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                    )}>
                      {formattedTime}
                    </div>
                    
                    {/* Responsive Status Label with Coffee Icon */}
                    <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1.5 flex-wrap px-1 text-center">
                      {mode === 'break' ? (
                        <>
                          <Coffee className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                            {isRtl ? 'استراحة قهوة لتجديد نشاطك' : 'Coffee Break to recharge'}
                          </span>
                        </>
                      ) : (
                        <span>
                          {isRunning 
                            ? (isRtl ? 'يعمل فوق الفيديو والمنصة' : 'Active over video and platform') 
                            : (isRtl ? 'المؤقت متوقف مؤقتاً' : 'Timer is paused')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        mode === 'break' ? "bg-amber-500" : "bg-primary"
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={isRunning ? pauseFocus : resumeFocus}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95",
                        isRunning 
                          ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-black" 
                          : mode === 'break'
                          ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-black"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground"
                      )}
                    >
                      {isRunning ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'إيقاف مؤقت' : 'Pause'}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isRtl ? 'استئناف' : 'Resume'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowTimeEditor(true)}
                      title={isRtl ? 'تغيير الوقت' : 'Change Time'}
                      className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={resetFocus}
                      title={isRtl ? 'إعادة ضبط' : 'Reset'}
                      className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      )}
    </>
  );
}
