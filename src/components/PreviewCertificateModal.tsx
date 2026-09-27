import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  X, 
  Award, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  QrCode,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { motion } from 'motion/react';
import { ResponsiveCertificateViewer } from './ResponsiveCertificateViewer';
import { CertificateData } from './CertificateDocument';
import { useStore } from '../store/useStore';

interface PreviewCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PreviewCertificateModal({ isOpen, onClose }: PreviewCertificateModalProps) {
  const { t, i18n } = useTranslation();
  const { user, userName, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [isZoomed, setIsZoomed] = useState(false);

  const studentDisplayName = user?.displayName || userName || (isRtl ? 'اسم الطالب (نموذج معتمد)' : 'Student Name (Verified Sample)');

  const certData: CertificateData = useMemo(() => {
    const certId = 'NX-SKILLIQ-DEMO-VERIFIED';
    return {
      certId,
      studentName: studentDisplayName,
      courseTitle: isRtl 
        ? 'تطوير تطبيقات الويب المتكاملة وهندسة البرمجيات الحديثة'
        : 'Full-Stack Web Development & Modern Software Architecture',
      instructorName: 'Mr. Marouan Anouar',
      issueDate: new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      verificationUrl: `${window.location.origin}/verify?id=${certId}`,
      isDemo: true
    };
  }, [studentDisplayName, isRtl]);

  if (!isOpen) return null;

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-card w-full max-w-5xl h-[92vh] sm:h-[90vh] max-h-[96vh] rounded-2xl sm:rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden text-start my-auto"
      >
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-border/80 bg-muted/30 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-black text-foreground tracking-tight">
                  {isRtl ? 'معاينة نموذج الشهادة الرسمية الكاملة' : 'Official Full Certificate Preview'}
                </h2>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  {isRtl ? 'نموذج للمعاينة' : 'Preview'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 hidden min-[400px]:block">
                {isRtl 
                  ? 'هكذا ستظهر شهادتك الرسمية الموثقة بكامل تفاصيلها فور إكمال دروس أي مسار تعليمي'
                  : 'Full, uncropped preview of the certificate you earn upon completing any course playlist.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* NOTICE BANNER: DOWNLOADS LOCKED UNTIL COMPLETION */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-3.5 sm:px-5 py-2.5 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold text-[11px] sm:text-xs">
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="line-clamp-2 sm:line-clamp-1">
              {isRtl 
                ? 'التحميل متاح فور إكمال الدورة • إمكانية تحميل الشهادة بجودة عالية (PDF/JPG) تُفتح تلقائياً بعد إتمام الدورة'
                : 'Downloads are disabled in sample preview • High-resolution PDF & JPG downloads unlock once you complete a course'}
            </span>
          </div>

          {/* Zoom toggle button for mobile/tablet */}
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border/80 text-[11px] font-bold text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
          >
            {isZoomed ? (
              <>
                <ZoomOut className="w-3.5 h-3.5 text-primary" />
                <span>{isRtl ? 'ملاءمة الشاشة' : 'Fit Screen'}</span>
              </>
            ) : (
              <>
                <ZoomIn className="w-3.5 h-3.5 text-primary" />
                <span>{isRtl ? 'تكبير 100%' : 'Zoom 100%'}</span>
              </>
            )}
          </button>
        </div>

        {/* CERTIFICATE PREVIEW VIEWPORT: 100% Full View from Top to Bottom */}
        <div className="flex-1 min-h-0 bg-muted/30 p-2 sm:p-3 md:p-4 flex flex-col items-center justify-center overflow-hidden">
          
          <div className="w-full h-full flex-1 min-h-0 flex items-center justify-center overflow-hidden">
            {isZoomed ? (
              /* 100% Full-size Zoom view with smooth scrolling */
              <div className="w-full h-full overflow-auto flex items-center justify-start sm:justify-center p-2">
                <div className="min-w-[1000px] shrink-0 py-2">
                  <ResponsiveCertificateViewer
                    data={certData}
                    maxScale={1}
                    fitMode="width"
                  />
                </div>
              </div>
            ) : (
              /* Complete Top to Bottom Contain View: Zero cropping */
              <ResponsiveCertificateViewer
                data={certData}
                maxScale={1}
                fitMode="contain"
              />
            )}
          </div>

          {/* Quick verification note below certificate */}
          <div className="mt-2 shrink-0 flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              {isRtl 
                ? 'شهادة كاملة من الحافة العلوية للسفلية • امسح رمز QR للتحقق المباشر من منصة SkilliQ' 
                : 'Complete top-to-bottom credential • Scan QR code to verify authenticity instantly on SkilliQ'}
            </span>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:p-4 md:p-5 border-t border-border/80 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">
              {isRtl 
                ? 'معتمدة وموقعة: Mr. Marouan Anouar — Global Director of ATLAS 1337 Certificates'
                : 'Certified: Mr. Marouan Anouar — Global Director of ATLAS 1337 Certificates'}
            </span>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 sm:py-2.5 rounded-xl border border-border/80 bg-card hover:bg-muted text-foreground text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98"
            >
              {isRtl ? 'إغلاق' : 'Close'}
            </button>

            <Link
              to="/courses"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
            >
              <span>{isRtl ? 'تصفح الدورات' : 'Explore Courses'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
