# MoodMash Testing Documentation

This directory contains tests for the MoodMash application. The tests are organized by module and functionality to ensure comprehensive coverage of the application's features.

## Test Structure

Tests are organized in the following structure:

- `__tests__/` - Root test directory
  - `api/` - Tests for API endpoints
  - `components/` - Tests for React components
  - `integration/` - End-to-end and integration tests
  - `lib/` - Tests for utility libraries and core functionality
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

- Auth module: 60% lines, 70% functions, 60% statements, 60% branches
- Encryption module: 70% lines, 75% functions, 70% statements, 70% branches
- API routes: 5% lines, 5% statements

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