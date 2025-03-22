import { useTranslation as useNextTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import { formatCurrency, formatDate, formatNumber, formatPercent, formatRelativeDate, formatTimeAgo } from '../intlFormatters';

export type SupportedLocale = 'en' | 'fr' | 'es' | 'de' | 'ja' | 'zh' | 'ko' | 'ru' | 'ar' | 'he';

/**
 * Extended i18n hook that provides translation functions and formatting utilities
 * @param ns - Namespace or array of namespaces
 * @returns Extended translation functions and formatters
 */
export const useTranslation = (ns?: string | string[]) => {
  const router = useRouter();
  const locale = router.locale as SupportedLocale || 'en';
  const { t, i18n } = useNextTranslation(ns);

  /**
   * Change the current language
   * @param newLocale - The locale to switch to
   */
  const changeLanguage = useCallback(
    async (newLocale: SupportedLocale) => {
      // Skip if the locale is already set
      if (newLocale === locale) return;

      // Change the language in i18next
      await i18n.changeLanguage(newLocale);

      // Update the URL to reflect the new locale
      const { pathname, asPath, query } = router;
      router.push({ pathname, query }, asPath, { locale: newLocale, scroll: false });

      // Update HTML lang and dir attributes
      const html = document.documentElement;
      html.setAttribute('lang', newLocale);
      html.setAttribute('dir', newLocale === 'ar' || newLocale === 'he' ? 'rtl' : 'ltr');

      // Store the user's language preference
      localStorage.setItem('userLanguage', newLocale);
    },
    [locale, i18n, router]
  );

  /**
   * Check if the text direction is RTL
   */
  const isRTL = useMemo(() => {
    return locale === 'ar' || locale === 'he';
  }, [locale]);

  /**
   * Format a date with the current locale
   */
  const formatDateWithLocale = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      return formatDate(date, locale, options);
    },
    [locale]
  );

  /**
   * Format a relative date with the current locale
   */
  const formatRelativeDateWithLocale = useCallback(
    (date: Date | string | number, baseDate?: Date) => {
      return formatRelativeDate(date, locale, baseDate);
    },
    [locale]
  );

  /**
   * Format a time ago string with the current locale
   */
  const formatTimeAgoWithLocale = useCallback(
    (date: Date | string | number, options?: { addSuffix?: boolean; includeSeconds?: boolean }) => {
      return formatTimeAgo(date, locale, options);
    },
    [locale]
  );

  /**
   * Format a number with the current locale
   */
  const formatNumberWithLocale = useCallback(
    (number: number, options?: Intl.NumberFormatOptions) => {
      return formatNumber(number, locale, options);
    },
    [locale]
  );

  /**
   * Format a currency value with the current locale
   */
  const formatCurrencyWithLocale = useCallback(
    (amount: number, currency: string, options?: Intl.NumberFormatOptions) => {
      return formatCurrency(amount, locale, currency, options);
    },
    [locale]
  );

  /**
   * Format a percentage with the current locale
   */
  const formatPercentWithLocale = useCallback(
    (number: number, options?: Intl.NumberFormatOptions) => {
      return formatPercent(number, locale, options);
    },
    [locale]
  );

  /**
   * Translate with current namespace and locale
   */
  const translate = useCallback(
    (key: string, options?: Record<string, any>) => {
      return t(key, options);
    },
    [t]
  );

  return {
    t: translate,
    i18n,
    locale,
    changeLanguage,
    isRTL,
    formatDate: formatDateWithLocale,
    formatRelativeDate: formatRelativeDateWithLocale,
    formatTimeAgo: formatTimeAgoWithLocale,
    formatNumber: formatNumberWithLocale,
    formatCurrency: formatCurrencyWithLocale,
    formatPercent: formatPercentWithLocale,
  };
};

/**
 * Hook to detect if the current locale uses RTL text direction
 * @returns Boolean indicating if the current locale is RTL
 */
export const useRTL = () => {
  const router = useRouter();
  const locale = router.locale || 'en';
  
  return useMemo(() => {
    return locale === 'ar' || locale === 'he';
  }, [locale]);
};

/**
 * Hook to get the current locale from the router
 * @returns The current locale
 */
export const useLocale = (): SupportedLocale => {
  const router = useRouter();
  return (router.locale as SupportedLocale) || 'en';
};

/**
 * Hook to initialize the user's preferred language on first load
 * @param defaultLocale - The default locale to use if no preference is found
 */
export const useInitLanguage = (defaultLocale: SupportedLocale = 'en') => {
  const router = useRouter();
  
  const initLanguage = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Get user's preferred language from localStorage or browser settings
    const savedLanguage = localStorage.getItem('userLanguage') as SupportedLocale;
    const browserLanguage = navigator.language.split('-')[0] as SupportedLocale;
    
    // Use saved language, browser language, or default in that order of preference
    const preferredLanguage = savedLanguage || browserLanguage || defaultLocale;
    
    // Only change if current locale is different from preferred
    if (router.locale !== preferredLanguage) {
      const { pathname, asPath, query } = router;
      router.push({ pathname, query }, asPath, { 
        locale: preferredLanguage, 
        scroll: false 
      });
      
      // Update HTML attributes
      document.documentElement.setAttribute('lang', preferredLanguage);
      document.documentElement.setAttribute(
        'dir', 
        preferredLanguage === 'ar' || preferredLanguage === 'he' ? 'rtl' : 'ltr'
      );
    }
  }, [router, defaultLocale]);
  
  return initLanguage;
}; 