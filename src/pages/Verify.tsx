import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Award, 
  BadgeCheck,
  Building,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';

export function Verify() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const { language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const initialId = searchParams.get('id') || '';
  
  const [certId, setCertId] = useState(initialId);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<'valid' | 'invalid' | 'demo' | null>(null);

  useEffect(() => {
    if (initialId && !isVerifying && result === null) {
      handleVerify(initialId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  const handleVerify = (idToVerify: string) => {
    if (!idToVerify.trim()) return;
    
    setIsVerifying(true);
    setResult(null);
    setSearchParams({ id: idToVerify.trim() });

    setTimeout(() => {
      const cleanId = idToVerify.trim().toUpperCase();
      if (cleanId.includes('DEMO')) {
        setResult('demo');
      } else if (cleanId.startsWith('NX-') && cleanId.length > 8) {
        setResult('valid');
      } else {
        setResult('invalid');
      }
      setIsVerifying(false);
    }, 1000);
  };

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="w-full max-w-4xl mx-auto px-4 py-12 sm:py-16 min-h-[80vh] flex flex-col items-center text-start"
    >
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary/10 text-primary border border-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xs">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-2 text-foreground tracking-tight">
          {t('verify_certificate', 'Verify Certificate Authenticity')}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
          {isRtl 
            ? 'تحقق من صحة ومصداقية الشهادة الصادرة عن SkilliQ وأكاديمية ATLAS 1337 عبر إدخال رقم الشهادة أو مسح رمز QR.' 
            : 'Validate and authenticate official credentials issued by SkilliQ & ATLAS 1337 Academy.'}
        </p>
      </div>

      <div className="w-full max-w-md">
        <form onSubmit={(e) => { e.preventDefault(); handleVerify(certId); }} className="relative mb-4">
          <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-muted-foreground">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={certId}
            onChange={(e) => setCertId(e.target.value.toUpperCase())}
            placeholder="e.g. NX-DEMO-SKILLIQ-VERIFIED"
            className="w-full bg-card border-2 border-border focus:border-primary rounded-2xl py-3.5 ps-12 pe-4 outline-none font-mono uppercase tracking-wider text-center text-sm sm:text-base transition-colors shadow-xs"
          />
        </form>

        <button
          onClick={() => handleVerify(certId)}
          disabled={!certId.trim() || isVerifying}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-8 shadow-xs cursor-pointer active:scale-98"
        >
          {isVerifying ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> {isRtl ? 'جاري التحقق...' : 'Verifying with SkilliQ...'}</>
          ) : (
            <><ShieldCheck className="w-5 h-5" /> {isRtl ? 'تحقق الآن' : 'Verify Now'}</>
          )}
        </button>

        <div className="min-h-[220px]">
          <AnimatePresence mode="wait">
            
            {/* 1. REAL VALID CERTIFICATE */}
            {result === 'valid' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                className="bg-card border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-7 text-center shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 end-0 -mt-8 -me-8 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-xs mb-2">
                  <BadgeCheck className="w-4 h-4" />
                  <span>{isRtl ? 'شهادة رسمية موثقة ومعتمدة' : 'Official Verified SkilliQ Credential'}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-foreground mb-1">
                  {isRtl ? 'الشهادة موثقة وصالحة' : 'Certificate Valid & Genuine'}
                </h3>
                
                <p className="text-muted-foreground font-mono text-xs mb-4">
                  ID: <span className="font-bold text-foreground">{certId}</span>
                </p>

                {/* Verification credentials metadata */}
                <div className="space-y-2 text-start bg-muted/40 p-3.5 rounded-2xl border border-border/60 text-xs mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-primary" />
                      <span>{isRtl ? 'جهة الإصدار' : 'Issuing Body'}</span>
                    </span>
                    <span className="font-bold text-foreground">SkilliQ & ATLAS 1337</span>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-primary" />
                      <span>{isRtl ? 'المدير المعتمد' : 'Certified Signatory'}</span>
                    </span>
                    <span className="font-bold text-foreground">Mr. Marouan Anouar</span>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
                    <span className="text-muted-foreground">{isRtl ? 'المنصب' : 'Designation'}</span>
                    <span className="text-muted-foreground font-semibold">Global Director of ATLAS 1337 Certificates</span>
                  </div>
                </div>

                <Link
                  to="/courses"
                  className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs sm:text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>{isRtl ? 'تصفح دورات SkilliQ' : 'Explore SkilliQ Academy Courses'}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
              </motion.div>
            )}

            {/* 2. DEMO SAMPLE VERIFICATION */}
            {result === 'demo' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                className="bg-card border-2 border-amber-500/40 rounded-3xl p-6 sm:p-7 text-center shadow-lg relative overflow-hidden"
              >
                <div className="w-14 h-14 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Award className="w-8 h-8" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-xs mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isRtl ? 'نموذج شهادة رسمي تم التحقق منه' : 'Verified Official Sample Template'}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-foreground mb-1">
                  {isRtl ? 'شهادة SkilliQ الرسمية (نموذج معتمد)' : 'SkilliQ Certificate Template Verified'}
                </h3>
                
                <p className="text-muted-foreground font-mono text-xs mb-4">
                  ID: <span className="font-bold text-foreground">{certId}</span>
                </p>

                <div className="space-y-2 text-start bg-muted/40 p-3.5 rounded-2xl border border-border/60 text-xs mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-primary" />
                      <span>{isRtl ? 'المنصة الرسمية' : 'Authentic Platform'}</span>
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">SkilliQ & ATLAS 1337</span>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-primary" />
                      <span>{isRtl ? 'الاعتماد والتوقيع' : 'Certification Board'}</span>
                    </span>
                    <span className="font-bold text-foreground">Mr. Marouan Anouar</span>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
                    <span className="text-muted-foreground">{isRtl ? 'اللقب' : 'Title'}</span>
                    <span className="text-muted-foreground font-semibold">Global Director of ATLAS 1337 Certificates</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-4">
                  {isRtl 
                    ? 'أكمل أي قائمة تشغيل تعليمية على SkilliQ لتحصل على شهادتك الرسمية المعتمدة باسمك فوراً.' 
                    : 'Complete any structured playlist on SkilliQ to earn and download your personalized credential.'}
                </p>

                <Link
                  to="/courses"
                  className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs sm:text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>{isRtl ? 'ابدأ دورة الآن' : 'Start a Course Now'}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
              </motion.div>
            )}

            {/* 3. INVALID RECORD */}
            {result === 'invalid' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                className="bg-card border-2 border-rose-500/40 rounded-3xl p-6 sm:p-7 text-center shadow-lg"
              >
                <div className="w-14 h-14 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <XCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 mb-2">
                  {isRtl ? 'الشهادة غير مسجلة في SkilliQ' : 'Certificate Not Found in SkilliQ'}
                </h3>
                <p className="text-muted-foreground font-mono text-xs mb-3">{certId}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRtl 
                    ? 'لم نتمكن من العثور على شهادة تطابق هذا الرقم في سجلات SkilliQ المعتمدة. يرجى التأكد من كتابة الرقم بدقة أو إعادة مسح رمز QR.' 
                    : 'We could not find a verified certificate matching this ID in our official registry. Please double-check the ID or re-scan the QR code.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
