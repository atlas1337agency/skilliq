import { useTranslation } from 'react-i18next';

export function Contact() {
  const { t } = useTranslation();

  return (
    <div className="w-full min-h-screen bg-background flex flex-col items-center py-20 px-4 md:px-8">
      <div className="max-w-4xl w-full bg-card border border-border rounded-3xl p-8 md:p-12 shadow-xl">
        <h1 className="text-4xl md:text-5xl font-black mb-8">{t('contact_us')}</h1>
        <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
          <p>{t('contact_desc')}</p>
          <div className="bg-muted p-6 rounded-2xl flex flex-col gap-2">
            <span className="font-bold text-foreground">{t('email_us')}</span>
            <a href="mailto:Support@nexa1337.com" className="text-primary hover:underline font-mono text-xl">
              Support@nexa1337.com
            </a>
          </div>
          <p>{t('aim_to_respond')}</p>
        </div>
      </div>
    </div>
  );
}
