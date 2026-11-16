import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { awardCustomXP } from './gamification';

export interface StudentProject {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string;
  userUsername?: string;
  title: string;
  description: string;
  category: string; // e.g. 'Web Development', 'Cybersecurity', 'AI & Machine Learning', 'DevOps', 'Mobile'
  githubUrl: string;
  liveDemoUrl?: string;
  tags: string[];
  thumbnailUrl?: string;
  likesCount: number;
  likedBy?: string[];
  reviewsCount: number;
  avgRating: number;
  isFeatured?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PeerReview {
  id: string;
  projectId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string;
  userUsername?: string;
  rating: number; // 1 to 5
  feedback: string;
  createdAt: number;
}

// Default curated inspiration projects shown when database is empty
export const SEED_STUDENT_PROJECTS: StudentProject[] = [
  {
    id: 'seed-proj-cyber-scanner',
    userId: 'atlas-seed-1',
    userDisplayName: 'Karim Alami',
    userPhotoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    userUsername: 'karim_sec',
    title: 'Automated Port Scanner & Vulnerability Banner Grabber',
    description: 'A multi-threaded Python CLI network utility for scanning open ports, grabbing service banners, and generating security audit JSON reports.',
    category: 'Cybersecurity',
    githubUrl: 'https://github.com/nexa1337',
    liveDemoUrl: 'https://github.com/nexa1337',
    tags: ['Python', 'Sockets', 'Linux', 'Security Audit', 'CLI'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
    likesCount: 28,
    reviewsCount: 4,
    avgRating: 4.9,
    isFeatured: true,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3
  },
  {
    id: 'seed-proj-fullstack-lms',
    userId: 'atlas-seed-2',
    userDisplayName: 'Sarah Bennani',
    userPhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    userUsername: 'sarah_codes',
    title: 'Modern Markdown Tech Documentation Engine',
    description: 'Clean, distraction-free technical documentation reader with full-text search, dark mode syntax highlighting, and interactive code copy.',
    category: 'Web Development',
    githubUrl: 'https://github.com/nexa1337',
    liveDemoUrl: 'https://github.com/nexa1337',
    tags: ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    likesCount: 34,
    reviewsCount: 5,
    avgRating: 5.0,
    isFeatured: true,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5
  },
  {
    id: 'seed-proj-ai-summarizer',
    userId: 'atlas-seed-3',
    userDisplayName: 'Omar Tazi',
    userPhotoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    userUsername: 'omar_ai',
    title: 'Research Paper Deep Summarizer & Key Takeaways',
    description: 'Extracts core theorems, citations, and algorithmic pseudo-code from arXiv PDFs into concise bulleted executive summaries.',
    category: 'AI & Machine Learning',
    githubUrl: 'https://github.com/nexa1337',
    liveDemoUrl: 'https://github.com/nexa1337',
    tags: ['Python', 'FastAPI', 'LangChain', 'PDF Parsing'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    likesCount: 19,
    reviewsCount: 3,
    avgRating: 4.7,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 7
  }
];

/**
 * Fetch all student projects from Firestore
 */
export async function fetchAllStudentProjects(): Promise<StudentProject[]> {
  try {
    const colRef = collection(db, 'student_projects');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);

    if (snap.empty) {
      return SEED_STUDENT_PROJECTS;
    }

    const projects: StudentProject[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      projects.push({
        id: docSnap.id,
        userId: data.userId || '',
        userDisplayName: data.userDisplayName || 'Student',
        userPhotoURL: data.userPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.userDisplayName || 'Student')}`,
        userUsername: data.userUsername || '',
        title: data.title || '',
        description: data.description || '',
        category: data.category || 'Web Development',
        githubUrl: data.githubUrl || '',
        liveDemoUrl: data.liveDemoUrl || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        thumbnailUrl: data.thumbnailUrl || '',
        likesCount: typeof data.likesCount === 'number' ? data.likesCount : 0,
        likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
        reviewsCount: typeof data.reviewsCount === 'number' ? data.reviewsCount : 0,
        avgRating: typeof data.avgRating === 'number' ? data.avgRating : 5.0,
        isFeatured: Boolean(data.isFeatured),
        createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
        updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now()
      });
    });

    // Merge seed projects if few
    if (projects.length < 3) {
      const existingIds = new Set(projects.map(p => p.id));
      for (const s of SEED_STUDENT_PROJECTS) {
        if (!existingIds.has(s.id)) {
          projects.push(s);
        }
      }
    }

    return projects;
  } catch (err) {
    console.error('Error fetching student projects:', err);
    return SEED_STUDENT_PROJECTS;
  }
}

/**
 * Submit a new student project (+75 XP award)
 */
export async function submitStudentProject(
  projectData: Omit<StudentProject, 'id' | 'likesCount' | 'reviewsCount' | 'avgRating' | 'createdAt' | 'updatedAt' | 'likedBy'>
): Promise<StudentProject> {
  const colRef = collection(db, 'student_projects');
  const now = Date.now();

  const newDocPayload = {
    ...projectData,
    likesCount: 0,
    likedBy: [],
    reviewsCount: 0,
    avgRating: 5.0,
    createdAt: now,
    updatedAt: now
  };

  const docRef = await addDoc(colRef, newDocPayload);

  // Award author +75 XP for sharing their work with community
  if (projectData.userId && !projectData.userId.startsWith('atlas-seed')) {
    try {
      await awardCustomXP(projectData.userId, 75, {
        id: 'project_builder',
        name: 'Project Builder',
        description: 'Published a hands-on project to the Student Showcase',
        icon: '🚀'
      });
    } catch (e) {
      console.warn('Could not award XP for project submit:', e);
    }
  }

  return {
    ...newDocPayload,
    id: docRef.id
  };
}

/**
 * Delete a student project
 */
export async function deleteStudentProject(projectId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'student_projects', projectId));
    return true;
  } catch (err) {
    console.error('Failed to delete student project:', err);
    return false;
  }
}

/**
 * Fetch reviews for a specific student project
 */
export async function fetchProjectReviews(projectId: string): Promise<PeerReview[]> {
  try {
    // If seed project, return synthetic reviews for instant lively feel
    if (projectId.startsWith('seed-proj-')) {
      return [
        {
          id: 'seed-rev-1',
          projectId,
          userId: 'user-rev-1',
          userDisplayName: 'Yassine M.',
          userPhotoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          rating: 5,
          feedback: 'Clean modular code structure and the CLI documentation is super clear! Tested it locally and was very responsive.',
          createdAt: Date.now() - 86400000 * 2
        },
        {
          id: 'seed-rev-2',
          projectId,
          userId: 'user-rev-2',
          userDisplayName: 'Amina Radi',
          userPhotoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
          rating: 5,
          feedback: 'Great error handling on socket timeouts. Added a star on your GitHub repository! Keep building.',
          createdAt: Date.now() - 86400000 * 1
        }
      ];
    }

    const reviewsCol = collection(db, 'student_projects', projectId, 'reviews');
    const q = query(reviewsCol, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);

    const reviews: PeerReview[] = [];
    snap.forEach(d => {
      const data = d.data();
      reviews.push({
        id: d.id,
        projectId,
        userId: data.userId || '',
        userDisplayName: data.userDisplayName || 'Peer Reviewer',
        userPhotoURL: data.userPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.userDisplayName || 'Reviewer')}`,
        userUsername: data.userUsername || '',
        rating: typeof data.rating === 'number' ? data.rating : 5,
        feedback: data.feedback || '',
        createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now()
      });
    });

