import { useState, useEffect, useMemo } from 'react';
import { Course, LearningPath, AppNotification, AdBannerData } from '../data/courses';
import { addOrUpdateCourse, addOrUpdatePath, addOrUpdateNotification, addOrUpdateBanner } from '../lib/firestoreContent';
import { X, Plus, Trash2, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fetchPlaylistVideos, extractPlaylistId, fetchChannelDetailsFromVideoOrPlaylist, fetchVideoDetails } from '../lib/youtube';
import { useTranslation } from 'react-i18next';

// ... (youtube helpers)
const extractYoutubeId = (str: string) => {
  if (!str) return '';
  str = str.trim();
  
  // Extract list/playlist ID first if present
  const listMatch = str.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listMatch) {
    return listMatch[1];
  }
  
  // Extract video ID from youtube URLs (including shorts)
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = str.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  
  // Fallback regex for other youtube url structures
  const fallbackRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const fbMatch = str.match(fallbackRegex);
  if (fbMatch && fbMatch[2]) {
    return fbMatch[2];
  }
  
  // If it's just raw text/ID (like an 8 character test ID), just return it
  return str;
};

export function AdminForms({ type, itemToEdit, onClose }: { type: 'course' | 'path' | 'notification' | 'banner', itemToEdit?: any, onClose: () => void }) {
  const { t } = useTranslation();
  const { loadContent } = useStore();
  const isAdmin = useStore.getState().user?.role === 'admin';
  const [course, setCourse] = useState<Partial<Course>>(itemToEdit || {
    id: Math.random().toString(36).substring(7),
    title: '',
    description: '',
    category: 'Programming',
    thumbnail: '',
    isSingleVideo: false,
    videos: [],
    isApproved: isAdmin ? true : false,
    createdAt: Date.now(),
  });

  const [path, setPath] = useState<Partial<LearningPath>>(itemToEdit || {
    id: Math.random().toString(36).substring(7),
    title: '',
    description: '',
    icon: 'Code',
    courseIds: [],
    createdAt: Date.now(),
  });

  const [notification, setNotification] = useState<Partial<AppNotification>>(itemToEdit || {
    id: Math.random().toString(36).substring(7),
    title: '',
    message: '',
    image: '',
    link: '',
    links: [],
    isActive: true,
    createdAt: Date.now(),
  });

  const [banner, setBanner] = useState<Partial<AdBannerData>>(itemToEdit || {
    id: Math.random().toString(36).substring(7),
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

  // Pagination for videos
  const [currentVideoPage, setCurrentVideoPage] = useState(1);
  const videosPerPage = 10;
  
  const [showImportBox, setShowImportBox] = useState(false);
  const [importUrl, setImportUrl] = useState('');

  const totalVideoPages = Math.ceil((course.videos?.length || 0) / videosPerPage);
  
  const currentVideos = useMemo(() => {
    const startIndex = (currentVideoPage - 1) * videosPerPage;
    return course.videos?.slice(startIndex, startIndex + videosPerPage) || [];
  }, [course.videos, currentVideoPage]);

  // Handle adding a video (auto jump to last page)
  const handleAddVideo = () => {
    const newVideos = [...(course.videos || []), { id: `v${Date.now()}`, title: '', duration: '', youtubeId: '', resources: [], language: course.language || '' }];
    setCourse({...course, videos: newVideos});
    
    // Jump to the last page so they can see the newly added video
    setCurrentVideoPage(Math.ceil(newVideos.length / videosPerPage));
  };

  const handleImportPlaylist = async () => {
    if (!importUrl) return;
    
    setImportMessage(null);
    const playlistId = extractPlaylistId(importUrl);
    if (!playlistId) {
      setImportMessage({ type: 'error', text: 'Invalid YouTube Playlist URL or ID.' });
      return;
    }

    setIsImporting(true);
    try {
      const importedVideos = await fetchPlaylistVideos(playlistId);
      
      if (importedVideos.length === 0) {
        setImportMessage({ type: 'error', text: 'No videos found, or the playlist is private.' });
      } else {
        // Auto-apply current course language to all newly imported videos
        if (course.language) {
          importedVideos.forEach(v => v.language = course.language);
        }

        const newVids = [...(course.videos || []), ...importedVideos];
        
        // Let's also auto-fill the thumbnail if it's empty, based on the first video
        let newThumbnail = course.thumbnail;
        if ((!newThumbnail || newThumbnail.trim() === '') && importedVideos[0].youtubeId) {
           newThumbnail = `https://img.youtube.com/vi/${importedVideos[0].youtubeId}/maxresdefault.jpg`;
        }

        // Auto-fetch instructor details if they are empty
        let channelDetails = null;
        if ((!course.instructor || course.instructor.trim() === '') && importedVideos[0].youtubeId) {
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
        
        // Jump to the first page of the new videos
        const newTotalPages = Math.ceil(newVids.length / videosPerPage);
        setCurrentVideoPage(newTotalPages);
        
        setImportUrl('');
        setShowImportBox(false);
        
        // Show success in UI instead of alert (which is blocked by iframes)
        setImportMessage({ type: 'success', text: `Successfully imported ${importedVideos.length} videos!` });
        setTimeout(() => setImportMessage(null), 5000);
      }
    } catch (err: any) {
      setImportMessage({ type: 'error', text: err.message });
    } finally {
      setIsImporting(false);
    }
  };

  const handleAutoFetchInstructor = async () => {
    // try to get from first video
    const firstVidId = course.videos?.[0]?.youtubeId;
    if (!firstVidId) {
      alert("Please add at least one video with a YouTube ID first, or import a playlist.");
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
    setIsSaving(true);
    try {
      // Strip undefineds which crash Firestore
      const cleanCourse = JSON.parse(JSON.stringify(course));
      // Ensure boolean
      cleanCourse.isSingleVideo = !!cleanCourse.isSingleVideo;
      
      await addOrUpdateCourse(cleanCourse as Course);
      await loadContent();
      onClose();
    } catch (err) {
      console.error("Course save err:", err);
      if (err instanceof Error) alert("Failed to save course: " + err.message);
      else alert("Failed to save course.");
    }
    setIsSaving(false);
  };

  const handleSavePath = async () => {
    setIsSaving(true);
    try {
      const cleanPath = JSON.parse(JSON.stringify(path));
      await addOrUpdatePath(cleanPath as LearningPath);
      await loadContent();
      onClose();
    } catch (err) {
      console.error("Path save err:", err);
      if (err instanceof Error) alert("Failed to save path: " + err.message);
      else alert("Failed to save path.");
    }
    setIsSaving(false);
  };

  const handleSaveNotification = async () => {
    setFormError(null);
    if (!notification.title?.trim()) {
      setFormError("Please provide a title");
      return;
    }
    if (!notification.message?.trim()) {
      setFormError("Please provide a message");
      return;
    }
    setIsSaving(true);
    try {
      const cleanNotif = JSON.parse(JSON.stringify(notification));
      if (!cleanNotif.image) delete cleanNotif.image;
      if (!cleanNotif.link) delete cleanNotif.link;
      if (!cleanNotif.linkLogo) delete cleanNotif.linkLogo;
      if (cleanNotif.links) {
        cleanNotif.links = cleanNotif.links.filter((l: any) => l.label.trim() && l.url.trim());
        cleanNotif.links.forEach((l: any) => { if (!l.logo) delete l.logo; });
        if (cleanNotif.links.length === 0) delete cleanNotif.links;
      }
      
      console.log('Saving notification:', cleanNotif);
      await addOrUpdateNotification(cleanNotif as AppNotification);
      await loadContent();
      onClose();
    } catch (err) {
      console.error("Notification save err:", err);
      setFormError(err instanceof Error ? err.message : "Failed to save notification.");
    }
    setIsSaving(false);
  };

  const handleSaveBanner = async () => {
    setFormError(null);
    if (!banner.desktopImageUrl?.trim() || !banner.mobileImageUrl?.trim()) {
      setFormError("Images for both desktop and mobile are required");
      return;
    }
    setIsSaving(true);
    try {
      const cleanBanner = JSON.parse(JSON.stringify(banner));
      await addOrUpdateBanner(cleanBanner as AdBannerData);
      await loadContent();
      onClose();
    } catch (err) {
      console.error("Banner save err:", err);
      setFormError(err instanceof Error ? err.message : "Failed to save banner.");
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-card w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border border-border shadow-2xl relative overflow-hidden">
        
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 bg-card border-b border-border z-20 shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold">{itemToEdit ? 'Edit' : 'Add'} {type === 'course' ? 'Course/Masterclass' : type === 'path' ? 'Learning Path' : type === 'notification' ? 'Notification' : 'Banner'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="w-5 h-5"/></button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 relative">
          {formError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3 text-red-500">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{formError}</p>
            </div>
          )}
          {type === 'course' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">ID (leave as is unless custom)</label>
                <input value={course.id || ''} onChange={e => setCourse({...course, id: e.target.value})} className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm" disabled={!!itemToEdit} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input value={course.title || ''} onChange={e => setCourse({...course, title: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="e.g. React Course" />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={course.description || ''} onChange={e => setCourse({...course, description: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Thumbnail URL</label>
                <input value={course.thumbnail || ''} onChange={e => setCourse({...course, thumbnail: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input value={course.category || ''} onChange={e => setCourse({...course, category: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="e.g. Programming" />
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:col-span-2">
                  <input 
                    type="checkbox" 
                    id="isApproved" 
                    checked={course.isApproved !== false} 
                    onChange={e => setCourse({...course, isApproved: e.target.checked})} 
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor="isApproved" className="text-sm font-medium cursor-pointer">Approved (Show on website)</label>
                </div>
              )}
              <div className="col-span-1 sm:col-span-2 mt-4 border-t border-border pt-4 relative">
                <div className="flex items-center justify-between absolute end-0 top-2">
                  <button 
                     onClick={handleAutoFetchInstructor}
                     disabled={!course.videos || course.videos.length === 0}
                     className="text-xs bg-primary/10 text-primary font-bold px-2 py-1 rounded hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                     Auto-Fetch from Videos
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Instructor Name</label>
                    <input value={course.instructor || ''} onChange={e => setCourse({...course, instructor: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="e.g. Code Mosh" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Instructor Avatar URL</label>
                    <input value={course.instructorAvatar || ''} onChange={e => setCourse({...course, instructorAvatar: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="https://..." />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">Instructor Channel/Subscribe URL</label>
                    <input value={course.instructorUrl || ''} onChange={e => setCourse({...course, instructorUrl: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="https://youtube.com/..." />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Language</label>
                <select value={course.language || ''} onChange={e => {
                  const newLang = e.target.value;
                  // Auto-update all videos to match the new course language
                  const updatedVideos = course.videos?.map(v => ({ ...v, language: newLang })) || [];
                  setCourse({...course, language: newLang, videos: updatedVideos});
                }} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                  <option value="">None</option>
                  <option value="English">English</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Both">Both (EN/AR)</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input type="checkbox" checked={course.isSingleVideo} onChange={e => setCourse({...course, isSingleVideo: e.target.checked})} id="isSingle" className="w-4 h-4" />
                <label htmlFor="isSingle" className="text-sm font-medium">Is this a Masterclass? (Single large video)</label>
              </div>
            </div>

            {/* Course-level Resources Link */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">Course Resources (Global Tools / Links)</h3>
                <button 
                  onClick={() => setCourse({...course, resources: [...(course.resources || []), { title: '', url: '', logoUrl: '' }]})}
                  className="flex items-center gap-1 text-[10px] bg-secondary text-secondary-foreground px-2 py-1 rounded hover:bg-secondary/80 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Link
                </button>
              </div>
              <div className="space-y-2">
                {course.resources?.map((res, rIdx) => (
                  <div key={rIdx} className="flex flex-col sm:flex-row sm:flex-wrap gap-2 items-start sm:items-center bg-muted/20 p-2 rounded border border-border">
                    <input value={res.title || ''} onChange={e => {
                      const newRes = [...(course.resources || [])];
                      newRes[rIdx].title = e.target.value;
                      setCourse({...course, resources: newRes});
                    }} className="w-full sm:flex-1 min-w-[120px] bg-background border border-border rounded px-2 py-1.5 text-sm" placeholder="e.g. GitHub Repo" />
                    
                    <input value={res.url || ''} onChange={e => {
                      const newRes = [...(course.resources || [])];
                      newRes[rIdx].url = e.target.value;
                      setCourse({...course, resources: newRes});
                    }} className="w-full sm:flex-2 sm:min-w-[200px] bg-background border border-border rounded px-2 py-1.5 text-sm" placeholder="https://..." />
                    
                    <div className="flex w-full sm:w-auto items-center gap-2">
                      <input value={res.logoUrl || ''} onChange={e => {
                        const newRes = [...(course.resources || [])];
                        newRes[rIdx].logoUrl = e.target.value;
                        setCourse({...course, resources: newRes});
                      }} className="flex-1 sm:min-w-[150px] bg-background border border-border rounded px-2 py-1.5 text-sm" placeholder="Logo icon URL" />

                      <button onClick={() => {
                        const newRes = [...(course.resources || [])];
                        newRes.splice(rIdx, 1);
                        setCourse({...course, resources: newRes});
                      }} className="p-2 sm:p-1.5 text-red-500 hover:bg-red-500/10 rounded shrink-0"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {(!course.resources || course.resources.length === 0) && (
                   <p className="text-xs text-muted-foreground italic">No global resources added.</p>
                )}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex flex-col mb-4 sticky top-16 bg-card z-10 py-3 border-b border-border shadow-sm gap-3">
                <div className="flex items-center justify-between w-full">
                  <h3 className="font-bold">Videos</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowImportBox(!showImportBox)}
                      className="flex items-center gap-1 text-xs bg-muted text-foreground px-3 py-1.5 rounded hover:bg-muted/80 transition-colors"
                    >
                      {showImportBox ? "Cancel Import" : "Import Playlist"}
                    </button>
                    <button 
                      onClick={handleAddVideo}
                      className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      <Plus className="w-3 h-3" /> Add Video
                    </button>
                  </div>
                </div>

                {showImportBox && (
                  <div className="w-full flex items-center gap-2 bg-muted/30 p-2 rounded-lg border border-border mt-1">
                    <input
                      type="text"
                      placeholder="Paste YouTube Playlist URL or ID..."
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm"
                    />
                    <button
                      onClick={handleImportPlaylist}
                      disabled={isImporting || !importUrl}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {isImporting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isImporting ? "Importing..." : "Fetch Videos"}
                    </button>
                  </div>
                )}
                {importMessage && (
                  <div className={`w-full mt-1 p-3 rounded-lg flex items-center gap-2 text-sm ${importMessage.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                     <span className="font-semibold">{importMessage.type === 'error' ? 'Error:' : 'Success!'}</span> {importMessage.text}
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {currentVideos.map((vid, currentIdx) => {
                  // Calculate the true absolute index of this video in the master array
                  const idx = (currentVideoPage - 1) * videosPerPage + currentIdx;
                  
                  return (
                  <div key={idx} className="bg-muted/30 p-4 rounded-lg border border-border space-y-3 relative">
                    <div className="absolute top-2 end-2">
                       <button onClick={() => {
                        const newVids = [...(course.videos || [])];
                        newVids.splice(idx, 1);
                        setCourse({...course, videos: newVids});
                        
                        // If we just deleted the last item on the current page, go back one page
                        if (currentVideos.length === 1 && currentVideoPage > 1) {
                           setCurrentVideoPage(currentVideoPage - 1);
                        }
                      }} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 pe-8">
                      <span className="text-xs font-bold text-muted-foreground w-6 text-center">{idx + 1}.</span>
                      <input value={vid.title || ''} onChange={e => {
                        const newVids = [...(course.videos || [])];
                        newVids[idx].title = e.target.value;
                        setCourse({...course, videos: newVids});
                      }} className="w-full sm:flex-1 min-w-[150px] sm:min-w-[200px] bg-background border border-border rounded px-2 py-1.5 text-sm" placeholder="Video Title" />
                      
                      <input value={vid.duration || ''} onChange={e => {
                        const newVids = [...(course.videos || [])];
                        newVids[idx].duration = e.target.value;
                        setCourse({...course, videos: newVids});
                      }} className="w-full sm:w-24 bg-background border border-border rounded px-2 py-1.5 text-sm" placeholder="10:00" />
                      
                      <div className="relative w-full sm:w-32 flex items-center gap-1">
                        <input value={vid.youtubeId || ''} onChange={e => {
                          const newVids = [...(course.videos || [])];
                          const extractedId = extractYoutubeId(e.target.value);
                          newVids[idx].youtubeId = extractedId;
                          
                          let newCourseData = { ...course, videos: newVids };
                          if (idx === 0 && extractedId && (!course.thumbnail || course.thumbnail.trim() === '')) {
                            // Only use the basic youtube format if it isn't a playlist id
                            if (!extractedId.startsWith('PL') && !extractedId.startsWith('UU') && !extractedId.startsWith('FL') && extractedId.length < 15) {
                              newCourseData.thumbnail = `https://img.youtube.com/vi/${extractedId}/maxresdefault.jpg`;
                            }
                          }
                          
                          setCourse(newCourseData);
                        }} 
                        onBlur={async () => {
                          if (vid.youtubeId && !vid.youtubeId.startsWith('PL') && !vid.youtubeId.startsWith('UU') && !vid.youtubeId.startsWith('FL') && vid.youtubeId.length < 15) {
                            // Auto-fetch details if missing title/duration
                            if (!vid.title || !vid.duration) {
                              const details = await fetchVideoDetails(vid.youtubeId);
                              if (details) {
                                const newVids = [...(course.videos || [])];
                                newVids[idx].title = newVids[idx].title || details.title;
                                newVids[idx].duration = newVids[idx].duration || details.duration;
                                newVids[idx].description = newVids[idx].description || details.description;
                                setCourse(prev => ({...prev, videos: newVids}));
                              }
                            }
                          }
                        }}
                        className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm font-mono" placeholder="YouTube URL/ID" />
                      </div>

                      <select value={vid.language || ''} onChange={e => {
                        const newVids = [...(course.videos || [])];
                        newVids[idx].language = e.target.value;
                        setCourse({...course, videos: newVids});
                      }} className="w-full sm:w-28 bg-background border border-border rounded px-2 py-1.5 text-sm">
                        <option value="">Language</option>
                        <option value="English">English</option>
                        <option value="Arabic">Arabic</option>
                      </select>
                    </div>

                    <div className="w-full ps-6 sm:ps-8">
                      <textarea value={vid.description || ''} onChange={e => {
                        const newVids = [...(course.videos || [])];
                        newVids[idx].description = e.target.value;
                        setCourse({...course, videos: newVids});
                      }} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm" placeholder="Video Description (optional)" rows={2} />
                    </div>

                    <div className="ps-6 sm:ps-8 pt-2 border-t border-border border-dashed mt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground me-2">Resources Tools / Links</span>
                        <button 
                          onClick={() => {
                            const newVids = [...(course.videos || [])];
                            newVids[idx].resources = [...(newVids[idx].resources || []), { title: '', url: '', logoUrl: '' }];
                            setCourse({...course, videos: newVids});
                          }}
                          className="flex items-center gap-1 text-[10px] bg-secondary text-secondary-foreground px-2 py-1 rounded hover:bg-secondary/80 transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Add Link
                        </button>
                      </div>
                      <div className="space-y-2">
                        {vid.resources?.map((res, rIdx) => (
                          <div key={rIdx} className="flex flex-col sm:flex-row sm:flex-wrap gap-2 items-start sm:items-center">
                            <input value={res.title || ''} onChange={e => {
                              const newVids = [...(course.videos || [])];
                              newVids[idx].resources![rIdx].title = e.target.value;
                              setCourse({...course, videos: newVids});
                            }} className="w-full sm:flex-1 min-w-[120px] bg-background border border-border rounded px-2 py-1 text-xs" placeholder="e.g. VS Code" />
                            
                            <input value={res.url || ''} onChange={e => {
                              const newVids = [...(course.videos || [])];
                              newVids[idx].resources![rIdx].url = e.target.value;
                              setCourse({...course, videos: newVids});
                            }} className="w-full sm:flex-2 sm:min-w-[200px] bg-background border border-border rounded px-2 py-1 text-xs" placeholder="https://..." />
                            
                            <div className="flex w-full sm:w-auto items-center gap-2">
                              <input value={res.logoUrl || ''} onChange={e => {
                                const newVids = [...(course.videos || [])];
                                newVids[idx].resources![rIdx].logoUrl = e.target.value;
                                setCourse({...course, videos: newVids});
                              }} className="flex-1 sm:min-w-[150px] bg-background border border-border rounded px-2 py-1 text-xs" placeholder="Logo icon url (opt)" />

                              <button onClick={() => {
                                const newVids = [...(course.videos || [])];
                                newVids[idx].resources!.splice(rIdx, 1);
                                setCourse({...course, videos: newVids});
                              }} className="p-2 sm:p-1 text-red-500 hover:bg-red-500/10 rounded shrink-0"><X className="w-3 h-3 sm:w-4 sm:h-4" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )})}
                {course.videos?.length === 0 && <p className="text-sm text-muted-foreground italic">No videos added yet.</p>}
              </div>

              {/* Pagination Controls */}
              {totalVideoPages > 1 && (
                <div className="flex items-center justify-between mt-6 bg-muted/20 p-2 rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground ms-2">
                    Showing {((currentVideoPage - 1) * videosPerPage) + 1} - {Math.min(currentVideoPage * videosPerPage, course.videos?.length || 0)} of {course.videos?.length || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentVideoPage(p => Math.max(1, p - 1))}
                      disabled={currentVideoPage === 1}
                      className="p-1.5 rounded-md border border-border bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium px-2">{currentVideoPage} / {totalVideoPages}</span>
                    <button
                      onClick={() => setCurrentVideoPage(p => Math.min(totalVideoPages, p + 1))}
                      disabled={currentVideoPage === totalVideoPages}
                      className="p-1.5 rounded-md border border-border bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 flex justify-end">
              <button disabled={isSaving} onClick={handleSaveCourse} className="w-full sm:w-auto bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Course'}
              </button>
            </div>
          </div>
        )}

        {type === 'path' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">ID (leave as is unless custom)</label>
                <input value={path.id || ''} onChange={e => setPath({...path, id: e.target.value})} className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm" disabled={!!itemToEdit} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input value={path.title || ''} onChange={e => setPath({...path, title: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="e.g. Frontend Path" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={path.description || ''} onChange={e => setPath({...path, description: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icon Name</label>
                <select value={path.icon} onChange={e => setPath({...path, icon: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                  <option value="Code">Code</option>
                  <option value="Terminal">Terminal</option>
                  <option value="Layout">Layout</option>
                  <option value="Database">Database</option>
                  <option value="Shield">Shield</option>
                </select>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Courses in this Path</h3>
                <button 
                  onClick={() => setPath({...path, courseIds: [...(path.courseIds || []), '']})}
                  className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded hover:bg-primary/20 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Course
                </button>
              </div>
              
              <div className="space-y-3">
                {path.courseIds?.map((cId, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input value={cId} onChange={e => {
                      const newIds = [...(path.courseIds || [])];
                      newIds[idx] = e.target.value;
                      setPath({...path, courseIds: newIds});
                    }} className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm" placeholder="Paste exact Course ID here..." />
                    <button onClick={() => {
                      const newIds = [...(path.courseIds || [])];
                      newIds.splice(idx, 1);
                      setPath({...path, courseIds: newIds});
                    }} className="p-2 text-red-500 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button disabled={isSaving} onClick={handleSavePath} className="w-full sm:w-auto bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Learning Path'}
              </button>
            </div>
          </div>
        )}

        {type === 'notification' && (
          <div className="space-y-4" dir="auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">ID</label>
                <input value={notification.id || ''} onChange={e => setNotification({...notification, id: e.target.value})} className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm" disabled={!!itemToEdit} />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input type="checkbox" checked={notification.isActive !== false} onChange={e => setNotification({...notification, isActive: e.target.checked})} id="notifActive" className="w-4 h-4 cursor-pointer" />
                <label htmlFor="notifActive" className="text-sm font-medium cursor-pointer">Is Active (Show to users)</label>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Popup Title</label>
                <input value={notification.title || ''} onChange={e => setNotification({...notification, title: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="e.g. New Masterclass Released!" />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Message Content (Supports Arabic and English)</label>
                <textarea value={notification.message || ''} onChange={e => setNotification({...notification, message: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" rows={4} placeholder="Type your announcement here..." />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Image URL (Optional)</label>
                <input value={notification.image || ''} onChange={e => setNotification({...notification, image: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="https://..." />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Primary Action Link (Optional)</label>
                <input value={notification.link || ''} onChange={e => setNotification({...notification, link: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="https://... or /course/..." />
                <p className="text-xs text-muted-foreground mt-1">If provided, an action button will appear bridging users to this page.</p>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Primary Action Logo (Optional)</label>
                <input value={notification.linkLogo || ''} onChange={e => setNotification({...notification, linkLogo: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="https://..." />
              </div>

              <div className="col-span-1 sm:col-span-2 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Additional Links (Up to 10)</label>
                  <button 
                    type="button"
                    onClick={() => {
                      const currentLinks = notification.links || [];
                      if (currentLinks.length < 10) {
                        setNotification({ ...notification, links: [...currentLinks, { label: '', url: '', logo: '' }] });
                      }
                    }}
                    className="text-xs flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded"
                  >
                    <Plus className="w-3 h-3" /> Add Link
                  </button>
                </div>
                {(notification.links || []).map((link, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 mb-4 items-start bg-muted p-3 rounded-lg border border-border">
                    <div className="flex-1 w-full space-y-2">
                      <input 
                        value={link.label} 
                        onChange={e => {
                          const newLinks = [...(notification.links || [])];
                          newLinks[idx].label = e.target.value;
                          setNotification({...notification, links: newLinks});
                        }} 
                        placeholder="Label (e.g. Join Discord)" 
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" 
                      />
                      <input 
                        value={link.url} 
                        onChange={e => {
                          const newLinks = [...(notification.links || [])];
                          newLinks[idx].url = e.target.value;
                          setNotification({...notification, links: newLinks});
                        }} 
                        placeholder="URL (e.g. https://...)" 
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" 
                      />
                      <input 
                        value={link.logo || ''} 
                        onChange={e => {
                          const newLinks = [...(notification.links || [])];
                          newLinks[idx].logo = e.target.value;
                          setNotification({...notification, links: newLinks});
                        }} 
                        placeholder="Logo Image URL (Optional)" 
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" 
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const newLinks = [...(notification.links || [])];
                        newLinks.splice(idx, 1);
                        setNotification({...notification, links: newLinks});
                      }}
                      className="p-2.5 mt-2 sm:mt-0 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button disabled={isSaving} onClick={handleSaveNotification} className="w-full sm:w-auto bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Notification'}
              </button>
            </div>
          </div>
        )}

        {type === 'banner' && (
          <div className="space-y-6">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-primary">Recommended Image Sizes</p>
                <p className="text-primary/80 mt-1">
                  For best results and no distortion, please respect these aspect ratios:
                </p>
                <ul className="list-disc list-inside mt-2 text-primary/80 space-y-1">
                  <li><strong>Desktop:</strong> Minimum 1200x200px (6:1 ratio)</li>
                  <li><strong>Mobile:</strong> Minimum 600x400px (1.5:1 ratio)</li>
                  <li><strong>Format:</strong> JPEG, PNG, WEBP, and GIF are all fully supported. Just paste the direct image link.</li>
                </ul>
                <p className="text-primary/80 mt-2">
                  Images will automatically scale to fit the width but will preserve their aspect ratio to prevent squishing. Multiple banners in the same placement will stack on top of each other.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Placement</label>
                <select 
                  value={banner.placement || 'home-hero'} 
                  onChange={e => setBanner({...banner, placement: e.target.value as any})}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                >
                  <option value="home-hero">Home Top (Hero)</option>
                  <option value="home-middle">Home Middle</option>
                  <option value="home-bottom">Home Bottom</option>
                  <option value="course-sidebar">Course Sidebar</option>
                  <option value="course-bottom">Course Bottom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Target Language</label>
                <select 
                  value={banner.language || 'all'} 
                  onChange={e => setBanner({...banner, language: e.target.value as any})}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">Both (English & Arabic)</option>
                  <option value="en">English Only</option>
                  <option value="ar">Arabic Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Desktop Image URL *</label>
                <input 
                  value={banner.desktopImageUrl || ''} 
                  onChange={e => setBanner({...banner, desktopImageUrl: e.target.value})} 
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" 
                  placeholder="https://..." 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mobile Image URL *</label>
                <input 
                  value={banner.mobileImageUrl || ''} 
                  onChange={e => setBanner({...banner, mobileImageUrl: e.target.value})} 
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" 
                  placeholder="https://..." 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Target URL (On Click)</label>
                <input 
                  value={banner.targetUrl || ''} 
                  onChange={e => setBanner({...banner, targetUrl: e.target.value})} 
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" 
                  placeholder="https://..." 
                />
              </div>

              <div className="flex items-center gap-2 mt-4 p-4 border border-border rounded-lg bg-muted/30">
                <input type="checkbox" id="bannerActive" checked={banner.isActive} onChange={e => setBanner({...banner, isActive: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-primary mr-2" />
                <label htmlFor="bannerActive" className="font-medium cursor-pointer">Active</label>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button disabled={isSaving} onClick={handleSaveBanner} className="w-full sm:w-auto bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Banner'}
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
