export interface Flashcard {
  id: string;
  category: 'linux' | 'security' | 'web' | 'networking';
  question: {
    en: string;
    ar: string;
  };
  answer: {
    en: string;
    ar: string;
  };
  codeSnippet?: string;
  keyTakeaway: {
    en: string;
    ar: string;
  };
  difficulty: 'easy' | 'medium' | 'hard';
}

export const FLASHCARD_DECKS: Flashcard[] = [
  // 1. Linux & System Engineering
  {
    id: 'fc-linux-chmod',
    category: 'linux',
    question: {
      en: 'What does the numeric permission `chmod 754 filename` grant to User, Group, and Others?',
      ar: 'ما هي الصلاحيات التي يمنحها الأمر `chmod 754 filename` لكل من المالك، المجموعة، والآخرين؟'
    },
    codeSnippet: 'chmod 754 deploy.sh',
    answer: {
      en: 'User: 7 (rwx = Read, Write, Execute)\nGroup: 5 (r-x = Read, Execute)\nOthers: 4 (r-- = Read only)',
      ar: 'المالك (User): 7 (قراءة وكتابة وتنفيذ rwx)\nالمجموعة (Group): 5 (قراءة وتنفيذ r-x)\nالآخرون (Others): 4 (قراءة فقط r--)'
    },
    keyTakeaway: {
      en: 'Values: 4 = Read, 2 = Write, 1 = Execute. Sum them up for each scope.',
      ar: 'القيم: 4 للقراءة، 2 للكتابة، 1 للتنفيذ. اجمع القيم لكل فئة.'
    },
    difficulty: 'easy'
  },
  {
    id: 'fc-linux-grep',
    category: 'linux',
    question: {
      en: 'How do you recursively search for a string across all files while ignoring case in Linux?',
      ar: 'كيف تبحث تكرارياً (Recursively) عن نص في جميع الملفات مع تجاهل حالة الأحرف في لينكس؟'
    },
    codeSnippet: 'grep -rni "DB_PASSWORD" /etc/',
    answer: {
      en: 'Use `grep -rni "pattern" /path`\n-r = recursive\n-n = display line numbers\n-i = case insensitive',
      ar: 'باستخدام `grep -rni "pattern" /path`\nحيث -r تعني تكرارياً في المجلدات، -n لعرض أرقام الأسطر، و -i لتجاهل حالة الأحرف.'
    },
    keyTakeaway: {
      en: 'Combine flags `-rni` for fast auditing of logs and configuration directories.',
      ar: 'دمج الخيارات `-rni` يسرع فحص السجلات وملفات الإعدادات.'
    },
    difficulty: 'easy'
  },
  {
    id: 'fc-linux-systemctl',
    category: 'linux',
    question: {
      en: 'What command checks recent real-time logs for a specific systemd service (e.g. nginx)?',
      ar: 'ما هو الأمر الذي يعرض السجلات الحية الفورية لخدمة systemd معينة (مثل nginx)؟'
    },
    codeSnippet: 'journalctl -u nginx -f -n 50',
    answer: {
      en: '`journalctl -u nginx -f`\n-u filters by unit name, and `-f` follows logs in real-time like `tail -f`.',
      ar: '`journalctl -u nginx -f`\nحيث -u تحدد اسم الخدمة، و-f للمتابعة المباشرة لحظياً مثل tail -f.'
    },
    keyTakeaway: {
      en: 'Add `-n 50` to review the previous 50 log lines before streaming.',
      ar: 'أضف `-n 50` لعرض آخر 50 سطراً قبل بدء المتابعة الحية.'
    },
    difficulty: 'medium'
  },
  {
    id: 'fc-linux-tar',
    category: 'linux',
    question: {
      en: 'How do you extract a compressed `.tar.gz` archive to a specific directory in terminal?',
      ar: 'كيف تفك ضغط أرشيف مضغوط بصيغة `.tar.gz` إلى مسار مجلد محدد في الطرفية؟'
    },
    codeSnippet: 'tar -xzvf archive.tar.gz -C /opt/app/',
    answer: {
      en: '`tar -xzvf archive.tar.gz -C /target/dir/`\nx = extract, z = gzip, v = verbose, f = file, -C = target path.',
      ar: '`tar -xzvf archive.tar.gz -C /target/dir/`\nحيث x فك، z دعم gzip، و-C تحديد مجلد الوجهة.'
    },
    keyTakeaway: {
      en: '-C (capital C) changes the destination directory before extracting.',
      ar: 'الخيار -C (حرف كبير) يغير المجلد المستهدف قبل البدء بالاستخراج.'
    },
    difficulty: 'easy'
  },
  // NEW 1: Linux find with exec
  {
    id: 'fc-linux-find-exec',
    category: 'linux',
    question: {
      en: 'How do you find all `.log` files older than 30 days and delete them automatically in Linux?',
      ar: 'كيف تبحث عن جميع ملفات `.log` التي مر عليها أكثر من 30 يوماً وتقوم بحذفها تلقائياً في لينكس؟'
    },
    codeSnippet: 'find /var/log -type f -name "*.log" -mtime +30 -exec rm -f {} \\;',
    answer: {
      en: '`find /var/log -type f -name "*.log" -mtime +30 -exec rm -f {} \\;`\n`-type f`: matches regular files.\n`-mtime +30`: modified more than 30 days ago.\n`-exec ... {} \\;`: executes the command on each matching file.',
      ar: 'باستخدام الأمر `find /var/log -type f -name "*.log" -mtime +30 -exec rm -f {} \\;`\nحيث `-type f` يحدد الملفات فقط، `-mtime +30` أكثر من 30 يوماً، و`-exec` لتنفيذ أمر الحذف على كل ملف مطابق.'
    },
    keyTakeaway: {
      en: 'Always run `find` without `-exec rm` first to preview the matched files safely.',
      ar: 'شغّل الأمر أولاً بدون `-exec rm` لمعاينة قائمة الملفات بأمان قبل تنفيذ الحذف.'
    },
    difficulty: 'medium'
  },
  // NEW 2: Linux SSH Keygen & Permissions
  {
    id: 'fc-linux-ssh-permissions',
    category: 'linux',
    question: {
      en: 'Why does SSH client reject a private key with error "Permissions 0644 are too open"? What exact permission must it have?',
      ar: 'لماذا يرفض عميل SSH المفتاح الخاص برسالة "Permissions 0644 are too open"؟ وما هو التصريح الدقيق المطلوب؟'
    },
    codeSnippet: 'chmod 600 ~/.ssh/id_rsa && chmod 700 ~/.ssh',
    answer: {
      en: 'SSH enforces that private keys must only be readable by their owner. If group or world can read it, SSH refuses connection to prevent key theft.\n\nRequired: `chmod 600 ~/.ssh/id_rsa` (rw-------) and `chmod 700 ~/.ssh` (rwx------).',
      ar: 'يفرض بروتوكول SSH ألا يتمكن أي مستخدم آخر من قراءة المفتاح الخاص لمنع سرقته. لذلك يرفض الاتصال إذا كانت الصلاحيات تتيح القراءة للمجموعة أو العامة.\n\nالصلاحية المطلوبة: `chmod 600 ~/.ssh/id_rsa` (قراءة وكتابة للمالك فقط).'
    },
    keyTakeaway: {
      en: 'Private keys require 600; the .ssh folder itself requires 700.',
      ar: 'المفتاح الخاص يحتاج 600؛ ومجلد .ssh نفسه يحتاج 700.'
    },
    difficulty: 'medium'
  },

  // 2. OWASP Top 10 & Cybersecurity
  {
    id: 'fc-sec-idor',
    category: 'security',
    question: {
      en: 'What is IDOR (Insecure Direct Object Reference) and how is it properly prevented?',
      ar: 'ما هي ثغرة المرجع المباشر غير الآمن للكائنات (IDOR) وكيف يتم التصدي لها بشكل صحيح؟'
    },
    codeSnippet: 'GET /api/reports/9401 HTTP/1.1\nCookie: session_user=user_204',
    answer: {
      en: 'IDOR occurs when an application exposes a direct database ID in endpoints without verifying that the currently authenticated user owns or has authorization to access that specific entity.\n\nMitigation: Always check server-side authorization (e.g. `report.ownerId === currentUser.id`) or use unpredictable UUIDs paired with strict RBAC.',
      ar: 'تحدث ثغرة IDOR عندما يعتمد النظام على رقم المعرّف (ID) القادم من المستخدم دون التحقق في السيرفر من ملكيته لهذا السجل.\n\nالحل: التحقق الإلزامي من صلاحيات المستخدم في السيرفر (مثل report.userId === req.user.id) قبل إرجاع البيانات.'
    },
    keyTakeaway: {
      en: 'Never trust IDs sent from client payloads without server-side ownership checks.',
      ar: 'لا تثق أبداً في معرّفات الكائنات المرسلة من المتصفح دون تحقق السيرفر من الملكية.'
    },
    difficulty: 'hard'
  },
  {
    id: 'fc-sec-xss',
    category: 'security',
    question: {
      en: 'What is the distinction between Stored XSS and Reflected XSS?',
      ar: 'ما الفرق الجوهري بين ثغرة XSS المخزنة (Stored) وXSS المنعكسة (Reflected)؟'
    },
    answer: {
      en: 'Stored XSS: The malicious script is permanently stored in the database (e.g. comment or profile bio) and executed for every user who visits.\n\nReflected XSS: The script is injected via URL parameter or form and immediately reflected back in the single response without being saved permanently.',
      ar: 'XSS المخزنة (Stored): يُخزن الكود الخبيث في قاعدة البيانات (مثل تعليق أو اسم مستخدم) ويُنفذ في متصفح أي زائر للصفحة.\n\nXSS المنعكسة (Reflected): يُمرر الكود عبر رابط URL أو بحث، وينعكس فوراً في الاستجابة اللحظية دون تخزين دائم.'
    },
    keyTakeaway: {
      en: 'Stored XSS is higher impact because it infects all subsequent visitors silently.',
      ar: 'XSS المخزنة أعلى خطورة لأنها تستهدف كافة زوار الموقع تلقائياً.'
    },
    difficulty: 'medium'
  },
  {
    id: 'fc-sec-sqli',
    category: 'security',
    question: {
      en: 'Why do ORMs and Parameterized Queries prevent SQL Injection fundamentally?',
      ar: 'لماذا تمنع الاستعلامات المجهزة (Parameterized Queries) ومكتبات ORM ثغرات SQLi بشكل جذري؟'
    },
    codeSnippet: '// Vulnerable:\nconst q = "SELECT * FROM users WHERE email = \'" + input + "\'";\n\n// Secure:\nconst q = "SELECT * FROM users WHERE email = ?"; db.query(q, [input]);',
    answer: {
      en: 'Parameterized queries compile the SQL statement structure first. The database engine guarantees that user parameters are treated strictly as data constants (strings/numbers), never executable SQL tokens or grammar.',
      ar: 'تُرسل الاستعلامات المجهزة هيكل الاستعلام أولاً إلى محرك قاعدة البيانات، وتضمن أن مدخلات المستخدم تُعامل حصراً كقيم نصية بحتة، ولا يمكن لمترجم SQL اعتبارها أوامر قابلة للتنفيذ.'
    },
    keyTakeaway: {
      en: 'Input sanitization regexes fail; structural parameter binding never fails.',
      ar: 'تصفية النصوص بالـ Regex قد تفشل، بينما الفصل الهيكلي بين الكود والبيانات آمن 100%.'
    },
    difficulty: 'medium'
  },
  {
    id: 'fc-sec-csrf',
    category: 'security',
    question: {
      en: 'How does the `SameSite=Lax` or `SameSite=Strict` cookie attribute combat CSRF?',
      ar: 'كيف تحمي خاصية الكوكيز `SameSite=Lax` أو `Strict` المواقع من هجمات CSRF؟'
    },
    answer: {
      en: 'It tells the browser not to send authentication cookies with cross-site requests (e.g., when an external evil site triggers a POST request to your bank). In Strict mode, cookies are omitted on all cross-origin navigations.',
      ar: 'تمنع المتصفح من إرسال كوكيز الجلسة مع الطلبات القادمة من مواقع خارجية أخرى (مثل رابط خبيث ينفذ طلباً لحسابك البنكي)، مما يبطل مفعول هجوم CSRF كلياً.'
    },
    keyTakeaway: {
      en: 'Pair `SameSite=Lax` cookies with anti-CSRF tokens for defense-in-depth on state-changing actions.',
      ar: 'اجمع بين كوكيز `SameSite=Lax` ورموز CSRF Tokens لحماية مضاعفة في العمليات الحساسة.'
    },
    difficulty: 'medium'
  },
  // NEW 3: SSRF & Cloud Metadata Protection
  {
    id: 'fc-sec-ssrf',
    category: 'security',
    question: {
      en: 'What is SSRF (Server-Side Request Forgery) and why is IP 169.254.169.254 critical in cloud attacks?',
      ar: 'ما هي ثغرة SSRF ولماذا يُعتبر العنوان 169.254.169.254 هدفاً رئيسياً في اختراق بيئات السحاب (Cloud)؟'
    },
    codeSnippet: 'POST /api/fetch-preview\n{"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/"}',
    answer: {
      en: 'SSRF occurs when an attacker tricks a backend server into making HTTP requests to internal, non-public endpoints. In AWS, GCP, and Azure, `169.254.169.254` is the Instance Metadata Service (IMDS). Stealing this exposes IAM access keys and temporary session credentials.',
      ar: 'تحدث ثغرة SSRF عندما يخدع المهاجم الخادم الداخلي ليقوم بطلب عناوين شبكية محظورة. في AWS وGCP يمثل 169.254.169.254 خادم بيانات التعريف الداخلي (IMDS) الذي يمنح المهاجم مفاتيح صلاحيات IAM السحابية.'
    },
    keyTakeaway: {
      en: 'Enforce IMDSv2 (session tokens required) and strictly validate/whitelist outgoing URLs at backend firewalls.',
      ar: 'فرض بروتوكول IMDSv2 واستخدام قوائم السماح (Whitelisting) لعناوين النطاقات الخارجية فقط.'
    },
    difficulty: 'hard'
  },
  // NEW 4: JWT None Algorithm & Signature Verification
  {
    id: 'fc-sec-jwt-none',
    category: 'security',
    question: {
      en: 'What is the "alg: none" vulnerability in JSON Web Tokens (JWT)?',
      ar: 'ما هي ثغرة "alg: none" الخطيرة في توثيق رموز JSON Web Tokens (JWT)؟'
    },
    codeSnippet: '{"alg": "none", "typ": "JWT"}.{"user": "admin", "role": "superadmin"}.[empty]',
    answer: {
      en: 'The JWT specification permits unsigned tokens when the header contains `"alg": "none"`. If vulnerable backend verification libraries blindly accept this algorithm, an attacker can tamper with claims (elevating role to "superadmin") and omit the signature entirely.',
      ar: 'تسمح مواصفات JWT التنازلية بقبول الرموز غير الموقعة إذا كانت ترويسة الخوارزمية "none". وإذا كانت المكتبة البرمجية في الخادم غير محصنة، يمكن للمهاجم تعديل بياناته إلى مدير بدون توقيع.'
    },
    keyTakeaway: {
      en: 'Hardcode allowed algorithms on the server (e.g. `algorithms: ["RS256"]`) and reject unverified tokens.',
      ar: 'حدد خوارزمية التوقيع في السيرفر بشكل صارم (مثل RS256) ولا تعتمد أبداً على ما يرسله العميل في الترويسة.'
    },
    difficulty: 'hard'
  },

  // 3. Web Engineering & Frontend
  {
    id: 'fc-web-closure',
    category: 'web',
    question: {
      en: 'What is a JavaScript Closure, and where is it commonly applied in real applications?',
      ar: 'ما هو الإغلاق (Closure) في JavaScript، وأين يُستخدم عملياً في التطبيقات الحقيقية؟'
    },
    codeSnippet: `function createCounter() {
  let count = 0;
  return () => ++count;
}
const counter = createCounter();`,
    answer: {
      en: 'A closure is the combination of a function bundled together with references to its lexical environment. It allows an inner function to access variables from its outer enclosing scope even after the outer function has finished executing.\n\nUse cases: Private variables, memoization, event factories, React hooks.',
      ar: 'الإغلاق هو دالة تحتفظ بالوصول إلى المتغيرات الموجودة في النطاق الخارجي (Lexical Scope) الذي ولدت فيه، حتى بعد انتهاء تنفيذ الدالة الخارجية.\n\nاستخداماته: حماية المتغيرات الخاصة (Data Privacy)، التخزين المؤقت، وهواك رياكت.'
    },
    keyTakeaway: {
      en: 'Closures preserve memory state across sequential invocations without polluting global scope.',
      ar: 'تحفظ الإغلاقات حالة المتغيرات عبر الاستدعاءات المتكررة دون تلويث النطاق العام.'
    },
    difficulty: 'medium'
  },
  {
    id: 'fc-web-eventloop',
    category: 'web',
    question: {
      en: 'What is the priority difference between Microtasks and Macrotasks in the browser event loop?',
      ar: 'ما الفرق في أولوية التنفيذ بين المهام المجهرية (Microtasks) والمهام الكبرى (Macrotasks)؟'
    },
    answer: {
      en: 'Microtasks (Promise callbacks, `queueMicrotask`, MutationObserver) have higher priority. The engine completely exhausts the entire microtask queue before rendering or picking the next macrotask (`setTimeout`, `setInterval`, I/O).',
      ar: 'المهام المجهرية Microtasks (مثل وعود Promise وMutationObserver) لها الأولوية القصوى. يقوم المحرك بتفريغ طابور المايكرو بالكامل قبل الانتقال لتنفيذ مهام Macrotasks (مثل setTimeout وsetInterval).'
    },
    keyTakeaway: {
      en: 'A recurring infinite microtask loop will freeze the browser and starve all rendering.',
      ar: 'توليد microtasks لانهائية سيؤدي لتجمد متصفح المستخدم كلياً ومنع إعادة الرسم.'
    },
    difficulty: 'hard'
  },
  {
    id: 'fc-web-cors',
    category: 'web',
    question: {
      en: 'Why do browsers send an HTTP `OPTIONS` preflight request before certain cross-origin API calls?',
      ar: 'لماذا يرسل المتصفح طلب `OPTIONS` استباقي (Preflight) قبل إرسال بعض طلبات API الخارجية؟'
    },
    answer: {
      en: 'To verify with the server whether the cross-origin request is permitted (checking allowed HTTP methods, custom headers like `Authorization`, or JSON content-types) before sending the actual potentially destructive payload.',
      ar: 'للتحقق مسبقاً من الخادم عما إذا كان يسمح بالطلب (فحص الدوال المسموحة، الترويسات الخاصة مثل Authorization، ونوع المحتوى) لحماية الخوادم القديمة من استقبال طلبات غير معتمدة.'
    },
    keyTakeaway: {
      en: 'Preflight is skipped only for "simple" requests (GET/HEAD/POST with basic standard headers).',
      ar: 'لا يُرسل الـ Preflight فقط مع الطلبات البسيطة (مثل GET القياسي بدون ترويسات خاصة).'
    },
    difficulty: 'medium'
  },
  // NEW 5: Debounce vs Throttle
  {
    id: 'fc-web-debounce-throttle',
    category: 'web',
    question: {
      en: 'What is the exact functional difference between Debounce and Throttle in frontend development?',
      ar: 'ما الفرق الوظيفي الدقيق بين تقنية Debounce وتقنية Throttle في تطوير الواجهات الأمامية؟'
    },
    codeSnippet: `// Debounce: Wait until typing stops for 300ms
const onSearch = debounce(fetchResults, 300);

// Throttle: Execute at most once every 100ms
const onScroll = throttle(updatePosition, 100);`,
    answer: {
      en: 'Debounce: Postpones execution until a specified delay has elapsed since the last time the event was triggered (ideal for search input autocomplete).\n\nThrottle: Guarantees execution at a regular fixed interval at most once per timeframe (ideal for window resize, scroll tracking, drag events).',
      ar: 'Debounce: يؤجل التنفيذ حتى يتوقف المستخدم عن التفاعل لمدة محددة (مثالي لشريط البحث التلقائي أثناء الكتابة).\n\nThrottle: يضمن تنفيذ الدالة بمعدل زمني ثابت ومحدد بحد أقصى مرة واحدة في الفترة (مثالي لمتابعة التمرير Scroll وتغيير حجم الشاشة).'
    },
    keyTakeaway: {
      en: 'Debounce waits for silence; Throttle regulates a steady heartbeat.',
      ar: 'الـ Debounce ينتظر الهدوء؛ والـ Throttle يضبط نبضاً دورياً مستمراً.'
    },
    difficulty: 'medium'
  },
  // NEW 6: React useMemo vs useCallback
  {
    id: 'fc-web-memo-callback',
    category: 'web',
    question: {
      en: 'What is the distinction between `useMemo` and `useCallback` in React?',
      ar: 'ما الفرق الجوهري بين الهوك `useMemo` والهوك `useCallback` في React؟'
    },
    codeSnippet: `const memoizedValue = useMemo(() => computeHeavyData(items), [items]);
const memoizedCallback = useCallback(() => handleClick(id), [id]);`,
    answer: {
      en: '`useMemo` caches the RESULT of calling a calculation function. It only recomputes when dependencies change.\n\n`useCallback` caches the FUNCTION DEFINITION itself to preserve referential equality when passing callbacks to memoized child components.',
      ar: '`useMemo` يقوم بتخزين القيمة الناتجة عن عملية حسابية مكلفة لتجنب تكرار الحساب.\n\n`useCallback` يقوم بتخزين مرجع الدالة نفسها (Function Reference) لمنع إعادة رسم المكونات الفرعية غير الضرورية.'
    },
    keyTakeaway: {
      en: '`useCallback(fn, deps)` is mathematically equivalent to `useMemo(() => fn, deps)`.',
      ar: 'الهوك `useCallback(fn, deps)` يكافئ تماماً `useMemo(() => fn, deps)`.'
    },
    difficulty: 'easy'
  },

  // 4. Networking & Protocols
  {
    id: 'fc-net-tcp-udp',
    category: 'networking',
    question: {
      en: 'When should an architecture choose UDP over TCP?',
      ar: 'متى ينبغي على مهندس النظم اختيار بروتوكول UDP بدلاً من TCP؟'
    },
    answer: {
      en: 'When low latency and real-time streaming are prioritized over guaranteed packet delivery. Examples: Online gaming, live VoIP calls, video streaming, DNS lookups. TCP retransmission delay would ruin live audio/video flow.',
      ar: 'عندما تكون السرعة الفائقة والزمن المنخفض أهم من ضمان وصول كل حزمة بدون فقدان. مثل: الألعاب التنافسية أونلاين، المكالمات الصوتية المباشرة (VoIP)، وبث الفيديو الحي.'
    },
    keyTakeaway: {
      en: 'UDP has no handshake, no acknowledgments, and no retransmission delays.',
      ar: 'بروتوكول UDP عديم الاتصال ولا ينتظر تأكيد الاستلام، مما يجعله فائق السرعة.'
    },
    difficulty: 'easy'
  },
  {
    id: 'fc-net-dns',
    category: 'networking',
    question: {
      en: 'What are the 4 primary DNS servers queried during domain resolution?',
      ar: 'ما هي الخوادم الأربعة الرئيسية التي يتم استعلامها بالترتيب لحل عنوان النطاق (DNS)؟'
    },
    answer: {
      en: '1. DNS Recursive Resolver (ISP or 1.1.1.1 / 8.8.8.8)\n2. Root Nameserver (. )\n3. TLD Nameserver (.com / .org)\n4. Authoritative Nameserver (holds the actual A/AAAA record)',
      ar: '1. خادم التكرار المحلي (DNS Recursive Resolver)\n2. خوادم الجذر (Root Nameservers)\n3. خوادم النطاق الأعلى (TLD Nameservers مثل .com)\n4. خادم الأسماء المعتمد (Authoritative Nameserver الحامل لسجل IP الفعلي)'
    },
    keyTakeaway: {
      en: 'TTL (Time to Live) governs how long intermediate resolvers cache the authoritative response.',
      ar: 'تحدد قيمة TTL مدة صلاحية تخزين عنوان الـ IP مؤقتاً قبل تكرار الاستعلام.'
    },
    difficulty: 'medium'
  },
  {
    id: 'fc-net-cidr',
    category: 'networking',
    question: {
      en: 'How many usable host IP addresses are available in a `/24` subnet and a `/28` subnet?',
      ar: 'كم عدد عناوين الأجهزة المتاحة للاستخدام الفعلي في شبكة فرعية `/24` وشبكة `/28`؟'
    },
    answer: {
      en: 'Formula: 2^(32 - prefix) - 2 (subtract Network ID and Broadcast IP).\n- `/24`: 2^8 - 2 = 254 usable IPs.\n- `/28`: 2^4 - 2 = 14 usable IPs.',
      ar: 'المعادلة: 2 مرفوعة لأس (32 ناقص البادئة) ناقص 2 (لحجز عنوان الشبكة والبث العام).\n- شبكة `/24`: 256 - 2 = 254 جهاز متاح.\n- شبكة `/28`: 16 - 2 = 14 جهاز متاح.'
    },
    keyTakeaway: {
      en: 'Always subtract 2 from total addresses for the Network address and Broadcast address.',
      ar: 'اطرح دائماً 2 من إجمالي العناوين لحجز عنوان الشبكة وعنوان البث العام.'
    },
    difficulty: 'medium'
  },
  // NEW 7: TLS 1.3 vs TLS 1.2 Handshake Latency
  {
    id: 'fc-net-tls13',
    category: 'networking',
    question: {
      en: 'How does TLS 1.3 reduce handshake latency compared to TLS 1.2?',
      ar: 'كيف يقلل بروتوكول TLS 1.3 من زمن تأخير المصافحة (Latency) مقارنة بـ TLS 1.2؟'
    },
    answer: {
      en: 'TLS 1.2 required 2 round-trips (2-RTT) to establish secure encryption. TLS 1.3 combines key exchange with the cipher proposal into a single round-trip (1-RTT), and supports 0-RTT (Zero Round Trip Time) resumption for previously visited hosts.',
      ar: 'كان TLS 1.2 يتطلب رحلتين ذهاب وإياب (2-RTT) لتبادل المفاتيح وتفعيل التشفير. قام TLS 1.3 بدمج تبادل المفاتيح ليتم في رحلة واحدة (1-RTT)، كما يدعم ميزة 0-RTT لاستئناف الاتصال الفوري مع الخوادم التي زرتها مسبقاً.'
    },
    keyTakeaway: {
      en: 'TLS 1.3 eliminates obsolete insecure ciphers (RC4, MD5, CBC) and cuts connection setup time in half.',
      ar: 'ألغى TLS 1.3 الخوارزميات الضعيفة القديمة واختصر وقت إنشاء الاتصال الآمن إلى النصف.'
    },
    difficulty: 'hard'
  },
  // NEW 8: MTU & Path MTU Discovery
  {
    id: 'fc-net-mtu',
    category: 'networking',
    question: {
      en: 'What is the standard Ethernet MTU size, and what happens when a packet with the "Don\'t Fragment" (DF) flag exceeds it?',
      ar: 'ما هو حجم MTU القياسي في شبكات الإيثرنت، وماذا يحدث لحزمة تحمل علامة DF وتتجاوز هذا الحجم؟'
    },
    codeSnippet: 'ping -M do -s 1472 8.8.8.8  # 1472 + 28 bytes IP/ICMP header = 1500 MTU',
    answer: {
      en: 'Standard Ethernet MTU is 1500 bytes. If a packet exceeds the MTU and has the DF bit set, routers drop it and send an ICMP Type 3 Code 4 message ("Fragmentation Needed and DF set"), which PMTUD uses to negotiate smaller MSS.',
      ar: 'حجم MTU القياسي هو 1500 بايت. إذا تجاوزت الحزمة هذا الحجم مع تفعيل علامة DF، يقوم الراوتر بإسقاطها وإرسال رسالة ICMP تفيد بالحاجة للتجزئة، ليتعلم المرسل الحجم الأقصى المسموح (Path MTU Discovery).'
    },
    keyTakeaway: {
      en: 'Blocking all ICMP on firewalls breaks Path MTU Discovery, causing "black hole" connection hangs.',
      ar: 'حجب جميع حزم ICMP في جدران الحماية يكسر ميزة PMTUD ويؤدي لتعليق الاتصالات وتوقف تحميل الصفحات.'
    },
    difficulty: 'hard'
  },
  // NEW 9: B-Tree vs Hash Indexing
  {
    id: 'fc-db-btree-hash',
    category: 'linux',
    question: {
      en: 'Why do relational databases (PostgreSQL/MySQL) default to B-Tree indexes instead of Hash indexes?',
      ar: 'لماذا تعتمد قواعد البيانات العلائقية (PostgreSQL/MySQL) على فهارس B-Tree افتراضياً بدلاً من فهارس Hash؟'
    },
    codeSnippet: 'CREATE INDEX idx_users_xp ON users USING btree (xp);',
    answer: {
      en: 'While Hash indexes offer O(1) equality lookup (`WHERE id = 5`), they CANNOT handle range queries (`WHERE xp >= 1000`), pattern matching (`LIKE "abc%"`), or `ORDER BY`. B-Tree maintains balanced sorted order with O(log n) performance for equality, ranges, and sorting.',
      ar: 'فهرس Hash ممتاز للبحث الدقيق O(1) بالقيمة المتطابقة فقط، لكنه عاجز عن البحث بالنطاق (Range Queries مثل `xp >= 100`) والترتيب (`ORDER BY`). بينما B-Tree يوفر بحثاً متوازناً O(log n) ويدعم النطاقات والترتيب والبحث الجزئي بامتياز.'
    },
    keyTakeaway: {
      en: 'B-Tree supports range scans and sorting; Hash indexes only support exact equality checks.',
      ar: 'فهارس B-Tree تدعم النطاقات والترتيب؛ بينما Hash لا يصلح إلا للمطابقة الدقيقة.'
    },
    difficulty: 'medium'
  },
  // NEW 10: Linux Inodes & "No space left on device"
  {
    id: 'fc-linux-inodes',
    category: 'linux',
    question: {
      en: 'Why might a server throw "No space left on device" when `df -h` shows 50% free disk storage?',
      ar: 'لماذا قد يظهر خطأ "No space left on device" بالرغم من أن أمر `df -h` يوضح وجود مساحة حرة 50%؟'
    },
    codeSnippet: 'df -i /var  # Check inode allocation and exhaustion',
    answer: {
      en: 'The filesystem ran out of Inodes (index nodes), not physical byte storage. Every file/directory requires an inode. Millions of tiny cache or session files can exhaust all inodes before consuming disk capacity. Check with `df -i`.',
      ar: 'السبب هو استهلاك كافة معرّفات Inodes في نظام الملفات بالكامل. كل ملف يتطلب Inode، وتراكم ملايين الملفات الصغيرة جداً (مثل الجلسات أو الكاش) يستنفد عدد الـ Inodes المتاحة حتى لو كانت هناك مساحة تخزين شاغرة. افحص بالأمر `df -i`.'
    },
    keyTakeaway: {
      en: 'Filesystems have two independent capacity limits: byte blocks and inode metadata entries.',
      ar: 'نظام الملفات له سعتان مستقلتان: مساحة التخزين بالبايت، وعدد سجلات البيانات الوصفية (Inodes).'
    },
    difficulty: 'hard'
  }
];

