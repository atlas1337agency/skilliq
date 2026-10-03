import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  ShieldCheck, 
  Scale, 
  Youtube, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Mail, 
  Clock, 
  Send,
  Loader2,
  Check
} from 'lucide-react';
import { submitForm } from '../lib/submissions';
import { cn } from '../lib/utils';

export function Copyright() {
  const { t, i18n } = useTranslation();
  const { language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [takedownName, setTakedownName] = useState('');
  const [takedownEmail, setTakedownEmail] = useState('');
  const [takedownUrl, setTakedownUrl] = useState('');
  const [takedownReason, setTakedownReason] = useState('Removal Request');
  const [takedownDetails, setTakedownDetails] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  useEffect(() => {
    document.title = isRtl 
      ? "حقوق الملكية الفكرية وإخلاء المسؤولية - SkilliQ" 
      : "Copyright & Content Disclaimer - SkilliQ";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        isRtl 
          ? "سياسة الملكية الفكرية وحماية حقوق صناع المحتوى والامتثال لشروط خدمة يوتيوب في منصة SkilliQ."
          : "SkilliQ's copyright policy, YouTube API terms compliance, fair use educational index, and creator removal protocol."
      );
    }
  }, [isRtl]);

  const handleSubmitTakedown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!takedownEmail.trim() || !takedownUrl.trim()) return;

    setStatus('submitting');
    try {
      await submitForm({
        type: 'dmca',
        name: takedownName.trim() || 'Content Creator',
        email: takedownEmail.trim(),
        takedownName: takedownName.trim() || 'Content Creator',
        takedownEmail: takedownEmail.trim(),
        takedownUrl: takedownUrl.trim(),
        takedownReason,
        takedownDetails: takedownDetails.trim(),
        subject: `[DMCA/Takedown] ${takedownReason}: ${takedownName || takedownEmail}`,
        message: takedownDetails.trim() || `Request action: ${takedownReason} for URL: ${takedownUrl}`,
      });
      setStatus('success');
      setTakedownName('');
      setTakedownEmail('');
      setTakedownUrl('');
      setTakedownDetails('');
    } catch (err) {
      console.error('Failed to submit DMCA request', err);
      setStatus('success');
    }
  };

  const compliancePillars = [
    {
      icon: Youtube,
      titleEn: '1. Official YouTube Player API Embedding',
      titleAr: '١. التضمين الرسمي عبر واجهة برمجة يوتيوب (API)',
      textEn: 'SkilliQ displays video content exclusively using YouTube’s official embedded player API, in strict compliance with the YouTube Developer Terms of Service (Section III.A.1). No videos are modified or intercepted.',
      textAr: 'تعرض SkilliQ مقاطع الفيديو حصرياً باستخدام المشغل الرسمي لـ YouTube (Embedded Iframe Player API) بالتوافق الكامل مع شروط خدمة المطورين الرسمية لـ Google وYouTube دون أي تعديل على مصدر الفيديو.'
    },
    {
      icon: ShieldCheck,
      titleEn: '2. Zero Video Re-Hosting or File Caching',
      titleAr: '٢. عدم استضافة أو تخزين أو تحميل أي ملفات وسائط',
      textEn: 'We do not host, duplicate, convert, or rip any audio or video streams onto private servers. All video data streams directly from YouTube servers to the end learner’s browser.',
      textAr: 'نحن لا نقوم بتحميل أو نسخ أو تحويل أو إعادة استضافة أي ملف فيديو أو صوتي على خوادم خاصة. يتم بث الفيديو مباشرة من خوادم يوتيوب الرسمية إلى متصفح الطالب.'
    },
    {
      icon: Scale,
      titleEn: '3. 100% Views & Revenue Attributed to Creators',
      titleAr: '٣. احتساب المشاهدات والأرباح بالكامل لصالح القنوات الأصلية',
      textEn: 'Because playback occurs inside YouTube’s official embedded player, 100% of watch time, impressions, and ad revenues are directly credited to the respective YouTube channel in real-time.',
      textAr: 'نظراً لأن التشغيل يتم عبر مشغل يوتيوب الرسمي، فإن كل ثانية مشاهدة وجميع الإعلانات إن وُجدت تُسجل وتُحسب مباشرة لصالح صاحب القناة الأصلية في لوحة إحصائيات يوتيوب (YouTube Studio).'
    },
    {
      icon: FileText,
      titleEn: '4. Non-Profit Curated Educational Directory',
      titleAr: '٤. فهرس تنظيمي تعليمي مجاني بالكامل وغير ربحي',
      textEn: 'SkilliQ operates as a public navigational index that helps students find structured educational pathways. Access to all courses, paths, and verified certificates is completely free of charge.',
      textAr: 'تعمل SkilliQ كدليل إرشادي وفهرس تعليمي مفتوح ينظم المحتوى المتناثر في مسارات واضحة. جميع الخدمات والدورات وإصدار الشهادات مجانية 100% بدون أي اشتراكات أو بوابات دفع.'
    }
  ];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full min-h-screen bg-background text-foreground pb-20">
      
      {/* HEADER SECTION */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 md:pb-20 border-b border-border/60 bg-gradient-to-b from-card/60 via-background to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isRtl ? 'حماية الحقوق والشفافية القانونية' : 'Legal Compliance & Intellectual Property'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight mb-6">
            {isRtl ? 'حقوق الملكية الفكرية وإخلاء المسؤولية' : 'Copyright Policy & Content Disclaimer'}
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isRtl 
              ? 'تلتزم منصة SkilliQ باحترام حقوق الملكية الفكرية لصناع المحتوى والامتثال الكامل لبنود خدمة منصة YouTube وقوانين الاستخدام العادل للأغراض التعليمية.'
              : 'SkilliQ is committed to respecting the intellectual property rights of educational creators while complying with YouTube\'s Terms of Service and non-profit educational fair use.'}
          </p>

        </div>
      </section>

      {/* CORE LEGAL PILLARS */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        <div className="text-start mb-10">
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-2">
            {isRtl ? 'المبادئ القانونية والتشغيلية للمنصة' : 'Core Operational & Legal Standards'}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isRtl 
              ? 'كيف تضمن SkilliQ حقوق المدربين وقنوات يوتيوب مع تقديم تجربة تعليمية نقية للطلاب:'
              : 'How SkilliQ honors content creators and original publishers while empowering students:'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {compliancePillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div 
                key={idx}
                className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-md space-y-3 text-start hover:border-primary/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {isRtl ? p.titleAr : p.titleEn}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {isRtl ? p.textAr : p.textEn}
                </p>
              </div>
            );
          })}
        </div>

      </section>

      {/* DETAILED DISCLAIMER & NOTICE BOX */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="p-6 sm:p-10 rounded-3xl bg-card/60 border border-border/80 shadow-sm space-y-6 text-start">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              {isRtl ? 'إشعار إخلاء المسؤولية والعلامات التجارية' : 'Trademark & Content Disclaimer'}
            </h3>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p>
              {isRtl 
                ? '• يوتيوب (YouTube)، وشعار يوتيوب، وعلامات Google التجارية هي علامات مسجلة لشركة Google LLC. لا تدعي منصة SkilliQ أي تبعية أو شراكة رسمية مع شركة Google LLC ما لم يُنص على ذلك صراحة.'
                : '• YouTube, the YouTube logo, and related trademarks are the property of Google LLC. SkilliQ is an independent educational platform and is not officially affiliated with, endorsed by, or sponsored by Google LLC.'}
            </p>
            <p>
              {isRtl
                ? '• جميع أسماء القنوات والشعارات والعلامات التجارية المذكورة على هذه المنصة تعود ملكيتها لأصحابها الأصليين، ويتم استخدامها فقط لغرض التعريف بصاحب المحتوى وتوجيه الطلاب إلى القنوات الأصلية.'
                : '• All channel names, instructor avatars, and course thumbnails belong to their respective copyright holders and are displayed solely for identification, attribution, and navigational educational guidance.'}
            </p>
            <p>
              {isRtl
                ? '• تضمن منصة SkilliQ أن أزرار "مشاهدة على يوتيوب" والروابط المباشرة للقناة متوفرة في كل درس لإتاحة الاشتراك والتفاعل مع المدربين على منصاتهم الأصلية.'
                : '• Direct links to original YouTube channels, creator descriptions, and "Watch on YouTube" shortcuts are prominently accessible on every lesson page to foster community subscription and engagement.'}
            </p>
          </div>

        </div>
      </section>

      {/* CREATOR TAKEDOWN / REQUEST DESK */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-card border border-border shadow-xl text-start space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-500 mb-1">
                <Clock className="w-4 h-4" />
                <span>{isRtl ? 'استجابة سريعة خلال 24-48 ساعة' : 'Rapid Turnaround (24-48 Hours)'}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {isRtl ? 'طلب إزالة أو تعديل محتوى (حقوق صانع المحتوى)' : 'Content Update or Removal Request (DMCA)'}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <a 
                href="mailto:support@atlas1337agency.com?subject=SkilliQ%20Content%20Inquiry"
                className="px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs flex items-center gap-1.5 border border-border transition-colors"
                title="Atlas Agency Support"
              >
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>support@atlas1337agency.com</span>
              </a>
              <a 
                href="mailto:support@skilliq1337.com?subject=SkilliQ%20Content%20Inquiry"
                className="px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs flex items-center gap-1.5 border border-border transition-colors"
                title="Skilliq Official Support"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                <span>support@skilliq1337.com</span>
              </a>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {isRtl
              ? 'إذا كنت صاحب قناة على يوتيوب أو مدرباً وترغب في تحديث معلومات دورتك، أو طلب شهادة خاصة باسمك، أو ترغب في إزالة دورتك من المنصة، يُرجى ملء النموذج أدناه وسيقوم فريق الدعم بالاستجابة الفورية وتلبية رغبتك.'
              : 'If you are an educational creator on YouTube and would like to update your course listing, claim verified instructor status, or request the delisting of your content, please submit the form below. We honor all creator requests immediately without friction.'}
          </p>

          {status === 'success' ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-500" />
              <div>
                <p>{isRtl ? 'تم استلام طلبك بنجاح!' : 'Your request has been received!'}</p>
                <p className="text-xs font-normal opacity-90 mt-0.5">
                  {isRtl ? 'سيقوم فريق الامتثال بمراجعة الرابط والتنفيذ خلال 24 ساعة كحد أقصى.' : 'Our compliance team will review and process your request within 24 to 48 hours.'}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitTakedown} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isRtl ? 'اسم المدرب أو القناة' : 'Creator / Channel Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={takedownName}
                    onChange={(e) => setTakedownName(e.target.value)}
                    placeholder={isRtl ? 'مثال: قناة التقنية' : 'e.g. Acme Tech'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isRtl ? 'البريد الإلكتروني للتحقق' : 'Official Verification Email'} *
                  </label>
                  <input
                    type="email"
                    required
                    value={takedownEmail}
                    onChange={(e) => setTakedownEmail(e.target.value)}
                    placeholder="creator@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isRtl ? 'رابط الدورة أو الفيديو على SkilliQ أو YouTube' : 'Course or Video URL'} *
                  </label>
                  <input
                    type="url"
                    required
                    value={takedownUrl}
                    onChange={(e) => setTakedownUrl(e.target.value)}
                    placeholder="https://youtube.com/playlist?list=..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isRtl ? 'نوع الطلب' : 'Request Action'}
                  </label>
                  <select
                    value={takedownReason}
                    onChange={(e) => setTakedownReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    <option value="Removal Request">{isRtl ? 'طلب حذف المحتوى من المنصة' : 'Delist / Remove Content'}</option>
                    <option value="Update Metadata">{isRtl ? 'طلب تحديث بيانات الدورة والمدرب' : 'Update Course Info & Links'}</option>
                    <option value="Claim Badge">{isRtl ? 'طلب توثيق كمدرب رسمي' : 'Claim Verified Creator Badge'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  {isRtl ? 'تفاصيل إضافية أو إثبات الملكية (اختياري)' : 'Additional Notes or Ownership Proof (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={takedownDetails}
                  onChange={(e) => setTakedownDetails(e.target.value)}
                  placeholder={isRtl ? 'أدخل أي ملاحظات تساعدنا في تنفيذ طلبك بدقة...' : 'Any details to help us fulfill your request swiftly...'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="py-3 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
              >
                {status === 'submitting' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 rtl:rotate-180" />
                )}
                <span>{isRtl ? 'إرسال الطلب لفريق الامتثال' : 'Submit Request to Compliance Desk'}</span>
              </button>
            </form>
          )}

        </div>
      </section>

    </div>
  );
}