    return reviews;
  } catch (err) {
    console.error('Error fetching project reviews:', err);
    return [];
  }
}

/**
 * Add a peer review & rating to a student project (+25 XP to reviewer)
 */
export async function addPeerReview(
  projectId: string,
  review: Omit<PeerReview, 'id' | 'createdAt'>
): Promise<PeerReview> {
  const reviewsCol = collection(db, 'student_projects', projectId, 'reviews');
  const now = Date.now();

  const newReviewPayload = {
    ...review,
    projectId,
    createdAt: now
  };

  const docRef = await addDoc(reviewsCol, newReviewPayload);

  // Re-calculate average rating and increment review count on parent project
  try {
    const projectRef = doc(db, 'student_projects', projectId);
    const pSnap = await getDoc(projectRef);
    if (pSnap.exists()) {
      const pData = pSnap.data();
      const currentCount = typeof pData.reviewsCount === 'number' ? pData.reviewsCount : 0;
      const currentAvg = typeof pData.avgRating === 'number' ? pData.avgRating : 5.0;
      
      const newCount = currentCount + 1;
      const newAvg = Number(((currentAvg * currentCount + review.rating) / newCount).toFixed(1));

      await updateDoc(projectRef, {
        reviewsCount: newCount,
        avgRating: newAvg,
        updatedAt: now
      });
    }
  } catch (e) {
    console.warn('Could not update project aggregate stats:', e);
  }

  // Award reviewer +25 XP for contributing constructive feedback
  if (review.userId && !review.userId.startsWith('atlas-seed')) {
    try {
      await awardCustomXP(review.userId, 25, {
        id: 'peer_reviewer',
        name: 'Peer Reviewer',
        description: 'Provided constructive peer review on a student project',
        icon: '⭐'
      });
    } catch (e) {
      console.warn('Could not award XP for peer review:', e);
    }
  }

  return {
    ...newReviewPayload,
    id: docRef.id
  };
}

/**
 * Like / Upvote a student project
 */
export async function toggleProjectLike(projectId: string, userId: string): Promise<{ liked: boolean; newCount: number }> {
  if (!projectId || !userId) return { liked: false, newCount: 0 };
  
  if (projectId.startsWith('seed-proj-')) {
    return { liked: true, newCount: 35 };
  }

  try {
    const projectRef = doc(db, 'student_projects', projectId);
    const snap = await getDoc(projectRef);
    if (!snap.exists()) return { liked: false, newCount: 0 };

    const data = snap.data();
    const likedBy: string[] = Array.isArray(data.likedBy) ? data.likedBy : [];
    const isLiked = likedBy.includes(userId);

    let updatedLikedBy: string[];
    let newLikesCount: number;

    if (isLiked) {
      updatedLikedBy = likedBy.filter(id => id !== userId);
      newLikesCount = Math.max(0, (data.likesCount || 1) - 1);
    } else {
      updatedLikedBy = [...likedBy, userId];
      newLikesCount = (data.likesCount || 0) + 1;
    }

    await updateDoc(projectRef, {
      likedBy: updatedLikedBy,
      likesCount: newLikesCount
    });

    return { liked: !isLiked, newCount: newLikesCount };
  } catch (err) {
    console.error('Error toggling project like:', err);
    return { liked: false, newCount: 0 };
  }
}