export interface FlashcardProgress {
  cardId: string;
  repetitionCount: number;
  lastReviewedAt: string;
  status: 'learning' | 'mastered';
}

const STORAGE_KEY = 'skilliq_flashcards_progress_v1';
const STREAK_KEY = 'skilliq_flashcards_streak_v1';

export function getFlashcardProgress(): Record<string, FlashcardProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveFlashcardResult(cardId: string, gotItRight: boolean): { xpEarned: number; newMasteredCount: number } {
  const current = getFlashcardProgress();
  const existing = current[cardId] || {
    cardId,
    repetitionCount: 0,
    lastReviewedAt: new Date().toISOString(),
    status: 'learning'
  };

  existing.lastReviewedAt = new Date().toISOString();
  let xp = 0;

  if (gotItRight) {
    existing.repetitionCount += 1;
    xp = 5;
    if (existing.repetitionCount >= 3) {
      existing.status = 'mastered';
      xp = 15; // bonus XP on mastery
    }
  } else {
    existing.repetitionCount = Math.max(0, existing.repetitionCount - 1);
    existing.status = 'learning';
  }

  current[cardId] = existing;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(STREAK_KEY, today);
  } catch (err) {
    console.error('Failed to save flashcards:', err);
  }

  const masteredCount = Object.values(current).filter((c: any) => c.status === 'mastered').length;
  return { xpEarned: xp, newMasteredCount: masteredCount };
}
