# MoodMash Playwright Tests

This directory contains end-to-end tests for the MoodMash application using Playwright.

## Test Organization

The tests are organized by feature area:

- `mood-pages.spec.ts` - Tests for the mood creation functionality
- `homepage.spec.ts` - Tests for the homepage and navigation
- `encryption-setup.spec.ts` - Tests for the encryption setup flow
- `encrypted-data.spec.ts` - Tests for working with encrypted data

### Edge Case Tests

We also have specialized tests for edge cases:

- `encryption-edge-cases.spec.ts` - Tests for network errors during encryption setup
- `browser-storage-limitations.spec.ts` - Tests for browser storage limitations
- `cross-browser-device-tests.spec.ts` - Tests for different device and browser conditions

## Helper Modules

- `helpers/auth-helpers.ts` - Functions for authentication and common setup tasks
- `helpers/test-setup.ts` - Utilities for test retry and error handling
- `helpers/network-mock.ts` - Utilities for simulating network conditions
- `fixtures/encryption-fixtures.ts` - Custom test fixtures for encryption-related tests

## Running Tests

### Running All Tests

```bash
npx playwright test
```

### Running Tests for a Specific Feature

```bash
npx playwright test playwright-tests/mood-pages.spec.ts
```

### Running Edge Case Tests

```bash
# Run all edge case tests
npm run e2e:edge

# Run specific edge case tests
npm run e2e:edge:network   # Network error tests
npm run e2e:edge:storage   # Browser storage limitation tests
npm run e2e:edge:devices   # Cross-browser/device tests
```

### Running a Specific Test by Title

```bash
npx playwright test -g "should complete the full encryption setup flow"
```

### Running Tests with UI Mode

```bash
npx playwright test --ui
```

### Running Tests in Headed Mode (showing browser)

```bash
npx playwright test --headed
```

## Continuous Integration

These tests are automatically run in our CI pipeline on GitHub Actions. The configuration is in:

- `.github/workflows/playwright.yml` - Dedicated Playwright test workflow
- `.github/workflows/ci.yml` - Comprehensive CI workflow (including unit tests)

### CI Configuration

In CI environments, we use a specialized configuration in `playwright.ci.config.ts` that:

- Runs tests on fewer browsers (only Chromium and Firefox)
- Captures more test artifacts (traces, videos, screenshots)
- Generates reports in multiple formats (HTML, GitHub, JSON)
- Reduces parallelism to ensure stability

### Running CI Configuration Locally

You can run the CI configuration locally to debug CI failures:

```bash
npx playwright test --config=playwright.ci.config.ts
```

For specific test files:

```bash
npm run e2e:ci:mood -- --config=playwright.ci.config.ts
npm run e2e:ci:home -- --config=playwright.ci.config.ts
npm run e2e:edge:ci -- --config=playwright.ci.config.ts
```

## Test Screenshots and Videos

Test failures automatically capture screenshots in the `test-results` directory. You can also view these in the HTML report.

## Generating Test Reports

```bash
npx playwright show-report
```

## Important Notes

1. The encryption tests require that the application has a login page at `/signin` with email and password fields.

2. The mood page tests verify the following pages:
   - Homepage (`/`)
   - Test Mood Page (`/test-mood`)
   - Enhanced Mood Creator (`/enhanced-mood`)

3. Fixtures in `encryption-fixtures.ts` provide pre-configured test environments:
   - `encryptionReadyPage` - Sets up a page with a logged-in user ready for encryption
   - `encryptedUserPage` - Sets up a page with a user who already has encryption enabled

## Test Design Principles

1. **Isolation**: Tests should be independent and not rely on state from other tests.

2. **Robustness**: Tests use retry mechanisms and flexible selectors to handle async UI changes.

3. **Readability**: Tests are structured with clear arrange-act-assert patterns.

4. **Screenshots**: Key test steps capture screenshots for debugging.

5. **Flexible Verification**: Tests use patterns that don't break with minor UI changes.

## Edge Case Testing Philosophy

Our edge case tests focus on three key areas:

1. **Network Resilience**: Testing how the application behaves when network errors occur during critical operations like encryption setup. We use mocking and request interception to simulate failed or slow connections.

2. **Storage Limitations**: Testing how the application handles browser storage constraints like quota exceeded errors, private browsing limitations, and permission denials.

3. **Device Adaptability**: Testing the application across different devices, screen sizes, input methods (touch vs keyboard), and accessibility features.

These tests are designed to be more resilient to implementation changes by focusing on behavior rather than specific implementation details. They use:

- Mock network responses to simulate failures
- Browser context customization to test different environments
- JavaScript injection to simulate storage limitations
- Device emulation to test responsive behavior

## Troubleshooting CI Failures

If tests are failing in CI but passing locally:

1. Check the `playwright-report` artifact in the GitHub Actions run
2. Review screenshots and videos in the test-results directory
3. Look for environment-specific issues (like window size differences)
4. Consider running with the CI config locally to reproduce the issue
5. Check for race conditions that might be more apparent in CI environments

For more reliable CI runs:

- Use explicit waits rather than implicit ones
- Avoid fixed timeouts when possible
- Use the findElement helper with multiple selector strategies
- Take screenshots at key points for debugging 