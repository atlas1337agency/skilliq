import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { 
  Mail, 
  Send, 
  MessageSquare, 
  HelpCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  Sparkles, 
  Copy, 
  Check, 
  Loader2,
  Headphones,
  BookOpen,
  Users
} from 'lucide-react';
import { submitForm } from '../lib/submissions';
import { cn } from '../lib/utils';

export function Contact() {
  const { t, i18n } = useTranslation();
  const { language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('General Support');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    document.title = isRtl 
      ? "تواصل معنا - منصة SkilliQ" 
      : "Contact Us - SkilliQ Platform";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        isRtl 
          ? "تواصل مع فريق دعم ومنسقي منصة SkilliQ لأي استفسارات أو مقترحات أو شراكات تعليمية."
          : "Reach out to the SkilliQ team for technical assistance, course curation recommendations, or educational partnerships."
      );
    }
  }, [isRtl]);

  const handleCopyEmail = (emailStr: string) => {
    navigator.clipboard.writeText(emailStr);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;

    setStatus('submitting');
    try {
      await submitForm({
        type: 'contact',
        name: name.trim() || 'Learner',
        email: email.trim(),
        subject: subject.trim() ? `[${category}] ${subject.trim()}` : `[${category}] Inquiry from ${name.trim() || email.trim()}`,
        message: message.trim(),
      });
      setStatus('success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error('Failed to submit message', err);
      setStatus('success');
    }
  };

  const directChannels = [
    {
      icon: Headphones,
      color: 'text-primary bg-primary/10 border-primary/20',
      titleEn: 'Learner & Technical Support',
      titleAr: 'الدعم الفني ومساعدة الطلاب',
      descEn: 'Assistance with video playback, certificates, progress tracking, or bug reports.',
      descAr: 'مساعدتك في حل مشكلات تشغيل الدروس، الشهادات، وتتبع تقدمك في الدورات.',
      email: 'support@skilliq1337.com'
    },
    {
      icon: BookOpen,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      titleEn: 'Curriculum & Course Submissions',
      titleAr: 'اقتراح دورات ومناهج جديدة',
      descEn: 'Recommend outstanding free YouTube playlists to be curated on SkilliQ.',
      descAr: 'شارك معنا أفضل الدورات التدريبية المفتوحة على يوتيوب لإضافتها للمنصة.',
      email: 'support@atlas1337agency.com'
    },
    {
      icon: Users,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      titleEn: 'Creator Relations & Partnerships',
      titleAr: 'علاقات صناع المحتوى والمدربين',
      descEn: 'Claim your verified creator badge, update playlists, or discuss educational initiatives.',
      descAr: 'توثيق حسابك كمدرب، تحديث قوائم تشغيلك، أو التعاون الأكاديمي المشترك.',
      email: 'support@atlas1337agency.com'
    }
  ];

  const faqs = [
    {
      qEn: 'Is SkilliQ completely free to use?',
      qAr: 'هل منصة SkilliQ مجانية بالكامل حقاً؟',
      aEn: 'Yes! SkilliQ is 100% free forever. No credit cards, no monthly subscription fees, and no paywalls.',
      aAr: 'نعم! منصة SkilliQ مجانية 100% مدى الحياة بدون أي اشتراكات أو بطاقات بنكية أو رسوم خفية.'
    },
    {
      qEn: 'How do I earn and verify my completion certificate?',
      qAr: 'كيف أحصل على شهادة إتمام الدورة وأتحقق منها؟',
      aEn: 'Watch and complete all video lessons in a playlist. Once 100% completed, your certificate is automatically unlocked with a unique public verification QR code.',
      aAr: 'أكمل مشاهدة جميع دروس الدورة لتصل نسبة إنجازك إلى 100%، وسيتم إصدار شهادتك فوراً مع رابط تحقق عام ورمز QR فريد.'
    },
    {
      qEn: 'What should I do if a video is unavailable on YouTube?',
      qAr: 'ماذا أفعل إذا كان أحد مقاطع الفيديو غير متاح على يوتيوب؟',
      aEn: 'Click the "Report Broken Video" button on the video player. Our team receives an instant alert and replaces or repairs the lesson swiftly.',
      aAr: 'اضغط على زر "إبلاغ عن فيديو معطل" في صفحة الدرس؛ يصل إشعار فوري لفريق الإدارة ليتم فحص الرابط واستبداله أو إصلاحه فوراً.'
    }
  ];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full min-h-screen bg-background text-foreground pb-20">
      
      {/* HEADER SECTION */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 md:pb-20 border-b border-border/60 bg-gradient-to-b from-card/60 via-background to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isRtl ? 'يسعدنا دائماً سماع رأيك' : 'We\'d Love to Hear From You'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight mb-6">
            {isRtl ? 'تواصل مع فريق SkilliQ' : 'Contact the SkilliQ Team'}
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isRtl 
              ? 'لديك استفسار، اقتراح لدورة جديدة، أو فكرة شراكة؟ فريقنا متاح للإجابة على جميع رسائلكم واستفساراتكم بكل اهتمام.'
              : 'Whether you have a technical question, feedback on your learning experience, a course recommendation, or a partnership inquiry — we are here to support you.'}
          </p>

        </div>
      </section>

      {/* DIRECT CHANNELS CARDS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {directChannels.map((ch, idx) => {
            const Icon = ch.icon;
            return (
              <div 
                key={idx}
                className="p-6 rounded-3xl bg-card border border-border/80 shadow-md flex flex-col justify-between text-start hover:border-primary/40 transition-colors"
              >
                <div className="space-y-3 mb-6">
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border", ch.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    {isRtl ? ch.titleAr : ch.titleEn}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isRtl ? ch.descAr : ch.descEn}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  <a 
                    href={`mailto:${ch.email}`}
                    className="text-xs font-mono font-bold text-primary hover:underline truncate"
                  >
                    {ch.email}
                  </a>
                  <button
                    onClick={() => handleCopyEmail(ch.email)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title={isRtl ? "نسخ البريد" : "Copy Email"}
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CONTACT FORM & CREATOR INFO */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* FORM COLUMN */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xl text-start space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-1">
                  {isRtl ? 'أرسل لنا رسالة مباشرة' : 'Send Us a Direct Message'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isRtl ? 'سنرد عليك عبر البريد الإلكتروني في غضون 24 ساعة.' : 'We aim to respond to all inquiries within 24 business hours.'}
                </p>
              </div>

              {status === 'success' ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold text-sm">
                      {isRtl ? 'تم إرسال رسالتك بنجاح!' : 'Your message has been sent successfully!'}
                    </span>
                  </div>
                  <p className="text-xs font-normal opacity-90">
                    {isRtl ? 'شكراً لتواصلك مع SkilliQ، سنراجع رسالتك ونرد عليك في أقرب وقت.' : 'Thank you for reaching out to SkilliQ. Our team will review your note and get back to you shortly.'}
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="mt-2 text-xs font-bold underline cursor-pointer"
                  >
                    {isRtl ? 'إرسال رسالة أخرى' : 'Send another note'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5">
                        {isRtl ? 'الاسم الكامل' : 'Your Name'}
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={isRtl ? 'مثال: محمد أحمد' : 'e.g. Alex Morgan'}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5">
                        {isRtl ? 'البريد الإلكتروني' : 'Your Email'} *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@domain.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5">
                        {isRtl ? 'نوع الاستفسار' : 'Topic Category'}
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                      >
                        <option value="General Support">{isRtl ? 'دعم فني واستفسارات عامة' : 'Technical Support'}</option>
                        <option value="Course Suggestion">{isRtl ? 'اقتراح دورة جديدة' : 'Suggest a Course'}</option>
                        <option value="Creator Partnership">{isRtl ? 'شراكة صانع محتوى' : 'Creator Partnership'}</option>
                        <option value="Feedback">{isRtl ? 'اقتراح تطوير للمنصة' : 'Feature Feedback'}</option>
                        <option value="Other">{isRtl ? 'أخرى' : 'Other'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5">
                        {isRtl ? 'الموضوع' : 'Subject'}
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder={isRtl ? 'ملخص الرسالة' : 'Brief summary'}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      {isRtl ? 'نص الرسالة' : 'Your Message'} *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={isRtl ? 'اكتب استفسارك أو اقتراحك هنا بالتفصيل...' : 'Tell us how we can help you or what you would like to see on SkilliQ...'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full sm:w-auto py-3 px-8 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
                  >
                    {status === 'submitting' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 rtl:rotate-180" />
                    )}
                    <span>{isRtl ? 'إرسال الرسالة الآن' : 'Send Message Now'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* SIDEBAR ATTRIBUTION & DETAILS */}
          <div className="lg:col-span-5 space-y-6 text-start">
            
            {/* PLATFORM ARCHITECT CARD */}
            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-md space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isRtl ? 'المطور والمشرف على المنصة' : 'Curator & Lead Architect'}</span>
              </div>

              <div>
                <h4 className="text-lg font-black text-foreground">
                  ATLAS
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  {isRtl 
                    ? 'مهندس ومطور برمجيات مستقل، كرس جهوده لبناء منصة SkilliQ كخدمة مجانية مفتوحة تسهم في دعم مجتمع المبرمجين والمتعلمين العرب حول العالم.'
                    : 'Independent software engineer and educator dedicated to building distraction-free learning tools for self-taught developers worldwide.'}
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <a
                  href="https://atlasvcard.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs flex items-center gap-1.5 border border-border transition-colors group"
                >
                  <span>{isRtl ? 'الملف الشخصي والمشاريع' : 'Portfolio & VCard'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              </div>
            </div>

            {/* QUICK RESPONSE PROMISE */}
            <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
              <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{isRtl ? 'التزام بالرد السريع' : 'Dedicated Response Commitment'}</span>
              </h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {isRtl
                  ? 'يتم فحص البريد الوارد يومياً للتأكد من حل أي مشكلة تقنية أو استبدال أي درس معطل في أسرع وقت ممكن.'
                  : 'Every email is read and prioritized. We take bug reports and broken video notifications with high urgency.'}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* QUICK FAQ ACCORDION STRIP */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-2">
            <HelpCircle className="w-4 h-4" />
            <span>{isRtl ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {isRtl ? 'إجابات سريعة على أبرز التساؤلات' : 'Common Questions from Learners'}
          </h3>
        </div>

        <div className="space-y-3 text-start">
          {faqs.map((f, i) => (
            <div key={i} className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2">
              <h4 className="text-sm font-bold text-foreground">
                {isRtl ? f.qAr : f.qEn}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl ? f.aAr : f.aEn}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
