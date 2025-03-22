# Internationalization (i18n) Guide for MoodMash

This document provides a comprehensive guide to the internationalization features in MoodMash. It explains how to add new translations, format dates/numbers correctly, and implement locale-specific features.

## Table of Contents

1. [Overview](#overview)
2. [Setting Up New Languages](#setting-up-new-languages)
3. [Using Translations](#using-translations)
4. [Date, Number and Currency Formatting](#date-number-and-currency-formatting)
5. [Testing i18n Features](#testing-i18n-features)
6. [Automated Translation Workflow](#automated-translation-workflow)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

MoodMash uses [next-i18next](https://github.com/i18next/next-i18next) for internationalization, combined with custom utilities for formatting dates, numbers, and currencies. The system supports dynamic language switching without page reloads and lazy-loading of translation resources.

### Key Features

- Multi-language support with dynamic language switching
- Locale-specific formatting for dates, numbers, and currencies
- Automated translation workflows
- Right-to-left (RTL) language support
- Optimized bundle sizes with namespace-based code splitting

### Directory Structure

```
/public
  /locales
    /en
      common.json
      home.json
      profile.json
      ...
    /es
      ...
    /fr
      ...
/src
  /utils
    /i18n
      index.ts        # i18n configuration
      hooks.ts        # Custom i18n hooks
      intlFormatters.ts  # Formatting utilities
  /components
    /ui
      LanguageSwitcher.tsx  # Language selection component
  /pages
    /api
      /translations
        generate.ts   # API for generating translations
```

## Setting Up New Languages

### Adding a New Language

1. Create a new folder in `/public/locales/` with the language code (e.g., `/public/locales/de/` for German)
2. Copy the JSON files from `/public/locales/en/` to the new folder
3. Update the translations in the copied files
4. Add the language to the supported languages list in `/src/utils/i18n/index.ts`

```typescript
// In src/utils/i18n/index.ts
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'de', name: 'Deutsch', dir: 'ltr' }, // New language
];
```

## Using Translations

### Basic Translation

Use the `useTranslation` hook to access translations:

```tsx
import { useTranslation } from 'next-i18next';

function MyComponent() {
  const { t } = useTranslation('common');
  
  return <h1>{t('welcome')}</h1>; // Renders "Welcome" in English, "Bienvenido" in Spanish
}
```

### Translations with Variables

```tsx
// In your JSON file:
// "greeting": "Hello, {{name}}!"

const { t } = useTranslation('common');
return <p>{t('greeting', { name: 'John' })}</p>; // Renders "Hello, John!"
```

### Translations with Pluralization

```tsx
// In your JSON file:
// "items": {
//   "one": "{{count}} item",
//   "other": "{{count}} items"
// }

const { t } = useTranslation('common');
return <p>{t('items', { count: 5 })}</p>; // Renders "5 items"
```

### Namespace Loading

Load multiple namespaces when needed:

```tsx
import { useTranslation } from 'next-i18next';

function ProfilePage() {
  const { t } = useTranslation(['common', 'profile']);
  
  return (
    <div>
      <h1>{t('profile:title')}</h1>
      <button>{t('common:buttons.save')}</button>
    </div>
  );
}

// In pages/profile.js
export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'profile'])),
  },
});
```

## Date, Number and Currency Formatting

Use the formatter utilities for locale-aware formatting:

### Date Formatting

```tsx
import { formatDate, formatRelativeDate, formatTimeAgo } from 'src/utils/intlFormatters';
import { useRouter } from 'next/router';

function MyComponent() {
  const { locale } = useRouter();
  const date = new Date();
  
  return (
    <div>
      <p>Standard date: {formatDate(date, locale, { dateStyle: 'full' })}</p>
      <p>Relative date: {formatRelativeDate(date, locale)}</p>
      <p>Time ago: {formatTimeAgo(date, locale)}</p>
    </div>
  );
}
```

### Number Formatting

```tsx
import { formatNumber, formatCurrency, formatPercent } from 'src/utils/intlFormatters';
import { useRouter } from 'next/router';

function PriceDisplay({ value, currency = 'USD' }) {
  const { locale } = useRouter();
  
  return (
    <div>
      <p>Price: {formatCurrency(value, locale, currency)}</p>
      <p>Discount: {formatPercent(0.15, locale)}</p>
      <p>Items: {formatNumber(1234, locale)}</p>
    </div>
  );
}
```

## Testing i18n Features

### Unit Testing Translations

```tsx
// Example using Jest and React Testing Library
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from 'src/utils/i18n/test-utils'; // Test instance of i18n
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('displays correct translation', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MyComponent />
      </I18nextProvider>
    );
    
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });
});
```

### Mocking Translations for Tests

Create a test utility for i18n:

```tsx
// src/utils/i18n/test-utils.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    resources: {
      en: {
        common: {
          welcome: 'Welcome',
          // Add other test translations here
        },
      },
    },
  });

export default i18n;
```

## Automated Translation Workflow

### Generating Missing Translations

Use the translation API to automatically generate missing translations:

```tsx
// POST to /api/translations/generate
const response = await fetch('/api/translations/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    locale: 'fr',
    namespace: 'common',
    service: 'deepl' // Optional: 'google', 'deepl', or 'openai'
  }),
});

const result = await response.json();
console.log(result.success ? 'Translations generated!' : 'Error generating translations');
```

### Translation Management UI

The admin dashboard includes a translation management interface at `/admin/translations` that allows:

- Viewing missing translations
- Generating translations automatically
- Editing and reviewing translations
- Publishing translation changes

## Best Practices

1. **Use namespaces effectively**: Organize translations into logical namespaces (e.g., `common`, `profile`, `checkout`) to enable code-splitting.

2. **Keep translation keys simple and nested**: Use dot notation for hierarchical organization.
   ```json
   {
     "buttons": {
       "save": "Save",
       "cancel": "Cancel"
     }
   }
   ```

3. **Avoid string concatenation**: Instead of `t('hello') + ' ' + name`, use `t('hello_name', { name })`.

4. **Add context for translators**: Use the `_html` suffix for HTML content and add comments in JSON files.
   ```json
   {
     "welcome_message_html": "Welcome to <strong>MoodMash</strong>",
     "_welcome_message_html.comment": "HTML formatting for the welcome message"
   }
   ```

5. **Handle pluralization properly**: Use i18next's plural features rather than conditional rendering.

6. **Lazy-load translations**: Only load necessary namespaces to keep bundle sizes small.

7. **Format dates and numbers correctly**: Always use the formatter utilities rather than manual formatting.

## Troubleshooting

### Missing Translations

If a translation key appears as the key itself in the UI:

1. Check if the namespace is loaded properly
2. Verify the translation key exists in the JSON file
3. Run the missing translation generator API

### RTL Display Issues

For right-to-left languages like Arabic and Hebrew:

1. Make sure the `dir` attribute is set correctly in HTML
2. Use CSS logical properties (`margin-inline-start` instead of `margin-left`)
3. Check the `dir` property is correct in the `SUPPORTED_LANGUAGES` configuration

### Performance Issues

If you notice slow language switching:

1. Check bundle sizes and ensure translations are lazy-loaded
2. Verify you're not loading unnecessary namespaces
3. Consider implementing a loading state during language changes
4. Use React Suspense for improved loading performance

### Debugging i18n

Use the browser console to debug i18n:

```typescript
// In the browser console
i18next.languages // Shows loaded languages
i18next.getDataByLanguage('en') // Shows all translations for English
i18next.t('common:welcome', { lng: 'fr' }) // Test specific translation
``` 