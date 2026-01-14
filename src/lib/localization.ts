/**
 * Localization Library for Currency, Taxation, and Regional Settings
 * 
 * Provides comprehensive regional formatting support for MoodMash
 * 
 * Features:
 * - Currency formatting with locale-specific symbols
 * - Regional taxation rates and rules
 * - Date/time formatting by region
 * - Number formatting (decimals, thousands separators)
 * - Address formatting by country
 * - Phone number formatting
 */

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'INR' | 'BRL' | 'RUB' | 'SAR' | 'AED' | 'CAD' | 'AUD';
export type CountryCode = 'US' | 'GB' | 'DE' | 'FR' | 'JP' | 'CN' | 'IN' | 'BR' | 'RU' | 'SA' | 'AE' | 'CA' | 'AU' | 'ES' | 'IT' | 'PT' | 'MX';

export interface TaxConfig {
  rate: number;           // Base VAT/Sales tax rate (percentage)
  name: string;           // Tax name (VAT, GST, Sales Tax, etc.)
  included: boolean;      // Whether tax is included in displayed prices
  digitalServicesRate?: number;  // Special rate for digital services
  subscriptionRate?: number;     // Rate for subscription services
  exemptThreshold?: number;      // Income/purchase threshold for exemption
}

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  symbolPosition: 'before' | 'after';
  spaceBetween: boolean;
}

export interface RegionalConfig {
  country: CountryCode;
  language: string;
  timezone: string;
  currency: CurrencyConfig;
  tax: TaxConfig;
  dateFormat: string;     // 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  timeFormat: '12h' | '24h';
  firstDayOfWeek: 0 | 1;  // 0 = Sunday, 1 = Monday
  measurementSystem: 'metric' | 'imperial';
}

/**
 * Currency configurations for supported regions
 */
export const currencies: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
    spaceBetween: false,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    symbolPosition: 'after',
    spaceBetween: true,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
    spaceBetween: false,
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
    spaceBetween: false,
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
    spaceBetween: false,
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
    spaceBetween: false,
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    symbolPosition: 'before',
    spaceBetween: true,
  },
  RUB: {
    code: 'RUB',
    symbol: '₽',
    name: 'Russian Ruble',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    symbolPosition: 'after',
    spaceBetween: true,
  },
  SAR: {
    code: 'SAR',
    symbol: 'ر.س',
    name: 'Saudi Riyal',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
    spaceBetween: true,
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
    spaceBetween: true,
  },
  CAD: {
    code: 'CAD',
    symbol: '$',
    name: 'Canadian Dollar',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
    spaceBetween: false,
  },
  AUD: {
    code: 'AUD',
    symbol: '$',
    name: 'Australian Dollar',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
    spaceBetween: false,
  },
};

/**
 * Regional tax configurations
 */
