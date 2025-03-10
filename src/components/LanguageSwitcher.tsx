import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useDirection } from '@/context/DirectionContext';

/**
 * Interface representing a language configuration
 * 
 * @interface Language
 * @typedef {Object} Language
 * @property {string} code - ISO language code (e.g., 'en', 'es')
 * @property {string} name - English name of the language
 * @property {string} nativeName - Name of the language in its native script
 * @property {string} [flag] - Optional emoji flag representing the language
 * @property {boolean} [isRTL] - Whether the language uses right-to-left script
 */
interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
  isRTL?: boolean;
}

/**
 * Array of supported languages with their configurations
 * 
 * @type {Language[]}
 */
const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isRTL: true },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'he', name: 'Hebrew', nativeName: 'עִבְרִית', flag: '🇮🇱', isRTL: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', isRTL: true },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', isRTL: true },
];

/**
 * Props for the LanguageSwitcher component
 * 
 * @interface LanguageSwitcherProps
 * @typedef {Object} LanguageSwitcherProps
 * @property {'dropdown' | 'select' | 'buttons'} [variant='dropdown'] - Display style for the language switcher
 * @property {boolean} [showFlags=true] - Whether to show language flags
 * @property {boolean} [showNativeNames=true] - Whether to show names in native script
 */
interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'select' | 'buttons';
  showFlags?: boolean;
  showNativeNames?: boolean;
}

/**
 * LanguageSwitcher Component
 * 
 * A flexible component for switching between different languages in the application.
 * Supports multiple display variants and automatically adapts to RTL languages.
 * 
 * @component
 * @example
 * ```tsx
 * // Basic usage with default dropdown
 * <LanguageSwitcher />
 * 
 * // As a select input
 * <LanguageSwitcher variant="select" />
 * 
 * // As buttons without flags
 * <LanguageSwitcher variant="buttons" showFlags={false} />
 * ```
 * 
 * @param {LanguageSwitcherProps} props - Component properties
 * @returns {JSX.Element} Rendered language switcher component
 */
const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  showFlags = true,
  showNativeNames = true,
}) => {
  const { t, locale, changeLocale, locales } = useTranslation('common');
  const { direction } = useDirection();
  const [isOpen, setIsOpen] = useState(false);

  // Filter languages to only those supported in the app
  const availableLanguages = LANGUAGES.filter(
    (lang) => locales?.includes(lang.code)
  );

  // Get current language
  const currentLanguage = availableLanguages.find(
    (lang) => lang.code === locale
  ) || availableLanguages[0];

  /**
   * Handles language selection and changes the application locale
   * 
   * @param {string} langCode - The ISO code of the selected language
   * @returns {void}
   */
  const handleLanguageChange = (langCode: string) => {
    changeLocale(langCode);
    setIsOpen(false);
  };

  // Select variant rendering
  if (variant === 'select') {
    return (
      <div className="language-switcher-select">
        <select
          aria-label={t('language.select')}
          value={locale}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="p-2 rounded border border-gray-300 bg-white"
          style={{ direction }}
        >
          {availableLanguages.map((language) => (
            <option key={language.code} value={language.code}>
              {showFlags && language.flag ? `${language.flag} ` : ''}
              {showNativeNames ? language.nativeName : t(`language.${language.name.toLowerCase()}`)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Buttons variant rendering
  if (variant === 'buttons') {
    return (
      <div className="language-switcher-buttons flex flex-wrap gap-2">
        {availableLanguages.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`px-3 py-1 rounded border ${
              locale === language.code
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
            }`}
            aria-label={t(`language.${language.name.toLowerCase()}`)}
            aria-current={locale === language.code ? 'true' : 'false'}
          >
            {showFlags && language.flag ? `${language.flag} ` : ''}
            {showNativeNames ? language.nativeName : t(`language.${language.name.toLowerCase()}`)}
          </button>
        ))}
      </div>
    );
  }

  // Default: dropdown variant rendering
  return (
    <div className="language-switcher-dropdown relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded border border-gray-300 bg-white"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('language.select')}
        style={{ direction }}
      >
        {showFlags && currentLanguage.flag ? (
          <span className="text-xl">{currentLanguage.flag}</span>
        ) : null}
        <span>
          {showNativeNames 
            ? currentLanguage.nativeName 
            : t(`language.${currentLanguage.name.toLowerCase()}`)}
        </span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20" 
          fill="currentColor" 
          className="w-5 h-5"
        >
          <path 
            fillRule="evenodd" 
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>

      {isOpen && (
        <ul
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white border border-gray-300 shadow-lg"
          role="listbox"
          style={{ direction }}
        >
          {availableLanguages.map((language) => (
            <li
              key={language.code}
              role="option"
              aria-selected={locale === language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`cursor-pointer px-4 py-2 hover:bg-gray-100 flex items-center ${
                locale === language.code ? 'bg-blue-50 text-blue-700 font-medium' : ''
              }`}
            >
              {showFlags && language.flag ? (
                <span className="text-xl mr-2">{language.flag}</span>
              ) : null}
              <span>
                {showNativeNames 
                  ? language.nativeName 
                  : t(`language.${language.name.toLowerCase()}`)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher; 