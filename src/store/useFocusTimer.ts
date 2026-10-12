import { create } from 'zustand';
import { awardCustomXP } from '../lib/gamification';
import { useStore } from './useStore';

interface FocusTimerState {
  timeLeft: number;
  initialDuration: number;
  isRunning: boolean;
  mode: 'work' | 'break';
  isMinimized: boolean;
  showFloatingPopup: boolean;
  customMinutesInput: number;
  focusMinutesToday: number;
  hasFinishedModal: boolean;
  activeTaskTitle: string | null;
  startFocus: (minutes?: number, targetMode?: 'work' | 'break', taskTitle?: string) => void;
  startBreak: (minutes?: number) => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  resetFocus: () => void;
  stopFocus: () => void;
  setMinimized: (minimized: boolean) => void;
  setShowFloatingPopup: (show: boolean) => void;
  setCustomMinutesInput: (mins: number) => void;
  setMode: (mode: 'work' | 'break') => void;
  setActiveTaskTitle: (title: string | null) => void;
  tick: () => void;
  dismissFinishedModal: () => void;
}

export function triggerFocusAlarmSoundAndVibrate() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio melody
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const startTime = ctx.currentTime + idx * 0.16;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.6);
      });
    }
  } catch {
    // Audio autoplay policy fallback
  }

  // Physical vibration on mobile / tablet
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([350, 150, 350, 150, 600]);
    }
  } catch {
    // vibration fallback
  }
}

const getTodayDateStr = () => new Date().toISOString().split('T')[0];

const getStoredFocusMinutes = () => {
  try {
    const today = getTodayDateStr();
    return Number(localStorage.getItem(`skilliq_focus_mins_${today}`)) || 0;
  } catch {
    return 0;
  }
};

export const useFocusTimer = create<FocusTimerState>((set, get) => ({
  timeLeft: 25 * 60,
  initialDuration: 25 * 60,
  isRunning: false,
  mode: 'work',
  isMinimized: false,
  showFloatingPopup: false,
  customMinutesInput: 25,
  focusMinutesToday: getStoredFocusMinutes(),
  hasFinishedModal: false,
  activeTaskTitle: null,

  setActiveTaskTitle: (activeTaskTitle) => set({ activeTaskTitle }),

  startFocus: (minutes, targetMode, taskTitle) => {
    const currentMode = targetMode ?? get().mode;
    const defaultMins = minutes ?? get().customMinutesInput;
    const targetMins = Math.max(1, Math.min(180, defaultMins));
    const seconds = targetMins * 60;
    set({
      initialDuration: seconds,
      timeLeft: seconds,
      isRunning: true,
      mode: currentMode,
      isMinimized: false,
      showFloatingPopup: true,
      customMinutesInput: targetMins,
      hasFinishedModal: false,
      ...(taskTitle !== undefined ? { activeTaskTitle: taskTitle } : {}),
    });
  },

  startBreak: (minutes = 5) => {
    const targetMins = Math.max(1, Math.min(60, minutes));
    const seconds = targetMins * 60;
    set({
      initialDuration: seconds,
      timeLeft: seconds,
      isRunning: true,
      mode: 'break',
      isMinimized: false,
      showFloatingPopup: true,
      customMinutesInput: targetMins,
      hasFinishedModal: false,
    });
  },

  pauseFocus: () => set({ isRunning: false }),
  resumeFocus: () => set({ isRunning: true }),

  resetFocus: () => {
    const { initialDuration } = get();
    set({
      timeLeft: initialDuration,
      isRunning: false,
      hasFinishedModal: false,
    });
  },

  stopFocus: () => {
    set({
      isRunning: false,
      showFloatingPopup: false,
      timeLeft: get().initialDuration,
      hasFinishedModal: false,
    });
  },

  setMinimized: (isMinimized) => set({ isMinimized }),
  setShowFloatingPopup: (showFloatingPopup) => set({ showFloatingPopup }),
  setCustomMinutesInput: (customMinutesInput) => set({ customMinutesInput }),

  setMode: (mode) => {
    const defaultMins = mode === 'work' ? 25 : 5;
    const seconds = defaultMins * 60;
    set({
      mode,
      initialDuration: seconds,
      timeLeft: seconds,
      isRunning: false,
      customMinutesInput: defaultMins,
      hasFinishedModal: false,
    });
  },

  tick: () => {
    const { timeLeft, isRunning, mode, initialDuration, focusMinutesToday } = get();
    if (!isRunning) return;

    if (timeLeft > 1) {
      set({ timeLeft: timeLeft - 1 });
    } else {
      // Timer finished!
      triggerFocusAlarmSoundAndVibrate();

      if (mode === 'work') {
        const addedMinutes = Math.round(initialDuration / 60);
        const newTotal = focusMinutesToday + addedMinutes;
        const today = getTodayDateStr();
        try {
          localStorage.setItem(`skilliq_focus_mins_${today}`, String(newTotal));
          window.dispatchEvent(new CustomEvent('skilliq-progress-updated'));
        } catch {}

        // Award +15 XP to user if authenticated and unlock FOCUS_WARRIOR if >= 60m
        const currentUser = useStore.getState().user;
        if (currentUser?.uid) {
          const badgeAward = newTotal >= 60 ? {
            id: 'focus_warrior',
            name: 'Focus Master',
            description: 'Logged 60+ minutes of deep focus',
            icon: '⏱️',
          } : undefined;

          awardCustomXP(currentUser.uid, 15, badgeAward).then((updated) => {
            if (updated) {
              useStore.setState({ publicProfile: updated });
            }
          }).catch(() => {});
        }

        set({
          timeLeft: 5 * 60,
          initialDuration: 5 * 60,
          isRunning: false,
          mode: 'break',
          focusMinutesToday: newTotal,
          hasFinishedModal: true,
          isMinimized: false,
        });
      } else {
        set({
          timeLeft: 25 * 60,
          initialDuration: 25 * 60,
          isRunning: false,
          mode: 'work',
          hasFinishedModal: true,
          isMinimized: false,
        });
      }
    }
  },

  dismissFinishedModal: () => set({ hasFinishedModal: false }),
}));