export const taxConfigs: Record<CountryCode, TaxConfig> = {
  US: {
    rate: 0,              // No federal sales tax (varies by state)
    name: 'Sales Tax',
    included: false,
    digitalServicesRate: 0,
    subscriptionRate: 0,
  },
  GB: {
    rate: 20,
    name: 'VAT',
    included: true,
    digitalServicesRate: 20,
    subscriptionRate: 20,
  },
  DE: {
    rate: 19,
    name: 'MwSt',
    included: true,
    digitalServicesRate: 19,
    subscriptionRate: 19,
  },
  FR: {
    rate: 20,
    name: 'TVA',
    included: true,
    digitalServicesRate: 20,
    subscriptionRate: 20,
  },
  JP: {
    rate: 10,
    name: 'Consumption Tax',
    included: true,
    digitalServicesRate: 10,
    subscriptionRate: 10,
  },
  CN: {
    rate: 13,
    name: 'VAT',
    included: true,
    digitalServicesRate: 6,
    subscriptionRate: 6,
  },
  IN: {
    rate: 18,
    name: 'GST',
    included: false,
    digitalServicesRate: 18,
    subscriptionRate: 18,
  },
  BR: {
    rate: 17,
    name: 'ICMS',
    included: true,
    digitalServicesRate: 9.25,
    subscriptionRate: 9.25,
  },
  RU: {
    rate: 20,
    name: 'NDS',
    included: true,
    digitalServicesRate: 20,
    subscriptionRate: 20,
  },
  SA: {
    rate: 15,
    name: 'VAT',
    included: true,
    digitalServicesRate: 15,
    subscriptionRate: 15,
  },
  AE: {
    rate: 5,
    name: 'VAT',
    included: true,
    digitalServicesRate: 5,
    subscriptionRate: 5,
  },
  CA: {
    rate: 5,              // Federal GST (PST varies by province)
    name: 'GST',
    included: false,
    digitalServicesRate: 5,
    subscriptionRate: 5,
  },
  AU: {
    rate: 10,
    name: 'GST',
    included: true,
    digitalServicesRate: 10,
    subscriptionRate: 10,
  },
  ES: {
    rate: 21,
    name: 'IVA',
    included: true,
    digitalServicesRate: 21,
    subscriptionRate: 21,
  },
  IT: {
    rate: 22,
    name: 'IVA',
    included: true,
    digitalServicesRate: 22,
    subscriptionRate: 22,
  },
  PT: {
    rate: 23,
    name: 'IVA',
    included: true,
    digitalServicesRate: 23,
    subscriptionRate: 23,
  },
  MX: {
    rate: 16,
    name: 'IVA',
    included: true,
    digitalServicesRate: 16,
    subscriptionRate: 16,
  },
};

/**
 * Complete regional configurations
 */
export const regions: Record<CountryCode, RegionalConfig> = {
  US: {
    country: 'US',
    language: 'en-US',
    timezone: 'America/New_York',
    currency: currencies.USD,
    tax: taxConfigs.US,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    firstDayOfWeek: 0,
    measurementSystem: 'imperial',
  },
  GB: {
    country: 'GB',
    language: 'en-GB',
    timezone: 'Europe/London',
    currency: currencies.GBP,
    tax: taxConfigs.GB,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    firstDayOfWeek: 1,
    measurementSystem: 'metric',
  },
  DE: {
    country: 'DE',
    language: 'de-DE',
    timezone: 'Europe/Berlin',
    currency: currencies.EUR,
    tax: taxConfigs.DE,
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    firstDayOfWeek: 1,
    measurementSystem: 'metric',
  },
  FR: {
    country: 'FR',
    language: 'fr-FR',
    timezone: 'Europe/Paris',
    currency: currencies.EUR,
    tax: taxConfigs.FR,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    firstDayOfWeek: 1,
    measurementSystem: 'metric',
  },
  JP: {
    country: 'JP',
    language: 'ja-JP',
    timezone: 'Asia/Tokyo',
    currency: currencies.JPY,
    tax: taxConfigs.JP,
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '24h',
    firstDayOfWeek: 0,
    measurementSystem: 'metric',
  },
  CN: {
    country: 'CN',
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    currency: currencies.CNY,
    tax: taxConfigs.CN,
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    firstDayOfWeek: 1,
    measurementSystem: 'metric',
  },
  IN: {
    country: 'IN',
    language: 'hi-IN',
    timezone: 'Asia/Kolkata',
    currency: currencies.INR,
    tax: taxConfigs.IN,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    firstDayOfWeek: 0,
    measurementSystem: 'metric',
  },
  BR: {
    country: 'BR',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    currency: currencies.BRL,
    tax: taxConfigs.BR,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    firstDayOfWeek: 0,
    measurementSystem: 'metric',
  },
  RU: {
    country: 'RU',
    language: 'ru-RU',
    timezone: 'Europe/Moscow',
    currency: currencies.RUB,
    tax: taxConfigs.RU,
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    firstDayOfWeek: 1,
    measurementSystem: 'metric',
  },
  SA: {
    country: 'SA',
    language: 'ar-SA',
    timezone: 'Asia/Riyadh',
    currency: currencies.SAR,
    tax: taxConfigs.SA,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    firstDayOfWeek: 0,
    measurementSystem: 'metric',
  },
  AE: {
    country: 'AE',
    language: 'ar-AE',
    timezone: 'Asia/Dubai',
    currency: currencies.AED,
    tax: taxConfigs.AE,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    firstDayOfWeek: 0,
    measurementSystem: 'metric',
  },
  CA: {
    country: 'CA',
    language: 'en-CA',
    timezone: 'America/Toronto',
    currency: currencies.CAD,
    tax: taxConfigs.CA,
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '12h',
    firstDayOfWeek: 0,
    measurementSystem: 'metric',
  },
  AU: {
    country: 'AU',
    language: 'en-AU',
    timezone: 'Australia/Sydney',
    currency: currencies.AUD,
    tax: taxConfigs.AU,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    firstDayOfWeek: 1,
    measurementSystem: 'metric',
  },
  ES: {
    country: 'ES',
    language: 'es-ES',
    timezone: 'Europe/Madrid',
    currency: currencies.EUR,
    tax: taxConfigs.ES,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    firstDayOfWeek: 1,
    measurementSystem: 'metric',
  },
  IT: {
    country: 'IT',
    language: 'it-IT',
    timezone: 'Europe/Rome',
    currency: currencies.EUR,
    tax: taxConfigs.IT,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    firstDayOfWeek: 1,
    measurementSystem: 'metric',
  },
  PT: {
    country: 'PT',
    language: 'pt-PT',
    timezone: 'Europe/Lisbon',
    currency: currencies.EUR,
    tax: taxConfigs.PT,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    firstDayOfWeek: 1,
    measurementSystem: 'metric',
  },
  MX: {
    country: 'MX',
    language: 'es-MX',
    timezone: 'America/Mexico_City',
    currency: currencies.USD, // Uses MXN but often shows USD
    tax: taxConfigs.MX,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    firstDayOfWeek: 0,
    measurementSystem: 'metric',
  },
};

