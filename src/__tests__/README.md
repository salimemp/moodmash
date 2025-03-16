# MoodMash Testing Documentation

This directory contains tests for the MoodMash application. The tests are organized by module and functionality to ensure comprehensive coverage of the application's features.

## Test Structure

Tests are organized in the following structure:

- `__tests__/` - Root test directory
  - `api/` - Tests for API endpoints
  - `components/` - Tests for React components
  - `integration/` - End-to-end and integration tests
  - `lib/` - Tests for utility libraries and core functionality
    - `auth/` - Authentication related tests
      - `rate-limit-client/` - Tests for client-side rate limiting functions
      - `rate-limit-storage/` - Tests for storage implementation
    - (other lib modules)
  - `pages/` - Tests for page components

## Running Tests

To run all tests:

```bash
npm test
```

To run tests for a specific file or directory:

```bash
npm test -- "src/__tests__/lib/utils.test.ts"
```

To run tests with coverage:

```bash
npm test -- --coverage
```

## Testing Guidelines

### 1. Unit Tests

Unit tests should focus on testing individual functions and components in isolation. Mock all external dependencies to ensure tests are focused and reliable.

Example:

```typescript
// Mock dependencies
vi.mock('@/lib/db/prisma', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Test the function
it('should return user data when found', async () => {
  // Arrange
  const mockUser = { id: '123', name: 'Test User' };
  vi.mocked(db.user.findUnique).mockResolvedValueOnce(mockUser);
  
  // Act
  const result = await getUserById('123');
  
  // Assert
  expect(result).toEqual(mockUser);
});
```

### 2. API Tests

API tests should verify that endpoints handle requests correctly, validate input, and return appropriate responses. Use `node-mocks-http` to simulate HTTP requests and responses.

Example:

```typescript
it('should return 400 if required fields are missing', async () => {
  const { req, res } = createMocks({
    method: 'POST',
    body: { /* missing required fields */ },
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(400);
  expect(JSON.parse(res._getData())).toHaveProperty('message');
});
```

### 3. Integration Tests

Integration tests should verify that multiple components or modules work together correctly. These tests may involve multiple API calls or user interactions.

Example:

```typescript
describe('User Registration Flow', () => {
  it('should register a user and send verification email', async () => {
    // Test the complete registration flow
    // ...
  });
});
```

### 4. Test Documentation

Each test file should include:

1. A description of what is being tested
2. Comments explaining the purpose of each test case
3. Clear arrange-act-assert structure

Example:

```typescript
// Tests for the authentication module
// Validates user login, registration, and session management
describe('Authentication', () => {
  // Verifies that users can log in with valid credentials
  // Ensures the login process works end-to-end
  it('should authenticate users with valid credentials', async () => {
    // Arrange
    // ...
    
    // Act
    // ...
    
    // Assert
    // ...
  });
});
```

## Coverage Thresholds

The project has the following coverage thresholds:

- Auth module: 72% lines, 85% branches, 62% functions
- Encryption module: 95% lines, 76% branches, 100% functions
- API routes: 2% lines, 2% branches, 2% functions

## Mocking Strategies

### Mocking Database

```typescript
vi.mock('@/lib/db/prisma', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));
```

### Mocking Authentication

```typescript
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: 'user-123', email: 'user@example.com' },
    expires: new Date().toISOString(),
  }),
}));
```

### Mocking External Services

```typescript
vi.mock('@/lib/email/sendEmail', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on the state from other tests.
2. **Readability**: Tests should be easy to read and understand.
3. **Maintainability**: Tests should be easy to maintain and update.
4. **Coverage**: Aim for high test coverage, especially for critical paths.
5. **Speed**: Tests should run quickly to enable fast feedback during development.
6. **Reliability**: Tests should be reliable and not produce false positives or negatives.

## Troubleshooting

If tests are failing, check the following:

1. Are all dependencies correctly mocked?
2. Are there any timing issues (async/await)?
3. Are the test expectations correct?
4. Has the implementation changed without updating the tests?

For more information, refer to the [Vitest documentation](https://vitest.dev/guide/).

## Test Organization Patterns

### Modular Test Structure

For complex modules, we've adopted a modular test structure pattern to improve maintainability and clarity. For example, the rate limiting module tests are organized as follows:

1. **Parent Test Files**:
   - Acting as entry points that import and aggregate tests from child files
   - Maintain backward compatibility for existing test runners
   - Example: `rate-limit-client.test.ts` imports tests from dedicated files

2. **Specialized Test Files**:
   - Focus on testing specific functionality
   - Named according to the module/function they test
   - Examples:
     - `rate-limit-client/throttle.test.ts` tests the throttle function
     - `rate-limit-client/withBackoff.test.ts` tests the retry mechanism
     - `rate-limit-storage/methods.test.ts` tests Redis operations

3. **Integration Test Files**:
   - Test interactions between multiple components
   - Validate end-to-end functionality with more realistic scenarios
   - Example: `rate-limit-integration.test.ts` tests client-middleware-storage interactions

This pattern:
- Improves test organization and maintainability
- Keeps individual test files focused and smaller
- Makes it easier to locate and fix test failures
- Provides clear documentation of module functionality through tests
- Allows running specific test subsets for faster development feedback

## Test Categories

### Unit Tests
- **Rate Limiting**: Tests for rate limiting functionality including client, middleware, and storage components
- **Voice Integration**: Tests for voice recording, processing, and analysis features
  - `voice-client.test.ts`: Tests the client-side voice recording functionality
  - `process.test.ts`: Tests the AssemblyAI integration and voice processing endpoint

### Integration Tests
- **Rate Limiting**: End-to-end tests for rate limiting system
- **Voice Processing**: Tests for the complete voice recording and analysis flow

### API Tests
Tests for API endpoints under `pages/api/`:
- Voice processing endpoint (`/api/voice/process`)
- Rate limiting middleware integration

## Testing Guidelines

### Voice Integration Tests
1. **Mocking**:
   - Use `vi.mock()` for external dependencies (MediaRecorder, AssemblyAI API)
   - Mock browser APIs (navigator.mediaDevices)
   - Handle file uploads with formidable mocks

2. **Test Coverage**:
   - Voice recording lifecycle (start, stop, data handling)
   - Error scenarios (permissions, API failures)
   - AssemblyAI API integration
   - Cleanup and resource management

3. **Best Practices**:
   - Reset mocks between tests
   - Test both success and error paths
   - Verify API calls and parameters
   - Check response formats and error handling

### Rate Limiting Tests
1. **Storage Tests**:
   - Mock Redis operations
   - Test increment, get, expire functions
   - Verify key generation and cleanup

2. **Client Tests**:
   - Test retry logic and backoff
   - Verify error handling
   - Check rate limit detection

3. **Integration Tests**:
   - End-to-end flow testing
   - Multiple request scenarios
   - Rate limit enforcement

## Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test src/__tests__/lib/voice/voice-client.test.ts

# Run tests with coverage
npm test -- --coverage
```

## Coverage Thresholds
- Statements: 80%
- Branches: 75%
- Functions: 90%
- Lines: 80%

## Adding New Tests
1. Create test files following the existing structure
2. Use appropriate mocks for external dependencies
3. Follow the testing guidelines for your feature
4. Update this documentation when adding new test categories

## Debugging Tests
1. Use `console.log()` or the debugger
2. Check mock implementations
3. Verify test isolation
4. Review cleanup in `afterEach` 