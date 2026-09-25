import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { Navigate } from 'react-router-dom';
import { ShieldAlert, Plus, Save, Database, Trash2, Edit, Download, Upload, Bell, AlertTriangle } from 'lucide-react';
import { 
  addOrUpdateCourse, 
  deleteCourseInFirestore, 
  addOrUpdatePath, 
  deletePathInFirestore, 
  addOrUpdateNotification,
  deleteNotificationInFirestore,
  deleteBannerInFirestore,
  migrateFromSheetsToFirestore 
} from '../lib/firestoreContent';
import { AdminForms } from '../components/AdminForms';
import { AdminAnalytics } from '../components/AdminAnalytics';
import { AdminUsers } from '../components/AdminUsers';
import { collection, getDocs, setDoc, doc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import * as XLSX from 'xlsx';
import { CourseReport, AppNotification } from '../data/courses';

export function Admin() {
  const { t } = useTranslation();
  const { user, allCourses, learningPaths, notifications, loadContent } = useStore();
  const [activeTab, setActiveTab] = useState<'analytics' | 'courses' | 'paths' | 'settings' | 'users' | 'notifications' | 'reports' | 'banners'>('courses');
  const [reports, setReports] = useState<CourseReport[]>([]);
  const [reportsPage, setReportsPage] = useState(1);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingItem, setEditingItem] = useState<{type: 'course'|'path'|'user'|'notification', item?: any} | null>(null);
  const [courseSearch, setCourseSearch] = useState('');
  const [coursePage, setCoursePage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{type: 'course'|'path'|'notification', id: string, title: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'reports' && user && ['admin', 'publisher'].includes(user.role)) {
      const fetchReports = async () => {
        const snap = await getDocs(collection(db, 'reports'));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseReport));
        setReports(data.sort((a,b) => b.createdAt - a.createdAt));
      };
      fetchReports();
    }
  }, [activeTab, user]);

  // Check admin or publisher
  if (!user || !['admin', 'publisher'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  const isAdmin = user.role === 'admin';

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
         
         if (!userIdsNotified.has(data.userId)) {
           userIdsNotified.add(data.userId);
           const newNotifRef = doc(collection(db, 'notifications'));
           batch.set(newNotifRef, {
             id: newNotifRef.id,
             title: 'Video Fixed!',
             message: `Sorry for the inconvenience. The broken video "${data.videoTitle}" in the course "${data.courseTitle}" has been fixed.`,
             targetUserId: data.userId,
             link: `/course/${data.courseId}`,
             createdAt: Date.now() + index, // Ensure slightly different timestamps if needed
             isActive: true
           });
         }
      });
      await batch.commit();

      setReports(reports.map(r => r.videoId === report.videoId ? { ...r, status: 'resolved' } : r));
      alert('Report(s) marked as resolved and notification(s) sent to user(s).');
    } catch (e) {
      console.error(e);
      alert('Failed to resolve report.');
    }
  };

  const handleMigrate = async () => {
    if (!window.confirm("Are you sure? This will overwrite Firestore with current Google Sheets data!")) return;
    setIsMigrating(true);
    try {
      await migrateFromSheetsToFirestore();
      await loadContent();
      alert("Successfully migrated from Google Sheets to Firestore!");
    } catch (err) {
      console.error(err);
      alert("Failed to migrate data.");
    }
    setIsMigrating(false);
  }

  const handleExportUsersCSV = async () => {
    setIsExporting(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      let csvContent = "\uFEFFUser ID,Email,Name,Role,Total Enrolled Courses,Completed Courses\n";

      for (const userDoc of usersSnap.docs) {
        const u = userDoc.data();
        const progSnap = await getDocs(collection(db, `users/${u.uid}/progress`));
        let completed = 0;
        let total = 0;
        progSnap.forEach(p => {
            total++;
            if (p.data().isCompleted) completed++;
        });

        const name = u.displayName ? `"${u.displayName.replace(/"/g, '""')}"` : "Unknown";
        csvContent += `${u.uid},${u.email},${name},${u.role},${total},${completed}\n`;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `NEXA1337_Users_Backup_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to export users to CSV.");
    }
    setIsExporting(false);
  };

  const handleExportCoursesExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Courses (Playlists)
      const playlistsData = allCourses.filter(c => !c.isSingleVideo).map(c => ({
        ...c,
        videos: JSON.stringify(c.videos || [])
      }));
      const wsCourses = XLSX.utils.json_to_sheet(playlistsData.length > 0 ? playlistsData : [{ id: "No Playlists Found" }]);
      XLSX.utils.book_append_sheet(wb, wsCourses, "Courses");

      // 2. Masterclasses
      const mcData = allCourses.filter(c => c.isSingleVideo).map(c => ({
        ...c,
        videos: JSON.stringify(c.videos || [])
      }));
      const wsMC = XLSX.utils.json_to_sheet(mcData.length > 0 ? mcData : [{ id: "No Masterclasses Found" }]);
      XLSX.utils.book_append_sheet(wb, wsMC, "Masterclasses");

      // 3. Learning Paths
      const pathData = learningPaths.map(p => ({
        ...p,
        courseIds: JSON.stringify(p.courseIds || [])
      }));
      const wsPaths = XLSX.utils.json_to_sheet(pathData.length > 0 ? pathData : [{ id: "No Paths Found" }]);
      XLSX.utils.book_append_sheet(wb, wsPaths, "Learning Paths");

      XLSX.writeFile(wb, `NEXA1337_Content_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
       console.error(error);
       alert("Failed to export Excel file.");
    }
  };

  const handleDownloadBackup = () => {
    try {
      const backup = {
         _metadata: { timestamp: new Date().toISOString(), type: "NEXA_FULL_BACKUP" },
         courses: allCourses,
         learningPaths: learningPaths
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `NEXA1337_System_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
      alert("Failed to download system backup.");
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setIsMigrating(true);
        const content = JSON.parse(evt.target?.result as string);
        
        if (!content.courses || !content.learningPaths || content._metadata?.type !== "NEXA_FULL_BACKUP") {
           throw new Error("Invalid format");
        }
        
        // Restore Courses
        for (const c of content.courses) {
           await setDoc(doc(db, 'courses', c.id), c);
        }
        
        // Restore Learning Paths
        for (const p of content.learningPaths) {
           await setDoc(doc(db, 'learningPaths', p.id), p);
        }

        await loadContent();
        setDeleteDialog(null);
      } catch (err: any) {
        console.error(err);
      } finally {
        setIsMigrating(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      await deleteCourseInFirestore(id);
      await loadContent();
      setDeleteDialog(null);
    } catch (err) {
      console.error(err);
    }
  }

  const handleDeletePath = async (id: string) => {
    try {
      await deletePathInFirestore(id);
      await loadContent();
      setDeleteDialog(null);
    } catch (err) {
      console.error(err);
    }
  }

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotificationInFirestore(id);
      await loadContent();
      setDeleteDialog(null);
    } catch (err) {
      console.error(err);
    }
  }

  const handleDeleteBanner = async (id: string) => {
    try {
      await deleteBannerInFirestore(id);
      await loadContent();
      setDeleteDialog(null);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="w-full px-4 md:px-8 py-8 max-w-7xl mx-auto min-h-[70vh]">
      {deleteDialog && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl p-6">
            <h3 className="text-xl font-bold text-red-500 mb-2">Delete {deleteDialog.type === 'course' ? 'Course' : deleteDialog.type === 'path' ? 'Path' : deleteDialog.type === 'notification' ? 'Notification' : 'Banner'}?</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to completely delete <span className="font-bold text-foreground">"{deleteDialog.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setDeleteDialog(null)}
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded font-medium transition-colors"
                disabled={isExporting}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  setIsExporting(true);
                  if (deleteDialog.type === 'course') await handleDeleteCourse(deleteDialog.id);
                  else if (deleteDialog.type === 'path') await handleDeletePath(deleteDialog.id);
                  else if (deleteDialog.type === 'notification') await handleDeleteNotification(deleteDialog.id);
                  else if (deleteDialog.type === 'banner') await handleDeleteBanner(deleteDialog.id);
                  setIsExporting(false);
                }}
                disabled={isExporting}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 rounded font-bold transition-colors shadow"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <AdminForms 
          type={editingItem.type} 
          itemToEdit={editingItem.item} 
          onClose={() => setEditingItem(null)} 
        />
      )}

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-amber-500" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('command_center', 'Skilliq Command Center')}</h1>
            <p className="text-muted-foreground">{t('command_center_desc', 'Live analytics and content management')}</p>
          </div>
        </div>
        <div className="flex flex-wrap bg-muted p-1 rounded-lg w-full sm:w-fit gap-1">
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'analytics' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('analytics', 'Analytics')}
            </button>
          )}
          <button 
            onClick={() => setActiveTab('courses')}
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'courses' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('courses', 'Courses')}
          </button>
          {isAdmin && (
            <>
              <button 
                onClick={() => setActiveTab('users')}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'users' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t('users', 'Users')}
              </button>
              <button 
                onClick={() => setActiveTab('paths')}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'paths' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t('paths', 'Paths')}
              </button>
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'notifications' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t('notifications', 'Push Notif')}
              </button>
              <button 
                onClick={() => setActiveTab('banners')}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'banners' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Banners
              </button>
              <button 
                onClick={() => setActiveTab('reports')}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'reports' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Reports
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'settings' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t('settings', 'Settings')}
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'analytics' && (
        <AdminAnalytics />
      )}

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
              <h2 className="text-2xl font-bold">{t('manage_courses', 'Manage Courses & Masterclasses')}</h2>
              <button 
                onClick={() => setEditingItem({ type: 'course' })}
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" /> {t('add_course', 'Add Course')}
              </button>
            </div>
            
            <div className="mb-4">
              <input 
                type="text" 
                placeholder={t('search_courses_admin', 'Search courses by title or instructor...')} 
                value={courseSearch}
                onChange={(e) => {
                  setCourseSearch(e.target.value);
                  setCoursePage(1);
                }}
                className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedCourses.map(course => (
                <div key={course.id} className="bg-card border border-border rounded-xl p-4 flex flex-col">
                  <div className="flex items-start gap-4 mb-3">
                    {course.thumbnail?.trim() ? (
                      <img src={course.thumbnail} alt="" className="w-16 h-16 object-cover rounded-md bg-muted" />
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center p-1 text-[8px] text-center text-muted-foreground overflow-hidden">
                        No Img
                      </div>
                    )}
                    <div>
                    <h3 className="font-bold line-clamp-1">
                      {course.title}
                      {course.isApproved === false && (
                        <span className="ms-2 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          {t('pending', 'Pending')}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground">{course.isSingleVideo ? 'Masterclass' : 'Playlist'} • {course.videos?.length || 0} videos</p>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-end gap-2 pt-3 border-t border-border">
                  {isAdmin && (
                    <>
                      <button 
                        onClick={() => setEditingItem({ type: 'course', item: course })}
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteDialog({ type: 'course', id: course.id, title: course.title })} className="p-2 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
                </div>
              ))}
            </div>

            {totalCoursePages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button 
                  onClick={() => setCoursePage(p => Math.max(1, p - 1))}
                  disabled={coursePage === 1}
                  className="px-3 py-1 bg-muted hover:bg-muted/80 rounded disabled:opacity-50 text-sm font-medium"
                >
                  {t('previous', 'Previous')}
                </button>
                <span className="text-sm font-medium text-muted-foreground">
                  {t('page', 'Page')} {coursePage} {t('of', 'of')} {totalCoursePages}
                </span>
                <button 
                  onClick={() => setCoursePage(p => Math.min(totalCoursePages, p + 1))}
                  disabled={coursePage === totalCoursePages}
                  className="px-3 py-1 bg-muted hover:bg-muted/80 rounded disabled:opacity-50 text-sm font-medium"
                >
                  {t('next', 'Next')}
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === 'users' && isAdmin && (
        <AdminUsers />
      )}

      {activeTab === 'paths' && isAdmin && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t('manage_paths', 'Manage Learning Paths')}</h2>
            <button 
              onClick={() => setEditingItem({ type: 'path' })}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" /> {t('add_path', 'Add Path')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {learningPaths.map(path => (
              <div key={path.id} className="bg-card border border-border rounded-xl p-4 flex flex-col">
                <h3 className="font-bold mb-1">{path.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{path.courseIds.length} {t('courses_linked', 'Courses Linked')}</p>
                <div className="mt-auto flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button 
                    onClick={() => setEditingItem({ type: 'path', item: path })}
                    className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteDialog({ type: 'path', id: path.id, title: path.title })} className="p-2 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'notifications' && isAdmin && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t('manage_notifications', 'Manage Notifications')}</h2>
            <button 
              onClick={() => setEditingItem({ type: 'notification' })}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" /> {t('add_notification', 'Add Notification')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notifications.sort((a,b) => b.createdAt - a.createdAt).map(notif => (
              <div key={notif.id} className={`bg-card border ${notif.isActive ? 'border-primary/50' : 'border-border'} rounded-xl p-4 flex flex-col`}>
                <div className="flex items-start gap-4 mb-3">
                  {notif.image?.trim() ? (
                    <img src={notif.image} alt="" className="w-16 h-16 object-cover rounded-md bg-muted" />
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center p-1 text-[8px] text-center text-muted-foreground overflow-hidden">
                      <Bell className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold line-clamp-1">{notif.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{notif.message}</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] uppercase font-bold ${notif.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {notif.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button 
                    onClick={() => setEditingItem({ type: 'notification', item: notif })}
                    className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteDialog({ type: 'notification', id: notif.id, title: notif.title })} className="p-2 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'banners' && isAdmin && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Manage Ad Banners</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={async () => {
                  try {
                    const { defaultBanners } = await import('../data/courses');
                    const { addOrUpdateBanner } = await import('../lib/firestoreContent');
                    for (const b of defaultBanners) {
                      await addOrUpdateBanner(b);
                    }
                    await loadContent();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium hover:bg-secondary/90 hidden md:flex"
              >
                Load Defaults
              </button>
              <button 
                onClick={() => setEditingItem({ type: 'banner' })}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" /> Add Banner
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {useStore.getState().banners.map(banner => (
              <div key={banner.id} className={`bg-card border ${banner.isActive ? 'border-primary/50' : 'border-border'} rounded-xl p-4 flex flex-col`}>
                {banner.desktopImageUrl && (
                  <div className="w-full h-24 mb-4 rounded overflow-hidden shrink-0">
                    <img src={banner.desktopImageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 mb-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold">{banner.placement.replace('-', ' ').toUpperCase()}</h3>
                    {banner.isActive && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Active</span>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{banner.targetUrl || 'No target URL'}</p>
                </div>
                <div className="mt-auto flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button 
                    onClick={() => setEditingItem({ type: 'banner', item: banner })}
                    className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteDialog({ type: 'banner', id: banner.id, title: banner.placement })} className="p-2 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {useStore.getState().banners.length === 0 && (
              <div className="text-center py-12 bg-muted/30 col-span-full rounded-xl border border-dashed border-border">
                <p className="text-muted-foreground">No banners created yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reports' && isAdmin && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              Broken Video Reports
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {reports.length === 0 ? (
               <div className="text-center py-12 bg-muted/30 rounded-xl border border-border">
                 <p className="text-muted-foreground">No reports found.</p>
               </div>
            ) : (() => {
              const uniqueReports: CourseReport[] = [];
              const seenVideos = new Set<string>();
              // Process pending first to show them on top, then resolved.
              const processReport = (r: CourseReport) => {
                 if (!seenVideos.has(r.videoId)) {
                    seenVideos.add(r.videoId);
                    uniqueReports.push(r);
                 }
              };
              reports.filter(r => r.status === 'pending').forEach(processReport);
              reports.filter(r => r.status === 'resolved').forEach(processReport);
              
              const currentReports = uniqueReports.slice((reportsPage - 1) * 10, reportsPage * 10);
              
              return (
              <>
              {currentReports.map(report => {
                const totalReports = reports.filter(r => r.videoId === report.videoId).length;
                return (
                <div key={report.id} className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${report.status === 'resolved' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                         {report.status.toUpperCase()}
                       </span>
                       <span className="text-muted-foreground text-sm">{new Date(report.createdAt).toLocaleString()}</span>
                       {totalReports > 1 && (
                         <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                           {totalReports} REPORTS
                         </span>
                       )}
                    </div>
                    <h3 className="font-bold">{report.courseTitle}</h3>
                    <p className="text-sm text-foreground/80">Video: {report.videoTitle} (ID: <code className="bg-muted px-1 rounded">{report.youtubeId}</code>)</p>
                    <p className="text-xs text-muted-foreground mt-1">Reported by: {report.userName} {report.userEmail ? `(${report.userEmail})` : ''} {totalReports > 1 ? `and ${totalReports - 1} other(s)` : ''}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                    <button 
                      onClick={() => setEditingItem({ type: 'course', item: allCourses.find(c => c.id === report.courseId) })}
                      className="w-full sm:w-auto px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-bold hover:bg-secondary/90 transition-colors"
                    >
                      Edit Course
                    </button>
                    {report.status === 'pending' && (
                      <button 
                        onClick={() => handleResolveReport(report)}
                        className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded-md text-sm font-bold hover:bg-green-600 transition-colors"
                      >
                        Mark Fixed & Notify
                      </button>
                    )}
                  </div>
                </div>
              )})}
              
              {uniqueReports.length > 10 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button 
                    onClick={() => setReportsPage(p => Math.max(1, p - 1))}
                    disabled={reportsPage === 1}
                    className="px-4 py-2 bg-secondary disabled:opacity-50 text-secondary-foreground rounded-md text-sm font-bold hover:bg-secondary/90 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-medium">Page {reportsPage} of {Math.ceil(uniqueReports.length / 10)}</span>
                  <button 
                    onClick={() => setReportsPage(p => Math.min(Math.ceil(uniqueReports.length / 10), p + 1))}
                    disabled={reportsPage >= Math.ceil(uniqueReports.length / 10)}
                    className="px-4 py-2 bg-secondary disabled:opacity-50 text-secondary-foreground rounded-md text-sm font-bold hover:bg-secondary/90 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
              </>
            );})()}
          </div>
        </div>
      )}

      {activeTab === 'settings' && isAdmin && (
        <div className="bg-card border border-border shadow-sm rounded-xl p-6 md:p-8 max-w-2xl space-y-12">
          
          {/* Sheets Export Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">Export for Google Sheets <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Live Active</span></h2>
            <p className="text-muted-foreground mb-6 text-sm">
              <strong className="text-foreground">Automatically synchronized.</strong> Whenever you add, update, or delete any content anywhere in the platform, this section instantly and automatically prepares your latest backup. Export your live data directly to an Excel file (.xlsx) containing separate tabs for Courses, Masterclasses, and Learning Paths, designed specifically for clean mapping into Google Sheets.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleExportUsersCSV}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 px-4 py-4 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl border border-border transition-colors disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                {isExporting ? 'Exporting...' : 'Export Users (CSV)'}
              </button>

              <button
                onClick={handleExportCoursesExcel}
                className="flex items-center justify-center gap-2 px-4 py-4 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl border border-border transition-colors disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                Export Content (Excel)
              </button>
            </div>
          </div>

          {/* Backup & Restore Section */}
          <div className="pt-8 border-t border-border">
            <h2 className="text-2xl font-bold mb-4 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">Disaster Recovery & Backup <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Cloud Synchronized</span></h2>
            <p className="text-muted-foreground mb-6 text-sm">
              <strong className="text-foreground">Automatic shadow backups active.</strong> Every time you modify a course or learning path, the system automatically writes a shadow backup file securely out to the cloud database. Download this complete, exact synchronized replica of your active content database (Paths, Playlists, and Masterclasses). If data is ever lost, you can upload this generated JSON backup file to restore the entire system instantly without missing a beat.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleDownloadBackup}
                className="flex items-center justify-center gap-2 px-4 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold rounded-xl border border-emerald-500/20 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download System Backup
              </button>

              <div className="relative">
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef}
                  onChange={handleImportBackup}
                  className="hidden" 
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isMigrating}
                  className="w-full h-full flex items-center justify-center gap-2 px-4 py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-semibold rounded-xl border border-rose-500/20 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-5 h-5" />
                  {isMigrating ? 'Restoring...' : 'Restore from Backup'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Legacy Import */}
          <div className="pt-8 border-t border-border">
            <h2 className="text-2xl font-bold mb-4 text-amber-500">Legacy Sheet Migration</h2>
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl p-5">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Database className="w-5 h-5" /> 
                Initial Import from Google Sheets
              </h3>
              <p className="mb-4 text-amber-500/80 text-sm">
                If your database list is empty, you can pull your old Google Sheets data into Firebase Firestore right now. This is only necessary for first-time migration.
              </p>
              <button 
                onClick={handleMigrate}
                disabled={isMigrating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-md transition-colors disabled:opacity-50"
              >
                {isMigrating ? 'Importing...' : 'Migrate Data from Google Sheets'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
