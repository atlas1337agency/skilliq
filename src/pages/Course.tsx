import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import YouTube, { YouTubeEvent } from 'react-youtube';
import { useStore } from '../store/useStore';
import { CheckCircle, Lock, PlayCircle, PauseCircle, ArrowLeft, Maximize, Minimize, Youtube, BookOpen, PenTool, Trash2, BadgeCheck, ChevronRight } from 'lucide-react';
import { ScrollingText } from '../components/ScrollingText';
import { cn, filterByLanguage } from '../lib/utils';
import { motion } from 'motion/react';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export function Course() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { progress, markVideoCompleted, setCurrentVideo, completeCourse, user, courses, saveVideoTimestamp, language } = useStore();
  
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerState, setPlayerState] = useState(-1);
  const [hasError, setHasError] = useState(false);
  const [reportedVideos, setReportedVideos] = useState<Record<string, boolean>>({});
  const [isReporting, setIsReporting] = useState(false);
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

  const handleReportVideo = async () => {
    if (!user || !currentVideo || isReporting || reportedVideos[currentVideo.id] || !course) return;
    setIsReporting(true);
    try {
      const reportData: any = {
        type: 'broken_video',
        courseId: course.id,
        courseTitle: course.title,
        videoId: currentVideo.id,
        videoTitle: currentVideo.title,
        youtubeId: currentVideo.youtubeId,
        userId: user.uid,
        userName: user.displayName || 'Unknown',
        userEmail: user.email || '',
        status: 'pending',
        createdAt: Date.now()
      };
      if (course.category) {
        reportData.categoryId = course.category;
      }
      await addDoc(collection(db, 'reports'), reportData);
      setReportedVideos(prev => ({ ...prev, [currentVideo.id]: true }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsReporting(false);
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
                      className="text-white hover:text-primary transition-colors focus:outline-none"
                    >
                      {(playerState === 1 || playerState === 3) ? <span className="font-bold tracking-widest text-xs uppercase px-2">PAUSE</span> : <span className="font-bold tracking-widest text-xs uppercase px-2">PLAY</span>}
                    </button>
                    <span className="text-white/80 text-xs sm:text-sm font-medium tracking-wide">
                      {hasError ? 'Video Unavailable' : `${formatTime(currentTime)} / ${formatTime(duration)}`}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleReportVideo(); }}
                      disabled={isReporting || (currentVideo && reportedVideos[currentVideo.id])}
                      className={cn(
                        "px-3 py-1 font-bold rounded text-xs shadow transition-colors",
                        (currentVideo && reportedVideos[currentVideo.id])
                          ? "bg-amber-500 text-white cursor-default" 
                          : "bg-red-500 hover:bg-red-600 text-white"
                      )}
                    >
                      {(currentVideo && reportedVideos[currentVideo.id]) ? 'Report not solved yet' : isReporting ? 'Reporting...' : 'Report Broken Video'}
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
    </div>
  );
}
