import { useState, useEffect, useMemo, useRef } from 'react';
import { Course, LearningPath, AppNotification, AdBannerData, Book } from '../data/courses';
import { addOrUpdateCourse, addOrUpdatePath, addOrUpdateNotification, addOrUpdateBanner, addOrUpdateBook } from '../lib/firestoreContent';
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
  ArrowRight,
  Key,
  HelpCircle,
  ShoppingBag,
  Clock,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading3,
  Quote,
  Highlighter,
  Eye,
  ThumbsUp,
  MessageSquare,
  Users,
  RefreshCw
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { 
  fetchPlaylistVideos, 
  fetchPlaylistFullData,
  extractPlaylistId, 
  fetchChannelDetailsFromVideoOrPlaylist, 
  fetchVideoDetails,
  getYouTubeApiKey,
  setCustomYouTubeApiKey,
  fetchFullYoutubeVideoMetadata,
  extractYoutubeVideoId,
  searchBookCoverOnline,
  formatCompactNumber
} from '../lib/youtube';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { normalizeCategory } from '../lib/courseUtils';
import { BookCoverVisual, AmazonIcon, RichFormattedText, FormattedInlineText } from './BookVideoModal';

const POPULAR_BOOK_CATEGORIES = [
  'Software Engineering',
  'AI & Future Tech',
  'Cybersecurity',
  'Productivity & Mindset',
  'Business & Startups',
  'Design & Product',
  'Computer Science',
  'Self-Development'
];

