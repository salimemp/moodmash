# MoodMash Testing Guide

This document provides comprehensive information about testing in the MoodMash application.

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [CI/CD Integration](#cicd-integration)
6. [Best Practices](#best-practices)

---

## Overview

MoodMash uses a comprehensive testing strategy with multiple testing layers:

| Test Type | Framework | Purpose |
|-----------|-----------|---------|
| Unit Tests | Vitest | Test individual functions and components |
| Integration Tests | Vitest | Test database operations and API logic |
| E2E Tests | Playwright | Test complete user workflows |

### Test Statistics

- **112+ Unit/Integration Tests**
- **50+ E2E Test Cases**
- **9 Test Suites**
- **100% Pass Rate**

---

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── auth.test.ts         # Authentication tests
│   ├── mood.test.ts         # Mood tracking tests
│   ├── api.test.ts          # API utilities tests
│   ├── utils.test.ts        # Utility function tests
│   ├── localization.test.ts # i18n tests
│   ├── gamification.test.ts # Points/achievements tests
│   ├── wellness.test.ts     # Meditation/yoga tests
│   └── social.test.ts       # Friends/groups tests
├── integration/             # Integration tests
│   └── database.test.ts     # Database operations
├── e2e/                     # End-to-end tests
│   ├── 01-homepage.spec.ts  # Homepage tests
│   ├── 02-auth.spec.ts      # Authentication flow
│   ├── 03-mood-tracking.spec.ts # Mood features
│   ├── 04-wellness.spec.ts  # Wellness pages
│   ├── 05-social.spec.ts    # Social features
│   ├── 06-settings.spec.ts  # Settings pages
│   ├── 07-i18n.spec.ts      # Internationalization
│   ├── 08-pwa.spec.ts       # PWA features
│   ├── 09-api.spec.ts       # API endpoints
│   └── 10-accessibility.spec.ts # A11y tests
└── fixtures/                # Test data
```

---

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run with watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- tests/unit/auth.test.ts

# Run tests matching pattern
npm run test -- --grep "authentication"
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:playwright

# Run specific test file
npm run test:homepage
npm run test:log
npm run test:i18n
npm run test:pwa

# Run with UI mode
npx playwright test --ui

# Run with debug mode
npx playwright test --debug

# Run specific browser
npx playwright test --project=chromium
```

### Coverage Report

```bash
npm run test:coverage
```

Coverage reports are generated in `coverage/` directory:
- `coverage/index.html` - HTML report
- `coverage/lcov.info` - LCOV format
- `coverage/coverage-final.json` - JSON format

---

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe('Sub-feature', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge cases', () => {
      expect(() => functionUnderTest(null)).toThrow();
    });
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete user flow', async ({ page }) => {
    // Navigate
    await page.click('button:has-text("Action")');
    
    // Fill form
    await page.fill('input[name="email"]', 'test@example.com');
    
    // Assert
    await expect(page).toHaveURL('/success');
    await expect(page.locator('.message')).toBeVisible();
  });
});
```

### Mocking

```typescript
import { vi } from 'vitest';

// Mock module
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed'),
  compare: vi.fn().mockResolvedValue(true),
}));

// Mock function
const mockFn = vi.fn().mockReturnValue('mocked');

// Spy on method
const spy = vi.spyOn(object, 'method');
```

---

## CI/CD Integration

Tests run automatically on:
- Push to `main`, `develop`, or `rebuild-clean` branches
- Pull requests to these branches
- Daily scheduled runs at 6:00 AM UTC

### GitHub Actions Workflow

The CI pipeline includes:
1. **Build** - TypeScript compilation and bundling
2. **Unit Tests** - Vitest test suite
3. **Integration Tests** - Database and API tests
4. **E2E Tests** - Playwright browser tests
5. **Security Audit** - npm audit and vulnerability scan
6. **Localization** - Language file validation
7. **PWA Validation** - Manifest and service worker checks
8. **Performance** - Bundle size and response time checks
9. **Deploy** - Automatic deployment to Cloudflare

### Test Badges

![Tests](https://i.ytimg.com/vi/fx1Jttnj2vc/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLC-daVhNFw6m7Zw_qYS7tRXKjU1KA)
![Coverage](https://codecov.io/gh/yourusername/moodmash/branch/main/graph/badge.svg)

---

## Best Practices

### Do's ✅

1. **Test behavior, not implementation**
   ```typescript
   // Good - tests behavior
   expect(user.isAuthenticated()).toBe(true);
   
   // Bad - tests implementation
   expect(user._token).toBeDefined();
   ```

2. **Use descriptive test names**
   ```typescript
   // Good
   it('should return 401 when token is expired');
   
   // Bad
   it('test1');
   ```

3. **Arrange-Act-Assert pattern**
   ```typescript
   // Arrange
   const user = createUser();
   
   // Act
   const result = await login(user);
   
   // Assert
   expect(result.success).toBe(true);
   ```

4. **Test edge cases**
   - Empty inputs
   - Null/undefined values
   - Boundary conditions
   - Error scenarios

5. **Keep tests independent**
   - Each test should work in isolation
   - Use `beforeEach` for setup
   - Clean up after tests

### Don'ts ❌

1. **Don't test external libraries**
2. **Don't write flaky tests**
3. **Don't share state between tests**
4. **Don't skip tests without reason**
5. **Don't ignore failing tests**

---

## Test Categories

### Authentication Tests
- User registration validation
- Login flow
- Password hashing
- Session management
- Token generation

### Mood Tracking Tests
- Mood entry creation
- Validation (mood types, intensity)
- Statistics calculation
- Streak tracking
- Calendar functionality

### API Tests
- Response formatting
- Request validation
- Rate limiting
- Error handling
- Pagination

### Localization Tests
- Language support (8 languages)
- Currency formatting (12 currencies)
- Date localization
- RTL support

### Wellness Tests
- Meditation sessions
- Yoga routines
- Music playlists
- Progress tracking

### Social Tests
- Friend requests
- Groups management
- Mood sharing
- Privacy settings

---

## Troubleshooting

### Common Issues

**Tests fail with timeout**
```bash
# Increase timeout in vitest.config.ts
testTimeout: 30000
```

**E2E tests can't connect**
```bash
# Start dev server first
npm run dev:sandbox
# Then run tests
npm run test:playwright
```

**Coverage not meeting threshold**
- Add more tests for untested code
- Adjust thresholds in `vitest.config.ts`

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest Matchers](https://jestjs.io/docs/expect)
