import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import YouTube, { YouTubeEvent } from 'react-youtube';
import { useStore } from '../store/useStore';
import { CheckCircle, Lock, PlayCircle, PauseCircle, ArrowLeft, Maximize, Minimize, Youtube, BookOpen, PenTool, Trash2, BadgeCheck, ChevronRight, AlertTriangle, Check, X, Send, LogIn, Loader2, Award, Eye, ThumbsUp, MessageSquare, Users, RefreshCw, Sparkles, Edit3, Search, Download, Copy, Bold, Italic, Highlighter, List, Code, Tag, Clock, Subtitles, Settings, Gauge, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { ScrollingText } from '../components/ScrollingText';
import { SEO } from '../components/SEO';
import { cn, filterByLanguage } from '../lib/utils';
import { isCertificateEligible, resolveCourseEducator } from '../lib/courseUtils';
import { syncCourseRealtimeWithYouTube, formatCompactNumber, formatFullNumber } from '../lib/youtube';
import { addOrUpdateCourse } from '../lib/firestoreContent';
import { FavoriteButton } from '../components/FavoriteButton';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, setDoc, query, where, onSnapshot, deleteDoc, doc, orderBy, getDocs } from 'firebase/firestore';
import { signInWithPopup } from 'firebase/auth';
import { db, auth, googleProvider } from '../firebase';

