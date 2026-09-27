import { useEffect, useState, useMemo, type RefObject } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, Award, BadgeCheck } from 'lucide-react';

export interface CertificateData {
  certId: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  issueDate: string;
  verificationUrl: string;
  isDemo?: boolean;
}

interface CertificateDocumentProps {
  data: CertificateData;
  certRef?: RefObject<HTMLDivElement | null>;
  isDownloading?: boolean;
}

export function CertificateDocument({ data, certRef, isDownloading = false }: CertificateDocumentProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Generate QR Code data URL offline
  useEffect(() => {
    let isMounted = true;
    const generateQr = async () => {
      try {
        const url = await QRCode.toDataURL(data.verificationUrl, {
          width: 180,
          margin: 1,
          color: {
            dark: '#1e293b',
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

  return (
    <div
      ref={certRef}
      className="w-[1000px] h-[707px] min-w-[1000px] min-h-[707px] max-w-[1000px] max-h-[707px] bg-[#fafafa] text-slate-900 shadow-2xl relative select-none flex items-center justify-center p-6 shrink-0 overflow-hidden font-sans border border-slate-300"
      style={{
        boxSizing: 'border-box',
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.03) 0%, transparent 40%),
          radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.03) 0%, transparent 40%),
          linear-gradient(to right, #fafafa, #ffffff, #fafafa)
        `
      }}
    >
      {/* Micro-dot subtle pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #0f172a 1.2px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Luxury Dual Guilloche Border */}
      <div className="absolute inset-3 border-[2px] border-amber-600/30 pointer-events-none rounded-sm" />
      <div className="absolute inset-5 border-[7px] border-double border-slate-800/80 pointer-events-none rounded-sm" />
      
      {/* Corner Ornaments */}
      <div className="absolute top-6 start-6 w-7 h-7 border-t-2 border-s-2 border-amber-500 pointer-events-none" />
      <div className="absolute top-6 end-6 w-7 h-7 border-t-2 border-e-2 border-amber-500 pointer-events-none" />
      <div className="absolute bottom-6 start-6 w-7 h-7 border-b-2 border-s-2 border-amber-500 pointer-events-none" />
      <div className="absolute bottom-6 end-6 w-7 h-7 border-b-2 border-e-2 border-amber-500 pointer-events-none" />

      {/* Main Certificate Inner Canvas */}
      <div className="relative w-full h-full p-5 flex flex-col items-center justify-between text-center z-10">
        
        {/* TOP BRAND HEADER */}
        <div className="w-full flex items-center justify-between px-4 pt-2">
          {/* Left Brand Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-[0.25em] text-slate-900 uppercase">
              Skilliq
            </span>
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-amber-600 uppercase tracking-widest">
              <BadgeCheck className="w-3 h-3 text-amber-600" />
              <span>Academy</span>
            </div>
          </div>

          {/* Right Verification Status */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              {data.isDemo ? 'VERIFIED PREVIEW' : 'OFFICIAL CREDENTIAL'}
            </span>
          </div>
        </div>

        {/* TITLE & HEADING BLOCK */}
        <div className="mt-2 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="h-[1px] w-12 bg-amber-500/60" />
            <span className="text-xs uppercase tracking-[0.35em] text-amber-700 font-black">
              Official Certification
            </span>
            <div className="h-[1px] w-12 bg-amber-500/60" />
          </div>

          <h1 className="text-4xl font-serif font-black tracking-tight text-slate-900 uppercase leading-none">
            Certificate of Completion
          </h1>
          <p className="text-xs text-slate-500 mt-2 uppercase tracking-[0.25em] font-semibold">
            This is proudly presented to
          </p>
        </div>

        {/* STUDENT RECIPIENT NAME */}
        <div className="my-1 w-full max-w-2xl flex flex-col items-center">
          <h2 className="text-4xl font-serif font-bold text-slate-900 tracking-tight italic pb-2 px-12 border-b-2 border-slate-800/80 min-w-[320px]">
            {data.studentName || 'Student Name'}
          </h2>
          <p className="text-xs text-slate-600 mt-2 tracking-wide max-w-xl leading-relaxed">
            for successfully mastering the curriculum, completing all required practical coursework, and demonstrating technical proficiency in
          </p>
        </div>

        {/* COURSE TITLE & SPECIALIZATION */}
        <div className="w-full max-w-3xl px-4 py-1">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-snug line-clamp-2">
            {data.courseTitle}
          </h3>
        </div>

        {/* BOTTOM AUTHENTICATION, SIGNATURE & QR ROW */}
        <div className="w-full grid grid-cols-3 items-end gap-6 px-4 pb-2 border-t border-slate-200 pt-4">
          
          {/* Column 1: Issue Date & QR Code Verification */}
          <div className="flex items-center gap-3 text-start">
            {qrCodeDataUrl ? (
              <img 
                src={qrCodeDataUrl} 
                alt="Verification QR Code" 
                className="w-16 h-16 rounded border border-slate-200 bg-white p-0.5 shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded border border-slate-200 bg-white shrink-0" />
            )}
            <div className="text-[11px] font-mono leading-tight">
              <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-sans font-bold">Issue Date</span>
              <span className="font-bold text-slate-800 block text-xs mt-0.5">{data.issueDate}</span>
              <span className="text-slate-400 block text-[9px] mt-1">Scan QR to verify authenticity</span>
            </div>
          </div>

          {/* Column 2: Center Luxury Gold Seal */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Outer decorative notched ring */}
              <div className="absolute inset-0 rounded-full border-2 border-amber-600/70 border-dashed animate-[spin_120s_linear_infinite]" />
              <div className="absolute inset-1.5 rounded-full border border-amber-500/50 bg-gradient-to-b from-amber-50 via-amber-100/40 to-amber-200/50 flex flex-col items-center justify-center text-amber-800 shadow-sm p-1">
                <ShieldCheck className="w-6 h-6 text-amber-600 mb-0.5" />
                <span className="text-[7.5px] font-black uppercase tracking-wider text-amber-900 leading-none">SKILLIQ VERIFIED</span>
                <span className="text-[6.5px] font-bold text-amber-700/80 uppercase tracking-tight mt-0.5 leading-none">EXCELLENCE</span>
              </div>
            </div>
          </div>

          {/* Column 3: Instructor & Academic Signature */}
          <div className="flex flex-col items-end text-end">
            <div className="w-56 border-b-2 border-slate-400 pb-1 mb-1 text-center">
              <span className="font-serif italic text-base text-slate-800 font-bold block truncate">
                {data.instructorName || 'Mr. Marouan Anouar'}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-slate-600 font-bold block">
              Global Director of ATLAS 1337 Certificates
            </span>
            <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">
              SkilliQ Academic Council & Certification Board
            </span>
          </div>

        </div>

        {/* BOTTOM METADATA BAR */}
        <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-200/60 pt-2 px-2">
          <div>
            <span className="font-sans font-bold uppercase text-[9px] text-slate-400 me-1">CREDENTIAL ID:</span>
            <span className="font-bold text-slate-700">{data.certId}</span>
          </div>
          <div>
            <span className="font-sans font-bold uppercase text-[9px] text-slate-400 me-1">VERIFY AT:</span>
            <span className="text-slate-600 font-semibold">{data.verificationUrl.replace(/^https?:\/\//, '')}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
