import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import YouTube, { YouTubeEvent } from 'react-youtube';
import { useStore } from '../store/useStore';
import { CheckCircle, Lock, PlayCircle, PauseCircle, ArrowLeft, Maximize, Minimize, Youtube, BookOpen, PenTool, Trash2, BadgeCheck, ChevronRight, AlertTriangle, Check, X, Send, LogIn, Loader2 } from 'lucide-react';
import { ScrollingText } from '../components/ScrollingText';
import { cn, filterByLanguage } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, setDoc, query, where, onSnapshot, deleteDoc, doc, orderBy, getDocs } from 'firebase/firestore';
import { signInWithPopup } from 'firebase/auth';
import { db, auth, googleProvider } from '../firebase';

export function Course() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { progress, markVideoCompleted, setCurrentVideo, completeCourse, user, courses, saveVideoTimestamp, language, notifications } = useStore();
  
  const [isFocusMode, setIsFocusMode] = useState(false);
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
  const [notes, setNotes] = useState<any[]>([]);
  const [isSavingNote, setIsSavingNote] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const course = courses.find((c) => c.id === courseId);
  const courseVideos = course ? filterByLanguage(course.videos, language) : [];
  const courseProgress = progress[courseId || ''] || { completedVideoIds: [], currentVideoId: courseVideos[0]?.id, videoTimestamps: {} };

  const currentVideoIndex = courseVideos.findIndex(v => v.id === courseProgress.currentVideoId) !== -1 
    ? courseVideos.findIndex(v => v.id === courseProgress.currentVideoId)
    : 0;
  const currentVideo = courseVideos[currentVideoIndex];

  useEffect(() => {
    if (!user || user.uid === '1' || !course) return;
    
    const q = query(
      collection(db, 'users', user.uid, 'notes'),
      where('courseId', '==', course.id)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const dbNotes = snap.docs.map(d => ({id: d.id, ...d.data()}));
      dbNotes.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotes(dbNotes);
    });
    return () => unsub();
  }, [user, course]);

  const handleSaveNote = async () => {
    if (!noteText.trim() || !user || user.uid === '1' || !course || !currentVideo) return;
    
    setIsSavingNote(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'notes'), {
        courseId: course.id,
        courseTitle: course.title,
        videoId: currentVideo.id,
        videoTitle: currentVideo.title,
        timestamp: currentTime,
        text: noteText.trim(),
        createdAt: new Date().toISOString()
      });
      setNoteText('');
    } catch (err) {
      console.error(err);
    }
    setIsSavingNote(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user || user.uid === '1') return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notes', noteId));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!course) {
      navigate('/');
    }
  }, [course, navigate]);
  
  useEffect(() => {
    // Reset player state when changing videos
    if (courseProgress.currentVideoId) {
      setHasError(false);
      setPlayerState(-1);
      setIsPlaying(false);
      const savedTime = courseProgress.videoTimestamps?.[courseProgress.currentVideoId] || 0;
      setCurrentTime(savedTime);
    }
  }, [courseProgress.currentVideoId]);

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
      if (playerRef.current && playerRef.current.getCurrentTime && isPlaying) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        
        // Debounce saving DB write roughly every 10 seconds of active playback
        if (!saveTimeoutRef.current && currentVideo) {
          saveTimeoutRef.current = setTimeout(() => {
            saveVideoTimestamp(course.id, currentVideo.id, time);
            saveTimeoutRef.current = null;
          }, 10000);
        }
      }
    }, 1000);
    return () => {
      clearInterval(interval);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [isPlaying, currentVideo, course]);

  // Save when navigating away or changing tabs
  useEffect(() => {
    return () => {
      if (playerRef.current && playerRef.current.getCurrentTime && currentVideo && course) {
         saveVideoTimestamp(course.id, currentVideo.id, playerRef.current.getCurrentTime());
      }
    }
  }, [currentVideo, course]);

  if (!course) return null;

  if (!user) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8 bg-card rounded-2xl border border-border shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-muted-foreground mb-6">You need to be logged in to start learning and track your progress.</p>
          <Link to="/" className="text-primary hover:underline">Return to Home</Link>
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
    } else {
      setIsPlaying(false);
    }
  };

  const toggleFocusMode = () => {
    if (!isFocusMode) {
      setIsFocusMode(true);
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
    <div ref={containerRef} className={cn("h-[100dvh] w-full bg-background overflow-hidden relative", isFocusMode ? "fixed inset-0 z-[100] flex flex-col" : "flex flex-col lg:grid lg:grid-cols-[1fr_340px]")}>
      {/* Main Content Area */}
      <div className={cn("flex flex-col flex-1 min-h-0 overflow-y-auto w-full", isFocusMode ? "bg-black" : "bg-background")}>
        {/* Top Bar (Hidden in Focus Mode) */}
        {!isFocusMode && (
          <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-card border-b border-border z-10 sticky top-0">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
              <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
              <span className="font-medium group-hover:underline">{t('back', 'Back')}</span>
            </button>
            <h2 className="font-semibold hidden md:block">{course.title}</h2>
            <button 
              onClick={toggleFocusMode}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium text-sm"
            >
              <Maximize className="w-4 h-4" />
              {t('focus_mode')}
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
                      videoId={(!currentVideo.youtubeId.startsWith('PL') && !currentVideo.youtubeId.startsWith('UU') && !currentVideo.youtubeId.startsWith('FL') && !currentVideo.youtubeId.startsWith('RD') && currentVideo.youtubeId.length < 15) ? currentVideo.youtubeId : undefined}
                      opts={{
                        width: '100%',
                        height: '100%',
                        playerVars: {
                          autoplay: 1,
                          start: courseProgress.videoTimestamps?.[currentVideo.id] || 0,
                          modestbranding: 1,
                          rel: 0,
                          showinfo: 0,
                          iv_load_policy: 3,
                          controls: 0,
                          disablekb: 1,
                          fs: 0,
                          playsinline: 1,
                          ...((currentVideo.youtubeId.startsWith('PL') || currentVideo.youtubeId.startsWith('UU') || currentVideo.youtubeId.startsWith('FL') || currentVideo.youtubeId.startsWith('RD') || currentVideo.youtubeId.length >= 15) ? { listType: 'playlist', list: currentVideo.youtubeId } : {})
                        },
                      }}
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
                
                {/* Custom Progress Bar */}
                <div className="h-1.5 w-full bg-white/20 relative cursor-not-allowed z-20">
                  <div 
                    className="absolute top-0 start-0 h-full bg-red-600 transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="px-4 py-3 flex justify-between items-center bg-black/90 z-20 sticky bottom-0">
                  <div className="flex flex-wrap items-center gap-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                      className="text-white hover:text-primary transition-colors focus:outline-none cursor-pointer"
                    >
                      {(playerState === 1 || playerState === 3) ? <span className="font-bold tracking-widest text-xs uppercase px-2">PAUSE</span> : <span className="font-bold tracking-widest text-xs uppercase px-2">PLAY</span>}
                    </button>
                    <span className="text-white/80 text-xs sm:text-sm font-medium tracking-wide">
                      {hasError ? 'Video Unavailable' : `${formatTime(currentTime)} / ${formatTime(duration)}`}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openReportModal(); }}
                      disabled={isReporting || (currentVideo && reportedVideos[currentVideo.id])}
                      className={cn(
                        "px-3 py-1 font-bold rounded text-xs shadow transition-colors cursor-pointer",
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
                          onClick={() => setCurrentVideo(course.id, courseVideos[currentVideoIndex + 1].id)}
                          className="px-3 py-1 bg-primary text-primary-foreground font-bold rounded text-xs shadow hover:bg-primary/90 transition-colors"
                        >
                          Next video
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            handleVideoEnd();
                            navigate('/dashboard');
                          }}
                          className="px-3 py-1 bg-green-500 text-white font-bold rounded text-xs shadow hover:bg-green-600 transition-colors"
                        >
                          Complete
                        </button>
                      )
                    ) : (
                       !hasError && (
                         <button 
                           disabled
                           className="px-3 py-1 bg-white/20 text-white/70 font-bold rounded text-xs shadow-sm"
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
                <Link to="/dashboard" className="px-6 py-3 bg-white text-black rounded-full font-bold shadow hover:shadow-lg hover:bg-gray-100 transition-all active:scale-95 inline-flex items-center gap-2">
                  {t('get_certificate')}
                </Link>
              </div>
            )}

            {/* Focus Mode Overlay Controls */}
            {isFocusMode && (
              <button 
                onClick={toggleFocusMode}
                className="absolute top-4 end-4 z-30 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur transition-colors"
                title={t('exit_focus_mode')}
              >
                <Minimize className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Video Info (Hidden in Focus Mode) */}
          {!isFocusMode && currentVideo && (
            <div className="flex flex-col gap-4 mt-2">
              <div>
                <h1 className="text-[22px] font-bold text-foreground mb-2">{currentVideo.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span>Video {currentVideoIndex + 1} of {courseVideos.length}</span>
                  <span>•</span>
                  <span>{formatTime(duration)}</span>
                  <span>•</span>
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold text-xs">{t('core_skill')}</span>
                  
                  {(currentVideo.language || course.language) && (
                     <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-bold text-xs uppercase tracking-wider">
                       {currentVideo.language || course.language}
                     </span>
                  )}
                </div>
              </div>

              {/* Channel Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  {course.instructorAvatar?.trim() ? (
                    <img src={course.instructorAvatar} alt={course.instructor} className="w-12 h-12 rounded-full border border-border" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Youtube className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-foreground text-base flex items-center gap-1.5 max-w-[150px] sm:max-w-[300px]">
                      <ScrollingText>{course.instructor}</ScrollingText>
                      <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                    </div>
                    <div className="text-xs text-muted-foreground">{t('original_creator', 'Original Creator')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link 
                    to={`/creator/${encodeURIComponent(course.instructor || '')}`}
                    className="flex-1 sm:flex-none px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full font-bold text-sm hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-1.5"
                  >
                    See more lessons
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  {course.instructorUrl && (
                    <a 
                      href={course.instructorUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="px-5 py-2 bg-[#FF0000] text-white rounded-full font-bold text-sm hover:bg-[#CC0000] transition-colors flex items-center justify-center"
                    >
                      {t('subscribe')}
                    </a>
                  )}
                  <button
                    onClick={openReportModal}
                    className="px-3.5 py-2 rounded-full border border-border/80 hover:border-red-500/40 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    title={language === 'ar' ? 'إبلاغ عن مشكلة في الفيديو' : 'Report an issue with this lesson'}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden sm:inline">
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

      {/* Sidebar Playlist / Notes */}
      <div className={cn(
        "w-full flex flex-col bg-card border-s border-border transition-all duration-75 relative",
        isFocusMode ? "hidden" : "flex h-[40vh] lg:h-full lg:overflow-hidden"
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
            className={cn("flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2", sidebarTab === 'notes' ? "border-b-2 border-primary text-primary" : "text-muted-foreground")}
          >
            <BookOpen className="w-4 h-4" />
            Notes
          </button>
        </div>
        
        {sidebarTab === 'playlist' ? (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30 shrink-0">
              <span className="text-sm font-semibold text-muted-foreground">Progress</span>
              <span className="text-sm text-primary font-bold">{courseVideos.length > 0 ? Math.round((courseProgress.completedVideoIds.length / courseVideos.length) * 100) : 0}%</span>
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
                    <div className="text-xs text-muted-foreground">
                      {video.duration} {isCompleted ? '• Completed' : isCurrent ? `• Playing ${Math.round((currentTime/duration)*100 || 0)}%` : ''}
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
            <div className="p-4 border-b border-border bg-card shrink-0">
               <div className="flex items-center gap-2 mb-2">
                 <PenTool className="w-4 h-4 text-primary" />
                 <span className="font-bold text-sm">Add Note at {formatTime(currentTime)}</span>
               </div>
               <textarea 
                 value={noteText}
                 onChange={e => setNoteText(e.target.value)}
                 placeholder="Type your note here..."
                 className="w-full bg-background border border-border rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-primary"
               />
               <div className="mt-2 flex justify-end">
                 <button 
                   onClick={handleSaveNote}
                   disabled={isSavingNote || !noteText.trim() || user.uid === '1'}
                   className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded shadow hover:bg-primary/90 disabled:opacity-50"
                 >
                   Save Note
                 </button>
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {notes.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                   <BookOpen className="w-8 h-8 mb-2 opacity-50" />
                   <p className="text-sm text-center">No notes yet.<br/>Start typing above to save a note!</p>
                 </div>
               ) : (
                 notes.map(note => (
                   <div key={note.id} className="bg-card border border-border p-4 rounded-xl flex flex-col relative group">
                     <button onClick={() => handleDeleteNote(note.id)} className="absolute top-3 end-3 p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-all">
                       <Trash2 className="w-3.5 h-3.5" />
                     </button>
                     <div className="flex items-center gap-2 mb-2 pe-6">
                       <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer hover:bg-primary hover:text-white transition-colors" onClick={() => {
                         if (playerRef.current && note.videoId === currentVideo?.id) {
                            playerRef.current.seekTo(note.timestamp);
                         } else {
                            setCurrentVideo(course.id, note.videoId);
                            setTimeout(() => {
                               if (playerRef.current) playerRef.current.seekTo(note.timestamp);
                            }, 1000);
                         }
                       }}>
                         {formatTime(note.timestamp)}
                       </span>
                       <span className="text-[10px] text-muted-foreground line-clamp-1">{note.videoTitle}</span>
                     </div>
                     <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{note.text}</p>
                   </div>
                 ))
               )}
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
