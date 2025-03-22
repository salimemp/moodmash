import { useTranslation } from '@/hooks/useTranslation';
import { Check, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import React, { useState } from 'react';

interface LanguageSwitcherProps {
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  showFlag?: boolean;
  showName?: boolean;
  isMinimal?: boolean;
}

const languageFlags: Record<string, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  zh: '🇨🇳',
  ja: '🇯🇵',
  ko: '🇰🇷',
  ru: '🇷🇺',
  pt: '🇵🇹',
  it: '🇮🇹',
  ar: '🇸🇦',
  he: '🇮🇱',
  fa: '🇮🇷',
  ur: '🇵🇰',
  hi: '🇮🇳',
  bn: '🇧🇩',
  tr: '🇹🇷',
  nl: '🇳🇱',
  sv: '🇸🇪',
  pl: '🇵🇱',
};

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  showFlag = true,
  showName = true,
  isMinimal = false,
}) => {
  const { t, locale, locales, changeLocale } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  const handleLanguageChange = async (newLocale: string) => {
    await changeLocale(newLocale);
    closeDropdown();
  };

  const currentFlag = locale ? languageFlags[locale] : '🌐';
  const currentLanguageName = locale ? t(`language.${locale}`) : t('language.select');

  return (
    <div className={`relative ${className}`} data-testid="language-switcher">
      <button
        type="button"
        onClick={toggleDropdown}
        className={`flex items-center gap-2 rounded-md border p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('language.select')}
      >
        {isMinimal ? (
          <Globe size={18} />
        ) : (
          <>
            {showFlag && <span className="text-lg">{currentFlag}</span>}
            {showName && <span className="hidden sm:inline">{currentLanguageName}</span>}
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={closeDropdown}
            aria-hidden="true"
          />
          <ul
            className={`absolute right-0 z-20 mt-1 max-h-60 w-48 overflow-auto rounded-md border bg-white py-1 shadow-lg dark:bg-gray-900 ${dropdownClassName}`}
            role="listbox"
          >
            {locales?.map((lang) => (
              <li key={lang}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    locale === lang ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => handleLanguageChange(lang)}
                  role="option"
                  aria-selected={locale === lang}
                >
                  <span className="text-lg">{languageFlags[lang] || '🌐'}</span>
                  <span>{t(`language.${lang}`) || lang}</span>
                  {locale === lang && <Check size={16} className="ml-auto text-blue-500" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher; 