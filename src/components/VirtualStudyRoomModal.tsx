import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  CloudRain,
  Coffee,
  Waves,
  Sparkles,
  X,
  CheckCircle2,
  Flame,
  Radio,
  Clock,
  Target
} from 'lucide-react';
import { useFocusTimer, triggerFocusAlarmSoundAndVibrate } from '../store/useFocusTimer';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export type AmbientSoundType = 'none' | 'rain' | 'ocean' | 'cafe' | 'binaural';

interface VirtualStudyRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VirtualStudyRoomModal({ isOpen, onClose }: VirtualStudyRoomModalProps) {
  const { language } = useStore();
  const isRtl = language === 'ar';

  const {
    timeLeft,
    initialDuration,
    isRunning,
    mode,
    startFocus,
    pauseFocus,
    resumeFocus,
    resetFocus,
    activeTaskTitle,
    setActiveTaskTitle,
    focusMinutesToday
  } = useFocusTimer();

  const [activeSound, setActiveSound] = useState<AmbientSoundType>('rain');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [taskInput, setTaskInput] = useState(activeTaskTitle || '');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [onlineLearnersCount, setOnlineLearnersCount] = useState(38);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const activeNodesRef = useRef<any[]>([]);

  // Fluctuating realistic online count
  useEffect(() => {
    const timer = setInterval(() => {
      setOnlineLearnersCount(prev => Math.max(28, Math.min(54, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Procedural Sound Engine (Zero external audio file dependencies)
  const stopAudio = () => {
    activeNodesRef.current.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {}
    });
    activeNodesRef.current = [];
  };

  const startProceduralAudio = (type: AmbientSoundType, vol: number) => {
    stopAudio();
    if (type === 'none') return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(vol, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      // 1. RAIN & SOOTHING THUNDER
      if (type === 'rain') {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2 + white * 0.053) * 0.12;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();

        activeNodesRef.current.push(whiteNoise, filter);
      } 
      // 2. OCEAN WAVES (Rhythmic Surges)
      else if (type === 'ocean') {
        const bufferSize = ctx.sampleRate * 3;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.15;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);

        const waveGain = ctx.createGain();
        waveGain.gain.setValueAtTime(0.05, ctx.currentTime);

        // LFO for ocean wave swells
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(0.14, ctx.currentTime); // Wave every ~7 seconds
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.35, ctx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(waveGain.gain);

        noise.connect(filter);
        filter.connect(waveGain);
        waveGain.connect(masterGain);

        noise.start();
        osc.start();

        activeNodesRef.current.push(noise, filter, waveGain, osc, oscGain);
      }
      // 3. CAFE AMBIENCE (Warm low rumble & soft tone)
      else if (type === 'cafe') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const cafeGain = ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(110, ctx.currentTime); // A2 warm room hum
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(164.81, ctx.currentTime); // E3 harmonic

        cafeGain.gain.setValueAtTime(0.08, ctx.currentTime);

        osc1.connect(cafeGain);
        osc2.connect(cafeGain);
        cafeGain.connect(masterGain);

        osc1.start();
        osc2.start();

        activeNodesRef.current.push(osc1, osc2, cafeGain);
      }
      // 4. BINAURAL ALPHA/GAMMA BEATS (40Hz resonance for hyperfocus)
      else if (type === 'binaural') {
        const leftOsc = ctx.createOscillator();
        const rightOsc = ctx.createOscillator();
        const merger = ctx.createChannelMerger(2);

        leftOsc.type = 'sine';
        leftOsc.frequency.setValueAtTime(200, ctx.currentTime);

        rightOsc.type = 'sine';
        rightOsc.frequency.setValueAtTime(240, ctx.currentTime); // 40Hz delta

        const bGain = ctx.createGain();
        bGain.gain.setValueAtTime(0.09, ctx.currentTime);

        leftOsc.connect(merger, 0, 0);
        rightOsc.connect(merger, 0, 1);
        merger.connect(bGain);
        bGain.connect(masterGain);

        leftOsc.start();
        rightOsc.start();

        activeNodesRef.current.push(leftOsc, rightOsc, merger, bGain);
      }

    } catch (e) {
      console.warn('Audio setup error:', e);
    }
  };

  // Toggle Audio Playback
  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopAudio();
      setIsPlayingAudio(false);
    } else {
      startProceduralAudio(activeSound, volume);
      setIsPlayingAudio(true);
    }
  };

