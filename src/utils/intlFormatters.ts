/**
 * Enhanced utilities for internationalized date, number, and currency formatting
 */

import type { Locale } from 'date-fns';
import { format, formatDistance, formatRelative } from 'date-fns';
import { ar, de, enUS, es, fr, he, it, ja, ko, nl, pl, pt, ru, sv, tr, zhCN } from 'date-fns/locale';

// Map of available locales for date-fns
export const dateLocales: Record<string, Locale> = {
  en: enUS,
  es: es,
  fr: fr,
  de: de,
  zh: zhCN,
  ja: ja,
  ko: ko,
  ru: ru,
  pt: pt,
  it: it,
  ar: ar,
  he: he,
  tr: tr,
  nl: nl,
  sv: sv,
  pl: pl,
};

/**
 * Get date-fns locale object for the given locale
 */
export const getDateLocale = (locale: string): Locale => {
  // For locales with region, try to match without region first
  const baseLocale = locale.split('-')[0];
  return dateLocales[baseLocale] || dateLocales.en;
};

/**
 * Format a date according to the specified locale and options
 * @param date - Date to format
 * @param locale - Locale code
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | number | string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  // Convert to Date object if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date instanceof Date ? date : new Date(date);
  
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Format a date in a specific pattern
 * @param date - Date to format
 * @param locale - Locale code
 * @param pattern - Format pattern (e.g., 'yyyy-MM-dd')
 * @returns Formatted date string
 */
export function formatDatePattern(
  date: Date | number | string,
  locale: string,
  pattern: string
): string {
  // Convert to Date object if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date instanceof Date ? date : new Date(date);
  
  return format(dateObj, pattern, { locale: getDateLocale(locale) });
}

/**
 * Format a date relative to the current date
 * @param date - Date to format
 * @param locale - Locale code
 * @param baseDate - Base date to compare against (default: now)
 * @returns Formatted relative date string
 */
export function formatRelativeDate(
  date: Date | number | string,
  locale: string,
  baseDate: Date = new Date()
): string {
  // Convert to Date object if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date instanceof Date ? date : new Date(date);
  
  return formatRelative(dateObj, baseDate, { locale: getDateLocale(locale) });
}

/**
 * Format a date as a distance from now
 * @param date - Date to format
 * @param locale - Locale code
 * @param options - Options for date-fns formatDistance
 * @returns Formatted distance string
 */
export function formatTimeAgo(
  date: Date | number | string,
  locale: string,
  options?: { addSuffix?: boolean; includeSeconds?: boolean }
): string {
  // Convert to Date object if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date instanceof Date ? date : new Date(date);
  
  return formatDistance(dateObj, new Date(), {
    locale: getDateLocale(locale),
    addSuffix: options?.addSuffix ?? true,
    includeSeconds: options?.includeSeconds ?? true,
  });
}

/**
 * Format a number according to the specified locale and options
 * @param number - Number to format
 * @param locale - Locale code
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 */
export function formatNumber(
  number: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(number);
}

/**
 * Format a currency value
 * @param amount - Amount to format
 * @param locale - Locale code
 * @param currency - Currency code (e.g., 'USD', 'EUR')
 * @param options - Additional Intl.NumberFormat options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  locale: string,
  currency: string,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...options,
  }).format(amount);
}

/**
 * Format a percentage
 * @param number - Number to format as percentage (0.1 = 10%)
 * @param locale - Locale code
 * @param options - Additional Intl.NumberFormat options
 * @returns Formatted percentage string
 */
export function formatPercent(
  number: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(number);
}

/**
 * Format a file size
 * @param bytes - Size in bytes
 * @param locale - Locale code
 * @param options - Additional options
 * @returns Formatted file size string
 */
export function formatFileSize(
  bytes: number,
  locale: string,
  options?: { decimals?: number; binary?: boolean }
): string {
  const { decimals = 2, binary = false } = options || {};
  const units = binary
    ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    : ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const base = binary ? 1024 : 1000;

  if (bytes === 0) return `0 ${units[0]}`;

  const i = Math.floor(Math.log(bytes) / Math.log(base));
  const size = bytes / Math.pow(base, i);

  return `${formatNumber(size, locale, { maximumFractionDigits: decimals })} ${units[i]}`;
}

/**
 * Get locale-specific currency symbol
 * @param locale - Locale code
 * @param currency - Currency code
 * @returns Currency symbol for the specified locale and currency
 */
export function getCurrencySymbol(locale: string, currency: string): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
  });
  
  // Format 0 and extract just the symbol
  const formatted = formatter.format(0);
  return formatted.replace(/[0-9,.\s]/g, '').trim();
} 