const POPULAR_CATEGORIES = [
  'Programming',
  'Web Development',
  'Cybersecurity',
  'AI & Machine Learning',
  'DevOps & Cloud',
  'Mobile Apps',
  'Design & UI/UX',
  'Digital Marketing',
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
  type: 'course' | 'path' | 'notification' | 'banner' | 'book', 
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

  const [book, setBook] = useState<Partial<Book>>(itemToEdit || {
    id: 'book_' + Math.random().toString(36).substring(2, 9),
    title: '',
    author: '',
    description: '',
    category: 'Software Engineering',
    subCategory: '',
    coverImage: '',
    youtubeUrl: '',
    youtubeId: '',
    videoTitle: '',
    videoThumbnail: '',
    videoDuration: '',
    youtubeName: '',
    youtubeAvatar: '',
    youtubeChannelUrl: '',
    youtubeUrlAr: '',
    youtubeIdAr: '',
    videoTitleAr: '',
    videoThumbnailAr: '',
    videoDurationAr: '',
    youtubeNameAr: '',
    youtubeAvatarAr: '',
    youtubeChannelUrlAr: '',
    buyUrl: '',
    buyUrlAr: '',
    language: 'English',
    keyTakeaways: [],
    isApproved: true,
    createdAt: Date.now(),
  });

  const [isFetchingBookYt, setIsFetchingBookYt] = useState(false);
  const [isFetchingBookYtAr, setIsFetchingBookYtAr] = useState(false);
  const [isSearchingBookCover, setIsSearchingBookCover] = useState(false);
  const [bookYtStatus, setBookYtStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [bookYtStatusAr, setBookYtStatusAr] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSummaryPreview, setShowSummaryPreview] = useState(false);
  const [showTakeawaysPreview, setShowTakeawaysPreview] = useState(false);
  const summaryTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const takeawaysTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Smart Rich Text Formatting Toolbar Helper for Book Summary
  const applySummaryFormat = (
    formatType: 'bold' | 'italic' | 'highlight' | 'heading' | 'bullet' | 'number' | 'quote'
  ) => {
    const el = summaryTextareaRef.current;
    const currentVal = book.description || '';
    if (!el) return;

    const start = el.selectionStart ?? currentVal.length;
    const end = el.selectionEnd ?? currentVal.length;
    const selected = currentVal.slice(start, end);

    let replacement = '';
    let cursorOffset = 0;

    if (formatType === 'bold') {
      const text = selected || 'bold text';
      replacement = `**${text}**`;
      cursorOffset = replacement.length;
    } else if (formatType === 'italic') {
      const text = selected || 'italic text';
      replacement = `*${text}*`;
      cursorOffset = replacement.length;
    } else if (formatType === 'highlight') {
      const text = selected || 'highlighted key point';
      replacement = `==${text}==`;
      cursorOffset = replacement.length;
    } else if (formatType === 'heading') {
      const prefix = start > 0 && currentVal[start - 1] !== '\n' ? '\n' : '';
      const text = selected || 'Section Heading';
      replacement = `${prefix}### ${text}\n`;
      cursorOffset = replacement.length;
    } else if (formatType === 'bullet') {
      const prefix = start > 0 && currentVal[start - 1] !== '\n' ? '\n' : '';
      if (selected.includes('\n')) {
        replacement = prefix + selected.split('\n').map(l => `- ${l.replace(/^[-•*]\s+/, '')}`).join('\n');
      } else {
        replacement = `${prefix}- ${selected || 'Important point'}`;
      }
      cursorOffset = replacement.length;
    } else if (formatType === 'number') {
      const prefix = start > 0 && currentVal[start - 1] !== '\n' ? '\n' : '';
      if (selected.includes('\n')) {
        replacement = prefix + selected.split('\n').map((l, idx) => `${idx + 1}. ${l.replace(/^\d+[.)]\s+/, '')}`).join('\n');
      } else {
        replacement = `${prefix}1. ${selected || 'First step or concept'}`;
      }
      cursorOffset = replacement.length;
    } else if (formatType === 'quote') {
      const prefix = start > 0 && currentVal[start - 1] !== '\n' ? '\n' : '';
      const text = selected || 'Memorable quote or core principle from the book';
      replacement = `${prefix}> ${text}\n`;
      cursorOffset = replacement.length;
    }

    const updated = currentVal.slice(0, start) + replacement + currentVal.slice(end);
    setBook(prev => ({ ...prev, description: updated }));

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 10);
  };

  // Smart Rich Text Formatting Helper for Key Takeaways
  const applyTakeawaysFormat = (formatType: 'bold' | 'italic' | 'highlight' | 'add_item') => {
    const el = takeawaysTextareaRef.current;
    const currentVal = (book.keyTakeaways || []).join('\n');

    if (formatType === 'add_item') {
      const nextList = [...(book.keyTakeaways || []).filter(Boolean), '**Key Insight:** Actionable lesson from this chapter'];
      setBook(prev => ({ ...prev, keyTakeaways: nextList }));
      return;
    }

    if (!el) return;
    const start = el.selectionStart ?? currentVal.length;
    const end = el.selectionEnd ?? currentVal.length;
    const selected = currentVal.slice(start, end);

    let replacement = '';
    if (formatType === 'bold') {
      replacement = `**${selected || 'Bold concept'}**`;
    } else if (formatType === 'italic') {
      replacement = `*${selected || 'italic note'}*`;
    } else if (formatType === 'highlight') {
      replacement = `==${selected || 'core takeaway'}==`;
    }

    const updated = currentVal.slice(0, start) + replacement + currentVal.slice(end);
    setBook(prev => ({ ...prev, keyTakeaways: updated.split('\n') }));

    setTimeout(() => {
      el.focus();
      const pos = start + replacement.length;
      el.setSelectionRange(pos, pos);
    }, 10);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{type: 'error'|'success', text: string} | null>(null);
  const [playlistUrlInput, setPlaylistUrlInput] = useState('');

  // YouTube API Key Configuration for Vercel / Client
  const [apiKeyInput, setApiKeyInput] = useState(() => getYouTubeApiKey());
  const [hasApiKey, setHasApiKey] = useState(() => !!getYouTubeApiKey());
  const [showApiKeySetting, setShowApiKeySetting] = useState(false);
  const [apiKeySavedStatus, setApiKeySavedStatus] = useState<string | null>(null);

  const handleSaveApiKey = (keyToSave?: string) => {
    const key = (keyToSave !== undefined ? keyToSave : apiKeyInput).trim();
    setCustomYouTubeApiKey(key);
    setApiKeyInput(key);
    setHasApiKey(!!key);
    setApiKeySavedStatus(key ? 'API Key saved successfully!' : 'Key removed');
    setTimeout(() => setApiKeySavedStatus(null), 3000);
    return key;
  };

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

  // Smart Auto-Import YouTube Playlist OR Single Video (with Real Views, Likes, Comments, Channel Subscribers & Auto-Sync Playlist ID)
  const handleImportPlaylist = async (overrideKey?: string, overrideUrl?: string) => {
    const rawTarget = (overrideUrl !== undefined ? overrideUrl : playlistUrlInput).trim();
    if (!rawTarget) return;
    
    setImportMessage(null);
    const playlistId = extractPlaylistId(rawTarget);
    const singleVideoId = !playlistId ? extractYoutubeVideoId(rawTarget) : '';

    if (!playlistId && !singleVideoId) {
      setImportMessage({ type: 'error', text: 'Invalid YouTube Playlist or Video URL. Paste a playlist link (list=PL...) or video link (watch?v=...).' });
      return;
    }

    const keyToUse = (overrideKey !== undefined ? overrideKey : (apiKeyInput.trim() || getYouTubeApiKey()));

    setIsImporting(true);
    try {
      // Case A: User pasted a Single Video URL into the 1-Click Importer (e.g. for a Masterclass or single lesson)
      if (!playlistId && singleVideoId) {
        const meta = await fetchFullYoutubeVideoMetadata(singleVideoId, keyToUse);
        if (!meta) {
          setImportMessage({ type: 'error', text: 'Could not extract video details from YouTube.' });
          return;
        }
        const vidObj: Video = {
          id: `v_${singleVideoId}`,
          title: meta.videoTitle || 'Video Lesson',
          youtubeId: singleVideoId,
          duration: meta.videoDuration || '15:00',
          viewCount: meta.viewCount || 0,
          likeCount: meta.likeCount || 0,
          commentCount: meta.commentCount || 0,
          language: course.language || 'English',
          description: meta.description || '',
          resources: [],
        };
        const existingIds = new Set((course.videos || []).map(v => v.youtubeId).filter(Boolean));
        const newVids = existingIds.has(singleVideoId)
          ? (course.videos || []).map(v => v.youtubeId === singleVideoId ? { ...v, ...vidObj } : v)
          : [...(course.videos || []), vidObj];

        const totalViews = newVids.reduce((acc, v) => acc + (v.viewCount || 0), 0);
        const totalLikes = newVids.reduce((acc, v) => acc + (v.likeCount || 0), 0);
        const totalComments = newVids.reduce((acc, v) => acc + (v.commentCount || 0), 0);
        const subCount = meta.subscriberCount || course.subscriberCount || 0;
        const subText = meta.subscriberCountText || course.subscriberCountText || (subCount > 0 ? formatCompactNumber(subCount) : '');

        setCourse(prev => ({
          ...prev,
          title: prev.title?.trim() ? prev.title : (meta.videoTitle || prev.title),
          description: prev.description?.trim() ? prev.description : (meta.description ? meta.description.slice(0, 500) : prev.description),
          thumbnail: prev.thumbnail?.trim() ? prev.thumbnail : `https://img.youtube.com/vi/${singleVideoId}/maxresdefault.jpg`,
          videos: newVids,
          instructor: meta.youtubeName || prev.instructor,
          youtubeChannelName: meta.youtubeName || prev.youtubeChannelName || prev.instructor,
          instructorAvatar: meta.youtubeAvatar || prev.instructorAvatar,
          instructorUrl: meta.youtubeChannelUrl || prev.instructorUrl,
          channelId: meta.channelId || prev.channelId,
          subscriberCount: subCount,
          subscriberCountText: subText,
          totalViews,
          totalLikes,
          totalComments,
          lastSyncedAt: Date.now()
        }));

        setPlaylistUrlInput('');
        setImportMessage({
          type: 'success',
          text: `Imported video "${meta.videoTitle}" with Live Stats (${formatCompactNumber(totalViews)} views • ${formatCompactNumber(totalLikes)} likes • ${formatCompactNumber(totalComments)} comments${subText ? ` • ${subText} subscribers` : ''})!`
        });
        return;
      }

      // Case B: User pasted a YouTube Playlist URL or ID
      const fullData = await fetchPlaylistFullData(playlistId!, keyToUse);
      const importedVideos = fullData.videos || [];
      
      if (!importedVideos || importedVideos.length === 0) {
        setImportMessage({ type: 'error', text: 'No videos found in playlist, or the playlist is private/unlisted.' });
      } else {
        // Auto-apply current course language
        if (course.language) {
          importedVideos.forEach(v => v.language = course.language);
        }

        // Merge with existing videos by youtubeId so re-importing updates real stats
        const importedByYtId = new Map<string, Video>();
        importedVideos.forEach(v => {
          if (v.youtubeId) importedByYtId.set(v.youtubeId, v);
        });
        const existingIds = new Set((course.videos || []).map(v => v.youtubeId).filter(Boolean));
        const updatedExisting = (course.videos || []).map(ev => {
          const fresh = ev.youtubeId ? importedByYtId.get(ev.youtubeId) : undefined;
          return fresh ? { ...ev, ...fresh, title: ev.title || fresh.title } : ev;
        });
        const uniqueNew = importedVideos.filter(v => !v.youtubeId || !existingIds.has(v.youtubeId));
        const newVids = [...updatedExisting, ...uniqueNew];
        
        // Auto-fill thumbnail if empty
        let newThumbnail = course.thumbnail;
        if ((!newThumbnail || newThumbnail.trim() === '') && newVids[0]?.youtubeId) {
          newThumbnail = `https://img.youtube.com/vi/${newVids[0].youtubeId}/maxresdefault.jpg`;
        }

        // Auto-fetch channel info & first video stats if not returned yet
        let firstVideoMeta: any = null;
        if ((!fullData.channelName || !fullData.subscriberCount || !newVids[0]?.likeCount) && newVids[0]?.youtubeId) {
          firstVideoMeta = await fetchFullYoutubeVideoMetadata(newVids[0].youtubeId, keyToUse);
          if (firstVideoMeta) {
            newVids[0] = {
              ...newVids[0],
              viewCount: firstVideoMeta.viewCount || newVids[0].viewCount || 0,
              likeCount: firstVideoMeta.likeCount || newVids[0].likeCount || 0,
              commentCount: firstVideoMeta.commentCount || newVids[0].commentCount || 0,
              duration: (newVids[0].duration && newVids[0].duration !== '00:00') ? newVids[0].duration : (firstVideoMeta.videoDuration || '15:00'),
            };
          }
        }

        const totalViews = newVids.reduce((acc, v) => acc + (v.viewCount || 0), 0);
        const totalLikes = newVids.reduce((acc, v) => acc + (v.likeCount || 0), 0);
        const totalComments = newVids.reduce((acc, v) => acc + (v.commentCount || 0), 0);
        const subCount = fullData.subscriberCount || firstVideoMeta?.subscriberCount || course.subscriberCount || 0;
        const subText = fullData.subscriberCountText || firstVideoMeta?.subscriberCountText || course.subscriberCountText || (subCount > 0 ? formatCompactNumber(subCount) : '');

        setCourse(prev => ({
          ...prev,
          playlistId: playlistId!,
          title: prev.title?.trim() ? prev.title : (fullData.playlistTitle || newVids[0]?.title || prev.title),
          description: prev.description?.trim() ? prev.description : (fullData.playlistDescription || firstVideoMeta?.description?.slice(0, 500) || prev.description),
          thumbnail: newThumbnail,
          videos: newVids,
          instructor: fullData.channelName || firstVideoMeta?.youtubeName || prev.instructor,
          youtubeChannelName: fullData.channelName || firstVideoMeta?.youtubeName || prev.youtubeChannelName || prev.instructor,
          instructorAvatar: fullData.channelAvatar || firstVideoMeta?.youtubeAvatar || prev.instructorAvatar,
          instructorUrl: fullData.channelUrl || firstVideoMeta?.youtubeChannelUrl || prev.instructorUrl,
          channelId: fullData.channelId || firstVideoMeta?.channelId || prev.channelId,
          subscriberCount: subCount,
          subscriberCountText: subText,
          totalViews,
          totalLikes,
          totalComments,
          lastSyncedAt: Date.now()
        }));
        
        setPlaylistUrlInput('');
        setImportMessage({ 
          type: 'success', 
          text: `Imported ${importedVideos.length} videos with Live YouTube Stats (${formatCompactNumber(totalViews)} views • ${formatCompactNumber(totalLikes)} likes • ${formatCompactNumber(totalComments)} comments${subText ? ` • ${subText} subscribers` : ''}) & Auto-Sync enabled!` 
        });
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to fetch playlist';
      setImportMessage({ type: 'error', text: msg });
      if (msg.includes('API Key') || msg.includes('API_KEY') || !hasApiKey) {
        setShowApiKeySetting(true);
      }
    } finally {
      setIsImporting(false);
    }
  };

  // Fetch single video real-time metadata & statistics when admin adds/edits a video ID
  const handleFetchSingleVideoRealtime = async (idx: number, rawUrlOrId?: string) => {
    const vid = course.videos?.[idx];
    const targetInput = (rawUrlOrId !== undefined ? rawUrlOrId : vid?.youtubeId || '').trim();
    const cleanId = extractYoutubeVideoId(targetInput);
    if (!cleanId) return;

    try {
      const meta = await fetchFullYoutubeVideoMetadata(cleanId, apiKeyInput);
      if (!meta) return;

      setCourse(prev => {
        const currentVids = [...(prev.videos || [])];
        if (!currentVids[idx]) return prev;
        currentVids[idx] = {
          ...currentVids[idx],
          youtubeId: cleanId,
          title: currentVids[idx].title?.trim() ? currentVids[idx].title : (meta.videoTitle || currentVids[idx].title),
          duration: (currentVids[idx].duration?.trim() && currentVids[idx].duration !== '00:00') ? currentVids[idx].duration : (meta.videoDuration || '15:00'),
          description: currentVids[idx].description?.trim() ? currentVids[idx].description : (meta.description || ''),
          viewCount: meta.viewCount || currentVids[idx].viewCount || 0,
          likeCount: meta.likeCount || currentVids[idx].likeCount || 0,
          commentCount: meta.commentCount || currentVids[idx].commentCount || 0,
        };

        const totalViews = currentVids.reduce((acc, v) => acc + (v.viewCount || 0), 0);
        const totalLikes = currentVids.reduce((acc, v) => acc + (v.likeCount || 0), 0);
        const totalComments = currentVids.reduce((acc, v) => acc + (v.commentCount || 0), 0);

        return {
          ...prev,
          title: prev.title?.trim() ? prev.title : (idx === 0 ? meta.videoTitle : prev.title),
          description: prev.description?.trim() ? prev.description : (idx === 0 && meta.description ? meta.description.slice(0, 400) : prev.description),
          thumbnail: prev.thumbnail?.trim() ? prev.thumbnail : `https://img.youtube.com/vi/${cleanId}/maxresdefault.jpg`,
          instructor: prev.instructor?.trim() ? prev.instructor : (meta.youtubeName || prev.instructor),
          youtubeChannelName: prev.youtubeChannelName?.trim() ? prev.youtubeChannelName : (meta.youtubeName || prev.instructor),
          instructorAvatar: prev.instructorAvatar?.trim() ? prev.instructorAvatar : (meta.youtubeAvatar || prev.instructorAvatar),
          instructorUrl: prev.instructorUrl?.trim() ? prev.instructorUrl : (meta.youtubeChannelUrl || prev.instructorUrl),
          channelId: meta.channelId || prev.channelId,
          subscriberCount: meta.subscriberCount || prev.subscriberCount || 0,
          subscriberCountText: meta.subscriberCountText || prev.subscriberCountText || (meta.subscriberCount ? formatCompactNumber(meta.subscriberCount) : ''),
          videos: currentVids,
          totalViews,
          totalLikes,
          totalComments,
          lastSyncedAt: Date.now()
        };
      });
    } catch (e) {
      console.warn('Auto fetch single video stats warning:', e);
    }
  };

  // Auto fetch instructor & real subscriber count from first video
  const handleAutoFetchInstructor = async () => {
    const firstVidId = course.videos?.[0]?.youtubeId;
    if (!firstVidId) {
      return;
    }

    try {
      const meta = await fetchFullYoutubeVideoMetadata(firstVidId, apiKeyInput);
      if (meta) {
        setCourse(prev => ({
          ...prev,
          instructor: meta.youtubeName || prev.instructor,
          youtubeChannelName: meta.youtubeName || prev.youtubeChannelName || prev.instructor,
          instructorAvatar: meta.youtubeAvatar || prev.instructorAvatar,
          instructorUrl: meta.youtubeChannelUrl || prev.instructorUrl,
          channelId: meta.channelId || prev.channelId,
          subscriberCount: meta.subscriberCount || prev.subscriberCount || 0,
          subscriberCountText: meta.subscriberCountText || prev.subscriberCountText || (meta.subscriberCount ? formatCompactNumber(meta.subscriberCount) : '')
        }));
      }
    } catch (e) {
      console.error(e);
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
      // Guarantee high timestamp for newly created courses so they are always at the top of the list
      if (!itemToEdit || !cleanCourse.createdAt) {
        cleanCourse.createdAt = Date.now();
      }
      if (cleanCourse.category) {
        cleanCourse.category = normalizeCategory(cleanCourse.category);
      }

      // If first video has no stats yet or instructor subscribers/likes/comments are missing, fetch real-time stats automatically before saving
      if (Array.isArray(cleanCourse.videos) && cleanCourse.videos.length > 0) {
        const firstVid = cleanCourse.videos[0];
        if (firstVid?.youtubeId && (!firstVid.viewCount || !firstVid.likeCount || !cleanCourse.subscriberCount)) {
          try {
            const liveMeta = await fetchFullYoutubeVideoMetadata(firstVid.youtubeId, apiKeyInput);
            if (liveMeta) {
              firstVid.viewCount = liveMeta.viewCount || firstVid.viewCount || 0;
              firstVid.likeCount = liveMeta.likeCount || firstVid.likeCount || 0;
              firstVid.commentCount = liveMeta.commentCount || firstVid.commentCount || 0;
              if (!firstVid.duration || firstVid.duration === '00:00') {
                firstVid.duration = liveMeta.videoDuration || '15:00';
              }
              if (!cleanCourse.instructor?.trim() && liveMeta.youtubeName) {
                cleanCourse.instructor = liveMeta.youtubeName;
              }
              if (!cleanCourse.instructorAvatar?.trim() && liveMeta.youtubeAvatar) {
                cleanCourse.instructorAvatar = liveMeta.youtubeAvatar;
              }
              if (!cleanCourse.instructorUrl?.trim() && liveMeta.youtubeChannelUrl) {
                cleanCourse.instructorUrl = liveMeta.youtubeChannelUrl;
              }
              if (liveMeta.channelId && !cleanCourse.channelId) {
                cleanCourse.channelId = liveMeta.channelId;
              }
              if (liveMeta.subscriberCount) {
                cleanCourse.subscriberCount = liveMeta.subscriberCount;
                cleanCourse.subscriberCountText = liveMeta.subscriberCountText || formatCompactNumber(liveMeta.subscriberCount);
              }
            }
          } catch {}
        }

        cleanCourse.totalViews = cleanCourse.videos.reduce((acc: number, v: any) => acc + (v.viewCount || 0), 0);
        cleanCourse.totalLikes = cleanCourse.videos.reduce((acc: number, v: any) => acc + (v.likeCount || 0), 0);
        cleanCourse.totalComments = cleanCourse.videos.reduce((acc: number, v: any) => acc + (v.commentCount || 0), 0);
        cleanCourse.lastSyncedAt = Date.now();
      }
      
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

  // Smart Automatic YouTube Video Info Fetcher for Books (English Version)
  const handleAutoFetchBookYoutubeInfo = async (rawInput?: string) => {
    const inputUrl = (rawInput !== undefined ? rawInput : (book.youtubeUrl || book.youtubeId || '')).trim();
    if (!inputUrl) {
      setBookYtStatus({ type: 'error', text: 'Please paste an English YouTube video link or ID first.' });
      return;
    }

    const extractedId = extractYoutubeVideoId(inputUrl);
    if (!extractedId) {
      setBookYtStatus({ type: 'error', text: 'Invalid YouTube video URL. Example: https://www.youtube.com/watch?v=...' });
      return;
    }

    setIsFetchingBookYt(true);
    setBookYtStatus(null);
    try {
      const meta = await fetchFullYoutubeVideoMetadata(extractedId, apiKeyInput);
      if (meta) {
        setBook(prev => {
          const hasAr = Boolean(prev.youtubeIdAr?.trim() || prev.youtubeUrlAr?.trim());
          return {
            ...prev,
            youtubeUrl: inputUrl.startsWith('http') ? inputUrl : `https://www.youtube.com/watch?v=${extractedId}`,
            youtubeId: meta.youtubeId,
            videoTitle: meta.videoTitle || prev.videoTitle,
            videoThumbnail: meta.videoThumbnail || prev.videoThumbnail,
            videoDuration: meta.videoDuration || prev.videoDuration || '15:00',
            youtubeName: meta.youtubeName || prev.youtubeName,
            youtubeAvatar: meta.youtubeAvatar || prev.youtubeAvatar,
            youtubeChannelUrl: meta.youtubeChannelUrl || prev.youtubeChannelUrl,
            title: prev.title?.trim() ? prev.title : (meta.videoTitle || ''),
            description: prev.description?.trim() ? prev.description : (meta.description ? meta.description.slice(0, 400) : ''),
            language: hasAr ? 'Both' : 'English'
          };
        });
        setBookYtStatus({
          type: 'success',
          text: `EN Video Auto-fetched: "${meta.youtubeName}" • ${meta.videoDuration} • Thumbnail & Avatar ready!`
        });
      } else {
        setBookYtStatus({ type: 'error', text: 'Could not extract video details. You can still fill fields manually.' });
      }
    } catch (err: any) {
      setBookYtStatus({ type: 'error', text: err.message || 'Failed to fetch YouTube info.' });
    } finally {
      setIsFetchingBookYt(false);
    }
  };

  // Smart Automatic YouTube Video Info Fetcher for Books (Arabic Version)
  const handleAutoFetchBookYoutubeInfoAr = async (rawInput?: string) => {
    const inputUrl = (rawInput !== undefined ? rawInput : (book.youtubeUrlAr || book.youtubeIdAr || '')).trim();
    if (!inputUrl) {
      setBookYtStatusAr({ type: 'error', text: 'Please paste an Arabic YouTube video link or ID first.' });
      return;
    }

    const extractedId = extractYoutubeVideoId(inputUrl);
    if (!extractedId) {
      setBookYtStatusAr({ type: 'error', text: 'Invalid Arabic YouTube video URL. Example: https://www.youtube.com/watch?v=...' });
      return;
    }

    setIsFetchingBookYtAr(true);
    setBookYtStatusAr(null);
    try {
      const meta = await fetchFullYoutubeVideoMetadata(extractedId, apiKeyInput);
      if (meta) {
        setBook(prev => {
          const hasEn = Boolean(prev.youtubeId?.trim() || prev.youtubeUrl?.trim());
          return {
            ...prev,
            youtubeUrlAr: inputUrl.startsWith('http') ? inputUrl : `https://www.youtube.com/watch?v=${extractedId}`,
            youtubeIdAr: meta.youtubeId,
            videoTitleAr: meta.videoTitle || prev.videoTitleAr,
            videoThumbnailAr: meta.videoThumbnail || prev.videoThumbnailAr,
            videoDurationAr: meta.videoDuration || prev.videoDurationAr || '15:00',
            youtubeNameAr: meta.youtubeName || prev.youtubeNameAr,
            youtubeAvatarAr: meta.youtubeAvatar || prev.youtubeAvatarAr,
            youtubeChannelUrlAr: meta.youtubeChannelUrl || prev.youtubeChannelUrlAr,
            title: prev.title?.trim() ? prev.title : (meta.videoTitle || ''),
            description: prev.description?.trim() ? prev.description : (meta.description ? meta.description.slice(0, 400) : ''),
            language: hasEn ? 'Both' : 'Arabic'
          };
        });
        setBookYtStatusAr({
          type: 'success',
          text: `AR Video Auto-fetched: "${meta.youtubeName}" • ${meta.videoDuration} • Thumbnail & Avatar ready!`
        });
      } else {
        setBookYtStatusAr({ type: 'error', text: 'Could not extract Arabic video details. You can still fill fields manually.' });
      }
    } catch (err: any) {
      setBookYtStatusAr({ type: 'error', text: err.message || 'Failed to fetch Arabic YouTube info.' });
    } finally {
      setIsFetchingBookYtAr(false);
    }
  };

  // Optional 1-click book cover & author finder from OpenLibrary
  const handleFindBookCoverOnline = async () => {
    const queryTitle = book.title?.trim() || book.videoTitle?.trim() || '';
    if (!queryTitle) {
      setFormError("Enter a Book Title first to search for its cover online, or paste a Cover Image URL manually.");
      return;
    }
    setIsSearchingBookCover(true);
    try {
      const found = await searchBookCoverOnline(queryTitle, book.author);
      if (found && (found.coverUrl || found.authorName)) {
        setBook(prev => ({
          ...prev,
          coverImage: found.coverUrl || prev.coverImage,
          author: prev.author?.trim() ? prev.author : (found.authorName || prev.author)
        }));
        setBookYtStatus({
          type: 'success',
          text: found.coverUrl
            ? `Found official book cover${found.authorName ? ` & author (${found.authorName})` : ''}!`
            : `Found author: ${found.authorName}`
        });
      } else {
        setBookYtStatus({
          type: 'error',
          text: 'No exact cover found in public catalog. You can paste any Cover Image URL manually or use the Video Thumbnail.'
        });
      }
    } finally {
      setIsSearchingBookCover(false);
    }
  };

  const handleSaveBook = async () => {
    setFormError(null);
    if (!book.title?.trim()) {
      setFormError("Book Title is required.");
      return;
    }
    if (!book.author?.trim()) {
      setFormError("Book Author is required (you can enter the author name manually).");
      return;
    }

    const ytIdEn = extractYoutubeVideoId(book.youtubeUrl || book.youtubeId || '');
    const ytIdAr = extractYoutubeVideoId(book.youtubeUrlAr || book.youtubeIdAr || '');

    if (!ytIdEn && !ytIdAr) {
      setFormError("Please provide at least one YouTube Video Link (English Version link, Arabic Version link, or both).");
      return;
    }

    // Automatically determine language visibility based on which video links are provided
    const resolvedLanguage = ytIdEn && ytIdAr ? 'Both' : ytIdAr ? 'Arabic' : 'English';
    const primaryYtId = ytIdEn || ytIdAr;

    setIsSaving(true);
    try {
      const cleanBook: Book = {
        id: book.id || 'book_' + Math.random().toString(36).substring(2, 9),
        title: book.title.trim(),
        author: book.author.trim(),
        description: (book.description || '').trim(),
        category: (book.category || 'Software Engineering').trim(),
        ...(book.subCategory?.trim() ? { subCategory: book.subCategory.trim() } : {}),
        coverImage: (
          book.coverImage ||
          book.videoThumbnail ||
          book.videoThumbnailAr ||
          `https://img.youtube.com/vi/${primaryYtId}/maxresdefault.jpg`
        ).trim(),
        // English / Primary fields
        youtubeUrl: ytIdEn ? (book.youtubeUrl || `https://www.youtube.com/watch?v=${ytIdEn}`).trim() : '',
        youtubeId: ytIdEn || '',
        videoTitle: ytIdEn ? (book.videoTitle || book.title).trim() : '',
        videoThumbnail: ytIdEn ? (book.videoThumbnail || `https://img.youtube.com/vi/${ytIdEn}/maxresdefault.jpg`).trim() : '',
        videoDuration: (ytIdEn ? (book.videoDuration || '15:00') : (book.videoDurationAr || '15:00')).trim(),
        youtubeName: (ytIdEn ? (book.youtubeName || 'YouTube Creator') : (book.youtubeNameAr || 'YouTube Creator')).trim(),
        youtubeAvatar: (
          ytIdEn
            ? (book.youtubeAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(book.youtubeName || 'YT')}&background=ef4444&color=fff&bold=true`)
            : (book.youtubeAvatarAr || `https://ui-avatars.com/api/?name=${encodeURIComponent(book.youtubeNameAr || 'YT')}&background=ef4444&color=fff&bold=true`)
        ).trim(),
        youtubeChannelUrl: ytIdEn ? (book.youtubeChannelUrl || `https://www.youtube.com/watch?v=${ytIdEn}`).trim() : '',
        // Arabic Version fields (when Arabic link is provided)
        ...(ytIdAr ? {
          youtubeUrlAr: (book.youtubeUrlAr || `https://www.youtube.com/watch?v=${ytIdAr}`).trim(),
          youtubeIdAr: ytIdAr,
          videoTitleAr: (book.videoTitleAr || book.title).trim(),
          videoThumbnailAr: (book.videoThumbnailAr || `https://img.youtube.com/vi/${ytIdAr}/maxresdefault.jpg`).trim(),
          videoDurationAr: (book.videoDurationAr || '15:00').trim(),
          youtubeNameAr: (book.youtubeNameAr || 'صانع محتوى تعليمي').trim(),
          youtubeAvatarAr: (book.youtubeAvatarAr || `https://ui-avatars.com/api/?name=${encodeURIComponent(book.youtubeNameAr || 'AR')}&background=ef4444&color=fff&bold=true`).trim(),
          youtubeChannelUrlAr: (book.youtubeChannelUrlAr || `https://www.youtube.com/watch?v=${ytIdAr}`).trim(),
        } : {}),
        // Buy links for EN and AR versions
        ...(book.buyUrl?.trim() ? { buyUrl: book.buyUrl.trim() } : {}),
        ...(book.buyUrlAr?.trim() ? { buyUrlAr: book.buyUrlAr.trim() } : {}),
        language: resolvedLanguage,
        keyTakeaways: Array.isArray(book.keyTakeaways)
          ? book.keyTakeaways.map(k => k.trim()).filter(Boolean)
          : [],
        isApproved: book.isApproved !== false,
        createdAt: (!itemToEdit || !book.createdAt) ? Date.now() : book.createdAt
      };

      await addOrUpdateBook(cleanBook);
      await loadContent();
      onClose();
    } catch (err: any) {
      console.error("Book save error:", err);
      setFormError(err.message || "Failed to save book.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto">
      <div
        className={cn(
          "bg-card w-full h-[100dvh] sm:h-[90vh] max-h-[100dvh] sm:max-h-[94vh] rounded-t-3xl sm:rounded-3xl border border-border/80 shadow-2xl flex flex-col overflow-hidden text-start my-auto",
          type === 'book' ? "max-w-6xl" : "max-w-4xl"
        )}
      >
        
        {/* FIXED HEADER */}
        <div className="px-4 py-3.5 sm:p-5 border-b border-border/80 bg-muted/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              {type === 'course' || type === 'book' ? <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" /> : type === 'notification' ? <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-black text-foreground tracking-tight truncate">
                {itemToEdit ? 'Edit' : 'Create New'} {type === 'course' ? 'Course / Masterclass' : type === 'book' ? 'Book & Video Summary' : type === 'path' ? 'Learning Path' : type === 'notification' ? 'Push Notification' : 'Ad Banner'}
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-2">
                {type === 'course' ? 'Configure course details, curriculum videos, and instructor profile.' : type === 'book' ? 'Add English & Arabic YouTube video links, auto-fetch channel info, and customize cover, author, summary & Amazon buy buttons.' : 'Manage platform content stored in Firestore.'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0"
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
                        onChange={e => {
                          const val = e.target.value;
                          setPlaylistUrlInput(val);
                          const pId = extractPlaylistId(val.trim());
                          if (pId && val.includes('list=')) {
                            handleImportPlaylist(undefined, val.trim());
                          }
                        }} 
                        placeholder="Paste YouTube Playlist URL, ID, or Video Link here..." 
                        className="flex-1 bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none" 
                      />
                      <button
                        onClick={() => handleImportPlaylist()}
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

                    {/* Live Auto-Sync Linked Playlist ID Badge */}
                    {course.playlistId && (
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                          <span>Live Playlist Auto-Sync Active: <code className="font-mono bg-background/80 px-1.5 py-0.5 rounded">{course.playlistId}</code></span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          New videos added by the creator on YouTube automatically sync into this course
                        </span>
                      </div>
                    )}

                    {/* LIVE COURSE STATS SUMMARY BAR (Subscribers, Views, Likes, Comments) */}
                    {((course.videos && course.videos.length > 0) || course.subscriberCount || course.totalViews || course.totalLikes || course.totalComments) && (() => {
                      const liveViews = course.totalViews || (course.videos || []).reduce((acc, v) => acc + (v.viewCount || 0), 0);
                      const liveLikes = course.totalLikes || (course.videos || []).reduce((acc, v) => acc + (v.likeCount || 0), 0);
                      const liveComments = course.totalComments || (course.videos || []).reduce((acc, v) => acc + (v.commentCount || 0), 0);
                      const liveSubsText = course.subscriberCountText || (course.subscriberCount ? formatCompactNumber(course.subscriberCount) : '0');
                      return (
                        <div className="p-3 rounded-xl bg-background/80 border border-border/80 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                            <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
                              <User className="w-3.5 h-3.5" />
                              <span>{course.instructor || 'Creator'}: {liveSubsText} Followers</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/60">
                              <Eye className="w-3.5 h-3.5 text-primary" />
                              <span>{formatCompactNumber(liveViews)} Views</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/60">
                              <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{formatCompactNumber(liveLikes)} Likes</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/60">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                              <span>{formatCompactNumber(liveComments)} Comments</span>
                            </span>
                          </div>
                          {course.videos?.[0]?.youtubeId && (
                            <button
                              type="button"
                              onClick={() => {
                                if (course.playlistId) {
                                  handleImportPlaylist(undefined, course.playlistId);
                                } else if (course.videos?.[0]?.youtubeId) {
                                  handleFetchSingleVideoRealtime(0, course.videos[0].youtubeId);
                                }
                              }}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Refresh Live Data</span>
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* VIDEOS LIST HEADER */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <h3 className="text-sm font-black text-foreground">Course Curriculum ({course.videos?.length || 0} Videos)</h3>
                      <p className="text-[11px] text-muted-foreground">Paste any YouTube link or ID — real views, likes, comments & duration are fetched automatically.</p>
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
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black px-2 py-0.5 rounded-md bg-muted text-foreground">
                              Lesson #{idx + 1}
                            </span>

                            {(vid.viewCount || vid.likeCount || vid.commentCount) ? (
                              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground bg-muted/50 px-2.5 py-0.5 rounded-full border border-border/60">
                                <span className="inline-flex items-center gap-1 text-foreground">
                                  <Eye className="w-3 h-3 text-primary" />
                                  {formatCompactNumber(vid.viewCount)}
                                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-foreground">
                                  <ThumbsUp className="w-3 h-3 text-emerald-500" />
                                  {formatCompactNumber(vid.likeCount)}
                                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-foreground">
                                  <MessageSquare className="w-3 h-3 text-amber-500" />
                                  {formatCompactNumber(vid.commentCount)}
                                </span>
                              </div>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-1">
                            {vid.youtubeId && (
                              <button
                                type="button"
                                onClick={() => handleFetchSingleVideoRealtime(idx, vid.youtubeId)}
                                className="px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                title="Fetch real title, duration, views, likes & comments from YouTube"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Sync Real Stats</span>
                              </button>
                            )}
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
                                const rawVal = e.target.value;
                                const maybePlaylist = extractPlaylistId(rawVal);
                                if (maybePlaylist && rawVal.includes('list=') && !rawVal.includes('v=')) {
                                  setPlaylistUrlInput(rawVal);
                                  handleImportPlaylist(undefined, rawVal);
                                  return;
                                }
                                const extracted = extractYoutubeId(rawVal);
                                const newVids = [...(course.videos || [])];
                                newVids[idx].youtubeId = extracted;
                                setCourse({ ...course, videos: newVids });
                                if (extracted && extracted.length === 11) {
                                  handleFetchSingleVideoRealtime(idx, extracted);
                                }
                              }} 
                              placeholder="YouTube Video ID or full watch URL (auto-fetches real stats) *" 
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
                        <span className="text-[11px] font-semibold text-muted-foreground block mb-1">YouTube Channel / Instructor Name</span>
                        <input 
                          value={course.instructor || ''} 
                          onChange={e => setCourse({ ...course, instructor: e.target.value, youtubeChannelName: course.youtubeChannelName || e.target.value })} 
                          className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground" 
                          placeholder="e.g. Traversy Media / Elzero Web School" 
                        />
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Professor / Teacher Name (for Certificate)</span>
                        <input 
                          value={course.professorName || ''} 
                          onChange={e => setCourse({ ...course, professorName: e.target.value })} 
                          className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground" 
                          placeholder="e.g. Prof. Brad Traversy / Prof. Osama Elzero" 
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

                      <div>
                        <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Instructor Channel / Website Link</span>
                        <input 
                          value={course.instructorUrl || ''} 
                          onChange={e => setCourse({ ...course, instructorUrl: e.target.value })} 
                          className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground" 
                          placeholder="https://youtube.com/@channel" 
                        />
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Original Creator Subscribers / Followers (Auto-Synced)</span>
                        <input 
                          value={course.subscriberCountText || (course.subscriberCount ? formatCompactNumber(course.subscriberCount) : '')} 
                          onChange={e => setCourse({ ...course, subscriberCountText: e.target.value })} 
                          className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground font-semibold" 
                          placeholder="e.g. 2.1M (Fetched automatically from YouTube)" 
                        />
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Linked YouTube Playlist ID (Auto-Updates Future Videos)</span>
                        <input 
                          value={course.playlistId || ''} 
                          onChange={e => setCourse({ ...course, playlistId: extractPlaylistId(e.target.value) || e.target.value.trim() })} 
                          className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground font-mono" 
                          placeholder="PL... (Optional - enables automatic future video sync)" 
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

          {/* BOOK FORM (Smart YouTube Auto-Fetch + Manual Cover, Author, Category & Buy Link) */}
          {type === 'book' && (
            <div className="space-y-6">
              
              {/* 1. SMART DUAL-LANGUAGE YOUTUBE VIDEO AUTO-EXTRACTORS (ENGLISH VERSION + ARABIC VERSION) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* ENGLISH VERSION YOUTUBE VIDEO LINK */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-card border border-sky-500/25 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Youtube className="w-5 h-5 text-red-500" />
                      <span className="text-xs sm:text-sm font-black text-foreground">
                        1. English Version YouTube Link (EN)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-500 border border-sky-500/25">
                      Shown in English Version
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Paste the English YouTube video link. If you only fill this link (and leave Arabic empty), this book will appear <strong>only in the English version</strong>.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={book.youtubeUrl || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const extracted = extractYoutubeVideoId(val);
                        setBook(prev => ({
                          ...prev,
                          youtubeUrl: val,
                          youtubeId: extracted || '',
                          ...(extracted ? {
                            videoThumbnail: prev.videoThumbnail || `https://img.youtube.com/vi/${extracted}/maxresdefault.jpg`
                          } : {})
                        }));
                        if (extracted && (val.includes('youtube.com/') || val.includes('youtu.be/'))) {
                          handleAutoFetchBookYoutubeInfo(val);
                        }
                      }}
                      placeholder="https://www.youtube.com/watch?v=... (English)"
                      className="flex-1 bg-card border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-sky-500/40 focus:outline-none font-mono"
                    />

                    <button
                      type="button"
                      onClick={() => handleAutoFetchBookYoutubeInfo()}
                      disabled={isFetchingBookYt || !(book.youtubeUrl || book.youtubeId)}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-xs"
                    >
                      {isFetchingBookYt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{isFetchingBookYt ? 'Fetching...' : 'Auto-Fetch EN'}</span>
                    </button>
                  </div>

                  {bookYtStatus && (
                    <div className={cn(
                      "p-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-2",
                      bookYtStatus.type === 'error'
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    )}>
                      {bookYtStatus.type === 'error' ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <Check className="w-3.5 h-3.5 shrink-0" />}
                      <span>{bookYtStatus.text}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1">EN YouTube Channel Name</label>
                      <input
                        value={book.youtubeName || ''}
                        onChange={e => setBook({ ...book, youtubeName: e.target.value })}
                        placeholder="e.g. Ali Abdaal"
                        className="w-full bg-card border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1">EN Video Duration</label>
                      <input
                        value={book.videoDuration || ''}
                        onChange={e => setBook({ ...book, videoDuration: e.target.value })}
                        placeholder="e.g. 18:45"
                        className="w-full bg-card border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1">EN Channel Avatar URL</label>
                      <input
                        value={book.youtubeAvatar || ''}
                        onChange={e => setBook({ ...book, youtubeAvatar: e.target.value })}
                        placeholder="Auto-filled from YouTube..."
                        className="w-full bg-card border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1">EN Video Thumbnail URL</label>
                      <input
                        value={book.videoThumbnail || ''}
                        onChange={e => setBook({ ...book, videoThumbnail: e.target.value })}
                        placeholder="https://img.youtube.com/vi/..."
                        className="w-full bg-card border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* ARABIC VERSION YOUTUBE VIDEO LINK */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-card border border-emerald-500/25 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Youtube className="w-5 h-5 text-red-500" />
                      <span className="text-xs sm:text-sm font-black text-foreground">
                        2. Arabic Version YouTube Link (AR - النسخة العربية)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                      Shown in Arabic Version
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Paste the Arabic YouTube video link. If you only fill this link (and leave English empty), this book will appear <strong>only in the Arabic version</strong>.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={book.youtubeUrlAr || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const extracted = extractYoutubeVideoId(val);
                        setBook(prev => ({
                          ...prev,
                          youtubeUrlAr: val,
                          youtubeIdAr: extracted || '',
                          ...(extracted ? {
                            videoThumbnailAr: prev.videoThumbnailAr || `https://img.youtube.com/vi/${extracted}/maxresdefault.jpg`
                          } : {})
                        }));
                        if (extracted && (val.includes('youtube.com/') || val.includes('youtu.be/'))) {
                          handleAutoFetchBookYoutubeInfoAr(val);
                        }
                      }}
                      placeholder="https://www.youtube.com/watch?v=... (Arabic)"
                      className="flex-1 bg-card border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-emerald-500/40 focus:outline-none font-mono"
                    />

                    <button
                      type="button"
                      onClick={() => handleAutoFetchBookYoutubeInfoAr()}
                      disabled={isFetchingBookYtAr || !(book.youtubeUrlAr || book.youtubeIdAr)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-xs"
                    >
                      {isFetchingBookYtAr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{isFetchingBookYtAr ? 'Fetching...' : 'Auto-Fetch AR'}</span>
                    </button>
                  </div>

                  {bookYtStatusAr && (
                    <div className={cn(
                      "p-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-2",
                      bookYtStatusAr.type === 'error'
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    )}>
                      {bookYtStatusAr.type === 'error' ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <Check className="w-3.5 h-3.5 shrink-0" />}
                      <span>{bookYtStatusAr.text}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1">AR YouTube Channel Name</label>
                      <input
                        value={book.youtubeNameAr || ''}
                        onChange={e => setBook({ ...book, youtubeNameAr: e.target.value })}
                        placeholder="e.g. دوباميكافين / ناصر العقيل"
                        className="w-full bg-card border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1">AR Video Duration</label>
                      <input
                        value={book.videoDurationAr || ''}
                        onChange={e => setBook({ ...book, videoDurationAr: e.target.value })}
                        placeholder="e.g. 24:15"
                        className="w-full bg-card border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1">AR Channel Avatar URL</label>
                      <input
                        value={book.youtubeAvatarAr || ''}
                        onChange={e => setBook({ ...book, youtubeAvatarAr: e.target.value })}
                        placeholder="Auto-filled from YouTube..."
                        className="w-full bg-card border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1">AR Video Thumbnail URL</label>
                      <input
                        value={book.videoThumbnailAr || ''}
                        onChange={e => setBook({ ...book, videoThumbnailAr: e.target.value })}
                        placeholder="https://img.youtube.com/vi/..."
                        className="w-full bg-card border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground font-mono"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* 2. MANUAL BOOK DETAILS: TITLE, AUTHOR, COVER, CATEGORY & BUY LINK */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">Book Title *</label>
                      <input
                        value={book.title || ''}
                        onChange={e => setBook({ ...book, title: e.target.value })}
                        placeholder="e.g. Clean Code / العادات الذرية"
                        className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">Book Author (Manual Entry) *</label>
                      <input
                        value={book.author || ''}
                        onChange={e => setBook({ ...book, author: e.target.value })}
                        placeholder="e.g. Robert C. Martin / جيمس كلير"
                        className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                      />
                    </div>

                    {/* Manual Book Cover Image URL + Smart Helpers */}
                    <div className="col-span-1 sm:col-span-2 p-3.5 rounded-2xl bg-muted/20 border border-border/70 space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-primary" />
                          <span>Book Cover Image URL (Manual Entry or Auto-Find)</span>
                        </label>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={handleFindBookCoverOnline}
                            disabled={isSearchingBookCover}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            {isSearchingBookCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            <span>Auto-Find Cover by Title</span>
                          </button>

                          {book.videoThumbnail && (
                            <button
                              type="button"
                              onClick={() => setBook({ ...book, coverImage: book.videoThumbnail })}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-muted hover:bg-border text-foreground transition-colors cursor-pointer"
                            >
                              Use Video Thumbnail
                            </button>
                          )}
                        </div>
                      </div>

                      <input
                        value={book.coverImage || ''}
                        onChange={e => setBook({ ...book, coverImage: e.target.value })}
                        placeholder="Paste book cover image URL (https://...) or click Auto-Find Cover"
                        className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground font-mono focus:ring-2 focus:ring-primary/40 focus:outline-none"
                      />
                    </div>

                    {/* Category & Language */}
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">Book Category *</label>
                      <input
                        value={book.category || ''}
                        onChange={e => setBook({ ...book, category: e.target.value })}
                        placeholder="e.g. Software Engineering"
                        className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {POPULAR_BOOK_CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setBook({ ...book, category: cat })}
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer",
                              book.category === cat
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">Explanation Language</label>
                      <select
                        value={book.language || 'English'}
                        onChange={e => setBook({ ...book, language: e.target.value })}
                        className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none font-semibold"
                      >
                        <option value="English">English</option>
                        <option value="Arabic">Arabic (العربية)</option>
                        <option value="Both">Both (EN & AR)</option>
                      </select>

                      <label className="block text-xs font-bold text-foreground mt-3 mb-1">YouTube Channel Link (Optional)</label>
                      <input
                        value={book.youtubeChannelUrl || ''}
                        onChange={e => setBook({ ...book, youtubeChannelUrl: e.target.value })}
                        placeholder="https://www.youtube.com/@..."
                        className="w-full bg-card border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground font-mono"
                      />
                    </div>

                    {/* TWO BUY BOOK LINKS: ONE FOR ENGLISH VERSION & ONE FOR ARABIC VERSION */}
                    <div className="col-span-1 sm:col-span-2 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/25 space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                          <AmazonIcon className="w-4 h-4 text-amber-500" />
                          <span>Buy Book Buttons — English & Arabic Versions (Optional)</span>
                        </span>
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          Each Buy button is shown inside its respective language version
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-foreground mb-1">
                            1. Buy Button Link for English Version (EN)
                          </label>
                          <input
                            value={book.buyUrl || ''}
                            onChange={e => setBook({ ...book, buyUrl: e.target.value })}
                            placeholder="https://www.amazon.com/... (English Edition)"
                            className="w-full bg-card border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground font-mono focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-foreground mb-1">
                            2. Buy Button Link for Arabic Version (AR - رابط شراء النسخة العربية)
                          </label>
                          <input
                            value={book.buyUrlAr || ''}
                            onChange={e => setBook({ ...book, buyUrlAr: e.target.value })}
                            placeholder="https://www.amazon.sa/... or Jarir link (Arabic Edition)"
                            className="w-full bg-card border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground font-mono focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* RICH TEXT STUDIO: About This Book & Summary */}
                    <div className="col-span-1 sm:col-span-2 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <label className="block text-xs font-bold text-foreground">
                          About This Book & Summary (Rich Text Formatting Supported)
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowSummaryPreview(!showSummaryPreview)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border",
                            showSummaryPreview
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/80"
                          )}
                        >
                          <Eye className="w-3 h-3" />
                          <span>{showSummaryPreview ? 'Edit Text' : 'Live UI/UX Preview'}</span>
                        </button>
                      </div>

                      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden focus-within:ring-2 focus-within:ring-primary/40">
                        {/* Rich Formatting Toolbar */}
                        <div className="px-2.5 py-2 bg-muted/40 border-b border-border/70 flex items-center gap-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => applySummaryFormat('bold')}
                            className="p-1.5 rounded-lg hover:bg-card text-foreground/90 hover:text-foreground border border-transparent hover:border-border/70 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            title="Bold (**text**)"
                          >
                            <Bold className="w-3.5 h-3.5" />
                            <span>Bold</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => applySummaryFormat('italic')}
                            className="p-1.5 rounded-lg hover:bg-card text-foreground/90 hover:text-foreground border border-transparent hover:border-border/70 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            title="Italic (*text*)"
                          >
                            <Italic className="w-3.5 h-3.5" />
                            <span>Italic</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => applySummaryFormat('highlight')}
                            className="p-1.5 rounded-lg hover:bg-card text-amber-500 hover:text-amber-400 border border-transparent hover:border-border/70 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            title="Highlight (==text==)"
                          >
                            <Highlighter className="w-3.5 h-3.5" />
                            <span>Highlight</span>
                          </button>

                          <div className="h-4 w-[1px] bg-border/80 mx-1" />

                          <button
                            type="button"
                            onClick={() => applySummaryFormat('heading')}
                            className="p-1.5 rounded-lg hover:bg-card text-foreground/90 hover:text-foreground border border-transparent hover:border-border/70 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            title="Section Heading (### Heading)"
                          >
                            <Heading3 className="w-3.5 h-3.5" />
                            <span>Heading</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => applySummaryFormat('bullet')}
                            className="p-1.5 rounded-lg hover:bg-card text-foreground/90 hover:text-foreground border border-transparent hover:border-border/70 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            title="Bullet List (- item)"
                          >
                            <List className="w-3.5 h-3.5" />
                            <span>Bullet List</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => applySummaryFormat('number')}
                            className="p-1.5 rounded-lg hover:bg-card text-foreground/90 hover:text-foreground border border-transparent hover:border-border/70 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            title="Numbered List (1. item)"
                          >
                            <ListOrdered className="w-3.5 h-3.5" />
                            <span>Numbered List</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => applySummaryFormat('quote')}
                            className="p-1.5 rounded-lg hover:bg-card text-foreground/90 hover:text-foreground border border-transparent hover:border-border/70 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            title="Quote Callout (> quote)"
                          >
                            <Quote className="w-3.5 h-3.5" />
                            <span>Quote</span>
                          </button>
                        </div>

                        {showSummaryPreview ? (
                          <div className="p-4 min-h-[130px] bg-muted/15">
                            {book.description?.trim() ? (
                              <RichFormattedText content={book.description} />
                            ) : (
                              <p className="text-xs text-muted-foreground italic">
                                Nothing to preview yet. Switch to Edit Text and write or format your book summary.
                              </p>
                            )}
                          </div>
                        ) : (
                          <textarea
                            ref={summaryTextareaRef}
                            value={book.description || ''}
                            onChange={e => setBook({ ...book, description: e.target.value })}
                            rows={5}
                            placeholder={"Write a rich summary of this book...\nUse **bold text**, ==highlights==, ### Headings, or - Bullet lists!"}
                            className="w-full bg-card p-3.5 text-xs sm:text-sm text-foreground focus:outline-none leading-relaxed"
                          />
                        )}
                      </div>
                    </div>

                    {/* RICH TEXT STUDIO: Key Takeaways (1 per line + inline bold/highlight/italic) */}
                    <div className="col-span-1 sm:col-span-2 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <label className="block text-xs font-bold text-foreground">
                          Key Takeaways (One takeaway per line — Supports **Bold**, ==Highlight== & Lists)
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowTakeawaysPreview(!showTakeawaysPreview)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border",
                            showTakeawaysPreview
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/80"
                          )}
                        >
                          <Eye className="w-3 h-3" />
                          <span>{showTakeawaysPreview ? 'Edit Takeaways' : 'Live UI/UX Preview'}</span>
                        </button>
                      </div>

                      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden focus-within:ring-2 focus-within:ring-primary/40">
                        {/* Takeaways Formatting Toolbar */}
                        <div className="px-2.5 py-2 bg-muted/40 border-b border-border/70 flex items-center gap-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => applyTakeawaysFormat('bold')}
                            className="p-1.5 rounded-lg hover:bg-card text-foreground/90 hover:text-foreground border border-transparent hover:border-border/70 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            title="Bold (**text**)"
                          >
                            <Bold className="w-3.5 h-3.5" />
                            <span>Bold</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => applyTakeawaysFormat('italic')}
                            className="p-1.5 rounded-lg hover:bg-card text-foreground/90 hover:text-foreground border border-transparent hover:border-border/70 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            title="Italic (*text*)"
                          >
                            <Italic className="w-3.5 h-3.5" />
                            <span>Italic</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => applyTakeawaysFormat('highlight')}
                            className="p-1.5 rounded-lg hover:bg-card text-amber-500 hover:text-amber-400 border border-transparent hover:border-border/70 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            title="Highlight (==text==)"
                          >
                            <Highlighter className="w-3.5 h-3.5" />
                            <span>Highlight</span>
                          </button>

                          <div className="h-4 w-[1px] bg-border/80 mx-1" />

                          <button
                            type="button"
                            onClick={() => applyTakeawaysFormat('add_item')}
                            className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Formatted Takeaway Line</span>
                          </button>
                        </div>

                        {showTakeawaysPreview ? (
                          <div className="p-4 space-y-2 bg-muted/15 min-h-[110px]">
                            {(book.keyTakeaways || []).filter(k => k.trim()).length > 0 ? (
                              (book.keyTakeaways || [])
                                .filter(k => k.trim())
                                .map((point, idx) => {
                                  const cleanedPoint = point.replace(/^([-•*]|\d+[.)])\s+/, '');
                                  return (
                                    <div
                                      key={idx}
                                      className="p-3 rounded-xl bg-card border border-border/70 flex items-start gap-2.5"
                                    >
                                      <span className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[11px] font-mono font-black flex items-center justify-center shrink-0 mt-0.5">
                                        {idx + 1}
                                      </span>
                                      <div className="text-xs text-foreground/95 leading-relaxed flex-1">
                                        <FormattedInlineText text={cleanedPoint} />
                                      </div>
                                    </div>
                                  );
                                })
                            ) : (
                              <p className="text-xs text-muted-foreground italic">
                                No key takeaways added yet. Add one takeaway per line to preview.
                              </p>
                            )}
                          </div>
                        ) : (
                          <textarea
                            ref={takeawaysTextareaRef}
                            value={(book.keyTakeaways || []).join('\n')}
                            onChange={e => setBook({ ...book, keyTakeaways: e.target.value.split('\n') })}
                            rows={4}
                            placeholder={"**1% Better Every Day:** Small habits compound into massive long-term mastery\n==Systems Over Goals:== Focus on daily engineering habits instead of outcomes"}
                            className="w-full bg-card p-3.5 text-xs sm:text-sm text-foreground focus:outline-none leading-relaxed"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* LIVE INTERACTIVE BOOK CARD & YOUTUBE INFO PREVIEW */}
                <div className="lg:col-span-4 lg:sticky lg:top-2 bg-muted/25 border border-border/80 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Live Book Slide Preview</span>
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">Real-time</span>
                  </div>

                  <div className="w-36 sm:w-44 mx-auto">
                    <BookCoverVisual book={book} showPlayOverlay={false} />
                  </div>

                  <div className="space-y-1 text-center">
                    <div className="text-[11px] font-semibold text-primary">
                      {book.category || 'Category'}
                    </div>
                    <h4 className="text-sm font-bold text-foreground line-clamp-2">
                      {book.title || 'Book Title Preview'}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      By {book.author || 'Author Name'}
                    </p>
                  </div>

                  {/* Extracted YouTube Profile & Video Thumbnail Preview */}
                  <div className="p-3 rounded-xl bg-card border border-border/70 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={book.youtubeAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(book.youtubeName || 'YT')}&background=ef4444&color=fff&bold=true`}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="block text-[10px] text-muted-foreground">YouTube Explainer</span>
                        <span className="block text-xs font-bold text-foreground truncate">
                          {book.youtubeName || 'Channel Name'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-muted text-foreground">
                        {book.videoDuration || '00:00'}
                      </span>
                    </div>

                    {book.videoThumbnail && (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border/60">
                        <img
                          src={book.videoThumbnail}
                          alt="Video Thumbnail"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-1.5 end-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
                          {book.videoDuration || '15:00'}
                        </div>
                      </div>
                    )}

                    {(book.buyUrl || book.buyUrlAr) && (
                      <div className="space-y-1.5">
                        {book.buyUrl && (
                          <div className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#FF9900] to-[#F57C00] text-slate-950 text-[11px] font-black flex items-center justify-center gap-1.5 shadow-xs">
                            <AmazonIcon className="w-3.5 h-3.5 text-slate-950" />
                            <span>EN Buy Button Ready</span>
                          </div>
                        )}
                        {book.buyUrlAr && (
                          <div className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#FF9900] to-[#F57C00] text-slate-950 text-[11px] font-black flex items-center justify-center gap-1.5 shadow-xs">
                            <AmazonIcon className="w-3.5 h-3.5 text-slate-950" />
                            <span>AR Buy Button Ready (النسخة العربية)</span>
                          </div>
                        )}
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
                else if (type === 'book') handleSaveBook();
                else if (type === 'path') handleSavePath();
                else if (type === 'notification') handleSaveNotification();
                else if (type === 'banner') handleSaveBanner();
              }} 
              className="px-5 py-2 sm:py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSaving ? 'Saving...' : type === 'course' ? 'Save & Publish Course' : type === 'book' ? 'Save & Publish Book' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
