import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Course, LearningPath, Category, AppNotification, AdBannerData, Book, defaultBooks } from '../data/courses';
import { fetchGoogleSheetsContent } from './sheets';

export const LEGACY_SEED_PROJECT_IDS = new Set([
  "project-fullstack-saas-ai",
  "project-mern-ecommerce-playlist",
  "project-ar-fullstack-web-app",
  "project-ar-flutter-real-app",
  "project-nextjs-dashboard-build",
  "project-python-cyber-scanner",
  "project-react-native-delivery-app",
  "project-ai-agent-automation-en",
  "project-ar-js-portfolio-apps",
  "project-ar-ai-automation-system",
  "project-ar-3d-architectural-villa",
  "project-ar-uiux-design-system"
]);

export async function fetchFirestoreContent() {
  try {
    const LEGACY_SEED_BOOK_IDS = new Set([
      "book-clean-code",
      "book-deep-work",
      "book-ai-superpowers",
      "book-cyber-ghost",
      "book-atomic-habits-en",
      "book-pragmatic-programmer",
      "book-zero-to-one",
      "book-atomic-habits-ar",
      "book-deep-work-ar",
      "book-clean-code-ar",
      "book-ai-future-ar",
      "book-cyber-ar",
      "book-ai-superpowers-en-2",
      "book-ghost-in-the-wires",
      "book-lean-startup",
      "book-system-design-interview",
      "book-refactoring",
      "book-Zero-To-One-Ar-En"
    ]);

    // Fetch all collections and endpoints in parallel instead of sequentially
    const [
      coursesSnapshot,
      pathsSnapshot,
      notificationsSnapshot,
      apiNotificationsRes,
      bannersSnapshot,
      booksSnapshot,
      apiBooksRes,
      courseUtilsModule
    ] = await Promise.all([
      getDocs(collection(db, 'courses')),
      getDocs(collection(db, 'learningPaths')),
      getDocs(collection(db, 'notifications')).catch(() => null),
      fetch('/api/notifications').catch(() => null),
      getDocs(collection(db, 'banners')).catch(() => null),
      getDocs(collection(db, 'books')).catch(() => null),
      fetch('/api/books').catch(() => null),
      import('../lib/courseUtils')
    ]);

    let coursesData: Course[] = [];
    coursesSnapshot.forEach((d) => {
      const data = d.data() as Course;
      const docId = (data?.id && typeof data.id === 'string' && data.id.trim()) ? data.id.trim() : d.id;
      if (LEGACY_SEED_PROJECT_IDS.has(d.id) || LEGACY_SEED_PROJECT_IDS.has(docId)) {
        deleteDoc(doc(db, 'courses', d.id)).catch(() => {});
        return;
      }
      if (data) {
        const rawVideos = Array.isArray(data.videos) ? data.videos : [];
        const seenKeys = new Set<string>();
        const dedupedVideos = rawVideos.filter((v: any, idx: number) => {
          const key = (v?.youtubeId || v?.id || `idx_${idx}`).trim();
          if (!key || seenKeys.has(key)) return false;
          seenKeys.add(key);
          return true;
        });

        coursesData.push({
          ...data,
          id: docId,
          title: data.title || 'Untitled Course',
          category: data.category || 'Programming',
          videos: dedupedVideos,
        });
      }
    });

    let pathsData: LearningPath[] = [];
    pathsSnapshot.forEach((doc) => {
      pathsData.push(doc.data() as LearningPath);
    });

    let notificationsData: AppNotification[] = [];
    if (notificationsSnapshot) {
      notificationsSnapshot.forEach((doc) => {
        notificationsData.push(doc.data() as AppNotification);
      });
    }

    if (apiNotificationsRes && apiNotificationsRes.ok) {
      try {
        const apiJson = await apiNotificationsRes.json();
        if (Array.isArray(apiJson.notifications)) {
          const map = new Map<string, AppNotification>();
          apiJson.notifications.forEach((n: AppNotification) => map.set(n.id, n));
          notificationsData.forEach((n: AppNotification) => map.set(n.id, { ...map.get(n.id), ...n }));
          notificationsData = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }
      } catch (e) {}
    }

    let bannersData: AdBannerData[] = [];
    if (bannersSnapshot) {
      bannersSnapshot.forEach((doc) => {
        bannersData.push(doc.data() as AdBannerData);
      });
    }

    let firestoreBooks: Book[] = [];
    if (booksSnapshot) {
      booksSnapshot.forEach((d) => {
        const data = d.data() as Book;
        if (LEGACY_SEED_BOOK_IDS.has(d.id) || (data && LEGACY_SEED_BOOK_IDS.has(data.id))) {
          deleteDoc(doc(db, 'books', d.id)).catch(() => {});
          return;
        }
        firestoreBooks.push(data);
      });
    }

    let apiBooks: Book[] = [];
    let serverDeletedBookIds: string[] = [];
    if (apiBooksRes && apiBooksRes.ok) {
      try {
        const bJson = await apiBooksRes.json();
        if (Array.isArray(bJson.books)) {
          apiBooks = bJson.books.filter((b: Book) => b && !LEGACY_SEED_BOOK_IDS.has(b.id));
        }
        if (Array.isArray(bJson.deletedIds)) {
          serverDeletedBookIds = bJson.deletedIds;
        }
      } catch (e) {}
    }

    let localDeletedBookIds: string[] = [];
    try {
      const rawDeleted = localStorage.getItem('deleted_book_ids');
      if (rawDeleted) localDeletedBookIds = JSON.parse(rawDeleted);
    } catch (e) {}

    const deletedBookIds = Array.from(new Set([...localDeletedBookIds, ...serverDeletedBookIds]));
    try {
      if (deletedBookIds.length > 0) {
        localStorage.setItem('deleted_book_ids', JSON.stringify(deletedBookIds));
      }
    } catch (e) {}

    const booksMap = new Map<string, Book>();
    apiBooks.forEach(b => {
      if (b && b.id && !deletedBookIds.includes(b.id) && !LEGACY_SEED_BOOK_IDS.has(b.id)) {
        booksMap.set(b.id, { ...booksMap.get(b.id), ...b });
      }
    });
    firestoreBooks.forEach(b => {
      if (b && b.id && !deletedBookIds.includes(b.id) && !LEGACY_SEED_BOOK_IDS.has(b.id)) {
        booksMap.set(b.id, { ...booksMap.get(b.id), ...b });
      }
    });

    const booksData: Book[] = Array.from(booksMap.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );

    const { normalizeCategory } = courseUtilsModule;
    const categoriesMap: Record<string, Set<string>> = {};
    coursesData.forEach(c => {
      const cat = normalizeCategory(c.category);
      if (!categoriesMap[cat]) categoriesMap[cat] = new Set();
      if (c.subCategory && c.subCategory.trim()) categoriesMap[cat].add(c.subCategory.trim());
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
      banners: bannersData,
      books: booksData
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

function getUtf8ByteSize(obj: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(obj)).length;
  } catch {
    return 0;
  }
}

// Compact a course object for backup storage if needed to keep payload lean
function compactCourseForBackup(course: Course): Course {
  return {
    ...course,
    description: course.description ? course.description.slice(0, 2000) : '',
    videos: Array.isArray(course.videos)
      ? course.videos.map((v) => ({
          id: v.id,
          title: v.title,
          duration: v.duration,
          youtubeId: v.youtubeId,
          ...(v.viewCount !== undefined ? { viewCount: v.viewCount } : {}),
          ...(v.likeCount !== undefined ? { likeCount: v.likeCount } : {}),
          ...(v.commentCount !== undefined ? { commentCount: v.commentCount } : {}),
        }))
      : [],
  };
}

let autoBackupTimeout: ReturnType<typeof setTimeout> | null = null;

export async function runAutoBackup() {
  if (autoBackupTimeout) {
    clearTimeout(autoBackupTimeout);
  }

  autoBackupTimeout = setTimeout(async () => {
    try {
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const coursesData: Course[] = [];
      coursesSnapshot.forEach((d) => coursesData.push(compactCourseForBackup(d.data() as Course)));

      const pathsSnapshot = await getDocs(collection(db, 'learningPaths'));
      const pathsData: LearningPath[] = [];
      pathsSnapshot.forEach((d) => pathsData.push(d.data() as LearningPath));

      // Keep each Firestore document strictly below 500 KB (Firestore limit is 1,048,576 bytes)
      const MAX_CHUNK_BYTES = 500_000;
      const courseChunks: Course[][] = [];
      let currentChunk: Course[] = [];
      let currentChunkBytes = 0;

      for (const course of coursesData) {
        const courseBytes = getUtf8ByteSize(course);
        if (currentChunk.length > 0 && currentChunkBytes + courseBytes > MAX_CHUNK_BYTES) {
          courseChunks.push(currentChunk);
          currentChunk = [course];
          currentChunkBytes = courseBytes;
        } else {
          currentChunk.push(course);
          currentChunkBytes += courseBytes;
        }
      }
      if (currentChunk.length > 0) {
        courseChunks.push(currentChunk);
      }

      const timestamp = new Date().toISOString();
      const primaryCourses = courseChunks[0] || [];
      const additionalChunks = courseChunks.slice(1);

      const primaryBackup = {
        _metadata: {
          timestamp,
          type: 'NEXA_FULL_BACKUP',
          trigger: 'auto',
          totalCourses: coursesData.length,
          totalPaths: pathsData.length,
          totalChunks: Math.max(1, courseChunks.length),
        },
        courses: primaryCourses,
        learningPaths: getUtf8ByteSize(pathsData) <= 250_000 ? pathsData : pathsData.slice(0, 50),
      };

      await setDoc(doc(db, 'system_backups', 'latest_auto_backup'), primaryBackup);

      for (let i = 0; i < additionalChunks.length; i++) {
        await setDoc(doc(db, 'system_backups', `latest_auto_backup_part_${i + 1}`), {
          _metadata: {
            timestamp,
            type: 'NEXA_FULL_BACKUP_PART',
            partIndex: i + 1,
            totalChunks: courseChunks.length,
          },
          courses: additionalChunks[i],
        });
      }
    } catch (e) {
      console.warn('Auto-backup skipped:', e);
    }
  }, 1500);
}

export async function addOrUpdateCourse(course: Course, skipBackup = false) {
  const safeId = (course.id && typeof course.id === 'string' && course.id.trim())
    ? course.id.trim()
    : 'course_' + Math.random().toString(36).substring(2, 9);
  const safeCourse: Course = { ...course, id: safeId };
  try {
    const rawDeleted = localStorage.getItem('deleted_course_ids');
    if (rawDeleted) {
      const list = JSON.parse(rawDeleted) as string[];
      if (list.includes(safeId)) {
        localStorage.setItem('deleted_course_ids', JSON.stringify(list.filter(id => id !== safeId)));
      }
    }
  } catch (e) {}
  await setDoc(doc(db, 'courses', safeId), safeCourse);
  if (!skipBackup) {
    await runAutoBackup();
  }
}

export async function deleteCourseInFirestore(courseId: string) {
  if (!courseId || typeof courseId !== 'string') return;
  try {
    const rawDeleted = localStorage.getItem('deleted_course_ids');
    const list: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
    if (!list.includes(courseId)) {
      list.push(courseId);
      localStorage.setItem('deleted_course_ids', JSON.stringify(list));
    }
  } catch (e) {}
  await deleteDoc(doc(db, 'courses', courseId));
  await runAutoBackup();
}

export async function addOrUpdatePath(path: LearningPath) {
  const safeId = (path.id && typeof path.id === 'string' && path.id.trim())
    ? path.id.trim()
    : 'path_' + Math.random().toString(36).substring(2, 9);
  const safePath: LearningPath = { ...path, id: safeId };
  await setDoc(doc(db, 'learningPaths', safeId), safePath);
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

export async function addOrUpdateBook(book: Book) {
  try {
    const rawDeleted = localStorage.getItem('deleted_book_ids');
    if (rawDeleted) {
      const list = JSON.parse(rawDeleted) as string[];
      if (list.includes(book.id)) {
        localStorage.setItem('deleted_book_ids', JSON.stringify(list.filter(id => id !== book.id)));
      }
    }
  } catch (e) {}

  try {
    await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book)
    });
  } catch (e) {
    console.warn("API save book warning:", e);
  }

  try {
    await setDoc(doc(db, 'books', book.id), book);
  } catch (e) {
    console.warn("Firestore save book warning:", e);
  }
}

export async function deleteBookInFirestore(bookId: string) {
  try {
    const rawDeleted = localStorage.getItem('deleted_book_ids');
    const list: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
    if (!list.includes(bookId)) {
      list.push(bookId);
      localStorage.setItem('deleted_book_ids', JSON.stringify(list));
    }
  } catch (e) {}

  try {
    await fetch(`/api/books/${encodeURIComponent(bookId)}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.warn("API delete book warning:", e);
  }

  try {
    await deleteDoc(doc(db, 'books', bookId));
  } catch (e) {
    console.warn("Firestore delete book warning:", e);
  }
}
