import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Search, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Verify() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const initialId = searchParams.get('id') || '';
  
  const [certId, setCertId] = useState(initialId);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<'valid' | 'invalid' | null>(null);

  useEffect(() => {
    if (initialId && !isVerifying && result === null) {
      handleVerify(initialId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = (idToVerify: string) => {
    if (!idToVerify.trim()) return;
    
    setIsVerifying(true);
    setResult(null);
    setSearchParams({ id: idToVerify });

    setTimeout(() => {
      // Basic mock validation logic
      if (idToVerify.toUpperCase().startsWith('NX-') && idToVerify.length > 10) {
        setResult('valid');
      } else {
        setResult('invalid');
      }
      setIsVerifying(false);
    }, 1500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-16 min-h-[80vh] flex flex-col items-center">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold mb-4">{t('verify_certificate') || 'Verify Certificate'}</h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">
          {t('verify_desc') || 'Enter the certificate ID below to verify its authenticity and check the details of the achievement.'}
        </p>
      </div>

      <div className="w-full max-w-md">
        <form onSubmit={(e) => { e.preventDefault(); handleVerify(certId); }} className="relative mb-6">
          <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-muted-foreground">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={certId}
            onChange={(e) => setCertId(e.target.value.toUpperCase())}
            placeholder="e.g. NX-XXXX-XXXX-123456"
            className="w-full bg-card border-2 border-border focus:border-primary rounded-xl py-3.5 ps-12 pe-4 outline-none font-mono uppercase tracking-wider text-center text-lg transition-colors"
          />
        </form>

        <button
          onClick={() => handleVerify(certId)}
          disabled={!certId.trim() || isVerifying}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-12"
        >
          {isVerifying ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> {t('verifying') || 'Verifying...'}</>
          ) : (
            <>{t('verify') || 'Verify Now'}</>
          )}
        </button>

        <div className="min-h-[200px]">
          <AnimatePresence mode="wait">
            {result === 'valid' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center"
              >
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">Certificate Valid</h3>
                <p className="text-muted-foreground mb-4 font-mono text-sm">{certId}</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">This is an officially verified certificate issued by Skilliq.</p>
              </motion.div>
            )}

            {result === 'invalid' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center"
              >
                <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mb-2">Invalid Certificate</h3>
                <p className="text-muted-foreground mb-4 font-mono text-sm">{certId}</p>
                <p className="text-sm text-rose-700 dark:text-rose-300">We could not find a certificate matching this ID in our records. Please check the ID and try again.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
