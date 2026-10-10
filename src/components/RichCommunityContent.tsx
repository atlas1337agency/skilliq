import React from 'react';
import { ExternalLink } from 'lucide-react';
import { getTextDir } from '../lib/community';
import { cn } from '../lib/utils';

interface RichCommunityContentProps {
  content: string;
  fallbackRtl?: boolean;
  onImageClick?: (imageUrl: string) => void;
}

/**
 * Parses inline markdown/HTML tokens:
 * - ![alt](url) -> Inline Image
 * - [label](url) -> Clickable Link
 * - **bold** -> <strong>
 * - *italic* -> <em>
 * - <u>underline</u> -> <u>
 * - ==highlight== -> <mark>
 * - `code` -> <code>
 * - raw https://... -> Clickable Link
 */
const isSafeUrl = (rawUrl?: string): boolean => {
  if (!rawUrl) return false;
  const trimmed = rawUrl.trim();
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/');
};

function renderInlineTokens(
  text: string,
  onImageClick?: (imageUrl: string) => void
): React.ReactNode[] {
  if (!text) return [];

  const tokenRegex =
    /(!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|==[^=]+==|<u>[\s\S]*?<\/u>|`[^`]+`|\*[^*\n]+\*|https?:\/\/[^\s<)]+)/g;

  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // 1. Inline Image: ![caption](url)
    const imgMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      const caption = imgMatch[1]?.trim();
      const rawUrl = imgMatch[2]?.trim();
      const url = isSafeUrl(rawUrl) ? rawUrl : '';
      if (!url) return null;
      return (
        <span key={idx} className="block my-4">
          <span
            onClick={() => onImageClick && url && onImageClick(url)}
            className={cn(
              'block rounded-2xl overflow-hidden border border-border/70 bg-muted/30 max-h-[420px]',
              onImageClick && 'cursor-zoom-in group'
            )}
          >
            <img
              src={url}
              alt={caption || 'Post image'}
              className="w-full max-h-[420px] object-cover group-hover:scale-[1.01] transition-transform duration-300"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </span>
          {caption && (
            <span className="block text-center text-[11px] text-muted-foreground mt-1.5 font-medium">
              {caption}
            </span>
          )}
        </span>
      );
    }

    // 2. Inline Markdown Link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const label = linkMatch[1];
      const rawUrl = linkMatch[2]?.trim();
      const safeHref = isSafeUrl(rawUrl) ? rawUrl : '#';
      return (
        <a
          key={idx}
          href={safeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary transition-colors mx-0.5"
        >
          <span>{label}</span>
          <ExternalLink className="w-3 h-3 shrink-0 inline" />
        </a>
      );
    }

    // 3. Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-extrabold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // 4. Highlight: ==text==
    if (part.startsWith('==') && part.endsWith('==') && part.length > 4) {
      return (
        <mark
          key={idx}
          className="bg-amber-500/20 text-foreground px-1.5 py-0.5 rounded-md font-semibold"
        >
          {part.slice(2, -2)}
        </mark>
      );
    }

    // 5. Underline: <u>text</u>
    if (part.startsWith('<u>') && part.endsWith('</u>') && part.length > 7) {
      return (
        <u key={idx} className="underline decoration-primary/60 underline-offset-4">
          {part.slice(3, -4)}
        </u>
      );
    }

    // 6. Inline Code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          dir="ltr"
          className="px-1.5 py-0.5 rounded-md bg-muted border border-border/70 font-mono text-[12px] text-primary"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // 7. Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic text-foreground/95">
          {part.slice(1, -1)}
        </em>
      );
    }

    // 8. Raw URL: https://...
    if (/^https?:\/\/[^\s<)]+$/.test(part)) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          dir="ltr"
          className="inline-flex items-center gap-1 font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary break-all mx-0.5"
        >
          <span>{part}</span>
          <ExternalLink className="w-3 h-3 shrink-0 inline" />
        </a>
      );
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function RichCommunityContent({
  content,
  fallbackRtl = false,
  onImageClick,
}: RichCommunityContentProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  lines.forEach((rawLine, index) => {
    const trimmed = rawLine.trim();

    // Code block toggle ```
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${index}`}
            dir="ltr"
            className="my-3 p-4 rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 font-mono text-xs overflow-x-auto text-left leading-relaxed"
          >
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      return;
    }

    // Empty line spacing
    if (!trimmed) {
      elements.push(<div key={`space-${index}`} className="h-2" />);
      return;
    }

    const lineDir = getTextDir(trimmed, fallbackRtl);
    const alignClass = lineDir === 'rtl' ? 'text-right' : 'text-left';

    // Heading 2: ##
    if (trimmed.startsWith('## ')) {
      const text = trimmed.slice(3);
      elements.push(
        <h3
          key={index}
          dir={lineDir}
          className={cn(
            'text-base sm:text-xl font-extrabold text-foreground mt-4 mb-1.5 tracking-tight',
            alignClass
          )}
        >
          {renderInlineTokens(text, onImageClick)}
        </h3>
      );
      return;
    }

    // Heading 3: ###
    if (trimmed.startsWith('### ')) {
      const text = trimmed.slice(4);
      elements.push(
        <h4
          key={index}
          dir={lineDir}
          className={cn(
            'text-sm sm:text-lg font-bold text-foreground mt-3 mb-1',
            alignClass
          )}
        >
          {renderInlineTokens(text, onImageClick)}
        </h4>
      );
      return;
    }

    // Blockquote: >
    if (trimmed.startsWith('> ')) {
      const text = trimmed.slice(2);
      elements.push(
        <blockquote
          key={index}
          dir={lineDir}
          className={cn(
            'my-2.5 py-2.5 px-4 rounded-xl bg-primary/5 border-s-4 border-primary text-xs sm:text-sm italic text-foreground/90',
            alignClass
          )}
        >
          {renderInlineTokens(text, onImageClick)}
        </blockquote>
      );
      return;
    }

    // Bullet list item: - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const text = trimmed.slice(2);
      elements.push(
        <div
          key={index}
          dir={lineDir}
          className={cn('flex items-start gap-2.5 my-1 text-xs sm:text-sm md:text-base', alignClass)}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
          <div className="flex-1 leading-relaxed">{renderInlineTokens(text, onImageClick)}</div>
        </div>
      );
      return;
    }

    // Numbered list item: 1. 2. etc.
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div
          key={index}
          dir={lineDir}
          className={cn('flex items-start gap-2.5 my-1 text-xs sm:text-sm md:text-base', alignClass)}
        >
          <span className="font-mono text-xs font-extrabold text-primary mt-0.5 shrink-0">
            {numMatch[1]}.
          </span>
          <div className="flex-1 leading-relaxed">
            {renderInlineTokens(numMatch[2], onImageClick)}
          </div>
        </div>
      );
      return;
    }

    // Standard Paragraph
    elements.push(
      <p
        key={index}
        dir={lineDir}
        className={cn(
          'text-xs sm:text-sm md:text-base text-foreground/90 leading-relaxed my-1',
          alignClass
        )}
      >
        {renderInlineTokens(rawLine, onImageClick)}
      </p>
    );
  });

  // Flush any unclosed code block
  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <pre
        key="code-unclosed"
        dir="ltr"
        className="my-3 p-4 rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 font-mono text-xs overflow-x-auto text-left leading-relaxed"
      >
        <code>{codeBuffer.join('\n')}</code>
      </pre>
    );
  }

  return <div className="space-y-1">{elements}</div>;
}
