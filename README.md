This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Testing

### Unit Tests

Run unit tests with Vitest:

```bash
npm run test        # Run all tests once with coverage
npm run test:watch  # Run tests in watch mode
npm run test:api    # Run only API tests
```

### End-to-End Tests

The project includes comprehensive end-to-end tests using Playwright:

```bash
npm run e2e                                              # Run all E2E tests
npm run e2e -- playwright-tests/mood-pages.spec.ts       # Run specific test file
npm run e2e -- --grep "should load the homepage"         # Run tests matching description
npm run e2e:ui                                           # Run tests with UI mode
```

#### Edge Case Tests

We also have specialized tests for edge cases:

```bash
npm run e2e:edge                # Run all edge case tests
npm run e2e:edge:network        # Test network errors
npm run e2e:edge:storage        # Test browser storage limitations
npm run e2e:edge:devices        # Test different device/browser conditions
```

For more information about the E2E tests, see [playwright-tests/README.md](playwright-tests/README.md).

## Continuous Integration

This project uses GitHub Actions for continuous integration. On every push to main and pull request, the CI pipeline:

1. Runs linting and type checks
2. Runs unit tests
3. Runs E2E tests with Playwright
4. Runs edge case tests for resilience testing

The CI configuration is located in `.github/workflows/ci.yml`. You can manually trigger the workflow from the Actions tab in GitHub.

### CI-specific Configuration

For CI environments, we use a specialized Playwright configuration:

- Runs tests on Chromium and Firefox only (for speed)
- Generates HTML and GitHub-compatible reports
- Records videos and traces for all tests
- Takes screenshots for easier debugging

To run tests locally with CI settings:

```bash
npx playwright test --config=playwright.ci.config.ts
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Test Documentation

The project includes automated test documentation to maintain consistency across all test files:

- **Documentation Style**: All test files use a consistent documentation approach with comments explaining test purpose and behavior.
- **Automated Tool**: Run `npm run test:document` to automatically document test files.
- **Learn More**: See `docs/test-documentation.md` for more details on the documentation system.
