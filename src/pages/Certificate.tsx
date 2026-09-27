import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { 
  ArrowLeft, 
  Download, 
  Award, 
  ShieldCheck, 
  BadgeCheck, 
  FileImage, 
  FileText, 
  Share2, 
  Copy, 
  Check, 
  Printer, 
  Sparkles,
  Lock,
  ArrowRight,
  QrCode
} from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { CertificateDocument, CertificateData } from '../components/CertificateDocument';
import { ResponsiveCertificateViewer } from '../components/ResponsiveCertificateViewer';

export function Certificate() {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isPreview = searchParams.get('preview') === 'true' || courseId === 'demo';
  const { t, i18n } = useTranslation();
  const { progress, userName, user, courses, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const certRef = useRef<HTMLDivElement>(null);
  const [certId, setCertId] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Calculate certificate ID
  useEffect(() => {
    if (isPreview) {
      setCertId('NX-SKILLIQ-DEMO-VERIFIED');
    } else {
      const userIdPrefix = user?.uid ? user.uid.substring(0, 6) : 'DEMO';
      const cIdPrefix = courseId ? courseId.substring(0, 4) : 'DEMO';
      const timestamp = progress[courseId || '']?.completionDate 
        ? new Date(progress[courseId || ''].completionDate!).getTime().toString().slice(-6)
        : '889120';
        
      setCertId(`NX-${userIdPrefix}-${cIdPrefix}-${timestamp}`.toUpperCase());
    }
  }, [user, courseId, progress, isPreview]);

  // If not logged in and not preview
  if (!user && !isPreview) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full px-4 md:px-8 py-20 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black mb-2 text-foreground">{t('please_log_in', 'Please Log In')}</h2>
        <p className="text-muted-foreground text-sm mb-6">{t('need_to_be_logged_in', 'You need to be logged in to view your certificates.')}</p>
        <Link 
          to="/certificates?preview=true"
          className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs sm:text-sm shadow-xs inline-block"
        >
          {t('preview_demo_certificate', 'Preview Demo Certificate')}
        </Link>
      </div>
    );
  }

  const courseRaw = courses.find(c => c.id === courseId);
  const course = courseRaw || (isPreview ? { 
    title: isRtl 
      ? 'تطوير تطبيقات الويب المتكاملة وهندسة البرمجيات الحديثة' 
      : 'Full-Stack Web Development & Modern Software Architecture', 
    id: 'demo',
    instructor: 'Mr. Marouan Anouar'
  } : null);
  const courseProgress = progress[courseId || ''];

  if (!course) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full px-4 md:px-8 py-20 text-center max-w-md mx-auto">
        <h2 className="text-2xl font-black mb-2 text-foreground">{t('certificate_not_available', 'Certificate Not Available')}</h2>
        <p className="text-muted-foreground text-sm mb-6">{t('course_not_found', 'Course could not be found.')}</p>
        <Link to="/courses" className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs sm:text-sm">
          {t('return_to_courses', 'Return to Courses')}
        </Link>
      </div>
    );
  }

  if (!isPreview && (!courseProgress || !courseProgress.isCompleted)) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full px-4 md:px-8 py-20 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
          <Award className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black mb-2 text-foreground">{t('certificate_not_available', 'Certificate Incomplete')}</h2>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          {t('complete_course_to_view', 'You need to complete all lessons in this course to view and download your official certificate.')}
        </p>
        <div className="flex justify-center gap-3">
          <Link to={`/course/${course.id}`} className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs sm:text-sm">
            {t('continue_watching', 'Continue Lessons')}
          </Link>
          <Link to={`/certificate/${course.id}?preview=true`} className="px-5 py-2.5 bg-card border border-border text-foreground font-bold rounded-xl text-xs sm:text-sm">
            {t('preview_demo_certificate', 'Preview Demo')}
          </Link>
        </div>
      </div>
    );
  }

  const dateRaw = courseProgress?.completionDate ? new Date(courseProgress.completionDate) : new Date();
  const dateFormatted = dateRaw.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const studentDisplayName = user?.displayName || userName || (isRtl ? 'اسم الطالب' : 'Student Name');

  const certificateData: CertificateData = {
    certId,
    studentName: studentDisplayName,
    courseTitle: course.title,
    instructorName: 'Mr. Marouan Anouar',
    issueDate: dateFormatted,
    verificationUrl: `${window.location.origin}/verify?id=${certId}`,
    isDemo: isPreview
  };

  const handleDownloadPDF = async () => {
    if (isPreview || !certRef.current) return;
    setIsDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 60));
    
    try {
      const dataUrl = await htmlToImage.toJpeg(certRef.current, { 
        quality: 1.0, 
        pixelRatio: 2,
        canvasWidth: 1000 * 2,
        canvasHeight: 707 * 2
      });
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1000, 707]
      });
      
      pdf.addImage(dataUrl, 'JPEG', 0, 0, 1000, 707);
      pdf.save(`${course.title.replace(/\s+/g, '_')}_Certificate.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadJPG = async () => {
    if (isPreview || !certRef.current) return;
    setIsDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 60));
    
    try {
      const dataUrl = await htmlToImage.toJpeg(certRef.current, { 
        quality: 1.0, 
        pixelRatio: 2,
        canvasWidth: 1000 * 2,
        canvasHeight: 707 * 2
      });
      
      const link = document.createElement('a');
      link.download = `${course.title.replace(/\s+/g, '_')}_Certificate.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate JPG', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/verify?id=${certId}`;
    navigator.clipboard.writeText(url);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/verify?id=${certId}`;
    const text = `I just earned an official verified certificate in "${course.title}" from Skilliq Academy! 🚀`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Skilliq Verified Certificate',
          text,
          url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    }
  };

  const handlePrint = () => {
    if (!isPreview) {
      window.print();
    }
  };

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="w-full min-h-screen bg-muted/20 pb-16 text-start"
    >
      
      {/* 1. TOP FLOATING TOOLBAR */}
      <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-md border-b border-border/80 px-4 sm:px-6 lg:px-8 py-3.5 print:hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left: Back Link & Status Badge */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 rounded-xl bg-card border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs"
              title={t('back', 'Back')}
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                  {course.title}
                </span>
                {isPreview ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    {isRtl ? 'معاينة النموذج' : 'Demo Preview'}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">ID: {certId}</span>
            </div>
          </div>

          {/* Right: Actions Row */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* If in Preview: User cannot download; show locked state or CTA */}
            {isPreview ? (
              <div className="flex items-center gap-2">
                <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isRtl ? 'التحميل متاح فور إكمال الدورة' : 'Downloads unlock upon course completion'}</span>
                </div>

                <Link
                  to="/courses"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{isRtl ? 'تصفح الدورات' : 'Explore Courses'}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
              </div>
            ) : (
              /* Real Earned Certificate Actions */
              <>
                {/* Copy Verify Link */}
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-xl bg-card border border-border/80 hover:bg-muted text-foreground text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  {copyFeedback ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">{t('cert_hub_link_copied', 'Copied!')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-primary" />
                      <span>{t('cert_hub_copy_link', 'Copy Link')}</span>
                    </>
                  )}
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="px-3.5 py-2 rounded-xl bg-card border border-border/80 hover:bg-muted text-foreground text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Share2 className="w-3.5 h-3.5 text-primary" />
                  <span className="hidden sm:inline">{t('cert_hub_share', 'Share')}</span>
                </button>

                {/* Print */}
                <button
                  onClick={handlePrint}
                  className="hidden lg:flex px-3.5 py-2 rounded-xl bg-card border border-border/80 hover:bg-muted text-foreground text-xs font-bold transition-all shadow-xs items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Printer className="w-3.5 h-3.5 text-primary" />
                  <span>{t('cert_hub_print', 'Print')}</span>
                </button>

                {/* Download JPG */}
                <button
                  onClick={handleDownloadJPG}
                  disabled={isDownloading}
                  className="px-3.5 py-2 rounded-xl bg-card border border-border/80 hover:bg-muted text-foreground text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <FileImage className="w-3.5 h-3.5 text-primary" />
                  <span>JPG</span>
                </button>

                {/* Download PDF */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>

                {/* Verify Page Link */}
                <Link
                  to={`/verify?id=${certId}`}
                  className="px-3.5 py-2 rounded-xl bg-foreground text-background hover:bg-foreground/90 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">{t('verify_certificate', 'Verify')}</span>
                </Link>
              </>
            )}

          </div>

        </div>
      </div>

      {/* 2. DEMO NOTICE BANNER (Only in preview mode) */}
      {isPreview && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 print:hidden">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground">
                  {isRtl ? 'معاينة رسمية دقيقة لشهادات SkilliQ' : 'Official SkilliQ Credential Preview'}
                </h4>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                  {isRtl 
                    ? 'الشهادة موقعة ومعتمدة من قبل: Mr. Marouan Anouar - Global Director of ATLAS 1337 Certificates'
                    : 'Certified & Signed by: Mr. Marouan Anouar — Global Director of ATLAS 1337 Certificates'}
                </p>
              </div>
            </div>

            <Link
              to="/courses"
              className="w-full sm:w-auto px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <span>{isRtl ? 'ابدأ دورة للحصول على الشهادة' : 'Start a Course to Earn Yours'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      )}

      {/* 3. CERTIFICATE CANVAS PRESENTATION VIEWPORT */}
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-6 pt-6 pb-12 flex flex-col items-center justify-center print:p-0 print:m-0">
        
        {/* Responsive Certificate Viewer: 100% full view on mobile, tablet, and laptop */}
        <div className="w-full flex items-center justify-center overflow-visible py-2">
          <ResponsiveCertificateViewer
            data={certificateData}
            certRef={certRef}
            isDownloading={isDownloading}
            maxScale={1}
            fitMode="contain"
          />
        </div>

        {/* Footer tip */}
        <div className="mt-4 text-center print:hidden">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{t('cert_hub_qr_scan', 'Scan QR to verify authenticity instantly on Skilliq')}</span>
          </p>
        </div>

      </div>

    </div>
  );
}
