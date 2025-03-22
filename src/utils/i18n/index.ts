import { UserConfig } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

/**
 * MoodMash Internationalization Configuration
 */

export type SupportedLocale = 'en' | 'fr' | 'es' | 'de' | 'ja' | 'zh' | 'ko' | 'ru' | 'ar' | 'he';

export interface Language {
  code: SupportedLocale;
  name: string;
  flag?: string;
  dir: 'ltr' | 'rtl';
  enabled?: boolean;
}

/**
 * List of supported languages in the application
 * Add new languages here to make them available in the language switcher
 */
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr', enabled: true },
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr', enabled: true },
  { code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr', enabled: true },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', dir: 'ltr', enabled: true },
  { code: 'ja', name: '日本語', flag: '🇯🇵', dir: 'ltr', enabled: true },
  { code: 'zh', name: '中文', flag: '🇨🇳', dir: 'ltr', enabled: true },
  { code: 'ko', name: '한국어', flag: '🇰🇷', dir: 'ltr', enabled: true },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', dir: 'ltr', enabled: false },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl', enabled: false },
  { code: 'he', name: 'עברית', flag: '🇮🇱', dir: 'rtl', enabled: false },
];

/**
 * Get list of enabled languages
 * @returns Array of enabled languages
 */
export const getEnabledLanguages = (): Language[] => {
  return SUPPORTED_LANGUAGES.filter(lang => lang.enabled !== false);
};

/**
 * Default namespaces that should be loaded for all pages
 */
export const DEFAULT_NAMESPACES = ['common'];

/**
 * Get language by code
 * @param code Language code
 * @returns Language object or null if not found
 */
export const getLanguageByCode = (code: string): Language | null => {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code) || null;
};

/**
 * i18next configuration for the application
 */
export const i18nConfig: UserConfig = {
  i18n: {
    defaultLocale: 'en',
    locales: SUPPORTED_LANGUAGES.map(lang => lang.code),
  },
  // Skip client-side initialization
  // We initialize i18next in _app.js with client-side options
  serializeConfig: false,
  localePath: typeof window === 'undefined' ? process.cwd() + '/public/locales' : '/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  debug: process.env.NODE_ENV === 'development',
  // React-specific options
  react: {
    useSuspense: false,
  },
  // Detect user language
  detection: {
    // Order and from where user language should be detected
    order: ['cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
    // Keys or params to lookup language from
    lookupCookie: 'i18next',
    lookupLocalStorage: 'i18nextLng',
    // Cache user language in cookies and local storage
    caches: ['localStorage', 'cookie'],
    // Optional expire and domain for set cookie
    cookieMinutes: 10080, // 7 days
  },
};

/**
 * Helper to load translations for getStaticProps or getServerSideProps
 * @param locale - Current locale
 * @param namespaces - List of namespaces to load beyond the default ones
 * @returns Props with loaded translations
 */
export const loadTranslations = async (
  locale: string,
  namespaces: string[] = []
) => {
  const allNamespaces = [...DEFAULT_NAMESPACES, ...namespaces];
  return await serverSideTranslations(locale, allNamespaces);
};

/**
 * Determine text direction based on locale
 * @param locale - Locale code
 * @returns Text direction (ltr or rtl)
 */
export const getTextDirection = (locale: string): 'ltr' | 'rtl' => {
  const language = getLanguageByCode(locale);
  return language?.dir || 'ltr';
}; 