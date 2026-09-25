import Papa from 'papaparse';
import { Course, LearningPath, Category, Video } from '../data/courses';

// Automatically turn any Title into a clean ID (e.g. "My Course Name" -> "my-course-name")
const slugify = (text: string) => {
  if (!text) return Math.random().toString(36).substring(7);
  return text.toString().toLowerCase().trim()
    .replace(/[^\w\s-]/g, '') // remove non-word chars
    .replace(/[\s_-]+/g, '-') // swap spaces with dash
    .replace(/^-+|-+$/g, ''); // remove leading/trailing dashes
};

// YOU CAN PASTE YOUR 3 GOOGLE SHEET CSV LINKS HERE
const GOOGLE_SHEETS = {
  paths: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRetx4yMpoTSxtxTCr-A41K7I_OrcNwH3hbh8jEaRfwF8f_dwlhv5OmKsiv8K3QG3ioOkPqNLUn4_dA/pub?gid=232869483&single=true&output=csv",
  courses: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRetx4yMpoTSxtxTCr-A41K7I_OrcNwH3hbh8jEaRfwF8f_dwlhv5OmKsiv8K3QG3ioOkPqNLUn4_dA/pub?gid=305983789&single=true&output=csv",
  videos: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRetx4yMpoTSxtxTCr-A41K7I_OrcNwH3hbh8jEaRfwF8f_dwlhv5OmKsiv8K3QG3ioOkPqNLUn4_dA/pub?gid=0&single=true&output=csv"
};

export async function fetchGoogleSheetsContent() {
  if (!GOOGLE_SHEETS.paths || !GOOGLE_SHEETS.courses || !GOOGLE_SHEETS.videos) {
    throw new Error('Missing Google Sheets links. Using manual code data instead.');
  }

  try {
    const [pathsRes, coursesRes, videosRes] = await Promise.all([
      fetch(GOOGLE_SHEETS.paths),
      fetch(GOOGLE_SHEETS.courses),
      fetch(GOOGLE_SHEETS.videos)
    ]);

    const pathsCsv = await pathsRes.text();
    const coursesCsv = await coursesRes.text();
    const videosCsv = await videosRes.text();

    const pathsData = Papa.parse(pathsCsv, { header: true, skipEmptyLines: true }).data as any[];
    const coursesData = Papa.parse(coursesCsv, { header: true, skipEmptyLines: true }).data as any[];
    const videosData = Papa.parse(videosCsv, { header: true, skipEmptyLines: true }).data as any[];

    const categoriesMap: Record<string, Set<string>> = {};
    const titleToIdMap: Record<string, string> = {}; // Allows users to use Titles instead of IDs!

    // 1. Parse Courses First
    const parsedCourses: Course[] = coursesData.map(c => {
      const title = c.Title || "Untitled Course";
      const id = c.ID || slugify(title); // Auto-generate ID if empty!
      
      // Save mappings so the user can just type the Course Title in other sheets
      titleToIdMap[id] = id;
      titleToIdMap[title.toLowerCase().trim()] = id;

      const cat = c.Category || "Other";
      if (!categoriesMap[cat]) categoriesMap[cat] = new Set();
      if (c.SubCategory) categoriesMap[cat].add(c.SubCategory);

      return {
        id: id,
        title: title,
        description: c.Description || "",
        instructor: c.Instructor || "",
        instructorAvatar: c.InstructorAvatar || undefined,
        instructorUrl: c.InstructorUrl || undefined,
        thumbnail: c.Thumbnail || "",
        category: cat,
        subCategory: c.SubCategory || undefined,
        isSingleVideo: c.IsMasterclass?.toLowerCase() === 'true',
        videos: [] // We will fill this next
      };
    });

    // 2. Parse Videos and push them into the correct Course
    videosData.forEach(v => {
      const courseReference = v.CourseID || v.Course || "";
      const cleanRef = courseReference.toLowerCase().trim();
      
      // Auto-detect if user typed the ID, or just typed the Course Title!
      const targetCourseId = titleToIdMap[cleanRef] || titleToIdMap[slugify(cleanRef)] || courseReference;
      
      const course = parsedCourses.find(c => c.id === targetCourseId);
      if (course) {
        course.videos.push({
          id: v.ID || slugify(v.Title || "vid"), // Auto ID
          title: v.Title || "Untitled Video",
          duration: v.Duration || "0:00",
          youtubeId: v.YoutubeID || ""
        });
      }
    });

    // 3. Parse Learning Paths
    const parsedPaths: LearningPath[] = pathsData.map(p => {
      const title = p.Title || "Untitled Path";
      const id = p.ID || slugify(title); // Auto ID
      
      const rawCourseIds = p.CourseIDs || p.Courses || "";
      const courseIds = rawCourseIds.split(',')
        .map((ref: string) => {
          const cleanRef = ref.toLowerCase().trim();
          // Find the real ID whether they typed the Title or the ID
          return titleToIdMap[cleanRef] || titleToIdMap[slugify(cleanRef)] || cleanRef;
        })
        .filter((cid: string) => cid); // Remove empty spaces

      return {
        id: id,
        title: title,
        description: p.Description || "",
        courseIds: courseIds,
        icon: p.Icon || "Code"
      };
    });

    // Generate categories for filter buttons
    const parsedCategories: Category[] = [
      { name: "All", subCategories: [] },
      ...Object.keys(categoriesMap).map(k => ({
        name: k,
        subCategories: Array.from(categoriesMap[k])
      }))
    ];

    return {
      courses: parsedCourses,
      learningPaths: parsedPaths,
      categories: parsedCategories
    };

  } catch (error) {
    console.error("Failed to parse Google Sheets, falling back to local storage:", error);
    throw error;
  }
}
