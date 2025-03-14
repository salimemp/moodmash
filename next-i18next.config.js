/**
 * @type {import('next-i18next').UserConfig}
 */
module.exports = {
  // List of languages supported by the application
  // ISO language codes: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
  i18n: {
    defaultLocale: 'en',
    locales: [
      'en', // English
      'es', // Spanish
      'fr', // French
      'de', // German
      'zh', // Chinese
      'ja', // Japanese
      'ko', // Korean
      'ru', // Russian
      'pt', // Portuguese
      'it', // Italian
      'ar', // Arabic (RTL)
      'he', // Hebrew (RTL)
      'fa', // Persian/Farsi (RTL)
      'ur', // Urdu (RTL)
      'hi', // Hindi
      'bn', // Bengali
      'tr', // Turkish
      'nl', // Dutch
      'sv', // Swedish
      'pl', // Polish
    ],
    // RTL languages will be handled internally in the app code
  },
  // Namespaces are used to organize translations
  ns: ['common', 'auth', 'profile', 'messages', 'errors', 'components'],
  defaultNS: 'common',
  localePath: './public/locales',
  // When set to true, the language detection is applied
  // This way user can navigate to the different language version
  localeDetection: true,
  // Configuration for server-side rendering
  serializeConfig: false,
  // Allow using HTML in translation strings
  react: {
    useSuspense: false,
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'p', 'span'],
  },
  // Configure backend for loading translations
  detection: {
    // Order of methods used to detect user language
    order: ['cookie', 'querystring', 'localStorage', 'navigator', 'htmlTag'],
    // Use cookies to store user language preference
    lookupCookie: 'NEXT_LOCALE',
    lookupQuerystring: 'locale',
    lookupLocalStorage: 'i18nextLng',
    caches: ['cookie', 'localStorage'],
    cookieSecure: process.env.NODE_ENV === 'production',
  },
};
