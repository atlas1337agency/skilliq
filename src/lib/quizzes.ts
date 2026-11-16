import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export interface QuizQuestion {
  id: string;
  question: {
    en: string;
    ar: string;
  };
  options: {
    en: string;
    ar: string;
  }[];
  correctAnswer: number;
  explanation: {
    en: string;
    ar: string;
  };
  type: 'mcq' | 'practical';
  codeSnippet?: string;
}

export interface CourseQuiz {
  id: string;
  courseId: string;
  videoId?: string;
  videoTitle?: string;
  title: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  passingScore: number; // percentage (e.g., 70)
  xpReward: number;
  questions: QuizQuestion[];
  updatedAt?: number;
}

export const COURSE_QUIZZES: Record<string, CourseQuiz> = {
  cybersecurity: {
    id: 'quiz-cybersecurity',
    courseId: 'cybersecurity',
    title: {
      en: 'Cybersecurity Defense & Auditing Certification Quiz',
      ar: 'اختبار كفاءة الدفاع السيبراني والتدقيق الأمني'
    },
    description: {
      en: 'Test your understanding of OWASP Top 10 vulnerabilities, Linux permission hardening, and network protocols before receiving your certificate.',
      ar: 'اختبر فهمك لأخطر ثغرات OWASP، حماية صلاحيات لينكس، وبروتوكولات الشبكات قبل الحصول على شهادتك.'
    },
    passingScore: 70,
    xpReward: 120,
    questions: [
      {
        id: 'q1',
        type: 'mcq',
        question: {
          en: 'Which HTTP header is most effective in preventing Cross-Site Scripting (XSS) by restricting where scripts can be loaded from?',
          ar: 'أي ترويسة HTTP هي الأكثر فعالية للوقاية من هجمات XSS عبر تقييد مصادر تحميل السكربتات؟'
        },
        options: [
          { en: 'Content-Security-Policy (CSP)', ar: 'Content-Security-Policy (CSP)' },
          { en: 'X-Frame-Options', ar: 'X-Frame-Options' },
          { en: 'Strict-Transport-Security (HSTS)', ar: 'Strict-Transport-Security (HSTS)' },
          { en: 'Access-Control-Allow-Origin', ar: 'Access-Control-Allow-Origin' }
        ],
        correctAnswer: 0,
        explanation: {
          en: 'Content-Security-Policy (CSP) allows server administrators to restrict the dynamic resources (JavaScript, CSS, Images) that the browser is allowed to load.',
          ar: 'تتيح ترويسة CSP لمدير الموقع تحديد المصادر الموثوقة لتحميل السكربتات والصور، مما يمنع حقن وتنفيذ أكواد XSS الخبيثة.'
        }
      },
      {
        id: 'q2',
        type: 'practical',
        codeSnippet: `SELECT * FROM users WHERE username = 'admin' AND password = '' OR '1'='1';`,
        question: {
          en: 'What specific vulnerability is demonstrated in the SQL query above, and what is the primary mitigation?',
          ar: 'ما هي الثغرة الموضحة في استعلام SQL أعلاه، وما هو الحل الأساسي لمنعها؟'
        },
        options: [
          { en: 'SQL Injection — Mitigated by Prepared Statements / Parameterized Queries', ar: 'حقن SQL (SQLi) — الحل باستخدام الاستعلامات المجهزة (Parameterized Queries)' },
          { en: 'Broken Access Control — Mitigated by JWT authentication', ar: 'خلل في التحكم بالوصول — الحل باستخدام توثيق JWT' },
          { en: 'Insecure Deserialization — Mitigated by JSON schema validation', ar: 'إلغاء التسلسل غير الآمن — الحل بالتحقق من هيكل JSON' },
          { en: 'Buffer Overflow — Mitigated by memory-safe languages', ar: 'طوفان الذاكرة — الحل باستخدام لغات آمنة' }
        ],
        correctAnswer: 0,
        explanation: {
          en: 'Tautology-based SQL injection exploits string concatenation. Using Parameterized Queries ensures input is treated strictly as data, never executable code.',
          ar: 'حقن SQL المبني على التكرار المنطقي OR 1=1 يستغل دمج النصوص. استخدام الاستعلامات المجهزة يضمن معاملة المدخلات كبيانات فقط وليس كأمر قابل للتنفيذ.'
        }
      },
      {
        id: 'q3',
        type: 'practical',
        codeSnippet: `chmod 750 /var/www/secret_audit.log`,
        question: {
          en: 'In Linux permissions notation, what permissions does the "group" receive from the command above?',
          ar: 'في نظام تصاريح لينكس، ما هي الصلاحيات التي تحصل عليها "المجموعة" (Group) من الأمر أعلاه؟'
        },
        options: [
          { en: 'Read & Execute (r-x)', ar: 'قراءة وتنفيذ فقط (r-x)' },
          { en: 'Read, Write, and Execute (rwx)', ar: 'قراءة، كتابة، وتنفيذ (rwx)' },
          { en: 'Read Only (r--)', ar: 'قراءة فقط (r--)' },
          { en: 'No Permissions (---)', ar: 'لا توجد صلاحيات (---)' }
        ],
        correctAnswer: 0,
        explanation: {
          en: '7 (User) = rwx, 5 (Group) = r-x (Read: 4 + Execute: 1 = 5), 0 (Others) = none.',
          ar: 'الرقم 7 للمالك (rwx)، والرقم 5 للمجموعة (قراءة 4 + تنفيذ 1 = 5 أي r-x)، والرقم 0 للآخرين (بدون صلاحيات).'
        }
      },
      {
        id: 'q4',
        type: 'mcq',
        question: {
          en: 'What occurs during the second step of a standard TCP 3-way handshake?',
          ar: 'ما الذي يتم إرساله تحديداً في الخطوة الثانية من مصافحة TCP الثلاثية (3-Way Handshake)؟'
        },
        options: [
          { en: 'SYN-ACK packet from Server to Client', ar: 'حزمة SYN-ACK من الخادم إلى العميل' },
          { en: 'SYN packet from Client to Server', ar: 'حزمة SYN من العميل إلى الخادم' },
          { en: 'ACK packet with HTTP Payload', ar: 'حزمة ACK مع بيانات طلب HTTP' },
          { en: 'FIN-ACK connection termination packet', ar: 'حزمة FIN-ACK لإنهاء الاتصال' }
        ],
        correctAnswer: 0,
        explanation: {
          en: 'TCP Handshake: 1. Client sends SYN, 2. Server responds with SYN-ACK, 3. Client sends ACK.',
          ar: 'خطوات مصافحة TCP: أولاً يرسل العميل SYN، ثانياً يرد الخادم بـ SYN-ACK، ثالثاً يؤكد العميل بـ ACK.'
        }
      },
      {
        id: 'q5',
        type: 'mcq',
        question: {
          en: 'An attacker modifies the request URL from /invoice/1042 to /invoice/1041 and views another customer invoice without authorization. What vulnerability is this?',
          ar: 'مهاجم قام بتعديل رابط الطلب من /invoice/1042 إلى /invoice/1041 وشاهد فاتورة عميل آخر دون تصريح. ما اسم هذه الثغرة؟'
        },
        options: [
          { en: 'BOLA / IDOR (Insecure Direct Object Reference)', ar: 'ثغرة المرجع المباشر غير الآمن للكائنات (IDOR / BOLA)' },
          { en: 'CSRF (Cross-Site Request Forgery)', ar: 'تزوير الطلب عبر المواقع (CSRF)' },
          { en: 'Server-Side Request Forgery (SSRF)', ar: 'تزوير الطلب من جانب الخادم (SSRF)' },
          { en: 'Directory Traversal', ar: 'التنقل بين المجلدات (Path Traversal)' }
        ],
        correctAnswer: 0,
        explanation: {
          en: 'IDOR (or Broken Object Level Authorization) occurs when an application exposes a reference to an internal object without verifying if the requesting user has permission to access it.',
          ar: 'تحدث ثغرة IDOR عند الاعتماد على معرّف الكائن مباشرة في الطلب بدون التحقق البرمجي من أن المستخدم الحالي يملك حق الوصول لهذا السجل المحدد.'
        }
      }
    ]
  },

  webdev: {
    id: 'quiz-webdev',
    courseId: 'webdev',
    title: {
      en: 'Modern Full-Stack Web Mastery Quiz',
      ar: 'اختبار كفاءة تطوير الويب الحديث المتكامل'
    },
    description: {
      en: 'Evaluate your command of React lifecycle, asynchronous JavaScript, CSS layout algorithms, and modern state architecture.',
      ar: 'اختبر إتقانك لدورة حياة رياكت، جافاسكربت غير المتزامنة، هندسة CSS، وإدارة الحالة الحديثة.'
    },
    passingScore: 70,
    xpReward: 120,
    questions: [
      {
        id: 'qw1',
        type: 'practical',
        codeSnippet: `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');`,
        question: {
          en: 'In what exact order will the numbers be logged to the console in the JavaScript event loop?',
          ar: 'بأي ترتيب دقيق ستُطبع الأرقام في الطرفية وفقاً لآلية الـ Event Loop في JavaScript؟'
        },
        options: [
          { en: '1, 4, 3, 2', ar: '1, 4, 3, 2' },
          { en: '1, 2, 3, 4', ar: '1, 2, 3, 4' },
          { en: '1, 3, 4, 2', ar: '1, 3, 4, 2' },
          { en: '1, 4, 2, 3', ar: '1, 4, 2, 3' }
        ],
        correctAnswer: 0,
        explanation: {
          en: 'Synchronous code runs first (1, 4). Microtasks (Promise.then) run immediately after synchronous tasks (3). Macrotasks (setTimeout) execute in the next tick (2).',
          ar: 'الكود المتزامن يعمل أولاً (1 ثم 4). المهام المجهرية Microtasks (مثل Promise) تُنفذ فوراً قبل الانتقال للماكرو (3). وأخيراً Macrotasks (مثل setTimeout) تطبع (2).'
        }
      },
      {
        id: 'qw2',
        type: 'practical',
        codeSnippet: `useEffect(() => {
  const handler = () => console.log(window.innerWidth);
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);`,
        question: {
          en: 'Why is the cleanup function returned in this useEffect hook critical?',
          ar: 'لماذا تُعد الدالة المرجعة (Cleanup function) في هوك useEffect هنا أمراً بالغ الأهمية؟'
        },
        options: [
          { en: 'To prevent memory leaks and zombie event listeners upon unmounting', ar: 'لمنع تسريب الذاكرة وتراكم مستمعي الأحداث عند إلغاء تحميل المكون' },
          { en: 'To force a re-render whenever the window size changes', ar: 'لإجبار المكون على إعادة الرسم عند تغير حجم الشاشة' },
          { en: 'To debounce the window resize events automatically', ar: 'لتأخير تنفيذ الحدث تلقائياً (Debounce)' },
          { en: 'It is required by TypeScript to satisfy return types', ar: 'لأن لغة TypeScript تفرض إعادة دالة من useEffect' }
        ],
        correctAnswer: 0,
        explanation: {
          en: 'Without the cleanup function, every time the component unmounts or re-renders, orphaned event listeners remain attached to the window object causing memory leaks.',
          ar: 'بدون دالة التنظيف، يبقى مستمع الحدث معلقاً في كائن window حتى بعد مغادرة الصفحة، مما يسبب استهلاكاً متراكماً للذاكرة وبطء التطبيق.'
        }
      },
      {
        id: 'qw3',
        type: 'mcq',
        question: {
          en: 'Which CSS property creates a new Stacking Context without altering layout geometry?',
          ar: 'أي خاصية CSS تُنشئ سياق تكديس جديد (Stacking Context) دون التأثير على أبعاد وتوزيع العنصر؟'
        },
        options: [
          { en: 'isolation: isolate;', ar: 'isolation: isolate;' },
          { en: 'display: block;', ar: 'display: block;' },
          { en: 'position: relative;', ar: 'position: relative;' },
          { en: 'margin: 0 auto;', ar: 'margin: 0 auto;' }
        ],
        correctAnswer: 0,
        explanation: {
          en: '`isolation: isolate` creates a new stacking context explicitly without requiring dummy z-index or opacity hacks.',
          ar: 'خاصية `isolation: isolate` تقوم بإنشاء سياق تكديس طبقي نظيف ومعزول دون الحاجة لحيل z-index أو تعديل الشفافية.'
        }
      },
      {
        id: 'qw4',
        type: 'mcq',
        question: {
          en: 'In REST API design, which HTTP method must be completely idempotent and replace the entire target resource representation?',
          ar: 'في تصميم واجهات REST API، أي الطرق التالية تتميز بكونها محايدة الأثر (Idempotent) وتستبدل مورد البيانات بالكامل؟'
        },
        options: [
          { en: 'PUT', ar: 'PUT' },
          { en: 'POST', ar: 'POST' },
          { en: 'PATCH', ar: 'PATCH' },
          { en: 'OPTIONS', ar: 'OPTIONS' }
        ],
        correctAnswer: 0,
        explanation: {
          en: 'PUT is idempotent and replaces the entire entity. PATCH is intended for partial updates. POST is non-idempotent creation.',
          ar: 'طريقة PUT محايدة التأثير وتستبدل الكائن بأكمله بالبيانات الجديدة. أما PATCH فللتعديلات الجزئية، وPOST لإنشاء جديد.'
        }
      },
      {
        id: 'qw5',
        type: 'practical',
        codeSnippet: `type User = { id: string; email: string };
type Admin = User & { permissions: string[] };`,
        question: {
          en: 'What TypeScript concept is used to create the "Admin" type above?',
          ar: 'ما هو المفهوم المستخدم في TypeScript لإنشاء النوع "Admin" في الكود أعلاه؟'
        },
        options: [
          { en: 'Intersection Type', ar: 'Intersection Type (نوع التقاطع)' },
          { en: 'Union Type', ar: 'Union Type (نوع الاتحاد)' },
          { en: 'Conditional Type', ar: 'Conditional Type (نوع شرطي)' },
          { en: 'Mapped Type', ar: 'Mapped Type (نوع تخطيطي)' }
        ],
        correctAnswer: 0,
        explanation: {
          en: 'The `&` operator creates an Intersection Type, combining all properties of User with the additional permissions array.',
          ar: 'المعامل `&` يقوم بدمج الأنواع (Intersection Type)، ليتطلب الكائن الناتج جميع خصائص User بالإضافة لمصفوفة الصلاحيات.'
        }
      }
    ]
  },

  python: {
    id: 'quiz-python',
    courseId: 'python',
    title: {
      en: 'Python & Data Automation Proficiency Quiz',
      ar: 'اختبار كفاءة لغة بايثون والأتمتة'
    },
    description: {
      en: 'Verify your proficiency with Python generators, memory efficiency, decorators, and data structures.',
      ar: 'تحقق من مهارتك في استخدام المولدات (Generators)، إدارة الذاكرة، المزخرفات (Decorators)، وهياكل البيانات.'
    },
    passingScore: 70,
    xpReward: 120,
    questions: [
      {
        id: 'qp1',
        type: 'practical',
        codeSnippet: `def get_even_numbers(limit):
    for n in range(limit):
        if n % 2 == 0:
            yield n`,
        question: {
          en: 'What does the `yield` keyword turn `get_even_numbers` into, and what is its primary benefit?',
          ar: 'إلى ماذا تحول الكلمة المفتاحية `yield` الدالة أعلاه وما الفائدة الأساسية منها؟'
        },
        options: [
          { en: 'A Generator that yields items lazily with O(1) memory consumption', ar: 'مولد بيانات (Generator) ينتج القيم بالطلب ويوفر الذاكرة باستهلاك O(1)' },
          { en: 'A recursive function that executes in parallel threads', ar: 'دالة تكرارية تنفذ المهام عبر خيوط معالجة متوازية' },
          { en: 'An async coroutine that requires an asyncio event loop', ar: 'دالة غير متزامنة تتطلب حلقة أحداث asyncio' },
          { en: 'A compile-time macro that precomputes arrays', ar: 'ماكرو يجمع الأرقام مسبقاً أثناء ترجمة الكود' }
        ],
        correctAnswer: 0,
        explanation: {
          en: 'Functions with `yield` return generator objects. They compute values one at a time on-the-fly, allowing processing of massive datasets without exhausting RAM.',
          ar: 'تُنشئ دالة yield مولداً ينتج الأرقام واحداً تلو الآخر عند الطلب دون حفظ القائمة كاملة في الذاكرة، وهو أمر ممتاز للبيانات الضخمة.'
        }
      },
      {
        id: 'qp2',
        type: 'practical',
        codeSnippet: `a = [1, 2, 3]
b = a
b.append(4)
print(len(a))`,
        question: {
          en: 'What will be printed to stdout when this snippet executes?',
          ar: 'ما الذي سيُطبع في مخرجات الشاشة عند تنفيذ هذا الكود؟'
        },
        options: [
          { en: '4', ar: '4' },
          { en: '3', ar: '3' },
          { en: 'TypeError', ar: 'خطأ في النوع (TypeError)' },
          { en: 'IndexError', ar: 'خطأ في المؤشر (IndexError)' }
        ],
        correctAnswer: 0,
        explanation: {
          en: 'In Python, lists are mutable objects. `b = a` assigns a reference to the same list in memory, not a deep copy. Modifying `b` modifies `a`.',
          ar: 'القوائم في بايثون كائنات قابلة للتعديل وتُمرر بالمرجع (Reference). لذلك التعديل على b يُعدل نفس الكائن الذي يشير إليه a، فيصبح طوله 4.'
        }
      },
      {
        id: 'qp3',
        type: 'mcq',
        question: {
          en: 'What is the average time complexity for searching an item in a Python set vs in a Python list?',
          ar: 'ما هو التعقيد الزمني المتوسط (Time Complexity) للبحث عن عنصر في set مقارنة بـ list في بايثون؟'
        },
        options: [
          { en: 'Set is O(1) average; List is O(n)', ar: 'المجموعة Set هي O(1) في المتوسط، بينما List هي O(n)' },
          { en: 'Both are O(log n)', ar: 'كلاهما O(log n)' },
          { en: 'List is O(1); Set is O(n)', ar: 'القائمة List هي O(1) بينما Set هي O(n)' },
          { en: 'Both are O(n)', ar: 'كلاهما O(n)' }
        ],
        correctAnswer: 0,
        explanation: {
          en: 'Python sets are implemented using hash tables with O(1) average lookup time, whereas lists require a linear scan O(n).',
          ar: 'مجموعات بايثون تُبنى على جداول التجزئة (Hash Tables) مما يجعل البحث فورياً بمتوسط O(1)، بعكس القوائم التي تبحث خطياً O(n).'
        }
      },
      {
        id: 'qp4',
        type: 'practical',
        codeSnippet: `def timer_decorator(func):
    def wrapper(*args, **kwargs):
        # measure time
        return func(*args, **kwargs)
    return wrapper`,
        question: {
          en: 'What Python design pattern allows wrapping functions dynamically as shown above?',
          ar: 'ما اسم نمط التصميم في بايثون المستخدم لتغليف وتوسيع سلوك الدوال كما في المثال أعلاه؟'
        },
        options: [
          { en: 'Decorators (@decorator)', ar: 'المزخرفات (Decorators)' },
          { en: 'Abstract Factory', ar: 'المصنع المجرد (Abstract Factory)' },
          { en: 'Singleton Pattern', ar: 'النمط الفردي (Singleton)' },
          { en: 'Observer Pattern', ar: 'نمط المراقب (Observer)' }
        ],
        correctAnswer: 0,
        explanation: {
          en: 'Decorators take a function as input, enhance its behavior through a closure wrapper, and return a new callable object without altering the original function code.',
          ar: 'المزخرفات (Decorators) تأخذ دالة كمدخل وتغلفها بدالة جديدة لإضافة وظائف مثل التوقيت أو فحص الصلاحيات دون المساس بجوهر الدالة.'
        }
      },
      {
        id: 'qp5',
        type: 'mcq',
        question: {
          en: 'Which Python standard library module is used to safely parse and execute command-line arguments in scripts?',
          ar: 'أي مكتبة قياسية في بايثون تُستخدم لتنظيم واستقبال مدخلات سطر الأوامر (CLI Arguments) باحترافية؟'
        },
        options: [
          { en: 'argparse', ar: 'argparse' },
          { en: 'pickle', ar: 'pickle' },
          { en: 'math', ar: 'math' },
          { en: 'ctypes', ar: 'ctypes' }
        ],
        correctAnswer: 0,
        explanation: {
          en: '`argparse` is the built-in standard module for writing user-friendly command-line interfaces with flags, help screens, and type validations.',
          ar: 'مكتبة `argparse` هي الأداة القياسية في بايثون لإنشاء واجهات سطر أوامر تفاعلية تدعم الخيارات والمساعدة التلقائية.'
        }
      }
    ]
  }
};

