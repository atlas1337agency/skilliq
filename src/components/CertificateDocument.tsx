import { useEffect, useState, type RefObject } from 'react';
import QRCode from 'qrcode';

export interface CertificateData {
  certId: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  professorName?: string;
  youtubeChannelName?: string;
  issueDate: string;
  verificationUrl: string;
  isDemo?: boolean;
  isProjectBuild?: boolean;
}

interface CertificateDocumentProps {
  data: CertificateData;
  certRef?: RefObject<HTMLDivElement | null>;
  isDownloading?: boolean;
}

export function CertificateDocument({ data, certRef }: CertificateDocumentProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const isProject = Boolean(data.isProjectBuild);

  const rawProf = (data.professorName || data.instructorName || 'Course Educator').trim();
  const professorDisplay = /^(prof\.?|professor|dr\.?|mr\.?|أ\.|الأستاذ|د\.)\s/i.test(rawProf)
    ? rawProf.replace(/^professor\s+/i, 'Prof. ')
    : `Prof. ${rawProf}`;
  const channelDisplay = (data.youtubeChannelName || data.instructorName || 'Official YouTube Channel').trim();

  // Detect if studentName or courseTitle contains Arabic script
  const isArabicStudent = /[\u0600-\u06FF]/.test(data.studentName || '');
  const isArabicCourse = /[\u0600-\u06FF]/.test(data.courseTitle || '');

  // Generate QR Code data URL offline
  useEffect(() => {
    let isMounted = true;
    const generateQr = async () => {
      try {
        const url = await QRCode.toDataURL(data.verificationUrl, {
          width: 180,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
        if (isMounted) setQrCodeDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code', err);
      }
    };
    generateQr();
    return () => {
      isMounted = false;
    };
  }, [data.verificationUrl]);

  // =========================================================================================
  // 2. PROJECT PLAYLIST CERTIFICATE DESIGN (Inspired by project.png — Modern White & Royal Blue Diagonal Ribbons, Zero Overlap, Simple Easy-to-Read User Name)
  // =========================================================================================
  if (isProject) {
    return (
      <div
        ref={certRef}
        dir="ltr"
        className="w-[1000px] h-[707px] min-w-[1000px] min-h-[707px] max-w-[1000px] max-h-[707px] bg-white text-slate-900 shadow-2xl relative select-none flex items-center justify-center shrink-0 overflow-hidden border border-slate-200"
        style={{
          boxSizing: 'border-box',
          fontFamily: "'Plus Jakarta Sans', 'Alexandria', sans-serif",
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 55%, #ffffff 100%)'
        }}
      >
        {/* Top-Left & Bottom-Right Diagonal Geometric Royal Blue Ribbons (Positioned Strictly in Corners so ZERO text overlaps) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 707"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="projBlueDark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0b1e47" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="projBlueMid" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="projBlueLight" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>
            <linearGradient id="projSilver" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
          </defs>

          {/* Subtle Background Architectural Waves */}
          <path
            d="M0 190 Q 340 110 600 295 T 1000 195 L 1000 707 L 0 707 Z"
            fill="#f1f5f9"
            opacity="0.38"
          />

          {/* TOP-LEFT GEOMETRIC RIBBONS (Compact corner geometry — never touches inner content) */}
          <polygon points="0,0 170,0 0,170" fill="url(#projSilver)" />
          <polygon points="0,0 128,0 0,128" fill="url(#projBlueDark)" />
          <polygon points="102,0 144,0 0,144 0,102" fill="url(#projBlueMid)" />
          <polygon points="144,0 162,0 0,162 0,144" fill="url(#projBlueLight)" />
          <polygon points="0,38 38,0 68,0 0,68" fill="#2563eb" opacity="0.45" />

          {/* BOTTOM-RIGHT GEOMETRIC RIBBONS (Compact corner geometry — never touches signatures) */}
          <polygon points="1000,707 830,707 1000,537" fill="url(#projSilver)" />
          <polygon points="1000,707 872,707 1000,579" fill="url(#projBlueDark)" />
          <polygon points="898,707 856,707 1000,563 1000,605" fill="url(#projBlueMid)" />
          <polygon points="856,707 838,707 1000,545 1000,563" fill="url(#projBlueLight)" />
          <polygon points="1000,669 962,707 932,707 1000,639" fill="#2563eb" opacity="0.45" />

          {/* Inner Precision Frame Line */}
          <rect
            x="48"
            y="42"
            width="904"
            height="623"
            rx="4"
            stroke="#cbd5e1"
            strokeWidth="1.2"
          />
          <rect
            x="56"
            y="50"
            width="888"
            height="607"
            rx="2"
            stroke="#1e40af"
            strokeOpacity="0.16"
            strokeWidth="1"
          />
        </svg>

        {/* Main Content Container (Safe padding away from all corner ribbons) */}
        <div className="relative z-10 w-full h-full px-28 py-14 flex flex-col justify-between items-center text-center">
          {/* TOP HEADER: Clean SkilliQ Identity + Credential ID (100% on white background) */}
          <div className="w-full flex items-center justify-between border-b border-slate-200 pb-3.5">
            <div className="text-left">
              <span
                className="text-2xl font-extrabold tracking-[0.28em] text-[#0b1e47] uppercase block"
                style={{ fontFamily: "'Cinzel', 'Plus Jakarta Sans', serif" }}
              >
                SKILLIQ
              </span>
              <span className="text-[9.5px] font-bold text-blue-700 tracking-[0.2em] uppercase block mt-0.5">
                OFFICIAL REAL-WORLD PROJECT CREDENTIAL
              </span>
            </div>

            <div className="text-right">
              <span className="block text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
                CERTIFICATE ID
              </span>
              <span className="block text-xs font-mono font-extrabold text-[#0b1e47] tracking-wider mt-0.5">
                {data.certId}
              </span>
            </div>
          </div>

          {/* CENTER BODY: Title, Simple & Clear Recipient Name, Project Title, Educator Info */}
          <div className="my-auto flex flex-col items-center max-w-3xl w-full py-1">
            <h1
              className="text-[48px] font-extrabold tracking-[0.1em] text-[#0b1e47] uppercase leading-none"
              style={{ fontFamily: "'Cinzel', 'Plus Jakarta Sans', serif" }}
            >
              CERTIFICATE
            </h1>

            <div className="mt-2 flex items-center gap-3.5">
              <span className="h-[1.5px] w-14 bg-blue-700/40" />
              <span className="text-[12.5px] font-extrabold tracking-[0.36em] text-blue-800 uppercase">
                OF COMPLETION
              </span>
              <span className="h-[1.5px] w-14 bg-blue-700/40" />
            </div>

            <p className="text-[10.5px] font-bold tracking-[0.26em] text-slate-500 uppercase mt-5">
              THIS CERTIFICATE IS PROUDLY PRESENTED TO
            </p>

            {/* Student Name: Simple, Modern, Crystal-Clear Easy-to-Read Font */}
            <div className="mt-2.5 mb-3 w-full max-w-xl border-b-2 border-[#0b1e47]/25 pb-2.5 px-6">
              <h2
                dir={isArabicStudent ? 'rtl' : 'ltr'}
                className="text-3xl font-extrabold text-[#0b1e47] tracking-tight leading-tight"
                style={{
                  fontFamily: isArabicStudent
                    ? "'Alexandria', sans-serif"
                    : "'Plus Jakarta Sans', sans-serif"
                }}
              >
                {data.studentName || 'Student Name'}
              </h2>
            </div>

            <p className="text-xs text-slate-600 max-w-xl leading-relaxed font-medium">
              for successfully architecting, coding, and completing all practical milestones of the real-world project playlist:
            </p>

            {/* Project Playlist Title (Full multi-line display without awkward truncation) */}
            <div className="mt-3 px-6 py-2.5 rounded-lg bg-slate-50 border border-slate-200 max-w-2xl w-full">
              <h3
                dir={isArabicCourse ? 'rtl' : 'ltr'}
                className="text-[18px] font-extrabold text-[#0b1e47] tracking-tight leading-snug line-clamp-2"
                style={{
                  fontFamily: isArabicCourse
                    ? "'Alexandria', sans-serif"
                    : "'Plus Jakarta Sans', sans-serif"
                }}
              >
                {data.courseTitle}
              </h3>
            </div>

            {/* Pure Typographic Educator & Channel Credit */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[11px] text-slate-600">
              <div>
                <span className="uppercase tracking-[0.16em] text-[9.5px] font-bold text-slate-400 mr-1.5">
                  PROJECT INSTRUCTOR:
                </span>
                <span className="font-bold text-[#0b1e47]">{professorDisplay}</span>
              </div>
              <span className="text-slate-300">|</span>
              <div>
                <span className="uppercase tracking-[0.16em] text-[9.5px] font-bold text-slate-400 mr-1.5">
                  OFFICIAL CHANNEL:
                </span>
                <span className="font-bold text-[#0b1e47]">{channelDisplay}</span>
              </div>
            </div>
          </div>

          {/* BOTTOM FOOTER: QR Verification, Seal, Signatures (100% inside white canvas) */}
          <div className="w-full pt-3 border-t border-slate-200">
            <div className="w-full grid grid-cols-[1.1fr_1.15fr_auto_1.15fr] items-end gap-4">
              {/* Column 1: QR & Issue Date */}
              <div className="flex items-center gap-3 text-left">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Verification QR"
                    className="w-14 h-14 rounded border border-slate-300 bg-white p-0.5 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded border border-slate-300 bg-white shrink-0" />
                )}
                <div className="text-[10px] leading-tight">
                  <span className="block text-[8.5px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    DATE OF ISSUANCE
                  </span>
                  <span className="block text-xs font-extrabold text-[#0b1e47] mt-0.5">
                    {data.issueDate}
                  </span>
                  <span className="block text-[9px] font-semibold text-blue-700 mt-1">
                    Scan QR to Verify ID
                  </span>
                </div>
              </div>

              {/* Column 2: Course Educator Signature */}
              <div className="flex flex-col items-center text-center">
                <div className="w-44 border-b border-slate-400 pb-1 mb-1.5">
                  <span
                    className="text-base text-[#0b1e47] block truncate"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontStyle: 'italic',
                      fontWeight: 700
                    }}
                  >
                    {professorDisplay}
                  </span>
                </div>
                <span className="text-[8.5px] font-extrabold uppercase tracking-[0.2em] text-[#0b1e47]">
                  PROJECT EDUCATOR
                </span>
                <span className="text-[8.5px] text-slate-500 font-semibold mt-0.5 truncate max-w-[180px]">
                  {channelDisplay}
                </span>
              </div>

              {/* Column 3: Pure Geometric Gold & Royal Blue Seal */}
              <div className="flex flex-col items-center justify-center px-1">
                <div className="relative w-19 h-19 rounded-full p-1 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-md flex items-center justify-center">
                  <div className="w-full h-full rounded-full border border-dashed border-white/80 bg-[#0b1e47] flex flex-col items-center justify-center text-center px-1">
                    <span className="text-[6px] font-bold tracking-[0.2em] text-amber-300 uppercase">
                      OFFICIAL
                    </span>
                    <span
                      className="text-[8.5px] font-extrabold tracking-[0.16em] text-white uppercase my-0.5"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      SKILLIQ
                    </span>
                    <span className="text-[5.5px] font-bold tracking-[0.18em] text-blue-200 uppercase">
                      PROJECT SEAL
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 4: Global Director Signature */}
              <div className="flex flex-col items-center text-center">
                <div className="w-44 border-b border-slate-400 pb-1 mb-1.5">
                  <span
                    className="text-base text-[#0b1e47] block truncate"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontStyle: 'italic',
                      fontWeight: 700
                    }}
                  >
                    {data.instructorName || 'Mr. Marouan Anouar'}
                  </span>
                </div>
                <span className="text-[8.5px] font-extrabold uppercase tracking-[0.18em] text-[#0b1e47]">
                  AUTHORIZED SIGNATORY
                </span>
                <span className="text-[8px] text-slate-500 font-semibold mt-0.5">
                  Global Director of ATLAS 1337 Certificates
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================================
  // 1. NORMAL PLAYLIST COURSE CERTIFICATE DESIGN (Inspired by normal.png — Classic Navy & Gold Ornamental Frame, Zero Overlap, Simple Easy-to-Read User Name)
  // =========================================================================================
  return (
    <div
      ref={certRef}
      dir="ltr"
      className="w-[1000px] h-[707px] min-w-[1000px] min-h-[707px] max-w-[1000px] max-h-[707px] bg-[#fdfcf9] text-slate-900 shadow-2xl relative select-none flex items-center justify-center shrink-0 overflow-hidden border border-amber-700/30"
      style={{
        boxSizing: 'border-box',
        fontFamily: "'Plus Jakarta Sans', 'Alexandria', sans-serif",
        background: 'radial-gradient(circle at center, #ffffff 0%, #fcfaf2 72%, #f5f0e1 100%)'
      }}
    >
      {/* Navy & Gold Sweeping Corner Waves + Classic Double Gold Frame (Positioned strictly in corners so ZERO text overlaps) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1000 707"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="normNavy" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0a1938" />
            <stop offset="100%" stopColor="#172a54" />
          </linearGradient>
          <linearGradient id="normGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
        </defs>

        {/* Top-Left Navy & Gold Wave Accent (Compact corner wave) */}
        <path d="M0,0 L165,0 C110,32 52,85 0,165 Z" fill="url(#normNavy)" />
        <path d="M165,0 L192,0 C130,42 65,102 0,192 L0,165 C52,85 110,32 165,0 Z" fill="url(#normGold)" />

        {/* Bottom-Left Navy & Gold Wave Accent */}
        <path d="M0,707 L155,707 C100,675 48,625 0,552 Z" fill="url(#normNavy)" />
        <path d="M155,707 L180,707 C120,668 60,610 0,527 L0,552 C48,625 100,675 155,707 Z" fill="url(#normGold)" />

        {/* Top-Right Navy & Gold Wave Accent */}
        <path d="M1000,0 L835,0 C890,32 948,85 1000,165 Z" fill="url(#normNavy)" />
        <path d="M835,0 L808,0 C870,42 935,102 1000,192 L1000,165 C948,85 890,32 835,0 Z" fill="url(#normGold)" />

        {/* Bottom-Right Navy & Gold Wave Accent */}
        <path d="M1000,707 L845,707 C900,675 952,625 1000,552 Z" fill="url(#normNavy)" />
        <path d="M845,707 L820,707 C880,668 940,610 1000,527 L1000,552 C952,625 900,675 845,707 Z" fill="url(#normGold)" />

        {/* Outer & Inner Gold Ornamental Borders */}
        <rect
          x="38"
          y="36"
          width="924"
          height="635"
          stroke="url(#normGold)"
          strokeWidth="2.5"
        />
        <rect
          x="47"
          y="45"
          width="906"
          height="617"
          stroke="#0a1938"
          strokeOpacity="0.35"
          strokeWidth="1"
        />

        {/* Classic Ornamental Corner Squares */}
        <rect x="42" y="40" width="14" height="14" stroke="url(#normGold)" strokeWidth="2" fill="#fdfcf9" />
        <rect x="944" y="40" width="14" height="14" stroke="url(#normGold)" strokeWidth="2" fill="#fdfcf9" />
        <rect x="42" y="653" width="14" height="14" stroke="url(#normGold)" strokeWidth="2" fill="#fdfcf9" />
        <rect x="944" y="653" width="14" height="14" stroke="url(#normGold)" strokeWidth="2" fill="#fdfcf9" />
      </svg>

      {/* Main Certificate Inner Canvas (Safe horizontal padding so all text sits strictly on the cream-white center) */}
      <div className="relative z-10 w-full h-full px-28 py-14 flex flex-col justify-between items-center text-center">
        {/* TOP BRAND & CREDENTIAL ID HEADER */}
        <div className="w-full flex items-center justify-between border-b border-amber-700/25 pb-3.5">
          <div className="text-left">
            <span
              className="text-2xl font-extrabold tracking-[0.28em] text-[#0a1938] uppercase block"
              style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
            >
              SKILLIQ
            </span>
            <span className="text-[9.5px] font-bold text-amber-800 tracking-[0.2em] uppercase block mt-0.5">
              OFFICIAL VERIFIED COURSE CREDENTIAL
            </span>
          </div>

          <div className="text-right">
            <span className="block text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
              CERTIFICATE ID
            </span>
            <span className="block text-xs font-mono font-extrabold text-[#0a1938] tracking-wider mt-0.5">
              {data.certId}
            </span>
          </div>
        </div>

        {/* CENTER BODY */}
        <div className="my-auto flex flex-col items-center max-w-3xl w-full py-1">
          <h1
            className="text-[48px] font-bold tracking-[0.12em] text-[#0a1938] uppercase leading-none"
            style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
          >
            CERTIFICATE
          </h1>

          <div className="mt-2 flex items-center gap-3.5">
            <span className="h-[1.5px] w-14 bg-amber-600/70" />
            <span
              className="text-[12.5px] font-bold tracking-[0.36em] text-amber-800 uppercase"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              OF ACHIEVEMENT
            </span>
            <span className="h-[1.5px] w-14 bg-amber-600/70" />
          </div>

          <p className="text-[10.5px] font-bold tracking-[0.26em] text-[#0a1938] uppercase mt-5">
            THIS CERTIFICATE IS PROUDLY PRESENTED TO
          </p>

          {/* Student Name: Simple, Clean, High-Contrast Easy-to-Read Font */}
          <div className="mt-2.5 mb-3 w-full max-w-xl border-b-2 border-amber-700/40 pb-2.5 px-6">
            <h2
              dir={isArabicStudent ? 'rtl' : 'ltr'}
              className="text-3xl font-extrabold text-[#0a1938] tracking-tight leading-tight"
              style={{
                fontFamily: isArabicStudent
                  ? "'Alexandria', sans-serif"
                  : "'Plus Jakarta Sans', sans-serif"
              }}
            >
              {data.studentName || 'Student Name'}
            </h2>
          </div>

          <p className="text-xs text-slate-600 max-w-xl leading-relaxed font-medium">
            for successfully mastering the curriculum, completing all required lessons, and demonstrating technical excellence in the course playlist:
          </p>

          {/* Course Title */}
          <div className="mt-2.5 px-6 py-1.5 max-w-2xl w-full">
            <h3
              dir={isArabicCourse ? 'rtl' : 'ltr'}
              className="text-[20px] font-extrabold text-[#0a1938] tracking-tight leading-snug line-clamp-2"
              style={{
                fontFamily: isArabicCourse
                  ? "'Alexandria', sans-serif"
                  : "'Playfair Display', Georgia, serif"
              }}
            >
              {data.courseTitle}
            </h3>
          </div>

          {/* Pure Typographic Educator & YouTube Channel Credit */}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[11px] text-slate-600 border-t border-b border-amber-700/25 py-1.5 px-6">
            <div>
              <span className="uppercase tracking-[0.16em] text-[9.5px] font-bold text-amber-800 mr-1.5">
                COURSE PROFESSOR:
              </span>
              <span className="font-bold text-[#0a1938]">{professorDisplay}</span>
            </div>
            <span className="text-amber-600/60">|</span>
            <div>
              <span className="uppercase tracking-[0.16em] text-[9.5px] font-bold text-amber-800 mr-1.5">
                YOUTUBE CHANNEL:
              </span>
              <span className="font-bold text-[#0a1938]">{channelDisplay}</span>
            </div>
          </div>
        </div>

        {/* BOTTOM AUTHENTICATION, MEDALLION SEAL & SIGNATURES */}
        <div className="w-full pt-3 border-t border-amber-700/25">
          <div className="w-full grid grid-cols-[1.1fr_1.15fr_auto_1.15fr] items-end gap-4">
            {/* Column 1: QR Code & Issue Date */}
            <div className="flex items-center gap-3 text-left">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Verification QR"
                  className="w-14 h-14 rounded border border-amber-700/35 bg-white p-0.5 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded border border-amber-700/35 bg-white shrink-0" />
              )}
              <div className="text-[10px] leading-tight">
                <span className="block text-[8.5px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  ISSUE DATE
                </span>
                <span className="block text-xs font-extrabold text-[#0a1938] mt-0.5">
                  {data.issueDate}
                </span>
                <span className="block text-[9px] font-semibold text-amber-800 mt-1">
                  Scan QR to Verify ID
                </span>
              </div>
            </div>

            {/* Column 2: Course Professor Signature */}
            <div className="flex flex-col items-center text-center">
              <div className="w-44 border-b border-amber-800/50 pb-1 mb-1.5">
                <span
                  className="text-base text-[#0a1938] block truncate"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontStyle: 'italic',
                    fontWeight: 700
                  }}
                >
                  {professorDisplay}
                </span>
              </div>
              <span className="text-[8.5px] font-extrabold uppercase tracking-[0.2em] text-amber-800">
                COURSE PROFESSOR
              </span>
              <span className="text-[8.5px] text-slate-500 font-semibold mt-0.5 truncate max-w-[180px]">
                {channelDisplay}
              </span>
            </div>

            {/* Column 3: Classic Gold Medallion Seal */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="relative w-19 h-19 rounded-full p-1 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-md flex items-center justify-center">
                <div className="w-full h-full rounded-full border-2 border-dashed border-[#0a1938]/70 bg-gradient-to-b from-amber-50 to-amber-200/90 flex flex-col items-center justify-center text-center px-1">
                  <span className="text-[6px] font-bold tracking-[0.2em] text-amber-900 uppercase">
                    OFFICIAL
                  </span>
                  <span
                    className="text-[8.5px] font-extrabold tracking-[0.14em] text-[#0a1938] uppercase my-0.5"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    SKILLIQ
                  </span>
                  <span className="text-[5.5px] font-bold tracking-[0.18em] text-amber-900 uppercase">
                    VERIFIED
                  </span>
                </div>
              </div>
            </div>

            {/* Column 4: Global Director Signature */}
            <div className="flex flex-col items-center text-center">
              <div className="w-44 border-b border-amber-800/50 pb-1 mb-1.5">
                <span
                  className="text-base text-[#0a1938] block truncate"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontStyle: 'italic',
                    fontWeight: 700
                  }}
                >
                  {data.instructorName || 'Mr. Marouan Anouar'}
                </span>
              </div>
              <span className="text-[8.5px] font-extrabold uppercase tracking-[0.18em] text-[#0a1938]">
                AUTHORIZED SIGNATORY
              </span>
              <span className="text-[8px] text-slate-500 font-semibold mt-0.5">
                Global Director of ATLAS 1337 Certificates
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