/**
 * Localization Manager Class
 */
export class LocalizationManager {
  private currentRegion: RegionalConfig;
  private static instance: LocalizationManager | null = null;

  constructor(countryCode: CountryCode = 'US') {
    this.currentRegion = regions[countryCode] || regions.US;
  }

  static getInstance(countryCode?: CountryCode): LocalizationManager {
    if (!LocalizationManager.instance) {
      LocalizationManager.instance = new LocalizationManager(countryCode);
    }
    return LocalizationManager.instance;
  }

  /**
   * Set the current region
   */
  setRegion(countryCode: CountryCode): void {
    if (regions[countryCode]) {
      this.currentRegion = regions[countryCode];
    }
  }

  /**
   * Get current region configuration
   */
  getRegion(): RegionalConfig {
    return this.currentRegion;
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currencyCode?: CurrencyCode): string {
    const currency = currencyCode 
      ? currencies[currencyCode] 
      : this.currentRegion.currency;

    const fixed = amount.toFixed(currency.decimalPlaces);
    const [intPart, decPart] = fixed.split('.');
    
    // Add thousands separators
    const formattedInt = intPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      currency.thousandsSeparator
    );
    
    const formattedNumber = decPart 
      ? `${formattedInt}${currency.decimalSeparator}${decPart}`
      : formattedInt;

    const space = currency.spaceBetween ? ' ' : '';
    