/**
 * Returns a quiz for a given course or builds a smart dynamic fallback
 */
export function getQuizForCourse(courseId: string, courseTitle?: string, category?: string): CourseQuiz {
  const normalizedId = courseId.toLowerCase();
  
  // Direct match
  for (const key of Object.keys(COURSE_QUIZZES)) {
    if (normalizedId.includes(key) || (category && category.toLowerCase().includes(key))) {
      return COURSE_QUIZZES[key];
    }
  }

  // Fallback dynamic quiz for custom or new courses
  const nameEn = courseTitle || 'Technical Course';
  const nameAr = courseTitle || 'المسار التعليمي';

  return {
    id: `quiz-${courseId}`,
    courseId: courseId,
    title: {
      en: `${nameEn} Mastery & Comprehension Exam`,
      ar: `اختبار التحصيل والكفاءة لمسار: ${nameAr}`
    },
    description: {
      en: 'Demonstrate your solid comprehension of the foundational concepts and practical implementations covered in this course.',
      ar: 'أثبت استيعابك العميق للمفاهيم الأساسية والتطبيقات العملية المشروحة في هذا المسار قبل إصدار الشهادة.'
    },
    passingScore: 70,
    xpReward: 100,
    questions: [
      {
        id: 'qd1',
        type: 'mcq',
        question: {
          en: `What is the most critical best-practice when deploying solutions built in ${nameEn}?`,
          ar: `ما هي أفضل ممارسة أساسية عند نشر الحلول البرمجية والأنظمة المتعلقة بـ ${nameAr}؟`
        },
        options: [
          { en: 'Automated testing, continuous integration, and principle of least privilege', ar: 'الفحص الآلي المستمر، التكامل المستمر، ومبدأ الحد الأدنى من الصلاحيات' },
          { en: 'Hardcoding production secrets in configuration files for speed', ar: 'كتابة المفاتيح السرية مباشرة في ملفات الإعداد لزيادة السرعة' },
          { en: 'Disabling logging to conserve disk space', ar: 'إيقاف سجلات النظام بالكامل لتوفير مساحة التخزين' },
          { en: 'Deploying directly to production servers manually on Fridays', ar: 'رفع التعديلات مباشرة للخادم يدوياً دون تجربة' }
        ],
        correctAnswer: 0,
        explanation: {
          en: 'Robust production environments rely on automated validation pipelines, rigorous security hardening, and zero hardcoded credentials.',
          ar: 'البيئات الاحترافية تعتمد دائماً على الاختبارات الآلية المستمرة وتطبيق معايير الأمان ومبدأ أقل صلاحيات ممكنة.'
        }
      },
      {
        id: 'qd2',
        type: 'mcq',
        question: {
          en: 'Why is systematic error handling and structured logging essential in production systems?',
          ar: 'لماذا يُعد التعامل المنظم مع الأخطاء وتسجيل السجلات (Structured Logging) أمراً جوهرياً في الأنظمة الحية؟'
        },
        options: [
          { en: 'Enables rapid root-cause diagnosis, observability, and graceful failure recovery', ar: 'يتيح المراقبة الحية والتشخيص السريع لأسباب الأعطال والتعافي السلس' },
          { en: 'Increases the byte size of application binaries', ar: 'يزيد من حجم حزم التطبيق البرمجية' },
          { en: 'Stops the application from throwing any exceptions altogether', ar: 'يمنع التطبيق من مواجهة أي أخطاء نهائياً' },
          { en: 'Replaces the need for writing unit tests', ar: 'يغني عن كتابة اختبارات الوحدة البرمجية' }
        ],
        correctAnswer: 0,
        explanation: {
          en: 'Observability and graceful handling ensure high uptime and give engineers actionable diagnostics during incidents.',
          ar: 'توفر المراقبة والسجلات الشاملة رؤية واضحة للمهندسين لحل المشاكل قبل أن تؤثر على تجربة المستخدمين.'
        }
      },
      {
        id: 'qd3',
        type: 'mcq',
        question: {
          en: 'In software architecture, what does the principle of "Separation of Concerns" (SoC) achieve?',
          ar: 'في هندسة البرمجيات، ما الهدف الأسمى من مبدأ "فصل الاهتمامات" (Separation of Concerns)؟'
        },
        options: [
          { en: 'Modularity, easier maintenance, and decoupled testable code units', ar: 'بناء كود نمطي يسهل صيانته واختباره بمعزل عن باقي الأجزاء' },
          { en: 'Merging database queries directly into user interface templates', ar: 'دمج استعلامات قواعد البيانات مباشرة داخل قوالب واجهة المستخدم' },
          { en: 'Ensuring all code is written in a single massive file', ar: 'ضمان كتابة الكود كاملاً في ملف واحد ضخم' },
          { en: 'Avoiding version control systems like Git', ar: 'تجنب استخدام أنظمة إدارة الإصدارات مثل Git' }
        ],
        correctAnswer: 0,
        explanation: {
          en: 'Separating concerns keeps business logic, presentation, and data persistence modular and independently maintainable.',
          ar: 'فصل منطق العمل عن واجهة المستخدم وقواعد البيانات يجعل المشروع قابلاً للتوسع والصيانة السريعة.'
        }
      },
      {
        id: 'qd4',
        type: 'mcq',
        question: {
          en: 'What is the primary role of asynchronous execution and non-blocking I/O?',
          ar: 'ما هو الدور الأساسي للعمليات غير المتزامنة (Asynchronous Execution) وتجنب الحظر (Non-blocking I/O)؟'
        },
        options: [
          { en: 'Preventing the main execution thread from freezing during long-running tasks', ar: 'منع تجمد واجهة المستخدم أو خيط المعالجة الرئيسي أثناء العمليات الطويلة' },
          { en: 'Making network requests intentionally slower', ar: 'إبطاء طلبات الشبكة عمداً لتقليل الضغط' },
          { en: 'Guaranteeing that data is never cached on client devices', ar: 'ضمان عدم تخزين البيانات مؤقتاً في جهاز العميل' },
          { en: 'Bypassing firewall authentication restrictions', ar: 'تخطي قيود جدران الحماية النارية' }
        ],
        correctAnswer: 0,
        explanation: {
          en: 'Non-blocking I/O ensures fluid user interfaces and high-concurrency servers by delegating background work without holding the CPU idle.',
          ar: 'تضمن المعالجة غير المتزامنة استجابة الواجهة وسرعة السيرفر عند التعامل مع استعلامات الشبكة والملفات.'
        }
      },
      {
        id: 'qd5',
        type: 'mcq',
        question: {
          en: 'Before a student qualifies for graduation or certified credentialing in this path, what must they demonstrate?',
          ar: 'قبل أن يتأهل الطالب للحصول على الشهادة المعتمدة في هذا المسار، ما الذي ينبغي عليه إثباته؟'
        },
        options: [
          { en: 'Applied practical comprehension and ability to solve real-world problems', ar: 'الفهم العملي التطبيقي والقدرة على حل المشكلات التقنية الحقيقية' },
          { en: 'Memorizing arbitrary syntax without understanding principles', ar: 'حفظ النصوص البرمجية غيباً دون فهم أسس عملها' },
          { en: 'Relying exclusively on copy-pasting unverified snippets', ar: 'الاعتماد على نسخ ولصق الأكواد دون تمحيص' },
          { en: 'Skipping security validations during system design', ar: 'تجاهل معايير الأمان أثناء تصميم الأنظمة' }
        ],
        correctAnswer: 0,
        explanation: {
          en: 'SkillIQ certifications represent proven competency, disciplined technical execution, and foundational understanding.',
          ar: 'تمثل شهادات SkillIQ إثباتاً لجدارة الطالب وفهمه العملي وقدرته على المساهمة في مشاريع واقعية.'
        }
      }
    ]
  };
}

