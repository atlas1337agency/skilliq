import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'article' | 'video.other' | 'profile';
  noindex?: boolean;
  canonicalPath?: string;
  schema?: Record<string, any> | Record<string, any>[];
  breadcrumbs?: BreadcrumbItem[];
  lang?: 'en' | 'ar';
}

const DEFAULT_SITE_NAME = 'Skilliq';
const DEFAULT_TITLE = 'Skilliq – Free Structured Learning Platform & Masterclasses';
const DEFAULT_DESCRIPTION =
  'Discover Skilliq: A distraction-free learning platform with curated YouTube courses, structured career paths, and free masterclasses in tech, AI, and cybersecurity.';
const DEFAULT_KEYWORDS = [
  'Skilliq',
  'free online courses',
  'structured learning paths',
  'curated YouTube courses',
  'free masterclasses',
  'cybersecurity roadmap',
  'web development courses',
  'AI engineering course',
  'learn programming free',
  'free tech certificates',
  'ATLAS 1337',
  'منصة تعليمية مجانية',
  'كورسات برمجة مجانية',
  'مسارات تعلم مبرمجة',
  'الأمن السيبراني'
];

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = [],
  image,
  type = 'website',
  noindex = false,
  canonicalPath,
  schema,
  breadcrumbs,
  lang = 'en'
}) => {
  const location = useLocation();
  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://skilliq1337school.vercel.app';

  const cleanPath = canonicalPath || location.pathname || '/';
  const canonicalUrl = `${origin}${cleanPath === '/' ? '' : cleanPath}`;
  const ogImage = image || `${origin}/images/logo_dark.png`;

  const fullTitle = title
    ? title.includes('Skilliq') || title.includes('SkilliQ')
      ? title
      : `${title} | ${DEFAULT_SITE_NAME}`
    : DEFAULT_TITLE;

  const cleanDescription = description.replace(/\s+/g, ' ').trim().slice(0, 165);
  const mergedKeywords = Array.from(new Set([...keywords, ...DEFAULT_KEYWORDS])).join(', ');

  // Build JSON-LD graphs
  const jsonLdSchemas: Record<string, any>[] = [];

  if (breadcrumbs && breadcrumbs.length > 0) {
    jsonLdSchemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: item.name,
        item: item.url.startsWith('http') ? item.url : `${origin}${item.url}`
      }))
    });
  }

  if (schema) {
    if (Array.isArray(schema)) {
      jsonLdSchemas.push(...schema);
    } else {
      jsonLdSchemas.push(schema);
    }
  }

  return (
    <Helmet prioritizeSeoTags>
      {/* Standard Metadata */}
      <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} />
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={cleanDescription} />
      <meta name="keywords" content={mergedKeywords} />
      <meta
        name="robots"
        content={
          noindex
            ? 'noindex, nofollow'
            : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
        }
      />
      <meta
        name="googlebot"
        content={
          noindex
            ? 'noindex, nofollow'
            : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
        }
      />

      {/* Canonical & Alternate Language Links */}
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="ar" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Open Graph / Facebook / LinkedIn / Discord */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={DEFAULT_SITE_NAME} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={cleanDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={lang === 'ar' ? 'ar_AR' : 'en_US'} />
      <meta property="og:locale:alternate" content={lang === 'ar' ? 'en_US' : 'ar_AR'} />

      {/* Twitter / X Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={cleanDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data (JSON-LD) */}
      {jsonLdSchemas.map((item, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
};
