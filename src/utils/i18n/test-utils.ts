import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { vi } from 'vitest';

// Define a type for the resources object to avoid indexing errors
type ResourcesType = {
  [locale: string]: {
    [namespace: string]: Record<string, any>;
  };
};

// Mock resources for testing
const resources: ResourcesType = {
  en: {
    common: {
      welcome: 'Welcome',
      buttons: {
        save: 'Save',
        cancel: 'Cancel',
        submit: 'Submit',
      },
      language_switcher: {
        change_language: 'Change language',
      },
    },
    profile: {
      title: 'Profile',
      description: 'Edit your profile information',
    },
  },
  fr: {
    common: {
      welcome: 'Bienvenue',
      buttons: {
        save: 'Enregistrer',
        cancel: 'Annuler',
        submit: 'Soumettre',
      },
      language_switcher: {
        change_language: 'Changer de langue',
      },
    },
    profile: {
      title: 'Profil',
      description: 'Modifier vos informations de profil',
    },
  },
};

// Initialize i18n instance for testing
i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    resources,
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    defaultNS: 'common',
    ns: ['common', 'profile'],
  });

export default i18n;

/**
 * Creates a mock implementation of our custom useTranslation hook
 * @param locale The locale to use for the mock
 * @returns A mocked version of the useTranslation hook
 */
export const mockUseTranslation = (locale = 'en') => {
  const tFunction = (key: string, options?: Record<string, any>) => {
    const namespacedKey = key.includes(':') ? key : `common:${key}`;
    const [namespace, actualKey] = namespacedKey.split(':');
    
    if (!resources[locale] || !resources[locale][namespace]) {
      return actualKey;
    }
    
    // Navigate through nested keys
    const keyParts = actualKey.split('.');
    let value: any = resources[locale][namespace];
    
    for (const part of keyParts) {
      if (value === undefined || value === null || typeof value !== 'object') {
        return actualKey;
      }
      value = value[part];
      if (value === undefined) {
        return actualKey;
      }
    }
    
    // Basic interpolation for variables
    if (options && typeof value === 'string') {
      return Object.entries(options).reduce((result, [key, val]) => {
        return result.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
      }, value);
    }
    
    return value;
  };
  
  return {
    t: tFunction,
    i18n,
    locale,
    changeLanguage: vi.fn(),
    isRTL: locale === 'ar' || locale === 'he',
    formatDate: (date: Date | number | string) => new Date(date).toLocaleDateString(locale),
    formatNumber: (num: number) => num.toLocaleString(locale),
    formatCurrency: (amount: number, currency: string) => 
      new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount),
    formatPercent: (num: number) => 
      new Intl.NumberFormat(locale, { style: 'percent' }).format(num),
  };
};

/**
 * Mock for Next.js router
 * @param locale The current locale
 * @returns A mocked version of useRouter
 */
export const mockRouter = (locale = 'en') => ({
  locale,
  locales: ['en', 'fr', 'es', 'de', 'ja', 'ar'],
  push: vi.fn(),
  asPath: '/',
  pathname: '/',
  query: {},
  events: {
    on: vi.fn(),
    off: vi.fn(),
  },
}); 