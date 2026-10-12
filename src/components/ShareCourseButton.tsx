import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCourseShareUrl } from '../lib/courseUtils';
import { cn } from '../lib/utils';

interface ShareCourseButtonProps {
  course: {
    id: string;
    title: string;
    description?: string;
  };
  size?: 'sm' | 'md';
  variant?: 'overlay' | 'button' | 'inline';
  className?: string;
}

export function ShareCourseButton({
  course,
  size = 'sm',
  variant = 'overlay',
  className,
}: ShareCourseButtonProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language?.startsWith('ar');
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = getCourseShareUrl(course);

    // Copy to clipboard immediately so user always has the link ready
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }

    // Also trigger native mobile/OS share sheet if user is on mobile device
    if (typeof navigator !== 'undefined' && navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: `${course.title} | SKILLIQ`,
          text: course.description || course.title,
          url: shareUrl,
        });
      } catch {
        // User dismissed share sheet; link is already copied
      }
    }
  };

  if (variant === 'inline' || variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleShare}
        title={isRtl ? 'مشاركة رابط الدورة' : 'Share course link'}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all cursor-pointer active:scale-95',
          size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs sm:text-sm',
          copied
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            : 'bg-card hover:bg-muted text-foreground border border-border/80 shadow-xs',
          className
        )}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{isRtl ? 'تم نسخ الرابط!' : 'Link Copied!'}</span>
          </>
        ) : (
          <>
            <Share2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{isRtl ? 'مشاركة' : 'Share'}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      title={isRtl ? 'نسخ ومشاركة رابط الدورة' : 'Copy & share course link'}
      aria-label={isRtl ? 'نسخ ومشاركة رابط الدورة' : 'Copy & share course link'}
      className={cn(
        'flex items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer active:scale-90 shadow-md border',
        size === 'sm' ? 'w-8 h-8' : 'w-9 h-9',
        copied
          ? 'bg-emerald-500 text-white border-emerald-400'
          : 'bg-black/65 hover:bg-black/85 text-white border-white/15 hover:scale-105',
        className
      )}
    >
      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-3.5 h-3.5" />}
    </button>
  );
}