export function Course() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { progress, markVideoCompleted, setCurrentVideo, completeCourse, user, courses, saveVideoTimestamp, language, notifications } = useStore();
  
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isFocusNotesOpen, setIsFocusNotesOpen] = useState(true);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState<boolean>(false);
  const [selectedQuality, setSelectedQuality] = useState<string>('hd1080');
  const [availableQualities, setAvailableQualities] = useState<string[]>(['hd1080', 'hd720', 'large', 'medium', 'small', 'auto']);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerState, setPlayerState] = useState(-1);
  const [hasError, setHasError] = useState(false);
  const [reportedVideos, setReportedVideos] = useState<Record<string, boolean>>({});
  const [isReporting, setIsReporting] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportIssueType, setReportIssueType] = useState('Video unavailable / deleted on YouTube');
  const [reportNotes, setReportNotes] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [reportAsGuest, setReportAsGuest] = useState(false);
  const [reportStatus, setReportStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [reportErrorMessage, setReportErrorMessage] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'playlist'|'notes'>('playlist');
  const [noteText, setNoteText] = useState('');
  const [noteTag, setNoteTag] = useState<'idea' | 'important' | 'code' | 'question'>('important');
  const [noteLockedTimestamp, setNoteLockedTimestamp] = useState<number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [editingNoteTag, setEditingNoteTag] = useState<'idea' | 'important' | 'code' | 'question'>('important');
  const [noteFilterScope, setNoteFilterScope] = useState<'all' | 'current'>('all');
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);
  const [liveStats, setLiveStats] = useState<{
    viewCount: number;
    likeCount: number;
    commentCount: number;
    subscriberCount: number;
    subscriberCountText: string;
  }>({
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    subscriberCount: 0,
    subscriberCountText: '',
  });
  const [newPlaylistVideosBanner, setNewPlaylistVideosBanner] = useState<number>(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialStartTimeRef = useRef<number>(0);
  const loadedVideoIdRef = useRef<string>('');
  const progressBarRef = useRef<HTMLDivElement>(null);

  const course = courses.find((c) => c.id === courseId);
  const courseVideos = course ? filterByLanguage(course.videos, language) : [];
  const courseProgress = progress[courseId || ''] || { completedVideoIds: [], currentVideoId: courseVideos[0]?.id, videoTimestamps: {} };

  const currentVideoIndex = courseVideos.findIndex(v => v.id === courseProgress.currentVideoId) !== -1 
    ? courseVideos.findIndex(v => v.id === courseProgress.currentVideoId)
    : 0;
  const currentVideo = courseVideos[currentVideoIndex];

  // Capture start time once when video changes to prevent reload loop during playback
  if (currentVideo && loadedVideoIdRef.current !== currentVideo.id) {
    loadedVideoIdRef.current = currentVideo.id;
    initialStartTimeRef.current = courseProgress.videoTimestamps?.[currentVideo.id] || 0;
  }

  // Safe normalized video ID
  const cleanVideoId = useMemo(() => {
    if (!currentVideo?.youtubeId) return '';
    const raw = currentVideo.youtubeId.trim();
    const match = raw.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (match && match[1]) return match[1];
    const listMatch = raw.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (listMatch && listMatch[1]) return listMatch[1];
    return raw;
  }, [currentVideo?.youtubeId]);

  const isPlaylistType = useMemo(() => {
    if (!cleanVideoId) return false;
    return (
      cleanVideoId.startsWith('PL') || 
      cleanVideoId.startsWith('UU') || 
      cleanVideoId.startsWith('FL') || 
      cleanVideoId.startsWith('RD') || 
      cleanVideoId.length >= 15
    );
  }, [cleanVideoId]);

  // Player options are stable and only update when current video changes
  const playerOpts = useMemo(() => {
    return {
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        start: Math.floor(initialStartTimeRef.current || 0),
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        cc_load_policy: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        playsinline: 1,
        vq: selectedQuality === 'auto' ? 'hd1080' : selectedQuality,
        ...(isPlaylistType ? { listType: 'playlist', list: cleanVideoId } : {})
      },
    };
  }, [currentVideo?.id, cleanVideoId, isPlaylistType]);

  // Reliable Back button handler that works across direct entry, history, masterclasses, and courses
  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Exit fullscreen / focus mode first if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    const fallbackRoute = course?.isSingleVideo ? '/masterclasses' : '/courses';
    const historyIdx = window.history?.state?.idx;

    if (typeof historyIdx === 'number' && historyIdx > 0) {
      navigate(-1);
    } else if (location.key && location.key !== 'default') {
      navigate(-1);
    } else {
      navigate(fallbackRoute);
    }
  };

  // Toggle Subtitles / Closed Captions (Enable or Disable inside video)
  const toggleSubtitles = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextState = !subtitlesEnabled;
    setSubtitlesEnabled(nextState);
    const p = playerRef.current;
    if (!p) return;
    try {
      if (nextState) {
        if (typeof p.loadModule === 'function') {
          p.loadModule('captions');
          p.loadModule('cc');
        }
        const trackLang = language === 'ar' ? 'ar' : 'en';
        if (typeof p.setOption === 'function') {
          p.setOption('captions', 'track', { languageCode: trackLang });
          p.setOption('cc', 'track', { languageCode: trackLang });
        }
      } else {
        if (typeof p.setOption === 'function') {
          p.setOption('captions', 'track', {});
          p.setOption('cc', 'track', {});
        }
        if (typeof p.unloadModule === 'function') {
          p.unloadModule('captions');
          p.unloadModule('cc');
        }
      }
    } catch (err) {
      console.warn('Subtitle toggle warning:', err);
    }
  };

  // Change Video Quality & Playback Speed
  const handleSelectQuality = (q: string) => {
    setSelectedQuality(q);
    setIsQualityMenuOpen(false);
    const p = playerRef.current;
    if (!p) return;
    try {
      if (typeof p.setPlaybackQuality === 'function') {
        p.setPlaybackQuality(q === 'auto' ? 'default' : q);
      }
      if (typeof p.setPlaybackQualityRange === 'function' && q !== 'auto') {
        p.setPlaybackQualityRange(q, q);
      }
    } catch (err) {
      console.warn('Set quality warning:', err);
    }
  };

  const handleSelectPlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    const p = playerRef.current;
    if (!p) return;
    try {
      if (typeof p.setPlaybackRate === 'function') {
        p.setPlaybackRate(rate);
      }
    } catch (err) {
      console.warn('Set playback rate warning:', err);
    }
  };

  const qualityLabelMap: Record<string, string> = {
    highres: '4K Ultra HD',
    hd2160: '4K (2160p)',
    hd1440: '2K (1440p)',
    hd1080: '1080p Full HD',
    hd720: '720p HD',
    large: '480p SD',
    medium: '360p',
    small: '240p',
    auto: language === 'ar' ? 'تلقائي (Auto HD)' : 'Auto (Best HD)',
  };

  const qualityBadgeShort = (q: string) => {
    if (q === 'highres' || q === 'hd2160') return '4K';
    if (q === 'hd1440') return '2K';
    if (q === 'hd1080') return '1080p HD';
    if (q === 'hd720') return '720p HD';
    if (q === 'large') return '480p';
    if (q === 'medium') return '360p';
    if (q === 'small') return '240p';
    return 'HD';
  };

  // Interactive scrubber / seek bar
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !playerRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = Math.floor(newPercentage * duration);
    setCurrentTime(newTime);
    try {
      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(newTime, true);
      }
    } catch (err) {
      console.warn("Seek error:", err);
    }
  };

  const localNotesKey = useMemo(() => {
    const uid = user?.uid || 'guest';
    return `skilliq_smart_notes_${uid}_${course?.id || 'default'}`;
  }, [user?.uid, course?.id]);

  const readLocalNotes = (): any[] => {
    try {
      const raw = localStorage.getItem(localNotesKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  };

  const writeLocalNotes = (list: any[]) => {
    try {
      localStorage.setItem(localNotesKey, JSON.stringify(list));
    } catch {}
  };

  useEffect(() => {
    if (!course) return;
    // Load local backup immediately so notes are always available right away
    const cached = readLocalNotes();
    if (cached.length > 0) {
      setNotes(cached);
    }

    if (!user || user.uid === '1') return;
    
    const q = query(
      collection(db, 'users', user.uid, 'notes'),
      where('courseId', '==', course.id)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const dbNotes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Merge with any unsynced local notes
      const localList = readLocalNotes();
      const map = new Map<string, any>();
      localList.forEach(item => {
        if (item?.id) map.set(item.id, item);
      });
      dbNotes.forEach(item => {
        if (item?.id) map.set(item.id, item);
      });
      const merged = Array.from(map.values()).sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setNotes(merged);
      writeLocalNotes(merged);
    }, (err) => {
      console.warn('Notes Firestore listener fallback to local storage:', err);
    });
    return () => unsub();
  }, [user, course, localNotesKey]);

  const applyNoteFormatting = (type: 'bold' | 'italic' | 'highlight' | 'code' | 'bullet') => {
    const el = noteTextareaRef.current;
    const currentVal = noteText;
    if (!el) return;

    // Lock timestamp on first interaction if not locked yet
    if (noteLockedTimestamp === null) {
      setNoteLockedTimestamp(Math.floor(currentTime || 0));
    }

    const start = el.selectionStart ?? currentVal.length;
    const end = el.selectionEnd ?? currentVal.length;
    const selected = currentVal.slice(start, end);

    let replacement = '';
    if (type === 'bold') {
      replacement = `**${selected || (language === 'ar' ? 'نص عريض' : 'bold text')}**`;
    } else if (type === 'italic') {
      replacement = `*${selected || (language === 'ar' ? 'نص مائل' : 'italic text')}*`;
    } else if (type === 'highlight') {
      replacement = `==${selected || (language === 'ar' ? 'معلومة مهمة' : 'key point')}==`;
    } else if (type === 'code') {
      replacement = `\`${selected || 'code'}\``;
    } else if (type === 'bullet') {
      const prefix = start > 0 && currentVal[start - 1] !== '\n' ? '\n' : '';
      replacement = `${prefix}• ${selected || (language === 'ar' ? 'نقطة رئيسية' : 'Bullet point')}`;
    }

    const updated = currentVal.slice(0, start) + replacement + currentVal.slice(end);
    setNoteText(updated);
    setTimeout(() => {
      el.focus();
      const pos = start + replacement.length;
      el.setSelectionRange(pos, pos);
    }, 10);
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() || !course || !currentVideo) return;
    
    setIsSavingNote(true);
    const captureTime = noteLockedTimestamp !== null ? noteLockedTimestamp : Math.floor(currentTime || 0);
    const noteId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newNoteObj: any = {
      id: noteId,
      courseId: course.id,
      courseTitle: course.title,
      videoId: currentVideo.id,
      videoTitle: currentVideo.title,
      timestamp: captureTime,
      tag: noteTag,
      text: noteText.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      // Save locally immediately for instant UX & offline resilience
      const updatedLocal = [newNoteObj, ...notes];
      setNotes(updatedLocal);
      writeLocalNotes(updatedLocal);
      setNoteText('');
      setNoteLockedTimestamp(null);

      // Persist to Firestore if signed in
      if (user && user.uid !== '1') {
        await setDoc(doc(db, 'users', user.uid, 'notes', noteId), newNoteObj);
      }
    } catch (err) {
      console.warn('Firestore note save warning (saved locally):', err);
    }
    setIsSavingNote(false);
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteText.trim()) return;
    const updatedList = notes.map(n =>
      n.id === noteId
        ? { ...n, text: editingNoteText.trim(), tag: editingNoteTag, updatedAt: new Date().toISOString() }
        : n
    );
    setNotes(updatedList);
    writeLocalNotes(updatedList);
    setEditingNoteId(null);

    if (user && user.uid !== '1') {
      try {
        const target = updatedList.find(n => n.id === noteId);
        if (target) {
          await setDoc(doc(db, 'users', user.uid, 'notes', noteId), target);
        }
      } catch (err) {
        console.warn('Update note in Firestore warning:', err);
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const filtered = notes.filter(n => n.id !== noteId);
    setNotes(filtered);
    writeLocalNotes(filtered);
    if (!user || user.uid === '1') return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notes', noteId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleJumpToNoteTimestamp = (note: any) => {
    if (!course) return;
    const targetSec = Math.floor(note.timestamp || 0);
    if (note.videoId === currentVideo?.id) {
      setCurrentTime(targetSec);
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(targetSec, true);
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
      }
    } else {
      saveVideoTimestamp(course.id, note.videoId, targetSec);
      setCurrentVideo(course.id, note.videoId);
      setTimeout(() => {
        if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
          playerRef.current.seekTo(targetSec, true);
          if (typeof playerRef.current.playVideo === 'function') {
            playerRef.current.playVideo();
          }
        }
      }, 900);
    }
  };

  const handleExportNotes = () => {
    if (!course || notes.length === 0) return;
    const header = `# ${course.title} — Study Notes\nInstructor: ${course.instructor}\nExported: ${new Date().toLocaleDateString()}\n\n---\n\n`;
    const body = notes
      .map((n, i) => {
        const timeStr = formatTime(n.timestamp || 0);
        const tagLabel = n.tag ? `[${String(n.tag).toUpperCase()}] ` : '';
        return `### ${i + 1}. ${tagLabel}${n.videoTitle} (${timeStr})\n${n.text}\n`;
      })
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-notes.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderFormattedNoteText = (rawText: string) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');
    return lines.map((line, lIdx) => {
      const tokens = line.split(/(\*\*.*?\*\*|==.*?==|`.*?`|\*[^*]+\*)/g);
      return (
        <span key={lIdx} className="block min-h-[1.25rem]">
          {tokens.map((tok, tIdx) => {
            if (tok.startsWith('**') && tok.endsWith('**') && tok.length > 4) {
              return <strong key={tIdx} className="font-extrabold text-foreground">{tok.slice(2, -2)}</strong>;
            }
            if (tok.startsWith('==') && tok.endsWith('==') && tok.length > 4) {
              return <mark key={tIdx} className="bg-amber-500/25 text-amber-700 dark:text-amber-300 px-1 rounded font-semibold">{tok.slice(2, -2)}</mark>;
            }
            if (tok.startsWith('`') && tok.endsWith('`') && tok.length > 2) {
              return <code key={tIdx} className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs text-primary border border-border/60">{tok.slice(1, -1)}</code>;
            }
            if (tok.startsWith('*') && tok.endsWith('*') && tok.length > 2) {
              return <em key={tIdx} className="italic text-foreground/90">{tok.slice(1, -1)}</em>;
            }
            return <React.Fragment key={tIdx}>{tok}</React.Fragment>;
          })}
        </span>
      );
    });
  };

  useEffect(() => {
    if (!course) {
      navigate('/');
    }
  }, [course, navigate]);
  
  useEffect(() => {
    // Reset player state when changing videos
    if (currentVideo?.id) {
      setHasError(false);
      setPlayerState(-1);
      setIsPlaying(false);
      const savedTime = courseProgress.videoTimestamps?.[currentVideo.id] || 0;
      setCurrentTime(savedTime);
      setLiveStats({
        viewCount: currentVideo.viewCount || 0,
        likeCount: currentVideo.likeCount || 0,
        commentCount: currentVideo.commentCount || 0,
        subscriberCount: course?.subscriberCount || 0,
        subscriberCountText: course?.subscriberCountText || '',
      });
    }
  }, [currentVideo?.id]);

  // Real-Time YouTube Sync (Views, Likes, Comments, Channel Subscribers & Newly Added Playlist Videos)
  const triggerRealtimeSync = async () => {
    if (!course || !currentVideo) return;
    setIsLiveSyncing(true);
    try {
      const targetVidId = !isPlaylistType ? cleanVideoId : currentVideo.youtubeId;
      const result = await syncCourseRealtimeWithYouTube(course, targetVidId);

      if (result.activeVideoStats) {
        setLiveStats({
          viewCount: result.activeVideoStats.viewCount || currentVideo.viewCount || 0,
          likeCount: result.activeVideoStats.likeCount || currentVideo.likeCount || 0,
          commentCount: result.activeVideoStats.commentCount || currentVideo.commentCount || 0,
          subscriberCount: result.activeVideoStats.subscriberCount || course.subscriberCount || 0,
          subscriberCountText: result.activeVideoStats.subscriberCountText || course.subscriberCountText || '',
        });
      }

      if (result.newVideosAddedCount > 0) {
        setNewPlaylistVideosBanner(prev => prev + result.newVideosAddedCount);
      }

      if (result.hasChanges) {
        // Update local store immediately so all pages reflect the latest YouTube metrics & new playlist videos
        const currentCourses = useStore.getState().courses;
        const updatedCourses = currentCourses.map(c => c.id === course.id ? result.updatedCourse : c);
        useStore.setState({ courses: updatedCourses });

        // Persist to Firestore if authenticated
        if (auth.currentUser) {
          try {
            await setDoc(doc(db, 'courses', course.id), JSON.parse(JSON.stringify(result.updatedCourse)));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Live YouTube sync warning:', err);
    } finally {
      setIsLiveSyncing(false);
    }
  };

  useEffect(() => {
    if (!course?.id || !currentVideo?.id) return;
    triggerRealtimeSync();
    // Periodically refresh real-time stats every 90 seconds while watching
    const interval = setInterval(() => {
      triggerRealtimeSync();
    }, 90000);
    return () => clearInterval(interval);
  }, [course?.id, currentVideo?.id]);

  useEffect(() => {
    const fetchUserReports = async () => {
      if (!user || !currentVideo) return;
      try {
        const q = query(
          collection(db, 'reports'), 
          where('userId', '==', user.uid),
          where('videoId', '==', currentVideo.id),
          where('status', '==', 'pending')
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setReportedVideos(prev => ({...prev, [currentVideo.id]: true}));
        } else {
          setReportedVideos(prev => ({...prev, [currentVideo.id]: false}));
        }
      } catch(e) {
         console.error('Error fetching reports:', e);
      }
    };
    fetchUserReports();
  }, [currentVideo, user]);

  const openReportModal = () => {
    setIsReportModalOpen(true);
    setReportStatus('idle');
    setReportErrorMessage('');
    setReportNotes('');
    setGuestName('');
    setGuestEmail('');
    setReportAsGuest(false);
  };

  const handleSignInAndReport = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Sign in failed:", err);
    }
  };

  const submitReport = async () => {
    if (!currentVideo || !course) return;
    const activeUser = user || auth.currentUser;
    if (!activeUser && !reportAsGuest) {
      setReportAsGuest(true);
      return;
    }
    if (reportStatus === 'submitting') return;
    setReportStatus('submitting');
    setReportErrorMessage('');
    try {
      const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const reportData: any = {
        id: reportId,
        type: 'broken_video',
        courseId: course.id,
        courseTitle: course.title,
        videoId: currentVideo.id,
        videoTitle: currentVideo.title,
        youtubeId: currentVideo.youtubeId || currentVideo.id || 'unknown',
        userId: activeUser ? activeUser.uid : 'guest',
        userName: activeUser 
          ? (activeUser.displayName || activeUser.email?.split('@')[0] || 'Learner')
          : (guestName.trim() || (language === 'ar' ? 'زائر' : 'Guest Learner')),
        userEmail: activeUser ? (activeUser.email || '') : (guestEmail.trim() || ''),
        status: 'pending',
        createdAt: Date.now()
      };
      if (course.category) {
        reportData.categoryId = course.category;
      }
      if (reportIssueType) {
        reportData.issue = reportIssueType;
      }
      if (reportNotes.trim()) {
        reportData.details = reportNotes.trim();
      }

      // 1. Submit to API endpoint (guaranteed to succeed and persist)
      let apiSuccess = false;
      try {
        const res = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData)
        });
        if (res.ok) {
          apiSuccess = true;
        }
      } catch (err) {
        console.warn('Backend /api/reports error:', err);
      }

      // 2. Also save to Firestore using the EXACT SAME ID (prevents duplicates)
      try {
        await setDoc(doc(db, 'reports', reportId), reportData);
        apiSuccess = true;
      } catch (err) {
        console.warn('Direct Firestore write skipped/denied:', err);
      }

      if (!apiSuccess) {
        throw new Error(language === 'ar' ? 'فشل إرسال البلاغ، يرجى التحقق من الاتصال.' : 'Failed to deliver report.');
      }

      setReportedVideos(prev => ({ ...prev, [currentVideo.id]: true }));
      try {
        const stored = JSON.parse(localStorage.getItem('my_reported_videos') || '{}');
        stored[currentVideo.id] = {
          courseId: course.id,
          courseTitle: course.title,
          videoId: currentVideo.id,
          videoTitle: currentVideo.title,
          reportedAt: Date.now()
        };
        localStorage.setItem('my_reported_videos', JSON.stringify(stored));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
      setReportStatus('success');
    } catch (e: any) {
      console.error("Failed to submit report:", e);
      setReportStatus('error');
      const msg = e.code === 'permission-denied'
        ? (language === 'ar' ? 'حدث خطأ في صلاحيات الوصول لقاعدة البيانات. تم تحديث الإعدادات، يرجى المحاولة ثانية.' : 'Permission denied by database. Settings updated, please try again.')
        : (e.message || (language === 'ar' ? 'تعذر إرسال البلاغ إلى الإدارة، يرجى إعادة المحاولة.' : 'Failed to send report to admin. Please try again.'));
      setReportErrorMessage(msg);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function' && isPlaying) {
        try {
          const time = playerRef.current.getCurrentTime();
          if (typeof time === 'number' && !isNaN(time)) {
            setCurrentTime(time);
            
            // Debounce saving DB write roughly every 15 seconds of active playback
            if (!saveTimeoutRef.current && currentVideo && course) {
              saveTimeoutRef.current = setTimeout(() => {
                saveVideoTimestamp(course.id, currentVideo.id, time);
                saveTimeoutRef.current = null;
              }, 15000);
            }
          }
        } catch (e) {}
      }
    }, 1000);
    return () => {
      clearInterval(interval);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [isPlaying, currentVideo?.id, course?.id]);

  // Save when navigating away or changing tabs
  useEffect(() => {
    return () => {
      if (playerRef.current && playerRef.current.getCurrentTime && currentVideo && course) {
         saveVideoTimestamp(course.id, currentVideo.id, playerRef.current.getCurrentTime());
      }
    }
  }, [currentVideo, course]);

  if (!course) return null;

  const isMasterclass = Boolean(course.isSingleVideo);
  const canEarnCertificate = isCertificateEligible(course);
  const educatorInfo = resolveCourseEducator(course);

  const courseSeoNode = (
    <SEO
      title={`${course.title} by ${course.instructor} – Free ${course.isSingleVideo ? 'Masterclass' : 'Course'} | Skilliq`}
      description={
        course.description ||
        `Watch ${course.title} by ${course.instructor} distraction-free on Skilliq with structured lessons, interactive notes, and a verifiable certificate.`
      }
      image={course.thumbnail}
      canonicalPath={`/course/${course.id}`}
      lang={language === 'ar' ? 'ar' : 'en'}
      keywords={[
        course.title,
        course.instructor,
        course.category,
        course.subCategory || '',
        'free course',
        'Skilliq certificate'
      ].filter(Boolean)}
      breadcrumbs={[
        { name: 'Home', url: '/' },
        {
          name: course.isSingleVideo ? 'Masterclasses' : 'Courses',
          url: course.isSingleVideo ? '/masterclasses' : '/courses'
        },
        { name: course.title, url: `/course/${course.id}` }
      ]}
      schema={[
        {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: course.title,
          description:
            course.description ||
            `Learn ${course.title} with ${course.instructor} on Skilliq.`,
          provider: {
            '@type': 'EducationalOrganization',
            name: 'Skilliq',
            sameAs: typeof window !== 'undefined' ? window.location.origin : 'https://skilliq.vercel.app'
          },
          instructor: {
            '@type': 'Person',
            name: course.instructor
          },
          image: course.thumbnail,
          isAccessibleForFree: true,
          inLanguage: course.language === 'Arabic' ? 'ar' : 'en',
          offers: {
            '@type': 'Offer',
            category: 'Free',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock'
          },
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'online',
            instructor: {
              '@type': 'Person',
              name: course.instructor
            }
          }
        },
        ...(currentVideo && cleanVideoId
          ? [
              {
                '@context': 'https://schema.org',
                '@type': 'VideoObject',
                name: `${course.title} - ${currentVideo.title}`,
                description:
                  currentVideo.description ||
                  course.description ||
                  `Video lesson ${currentVideo.title} from ${course.title} by ${course.instructor}.`,
                thumbnailUrl: [
                  course.thumbnail || `https://img.youtube.com/vi/${cleanVideoId}/maxresdefault.jpg`
                ],
                uploadDate: course.createdAt
                  ? new Date(course.createdAt).toISOString()
                  : '2025-01-01T00:00:00.000Z',
                embedUrl: `https://www.youtube.com/embed/${cleanVideoId}`
              }
            ]
          : [])
      ]}
    />
  );

  if (!user) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
        {courseSeoNode}
        <div className="max-w-3xl w-full bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-border/60">
            <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
              {course.category} {course.subCategory ? `· ${course.subCategory}` : ''}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
              {course.title}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground mb-4">
              Instructor: <span className="text-foreground">{course.instructor}</span> · {courseVideos.length} Lessons · 100% Free
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {course.description}
            </p>
          </div>

          {courseVideos.length > 0 && (
            <div className="p-6 sm:p-8 bg-muted/20 border-b border-border/60 max-h-60 overflow-y-auto">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Course Syllabus & Video Lessons ({courseVideos.length})
              </h2>
              <ol className="space-y-2 text-xs sm:text-sm text-foreground/90 list-decimal list-inside">
                {courseVideos.map((v) => (
                  <li key={v.id} className="truncate">
                    <span className="font-medium">{v.title}</span>
                    {v.duration ? <span className="text-muted-foreground ms-2">({v.duration})</span> : null}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="p-6 sm:p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Login Required to Start Learning</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {canEarnCertificate
                ? 'Sign in for free to watch in Cinema Focus Mode, save your timestamps, take notes, and earn your verifiable certificate.'
                : 'Sign in for free to watch this masterclass in Cinema Focus Mode, save your timestamps, and take interactive notes.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/courses"
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                Browse Catalog
              </Link>
              <Link
                to="/"
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                Return to Home & Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleVideoEnd = (event?: YouTubeEvent) => {
    if (!currentVideo) return;
    const nextVideo = courseVideos[currentVideoIndex + 1];
    markVideoCompleted(course.id, currentVideo.id, nextVideo?.id);
    
    if (!nextVideo) {
      completeCourse(course.id);
    }
  };

  const handleReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    setDuration(event.target.getDuration());
    setPlayerState(event.target.getPlayerState());

    // Enforce preferred HD quality & subtitle preference on ready
    try {
      const targetQ = selectedQuality === 'auto' ? 'hd1080' : selectedQuality;
      if (typeof event.target.setPlaybackQuality === 'function') {
        event.target.setPlaybackQuality(targetQ);
      }
      if (typeof event.target.setPlaybackQualityRange === 'function' && selectedQuality !== 'auto') {
        event.target.setPlaybackQualityRange(targetQ, targetQ);
      }
      if (!subtitlesEnabled) {
        if (typeof event.target.setOption === 'function') {
          event.target.setOption('captions', 'track', {});
          event.target.setOption('cc', 'track', {});
        }
        if (typeof event.target.unloadModule === 'function') {
          event.target.unloadModule('captions');
          event.target.unloadModule('cc');
        }
      }
    } catch {}
    
    // Try to autoplay via JS if possible
    if (courseProgress.currentVideoId) {
      event.target.playVideo();
    }
  };

  const handleStateChange = (event: YouTubeEvent) => {
    setPlayerState(event.data);
    if (event.data === YouTube.PlayerState.PLAYING) {
      setIsPlaying(true);
      setDuration(event.target.getDuration());

      // Detect available quality levels from YouTube stream and enforce user's chosen quality & subtitle state
      try {
        if (typeof event.target.getAvailableQualityLevels === 'function') {
          const levels = event.target.getAvailableQualityLevels();
          if (Array.isArray(levels) && levels.length > 0) {
            setAvailableQualities(levels.filter((l: string) => l !== 'tiny'));
          }
        }
        if (selectedQuality !== 'auto' && typeof event.target.setPlaybackQuality === 'function') {
          event.target.setPlaybackQuality(selectedQuality);
        }
        if (!subtitlesEnabled) {
          if (typeof event.target.setOption === 'function') {
            event.target.setOption('captions', 'track', {});
            event.target.setOption('cc', 'track', {});
          }
          if (typeof event.target.unloadModule === 'function') {
            event.target.unloadModule('captions');
            event.target.unloadModule('cc');
          }
        }
      } catch {}
    } else {
      setIsPlaying(false);
    }
  };

  const toggleFocusMode = () => {
    if (!isFocusMode) {
      setIsFocusMode(true);
      setIsFocusNotesOpen(true);
      setSidebarTab('notes');
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      setIsFocusMode(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFocusMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (timeInSeconds: number) => {
    if (!timeInSeconds) return "00:00";
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    try {
      if (typeof playerRef.current.getPlayerState !== 'function') return;
      
      const currentState = playerRef.current.getPlayerState();
      
      if (currentState === 1 || currentState === 3) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (err) {
      console.warn("YouTube Player API error", err);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-[100dvh] w-full bg-background overflow-hidden relative",
        isFocusMode
          ? isFocusNotesOpen
            ? "fixed inset-0 z-[100] flex flex-col lg:grid lg:grid-cols-[1fr_360px] bg-black"
            : "fixed inset-0 z-[100] flex flex-col bg-black"
          : "flex flex-col lg:grid lg:grid-cols-[1fr_340px]"
      )}
    >
      {courseSeoNode}
      {/* Main Content Area */}
      <div className={cn("flex flex-col flex-1 min-h-0 overflow-y-auto w-full", isFocusMode ? "bg-black" : "bg-background")}>
        {/* Top Bar (Hidden in Focus Mode) */}
        {!isFocusMode && (
          <div className="h-16 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 bg-card border-b border-border z-20 sticky top-0">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all group cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 rtl:rotate-180 transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5" />
              <span className="font-bold text-sm">{t('back', language === 'ar' ? 'رجوع' : 'Back')}</span>
            </button>
            <h2 className="font-semibold hidden md:block truncate max-w-md px-3">{course.title}</h2>
            <button 
              type="button"
              onClick={toggleFocusMode}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-bold text-xs sm:text-sm cursor-pointer"
            >
              <Maximize className="w-4 h-4" />
              <span>{t('focus_mode')}</span>
            </button>
          </div>
        )}

        {/* Video Section */}
        <div className={cn("flex-none lg:flex-1 shrink-0 flex flex-col", isFocusMode ? "p-0" : "p-3 md:p-6 gap-3 md:gap-4")}>
          {/* Recent Admin Fix Banner */}
          {!isFocusMode && currentVideo && notifications.some(n => (n.type === 'video_fixed' || n.title?.includes('Fixed')) && ((n as any).videoId === currentVideo.id || n.link?.includes(currentVideo.id) || (n as any).courseId === course.id)) && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-xs animate-in fade-in duration-300">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500 stroke-[2.5]" />
              <div className="flex-1">
                <span className="font-extrabold block">
                  {language === 'ar' ? '🎉 تم إصلاح هذا الفيديو بنجاح بواسطة الإدارة!' : '🎉 This Lesson Video Was Fixed by Admin!'}
                </span>
                <span className="text-[11px] opacity-90 font-normal">
                  {language === 'ar'
                    ? 'تم فحص الرابط وتحديثه بنجاح، يمكنك الآن متابعة التعلم والتقدم في دورتك بكل سلاسة.'
                    : 'The video stream was verified and updated. You can now enjoy continuous learning seamlessly.'}
                </span>
              </div>
            </div>
          )}

          <div className={cn("relative w-full flex flex-col bg-black", isFocusMode ? "h-full" : "aspect-video rounded-xl overflow-hidden")}>
            {currentVideo ? (
              <>
                <div className="flex-1 relative bg-black flex flex-col group">
                  {/* YouTube Player */}
                  <div className="absolute inset-0 w-full h-full">
                    <YouTube
                      key={currentVideo.id}
                      videoId={!isPlaylistType ? cleanVideoId : undefined}
                      opts={playerOpts}
                      onReady={handleReady}
                      onStateChange={handleStateChange}
                      onEnd={handleVideoEnd}
                      onError={(e) => {
                        console.error("YouTube Player Error", e.data);
                        setHasError(true);
                      }}
                      className="absolute inset-0 w-full h-full"
                      iframeClassName="w-full h-full"
                    />

                    {/* Proactive Broken Video Overlay when YouTube errors */}
                    {hasError && (
                      <div className="absolute inset-0 bg-black/95 z-30 flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-white text-base sm:text-lg font-bold">
                          {language === 'ar' ? 'هذا الدرس غير متاح حالياً على YouTube' : 'This Video is Unavailable on YouTube'}
                        </h3>
                        <p className="text-white/70 text-xs sm:text-sm max-w-md">
                          {language === 'ar'
                            ? 'ربما تم حذف الفيديو من المصدر أو جعله خاصاً. يمكنك إرسال بلاغ فوري للإدارة لاستبداله.'
                            : 'This video may have been removed or set to private. Report it now so our administrators can replace it.'}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); openReportModal(); }}
                          disabled={currentVideo && reportedVideos[currentVideo.id]}
                          className={cn(
                            "px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer",
                            (currentVideo && reportedVideos[currentVideo.id])
                              ? "bg-amber-500 text-white cursor-default"
                              : "bg-red-600 hover:bg-red-700 text-white active:scale-98"
                          )}
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>
                            {(currentVideo && reportedVideos[currentVideo.id])
                              ? (language === 'ar' ? 'تم استلام البلاغ (قيد المراجعة)' : 'Reported (Pending Review)')
                              : (language === 'ar' ? 'إبلاغ عن الفيديو الآن' : 'Report Broken Video')}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Custom Seekable Progress Bar */}
                <div 
                  ref={progressBarRef}
                  onClick={handleSeek}
                  className="h-2 w-full bg-white/20 hover:bg-white/30 relative cursor-pointer z-20 group transition-all"
                  title="Click to seek"
                >
                  <div 
                    className="absolute top-0 start-0 h-full bg-red-600 group-hover:bg-red-500 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2 shadow"
                    style={{ left: `${progressPercentage}%` }}
                  />
                </div>
                <div className="px-3 sm:px-4 py-2.5 flex flex-wrap justify-between items-center gap-2 bg-black/95 z-20 sticky bottom-0 border-t border-white/10">
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                      className="text-white hover:text-primary transition-colors focus:outline-none cursor-pointer px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15"
                    >
                      {(playerState === 1 || playerState === 3) ? (
                        <span className="font-bold tracking-widest text-[11px] uppercase">PAUSE</span>
                      ) : (
                        <span className="font-bold tracking-widest text-[11px] uppercase">PLAY</span>
                      )}
                    </button>
                    <span className="text-white/80 text-xs sm:text-sm font-mono font-medium tracking-wide">
                      {hasError ? 'Video Unavailable' : `${formatTime(currentTime)} / ${formatTime(duration)}`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 relative">
                    {/* Subtitles (CC) Enable / Disable Toggle */}
                    <button
                      type="button"
                      onClick={toggleSubtitles}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer",
                        subtitlesEnabled
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-white/10 hover:bg-white/20 text-white/85 border-white/15"
                      )}
                      title={
                        subtitlesEnabled
                          ? (language === 'ar' ? 'إيقاف الترجمة (CC مفعلة)' : 'Disable Subtitles (CC On)')
                          : (language === 'ar' ? 'تفعيل الترجمة (CC معطلة)' : 'Enable Subtitles (CC Off)')
                      }
                    >
                      <Subtitles className="w-3.5 h-3.5" />
                      <span>{subtitlesEnabled ? (language === 'ar' ? 'الترجمة: مفعلة' : 'CC: ON') : (language === 'ar' ? 'الترجمة: متوقفة' : 'CC: OFF')}</span>
                    </button>

                    {/* Video Quality & Speed Selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsQualityMenuOpen(prev => !prev);
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer",
                          isQualityMenuOpen
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-white/10 hover:bg-white/20 text-white/90 border-white/15"
                        )}
                        title={language === 'ar' ? 'تغيير جودة الفيديو وسرعة التشغيل' : 'Video Quality & Playback Speed'}
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>{qualityBadgeShort(selectedQuality)}</span>
                        {playbackRate !== 1 && (
                          <span className="text-[10px] px-1 rounded bg-white/20">{playbackRate}x</span>
                        )}
                      </button>

                      {isQualityMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-full end-0 mb-2 w-56 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/15 shadow-2xl p-3 text-white z-50 space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-white/60 mb-1.5 px-1">
                              <span>{language === 'ar' ? 'جودة الفيديو' : 'Video Quality'}</span>
                              <button
                                type="button"
                                onClick={() => setIsQualityMenuOpen(false)}
                                className="text-white/60 hover:text-white cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {(['hd1080', 'hd720', 'large', 'medium', 'auto'] as const).map((qKey) => (
                                <button
                                  key={qKey}
                                  type="button"
                                  onClick={() => handleSelectQuality(qKey)}
                                  className={cn(
                                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                                    selectedQuality === qKey
                                      ? "bg-primary text-primary-foreground"
                                      : "hover:bg-white/10 text-white/85"
                                  )}
                                >
                                  <span>{qualityLabelMap[qKey] || qKey}</span>
                                  {selectedQuality === qKey && <Check className="w-3.5 h-3.5" />}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-white/10">
                            <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/60 mb-1.5 px-1 flex items-center gap-1">
                              <Gauge className="w-3 h-3" />
                              <span>{language === 'ar' ? 'سرعة التشغيل' : 'Playback Speed'}</span>
                            </div>
                            <div className="grid grid-cols-5 gap-1">
                              {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                <button
                                  key={rate}
                                  type="button"
                                  onClick={() => handleSelectPlaybackRate(rate)}
                                  className={cn(
                                    "py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer text-center",
                                    playbackRate === rate
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-white/10 hover:bg-white/20 text-white/80"
                                  )}
                                >
                                  {rate}x
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Focus Mode Notes Drawer Button inside bottom control bar when in Focus Mode */}
                    {isFocusMode && (
                      <button
                        type="button"
                        onClick={() => {
                          setSidebarTab('notes');
                          setIsFocusNotesOpen(prev => !prev);
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer",
                          isFocusNotesOpen
                            ? "bg-amber-500 text-black border-amber-400 shadow-xs"
                            : "bg-white/10 hover:bg-white/20 text-white border-white/15"
                        )}
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>
                          {isFocusNotesOpen
                            ? (language === 'ar' ? 'إخفاء الملاحظات' : 'Hide Notes')
                            : (language === 'ar' ? 'تدوين ملاحظة' : 'Take Notes')}
                        </span>
                      </button>
                    )}

                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openReportModal(); }}
                      disabled={isReporting || (currentVideo && reportedVideos[currentVideo.id])}
                      className={cn(
                        "px-2.5 py-1 font-bold rounded-lg text-[11px] shadow transition-colors cursor-pointer",
                        (currentVideo && reportedVideos[currentVideo.id])
                          ? "bg-amber-500 text-white cursor-default" 
                          : "bg-red-500 hover:bg-red-600 text-white active:scale-98"
                      )}
                    >
                      {(currentVideo && reportedVideos[currentVideo.id]) 
                        ? (language === 'ar' ? 'البلاغ قيد المراجعة' : 'Report not solved yet') 
                        : (language === 'ar' ? 'إبلاغ عن فيديو معطل' : 'Report Broken Video')}
                    </button>
                    
                    {progressPercentage >= 95 || (courseProgress && currentVideo && courseProgress.completedVideoIds.includes(currentVideo.id)) ? (
                      currentVideoIndex < courseVideos.length - 1 ? (
                        <button 
                          type="button"
                          onClick={() => setCurrentVideo(course.id, courseVideos[currentVideoIndex + 1].id)}
                          className="px-3 py-1 bg-primary text-primary-foreground font-bold rounded-lg text-[11px] shadow hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                          Next video
                        </button>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => {
                            handleVideoEnd();
                            if (canEarnCertificate) {
                              navigate(`/certificate/${course.id}`);
                            } else {
                              navigate('/dashboard');
                            }
                          }}
                          className="px-3 py-1 bg-green-500 text-white font-bold rounded-lg text-[11px] shadow hover:bg-green-600 transition-colors cursor-pointer"
                        >
                          {canEarnCertificate ? (language === 'ar' ? 'إكمال واستلام الشهادة' : 'Complete & Get Certificate') : 'Complete'}
                        </button>
                      )
                    ) : (
                       !hasError && (
                         <button 
                           disabled
                           className="px-2.5 py-1 bg-white/15 text-white/75 font-bold rounded-lg text-[11px] shadow-sm"
                         >
                           Playing ({Math.round(progressPercentage)}%)
                         </button>
                       )
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-white text-center p-6 flex-1 flex flex-col items-center justify-center z-20">
                <h2 className="text-2xl font-bold mb-4">{t('congratulations')}</h2>
                <p className="mb-6">{t('course_completed_msg')}</p>
                {canEarnCertificate ? (
                  <Link to={`/certificate/${course.id}`} className="px-6 py-3 bg-white text-black rounded-full font-bold shadow hover:shadow-lg hover:bg-gray-100 transition-all active:scale-95 inline-flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span>{t('get_certificate')}</span>
                  </Link>
                ) : (
                  <Link to="/dashboard" className="px-6 py-3 bg-white text-black rounded-full font-bold shadow hover:shadow-lg hover:bg-gray-100 transition-all active:scale-95 inline-flex items-center gap-2">
                    <span>{t('back_to_dashboard', 'Back to Dashboard')}</span>
                  </Link>
                )}
              </div>
            )}

            {/* Focus Mode Overlay Controls (Back, Smart Notes Toggle, Exit Focus Mode) */}
            {isFocusMode && (
              <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between pointer-events-none">
                <button
                  type="button"
                  onClick={handleBack}
                  className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-2 bg-black/65 hover:bg-black/85 text-white rounded-full backdrop-blur-md border border-white/15 text-xs font-bold transition-all cursor-pointer shadow-lg"
                >
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                  <span>{t('back', language === 'ar' ? 'رجوع' : 'Back')}</span>
                </button>

                <div className="flex items-center gap-2 pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarTab('notes');
                      setIsFocusNotesOpen(prev => !prev);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full backdrop-blur-md border text-xs font-bold transition-all cursor-pointer shadow-lg",
                      isFocusNotesOpen
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-black/65 hover:bg-black/85 text-white border-white/15"
                    )}
                    title={language === 'ar' ? 'إظهار / إخفاء المفكرة الذكية في وضع التركيز' : 'Toggle Smart Notes in Focus Mode'}
                  >
                    {isFocusNotesOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                    <span>
                      {isFocusNotesOpen
                        ? (language === 'ar' ? 'إخفاء الملاحظات' : 'Hide Notes')
                        : (language === 'ar' ? 'تدوين ملاحظات' : 'Take Notes')}
                    </span>
                    {notes.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                        {notes.length}
                      </span>
                    )}
                  </button>

                  <button 
                    type="button"
                    onClick={toggleFocusMode}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-black/65 hover:bg-black/85 text-white rounded-full backdrop-blur-md border border-white/15 text-xs font-bold transition-all cursor-pointer shadow-lg"
                    title={t('exit_focus_mode')}
                  >
                    <Minimize className="w-4 h-4" />
                    <span className="hidden sm:inline">{language === 'ar' ? 'إنهاء وضع التركيز' : 'Exit Focus'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Video Info (Hidden in Focus Mode) */}
          {!isFocusMode && currentVideo && (
            <div className="flex flex-col gap-4 mt-2">
              {/* Banner when new playlist videos are auto-detected from original creator */}
              {newPlaylistVideosBanner > 0 && (
                <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in duration-300">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>
                      {language === 'ar'
                        ? `تمت مزامنة وإضافة ${newPlaylistVideosBanner} فيديو جديد تلقائياً من قائمة تشغيل المنشئ الأصلي على يوتيوب!`
                        : `${newPlaylistVideosBanner} new lesson(s) from the original creator's YouTube playlist were automatically synced to this course!`}
                    </span>
                  </div>
                  <button
                    onClick={() => setNewPlaylistVideosBanner(0)}
                    className="p-1 rounded-lg hover:bg-emerald-500/20 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-[22px] font-bold text-foreground mb-2">{currentVideo.title}</h1>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    <span>Video {currentVideoIndex + 1} of {courseVideos.length}</span>
                    <span>•</span>
                    <span>{formatTime(duration) !== '00:00' ? formatTime(duration) : (currentVideo.duration || '15:00')}</span>
                    <span>•</span>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold text-xs">{t('core_skill')}</span>
                    
                    {(currentVideo.language || course.language) && (
                       <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-bold text-xs uppercase tracking-wider">
                         {currentVideo.language || course.language}
                       </span>
                    )}
                  </div>
                </div>

                {/* Real-Time YouTube Metrics Bar (Views, Likes, Comments — synced silently in background) */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border shadow-2xs text-xs font-bold text-foreground"
                    title={`${formatFullNumber(liveStats.viewCount || currentVideo.viewCount || course.totalViews)} Real YouTube Views`}
                  >
                    <Eye className="w-3.5 h-3.5 text-primary" />
                    <span>{formatCompactNumber(liveStats.viewCount || currentVideo.viewCount || course.totalViews)}</span>
                    <span className="text-muted-foreground font-medium text-[11px]">
                      {language === 'ar' ? 'مشاهدة' : 'views'}
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border shadow-2xs text-xs font-bold text-foreground"
                    title={`${formatFullNumber(liveStats.likeCount || currentVideo.likeCount || course.totalLikes)} Real YouTube Likes`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{formatCompactNumber(liveStats.likeCount || currentVideo.likeCount || course.totalLikes)}</span>
                    <span className="text-muted-foreground font-medium text-[11px]">
                      {language === 'ar' ? 'إعجاب' : 'likes'}
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border shadow-2xs text-xs font-bold text-foreground"
                    title={`${formatFullNumber(liveStats.commentCount || currentVideo.commentCount || course.totalComments)} Real YouTube Comments`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                    <span>{formatCompactNumber(liveStats.commentCount || currentVideo.commentCount || course.totalComments)}</span>
                    <span className="text-muted-foreground font-medium text-[11px]">
                      {language === 'ar' ? 'تعليق' : 'comments'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Channel Info — Responsive across Mobile, Tablet, and Laptop with tight Verified Badge */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 sm:p-5 bg-card rounded-2xl border border-border shadow-2xs">
                <div className="flex items-center gap-3.5 min-w-0">
                  <Link
                    to={`/creator/${encodeURIComponent(course.instructor || '')}`}
                    className="shrink-0 group relative"
                  >
                    {course.instructorAvatar?.trim() ? (
                      <img
                        src={course.instructorAvatar}
                        alt={course.instructor}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-border group-hover:border-primary transition-colors"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-muted flex items-center justify-center border border-border">
                        <Youtube className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-1.5 max-w-full">
                      <Link
                        to={`/creator/${encodeURIComponent(course.instructor || '')}`}
                        className="font-extrabold text-foreground hover:text-primary transition-colors text-base sm:text-lg truncate"
                      >
                        {educatorInfo.professorName}
                      </Link>
                      <span
                        className="inline-flex items-center justify-center shrink-0"
                        title={language === 'ar' ? 'مدرب موثق' : 'Verified Creator'}
                      >
                        <BadgeCheck className="w-5 h-5 text-white fill-[#1D9BF0] shrink-0" />
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="truncate">
                          {language === 'ar' ? 'قناة يوتيوب:' : 'YouTube Channel:'}{' '}
                          <strong className="text-foreground font-semibold">{educatorInfo.youtubeChannelName}</strong>
                        </span>
                      </span>

                      {(liveStats.subscriberCountText || course.subscriberCountText || liveStats.subscriberCount > 0 || (course.subscriberCount && course.subscriberCount > 0)) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-bold text-[11px] shrink-0">
                          <Users className="w-3 h-3 shrink-0" />
                          <span>
                            {liveStats.subscriberCountText ||
                              course.subscriberCountText ||
                              formatCompactNumber(liveStats.subscriberCount || course.subscriberCount)}{' '}
                            {language === 'ar' ? 'مشترك' : 'subscribers'}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 pt-3 xl:pt-0 border-t xl:border-t-0 border-border/60 shrink-0">
                  <div className="col-span-1 flex">
                    <FavoriteButton
                      itemId={course.id}
                      itemType={isMasterclass ? 'masterclass' : 'playlist'}
                      variant="pill"
                      size="md"
                      className="w-full sm:w-auto justify-center"
                    />
                  </div>

                  <Link 
                    to={`/creator/${encodeURIComponent(course.instructor || '')}`}
                    className="col-span-1 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full font-bold text-xs sm:text-sm hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <span>{language === 'ar' ? 'المزيد من الدروس' : 'See more lessons'}</span>
                    <ChevronRight className="w-4 h-4 rtl:rotate-180 shrink-0" />
                  </Link>

                  {course.instructorUrl && (
                    <a 
                      href={course.instructorUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="col-span-1 px-5 py-2 bg-[#FF0000] text-white rounded-full font-bold text-xs sm:text-sm hover:bg-[#D90000] transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-xs active:scale-95"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
                          fill="#FFFFFF"
                        />
                        <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000" />
                      </svg>
                      <span>{t('subscribe')}</span>
                    </a>
                  )}

                  <button
                    onClick={openReportModal}
                    className={cn(
                      "px-3.5 py-2 rounded-full border border-border/80 hover:border-red-500/40 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
                      course.instructorUrl ? "col-span-1" : "col-span-2 sm:col-span-1"
                    )}
                    title={language === 'ar' ? 'إبلاغ عن مشكلة في الفيديو' : 'Report an issue with this lesson'}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      {language === 'ar' ? 'إبلاغ عن مشكلة' : 'Report Issue'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-2 text-muted-foreground text-[15px] leading-relaxed">
                <span className="font-semibold text-foreground">Course Overview: </span>
                {course.description}
              </div>

              {currentVideo.description && (
                 <div className="mt-2 bg-muted/40 p-4 rounded-xl border border-border/50">
                   <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Video Notes</h3>
                   <p className="text-foreground text-[15px] leading-relaxed whitespace-pre-wrap">
                     {currentVideo.description}
                   </p>
                 </div>
              )}

              {currentVideo.resources && currentVideo.resources.length > 0 && (
                <div className="mt-2 pt-4 border-t border-border">
                  <h3 className="font-bold text-lg mb-3">Resources & Tools (Video)</h3>
                  <div className="flex flex-wrap gap-3">
                    {currentVideo.resources.map((res, i) => (
                      <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 bg-card border border-border hover:border-primary/50 hover:shadow-sm rounded-xl transition-all">
                        {res.logoUrl?.trim() ? (
                          <img src={res.logoUrl} className="w-6 h-6 object-contain" alt="" />
                        ) : (
                          <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                             <span className="text-[10px] font-bold text-muted-foreground">URL</span>
                          </div>
                        )}
                        <span className="font-semibold text-sm">{res.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {course.resources && course.resources.length > 0 && (
                <div className="mt-2 pt-4 border-t border-border">
                  <h3 className="font-bold text-lg mb-3">Course Resources (Global)</h3>
                  <div className="flex flex-wrap gap-3">
                    {course.resources.map((res, i) => (
                      <a key={`course_res_${i}`} href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 bg-card border border-border hover:border-primary/50 hover:shadow-sm rounded-xl transition-all">
                        {res.logoUrl?.trim() ? (
                          <img src={res.logoUrl} className="w-6 h-6 object-contain" alt="" />
                        ) : (
                          <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                             <span className="text-[10px] font-bold text-muted-foreground">URL</span>
                          </div>
                        )}
                        <span className="font-semibold text-sm">{res.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Playlist / Notes (Also available in Focus Mode when Notes panel is open) */}
      <div className={cn(
        "w-full flex flex-col bg-card border-s border-border transition-all duration-150 relative",
        isFocusMode
          ? isFocusNotesOpen
            ? "flex h-[44vh] lg:h-full lg:overflow-hidden z-30 shadow-2xl"
            : "hidden"
          : "flex h-[40vh] lg:h-full lg:overflow-hidden"
      )}>
        <div className="flex border-b border-border shrink-0">
          <button 
            onClick={() => setSidebarTab('playlist')}
            className={cn("flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2", sidebarTab === 'playlist' ? "border-b-2 border-primary text-primary" : "text-muted-foreground")}
          >
            {t('course_content')}
          </button>
          <button 
            onClick={() => setSidebarTab('notes')}
            className={cn("flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer", sidebarTab === 'notes' ? "border-b-2 border-primary text-primary" : "text-muted-foreground")}
          >
            <BookOpen className="w-4 h-4" />
            <span>{language === 'ar' ? 'ملاحظاتي الذكية' : 'Smart Notes'}</span>
            {notes.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-primary/15 text-primary">
                {notes.length}
              </span>
            )}
          </button>
        </div>
        
        {sidebarTab === 'playlist' ? (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b border-border flex flex-col gap-2.5 bg-muted/30 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-muted-foreground">Progress</span>
                <span className="text-sm text-primary font-bold">{courseVideos.length > 0 ? Math.round((courseProgress.completedVideoIds.length / courseVideos.length) * 100) : 0}%</span>
              </div>
              {canEarnCertificate ? (
                courseProgress.isCompleted ? (
                  <Link
                    to={`/certificate/${course.id}`}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <Award className="w-4 h-4" />
                    <span>{language === 'ar' ? 'عرض وتحميل الشهادة الرسمية' : 'View & Download Certificate'}</span>
                  </Link>
                ) : (
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{language === 'ar' ? 'أكمل جميع دروس القائمة للحصول على الشهادة' : 'Complete all playlist lessons to unlock certificate'}</span>
                  </div>
                )
              ) : (
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <PlayCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{language === 'ar' ? 'جلسة ماستركلاس (الشهادات مخصصة لقوائم التشغيل والمسارات)' : 'Masterclass session (Certificates are for Playlists & Paths)'}</span>
                </div>
              )}
            </div>
            {courseVideos.map((video, index) => {
              const isCompleted = courseProgress.completedVideoIds.includes(video.id);
              const isCurrent = currentVideo?.id === video.id;
              const isLocked = index > 0 && !courseProgress.completedVideoIds.includes(courseVideos[index - 1].id);

              return (
                <button
                  key={video.id}
                  disabled={isLocked}
                  onClick={() => !isLocked && setCurrentVideo(course.id, video.id)}
                  className={cn(
                    "w-full text-start flex items-start gap-3 p-4 border-b border-border transition-colors",
                    isCurrent ? "bg-[#F0F7FF] dark:bg-primary/10 border-s-4 border-s-primary" : "hover:bg-muted border-s-4 border-s-transparent",
                    isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                  )}
                >
                  <span className="text-xs font-bold text-muted-foreground min-w-[20px] pt-0.5">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold mb-1 text-foreground">{video.title}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
                      <span>{video.duration}</span>
                      {(video.viewCount && video.viewCount > 0) ? (
                        <span>• {formatCompactNumber(video.viewCount)} {language === 'ar' ? 'مشاهدة' : 'views'}</span>
                      ) : null}
                      {isCompleted ? <span>• Completed</span> : isCurrent ? <span>• Playing {Math.round((currentTime/duration)*100 || 0)}%</span> : null}
                    </div>
                  </div>
                  <div className="ms-auto mt-0.5">
                    {isCompleted ? (
                      <span className="text-[#10B981] font-bold text-sm">✔</span>
                    ) : isCurrent ? (
                      <span className="text-primary font-bold text-sm">●</span>
                    ) : isLocked ? (
                      <span className="text-muted-foreground text-sm">🔒</span>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {/* SMART NOTE COMPOSER */}
            <div className="p-3.5 sm:p-4 border-b border-border bg-card shrink-0 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <PenTool className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-foreground">
                    {language === 'ar' ? 'إضافة ملاحظة عند' : 'Add Note at'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNoteLockedTimestamp(Math.floor(currentTime || 0))}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/15 text-primary font-mono font-bold text-xs hover:bg-primary/25 transition-colors cursor-pointer"
                    title={language === 'ar' ? 'تحديث الوقت الحالي من الفيديو' : 'Sync to current video second'}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(noteLockedTimestamp !== null ? noteLockedTimestamp : currentTime)}</span>
                  </button>
                </div>

                {notes.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportNotes}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-[11px] font-bold transition-colors cursor-pointer"
                    title={language === 'ar' ? 'تحميل جميع ملاحظاتك كملف' : 'Download all notes as Markdown file'}
                  >
                    <Download className="w-3 h-3 text-primary" />
                    <span>{language === 'ar' ? 'تصدير' : 'Export'}</span>
                  </button>
                )}
              </div>

              {/* Note Tag Selector */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {([
                  { id: 'important', label: language === 'ar' ? '⭐ هام' : '⭐ Key Point', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
                  { id: 'idea', label: language === 'ar' ? '💡 فكرة' : '💡 Summary', cls: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' },
                  { id: 'code', label: language === 'ar' ? '💻 كود' : '💻 Code', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
                  { id: 'question', label: language === 'ar' ? '❓ للمراجعة' : '❓ Review', cls: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' },
                ] as const).map(tItem => (
                  <button
                    key={tItem.id}
                    type="button"
                    onClick={() => setNoteTag(tItem.id)}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all shrink-0 cursor-pointer",
                      noteTag === tItem.id
                        ? tItem.cls
                        : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground"
                    )}
                  >
                    {tItem.label}
                  </button>
                ))}
              </div>

              {/* Formatting Toolbar + Textarea */}
              <div className="rounded-xl border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 transition-all">
                <div className="flex items-center justify-between px-2 py-1 bg-muted/40 border-b border-border/60">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => applyNoteFormatting('bold')}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Bold (**text**)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyNoteFormatting('italic')}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Italic (*text*)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyNoteFormatting('highlight')}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-amber-500 cursor-pointer"
                      title="Highlight (==text==)"
                    >
                      <Highlighter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyNoteFormatting('code')}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary cursor-pointer"
                      title="Inline Code (`code`)"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyNoteFormatting('bullet')}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Bullet List"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {language === 'ar' ? 'Ctrl+Enter للحفظ' : 'Ctrl+Enter to save'}
                  </span>
                </div>

                <textarea 
                  ref={noteTextareaRef}
                  dir="auto"
                  value={noteText}
                  onFocus={() => {
                    if (noteLockedTimestamp === null) {
                      setNoteLockedTimestamp(Math.floor(currentTime || 0));
                    }
                  }}
                  onChange={e => {
                    setNoteText(e.target.value);
                    if (!e.target.value.trim()) {
                      setNoteLockedTimestamp(null);
                    }
                  }}
                  onKeyDown={e => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveNote();
                    }
                  }}
                  placeholder={
                    language === 'ar'
                      ? 'اكتب ملاحظاتك أو الأكواد المهمة هنا للرجوع إليها في أي وقت...'
                      : 'Write key takeaways, code snippets, or timestamps to jump back anytime...'
                  }
                  className="w-full bg-transparent p-2.5 text-xs sm:text-sm min-h-[76px] resize-none focus:outline-none text-foreground"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground truncate">
                  {language === 'ar' ? 'محفوظة تلقائياً في حسابك للرجوع إليها دائماً' : 'Auto-synced & saved so you can revisit anytime'}
                </span>
                <button 
                  onClick={handleSaveNote}
                  disabled={isSavingNote || !noteText.trim()}
                  className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-lg shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer shrink-0"
                >
                  {isSavingNote
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : (language === 'ar' ? 'حفظ الملاحظة' : 'Save Note')}
                </button>
              </div>
            </div>

            {/* FILTER & SEARCH BAR FOR SAVED NOTES */}
            {notes.length > 0 && (
              <div className="px-3.5 py-2 border-b border-border bg-muted/20 flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center bg-card border border-border rounded-lg p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setNoteFilterScope('all')}
                      className={cn(
                        "px-2.5 py-1 rounded-md transition-colors cursor-pointer",
                        noteFilterScope === 'all' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {language === 'ar' ? `الكل (${notes.length})` : `All Course (${notes.length})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoteFilterScope('current')}
                      className={cn(
                        "px-2.5 py-1 rounded-md transition-colors cursor-pointer",
                        noteFilterScope === 'current' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {language === 'ar'
                        ? `هذا الدرس (${notes.filter(n => n.videoId === currentVideo?.id).length})`
                        : `This Lesson (${notes.filter(n => n.videoId === currentVideo?.id).length})`}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute start-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={noteSearchQuery}
                    onChange={e => setNoteSearchQuery(e.target.value)}
                    placeholder={language === 'ar' ? 'ابحث في ملاحظاتك المحفوظة...' : 'Search your saved notes...'}
                    className="w-full bg-card border border-border rounded-lg ps-8 pe-7 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {noteSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setNoteSearchQuery('')}
                      className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* SAVED NOTES LIST */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {(() => {
                const filteredNotes = notes.filter(n => {
                  if (noteFilterScope === 'current' && n.videoId !== currentVideo?.id) return false;
                  if (noteSearchQuery.trim()) {
                    const q = noteSearchQuery.toLowerCase();
                    return (
                      n.text?.toLowerCase().includes(q) ||
                      n.videoTitle?.toLowerCase().includes(q) ||
                      n.tag?.toLowerCase().includes(q)
                    );
                  }
                  return true;
                });

                if (filteredNotes.length === 0) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-8 px-4">
                      <BookOpen className="w-9 h-9 mb-2 opacity-40 text-primary" />
                      <p className="text-xs sm:text-sm font-semibold text-foreground text-center mb-1">
                        {notes.length === 0
                          ? (language === 'ar' ? 'لا توجد ملاحظات محفوظة بعد' : 'No saved notes yet')
                          : (language === 'ar' ? 'لا توجد ملاحظات تطابق البحث' : 'No notes match your filter')}
                      </p>
                      <p className="text-[11px] text-center text-muted-foreground max-w-[230px]">
                        {language === 'ar'
                          ? 'سجّل أهم النقاط مع الدقيقة والثانية، وعند الضغط على الوقت سينتقلك الفيديو مباشرة لتلك اللحظة!'
                          : 'Capture key insights with exact video timestamps. Click any timestamp later to jump right back to that moment!'}
                      </p>
                    </div>
                  );
                }

                const tagBadgeMap: Record<string, { label: string; cls: string }> = {
                  important: { label: language === 'ar' ? '⭐ هام' : '⭐ Key Point', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
                  idea: { label: language === 'ar' ? '💡 فكرة' : '💡 Summary', cls: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' },
                  code: { label: language === 'ar' ? '💻 كود' : '💻 Code', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
                  question: { label: language === 'ar' ? '❓ للمراجعة' : '❓ Review', cls: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' },
                };

                return filteredNotes.map(note => {
                  const isEditing = editingNoteId === note.id;
                  const tBadge = note.tag && tagBadgeMap[note.tag] ? tagBadgeMap[note.tag] : null;

                  return (
                    <div
                      key={note.id}
                      className="bg-card border border-border/90 hover:border-primary/40 p-3.5 rounded-2xl flex flex-col relative group shadow-2xs transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <button
                            type="button"
                            onClick={() => handleJumpToNoteTimestamp(note)}
                            className="inline-flex items-center gap-1 bg-primary/15 text-primary hover:bg-primary hover:text-primary-foreground text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer shrink-0"
                            title={language === 'ar' ? 'اضغط للانتقال إلى هذه اللحظة في الفيديو' : 'Click to jump to this exact moment in the video'}
                          >
                            <PlayCircle className="w-3 h-3" />
                            <span>{formatTime(note.timestamp)}</span>
                          </button>

                          {tBadge && (
                            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0", tBadge.cls)}>
                              {tBadge.label}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(note.text || '');
                              setCopiedNoteId(note.id);
                              setTimeout(() => setCopiedNoteId(null), 1500);
                            }}
                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                            title={language === 'ar' ? 'نسخ الملاحظة' : 'Copy note'}
                          >
                            {copiedNoteId === note.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditingNoteText(note.text || '');
                              setEditingNoteTag(note.tag || 'important');
                            }}
                            className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors cursor-pointer"
                            title={language === 'ar' ? 'تعديل الملاحظة' : 'Edit note'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                            title={language === 'ar' ? 'حذف الملاحظة' : 'Delete note'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {note.videoTitle && (
                        <button
                          type="button"
                          onClick={() => handleJumpToNoteTimestamp(note)}
                          className="text-[11px] text-muted-foreground hover:text-primary font-medium truncate text-start mb-1.5 cursor-pointer"
                        >
                          {note.videoTitle}
                        </button>
                      )}

                      {isEditing ? (
                        <div className="space-y-2 mt-1">
                          <textarea
                            dir="auto"
                            value={editingNoteText}
                            onChange={e => setEditingNoteText(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl p-2.5 text-xs sm:text-sm min-h-[70px] resize-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingNoteId(null)}
                              className="px-2.5 py-1 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateNote(note.id)}
                              className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer"
                            >
                              {language === 'ar' ? 'حفظ التعديل' : 'Update'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          dir="auto"
                          className="text-xs sm:text-sm text-foreground leading-relaxed break-words"
                        >
                          {renderFormattedNoteText(note.text)}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>

      {/* MODERN BROKEN VIDEO REPORT MODAL */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div 
            className="fixed inset-0 z-[270] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl p-6 relative overflow-hidden space-y-4"
            >
              {/* Luminous accent gradient */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-primary" />

              <button
                onClick={() => setIsReportModalOpen(false)}
                className="absolute top-4 end-4 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {reportStatus === 'success' ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg animate-in zoom-in-50 duration-300">
                    <Check className="w-8 h-8 text-emerald-500 stroke-[3]" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {language === 'ar' ? '✓ وصل البلاغ للإدارة بنجاح' : '✓ Delivered to Admin Team'}
                    </span>
                    <h3 className="text-lg font-black text-foreground">
                      {language === 'ar' ? 'تم إرسال البلاغ بنجاح إلى الإدارة!' : 'Report Sent to Admin Successfully!'}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      {language === 'ar' 
                        ? 'شكراً لمساعدتك! وصل إشعارك إلى فريق الإدارة وسيقوم بمراجعة الدرس وإصلاحه في أقرب وقت.'
                        : 'Thank you for your report! Our team has received your ticket and will inspect and update the video promptly.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
                  >
                    {language === 'ar' ? 'تم / إغلاق' : 'Done / Close'}
                  </button>
                </div>
              ) : reportStatus === 'error' ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-red-500/15 border border-red-500/30 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg animate-in zoom-in-50 duration-300">
                    <AlertTriangle className="w-8 h-8 text-red-500 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-black">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      {language === 'ar' ? '✕ لم يصل البلاغ' : '✕ Not Delivered'}
                    </span>
                    <h3 className="text-lg font-black text-foreground">
                      {language === 'ar' ? 'تعذر إرسال البلاغ إلى الإدارة' : 'Failed to Send Report to Admin'}
                    </h3>
                    <p className="text-xs text-red-600/90 dark:text-red-400/90 max-w-sm mx-auto leading-relaxed bg-red-500/10 p-3 rounded-2xl border border-red-500/20">
                      {reportErrorMessage || (language === 'ar' ? 'يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.' : 'Please check your connection and try again.')}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setReportStatus('idle')}
                      className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      {language === 'ar' ? 'تعديل البيانات' : 'Edit Report'}
                    </button>
                    <button
                      type="button"
                      onClick={submitReport}
                      className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground">
                        {language === 'ar' ? 'إبلاغ عن مشكلة في الفيديو' : 'Report Broken Video'}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {course?.title} · {currentVideo?.title}
                      </p>
                    </div>
                  </div>

                  {!user && !reportAsGuest ? (
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3.5 text-start">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {language === 'ar'
                          ? 'يمكنك تسجيل الدخول بحساب Google لتلقي إشعار تلقائي فور حل المشكلة، أو المتابعة والإبلاغ كزائر دون تسجيل دخول.'
                          : 'You can sign in with Google to receive an automatic notification when fixed, or continue as guest without signing in.'}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={handleSignInAndReport}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all cursor-pointer shadow-xs active:scale-98"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>{language === 'ar' ? 'تسجيل الدخول والإبلاغ' : 'Sign In with Google'}</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setReportAsGuest(true)}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-bold transition-all cursor-pointer"
                        >
                          <span>{language === 'ar' ? 'الإبلاغ كزائر مباشرة' : 'Continue as Guest'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5 text-start">
                      {reportAsGuest && !user && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-muted/30 rounded-2xl border border-border/70">
                          <div>
                            <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                              {language === 'ar' ? 'اسمك (اختياري):' : 'Your Name (optional):'}
                            </label>
                            <input
                              type="text"
                              value={guestName}
                              onChange={e => setGuestName(e.target.value)}
                              placeholder={language === 'ar' ? 'مثال: أحمد' : 'e.g. Alex'}
                              className="w-full bg-background border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                              {language === 'ar' ? 'بريدك الإلكتروني للإشعار (اختياري):' : 'Email for notification (optional):'}
                            </label>
                            <input
                              type="email"
                              value={guestEmail}
                              onChange={e => setGuestEmail(e.target.value)}
                              placeholder="name@example.com"
                              className="w-full bg-background border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5">
                          {language === 'ar' ? 'نوع المشكلة:' : 'Select the Issue:'}
                        </label>
                        <div className="grid grid-cols-1 gap-1.5">
                          {[
                            { id: 'Video unavailable / deleted on YouTube', label: language === 'ar' ? 'الفيديو محذوف أو غير متاح على YouTube' : 'Video deleted or unavailable on YouTube' },
                            { id: 'Audio is missing or broken', label: language === 'ar' ? 'الصوت مفقود أو غير واضح' : 'Audio is missing or muted' },
                            { id: 'Video is private or restricted', label: language === 'ar' ? 'الفيديو مقفل أو محمي بحقوق النشر' : 'Video is private or copyright blocked' },
                            { id: 'Wrong lesson content', label: language === 'ar' ? 'محتوى الدرس غير مطابق' : 'Wrong video content for this lesson' }
                          ].map(item => (
                            <label
                              key={item.id}
                              className={cn(
                                "flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all",
                                reportIssueType === item.id 
                                  ? "bg-primary/10 border-primary text-foreground font-bold shadow-xs" 
                                  : "bg-card border-border/70 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <input
                                type="radio"
                                name="reportIssue"
                                value={item.id}
                                checked={reportIssueType === item.id}
                                onChange={e => setReportIssueType(e.target.value)}
                                className="w-3.5 h-3.5 text-primary"
                              />
                              <span>{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">
                          {language === 'ar' ? 'ملاحظات إضافية (اختياري):' : 'Additional details (Optional):'}
                        </label>
                        <textarea
                          value={reportNotes}
                          onChange={e => setReportNotes(e.target.value)}
                          placeholder={language === 'ar' ? 'مثال: يبدأ الفيديو من الدقيقة 2 بدون صوت...' : 'e.g. Video stopped working around minute 2:30...'}
                          rows={2}
                          className="w-full bg-background border border-border/80 rounded-xl p-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                        <button
                          type="button"
                          onClick={() => setIsReportModalOpen(false)}
                          className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>

                        <button
                          type="button"
                          disabled={reportStatus === 'submitting'}
                          onClick={submitReport}
                          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-98"
                        >
                          {reportStatus === 'submitting' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span>{reportStatus === 'submitting' ? (language === 'ar' ? 'جاري الإرسال للإدارة...' : 'Sending to Admin...') : (language === 'ar' ? 'إرسال البلاغ للإدارة' : 'Submit Report to Admin')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