  // Change sound preset
  const handleChangeSound = (newSound: AmbientSoundType) => {
    setActiveSound(newSound);
    if (isPlayingAudio) {
      startProceduralAudio(newSound, volume);
    }
  };

  // Update volume
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newVol, audioCtxRef.current.currentTime);
    }
  };

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch {}
      }
    };
  }, []);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const soundPresets = [
    { id: 'rain', label: isRtl ? 'صوت المطر' : 'Gentle Rain', icon: CloudRain },
    { id: 'ocean', label: isRtl ? 'أمواج المحيط' : 'Ocean Waves', icon: Waves },
    { id: 'cafe', label: isRtl ? 'أجواء المقهى' : 'Cozy Café', icon: Coffee },
    { id: 'binaural', label: isRtl ? 'موجات التركيز (40Hz)' : 'Alpha Waves (40Hz)', icon: Radio }
  ];

  const recentLearners = [
    { name: isRtl ? 'أنس من الدار البيضاء' : 'Anas (Morocco)', task: isRtl ? 'دراسة ثغرات OWASP' : 'Studying OWASP Web Security', duration: '45m' },
    { name: isRtl ? 'سارة من القاهرة' : 'Sarah (Egypt)', task: isRtl ? 'بناء مشروع React & Node' : 'Building React Full-Stack App', duration: '25m' },
    { name: isRtl ? 'طارق من الرياض' : 'Tariq (Saudi Arabia)', task: isRtl ? 'أساسيات أنظمة Linux' : 'Linux System Administration', duration: '50m' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      
      {/* Background Ambient Glow Circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -start-1/4 w-[600px] h-[600px] rounded-full bg-blue-600/15 blur-[140px] animate-pulse" />
        <div className="absolute -bottom-1/4 -end-1/4 w-[600px] h-[600px] rounded-full bg-purple-600/15 blur-[140px] animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      <div className={cn(
        "relative w-full bg-card border border-border/80 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden transition-all duration-300",
        isFullscreen ? "h-full max-w-none rounded-none border-none" : "max-w-4xl max-h-[92vh] h-[640px]"
      )}>
        
        {/* TOP BAR */}
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between gap-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-foreground">
                  {isRtl ? 'غرفة الدراسة الافتراضية وجلسات بومودورو' : 'Virtual Co-Working Study Room'}
                </h2>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>{onlineLearnersCount} {isRtl ? 'يدرسون معك الآن' : 'online now'}</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {isRtl ? 'بيئة تركيز نقية مع أصوات طبيعية ومؤقت بومودورو متزامن.' : 'Distraction-free focus environment with procedural soundscapes.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CENTER MAIN STAGE: BIG POMODORO CLOCK & SOUNDSCAPES */}
        <div className="p-6 sm:p-8 flex-1 flex flex-col items-center justify-center text-center space-y-6 overflow-y-auto">
          
          {/* Active Goal / Task Input */}
          <div className="w-full max-w-md relative">
            <Target className="absolute inset-y-0 start-3 my-auto w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={taskInput}
              onChange={e => {
                setTaskInput(e.target.value);
                setActiveTaskTitle(e.target.value);
              }}
              placeholder={isRtl ? 'ما هو موضوع دراستك في هذه الجلسة؟ (مثال: اختبار اختراق الويب)' : 'What are you working on right now? (e.g. Linux Kernel internals)'}
              className="w-full ps-9 pe-4 py-2.5 rounded-2xl bg-muted/30 border border-border/80 text-xs sm:text-sm font-semibold text-center text-foreground placeholder:text-muted-foreground outline-none focus:border-primary shadow-xs"
            />
          </div>

          {/* Mode Selector (25m Focus / 50m Deep / 5m Break / 15m Long Break) */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/40 border border-border/60">
            <button
              onClick={() => startFocus(25, 'work', taskInput)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                mode === 'work' && initialDuration === 25 * 60
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              25m {isRtl ? 'تركيز' : 'Pomodoro'}
            </button>

            <button
              onClick={() => startFocus(50, 'work', taskInput)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                mode === 'work' && initialDuration === 50 * 60
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              50m {isRtl ? 'تركيز عميق' : 'Deep Work'}
            </button>

            <button
              onClick={() => startFocus(5, 'break')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                mode === 'break' && initialDuration === 5 * 60
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              5m {isRtl ? 'استراحة' : 'Short Rest'}
            </button>

            <button
              onClick={() => startFocus(15, 'break')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                mode === 'break' && initialDuration === 15 * 60
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              15m {isRtl ? 'راحة مطولة' : 'Long Rest'}
            </button>
          </div>

          {/* Giant Aesthetic Digital Clock */}
          <div className="space-y-2 select-none">
            <div className={cn(
              "text-6xl sm:text-8xl md:text-9xl font-black font-mono tracking-tighter transition-colors drop-shadow-md",
              mode === 'break' ? "text-amber-500" : "text-foreground"
            )}>
              {timeFormatted}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className={cn(
                "w-2 h-2 rounded-full",
                isRunning ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"
              )} />
              <span>
                {isRunning
                  ? (isRtl ? 'جلسة التركيز قيد التشغيل' : 'Focus session in progress')
                  : (isRtl ? 'المؤقت متوقف مؤقتاً' : 'Timer paused')}
              </span>
            </div>
          </div>

          {/* Clock Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (isRunning) {
                  pauseFocus();
                } else {
                  resumeFocus();
                }
              }}
              className={cn(
                "px-8 py-3.5 rounded-2xl text-sm font-black shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95",
                isRunning
                  ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
                  : "bg-primary hover:bg-primary/95 text-primary-foreground"
              )}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isRunning ? (isRtl ? 'إيقاف مؤقت' : 'Pause') : (isRtl ? 'بدء التركيز' : 'Start Focus')}</span>
            </button>

            <button
              onClick={resetFocus}
              className="p-3.5 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* PROCEDURAL AMBIENT SOUND CONTROLLER */}
          <div className="w-full max-w-lg bg-card/90 border border-border/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary" />
                <span>{isRtl ? 'أصوات التركيز الهادئة (Lo-Fi Ambience)' : 'Focus Audio Ambience'}</span>
              </div>
              <button
                onClick={handleToggleAudio}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
                  isPlayingAudio
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {isPlayingAudio ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    <span>{isRtl ? 'تعمل الآن' : 'Playing'}</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'تشغيل الصوت' : 'Play Sound'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Presets Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {soundPresets.map(preset => {
                const Icon = preset.icon;
                const isSelected = activeSound === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleChangeSound(preset.id as AmbientSoundType)}
                    className={cn(
                      "p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer",
                      isSelected
                        ? "bg-primary/10 border-primary text-primary shadow-xs"
                        : "bg-muted/30 border-border/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] truncate w-full text-center">{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Volume Slider */}
            {isPlayingAudio && (
              <div className="flex items-center gap-3 pt-1">
                <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-muted rounded-full cursor-pointer"
                />
                <Volume2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-mono text-muted-foreground w-8">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            )}
          </div>

        </div>

        {/* BOTTOM REALTIME CO-WORKING ACTIVITY STRIP */}
        <div className="p-3.5 sm:p-4 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="font-bold text-foreground">
              {isRtl ? 'نشاط المتعلمين حول العالم:' : 'Recent global focus sessions:'}
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {recentLearners.map((item, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card border border-border/60 text-[11px] shrink-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-foreground">{item.name}</span>
                <span className="text-muted-foreground truncate max-w-[140px]">· {item.task}</span>
                <span className="font-mono text-primary font-bold">{item.duration}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
