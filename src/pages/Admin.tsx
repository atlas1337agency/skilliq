import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { Navigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Edit, 
  Bell, 
  AlertTriangle, 
  Loader2, 
  TrendingUp, 
  BookOpen, 
  Users, 
  ImageIcon, 
  Search, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { 
  deleteCourseInFirestore, 
  deletePathInFirestore, 
  deleteNotificationInFirestore,
  deleteBannerInFirestore,
  addOrUpdateNotification,
  addOrUpdateBanner
} from '../lib/firestoreContent';
import { AdminForms } from '../components/AdminForms';
import { AdminAnalytics } from '../components/AdminAnalytics';
import { AdminUsers } from '../components/AdminUsers';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { CourseReport, AppNotification, AdBannerData } from '../data/courses';
import { cn } from '../lib/utils';

export function Admin() {
  const { t, i18n } = useTranslation();
  const { user, allCourses, learningPaths, notifications, banners, loadContent, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  // Active Tab: Analytics, Courses, Users, Notifications (Push Notif), Banners, Reports, Paths
  const [activeTab, setActiveTab] = useState<'analytics' | 'courses' | 'users' | 'notifications' | 'banners' | 'reports' | 'paths'>('analytics');
  
  // Reports state
  const [reports, setReports] = useState<CourseReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [reportsPage, setReportsPage] = useState(1);

  // Modals & Dialogs
  const [editingItem, setEditingItem] = useState<{type: 'course'|'path'|'notification'|'banner', item?: any} | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{type: 'course'|'path'|'notification'|'banner'|'report', id: string, title: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Courses state
  const [courseSearch, setCourseSearch] = useState('');
  const [coursePage, setCoursePage] = useState(1);

  // Fetch reports from Firestore
  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const snap = await getDocs(collection(db, 'reports'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CourseReport));
      setReports(data.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error("Error fetching reports", err);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports' && user && ['admin', 'publisher'].includes(user.role)) {
      fetchReports();
    }
  }, [activeTab, user]);

  // Auth gate: Admin or Publisher only
  if (!user || !['admin', 'publisher'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  const isAdmin = user.role === 'admin';

  // Resolve broken video report + automatically notify user
  const handleResolveReport = async (report: CourseReport) => {
    if (!isAdmin) return;
    try {
      const q = query(collection(db, 'reports'), where('videoId', '==', report.videoId), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      
      const batch = writeBatch(db);
      const userIdsNotified = new Set<string>();

      snap.docs.forEach((d, index) => {
        batch.update(d.ref, { status: 'resolved' });
        const data = d.data() as CourseReport;
        
        if (data.userId && !userIdsNotified.has(data.userId)) {
          userIdsNotified.add(data.userId);
          const newNotifRef = doc(collection(db, 'notifications'));
          batch.set(newNotifRef, {
            id: newNotifRef.id,
            title: 'Broken Video Resolved!',
            message: `The video "${data.videoTitle}" in "${data.courseTitle}" has been inspected and updated. Thank you for reporting!`,
            targetUserId: data.userId,
            link: `/course/${data.courseId}`,
            createdAt: Date.now() + index,
            isActive: true
          });
        }
      });

      await batch.commit();
      setReports(prev => prev.map(r => r.videoId === report.videoId ? { ...r, status: 'resolved' } : r));
      await loadContent();
    } catch (e) {
      console.error("Failed to resolve report", e);
      alert("Failed to mark report as resolved.");
    }
  };

  // Toggle notification active state
  const handleToggleNotification = async (notif: AppNotification) => {
    try {
      const updated = { ...notif, isActive: !notif.isActive };
      await addOrUpdateNotification(updated);
      await loadContent();
    } catch (e) {
      console.error("Failed to toggle notification", e);
    }
  };

  // Toggle banner active state
  const handleToggleBanner = async (bannerItem: AdBannerData) => {
    try {
      const updated = { ...bannerItem, isActive: !bannerItem.isActive };
      await addOrUpdateBanner(updated);
      await loadContent();
    } catch (e) {
      console.error("Failed to toggle banner", e);
    }
  };

  // Perform Delete
  const handleConfirmDelete = async () => {
    if (!deleteDialog) return;
    setIsDeleting(true);
    try {
      if (deleteDialog.type === 'course') {
        await deleteCourseInFirestore(deleteDialog.id);
      } else if (deleteDialog.type === 'path') {
        await deletePathInFirestore(deleteDialog.id);
      } else if (deleteDialog.type === 'notification') {
        await deleteNotificationInFirestore(deleteDialog.id);
      } else if (deleteDialog.type === 'banner') {
        await deleteBannerInFirestore(deleteDialog.id);
      } else if (deleteDialog.type === 'report') {
        await deleteDoc(doc(db, 'reports', deleteDialog.id));
        setReports(prev => prev.filter(r => r.id !== deleteDialog.id));
      }
      await loadContent();
      setDeleteDialog(null);
    } catch (err: any) {
      console.error("Delete error", err);
      alert("Failed to delete item: " + (err.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Pending reports count for badge
  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="w-full px-3 sm:px-6 md:px-8 py-6 sm:py-8 max-w-7xl mx-auto min-h-[75vh] space-y-6 text-start"
    >
      
      {/* DELETE CONFIRMATION MODAL */}
      {deleteDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Delete {deleteDialog.type.toUpperCase()}?
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-foreground">"{deleteDialog.title}"</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button 
                onClick={() => setDeleteDialog(null)}
                className="px-4 py-2 bg-card border border-border/80 hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP FOR CREATING / EDITING COURSES, NOTIFICATIONS, BANNERS, PATHS */}
      {editingItem && (
        <AdminForms 
          type={editingItem.type} 
          itemToEdit={editingItem.item} 
          onClose={() => setEditingItem(null)} 
        />
      )}

      {/* ADMIN COMMAND CENTER HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 bg-card border border-border/80 rounded-2xl sm:rounded-3xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {t('command_center', 'SkilliQ Command Center')}
              </h1>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                {user.role.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live analytics, user accounts, push notifications, ad banners, and course curriculum management.
            </p>
          </div>
        </div>

        {/* Quick Quick Course Add Shortcut */}
        <button
          onClick={() => setEditingItem({ type: 'course' })}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>New Course</span>
        </button>
      </div>

      {/* RESPONSIVE HORIZONTAL TABS BAR (Mobile touch scrollable, clean segmented pills on laptop) */}
      <div className="w-full overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-1.5 bg-muted/50 p-1.5 rounded-2xl border border-border/70 min-w-max">
          
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('analytics')}
              className={cn(
                "px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === 'analytics' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span>{t('analytics', 'Analytics')}</span>
            </button>
          )}

          <button 
            onClick={() => setActiveTab('courses')}
            className={cn(
              "px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === 'courses' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>{t('courses', 'Courses')}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted border border-border">
              {allCourses.length}
            </span>
          </button>

          {isAdmin && (
            <>
              <button 
                onClick={() => setActiveTab('users')}
                className={cn(
                  "px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === 'users' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>{t('users', 'Users')}</span>
              </button>

              <button 
                onClick={() => setActiveTab('notifications')}
                className={cn(
                  "px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === 'notifications' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Bell className="w-3.5 h-3.5 text-primary" />
                <span>Push Notif</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted border border-border">
                  {notifications.length}
                </span>
              </button>

              <button 
                onClick={() => setActiveTab('banners')}
                className={cn(
                  "px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === 'banners' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <ImageIcon className="w-3.5 h-3.5 text-primary" />
                <span>Banners</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted border border-border">
                  {banners.length}
                </span>
              </button>

              <button 
                onClick={() => setActiveTab('reports')}
                className={cn(
                  "px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === 'reports' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <AlertTriangle className={cn("w-3.5 h-3.5", pendingReportsCount > 0 ? "text-amber-500 animate-pulse" : "text-primary")} />
                <span>Reports</span>
                {pendingReportsCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black">
                    {pendingReportsCount}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setActiveTab('paths')}
                className={cn(
                  "px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === 'paths' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{t('paths', 'Paths')}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted border border-border">
                  {learningPaths.length}
                </span>
              </button>
            </>
          )}

        </div>
      </div>

      {/* TAB CONTENT 1: ANALYTICS */}
      {activeTab === 'analytics' && isAdmin && (
        <AdminAnalytics />
      )}

      {/* TAB CONTENT 2: COURSES */}
      {activeTab === 'courses' && (() => {
        const itemsPerPage = 9;
        const filteredCourses = allCourses.filter(c => 
          c.title.toLowerCase().includes(courseSearch.toLowerCase()) || 
          (c.instructor && c.instructor.toLowerCase().includes(courseSearch.toLowerCase()))
        );
        const totalCoursePages = Math.max(1, Math.ceil(filteredCourses.length / itemsPerPage));
        const paginatedCourses = filteredCourses.slice((coursePage - 1) * itemsPerPage, coursePage * itemsPerPage);

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground">{t('manage_courses', 'Manage Courses & Masterclasses')}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Edit syllabus, YouTube playlists, lessons, and course cover media.</p>
              </div>

              <button 
                onClick={() => setEditingItem({ type: 'course' })}
                className="flex items-center justify-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 shadow-xs cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4" /> 
                <span>{t('add_course', 'Add Course')}</span>
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5" />
              <input 
                type="text" 
                placeholder={t('search_courses_admin', 'Search courses by title or instructor...')} 
                value={courseSearch}
                onChange={(e) => {
                  setCourseSearch(e.target.value);
                  setCoursePage(1);
                }}
                className="w-full ps-10 pe-4 py-2.5 bg-card border border-border/80 rounded-2xl text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none shadow-xs"
              />
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedCourses.map(courseItem => (
                <div key={courseItem.id} className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    {courseItem.thumbnail?.trim() ? (
                      <img src={courseItem.thumbnail} alt="" className="w-16 h-16 object-cover rounded-xl bg-muted shrink-0 border border-border/80" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center p-1 text-[10px] text-center text-muted-foreground shrink-0 border border-border/80">
                        No Image
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1">
                          {courseItem.title}
                        </h3>
                        {courseItem.isApproved === false && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                            {t('pending', 'Pending')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{courseItem.instructor || 'SkilliQ'}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-1">
                        {courseItem.isSingleVideo ? 'Masterclass' : 'Playlist'} • {courseItem.videos?.length || 0} videos
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-end gap-1.5 pt-3 border-t border-border/60">
                    <button 
                      onClick={() => setEditingItem({ type: 'course', item: courseItem })}
                      className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      title="Edit Course"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button 
                        onClick={() => setDeleteDialog({ type: 'course', id: courseItem.id, title: courseItem.title })} 
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete Course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalCoursePages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button 
                  onClick={() => setCoursePage(p => Math.max(1, p - 1))}
                  disabled={coursePage === 1}
                  className="px-3 py-1.5 bg-card border border-border/80 hover:bg-muted rounded-xl disabled:opacity-40 text-xs font-bold"
                >
                  {t('previous', 'Previous')}
                </button>
                <span className="text-xs font-medium text-muted-foreground px-2">
                  {t('page', 'Page')} {coursePage} {t('of', 'of')} {totalCoursePages}
                </span>
                <button 
                  onClick={() => setCoursePage(p => Math.min(totalCoursePages, p + 1))}
                  disabled={coursePage === totalCoursePages}
                  className="px-3 py-1.5 bg-card border border-border/80 hover:bg-muted rounded-xl disabled:opacity-40 text-xs font-bold"
                >
                  {t('next', 'Next')}
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB CONTENT 3: USERS (Real Firestore Users management) */}
      {activeTab === 'users' && isAdmin && (
        <AdminUsers />
      )}

      {/* TAB CONTENT 4: PUSH NOTIF (Announcements & Alerts) */}
      {activeTab === 'notifications' && isAdmin && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                <Bell className="w-6 h-6 text-primary" />
                <span>Push Notifications & Broadcasts</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Send global announcements, new course popups, and updates to all students in real time.
              </p>
            </div>

            <button 
              onClick={() => setEditingItem({ type: 'notification' })}
              className="flex items-center justify-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 shadow-xs cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" /> 
              <span>New Push Notification</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className={cn(
                  "bg-card border rounded-2xl p-4 flex flex-col justify-between shadow-xs transition-shadow",
                  notif.isActive ? "border-primary/50 shadow-primary/5" : "border-border/80 opacity-75"
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-0.5 rounded-md",
                        notif.isActive ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                      )}>
                        {notif.isActive ? 'Active Broadcast' : 'Draft / Inactive'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                        {notif.targetUserId ? `User: ${notif.targetUserId}` : 'All Students'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleNotification(notif)}
                      className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                      title={notif.isActive ? "Deactivate Broadcast" : "Activate Broadcast"}
                    >
                      {notif.isActive ? (
                        <ToggleRight className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  {notif.image && (
                    <div className="w-full h-24 rounded-xl overflow-hidden bg-muted border border-border/80">
                      <img src={notif.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-sm text-foreground line-clamp-1">{notif.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{notif.message}</p>
                  </div>

                  {notif.link && (
                    <div className="text-[11px] font-mono text-primary truncate flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-md border border-primary/20">
                      <span className="font-bold">CTA Link:</span>
                      <span className="truncate">{notif.link}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end gap-1.5 pt-3 border-t border-border/60">
                  <button 
                    onClick={() => setEditingItem({ type: 'notification', item: notif })}
                    className="p-1.5 text-primary hover:bg-primary/10 rounded-lg cursor-pointer"
                    title="Edit Notification"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setDeleteDialog({ type: 'notification', id: notif.id, title: notif.title })} 
                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="col-span-full p-12 text-center bg-muted/20 border border-dashed border-border/80 rounded-2xl">
                <Bell className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                <p className="text-sm font-bold text-foreground">No push notifications created</p>
                <p className="text-xs text-muted-foreground mt-0.5">Click "New Push Notification" above to broadcast an alert.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: BANNERS (Ad Banners) */}
      {activeTab === 'banners' && isAdmin && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-primary" />
                <span>Ad & Promotional Banners</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage live hero, catalog, and promo banners rendered across web and mobile.
              </p>
            </div>

            <button 
              onClick={() => setEditingItem({ type: 'banner' })}
              className="flex items-center justify-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 shadow-xs cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" /> 
              <span>New Banner</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map(bItem => (
              <div 
                key={bItem.id} 
                className={cn(
                  "bg-card border rounded-2xl p-4 flex flex-col justify-between shadow-xs transition-shadow",
                  bItem.isActive ? "border-primary/50" : "border-border/80 opacity-75"
                )}
              >
                <div className="space-y-3">
                  {bItem.desktopImageUrl && (
                    <div className="w-full h-28 rounded-xl overflow-hidden bg-muted border border-border/80">
                      <img src={bItem.desktopImageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                        {bItem.placement.replace('-', ' ')}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase">
                        {bItem.language === 'ar' ? 'Arabic Only' : bItem.language === 'en' ? 'English Only' : 'Global / All'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleBanner(bItem)}
                      className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                      title={bItem.isActive ? "Deactivate Banner" : "Activate Banner"}
                    >
                      {bItem.isActive ? (
                        <ToggleRight className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground font-mono truncate bg-muted/30 px-2 py-1 rounded-md border border-border/60">
                    <span className="font-bold text-foreground">Target: </span>{bItem.targetUrl || 'None (Display only)'}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-end gap-1.5 pt-3 border-t border-border/60">
                  <button 
                    onClick={() => setEditingItem({ type: 'banner', item: bItem })}
                    className="p-1.5 text-primary hover:bg-primary/10 rounded-lg cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setDeleteDialog({ type: 'banner', id: bItem.id, title: bItem.placement })} 
                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {banners.length === 0 && (
              <div className="col-span-full p-12 text-center bg-muted/20 border border-dashed border-border/80 rounded-2xl">
                <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                <p className="text-sm font-bold text-foreground">No banners configured</p>
                <p className="text-xs text-muted-foreground mt-0.5">Click "New Banner" to create a live promotional banner.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: REPORTS (Broken Video Reports) */}
      {activeTab === 'reports' && isAdmin && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <span>Broken Video Student Reports</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review issues submitted by learners. Resolving automatically sends a notification to the reporting student.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl text-xs font-bold">
              {(['all', 'pending', 'resolved'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setReportFilter(tab)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer",
                    reportFilter === tab ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {reportsLoading ? (
            <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-semibold">Loading student reports from Firestore...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center bg-muted/20 border border-dashed border-border/80 rounded-2xl">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
              <p className="text-sm font-bold text-foreground">Zero broken video reports</p>
              <p className="text-xs text-muted-foreground mt-0.5">All course videos are healthy and functioning normally.</p>
            </div>
          ) : (() => {
            const filteredReports = reports.filter(r => {
              if (reportFilter === 'all') return true;
              return r.status === reportFilter;
            });

            return (
              <div className="space-y-3">
                {filteredReports.map(rep => (
                  <div key={rep.id} className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded-md",
                          rep.status === 'resolved' ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"
                        )}>
                          {rep.status.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(rep.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-foreground truncate">{rep.courseTitle}</h4>
                      <p className="text-xs text-foreground/80">
                        Lesson: <span className="font-semibold">{rep.videoTitle}</span> (ID: <code className="bg-muted px-1 rounded font-mono text-[11px]">{rep.youtubeId}</code>)
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Reported by: {rep.userName} {rep.userEmail ? `(${rep.userEmail})` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => {
                          const targetCourse = allCourses.find(c => c.id === rep.courseId);
                          if (targetCourse) {
                            setEditingItem({ type: 'course', item: targetCourse });
                          }
                        }}
                        className="px-3 py-1.5 bg-card border border-border/80 hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Edit Course
                      </button>

                      {rep.status === 'pending' && (
                        <button
                          onClick={() => handleResolveReport(rep)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                          Mark Fixed & Notify
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteDialog({ type: 'report', id: rep.id, title: rep.videoTitle })}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB CONTENT 7: PATHS */}
      {activeTab === 'paths' && isAdmin && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">{t('manage_paths', 'Manage Learning Paths')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Organize courses into structured learning roadmaps.</p>
            </div>

            <button 
              onClick={() => setEditingItem({ type: 'path' })}
              className="flex items-center justify-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 shadow-xs cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" /> 
              <span>{t('add_path', 'Add Path')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {learningPaths.map(pathItem => (
              <div key={pathItem.id} className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground mb-1">{pathItem.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{pathItem.courseIds.length} {t('courses_linked', 'Courses Linked')}</p>
                </div>
                <div className="mt-auto flex items-center justify-end gap-1.5 pt-3 border-t border-border/60">
                  <button 
                    onClick={() => setEditingItem({ type: 'path', item: pathItem })}
                    className="p-1.5 text-primary hover:bg-primary/10 rounded-lg cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setDeleteDialog({ type: 'path', id: pathItem.id, title: pathItem.title })} 
                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
