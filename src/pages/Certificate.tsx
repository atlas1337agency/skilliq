import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { ArrowLeft, Download, Award, ShieldCheck, BadgeCheck, FileImage, FileText, Share2 } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

export function Certificate() {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isPreview = searchParams.get('preview') === 'true';
  const { t } = useTranslation();
  const { progress, userName, user, courses } = useStore();
  const certRef = useRef<HTMLDivElement>(null);
  const [certId, setCertId] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Generate a pseudo-random looking but deterministic ID
    const userIdPrefix = user?.uid ? user.uid.substring(0, 6) : 'DEMO';
    const cIdPrefix = courseId ? courseId.substring(0, 4) : 'XXXX';
    const timestamp = progress[courseId || '']?.completionDate 
      ? new Date(progress[courseId || ''].completionDate!).getTime().toString().slice(-6)
      : '000000';
      
    setCertId(`NX-${userIdPrefix}-${cIdPrefix}-${timestamp}`.toUpperCase());
  }, [user, courseId, progress]);

  if (!user && !isPreview) {
    return (
      <div className="w-full px-4 md:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">{t('please_log_in')}</h2>
        <p className="text-muted-foreground mb-6">{t('need_to_be_logged_in')}</p>
      </div>
    );
  }

  if (courses.length === 0 && !isPreview) {
    return (
      <div className="w-full px-4 md:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">{t('loading')}</h2>
      </div>
    );
  }

  const courseRaw = courses.find(c => c.id === courseId);
  const course = courseRaw || (isPreview ? { 
    title: t('demo_course_title', 'Full-Stack Web Development'), 
    id: 'demo',
    instructor: 'NEXA 1337 Admin'
  } : null);
  const courseProgress = progress[courseId || ''];

  if (!course) {
    return (
      <div className="w-full px-4 md:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">{t('certificate_not_available')}</h2>
        <p className="text-muted-foreground mb-6">{t('course_not_found')}</p>
        <Link to="/" className="text-primary hover:underline">{t('return_to_courses')}</Link>
      </div>
    );
  }

  if (!isPreview && (!courseProgress || !courseProgress.isCompleted)) {
    return (
      <div className="w-full px-4 md:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">{t('certificate_not_available')}</h2>
        <p className="text-muted-foreground mb-6">{t('complete_course_to_view', 'You need to complete the course to view your certificate.')}</p>
        <Link to="/" className="text-primary hover:underline">{t('return_to_courses')}</Link>
      </div>
    );
  }

  const dateRaw = courseProgress?.completionDate ? new Date(courseProgress.completionDate) : new Date();
  const date = dateRaw.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    setIsDownloading(true);
    // Wait for the state to propagate and the DOM to update (stamp hidden)
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      // Force dimensions to avoid scale cropping issues
      const dataUrl = await htmlToImage.toJpeg(certRef.current, { 
        quality: 1.0, 
        pixelRatio: 2,
        canvasWidth: 1000 * 2,
        canvasHeight: 707 * 2,
        filter: (node) => {
          if (node.classList?.contains('hide-on-download') || node.classList?.contains('invisible')) {
            return false;
          }
          return true;
        }
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
    if (!certRef.current) return;
    setIsDownloading(true);
    // Wait for the state to propagate and the DOM to update (stamp hidden)
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      const dataUrl = await htmlToImage.toJpeg(certRef.current, { 
        quality: 1.0, 
        pixelRatio: 2,
        canvasWidth: 1000 * 2,
        canvasHeight: 707 * 2,
        filter: (node) => {
          if (node.classList?.contains('hide-on-download') || node.classList?.contains('invisible')) {
            return false;
          }
          return true;
        }
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

  const handleShare = async () => {
    const url = `${window.location.origin}/verify?id=${certId}`;
    const text = `I just earned a certificate in ${course.title} from Skilliq! 🚀`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Skilliq Certificate',
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

  return (
    <div className="w-full px-4 md:px-8 py-8 min-h-screen bg-muted/30">
      <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit group">
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          <span className="font-medium group-hover:underline">{t('back', 'Back')}</span>
        </button>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {isPreview ? (
            <div className="px-4 py-2 bg-primary/10 text-primary font-medium rounded-full text-sm flex items-center gap-2">
              <Award className="w-4 h-4" />
              {t('complete_course_to_download', 'Complete a course to download')}
            </div>
          ) : (
            <>
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 outline outline-1 outline-border bg-card text-foreground rounded-full font-bold hover:bg-muted transition-all active:scale-95 shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>

              <button 
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-full font-bold hover:bg-primary/20 transition-all active:scale-95 shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
              
              <button 
                onClick={handleDownloadJPG}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-full font-bold hover:bg-primary/20 transition-all active:scale-95 shadow-sm"
              >
                <FileImage className="w-4 h-4" />
                <span className="hidden sm:inline">Download JPG</span>
                <span className="sm:hidden">JPG</span>
              </button>
              
              <Link 
                to={`/verify?id=${certId}`}
                className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background rounded-full font-bold hover:bg-foreground/90 transition-all active:scale-95 shadow-sm hover:shadow"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">{t('verify_certificate') || 'Verify Certificate'}</span>
                <span className="sm:hidden">Verify</span>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-center w-full max-w-5xl mx-auto overflow-hidden pb-8 print:p-0">
        <div className="w-full relative flex justify-center origin-top scale-[0.30] min-[380px]:scale-[0.35] sm:scale-50 md:scale-75 lg:scale-100 h-[220px] min-[380px]:h-[250px] sm:h-[360px] md:h-[530px] lg:h-[707px] print:scale-100 print:h-[707px]">
          {/* Certificate Outermost Wrapper */}
          <div 
            ref={certRef}
            className="w-[1000px] h-[707px] min-w-[1000px] bg-white text-slate-900 absolute top-0 shadow-2xl print:shadow-none print:w-[1000px] print:h-[707px] print:m-0 flex items-center justify-center p-8 shrink-0 overflow-hidden"
          >
          {/* Decorative Border & Background Pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '32px 32px' }}>
          </div>
          <div className="absolute top-0 end-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -me-48 -mt-48 pointer-events-none" />
          <div className="absolute bottom-0 start-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -ms-48 -mb-48 pointer-events-none" />

          {/* Inner Frame */}
          <div className="relative w-full h-full border-[12px] border-double border-slate-200 p-12 flex flex-col items-center text-center z-10 bg-white/80 backdrop-blur-sm">
            
            {/* School Header */}
            <div className="absolute top-10 start-0 end-0 flex justify-center items-center gap-3">
              <span className="text-slate-800 font-black text-2xl tracking-[0.3em] uppercase whitespace-nowrap">
                Skilliq
              </span>
              <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Learn</span>
                <span className="text-blue-500">
                  <BadgeCheck className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="mt-16 flex flex-col items-center w-full grow">
              
              <h1 className="text-5xl font-serif font-black text-slate-900 mb-6 tracking-tight uppercase">
                {t('certificate_of_completion')}
              </h1>
              
              <p className="text-lg text-slate-500 mb-10 uppercase tracking-[0.25em] font-medium">
                {t('this_certifies_that')}
              </p>
              
              {/* Student Name */}
              <h2 className="text-5xl font-serif font-bold text-primary mb-8 border-b border-dashed border-slate-300 pb-4 inline-block px-16 italic">
                {user?.displayName || userName || t('demo_student', 'Demo Student')}
              </h2>
              
              <p className="text-lg text-slate-600 mb-6">
                {t('has_successfully_completed')}
              </p>
              
              {/* Course Title */}
              <h3 className="text-3xl font-bold text-slate-800 mb-auto max-w-3xl leading-snug">
                {course.title}
              </h3>

              {/* Bottom Info Grid */}
              <div className="grid grid-cols-3 w-full mt-auto mb-4 items-end gap-6 px-4">
                
                {/* Date */}
                <div className="col-start-1 text-start font-serif">
                  <div className="border-b-2 border-slate-400 pb-2 mb-3">
                    <span className="font-semibold text-xl text-slate-800">{date}</span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-500 uppercase tracking-[0.15em] font-bold">{t('date')}</p>
                </div>

                {/* Secure Stamp (Hidden During Download) */}
                <div className={`col-start-2 flex justify-center items-center min-h-[120px] hide-on-download ${isDownloading ? 'invisible' : 'visible'}`}>
                  <div className="relative w-28 h-28 flex items-center justify-center opacity-90 hover:scale-105 transition-transform duration-150">
                    <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-dashed animate-[spin_60s_linear_infinite]" />
                    <div className="absolute inset-2 rounded-full border bg-amber-50 flex flex-col items-center justify-center text-amber-600 shadow-inner">
                      <ShieldCheck className="w-8 h-8 mb-0.5 text-amber-500" />
                      <span className="text-[8px] font-black uppercase tracking-tight leading-none text-amber-700">Skilliq</span>
                      <span className="text-[7.5px] font-bold uppercase tracking-tighter leading-none mt-1 opacity-80">{t('officially_verified')}</span>
                    </div>
                  </div>
                </div>

                {/* Instructor */}
                <div className="col-start-3 text-end font-serif">
                  <div className="border-b-2 border-slate-400 pb-2 mb-3">
                    <span className="font-semibold text-xl text-slate-800 italic">{course.instructor}</span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-500 uppercase tracking-[0.15em] font-bold">{t('instructor')}</p>
                </div>

              </div>
            </div>

            {/* Certificate Verify Footer */}
            <div className="absolute bottom-6 w-full px-12 flex justify-between items-end text-[10px] items-center text-slate-400 font-mono">
              <div className="text-start">
                <span className="uppercase font-bold tracking-wider">{t('certificate_id')}</span><br/>
                <span className="text-slate-600">{certId}</span>
              </div>
              <div className="text-end">
                <span className="uppercase font-bold tracking-wider">{t('verify_at')}</span><br/>
                <span className="text-slate-600 font-bold">skilliq.com/verify</span>
              </div>
            </div>

          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
