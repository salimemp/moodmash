import Head from 'next/head';
import { useRouter } from 'next/router';

interface PageMetaProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  canonical?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  publishedAt?: string;
  updatedAt?: string;
  tags?: string[];
  author?: {
    name: string;
    url?: string;
  };
  structuredData?: Record<string, any> | Array<Record<string, any>>;
}

const SITE_NAME = 'MoodMash';
const DEFAULT_DESCRIPTION = 'Express, track, and share your moods with the MoodMash app.';
const DEFAULT_IMAGE = '/images/og-default.jpg';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moodmash.com';

/**
 * PageMeta component for handling SEO metadata and structured data
 */
export function PageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  type = 'website',
  canonical,
  noIndex = false,
  noFollow = false,
  publishedAt,
  updatedAt,
  tags,
  author,
  structuredData,
}: PageMetaProps) {
  const router = useRouter();
  
  // Format the full page title
  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  
  // Build the canonical URL
  const canonicalUrl = canonical || `${BASE_URL}${router.asPath}`;
  
  // Build robots meta content
  const robotsContent = `${noIndex ? 'noindex' : 'index'},${noFollow ? 'nofollow' : 'follow'}`;
  
  // Ensure image is an absolute URL
  const ogImage = image.startsWith('http') ? image : `${BASE_URL}${image}`;
  
  return (
    <Head>
      {/* Basic Metadata */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content={robotsContent} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Article Specific Metadata */}
      {type === 'article' && publishedAt && (
        <meta property="article:published_time" content={publishedAt} />
      )}
      {type === 'article' && updatedAt && (
        <meta property="article:modified_time" content={updatedAt} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author.name} />
      )}
      {type === 'article' && tags && tags.length > 0 && (
        <>
          {tags.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* JSON-LD Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
      
      {/* Default website structured data if none provided */}
      {!structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: SITE_NAME,
              url: BASE_URL,
              description: DEFAULT_DESCRIPTION,
              potentialAction: {
                '@type': 'SearchAction',
                target: `${BASE_URL}/search?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      )}
    </Head>
  );
} 