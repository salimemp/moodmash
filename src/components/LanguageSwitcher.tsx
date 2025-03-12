'use client';

import React, { useState } from 'react';

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'select' | 'buttons';
}

/**
 * Component for switching between different languages
 */
const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'dropdown' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<string>('en'); // Default to English
  
  const languages: Language[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];
  
  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];
  
  const changeLanguage = (languageCode: string) => {
    // In a real app, this would change the locale
    // For now, we'll just update the state
    setCurrentLocale(languageCode);
    setIsOpen(false);
    
    // In a real app with App Router, you'd navigate with locale params
    // router.push(`/${languageCode}${pathname}`);
  };
  
  // Render different UI based on variant
  if (variant === 'select') {
    return (
      <select 
        value={currentLocale}
        onChange={(e) => changeLanguage(e.target.value)}
        className="p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-background"
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.flag} {language.name}
          </option>
        ))}
      </select>
    );
  }
  
  if (variant === 'buttons') {
    return (
      <div className="flex space-x-2">
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`px-3 py-1 rounded-md ${
              language.code === currentLocale 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            <span>{language.flag}</span>
          </button>
        ))}
      </div>
    );
  }
  
  // Default dropdown variant
  return (
    <div className="relative">
      <button
        className="flex items-center space-x-1 p-2 rounded-md hover:bg-muted"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="sr-only">{currentLanguage.name}</span>
      </button>
      
      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-48 rounded-md bg-background shadow-lg border z-10"
          role="listbox"
        >
          {languages.map((language) => (
            <button
              key={language.code}
              className={`w-full text-left px-4 py-2 hover:bg-muted flex items-center space-x-2 ${
                language.code === currentLanguage.code ? 'bg-muted' : ''
              }`}
              onClick={() => changeLanguage(language.code)}
              role="option"
              aria-selected={language.code === currentLanguage.code}
            >
              <span className="text-lg">{language.flag}</span>
              <span>{language.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