/**
 * Returns a consistent document ID for a course or specific video quiz
 */
export function getQuizDocId(courseId: string, videoId?: string): string {
  if (videoId && videoId.trim()) {
    return `${courseId}__video__${videoId.trim()}`;
  }
  return courseId.trim();
}

/**
 * Fetches a custom quiz saved by Admin in Firestore
 */
export async function fetchCustomQuiz(courseId: string, videoId?: string): Promise<CourseQuiz | null> {
  try {
    const docId = getQuizDocId(courseId, videoId);
    const snap = await getDoc(doc(db, 'course_quizzes', docId));
    if (snap.exists()) {
      return snap.data() as CourseQuiz;
    }
    // If videoId was specified but not found, also check legacy key format
    if (videoId) {
      const legacySnap = await getDoc(doc(db, 'course_quizzes', `${courseId}_${videoId}`));
      if (legacySnap.exists()) {
        return legacySnap.data() as CourseQuiz;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch custom quiz from Firestore:', err);
  }
  return null;
}

/**
 * Saves or updates a custom quiz created by Admin in Firestore
 */
export async function saveCustomQuiz(quiz: CourseQuiz): Promise<void> {
  const docId = getQuizDocId(quiz.courseId, quiz.videoId);
  const data: CourseQuiz = {
    ...quiz,
    id: docId,
    updatedAt: Date.now()
  };
  await setDoc(doc(db, 'course_quizzes', docId), JSON.parse(JSON.stringify(data)));
}

/**
 * Deletes a custom quiz from Firestore
 */
export async function deleteCustomQuiz(docId: string): Promise<void> {
  await deleteDoc(doc(db, 'course_quizzes', docId));
}

/**
 * Fetches all custom quizzes stored in Firestore for Admin panel
 */
export async function fetchAllCustomQuizzes(): Promise<CourseQuiz[]> {
  try {
    const snap = await getDocs(collection(db, 'course_quizzes'));
    return snap.docs.map(d => d.data() as CourseQuiz);
  } catch (err) {
    console.warn('Error fetching all quizzes:', err);
    return [];
  }
}

/**
 * Loads the active quiz with smart cascading fallback:
 * 1. Admin custom quiz for specific video (if videoId provided)
 * 2. Admin custom quiz for course
 * 3. Static default quiz for category or course title
 */
export async function loadQuizWithFallback(
  courseId: string,
  videoId?: string,
  courseTitle?: string,
  category?: string
): Promise<CourseQuiz> {
  // 1. Try video-specific quiz
  if (videoId) {
    const videoQuiz = await fetchCustomQuiz(courseId, videoId);
    if (videoQuiz && videoQuiz.questions && videoQuiz.questions.length > 0) {
      return videoQuiz;
    }
  }

  // 2. Try course-level custom quiz
  const courseQuiz = await fetchCustomQuiz(courseId);
  if (courseQuiz && courseQuiz.questions && courseQuiz.questions.length > 0) {
    return courseQuiz;
  }

  // 3. Static fallback
  return getQuizForCourse(courseId, courseTitle, category);
}
