import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Course, LearningPath, Category, AppNotification, AdBannerData } from '../data/courses';
import { fetchGoogleSheetsContent } from './sheets';

export async function fetchFirestoreContent() {
  try {
    const coursesSnapshot = await getDocs(collection(db, 'courses'));
    let coursesData: Course[] = [];
    coursesSnapshot.forEach((doc) => {
      coursesData.push(doc.data() as Course);
    });

    const pathsSnapshot = await getDocs(collection(db, 'learningPaths'));
    let pathsData: LearningPath[] = [];
    pathsSnapshot.forEach((doc) => {
      pathsData.push(doc.data() as LearningPath);
    });

    const notificationsSnapshot = await getDocs(collection(db, 'notifications'));
    let notificationsData: AppNotification[] = [];
    notificationsSnapshot.forEach((doc) => {
      notificationsData.push(doc.data() as AppNotification);
    });

    const bannersSnapshot = await getDocs(collection(db, 'banners'));
    let bannersData: AdBannerData[] = [];
    bannersSnapshot.forEach((doc) => {
      bannersData.push(doc.data() as AdBannerData);
    });

    const categoriesMap: Record<string, Set<string>> = {};
    coursesData.forEach(c => {
      const cat = c.category || 'Other';
      if (!categoriesMap[cat]) categoriesMap[cat] = new Set();
      if (c.subCategory) categoriesMap[cat].add(c.subCategory);
    });

    const categoriesData: Category[] = [
      { name: "All", subCategories: [] },
      ...Object.keys(categoriesMap).map(k => ({
        name: k,
        subCategories: Array.from(categoriesMap[k])
      }))
    ];

    return {
      courses: coursesData,
      learningPaths: pathsData,
      categories: categoriesData,
      notifications: notificationsData,
      banners: bannersData
    };
  } catch (error) {
    console.error("Error fetching from Firestore:", error);
    throw error;
  }
}

export async function migrateFromSheetsToFirestore() {
  const { courses, learningPaths } = await fetchGoogleSheetsContent();
  
  for (const course of courses) {
    await setDoc(doc(db, 'courses', course.id), course);
  }
  
  for (const path of learningPaths) {
    await setDoc(doc(db, 'learningPaths', path.id), path);
  }
  
  return true;
}

export async function runAutoBackup() {
  try {
    const coursesSnapshot = await getDocs(collection(db, 'courses'));
    let coursesData: Course[] = [];
    coursesSnapshot.forEach((d) => coursesData.push(d.data() as Course));

    const pathsSnapshot = await getDocs(collection(db, 'learningPaths'));
    let pathsData: LearningPath[] = [];
    pathsSnapshot.forEach((d) => pathsData.push(d.data() as LearningPath));

    const backup = {
      _metadata: { timestamp: new Date().toISOString(), type: "NEXA_FULL_BACKUP", trigger: "auto" },
      courses: coursesData,
      learningPaths: pathsData
    };
    
    await setDoc(doc(db, 'system_backups', 'latest_auto_backup'), backup);
  } catch(e) {
    console.error("Auto-backup failed silently:", e);
  }
}

export async function addOrUpdateCourse(course: Course) {
  await setDoc(doc(db, 'courses', course.id), course);
  await runAutoBackup();
}

export async function deleteCourseInFirestore(courseId: string) {
  await deleteDoc(doc(db, 'courses', courseId));
  await runAutoBackup();
}

export async function addOrUpdatePath(path: LearningPath) {
  await setDoc(doc(db, 'learningPaths', path.id), path);
  await runAutoBackup();
}

export async function deletePathInFirestore(pathId: string) {
  await deleteDoc(doc(db, 'learningPaths', pathId));
  await runAutoBackup();
}

export async function addOrUpdateNotification(notification: AppNotification) {
  await setDoc(doc(db, 'notifications', notification.id), notification);
}

export async function deleteNotificationInFirestore(notificationId: string) {
  await deleteDoc(doc(db, 'notifications', notificationId));
}

export async function addOrUpdateBanner(banner: AdBannerData) {
  await setDoc(doc(db, 'banners', banner.id), banner);
}

export async function deleteBannerInFirestore(bannerId: string) {
  await deleteDoc(doc(db, 'banners', bannerId));
}
