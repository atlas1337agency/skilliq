import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export function About() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "About Skilliq - Structured Free Learning";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Learn how Skilliq organizes free educational content into structured paths to help students stay focused and consistent.");
    }
    
    // Reset on unmount
    return () => {
      document.title = "Skilliq - Free Structured Learning Platform";
      if (metaDescription) {
        metaDescription.setAttribute("content", "Explore curated learning paths built from the best free YouTube courses. Learn cybersecurity, coding, design, and more without distractions.");
      }
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-background flex flex-col items-center py-20 px-4 md:px-8">
      <div className="max-w-4xl w-full bg-card border border-border rounded-3xl p-8 md:p-12 shadow-xl">
        <h1 className="text-4xl md:text-5xl font-black mb-8">{t('about_title')}</h1>
        <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
          <p>{t('about_p1')}</p>
          <p>{t('about_p2')}</p>
          <p>{t('about_p3')}</p>
        </div>
        
        <div className="mt-12 bg-muted/50 border-l-4 border-primary p-6 rounded-r-2xl">
          <h3 className="text-xl font-bold mb-3 text-foreground">{t('important_notice')}</h3>
          <p className="text-muted-foreground">{t('about_notice')}</p>
        </div>
      </div>
    </div>
  );
}
