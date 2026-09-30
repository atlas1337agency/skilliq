import { useState, useEffect, useMemo } from 'react';
import { Course, LearningPath, AppNotification, AdBannerData } from '../data/courses';
import { addOrUpdateCourse, addOrUpdatePath, addOrUpdateNotification, addOrUpdateBanner } from '../lib/firestoreContent';
import { 
  X, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  AlertCircle, 
  Sparkles, 
  Youtube, 
  Image as ImageIcon, 
  User, 
  BookOpen, 
  Link as LinkIcon, 
  ExternalLink, 
  Check, 
  Play,
  Bell,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { fetchPlaylistVideos, extractPlaylistId, fetchChannelDetailsFromVideoOrPlaylist, fetchVideoDetails } from '../lib/youtube';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

const POPULAR_CATEGORIES = [
  'Programming',
  'Web Development',
  'Cybersecurity',
  'AI & Machine Learning',
  'DevOps & Cloud',
  'Mobile Apps',
  'Design & UI/UX',
  'Data Science'
];

const extractYoutubeId = (str: string) => {
  if (!str) return '';
  str = str.trim();
  
  const listMatch = str.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listMatch) {
    return listMatch[1];
  }
  
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = str.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  
  const fallbackRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const fbMatch = str.match(fallbackRegex);
  if (fbMatch && fbMatch[2]) {
    return fbMatch[2];
  }
  
  return str;
};

