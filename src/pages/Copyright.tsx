import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export function Copyright() {
  const { t } = useTranslation();

  return (
    <div className="w-full min-h-screen bg-background flex flex-col items-center py-20 px-4 md:px-8">
      <div className="max-w-4xl w-full bg-card border border-border rounded-3xl p-8 md:p-12 shadow-xl">
        <h1 className="text-4xl md:text-5xl font-black mb-8">{t('content_disclaimer')}</h1>
        <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
          <p>{t('disclaimer_p1')}</p>
          <p>{t('disclaimer_p2')}</p>
          <p>{t('disclaimer_p3')}</p>
        </div>
      </div>
    </div>
  );
}
