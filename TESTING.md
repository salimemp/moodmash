# MoodMash E2E Testing Guide

## 🎯 Overview

MoodMash uses **Playwright** for comprehensive end-to-end (E2E) testing. Our test suite covers all major features across 7 test files with 100+ test cases.

## 📦 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers (only needed once)
npx playwright install chromium
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:homepage
npm run test:log
npm run test:activities
npm run test:i18n
npm run test:pwa
npm run test:chatbot
npm run test:onboarding

# Interactive UI mode
npm run test:ui

# Debug mode
npm run test:debug

# View test report
npm run test:report
```

## 📋 Test Coverage

### 1. Homepage & Dashboard (20 tests)
- ✅ Page loading and title
- ✅ Navigation menu visibility
- ✅ No critical console errors
- ✅ Language selector
- ✅ Theme toggle
- ✅ Chatbot button
- ✅ Accessibility button
- ✅ Page navigation
- ✅ Service Worker registration

### 2. Log Mood Page (18 tests)
- ✅ Form rendering
- ✅ 10 emotion buttons
- ✅ Emotion selection and UI update
- ✅ Intensity slider (1-5 scale)
- ✅ Notes textarea
- ✅ Weather options (5 types)
- ✅ Sleep hours tracking
- ✅ Activity selection (8 options)
- ✅ Social interaction (4 options)
- ✅ Form validation
- ✅ Successful submission
- ✅ Cancel navigation

### 3. Activities Page (15 tests)
- ✅ Page loading
- ✅ Title and description
- ✅ Emotion filter buttons
- ✅ Category filter buttons
- ✅ Activity cards display
- ✅ Filter by emotion
- ✅ Activity details modal
- ✅ Instructions display
- ✅ Modal open/close
- ✅ Activity timer
- ✅ Difficulty badges
- ✅ Duration information

### 4. Internationalization (17 tests)
- ✅ i18n system loaded
- ✅ Default language (English)
- ✅ All 13 languages available
- ✅ No raw translation keys
- ✅ Dashboard title translated
- ✅ Navigation links translated
- ✅ Change to Spanish
- ✅ Persist language selection
- ✅ Log Mood page translations
- ✅ Activities page translations
- ✅ RTL support for Arabic
- ✅ Emotion translations
- ✅ Activity translations
- ✅ Weather translations

### 5. PWA & Service Worker (14 tests)
- ✅ Service Worker registration
- ✅ Version 3.0.0 verification
- ✅ Static asset caching
- ✅ manifest.json validation
- ✅ PWA meta tags
- ✅ Apple touch icon
- ✅ Offline functionality
- ✅ i18n.js caching
- ✅ Icon files
- ✅ Service Worker updates
- ✅ Cache cleanup
- ✅ Network-first strategy
- ✅ Skip API caching
- ✅ Installable PWA

### 6. Chatbot & Accessibility (17 tests)
**Chatbot ("Mood"):**
- ✅ Toggle button display
- ✅ Open panel
- ✅ Title display
- ✅ Input field
- ✅ FAQ quick buttons
- ✅ Send message
- ✅ Close panel

**Accessibility:**
- ✅ Toggle button display
- ✅ Open panel
- ✅ Title display
- ✅ Read aloud toggle
- ✅ High contrast toggle
- ✅ Font size change
- ✅ Close panel
- ✅ Persist settings

### 7. Onboarding (15 tests)
- ✅ Display on first visit
- ✅ Welcome slide
- ✅ MoodMash branding
- ✅ Skip button
- ✅ Next/Get Started button
- ✅ Navigate to next slide
- ✅ Progress indicators
- ✅ Skip onboarding
- ✅ Complete onboarding
- ✅ Not shown on subsequent visits
- ✅ Translated content
- ✅ Feature highlights
- ✅ 13 languages mention
- ✅ Free/Premium tier info
- ✅ Proper modal z-index

## 🔧 Test Configuration

### Playwright Config (`playwright.config.ts`)

```typescript
{
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: ['html', 'list', 'json'],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  }
}
```

### Environment Variables

- `BASE_URL` - Base URL for tests (default: `http://localhost:3000`)
- `CI` - Enable CI mode with retries

## 🛠️ Test Helpers

Located in `tests/fixtures/test-helpers.ts`:

```typescript
// Wait for page and i18n to be ready
await waitForPageReady(page);

// Clear all caches and storage
await clearBrowserCache(page);

// Change application language
await changeLanguage(page, 'es');

// Skip onboarding if it appears
await skipOnboarding(page);

// Verify element has translated text
await expectTranslated(page, 'h1');

// Wait for API response
await waitForApiResponse(page, '/api/moods');

// Mock API endpoint
await mockApiEndpoint(page, '/api/activities', mockData);

// Listen for console errors
const errors = listenForConsoleErrors(page);
```