export function AdminForms({ 
  type, 
  itemToEdit, 
  onClose 
}: { 
  type: 'course' | 'path' | 'notification' | 'banner', 
  itemToEdit?: any, 
  onClose: () => void 
}) {
  const { t } = useTranslation();
  const { loadContent } = useStore();
  const isAdmin = useStore.getState().user?.role === 'admin';

  // Active step for course wizard
  const [courseStep, setCourseStep] = useState<'basics' | 'videos' | 'instructor' | 'resources'>('basics');

  const [course, setCourse] = useState<Partial<Course>>(itemToEdit || {
    id: 'course_' + Math.random().toString(36).substring(2, 9),
    title: '',
    description: '',
    category: 'Programming',
    thumbnail: '',
    instructor: '',
    instructorAvatar: '',
    instructorUrl: '',
    language: 'English',
    isSingleVideo: false,
    videos: [],
    resources: [],
    isApproved: isAdmin ? true : false,
    createdAt: Date.now(),
  });

  const [path, setPath] = useState<Partial<LearningPath>>(itemToEdit || {
    id: 'path_' + Math.random().toString(36).substring(2, 9),
    title: '',
    description: '',
    icon: 'Code',
    courseIds: [],
    createdAt: Date.now(),
  });

  const [notification, setNotification] = useState<Partial<AppNotification>>(itemToEdit || {
    id: 'notif_' + Math.random().toString(36).substring(2, 9),
    title: '',
    message: '',
    image: '',
    link: '',
    linkLogo: '',
    links: [],
    isActive: true,
    createdAt: Date.now(),
  });

  const [banner, setBanner] = useState<Partial<AdBannerData>>(itemToEdit || {
    id: 'banner_' + Math.random().toString(36).substring(2, 9),
    placement: 'home-hero',
    desktopImageUrl: '',
    mobileImageUrl: '',
    targetUrl: '',
    language: 'all',
    isActive: true,
    createdAt: Date.now(),
  });

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{type: 'error'|'success', text: string} | null>(null);
  const [playlistUrlInput, setPlaylistUrlInput] = useState('');

  // Handle adding a video
  const handleAddVideo = () => {
    const newVideos = [
      ...(course.videos || []), 
      { 
        id: `v_${Date.now()}`, 
        title: '', 
        duration: '', 
        youtubeId: '', 
        resources: [], 
        language: course.language || '' 
      }
    ];
    setCourse({ ...course, videos: newVideos });
  };

  // Smart Auto-Import YouTube Playlist
  const handleImportPlaylist = async () => {
    if (!playlistUrlInput.trim()) return;
    
    setImportMessage(null);
    const playlistId = extractPlaylistId(playlistUrlInput.trim());
    if (!playlistId) {
      setImportMessage({ type: 'error', text: 'Invalid YouTube Playlist URL or ID. Make sure it contains "list=...".' });
      return;
    }

    setIsImporting(true);
    try {
      const importedVideos = await fetchPlaylistVideos(playlistId);
      
      if (!importedVideos || importedVideos.length === 0) {
        setImportMessage({ type: 'error', text: 'No videos found in playlist, or the playlist is private/unlisted.' });
      } else {
        // Auto-apply current course language
        if (course.language) {
          importedVideos.forEach(v => v.language = course.language);
        }

        const newVids = [...(course.videos || []), ...importedVideos];
        
        // Auto-fill thumbnail if empty
        let newThumbnail = course.thumbnail;
        if ((!newThumbnail || newThumbnail.trim() === '') && importedVideos[0]?.youtubeId) {
          newThumbnail = `https://img.youtube.com/vi/${importedVideos[0].youtubeId}/maxresdefault.jpg`;
        }

        // Auto-fetch channel info if empty
        let channelDetails = null;
        if ((!course.instructor || course.instructor.trim() === '') && importedVideos[0]?.youtubeId) {
          channelDetails = await fetchChannelDetailsFromVideoOrPlaylist(importedVideos[0].youtubeId, false);
        }

        setCourse(prev => ({
          ...prev,
          thumbnail: newThumbnail,
          videos: newVids,
          ...(channelDetails && {
            instructor: channelDetails.instructorName || prev.instructor,
            instructorAvatar: channelDetails.instructorAvatar || prev.instructorAvatar,
            instructorUrl: channelDetails.instructorUrl || prev.instructorUrl
          })
        }));
        
        setPlaylistUrlInput('');
        setImportMessage({ 
          type: 'success', 
          text: `Successfully imported ${importedVideos.length} videos from YouTube!` 
        });
      }
    } catch (err: any) {
      setImportMessage({ type: 'error', text: err.message || 'Failed to fetch playlist' });
    } finally {
      setIsImporting(false);
    }
  };

  // Auto fetch instructor from first video
  const handleAutoFetchInstructor = async () => {
    const firstVidId = course.videos?.[0]?.youtubeId;
    if (!firstVidId) {
      alert("Please add at least one video with a YouTube ID first.");
      return;
    }

    try {
      const channelDetails = await fetchChannelDetailsFromVideoOrPlaylist(firstVidId, false);
      if (channelDetails) {
        setCourse(prev => ({
          ...prev,
          instructor: channelDetails.instructorName || prev.instructor,
          instructorAvatar: channelDetails.instructorAvatar || prev.instructorAvatar,
          instructorUrl: channelDetails.instructorUrl || prev.instructorUrl
        }));
      } else {
        alert("Could not fetch instructor details from YouTube.");
      }
    } catch (e) {
      console.error(e);
      alert("Error fetching instructor details.");
    }
  };

  const handleSaveCourse = async () => {
    setFormError(null);
    if (!course.title?.trim()) {
      setFormError("Course title is required.");
      setCourseStep('basics');
      return;
    }

    setIsSaving(true);
    try {
      const cleanCourse = JSON.parse(JSON.stringify(course));
      cleanCourse.isSingleVideo = !!cleanCourse.isSingleVideo;
      
      await addOrUpdateCourse(cleanCourse as Course);
      await loadContent();
      onClose();
    } catch (err: any) {
      console.error("Course save error:", err);
      setFormError(err.message || "Failed to save course.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePath = async () => {
    setFormError(null);
    if (!path.title?.trim()) {
      setFormError("Path title is required.");
      return;
    }

    setIsSaving(true);
    try {
      const cleanPath = JSON.parse(JSON.stringify(path));
      await addOrUpdatePath(cleanPath as LearningPath);
      await loadContent();
      onClose();
    } catch (err: any) {
      console.error("Path save error:", err);
      setFormError(err.message || "Failed to save learning path.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotification = async () => {
    setFormError(null);
    if (!notification.title?.trim()) {
      setFormError("Notification title is required.");
      return;
    }
    if (!notification.message?.trim()) {
      setFormError("Notification message is required.");
      return;
    }

    setIsSaving(true);
    try {
      const cleanNotif: any = {
        id: notification.id || 'notif_' + Math.random().toString(36).substring(2, 9),
        title: notification.title.trim(),
        message: notification.message.trim(),
        isActive: notification.isActive !== false,
        createdAt: notification.createdAt || Date.now()
      };
      if (notification.image?.trim()) cleanNotif.image = notification.image.trim();
      if (notification.link?.trim()) cleanNotif.link = notification.link.trim();
      if (notification.linkLogo?.trim()) cleanNotif.linkLogo = notification.linkLogo.trim();
      if (notification.targetUserId?.trim()) cleanNotif.targetUserId = notification.targetUserId.trim();
      if (Array.isArray(notification.links) && notification.links.length > 0) {
        const validLinks = notification.links
          .filter((l: any) => l && l.label?.trim() && l.url?.trim())
          .map((l: any) => ({
            label: l.label.trim(),
            url: l.url.trim(),
            ...(l.logo?.trim() ? { logo: l.logo.trim() } : {})
          }));
        if (validLinks.length > 0) cleanNotif.links = validLinks;
      }

      await addOrUpdateNotification(cleanNotif as AppNotification);
      await loadContent();
      onClose();
    } catch (err: any) {
      console.error("Notification save error:", err);
      setFormError(err.message || "Failed to save notification.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBanner = async () => {
    setFormError(null);
    if (!banner.desktopImageUrl?.trim() || !banner.mobileImageUrl?.trim()) {
      setFormError("Both desktop and mobile image URLs are required.");
      return;
    }

    setIsSaving(true);
    try {
      const cleanBanner: any = {
        id: banner.id || 'banner_' + Math.random().toString(36).substring(2, 9),
        placement: banner.placement || 'home-hero',
        desktopImageUrl: banner.desktopImageUrl.trim(),
        mobileImageUrl: banner.mobileImageUrl.trim(),
        isActive: banner.isActive !== false,
        createdAt: banner.createdAt || Date.now()
      };
      if (banner.targetUrl?.trim()) cleanBanner.targetUrl = banner.targetUrl.trim();
      if (banner.language?.trim()) cleanBanner.language = banner.language.trim();

      await addOrUpdateBanner(cleanBanner as AdBannerData);
      await loadContent();
      onClose();
    } catch (err: any) {
      console.error("Banner save error:", err);
      setFormError(err.message || "Failed to save banner.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-4xl h-[92vh] sm:h-[88vh] max-h-[96vh] rounded-2xl sm:rounded-3xl border border-border/80 shadow-2xl flex flex-col overflow-hidden text-start my-auto">
        
        {/* FIXED HEADER */}
        <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              {type === 'course' ? <BookOpen className="w-5 h-5" /> : type === 'notification' ? <Sparkles className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                {itemToEdit ? 'Edit' : 'Create New'} {type === 'course' ? 'Course / Masterclass' : type === 'path' ? 'Learning Path' : type === 'notification' ? 'Push Notification' : 'Ad Banner'}
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                {type === 'course' ? 'Configure course details, curriculum videos, and instructor profile.' : 'Manage platform content stored in Firestore.'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP / TAB NAVIGATION (When editing/creating a course) */}
        {type === 'course' && (
          <div className="px-4 sm:px-6 py-2 border-b border-border/60 bg-card flex items-center gap-1.5 overflow-x-auto shrink-0 text-xs font-bold">
            <button
              onClick={() => setCourseStep('basics')}
              className={cn(
                "px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
                courseStep === 'basics' 
                  ? "bg-primary text-primary-foreground shadow-xs" 
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <span>1. Basics & Details</span>
            </button>

            <button
              onClick={() => setCourseStep('videos')}
              className={cn(
                "px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
                courseStep === 'videos' 
                  ? "bg-primary text-primary-foreground shadow-xs" 
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              <span>2. Videos & YouTube Playlist</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-card border border-border">
                {course.videos?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setCourseStep('instructor')}
              className={cn(
                "px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
                courseStep === 'instructor' 
                  ? "bg-primary text-primary-foreground shadow-xs" 
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <User className="w-3.5 h-3.5" />
              <span>3. Instructor & Thumbnail</span>
            </button>

            <button
              onClick={() => setCourseStep('resources')}
              className={cn(
                "px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
                courseStep === 'resources' 
                  ? "bg-primary text-primary-foreground shadow-xs" 
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>4. Resources</span>
            </button>
          </div>
        )}

        {/* SCROLLABLE BODY */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Error Banner */}
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* COURSE FORM */}
          {type === 'course' && (
            <div className="space-y-6">
              
              {/* STEP 1: BASICS */}
              {courseStep === 'basics' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">Course Title *</label>
                      <input 
                        value={course.title || ''} 
                        onChange={e => setCourse({ ...course, title: e.target.value })} 
                        className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none" 
                        placeholder="e.g. Modern Full-Stack Development with TypeScript" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">Category *</label>
                      <input 
                        value={course.category || ''} 
                        onChange={e => setCourse({ ...course, category: e.target.value })} 
                        className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none" 
                        placeholder="e.g. Programming" 
                      />
                      {/* Quick Category Chips */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {POPULAR_CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCourse({ ...course, category: cat })}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-bold text-foreground mb-1">Description</label>
                      <textarea 
                        value={course.description || ''} 
                        onChange={e => setCourse({ ...course, description: e.target.value })} 
                        className="w-full bg-card border border-border/80 rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none" 
                        rows={3} 
                        placeholder="Provide an overview of what students will learn in this course..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">Audio / Subtitles Language</label>
                      <select 
                        value={course.language || 'English'} 
                        onChange={e => setCourse({ ...course, language: e.target.value })} 
                        className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                      >
                        <option value="English">English</option>
                        <option value="Arabic">Arabic</option>
                        <option value="Both">Both (EN & AR)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:pb-3">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
                        <input 
                          type="checkbox" 
                          checked={course.isSingleVideo} 
                          onChange={e => setCourse({ ...course, isSingleVideo: e.target.checked })} 
                          className="w-4 h-4 rounded text-primary focus:ring-primary" 
                        />
                        <span>Is this a Masterclass? (Single 2h+ Video)</span>
                      </label>
                    </div>

                    {isAdmin && (
                      <div className="col-span-1 sm:col-span-2 p-3 bg-muted/30 rounded-xl border border-border/60 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-foreground block">Course Visibility</span>
                          <span className="text-[11px] text-muted-foreground">When approved, this course appears publicly in student catalog.</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={course.isApproved !== false} 
                          onChange={e => setCourse({ ...course, isApproved: e.target.checked })} 
                          className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer" 
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: YOUTUBE PLAYLIST & CURRICULUM VIDEOS */}
              {courseStep === 'videos' && (
                <div className="space-y-5">
                  {/* SMART YOUTUBE IMPORT BOX */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500/10 via-red-500/5 to-card border border-red-500/20 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Youtube className="w-5 h-5 text-red-500" />
                        <span className="text-xs font-black text-foreground uppercase tracking-wider">
                          1-Click YouTube Playlist Importer
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">Auto-detects IDs & Durations</span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Paste any public YouTube Playlist URL (e.g. <code className="bg-muted px-1 py-0.5 rounded text-[10px]">https://www.youtube.com/playlist?list=PL...</code>). All videos, titles, and channel details will be imported automatically!
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        value={playlistUrlInput} 
                        onChange={e => setPlaylistUrlInput(e.target.value)} 
                        placeholder="Paste YouTube Playlist URL or ID here..." 
                        className="flex-1 bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none" 
                      />
                      <button
                        onClick={handleImportPlaylist}
                        disabled={isImporting || !playlistUrlInput.trim()}
                        className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span>{isImporting ? 'Importing...' : 'Auto-Import Videos'}</span>
                      </button>
                    </div>

                    {importMessage && (
                      <div className={cn(
                        "p-3 rounded-xl text-xs font-semibold flex items-center gap-2",
                        importMessage.type === 'error' ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      )}>
                        {importMessage.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
                        <span>{importMessage.text}</span>
                      </div>
                    )}
                  </div>

                  {/* VIDEOS LIST HEADER */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <h3 className="text-sm font-black text-foreground">Course Curriculum ({course.videos?.length || 0} Videos)</h3>
                      <p className="text-[11px] text-muted-foreground">Each video requires a title, duration, and YouTube video ID.</p>
                    </div>

                    <button
                      onClick={handleAddVideo}
                      className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Video</span>
                    </button>
                  </div>

                  {/* VIDEOS LIST */}
                  <div className="space-y-3">
                    {course.videos?.map((vid, idx) => (
                      <div key={idx} className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-muted text-foreground">
                            Lesson #{idx + 1}
                          </span>

                          <div className="flex items-center gap-1">
                            {vid.youtubeId && (
                              <a
                                href={`https://www.youtube.com/watch?v=${vid.youtubeId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-muted text-xs font-semibold flex items-center gap-1"
                                title="Test on YouTube"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span className="text-[10px] hidden sm:inline">Preview</span>
                              </a>
                            )}
                            <button
                              onClick={() => {
                                const newVids = [...(course.videos || [])];
                                newVids.splice(idx, 1);
                                setCourse({ ...course, videos: newVids });
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input 
                            value={vid.title || ''} 
                            onChange={e => {
                              const newVids = [...(course.videos || [])];
                              newVids[idx].title = e.target.value;
                              setCourse({ ...course, videos: newVids });
                            }} 
                            placeholder="Video Title *" 
                            className="sm:col-span-2 bg-muted/30 border border-border/80 rounded-lg px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none" 
                          />

                          <input 
                            value={vid.duration || ''} 
                            onChange={e => {
                              const newVids = [...(course.videos || [])];
                              newVids[idx].duration = e.target.value;
                              setCourse({ ...course, videos: newVids });
                            }} 
                            placeholder="Duration (e.g. 15:42)" 
                            className="bg-muted/30 border border-border/80 rounded-lg px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none font-mono" 
                          />

                          <div className="sm:col-span-2">
                            <input 
                              value={vid.youtubeId || ''} 
                              onChange={e => {
                                const extracted = extractYoutubeId(e.target.value);
                                const newVids = [...(course.videos || [])];
                                newVids[idx].youtubeId = extracted;
                                setCourse({ ...course, videos: newVids });
                              }} 
                              placeholder="YouTube Video ID or full watch URL *" 
                              className="w-full bg-muted/30 border border-border/80 rounded-lg px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none font-mono" 
                            />
                          </div>

                          <div>
                            <select
                              value={vid.language || course.language || 'English'}
                              onChange={e => {
                                const newVids = [...(course.videos || [])];
                                newVids[idx].language = e.target.value;
                                setCourse({ ...course, videos: newVids });
                              }}
                              className="w-full bg-muted/30 border border-border/80 rounded-lg px-3 py-2 text-xs text-foreground font-semibold"
                            >
                              <option value="English">English</option>
                              <option value="Arabic">Arabic</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(!course.videos || course.videos.length === 0) && (
                      <div className="p-8 text-center bg-muted/20 border border-dashed border-border/80 rounded-2xl">
                        <Youtube className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                        <p className="text-xs font-bold text-foreground">No videos added yet</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Use the 1-Click Importer above or click "Add Video" to add lessons manually.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: INSTRUCTOR & MEDIA */}
              {courseStep === 'instructor' && (
                <div className="space-y-4">
                  {/* Thumbnail */}
                  <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-primary" />
                        <span>Course Cover Thumbnail URL</span>
                      </label>

                      {course.videos?.[0]?.youtubeId && (
                        <button
                          type="button"
                          onClick={() => {
                            const firstId = course.videos?.[0]?.youtubeId;
                            if (firstId) {
                              setCourse({
                                ...course,
                                thumbnail: `https://img.youtube.com/vi/${firstId}/maxresdefault.jpg`
                              });
                            }
                          }}
                          className="text-[10px] font-bold px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                        >
                          Use Video #1 YouTube Thumbnail
                        </button>
                      )}
                    </div>

                    <input 
                      value={course.thumbnail || ''} 
                      onChange={e => setCourse({ ...course, thumbnail: e.target.value })} 
                      className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none" 
                      placeholder="https://img.youtube.com/vi/... or web URL" 
                    />

                    {course.thumbnail && (
                      <div className="w-full max-w-sm rounded-xl overflow-hidden border border-border/80 shadow-xs">
                        <img 
                          src={course.thumbnail} 
                          alt="Cover Preview" 
                          className="w-full h-36 object-cover bg-muted" 
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Instructor Details */}
                  <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <User className="w-4 h-4 text-primary" />
                        <span>Instructor / Academy Details</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleAutoFetchInstructor}
                        disabled={!course.videos?.[0]?.youtubeId}
                        className="text-[10px] font-bold px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 cursor-pointer"
                      >
                        Auto-Fetch from YouTube Channel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Instructor Name</span>
                        <input 
                          value={course.instructor || ''} 
                          onChange={e => setCourse({ ...course, instructor: e.target.value })} 
                          className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground" 
                          placeholder="e.g. FreeCodeCamp / Mosh Hamedani" 
                        />
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Instructor Avatar URL</span>
                        <input 
                          value={course.instructorAvatar || ''} 
                          onChange={e => setCourse({ ...course, instructorAvatar: e.target.value })} 
                          className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground" 
                          placeholder="https://..." 
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-2">
                        <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Instructor Channel / Website Link</span>
                        <input 
                          value={course.instructorUrl || ''} 
                          onChange={e => setCourse({ ...course, instructorUrl: e.target.value })} 
                          className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground" 
                          placeholder="https://youtube.com/@channel" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: RESOURCES */}
              {courseStep === 'resources' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-foreground">Course External Resources</h3>
                      <p className="text-[11px] text-muted-foreground">Links to GitHub repositories, documentation, slides, or cheatsheets.</p>
                    </div>

                    <button
                      onClick={() => {
                        const newRes = [...(course.resources || []), { title: '', url: '', logoUrl: '' }];
                        setCourse({ ...course, resources: newRes });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Resource Link</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {course.resources?.map((res, rIdx) => (
                      <div key={rIdx} className="p-3 rounded-xl bg-card border border-border/80 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                        <input 
                          value={res.title || ''} 
                          onChange={e => {
                            const newRes = [...(course.resources || [])];
                            newRes[rIdx].title = e.target.value;
                            setCourse({ ...course, resources: newRes });
                          }} 
                          placeholder="Title (e.g. GitHub Repo)" 
                          className="flex-1 bg-muted/30 border border-border/80 rounded-lg px-3 py-2 text-xs" 
                        />

                        <input 
                          value={res.url || ''} 
                          onChange={e => {
                            const newRes = [...(course.resources || [])];
                            newRes[rIdx].url = e.target.value;
                            setCourse({ ...course, resources: newRes });
                          }} 
                          placeholder="URL (https://...)" 
                          className="flex-2 bg-muted/30 border border-border/80 rounded-lg px-3 py-2 text-xs font-mono" 
                        />

                        <button 
                          onClick={() => {
                            const newRes = [...(course.resources || [])];
                            newRes.splice(rIdx, 1);
                            setCourse({ ...course, resources: newRes });
                          }} 
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {(!course.resources || course.resources.length === 0) && (
                      <div className="p-6 text-center bg-muted/20 border border-dashed border-border/80 rounded-2xl text-xs text-muted-foreground">
                        No resources added.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* PATH FORM */}
          {type === 'path' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Path Title *</label>
                  <input 
                    value={path.title || ''} 
                    onChange={e => setPath({ ...path, title: e.target.value })} 
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-foreground" 
                    placeholder="e.g. Full-Stack Web Development Path" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Icon Name</label>
                  <select 
                    value={path.icon} 
                    onChange={e => setPath({ ...path, icon: e.target.value })} 
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-foreground"
                  >
                    <option value="Code">Code</option>
                    <option value="Terminal">Terminal</option>
                    <option value="Layout">Layout</option>
                    <option value="Database">Database</option>
                    <option value="Shield">Shield</option>
                  </select>
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-1">Description</label>
                  <textarea 
                    value={path.description || ''} 
                    onChange={e => setPath({ ...path, description: e.target.value })} 
                    className="w-full bg-card border border-border/80 rounded-xl p-3 text-xs sm:text-sm text-foreground" 
                    rows={3} 
                    placeholder="Describe this career roadmap..."
                  />
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-foreground">Linked Course IDs</h3>
                  <button 
                    onClick={() => setPath({ ...path, courseIds: [...(path.courseIds || []), ''] })} 
                    className="text-xs px-2.5 py-1 rounded bg-primary/10 text-primary font-bold hover:bg-primary/20"
                  >
                    + Add Course ID
                  </button>
                </div>

                <div className="space-y-2">
                  {path.courseIds?.map((cId, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input 
                        value={cId} 
                        onChange={e => {
                          const newIds = [...(path.courseIds || [])];
                          newIds[idx] = e.target.value;
                          setPath({ ...path, courseIds: newIds });
                        }} 
                        className="flex-1 bg-muted/30 border border-border/80 rounded-xl px-3 py-2 text-xs font-mono" 
                        placeholder="Paste course ID..." 
                      />
                      <button 
                        onClick={() => {
                          const newIds = [...(path.courseIds || [])];
                          newIds.splice(idx, 1);
                          setPath({ ...path, courseIds: newIds });
                        }} 
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATION FORM (Full Admin Customization) */}
          {type === 'notification' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-1">Announcement Title *</label>
                  <input 
                    value={notification.title || ''} 
                    onChange={e => setNotification({ ...notification, title: e.target.value })} 
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none" 
                    placeholder="e.g. 🚀 New Masterclass Released: Python Cyber Defense!" 
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-1">Message Content * (Supports Arabic and English)</label>
                  <textarea 
                    value={notification.message || ''} 
                    onChange={e => setNotification({ ...notification, message: e.target.value })} 
                    className="w-full bg-card border border-border/80 rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none" 
                    rows={3} 
                    placeholder="Enter the full message text to display to learners..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Cover / Badge Image URL (Optional)</label>
                  <input 
                    value={notification.image || ''} 
                    onChange={e => setNotification({ ...notification, image: e.target.value })} 
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none" 
                    placeholder="https://images.unsplash.com/... or icon URL" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Target Audience</label>
                  <input 
                    value={notification.targetUserId || ''} 
                    onChange={e => setNotification({ ...notification, targetUserId: e.target.value })} 
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none" 
                    placeholder="Leave empty for ALL users, or paste student UID" 
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    {notification.targetUserId ? `Targeting single user: ${notification.targetUserId}` : 'Broadcasting globally to all enrolled learners'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Primary Button Link (Optional)</label>
                  <input 
                    value={notification.link || ''} 
                    onChange={e => setNotification({ ...notification, link: e.target.value })} 
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none" 
                    placeholder="/course/... or https://..." 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Primary Button Logo URL (Optional)</label>
                  <input 
                    value={notification.linkLogo || ''} 
                    onChange={e => setNotification({ ...notification, linkLogo: e.target.value })} 
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none" 
                    placeholder="https://... logo icon" 
                  />
                </div>

                {/* Additional Action Links */}
                <div className="col-span-1 sm:col-span-2 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-foreground">Secondary Action Buttons / Links</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newLinks = [...(notification.links || []), { label: '', url: '', logo: '' }];
                        setNotification({ ...notification, links: newLinks });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Button</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {notification.links?.map((lnk, lIdx) => (
                      <div key={lIdx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center p-2.5 bg-muted/20 border border-border/70 rounded-xl">
                        <input 
                          value={lnk.label || ''} 
                          onChange={e => {
                            const newLinks = [...(notification.links || [])];
                            newLinks[lIdx].label = e.target.value;
                            setNotification({ ...notification, links: newLinks });
                          }} 
                          placeholder="Button Label (e.g. View Repo)" 
                          className="flex-1 bg-card border border-border/80 rounded-lg px-2.5 py-1.5 text-xs text-foreground" 
                        />
                        <input 
                          value={lnk.url || ''} 
                          onChange={e => {
                            const newLinks = [...(notification.links || [])];
                            newLinks[lIdx].url = e.target.value;
                            setNotification({ ...notification, links: newLinks });
                          }} 
                          placeholder="URL (https://...)" 
                          className="flex-2 bg-card border border-border/80 rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono" 
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const newLinks = [...(notification.links || [])];
                            newLinks.splice(lIdx, 1);
                            setNotification({ ...notification, links: newLinks });
                          }} 
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-1 sm:col-span-2 flex items-center gap-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
                    <input 
                      type="checkbox" 
                      checked={notification.isActive !== false} 
                      onChange={e => setNotification({ ...notification, isActive: e.target.checked })} 
                      className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer" 
                    />
                    <span>Active (Display this alert live to students)</span>
                  </label>
                </div>

                {/* Real-time Notification Design Preview */}
                <div className="col-span-1 sm:col-span-2 pt-4 border-t border-border/70">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Live Design Preview (What students will see):</span>
                    </span>
                    <span className="text-[10px] text-primary font-mono font-bold bg-primary/10 px-2 py-0.5 rounded">
                      Modern Floating Alert
                    </span>
                  </div>

                  <div className="max-w-md mx-auto p-4 rounded-2xl bg-card/95 border border-primary/40 shadow-xl relative overflow-hidden space-y-3">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-indigo-500 to-purple-600" />
                    
                    {notification.image && (
                      <div className="w-full h-32 rounded-xl overflow-hidden bg-muted relative">
                        <img src={notification.image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-black uppercase text-primary tracking-wider">Live Broadcast</span>
                    </div>

                    <h4 className="text-sm font-black text-foreground">
                      {notification.title || "Your Announcement Title Here"}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {notification.message || "Your announcement message will appear here with modern styling..."}
                    </p>

                    {notification.link && (
                      <div className="pt-1">
                        <div className="w-full py-2 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-xs">
                          <span>Explore Now</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* LIVE NOTIFICATION PREVIEW */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/80 space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Live Student View Preview:
                </span>
                <div className="p-4 rounded-xl bg-card border border-border/80 shadow-md max-w-md space-y-3">
                  {notification.image && (
                    <div className="w-full h-32 rounded-lg overflow-hidden bg-muted border border-border/60">
                      <img src={notification.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <h4 className="font-extrabold text-sm text-foreground">{notification.title || 'Notification Title'}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{notification.message || 'Notification message will appear here...'}</p>
                  {notification.link && (
                    <div className="inline-block px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                      Open Action Link
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* BANNER FORM (Full Admin Customization) */}
          {type === 'banner' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Placement Location *</label>
                  <select 
                    value={banner.placement} 
                    onChange={e => setBanner({ ...banner, placement: e.target.value as any })} 
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none font-semibold"
                  >
                    <option value="home-hero">Home Hero Top Slider (home-hero)</option>
                    <option value="home-middle">Home Middle Section (home-middle)</option>
                    <option value="home-bottom">Home Bottom Section (home-bottom)</option>
                    <option value="course-sidebar">Course Player Sidebar (course-sidebar)</option>
                    <option value="course-bottom">Course Page Bottom (course-bottom)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Target Language</label>
                  <select 
                    value={banner.language || 'all'} 
                    onChange={e => setBanner({ ...banner, language: e.target.value })} 
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none font-semibold"
                  >
                    <option value="all">All Languages (Global)</option>
                    <option value="en">English Only</option>
                    <option value="ar">Arabic Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Desktop Image URL *</label>
                  <input 
                    value={banner.desktopImageUrl || ''} 
                    onChange={e => setBanner({ ...banner, desktopImageUrl: e.target.value })} 
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none" 
                    placeholder="https://... (1200x300 recommended)" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Mobile Image URL *</label>
                  <input 
                    value={banner.mobileImageUrl || ''} 
                    onChange={e => setBanner({ ...banner, mobileImageUrl: e.target.value })} 
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none" 
                    placeholder="https://... (600x300 recommended)" 
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-1">Click Target URL</label>
                  <input 
                    value={banner.targetUrl || ''} 
                    onChange={e => setBanner({ ...banner, targetUrl: e.target.value })} 
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none font-mono" 
                    placeholder="e.g. /courses, /course/python-masterclass, or https://..." 
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 flex items-center gap-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
                    <input 
                      type="checkbox" 
                      checked={banner.isActive !== false} 
                      onChange={e => setBanner({ ...banner, isActive: e.target.checked })} 
                      className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer" 
                    />
                    <span>Active (Publish this promotional banner live on SkilliQ)</span>
                  </label>
                </div>
              </div>

              {/* LIVE BANNER PREVIEW */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/80 space-y-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Live Banner Image Previews:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Desktop Display</span>
                    {banner.desktopImageUrl ? (
                      <div className="w-full h-24 rounded-xl overflow-hidden bg-muted border border-border/80">
                        <img src={banner.desktopImageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-24 rounded-xl bg-muted/40 border border-dashed border-border/80 flex items-center justify-center text-xs text-muted-foreground">
                        No Desktop Image URL
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Mobile Display</span>
                    {banner.mobileImageUrl ? (
                      <div className="w-full max-w-[200px] h-24 rounded-xl overflow-hidden bg-muted border border-border/80">
                        <img src={banner.mobileImageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full max-w-[200px] h-24 rounded-xl bg-muted/40 border border-dashed border-border/80 flex items-center justify-center text-xs text-muted-foreground">
                        No Mobile Image URL
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* STICKY ACTION FOOTER */}
        <div className="p-4 sm:p-5 border-t border-border/80 bg-card flex items-center justify-between gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 sm:py-2.5 rounded-xl border border-border/80 bg-card hover:bg-muted text-foreground text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {type === 'course' && courseStep !== 'basics' && (
              <button
                type="button"
                onClick={() => {
                  if (courseStep === 'resources') setCourseStep('instructor');
                  else if (courseStep === 'instructor') setCourseStep('videos');
                  else if (courseStep === 'videos') setCourseStep('basics');
                }}
                className="px-3.5 py-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-xs font-bold transition-all cursor-pointer"
              >
                Previous Step
              </button>
            )}

            {type === 'course' && courseStep !== 'resources' ? (
              <button
                type="button"
                onClick={() => {
                  if (courseStep === 'basics') setCourseStep('videos');
                  else if (courseStep === 'videos') setCourseStep('instructor');
                  else if (courseStep === 'instructor') setCourseStep('resources');
                }}
                className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold hover:bg-secondary/90 transition-all cursor-pointer"
              >
                Next Step
              </button>
            ) : null}

            <button 
              type="button"
              disabled={isSaving} 
              onClick={() => {
                if (type === 'course') handleSaveCourse();
                else if (type === 'path') handleSavePath();
                else if (type === 'notification') handleSaveNotification();
                else if (type === 'banner') handleSaveBanner();
              }} 
              className="px-5 py-2 sm:py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSaving ? 'Saving...' : type === 'course' ? 'Save & Publish Course' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
