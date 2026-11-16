import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Terminal,
  Play,
  RotateCcw,
  Code2,
  FileCode,
  Copy,
  Check,
  Sparkles,
  Maximize2,
  Minimize2,
  Database,
  Languages,
  Layers,
  HelpCircle,
  Cpu
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from 'react-i18next';

export type SandboxMode = 'terminal' | 'frontend' | 'python' | 'javascript' | 'sql';

interface CodeTerminalSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: SandboxMode;
}

interface TerminalHistoryItem {
  id: string;
  command: string;
  output: string;
  type?: 'stdout' | 'stderr' | 'system';
}

export const CodeTerminalSandboxModal: React.FC<CodeTerminalSandboxModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'terminal'
}) => {
  const { language, setLanguage } = useStore();
  const { i18n } = useTranslation();
  const isRtl = language === 'ar';

  const [activeTab, setActiveTab] = useState<SandboxMode>(initialMode);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Toggle Language Handler inside Sandbox
  const toggleModalLanguage = () => {
    const nextLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(nextLang);
    i18n.changeLanguage(nextLang);
  };

  // Sync mode ONCE when modal opens - without dependency on activeTab to avoid resetting
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode || 'terminal');
    }
  }, [isOpen]);

  // Terminal State
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<TerminalHistoryItem[]>([
    {
      id: 'init-1',
      command: '',
      output: language === 'ar'
        ? 'الطرفية الأمنية التفاعلية [Linux 6.8.0-audit-x86_64]\nاكتب "help" أو "مساعدة" لعرض جميع أوامر الفحص والتشخيص.'
        : 'SkillIQ Secure Interactive Terminal [Linux 6.8.0-audit-x86_64]\nType "help" to view available diagnostic & cybersecurity commands.',
      type: 'system'
    }
  ]);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);

  // Frontend Sandbox State
  const [htmlCode, setHtmlCode] = useState<string>(
    `<div class="card">\n  <h2>🚀 Welcome to SkillIQ Sandbox</h2>\n  <p>Test your modern UI components, Tailwind/CSS and JS directly in the browser.</p>\n  <button onclick="greet()">Click Me</button>\n</div>\n\n<style>\n  body { font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 90vh; background: #0f172a; color: #f8fafc; }\n  .card { background: #1e293b; padding: 2rem; border-radius: 1.25rem; border: 1px solid #334155; text-align: center; max-width: 360px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }\n  h2 { margin-top: 0; color: #38bdf8; }\n  button { background: #6366f1; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: bold; cursor: pointer; transition: 0.2s; margin-top: 1rem; }\n  button:hover { background: #4f46e5; transform: scale(1.04); }\n</style>\n\n<script>\n  function greet() {\n    alert('SkillIQ interactive event triggered!');\n  }\n</script>`
  );

  // Python Sandbox State
  const [pythonCode, setPythonCode] = useState<string>(
    `# Python Security & Automation Exercise\n# Port Scanner & Service Fingerprinting Simulator\n\ntarget_host = "192.168.1.105"\ncommon_ports = {\n    21: "FTP (File Transfer)",\n    22: "SSH (Secure Shell)",\n    80: "HTTP (Web Server)",\n    443: "HTTPS (Encrypted Web)",\n    3306: "MySQL Database"\n}\n\nprint(f"[*] Initiating vulnerability audit on host: {target_host}")\nprint("-" * 50)\n\nfor port, service in common_ports.items():\n    status = "OPEN" if port in [22, 80, 443] else "FILTERED"\n    print(f"Port {port:5d}/tcp  ->  {service:<24} [{status}]")\n\nprint("-" * 50)\nprint("[+] Audit complete. 3 open attack surfaces detected.")`
  );
  const [pythonOutput, setPythonOutput] = useState<string>('');

  // JavaScript / Node Sandbox State
  const [jsCode, setJsCode] = useState<string>(
    `// JavaScript / Node.js Modern Playground\nconst student = {\n  name: "Atlas Auditor",\n  role: "Full-Stack Security Specialist",\n  skills: ["React", "TypeScript", "Linux", "Penetration Testing"],\n  xp: 4500\n};\n\nconsole.log("Analyzing profile data...");\nconst activeSkills = student.skills.map((s, idx) => \`\${idx + 1}. \${s.toUpperCase()}\`);\nconsole.log("Active Certifications:\\n" + activeSkills.join("\\n"));\n\n// Async task simulation\nconst latency = Math.floor(Math.random() * 40) + 10;\nconsole.log(\`✅ Threat check passed in \${latency}ms with ZERO vulnerabilities.\`);`
  );
  const [jsOutput, setJsOutput] = useState<string>('');

  // SQL Sandbox State
  const [sqlQuery, setSqlQuery] = useState<string>(
    `SELECT u.id, u.username, u.role, u.xp\nFROM users u\nWHERE u.xp >= 1000\nORDER BY u.xp DESC;`
  );
  const [sqlResults, setSqlResults] = useState<{ columns: string[]; rows: any[][] }>({
    columns: ['id', 'username', 'role', 'xp'],
    rows: [
      [101, 'alex_sec', 'Admin / Security Lead', 5420],
      [102, 'layla_dev', 'Senior Frontend Engineer', 4180],
      [103, 'tariq_ops', 'DevOps Specialist', 3900],
      [104, 'sara_audit', 'Penetration Tester', 3150]
    ]
  });
  const [sqlMessage, setSqlMessage] = useState<string>('Query executed successfully. 4 records retrieved.');

  // Auto focus input on terminal tab
  useEffect(() => {
    if (isOpen && activeTab === 'terminal') {
      setTimeout(() => {
        terminalInputRef.current?.focus();
      }, 80);
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  if (!isOpen) return null;

  // Linux Virtual Filesystem Simulator
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = terminalInput.trim();
    if (!trimmed) return;

    const parts = trimmed.split(' ').filter(Boolean);
    const cmd = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    let output = '';
    let type: 'stdout' | 'stderr' | 'system' = 'stdout';

    switch (cmd) {
      case 'clear':
        setTerminalHistory([]);
        setTerminalInput('');
        return;
      case 'help':
      case 'مساعدة':
        output = language === 'ar' ? `الأوامر المتاحة في الطرفية (Linux Terminal Commands):
  ls [-la]              عرض قائمة الملفات والتصاريح
  pwd                   طباعة مسار المجلد الحالي
  whoami                عرض المستخدم الحالي وصلاحياته
  cat <filename>        قراءة محتوى ملف (مثال: deploy.sh, server.log)
  chmod <mode> <file>   تعديل صلاحيات الملف (مثال: chmod 755 deploy.sh)
  nmap <ip/domain>      فحص المنافذ المفتوحة وكشف الخدمات
  curl <url>            إرسال طلب HTTP واستعراض الترويسات
  grep <str> <file>     البحث عن نصوص داخل الملفات
  ping <host>           فحص الاتصال عبر حزم ICMP
  date                  عرض التوقيت العالمي الحالي
  clear                 مسح شاشة الطرفية` : `Available Linux & Security commands:
  ls [-la]              List directory contents and permissions
  pwd                   Print current working directory
  whoami                Display currently authenticated user
  cat <filename>        Read contents of a file (e.g. deploy.sh, server.log)
  chmod <mode> <file>   Modify access permissions (e.g. chmod 755 deploy.sh)
  nmap <ip/domain>      Audit open network ports & services
  curl <url>            Fetch HTTP response headers and payload
  grep <str> <file>     Search for patterns inside files
  ping <host>           Send ICMP echo requests
  date                  Display current UTC timestamp
  clear                 Clear terminal screen`;
        break;
      case 'pwd':
        output = '/home/student/audit_lab';
        break;
      case 'whoami':
        output = 'student_auditor (uid=1001, gid=1001 groups=1001(security),27(sudo))';
        break;
      case 'date':
        output = new Date().toUTCString();
        break;
      case 'ls':
        if (args.includes('-la') || args.includes('-l')) {
          output = `total 32
drwxr-xr-x 4 student security 4096 Nov 04 09:30 .
drwxr-xr-x 3 root    root     4096 Nov 04 09:00 ..
-rwxr-xr-x 1 student security  412 Nov 04 09:15 deploy.sh
-rw-r--r-- 1 student security 1892 Nov 04 09:20 app.py
-rw------- 1 student security 3243 Nov 04 09:25 id_rsa
-rw-r--r-- 1 student security  840 Nov 04 09:28 server.log
-rw-r--r-- 1 student security 1205 Nov 04 09:29 schema.sql
drwxr-xr-x 2 student security 4096 Nov 04 09:30 config/`;
        } else {
          output = 'deploy.sh   app.py   id_rsa   server.log   schema.sql   config/';
        }
        break;
      case 'cat':
        if (!args[0]) {
          output = 'Usage: cat <filename>';
          type = 'stderr';
        } else if (args[0] === 'deploy.sh') {
          output = `#!/usr/bin/env bash\nset -euo pipefail\necho "[*] Deploying SkillIQ microservice container..."\ndocker-compose up -d --build\necho "[+] Health check passed (200 OK)."`;
        } else if (args[0] === 'server.log') {
          output = `2026-11-04 09:28:12 [INFO] GET /api/v1/auth/verify 200 OK - 14ms\n2026-11-04 09:28:14 [WARN] Suspicious SQL injection pattern detected in /login param 'username'\n2026-11-04 09:28:15 [BLOCK] Firewall IP 198.51.100.41 blocked for 3600s`;
        } else if (args[0] === 'id_rsa') {
          output = '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn\n... [ENCRYPTED PRIVATE KEY REDACTED FOR AUDIT] ...\n-----END OPENSSH PRIVATE KEY-----';
        } else if (args[0] === 'schema.sql') {
          output = 'CREATE TABLE users (id SERIAL PRIMARY KEY, username VARCHAR(50), role VARCHAR(50), xp INT);\nCREATE TABLE logs (id SERIAL PRIMARY KEY, event TEXT, timestamp TIMESTAMP DEFAULT NOW());';
        } else {
          output = `cat: ${args[0]}: No such file or directory`;
          type = 'stderr';
        }
        break;
      case 'chmod':
        if (args.length < 2) {
          output = 'Usage: chmod <mode> <filename>';
          type = 'stderr';
        } else {
          output = `chmod: mode of '${args[1]}' changed to ${args[0]} [OK]`;
        }
        break;
      case 'nmap':
        const target = args[0] || '127.0.0.1';
        output = `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toISOString()}
Nmap scan report for ${target}
Host is up (0.00042s latency).
Not shown: 996 closed tcp ports
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu
80/tcp   open  http    nginx/1.24.0
443/tcp  open  ssl/http nginx/1.24.0
8080/tcp open  http-proxy Node.js Express 4.19

Service detection performed. 4 open services found.`;
        break;
      case 'curl':
        const url = args[0] || 'https://skilliq.online/api/health';
        output = `HTTP/2 200 OK
content-type: application/json; charset=utf-8
strict-transport-security: max-age=31536000; includeSubDomains
x-content-type-options: nosniff
x-frame-options: DENY

{
  "status": "healthy",
  "version": "2.5.0",
  "security_tier": "hardened",
  "target": "${url}",
  "timestamp": "${new Date().toISOString()}"
}`;
        break;
      case 'grep':
        if (!args[0]) {
          output = 'Usage: grep <pattern> <filename>';
          type = 'stderr';
        } else {
          output = `server.log: 2026-11-04 09:28:14 [WARN] Suspicious SQL injection pattern detected in /login param '${args[0]}'`;
        }
        break;
      case 'ping':
        const pingHost = args[0] || '8.8.8.8';
        output = `PING ${pingHost} (${pingHost}) 56(84) bytes of data.
64 bytes from ${pingHost}: icmp_seq=1 ttl=118 time=12.4 ms
64 bytes from ${pingHost}: icmp_seq=2 ttl=118 time=11.9 ms
64 bytes from ${pingHost}: icmp_seq=3 ttl=118 time=12.1 ms
--- ${pingHost} ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2003ms`;
        break;
      default:
        output = `bash: ${cmd}: command not found. Type "help" or "مساعدة" to view supported commands.`;
        type = 'stderr';
    }

    setTerminalHistory(prev => [
      ...prev,
      {
        id: `cmd-${Date.now()}`,
        command: trimmed,
        output,
        type
      }
    ]);
    setTerminalInput('');
  };

  // Run Python script simulation
  const handleRunPython = () => {
    try {
      const logs: string[] = [];
      const lines = pythonCode.split('\n');
      const vars: Record<string, any> = {};

      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        if (trimmed.startsWith('print(')) {
          const inner = trimmed.slice(6, trimmed.lastIndexOf(')'));
          if (inner.startsWith('f"') || inner.startsWith("f'")) {
            let processed = inner.slice(2, -1);
            processed = processed.replace(/{([^}]+)}/g, (_, expr) => {
              try {
                const cleanExpr = expr.split(':')[0].trim();
                if (vars[cleanExpr] !== undefined) return vars[cleanExpr];
                return eval(cleanExpr);
              } catch {
                return expr;
              }
            });
            logs.push(processed);
          } else if (inner.includes('*')) {
            try {
              const [charStr, countStr] = inner.split('*');
              const char = eval(charStr.trim());
              const count = parseInt(countStr.trim(), 10);
              logs.push(char.repeat(count));
            } catch {
              logs.push(inner);
            }
          } else {
            try {
              logs.push(eval(inner));
            } catch {
              logs.push(inner.replace(/["']/g, ''));
            }
          }
        } else if (trimmed.includes('=') && !trimmed.startsWith('for') && !trimmed.startsWith('if')) {
          const [key, val] = trimmed.split('=').map(s => s.trim());
          try {
            vars[key] = eval(val);
          } catch {
            vars[key] = val;
          }
        }
      });

      if (logs.length === 0) {
        logs.push('[*] Python script executed with exit code 0 (no output produced).');
      }
      setPythonOutput(logs.join('\n'));
    } catch (err: any) {
      setPythonOutput(`Traceback (most recent call last):\n  File "main.py", line 1\nSyntaxError: ${err.message || 'Execution error'}`);
    }
  };

  // Run JavaScript / Node code simulation
  const handleRunJs = () => {
    const logs: string[] = [];
    const originalLog = console.log;
    try {
      console.log = (...args: any[]) => {
        logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
      };
      // Run in a scoped function
      const fn = new Function(jsCode);
      const res = fn();
      if (res !== undefined) {
        logs.push(`<- Return: ${JSON.stringify(res)}`);
      }
      if (logs.length === 0) {
        logs.push('Execution completed with 0 console logs.');
      }
      setJsOutput(logs.join('\n'));
    } catch (err: any) {
      setJsOutput(`Error: ${err.message}`);
    } finally {
      console.log = originalLog;
    }
  };

  // Run SQL Query simulation
  const handleRunSql = () => {
    const q = sqlQuery.trim().toLowerCase();
    if (q.includes('select')) {
      if (q.includes('where') && q.includes('xp')) {
        setSqlResults({
          columns: ['id', 'username', 'role', 'xp'],
          rows: [
            [101, 'alex_sec', 'Admin / Security Lead', 5420],
            [102, 'layla_dev', 'Senior Frontend Engineer', 4180],
            [103, 'tariq_ops', 'DevOps Specialist', 3900],
            [104, 'sara_audit', 'Penetration Tester', 3150]
          ]
        });
        setSqlMessage('SELECT query executed in 1.4ms. 4 rows returned.');
      } else {
        setSqlResults({
          columns: ['id', 'username', 'role', 'xp'],
          rows: [
            [101, 'alex_sec', 'Admin / Security Lead', 5420],
            [102, 'layla_dev', 'Senior Frontend Engineer', 4180],
            [103, 'tariq_ops', 'DevOps Specialist', 3900],
            [104, 'sara_audit', 'Penetration Tester', 3150],
            [105, 'omar_guest', 'Student Member', 850]
          ]
        });
        setSqlMessage('SELECT * executed in 2.1ms. 5 rows returned.');
      }
    } else if (q.includes('insert') || q.includes('update') || q.includes('delete')) {
      setSqlMessage('Query executed successfully. 1 row affected (TRANSACTION COMMITTED).');
    } else {
      setSqlMessage('SQL query executed successfully.');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 1500);
  };

  const tabs: { id: SandboxMode; label: { en: string; ar: string }; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
    { id: 'terminal', label: { en: 'Terminal (Linux)', ar: 'طرفية لينكس (Linux)' }, icon: Terminal, color: 'text-emerald-400' },
    { id: 'frontend', label: { en: 'Frontend (HTML/CSS/JS)', ar: 'واجهات ويب (Frontend)' }, icon: Code2, color: 'text-sky-400' },
    { id: 'python', label: { en: 'Python 3', ar: 'بايثون (Python 3)' }, icon: FileCode, color: 'text-amber-400' },
    { id: 'javascript', label: { en: 'JavaScript / Node', ar: 'جافاسكربت (JavaScript)' }, icon: Cpu, color: 'text-yellow-400' },
    { id: 'sql', label: { en: 'SQL Database', ar: 'قواعد بيانات (SQL)' }, icon: Database, color: 'text-purple-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullScreen ? 'h-full max-w-full rounded-none' : 'max-w-6xl h-[90vh]'
        }`}
        dir="ltr"
      >
        {/* Top Header Bar */}
        <div className="px-4 py-3 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          {/* Environments Tabs - fully clickable & switchable */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1.5 mr-2 shrink-0">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>

            {tabs.map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    isSelected
                      ? `bg-slate-800 ${tab.color} shadow-sm border border-slate-700 ring-1 ring-slate-600`
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? tab.label.ar : tab.label.en}</span>
                </button>
              );
            })}
          </div>

          {/* Right actions: Language Switcher, Fullscreen, Close */}
          <div className="flex items-center gap-2 ms-auto shrink-0">
            {/* Language Switcher Toggle */}
            <button
              onClick={toggleModalLanguage}
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
              title={language === 'ar' ? 'تبديل للغة الإنجليزية' : 'Switch to Arabic'}
            >
              <Languages className="w-3.5 h-3.5 text-primary" />
              <span>{language === 'ar' ? 'English' : 'عربي'}</span>
            </button>

            <button
              onClick={() => setIsFullScreen(prev => !prev)}
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Terminal Mode */}
        {activeTab === 'terminal' && (
          <div
            className="flex-1 bg-black p-4 font-mono text-xs sm:text-sm overflow-y-auto flex flex-col justify-between"
            onClick={() => terminalInputRef.current?.focus()}
          >
            <div className="space-y-3">
              {terminalHistory.map(item => (
                <div key={item.id} className="space-y-1">
                  {item.command && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-emerald-400 font-bold">student@skilliq:~/audit_lab$</span>
                      <span className="text-white font-semibold">{item.command}</span>
                    </div>
                  )}
                  <pre
                    className={`whitespace-pre-wrap leading-relaxed ${
                      item.type === 'stderr'
                        ? 'text-rose-400'
                        : item.type === 'system'
                        ? 'text-indigo-400 font-semibold'
                        : 'text-slate-300'
                    }`}
                  >
                    {item.output}
                  </pre>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            {/* Prompt input */}
            <form onSubmit={handleTerminalSubmit} className="pt-4 flex items-center gap-2 mt-auto border-t border-slate-900">
              <span className="text-emerald-400 font-bold shrink-0">student@skilliq:~/audit_lab$</span>
              <input
                ref={terminalInputRef}
                type="text"
                value={terminalInput}
                onChange={e => setTerminalInput(e.target.value)}
                placeholder={language === 'ar' ? 'اكتب أمرك هنا (مثال: ls -la, nmap 127.0.0.1, help)...' : 'type a command (e.g. ls -la, nmap 127.0.0.1, help)...'}
                className="flex-1 bg-transparent border-none text-white focus:outline-none focus:ring-0 font-mono text-xs sm:text-sm"
                autoFocus
              />
            </form>
          </div>
        )}

        {/* Tab 2: Frontend Sandbox Mode */}
        {activeTab === 'frontend' && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
            <div className="flex flex-col border-r border-slate-800 bg-slate-950">
              <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-sky-400">HTML / CSS / JS Editor</span>
                <button
                  onClick={() => handleCopyCode(htmlCode)}
                  type="button"
                  className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{hasCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <textarea
                value={htmlCode}
                onChange={e => setHtmlCode(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full bg-slate-950 text-emerald-300 font-mono text-xs sm:text-sm p-4 resize-none border-none focus:outline-none focus:ring-0 leading-relaxed overflow-y-auto"
              />
            </div>

            <div className="flex flex-col bg-white overflow-hidden">
              <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Preview Output
                </span>
                <button
                  onClick={() => {
                    const temp = htmlCode;
                    setHtmlCode('');
                    setTimeout(() => setHtmlCode(temp), 50);
                  }}
                  type="button"
                  className="p-1 hover:text-slate-900 cursor-pointer"
                  title="Reload Preview"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
              <iframe
                srcDoc={htmlCode}
                title="Frontend Preview"
                sandbox="allow-scripts allow-modals"
                className="w-full flex-1 border-none bg-slate-950"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Python Runner Mode */}
        {activeTab === 'python' && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
            <div className="flex flex-col border-r border-slate-800 bg-slate-950">
              <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-amber-400">script.py (Python 3.12)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCode(pythonCode)}
                    type="button"
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                  >
                    {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{hasCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleRunPython}
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run</span>
                  </button>
                </div>
              </div>
              <textarea
                value={pythonCode}
                onChange={e => setPythonCode(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full bg-slate-950 text-amber-200 font-mono text-xs sm:text-sm p-4 resize-none border-none focus:outline-none focus:ring-0 leading-relaxed overflow-y-auto"
              />
            </div>

            <div className="flex flex-col bg-slate-900 overflow-hidden font-mono text-xs sm:text-sm">
              <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  Standard Output (stdout)
                </span>
                <button
                  onClick={() => setPythonOutput('')}
                  type="button"
                  className="hover:text-slate-200 cursor-pointer"
                >
                  Clear
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto text-emerald-400 bg-black/50">
                {pythonOutput ? (
                  <pre className="whitespace-pre-wrap leading-relaxed">{pythonOutput}</pre>
                ) : (
                  <div className="text-slate-500 italic">
                    {language === 'ar' ? 'انقر على "Run" أعلاه لتشغيل كود بايثون وعرض المخرجات.' : 'Click "Run" above to execute the Python script simulator.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: JavaScript / Node.js Mode */}
        {activeTab === 'javascript' && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
            <div className="flex flex-col border-r border-slate-800 bg-slate-950">
              <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-yellow-400">app.js (Node.js & ES2024)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCode(jsCode)}
                    type="button"
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                  >
                    {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{hasCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleRunJs}
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black transition-all shadow-sm cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run JS</span>
                  </button>
                </div>
              </div>
              <textarea
                value={jsCode}
                onChange={e => setJsCode(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full bg-slate-950 text-yellow-200 font-mono text-xs sm:text-sm p-4 resize-none border-none focus:outline-none focus:ring-0 leading-relaxed overflow-y-auto"
              />
            </div>

            <div className="flex flex-col bg-slate-900 overflow-hidden font-mono text-xs sm:text-sm">
              <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-yellow-400" />
                  Console & Execution Log
                </span>
                <button
                  onClick={() => setJsOutput('')}
                  type="button"
                  className="hover:text-slate-200 cursor-pointer"
                >
                  Clear
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto text-emerald-400 bg-black/50">
                {jsOutput ? (
                  <pre className="whitespace-pre-wrap leading-relaxed">{jsOutput}</pre>
                ) : (
                  <div className="text-slate-500 italic">
                    {language === 'ar' ? 'انقر على "Run JS" لتشغيل الكود وعرض النتائج.' : 'Click "Run JS" to execute JavaScript code and observe live console logs.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: SQL Database Lab Mode */}
        {activeTab === 'sql' && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
            <div className="flex flex-col border-r border-slate-800 bg-slate-950">
              <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-purple-400">SQL Query Editor (PostgreSQL / SQLite)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCode(sqlQuery)}
                    type="button"
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                  >
                    {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{hasCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleRunSql}
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Execute SQL</span>
                  </button>
                </div>
              </div>
              <textarea
                value={sqlQuery}
                onChange={e => setSqlQuery(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full bg-slate-950 text-purple-200 font-mono text-xs sm:text-sm p-4 resize-none border-none focus:outline-none focus:ring-0 leading-relaxed overflow-y-auto"
              />
              <div className="p-3 bg-slate-900/40 border-t border-slate-800 text-[11px] text-slate-400">
                💡 {language === 'ar' ? 'الجداول التجريبية المتاحة: users(id, username, role, xp) و logs(id, event, timestamp)' : 'Available demo relations: users(id, username, role, xp) and logs(id, event, timestamp)'}
              </div>
            </div>

            <div className="flex flex-col bg-slate-900 overflow-hidden text-xs">
              <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-slate-400 font-semibold font-mono">
                <span className="flex items-center gap-2 text-purple-400">
                  <Database className="w-3.5 h-3.5" />
                  Relation Data Grid
                </span>
                <span className="text-[11px] text-emerald-400">{sqlMessage}</span>
              </div>
              <div className="flex-1 p-3 overflow-auto bg-black/40">
                <table className="w-full text-left font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-300">
                      {sqlResults.columns.map((col, idx) => (
                        <th key={idx} className="p-2 font-bold uppercase text-[11px] text-slate-400">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sqlResults.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="p-2 text-slate-300">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
