// SEO API Routes - Sitemap, Robots.txt, and Metadata
import { Hono } from 'hono';
import type { Env, Variables } from '../../types';

const seo = new Hono<{ Bindings: Env; Variables: Variables }>();

const BASE_URL = 'https://moodmash.app';

// ============================================================================
// STRUCTURED DATA (JSON-LD)
// ============================================================================

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MoodMash',
  url: BASE_URL,
  logo: `${BASE_URL}/static/logo.png`,
  description: 'AI-powered mood tracking and mental wellness platform',
  sameAs: [
    'https://twitter.com/moodmash',
    'https://facebook.com/moodmash',
    'https://instagram.com/moodmash',
    'https://linkedin.com/company/moodmash'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@moodmash.app',
    availableLanguage: ['English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Chinese', 'Arabic']
  }
};

const webApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'MoodMash',
  url: BASE_URL,
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web, iOS, Android',
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '0',
    highPrice: '19.99',
    priceCurrency: 'USD',
    offerCount: 3
  },
  featureList: [
    'AI-powered mood tracking',
    'Voice journaling',
    'Social support groups',
    'Gamification with achievements',
    'Multi-language support (8 languages)',
    'HIPAA & CCPA compliant',
    'Real-time mood analytics',
    'AI chatbot coaching'
  ],
  screenshot: `${BASE_URL}/static/screenshots/dashboard.png`,
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '15420',
    bestRating: '5'
  }
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is MoodMash?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'MoodMash is an AI-powered mood tracking and mental wellness app that helps you understand your emotional patterns, provides personalized insights, and connects you with a supportive community.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is MoodMash free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! MoodMash offers a free tier with basic mood tracking features. Premium plans ($4.99/mo - $19.99/mo) unlock AI coaching, voice journaling, advanced analytics, and more.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is my data private and secure?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. MoodMash is HIPAA and CCPA compliant. We use end-to-end encryption, and your data is never sold to third parties. You have full control over your data with export and deletion options.'
      }
    },
    {
      '@type': 'Question',
      name: 'What languages does MoodMash support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'MoodMash supports 8 languages: English, Spanish, French, German, Japanese, Korean, Simplified Chinese, and Arabic.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I track my mood offline?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, MoodMash works offline as a PWA (Progressive Web App). Your entries sync automatically when you reconnect to the internet.'
      }
    }
  ]
};

// ============================================================================
// SITEMAP.XML
// ============================================================================

