import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Course, LearningPath, Category, AppNotification, AdBannerData, Book, defaultBooks } from '../data/courses';
import { fetchGoogleSheetsContent } from './sheets';

export async function fetchFirestoreContent() {
  try {
    const coursesSnapshot = await getDocs(collection(db, 'courses'));
    let coursesData: Course[] = [];
    coursesSnapshot.forEach((d) => {
      const data = d.data() as Course;
      if (data) {
        coursesData.push({
          ...data,
          id: (data.id && typeof data.id === 'string' && data.id.trim()) ? data.id.trim() : d.id,
          title: data.title || 'Untitled Course',
          category: data.category || 'Programming',
          videos: Array.isArray(data.videos) ? data.videos : [],
        });
      }
    });

    const pathsSnapshot = await getDocs(collection(db, 'learningPaths'));
    let pathsData: LearningPath[] = [];
    pathsSnapshot.forEach((doc) => {
      pathsData.push(doc.data() as LearningPath);
    });

    let notificationsData: AppNotification[] = [];
    try {
      const notificationsSnapshot = await getDocs(collection(db, 'notifications'));
      notificationsSnapshot.forEach((doc) => {
        notificationsData.push(doc.data() as AppNotification);
      });
    } catch (e) {
      console.warn("Firestore notifications read error:", e);
    }

    try {
      const apiRes = await fetch('/api/notifications');
      if (apiRes.ok) {
        const apiJson = await apiRes.json();
        if (Array.isArray(apiJson.notifications)) {
          const map = new Map<string, AppNotification>();
          apiJson.notifications.forEach((n: AppNotification) => map.set(n.id, n));
          notificationsData.forEach((n: AppNotification) => map.set(n.id, { ...map.get(n.id), ...n }));
          notificationsData = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }
      }
    } catch (e) {
      console.warn("API notifications fetch error:", e);
    }

    const bannersSnapshot = await getDocs(collection(db, 'banners'));
    let bannersData: AdBannerData[] = [];
    bannersSnapshot.forEach((doc) => {
      bannersData.push(doc.data() as AdBannerData);
    });

    // Legacy hardcoded seed book IDs to ignore and auto-clean so only manually added books appear
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

    // Fetch Books from Firestore + API (Only manually added books)
    let firestoreBooks: Book[] = [];
    try {
      const booksSnapshot = await getDocs(collection(db, 'books'));
      booksSnapshot.forEach((d) => {
        const data = d.data() as Book;
        if (LEGACY_SEED_BOOK_IDS.has(d.id) || (data && LEGACY_SEED_BOOK_IDS.has(data.id))) {
          // Silently clean up legacy seed books if previously synced to Firestore
          deleteDoc(doc(db, 'books', d.id)).catch(() => {});
          return;
        }
        firestoreBooks.push(data);
      });
    } catch (e) {
      console.warn("Firestore books read warning:", e);
    }

    let apiBooks: Book[] = [];
    let serverDeletedBookIds: string[] = [];
    try {
      const bRes = await fetch('/api/books');
      if (bRes.ok) {
        const bJson = await bRes.json();
        if (Array.isArray(bJson.books)) {
          apiBooks = bJson.books.filter((b: Book) => b && !LEGACY_SEED_BOOK_IDS.has(b.id));
        }
        if (Array.isArray(bJson.deletedIds)) {
          serverDeletedBookIds = bJson.deletedIds;
        }
      }
    } catch (e) {
      console.warn("API books read warning:", e);
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

    import('../lib/courseUtils').then(); // ensure loaded
    const { normalizeCategory } = await import('../lib/courseUtils');
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
  const safeId = (course.id && typeof course.id === 'string' && course.id.trim())
    ? course.id.trim()
    : 'course_' + Math.random().toString(36).substring(2, 9);
  const safeCourse: Course = { ...course, id: safeId };
  await setDoc(doc(db, 'courses', safeId), safeCourse);
  await runAutoBackup();
}

export async function deleteCourseInFirestore(courseId: string) {
  if (!courseId || typeof courseId !== 'string') return;
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
