# MoodMash Internationalization System

This directory contains the core internationalization (i18n) system for MoodMash, built on top of `next-i18next`.

## Directory Structure

```
src/utils/i18n/
├── hooks.ts            # Custom React hooks for i18n
├── index.ts            # Core configuration and utilities
├── test-utils.ts       # Testing utilities for i18n
└── README.md           # This file
```

## Key Features

- **Multi-language support**: Easily add new languages
- **Dynamic language switching**: Change languages without page reloads
- **RTL support**: Full support for right-to-left languages
- **Locale-aware formatting**: Format dates, numbers, and currencies correctly
- **Automated translation workflow**: Generate missing translations
- **Translation management UI**: Admin interface for managing translations
- **Optimized loading**: Lazy-load translations with code splitting

## Quick Start

### Using Translations in Components

```tsx
import { useTranslation } from '@/utils/i18n/hooks';

function MyComponent() {
  const { t } = useTranslation('common');
  
  return <h1>{t('welcome')}</h1>;
}
```

### Language Switching

```tsx
import { useTranslation } from '@/utils/i18n/hooks';

function LanguageSwitcher() {
  const { locale, changeLanguage } = useTranslation();
  
  return (
    <button onClick={() => changeLanguage('fr')}>
      Switch to French
    </button>
  );
}
```

### Formatting with Locale

```tsx
import { useTranslation } from '@/utils/i18n/hooks';

function DateDisplay({ date }) {
  const { formatDate, formatRelativeDate } = useTranslation();
  
  return (
    <div>
      <p>Formatted: {formatDate(date, { dateStyle: 'full' })}</p>
      <p>Relative: {formatRelativeDate(date)}</p>
    </div>
  );
}
```

## Advanced Usage

### Setting Up Page-Specific Translations

In your page component:

```tsx
import { loadTranslations } from '@/utils/i18n';

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await loadTranslations(locale, ['page-specific-namespace'])),
    },
  };
};
```

### Initializing User's Preferred Language

```tsx
import { useInitLanguage } from '@/utils/i18n/hooks';

function MyApp({ Component, pageProps }) {
  const initLanguage = useInitLanguage();
  
  useEffect(() => {
    initLanguage();
  }, []);
  
  return <Component {...pageProps} />;
}
```

### RTL Detection

```tsx
import { useRTL } from '@/utils/i18n/hooks';

function Layout({ children }) {
  const isRTL = useRTL();
  
  return (
    <div className={isRTL ? 'rtl-layout' : 'ltr-layout'}>
      {children}
    </div>
  );
}
```

## Adding a New Language

1. Add the language to `SUPPORTED_LANGUAGES` in `src/utils/i18n/index.ts`
2. Create a new directory in `public/locales/` with the language code (e.g., `/public/locales/de/`)
3. Copy the JSON files from `/public/locales/en/` to the new folder
4. Update the translations

## Testing i18n Components

Use the provided test utilities:

```tsx
import { render, screen } from '@testing-library/react';
import { mockUseTranslation } from '@/utils/i18n/test-utils';

// Mock the hook
jest.mock('@/utils/i18n/hooks', () => ({
  useTranslation: () => mockUseTranslation('en'),
}));

// Test your component
test('displays translated text', () => {
  render(<MyComponent />);
  expect(screen.getByText('Welcome')).toBeInTheDocument();
});
```

## Troubleshooting

- **Missing translations**: Keys appear as-is if no translation is found
- **Default language**: English (`en`) is the fallback language
- **Translation files**: Located in `/public/locales/{language-code}/{namespace}.json`
- **RTL issues**: Make sure the `dir` attribute is set correctly in HTML

## Resources

- [next-i18next Documentation](https://github.com/i18next/next-i18next)
- [i18next Documentation](https://www.i18next.com/)
- [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- [date-fns Documentation](https://date-fns.org/) 