## 📊 Running Tests

### Local Development

```bash
# Start dev server
npm run build
pm2 start ecosystem.config.cjs

# In another terminal
npm test
```

### Continuous Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

See `.github/workflows/test.yml` for CI configuration.

## 🐛 Debugging Tests

### Debug Specific Test

```bash
npx playwright test tests/e2e/02-log-mood.spec.ts --debug
```

### View Test in UI Mode

```bash
npm run test:ui
```

### Generate Test Code

```bash
npm run test:codegen
# Opens browser - interact with your app to generate test code
```

### View Failed Test Traces

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

## 📸 Test Artifacts

When tests fail, Playwright captures:

- **Screenshots** - Visual state at failure
- **Videos** - Full test execution recording
- **Traces** - Complete timeline with network, console, DOM snapshots

Artifacts are stored in `test-results/` directory.

## 🎯 Best Practices

### 1. Wait for i18n

```typescript
await waitForPageReady(page);
```

Always wait for i18n to load before checking translations.

### 2. Skip Onboarding

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await waitForPageReady(page);
  await skipOnboarding(page);
});
```

### 3. Handle Optional Elements

```typescript
const isVisible = await element.isVisible().catch(() => false);
```

Use `.catch(() => false)` for elements that might not exist.

### 4. Mock APIs

```typescript
await mockApiEndpoint(page, '/api/moods', { success: true });
```

Mock external APIs to avoid database dependencies.

### 5. No Raw Translation Keys

```typescript
const text = await page.locator('h1').textContent();
expect(text).not.toMatch(/^[a-z_]+$/);
```

Verify translations are applied, not raw keys.

## 📈 Test Metrics

- **Total Tests**: 116 test cases
- **Test Files**: 7 spec files
- **Coverage**: 
  - Pages: 4 (Dashboard, Log, Activities, About)
  - Features: Navigation, Forms, i18n, PWA, Chatbot, Accessibility, Onboarding
  - Languages: 13 languages tested
  - Browsers: Chromium (expandable to Firefox, WebKit)

## 🚀 Adding New Tests

### Example Test File

```typescript
import { test, expect } from '@playwright/test';
import { waitForPageReady, skipOnboarding } from '../fixtures/test-helpers';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-page');
    await waitForPageReady(page);
    await skipOnboarding(page);
  });

  test('should work correctly', async ({ page }) => {
    // Your test code here
    await page.click('button:has-text("Click Me")');
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

### Test Naming Convention

- Use descriptive test names starting with "should"
- Group related tests in `test.describe()` blocks
- Number test files for execution order: `01-`, `02-`, etc.

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Test Best Practices](https://playwright.dev/docs/best-practices)
- [Locators Guide](https://playwright.dev/docs/locators)
- [Assertions Guide](https://playwright.dev/docs/test-assertions)

## 🔍 Troubleshooting

### Tests Fail Due to Cache

Clear cache before running:

```bash
rm -rf .wrangler/state/v3/d1
npm run db:reset
```

### Service Worker Issues

Unregister Service Workers:

```typescript
await page.evaluate(async () => {
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const reg of registrations) {
    await reg.unregister();
  }
});
```

### Timeout Errors

Increase timeout for specific tests:

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ... test code
});
```

### i18n Not Loaded

Always use `waitForPageReady()`:

```typescript
await page.goto('/');
await waitForPageReady(page);
```

## 💡 Tips

1. **Parallel Execution** - Tests run in parallel for speed
2. **Retry on Failure** - CI retries failed tests 2 times
3. **Visual Debugging** - Use `npm run test:ui` for interactive debugging
4. **Trace Viewer** - View complete test execution timeline
5. **Code Generation** - Use `npm run test:codegen` to record tests
6. **Selective Testing** - Run individual test files for faster feedback
7. **Mock Data** - Use mocks to avoid database dependencies
8. **Clean State** - Each test runs in isolated context

## 🎓 Next Steps

1. Review test files in `tests/e2e/`
2. Read helper functions in `tests/fixtures/test-helpers.ts`
3. Run tests locally with `npm test`
4. Open UI mode with `npm run test:ui`
5. Add new tests as features are developed
6. Keep tests updated with UI changes

---

**Happy Testing! 🎭**

For detailed test documentation, see `tests/README.md`.
