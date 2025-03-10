import { useTranslation as useNextTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

/**
 * Extended useTranslation hook with additional internationalization functionality
 * 
 * This hook extends the base next-i18next useTranslation hook with additional features
 * for handling locale changes, RTL detection, and locale-specific formatting.
 * 
 * @hook
 * @category Internationalization
 * @example
 * ```tsx
 * // Basic usage
 * const { t } = useTranslation('common');
 * return <p>{t('greeting')}</p>;
 * 
 * // Using multiple namespaces
 * const { t } = useTranslation(['common', 'auth']);
 * return (
 *   <div>
 *     <h1>{t('common:title')}</h1>
 *     <p>{t('auth:login')}</p>
 *   </div>
 * );
 * 
 * // Changing locale
 * const { changeLocale } = useTranslation();
 * return (
 *   <button onClick={() => changeLocale('fr')}>
 *     Switch to French
 *   </button>
 * );
 * 
 * // Formatting dates and numbers
 * const { formatDate, formatNumber } = useTranslation();
 * return (
 *   <div>
 *     <p>Date: {formatDate(new Date(), { dateStyle: 'full' })}</p>
 *     <p>Price: {formatNumber(1234.56, { style: 'currency', currency: 'EUR' })}</p>
 *   </div>
 * );
 * ```
 * 
 * @param {string | string[]} [namespace] - The translation namespace(s) to use
 * @returns {Object} Enhanced translation utilities and helpers
 * @returns {Function} return.t - Translation function
 * @returns {Object} return.i18n - i18next instance
 * @returns {string|undefined} return.locale - Current locale
 * @returns {string[]|undefined} return.locales - Available locales
 * @returns {string|undefined} return.defaultLocale - Default locale
 * @returns {Function} return.changeLocale - Function to change the current locale
 * @returns {Function} return.isRTL - Function that returns true if current language is RTL
 * @returns {Function} return.formatDate - Function to format dates according to current locale
 * @returns {Function} return.formatNumber - Function to format numbers according to current locale
 */
export const useTranslation = (namespace?: string | string[]) => {
  // Use next-i18next's useTranslation hook
  const { t, i18n } = useNextTranslation(namespace);
  const router = useRouter();
  const { locale, locales, defaultLocale } = router;

  /**
   * Change the current locale
   * 
   * Changes the application's locale by navigating to the same page
   * with a different locale setting. Also updates the HTML lang attribute.
   * 
   * @async
   * @function changeLocale
   * @param {string} newLocale - The new locale to switch to (e.g., 'en', 'fr', 'ar')
   * @returns {Promise<void>}
   * @throws {Error} If the router navigation fails
   */
  const changeLocale = async (newLocale: string) => {
    // Only proceed if the new locale is different and is one of the supported locales
    if (newLocale !== locale && locales?.includes(newLocale)) {
      // Get the current URL path without the locale
      const path = router.asPath;
      
      // Push the same path but with the new locale
      await router.push(path, path, { locale: newLocale });
      
      // This is needed to properly change the HTML lang attribute
      document.documentElement.lang = newLocale;
    }
  };

  /**
   * Check if current language is RTL (Right-to-Left)
   * 
   * @function isRTL
   * @returns {boolean} True if the current language uses RTL script
   */
  const isRTL = () => {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return locale ? rtlLanguages.includes(locale) : false;
  };

  /**
   * Format a date according to the current locale
   * 
   * Uses the browser's Intl.DateTimeFormat API to format dates
   * based on the current locale settings.
   * 
   * @function formatDate
   * @param {Date|number} date - The date to format
   * @param {Intl.DateTimeFormatOptions} [options] - Formatting options
   * @returns {string} The formatted date string
   * @example
   * // Basic usage
   * formatDate(new Date()) // "5/10/2025"
   * 
   * // With options
   * formatDate(new Date(), { dateStyle: 'full' }) // "Saturday, May 10, 2025"
   * formatDate(new Date(), { dateStyle: 'medium', timeStyle: 'short' }) // "May 10, 2025, 3:30 PM"
   */
  const formatDate = (date: Date | number, options?: Intl.DateTimeFormatOptions) => {
    return new Intl.DateTimeFormat(locale || 'en', options).format(date);
  };

  /**
   * Format a number according to the current locale
   * 
   * Uses the browser's Intl.NumberFormat API to format numbers
   * based on the current locale settings.
   * 
   * @function formatNumber
   * @param {number} number - The number to format
   * @param {Intl.NumberFormatOptions} [options] - Formatting options
   * @returns {string} The formatted number string
   * @example
   * // Basic usage
   * formatNumber(1234.56) // "1,234.56" in en-US, "1 234,56" in fr-FR
   * 
   * // Currency formatting
   * formatNumber(1234.56, { style: 'currency', currency: 'USD' }) // "$1,234.56"
   * formatNumber(1234.56, { style: 'currency', currency: 'EUR' }) // "€1,234.56"
   * 
   * // Percentage formatting
   * formatNumber(0.1234, { style: 'percent' }) // "12.34%"
   */
  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(locale || 'en', options).format(number);
  };

  return {
    t,
    i18n,
    locale,
    locales,
    defaultLocale,
    changeLocale,
    isRTL,
    formatDate,
    formatNumber
  };
}; 