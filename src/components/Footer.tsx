import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, MousePointerClick, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const LINKS = [
  { name: 'N E X A 1337', url: 'https://nexa1337.github.io/nexa1337', clicks: '112.4K' },
  { name: 'N E X A 1337 - Secret area', url: 'https://secretarea.vercel.app', clicks: '89.1K' },
  { name: 'N E X A 1337 - Digital Store', url: 'https://digitalstore-iota-five.vercel.app/', clicks: '76.3K' },
  { name: 'N E X A 1337 - Tool', url: 'https://nexa1337.github.io/tool', clicks: '65.8K' },
  { name: 'N E X A 1337 - Tool V2', url: 'https://nexa1337.github.io/toolv2', clicks: '42.9K' },
  { name: 'Skilliq', url: 'https://school-lime-psi.vercel.app', clicks: '34.2K' },
];

export function Footer() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <footer className="w-full border-t border-border bg-card py-8 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-center justify-center gap-4">
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm font-semibold text-muted-foreground mb-2">
            <Link to="/about" className="hover:text-primary transition-colors">{t('about_us', 'About Us')}</Link>
            <Link to="/copyright" className="hover:text-primary transition-colors">{t('copyright_disclaimer', 'Copyright / Disclaimer')}</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">{t('contact_us', 'Contact Us')}</Link>
            <Link to="/verify" className="hover:text-primary transition-colors">{t('verify_certificate', 'Verify Certificate')}</Link>
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            © 2026 {t('all_rights_reserved', 'All rights reserved.')} Built by{' '}
            <button 
              onClick={() => setIsPopupOpen(true)}
              className="text-foreground font-bold hover:text-primary transition-colors hover:underline"
            >
              N E X A 1337
            </button>
          </p>
        </div>
      </footer>

      {/* Popup Extra Links */}
      <AnimatePresence>
        {isPopupOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsPopupOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 relative z-10 overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-fuchsia-500" />
              
              <button 
                onClick={() => setIsPopupOpen(false)}
                className="absolute top-4 rtl:start-4 rtl:end-auto end-4 p-2 hover:bg-muted rounded-full transition-colors"
                aria-label="Close popup"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
              
              <div className="flex items-center gap-3 mb-6 mt-2">
                <div className="bg-primary/20 p-2 rounded-xl text-primary">
                  <Globe className="w-6 h-6" />
                </div>
                <div dir="ltr" className="text-left rtl:text-right">
                  <h3 className="text-xl font-bold">{t('nexa_network', 'The N E X A 1337 Network')}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">{t('explore_ecosystem', 'Explore our ecosystem')}</p>
                </div>
              </div>
              
              <div className="space-y-3" dir="ltr">
                {LINKS.map((link, idx) => (
                  <a 
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-between items-center group p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/80 hover:border-primary/50 transition-all"
                  >
                    <span className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">{link.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0 bg-background px-2.5 py-1 rounded-md border border-border/50">
                      <MousePointerClick className="w-3.5 h-3.5 text-primary/70" />
                      <span className="text-xs font-mono font-bold text-muted-foreground">{link.clicks}</span>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