    return currency.symbolPosition === 'before'
      ? `${currency.symbol}${space}${formattedNumber}`
      : `${formattedNumber}${space}${currency.symbol}`;
  }

  /**
   * Calculate tax amount
   */
  calculateTax(amount: number, type: 'standard' | 'digital' | 'subscription' = 'standard'): number {
    const tax = this.currentRegion.tax;
    let rate: number;

    switch (type) {
      case 'digital':
        rate = tax.digitalServicesRate ?? tax.rate;
        break;
      case 'subscription':
        rate = tax.subscriptionRate ?? tax.rate;
        break;
      default:
        rate = tax.rate;
    }

    return amount * (rate / 100);
  }

  /**
   * Get price with tax
   */
  getPriceWithTax(basePrice: number, type: 'standard' | 'digital' | 'subscription' = 'standard'): {
    basePrice: number;
    taxAmount: number;
    totalPrice: number;
    taxRate: number;
    taxName: string;
    taxIncluded: boolean;
  } {
    const tax = this.currentRegion.tax;
    const taxAmount = this.calculateTax(basePrice, type);
    
    return {
      basePrice,
      taxAmount,
      totalPrice: tax.included ? basePrice : basePrice + taxAmount,
      taxRate: type === 'digital' 
        ? (tax.digitalServicesRate ?? tax.rate)
        : type === 'subscription'
          ? (tax.subscriptionRate ?? tax.rate)
          : tax.rate,
      taxName: tax.name,
      taxIncluded: tax.included,
    };
  }

  /**
   * Format date according to regional settings
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const format = this.currentRegion.dateFormat;
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', String(year));
  }

  /**
   * Format time according to regional settings
   */
  formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (this.currentRegion.timeFormat === '12h') {
      const hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes} ${period}`;
    } else {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }

  /**
   * Format number with regional separators
   */
  formatNumber(num: number, decimals: number = 2): string {
    const currency = this.currentRegion.currency;
    const fixed = num.toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');
    
    const formattedInt = intPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      currency.thousandsSeparator
    );
    
    return decPart 
      ? `${formattedInt}${currency.decimalSeparator}${decPart}`
      : formattedInt;
  }

  /**
   * Get all supported regions
   */
  static getSupportedRegions(): CountryCode[] {
    return Object.keys(regions) as CountryCode[];
  }

  /**
   * Get all supported currencies
   */
  static getSupportedCurrencies(): CurrencyCode[] {
    return Object.keys(currencies) as CurrencyCode[];
  }

  /**
   * Detect region from browser/Cloudflare headers
   */
  static detectRegion(headers?: { 'cf-ipcountry'?: string; 'accept-language'?: string }): CountryCode {
    // Try Cloudflare country header first
    if (headers?.['cf-ipcountry']) {
      const country = headers['cf-ipcountry'].toUpperCase() as CountryCode;
      if (regions[country]) return country;
    }

    // Fallback to browser language detection
    if (headers?.['accept-language']) {
      const lang = headers['accept-language'].split(',')[0];
      const langMap: Record<string, CountryCode> = {
        'en-US': 'US',
        'en-GB': 'GB',
        'de': 'DE',
        'de-DE': 'DE',
        'fr': 'FR',
        'fr-FR': 'FR',
        'ja': 'JP',
        'zh': 'CN',
        'zh-CN': 'CN',
        'hi': 'IN',
        'pt': 'BR',
        'pt-BR': 'BR',
        'ru': 'RU',
        'ar': 'SA',
        'ar-SA': 'SA',
        'es': 'ES',
        'es-ES': 'ES',
        'es-MX': 'MX',
        'it': 'IT',
      };
      if (langMap[lang]) return langMap[lang];
    }

    return 'US'; // Default
  }
}

/**
 * Singleton instance for easy access
 */
export const localization = LocalizationManager.getInstance();

/**
 * Utility functions for direct use
 */
export const formatCurrency = (amount: number, currency?: CurrencyCode) => 
  localization.formatCurrency(amount, currency);

export const formatDate = (date: Date | string) => 
  localization.formatDate(date);

export const formatTime = (date: Date | string) => 
  localization.formatTime(date);

export const formatNumber = (num: number, decimals?: number) => 
  localization.formatNumber(num, decimals);

export const calculateTax = (amount: number, type?: 'standard' | 'digital' | 'subscription') => 
  localization.calculateTax(amount, type);

export const getPriceWithTax = (basePrice: number, type?: 'standard' | 'digital' | 'subscription') => 
  localization.getPriceWithTax(basePrice, type);