seo.get('/sitemap.xml', async (c) => {
  try {
    // Get URLs from database
    const urls = await c.env.DB.prepare(`
      SELECT url, priority, changefreq, lastmod
      FROM sitemap_urls
      WHERE include_in_sitemap = 1
      ORDER BY priority DESC
    `).all();
    
    const urlList = urls.results || [];
    
    // Add default URLs if database is empty
    const defaultUrls = [
      { url: '/', priority: 1.0, changefreq: 'daily' },
      { url: '/login', priority: 0.8, changefreq: 'monthly' },
      { url: '/register', priority: 0.8, changefreq: 'monthly' },
      { url: '/features', priority: 0.9, changefreq: 'weekly' },
      { url: '/pricing', priority: 0.9, changefreq: 'weekly' },
      { url: '/about', priority: 0.7, changefreq: 'monthly' },
      { url: '/faq', priority: 0.7, changefreq: 'weekly' },
      { url: '/contact', priority: 0.6, changefreq: 'monthly' },
      { url: '/privacy', priority: 0.5, changefreq: 'yearly' },
      { url: '/terms', priority: 0.5, changefreq: 'yearly' }
    ];
    
    const allUrls = urlList.length > 0 ? urlList : defaultUrls;
    const today = new Date().toISOString().split('T')[0];
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allUrls.map((item: any) => `  <url>
    <loc>${BASE_URL}${item.url}</loc>
    <lastmod>${item.lastmod || today}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}${item.url}"/>
    <xhtml:link rel="alternate" hreflang="es" href="${BASE_URL}/es${item.url}"/>
    <xhtml:link rel="alternate" hreflang="fr" href="${BASE_URL}/fr${item.url}"/>
    <xhtml:link rel="alternate" hreflang="de" href="${BASE_URL}/de${item.url}"/>
    <xhtml:link rel="alternate" hreflang="ja" href="${BASE_URL}/ja${item.url}"/>
    <xhtml:link rel="alternate" hreflang="ko" href="${BASE_URL}/ko${item.url}"/>
    <xhtml:link rel="alternate" hreflang="zh" href="${BASE_URL}/zh${item.url}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${BASE_URL}/ar${item.url}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${item.url}"/>
  </url>`).join('\n')}
</urlset>`;
    
    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
    
  } catch (error) {
    console.error('Sitemap error:', error);
    return c.text('Error generating sitemap', 500);
  }
});

// ============================================================================
// ROBOTS.TXT
// ============================================================================

seo.get('/robots.txt', (c) => {
  const robots = `# MoodMash Robots.txt
# https://moodmash.app

User-agent: *
Allow: /
Allow: /login
Allow: /register
Allow: /features
Allow: /pricing
Allow: /about
Allow: /faq
Allow: /contact
Allow: /privacy
Allow: /terms

# Disallow private/authenticated areas
Disallow: /dashboard
Disallow: /api/
Disallow: /settings
Disallow: /profile
Disallow: /friends
Disallow: /groups
Disallow: /insights
Disallow: /voice-journal
Disallow: /achievements
Disallow: /challenges
Disallow: /leaderboard

# Disallow admin areas
Disallow: /admin/

# Sitemap
Sitemap: ${BASE_URL}/sitemap.xml

# Crawl delay (be nice to our servers)
Crawl-delay: 1
`;
  
  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400'
    }
  });
});

// ============================================================================
// SEO METADATA API
// ============================================================================

seo.get('/metadata/:page', async (c) => {
  const page = '/' + (c.req.param('page') || '');
  
  try {
    const metadata = await c.env.DB.prepare(`
      SELECT * FROM seo_metadata WHERE page_path = ?
    `).bind(page).first();
    
    if (!metadata) {
      // Return default metadata
      return c.json({
        title: 'MoodMash - AI-Powered Mood Tracking',
        description: 'Track your mood and emotional wellness with MoodMash.',
        keywords: 'mood tracker, mental health, wellness',
        og_title: 'MoodMash',
        og_description: 'Your AI-powered mental wellness companion.',
        og_image: `${BASE_URL}/static/og-image.png`,
        og_type: 'website',
        twitter_card: 'summary_large_image',
        canonical_url: `${BASE_URL}${page}`,
        robots: 'index, follow'
      });
    }
    
    return c.json(metadata);
    
  } catch (error) {
    console.error('Metadata error:', error);
    return c.json({ error: 'Failed to get metadata' }, 500);
  }
});

// ============================================================================
// STRUCTURED DATA API
// ============================================================================

seo.get('/schema/organization', (c) => {
  return c.json(organizationSchema);
});

seo.get('/schema/application', (c) => {
  return c.json(webApplicationSchema);
});

seo.get('/schema/faq', (c) => {
  return c.json(faqSchema);
});

seo.get('/schema/all', (c) => {
  return c.json([
    organizationSchema,
    webApplicationSchema,
    faqSchema
  ]);
});

// ============================================================================
// GENERATE HTML META TAGS
// ============================================================================

export function generateMetaTags(metadata: {
  title: string;
  description: string;
  keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_type?: string;
  twitter_card?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  canonical_url?: string;
  robots?: string;
  locale?: string;
}): string {
  const {
    title,
    description,
    keywords,
    og_title,
    og_description,
    og_image,
    og_type = 'website',
    twitter_card = 'summary_large_image',
    twitter_title,
    twitter_description,
    twitter_image,
    canonical_url,
    robots = 'index, follow',
    locale = 'en_US'
  } = metadata;
  
  const image = og_image || `${BASE_URL}/static/og-image.png`;
  
  return `
  <!-- Primary Meta Tags -->
  <title>${title}</title>
  <meta name="title" content="${title}">
  <meta name="description" content="${description}">
  ${keywords ? `<meta name="keywords" content="${keywords}">` : ''}
  <meta name="author" content="MoodMash">
  <meta name="robots" content="${robots}">
  ${canonical_url ? `<link rel="canonical" href="${canonical_url}">` : ''}
  
  <!-- Viewport -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${og_type}">
  <meta property="og:url" content="${canonical_url || BASE_URL}">
  <meta property="og:title" content="${og_title || title}">
  <meta property="og:description" content="${og_description || description}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="MoodMash">
  <meta property="og:locale" content="${locale}">
  <meta property="og:locale:alternate" content="es_ES">
  <meta property="og:locale:alternate" content="fr_FR">
  <meta property="og:locale:alternate" content="de_DE">
  <meta property="og:locale:alternate" content="ja_JP">
  <meta property="og:locale:alternate" content="ko_KR">
  <meta property="og:locale:alternate" content="zh_CN">
  <meta property="og:locale:alternate" content="ar_SA">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="${twitter_card}">
  <meta property="twitter:url" content="${canonical_url || BASE_URL}">
  <meta property="twitter:title" content="${twitter_title || og_title || title}">
  <meta property="twitter:description" content="${twitter_description || og_description || description}">
  <meta property="twitter:image" content="${twitter_image || image}">
  <meta name="twitter:site" content="@moodmash">
  <meta name="twitter:creator" content="@moodmash">
  
  <!-- Language Alternates -->
  <link rel="alternate" hreflang="en" href="${BASE_URL}">
  <link rel="alternate" hreflang="es" href="${BASE_URL}/es">
  <link rel="alternate" hreflang="fr" href="${BASE_URL}/fr">
  <link rel="alternate" hreflang="de" href="${BASE_URL}/de">
  <link rel="alternate" hreflang="ja" href="${BASE_URL}/ja">
  <link rel="alternate" hreflang="ko" href="${BASE_URL}/ko">
  <link rel="alternate" hreflang="zh" href="${BASE_URL}/zh">
  <link rel="alternate" hreflang="ar" href="${BASE_URL}/ar">
  <link rel="alternate" hreflang="x-default" href="${BASE_URL}">
  
  <!-- Apple -->
  <meta name="apple-mobile-web-app-title" content="MoodMash">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  
  <!-- MS -->
  <meta name="msapplication-TileColor" content="#7c3aed">
  <meta name="msapplication-TileImage" content="${BASE_URL}/static/icons/ms-icon-144x144.png">
  
  <!-- Theme -->
  <meta name="theme-color" content="#7c3aed">
  
  <!-- PWA -->
  <link rel="manifest" href="/manifest.json">
  
  <!-- Favicons -->
  <link rel="icon" type="image/png" sizes="32x32" href="/static/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/static/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/static/apple-touch-icon.png">
`;
}

// ============================================================================
// GENERATE JSON-LD SCRIPT TAGS
// ============================================================================

export function generateStructuredData(pageType: 'home' | 'features' | 'pricing' | 'faq' | 'about'): string {
  const schemas: any[] = [organizationSchema];
  
  if (pageType === 'home' || pageType === 'features') {
    schemas.push(webApplicationSchema);
  }
  
  if (pageType === 'faq') {
    schemas.push(faqSchema);
  }
  
  if (pageType === 'pricing') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'MoodMash Premium',
      description: 'Premium mood tracking with AI coaching and advanced features',
      brand: {
        '@type': 'Organization',
        name: 'MoodMash'
      },
      offers: [
        {
          '@type': 'Offer',
          name: 'Free',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        },
        {
          '@type': 'Offer',
          name: 'Plus',
          price: '4.99',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        },
        {
          '@type': 'Offer',
          name: 'Pro',
          price: '9.99',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        },
        {
          '@type': 'Offer',
          name: 'Enterprise',
          price: '19.99',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        }
      ]
    });
  }
  
  return schemas.map(schema => 
    `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
  ).join('\n');
}

export default seo;
