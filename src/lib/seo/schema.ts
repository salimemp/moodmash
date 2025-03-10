/**
 * Helper functions to generate structured data for SEO 
 * Using the Schema.org vocabulary
 */

const SITE_NAME = 'MoodMash';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moodmash.com';

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
}

/**
 * Generate Person schema
 */
export function generatePersonSchema(
  name: string,
  image?: string,
  description?: string,
  socialProfiles?: string[],
  url?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    ...(image && { image }),
    ...(description && { description }),
    ...(url && { url: url.startsWith('http') ? url : `${BASE_URL}${url}` }),
    ...(socialProfiles && {
      sameAs: socialProfiles,
    }),
  };
}

/**
 * Generate FAQ schema
 */
export function generateFAQSchema(
  questions: Array<{ question: string; answer: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Generate Article schema
 */
export function generateArticleSchema(
  headline: string,
  image: string,
  datePublished: string,
  dateModified: string,
  authorName: string,
  description?: string,
  authorUrl?: string,
  articleUrl?: string,
  articleSection?: string,
  keywords?: string[]
) {
  const fullImageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;
  const fullArticleUrl = articleUrl 
    ? (articleUrl.startsWith('http') ? articleUrl : `${BASE_URL}${articleUrl}`)
    : undefined;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    image: fullImageUrl,
    datePublished,
    dateModified,
    author: {
      '@type': 'Person',
      name: authorName,
      ...(authorUrl && { url: authorUrl.startsWith('http') ? authorUrl : `${BASE_URL}${authorUrl}` }),
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/images/logo.png`,
      },
    },
    ...(description && { description }),
    ...(fullArticleUrl && { url: fullArticleUrl }),
    ...(articleSection && { articleSection }),
    ...(keywords && { keywords: keywords.join(', ') }),
  };
}

/**
 * Generate Product schema
 */
export function generateProductSchema(
  name: string,
  image: string,
  description: string,
  url?: string,
  sku?: string,
  brand?: string,
  offers?: {
    price: number;
    priceCurrency: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    validFrom?: string;
  }
) {
  const fullImageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;
  const productUrl = url 
    ? (url.startsWith('http') ? url : `${BASE_URL}${url}`)
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    image: fullImageUrl,
    description,
    ...(productUrl && { url: productUrl }),
    ...(sku && { sku }),
    ...(brand && { brand: { '@type': 'Brand', name: brand } }),
    ...(offers && {
      offers: {
        '@type': 'Offer',
        price: offers.price,
        priceCurrency: offers.priceCurrency,
        ...(offers.availability && { availability: `https://schema.org/${offers.availability}` }),
        ...(offers.validFrom && { validFrom: offers.validFrom }),
        url: productUrl || BASE_URL,
      },
    }),
  };
} 