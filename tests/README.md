# MoodMash E2E Testing with Playwright

Comprehensive end-to-end testing suite for the MoodMash application using Playwright.

## 📋 Test Coverage

### Test Suites

1. **Homepage & Dashboard** (`01-homepage.spec.ts`)
   - Page loading and title verification
   - Navigation menu visibility
   - Console error detection
   - Service Worker registration
   - Theme toggle and language selector
   - Chatbot and accessibility buttons
   - Page navigation

2. **Log Mood Page** (`02-log-mood.spec.ts`)
   - Form rendering and visibility
   - 10 emotion buttons display and selection
   - Intensity slider functionality
   - Notes textarea
   - Weather, sleep, activity, and social options
   - Form validation
   - Successful mood submission
   - Cancel navigation

3. **Activities Page** (`03-activities.spec.ts`)
   - Page loading and title
   - Emotion and category filters
   - Activity cards display
   - Activity details modal
   - Activity timer functionality
   - Difficulty badges and duration
   - Modal open/close

4. **Internationalization** (`04-internationalization.spec.ts`)
   - i18n system initialization
   - All 13 languages availability
   - Translation key validation (no raw keys)
   - Language switching and persistence
   - RTL support for Arabic
   - Emotion, activity, and weather translations

5. **PWA & Service Worker** (`05-pwa-service-worker.spec.ts`)
   - Service Worker registration
   - Version 3.0.0 verification
   - Static asset caching
   - Manifest.json validation
   - PWA meta tags
   - Offline functionality
   - Cache cleanup mechanism

6. **Chatbot & Accessibility** (`06-chatbot-accessibility.spec.ts`)
   - Chatbot toggle button
   - Chatbot panel opening/closing
   - Message sending
   - FAQ quick buttons
   - Accessibility toggle
   - Read aloud, high contrast, font size
   - Settings persistence

7. **Onboarding** (`07-onboarding.spec.ts`)
   - First-visit onboarding display
   - Welcome slide
   - Navigation between slides
   - Skip and complete flows
   - Persistence (not showing again)
   - Feature highlights
   - Translated content

## 🚀 Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
npm run test:homepage       # Homepage tests
npm run test:log           # Log Mood page tests
npm run test:activities    # Activities page tests
npm run test:i18n          # Internationalization tests
npm run test:pwa           # PWA & Service Worker tests
npm run test:chatbot       # Chatbot & Accessibility tests
npm run test:onboarding    # Onboarding flow tests
```

### Interactive Mode

```bash
npm run test:ui            # Open Playwright UI mode
npm run test:headed        # Run tests in headed mode (visible browser)
npm run test:debug         # Debug mode with step-by-step execution
```

### Generate Test Code

```bash
npm run test:codegen       # Record browser interactions to generate test code
```

### View Test Reports

```bash
npm run test:report        # Open HTML test report
```

## 📊 Test Configuration

Configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000` (configurable via `BASE_URL` env var)
- **Timeout**: 30 seconds per test
- **Retries**: 2 retries in CI, 0 locally
- **Reporters**: HTML, List, and JSON
- **Screenshots**: On failure
- **Videos**: On failure
- **Browsers**: Chromium (configurable for Firefox, WebKit)

## 🔧 Test Helpers

Located in `tests/fixtures/test-helpers.ts`:

- `waitForPageReady()` - Wait for page load and i18n initialization
- `clearBrowserCache()` - Clear localStorage, cache, and service workers
- `changeLanguage()` - Switch application language
- `skipOnboarding()` - Automatically skip onboarding if present
- `expectTranslated()` - Verify element contains translated text (not raw keys)
- `waitForApiResponse()` - Wait for specific API responses
- `mockApiEndpoint()` - Mock API endpoints for testing
- `listenForConsoleErrors()` - Capture console errors during tests

## 📁 Directory Structure

```
tests/
├── e2e/
│   ├── 01-homepage.spec.ts
│   ├── 02-log-mood.spec.ts
│   ├── 03-activities.spec.ts
│   ├── 04-internationalization.spec.ts
│   ├── 05-pwa-service-worker.spec.ts
│   ├── 06-chatbot-accessibility.spec.ts
│   └── 07-onboarding.spec.ts
├── fixtures/
│   └── test-helpers.ts
└── README.md
```

## 🎯 Test Best Practices

1. **Wait for i18n**: Always use `waitForPageReady()` after navigation
2. **Skip Onboarding**: Use `skipOnboarding()` in beforeEach hooks
3. **Handle Visibility**: Use `.catch(() => false)` for optional elements
4. **Mock APIs**: Mock external API calls to avoid database dependencies
5. **Clear Cache**: Use `clearBrowserCache()` when testing first-visit flows
6. **Check Translations**: Verify no raw translation keys are visible
7. **Timeout Wisely**: Add appropriate waits for dynamic content

## 🐛 Debugging Tests

### Debug Specific Test

```bash
npx playwright test tests/e2e/02-log-mood.spec.ts --debug
```

### View Trace

```bash
npx playwright show-trace trace.zip
```

### Screenshot on Failure

Failed tests automatically capture:
- Screenshot (in `test-results/`)
- Video (in `test-results/`)
- Trace (in `test-results/`)

## 📈 CI/CD Integration

Tests are configured for CI environments with:
- Automatic retries (2x)
- Single worker for stability
- JSON output for integration
- Fail-fast on `test.only` usage

### GitHub Actions Example

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run tests
  run: npm test
  env:
    CI: true
    BASE_URL: http://localhost:3000

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## 🔍 Coverage Summary

- **Total Tests**: 100+ test cases
- **Pages Covered**: 4 (Dashboard, Log Mood, Activities, About)
- **Features Tested**: 
  - Navigation
  - Forms and validation
  - i18n (13 languages)
  - PWA & Service Worker
  - Chatbot & Accessibility
  - Onboarding flow
- **Browser Support**: Chromium (extensible to Firefox, WebKit)
- **Mobile Testing**: Ready for mobile viewports (commented in config)

## 📝 Writing New Tests

### Example Test

```typescript
import { test, expect } from '@playwright/test';
import { waitForPageReady, skipOnboarding } from '../fixtures/test-helpers';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-page');
    await waitForPageReady(page);
    await skipOnboarding(page);
  });

  test('should do something', async ({ page }) => {
    const button = page.locator('button:has-text("Click Me")');
    await button.click();
    
    const result = page.locator('.result');
    await expect(result).toBeVisible();
  });
});
```

## 🎓 Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Test Fixtures Guide](https://playwright.dev/docs/test-fixtures)

## 💡 Tips

1. Use `page.locator()` over `page.$()` for better auto-waiting
2. Prefer text selectors (`text="Click"`) for resilience
3. Use `data-testid` attributes for critical elements
4. Group related tests in `test.describe()` blocks
5. Use `test.beforeEach()` for common setup
6. Mock external APIs to avoid flaky tests
7. Add meaningful test descriptions
8. Keep tests independent and isolated

## 🚧 Known Limitations

- Some tests may fail if OAuth credentials are not configured (expected)
- Service Worker tests require proper cleanup between runs
- Onboarding tests need cache clearing for first-visit simulation
- API mocking is used to avoid database dependencies

---

**Happy Testing! 🎭**
