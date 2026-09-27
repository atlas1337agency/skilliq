import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Award, 
  ShieldCheck, 
  Search, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  Calendar, 
  BookOpen, 
  FileText, 
  ArrowRight,
  BadgeCheck,
  Layers,
  Flame,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { ScrollingText } from '../components/ScrollingText';
import { PreviewCertificateModal } from '../components/PreviewCertificateModal';
import { cn } from '../lib/utils';

export function CertificatesList() {
  const { t, i18n } = useTranslation();
  const { progress, user, courses, language, setIsAuthModalOpen } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'playlist' | 'masterclass'>('all');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(searchParams.get('preview') === 'true');
  const [copiedCertId, setCopiedCertId] = useState<string | null>(null);

  // Completed courses
  const completedCourses = useMemo(() => {
    return courses.filter(c => progress[c.id]?.isCompleted);
  }, [courses, progress]);

  // Filtered by search & format
  const displayedCertificates = useMemo(() => {
    return completedCourses.filter(c => {
      const matchesSearch = 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.instructor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.category || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterType === 'playlist') {
        return !(c.isSingleVideo === true || String(c.isSingleVideo).toLowerCase() === 'true');
      }
      if (filterType === 'masterclass') {
        return c.isSingleVideo === true || String(c.isSingleVideo).toLowerCase() === 'true';
      }
      return true;
    });
  }, [completedCourses, searchQuery, filterType]);

  const handleCopyLink = (certId: string) => {
    const url = `${window.location.origin}/verify?id=${certId}`;
    navigator.clipboard.writeText(url);
    setCopiedCertId(certId);
    setTimeout(() => setCopiedCertId(null), 2500);
  };

  // Not logged in view: gives option to log in OR try the interactive demo preview
  if (!user) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full px-4 sm:px-6 lg:px-8 py-16 max-w-4xl mx-auto text-center space-y-8">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
          <Award className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-2">
            {t('cert_hub_title', 'Verified Certificates & Credentials')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {t('official_certificates_desc', 'Earn beautifully designed, verified certificates for every course you complete. Prove your skills to employers with your certified Skilliq ID.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl text-xs sm:text-sm shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            {t('login_to_start', 'Log In to View Your Certificates')}
          </button>

          <button
            onClick={() => setIsDemoModalOpen(true)}
            className="px-6 py-3 bg-card border border-border/80 text-foreground font-bold rounded-2xl text-xs sm:text-sm shadow-xs hover:bg-muted transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{t('preview_demo_certificate', 'Preview Demo Certificate')}</span>
          </button>
        </div>

        {/* Interactive Demo Modal */}
        <PreviewCertificateModal
          isOpen={isDemoModalOpen}
          onClose={() => setIsDemoModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-[1400px] mx-auto space-y-10 text-start"
    >
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card/90 to-primary/5 border border-border/80 p-6 sm:p-8 md:p-10 shadow-sm">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-3">
              <Award className="w-3.5 h-3.5" />
              <span>{t('official_certificates', 'Official Certificates')}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              {t('cert_hub_title', 'Verified Certificates & Credentials')}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
              {t('cert_hub_subtitle', 'Access, showcase, and download your verifiable proof of technical mastery.')}
            </p>
          </div>

          {/* Action Button: Preview Demo Certificate */}
          <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-card border border-border/80 hover:bg-muted text-foreground font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t('preview_demo_certificate', 'Preview Demo Certificate')}</span>
            </button>

            <Link
              to="/courses"
              className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <span>{t('explore_courses', 'Explore Courses')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('cert_hub_stat_earned', 'Certificates Earned')}
            </div>
            <div className="text-2xl font-black text-foreground mt-0.5">
              {completedCourses.length}
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('cert_hub_stat_verified', '100% Verifiable')}
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              Skilliq ID
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('cert_hub_stat_skills', 'Skills Credentialed')}
            </div>
            <div className="text-2xl font-black text-foreground mt-0.5">
              {completedCourses.length * 3}+ {isRtl ? 'مهارات' : 'Tech Skills'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR: SEARCH & FORMAT FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('cert_hub_search_placeholder', 'Search certificates by course or instructor...')}
            className="w-full ps-10 pe-4 py-2.5 bg-card border border-border/80 rounded-2xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
          />
        </div>

        {/* Format tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-2xl border border-border/70 self-start sm:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
              filterType === 'all'
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t('cert_hub_all_status', 'All Certificates')} ({completedCourses.length})
          </button>
          <button
            onClick={() => setFilterType('playlist')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
              filterType === 'playlist'
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t('playlist_pill', 'Playlists')}
          </button>
          <button
            onClick={() => setFilterType('masterclass')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
              filterType === 'masterclass'
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t('masterclass', 'Masterclasses')}
          </button>
        </div>
      </div>

      {/* 4. CERTIFICATES GRID */}
      {completedCourses.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 sm:py-20 px-4 bg-card rounded-3xl border border-dashed border-border/80 space-y-4">
          <div className="w-16 h-16 bg-muted rounded-3xl flex items-center justify-center mx-auto text-muted-foreground">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-foreground">
            {t('no_certificates_yet', 'No certificates yet')}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {t('cert_hub_empty_prompt', 'Complete any structured course or masterclass to unlock your first verifiable certificate.')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link 
              to="/courses"
              className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs sm:text-sm shadow-xs hover:bg-primary/90 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>{t('explore_courses', 'Explore Courses')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="px-6 py-2.5 bg-card border border-border/80 text-foreground font-bold rounded-xl text-xs sm:text-sm shadow-xs hover:bg-muted transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t('preview_demo_certificate', 'Preview Demo Certificate')}</span>
            </button>
          </div>
        </div>
      ) : displayedCertificates.length === 0 ? (
        <div className="text-center py-12 px-4 bg-card rounded-3xl border border-border/80">
          <p className="text-sm text-muted-foreground">
            {isRtl ? 'لا توجد شهادات مطابقة لبحثك.' : 'No certificates matching your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCertificates.map((course) => {
            const courseProgress = progress[course.id];
            const date = new Date(courseProgress?.completionDate || Date.now()).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });

            const userIdPrefix = user?.uid ? user.uid.substring(0, 5) : 'DEMO';
            const cIdPrefix = course.id ? course.id.substring(0, 4) : 'XXXX';
            const certId = `NX-${userIdPrefix}-${cIdPrefix}`.toUpperCase();

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex flex-col bg-card rounded-3xl border border-border/80 overflow-hidden hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
              >
                {/* Certificate Preview Card Header */}
                <div className="relative p-6 bg-gradient-to-b from-muted/50 to-muted/20 border-b border-border/80 flex flex-col items-center text-center">
                  
                  {/* Top Seal & Badge */}
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mb-3 shadow-xs group-hover:scale-105 transition-transform">
                    <Award className="w-7 h-7" />
                  </div>

                  {/* Format tag */}
                  <div className="absolute top-4 start-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-background/80 backdrop-blur px-2.5 py-1 rounded-md border border-border/50 text-foreground">
                      {course.isSingleVideo ? t('masterclass', 'Masterclass') : t('playlist_pill', 'Playlist')}
                    </span>
                  </div>

                  <div className="absolute top-4 end-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      <span>{isRtl ? 'موثقة' : 'Verified'}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-base sm:text-lg mb-1 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>

                  <div className="text-xs text-muted-foreground w-full truncate">
                    <ScrollingText>{course.instructor}</ScrollingText>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                  {/* Meta strip */}
                  <div className="space-y-2 text-xs bg-muted/30 p-3 rounded-2xl border border-border/50">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>{t('date', 'Issue Date')}</span>
                      </span>
                      <span className="font-semibold text-foreground">{date}</span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40 font-mono text-[11px]">
                      <span>{t('cert_hub_credential_id', 'Credential ID')}</span>
                      <span className="font-bold text-foreground">{certId}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to={`/certificate/${course.id}`}
                      className="col-span-2 py-2.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>{t('view_certificate', 'View Certificate')}</span>
                    </Link>

                    <button
                      onClick={() => handleCopyLink(certId)}
                      className="py-2 px-2 bg-muted hover:bg-muted/80 text-foreground border border-border/80 rounded-xl font-bold text-center text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedCertId === certId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">{t('cert_hub_link_copied', 'Copied!')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{t('cert_hub_copy_link', 'Copy Link')}</span>
                        </>
                      )}
                    </button>

                    <Link
                      to={`/verify?id=${certId}`}
                      className="py-2 px-2 bg-muted hover:bg-muted/80 text-foreground border border-border/80 rounded-xl font-bold text-center text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t('verify_certificate', 'Verify')}</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 5. INTERACTIVE DEMO CERTIFICATE MODAL */}
      <PreviewCertificateModal
        isOpen={isDemoModalOpen}
        onClose={() => {
          setIsDemoModalOpen(false);
          // Clean up url param if present
          if (searchParams.get('preview')) {
            searchParams.delete('preview');
            setSearchParams(searchParams);
          }
        }}
      />
    </div>
  );
}
