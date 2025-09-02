# Testing Setup for Polling App

This document explains the testing setup for the polling app, including how to run tests and what's being tested.

## Testing Stack

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing
- **@testing-library/user-event**: User interaction simulation

## Test Scripts

The following npm scripts are available for running tests:

```bash
# Run all tests once
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (no watch, with coverage)
npm run test:ci
```

## Test Structure

### Test Files Location
- `src/lib/actions/__tests__/vote.test.ts` - Tests for vote server actions
- `src/lib/api/__tests__/polls.test.ts` - Tests for client-side poll API functions
- `src/lib/api/__tests__/polls-server.test.ts` - Tests for server-side poll API functions
- `src/lib/__tests__/test-utils.test.ts` - Tests for test utilities

### Test Utilities
- `src/lib/test-utils.ts` - Mock data and helper functions for testing

## What's Being Tested

### 1. Vote Actions (`vote.test.ts`)
Tests for the server-side vote actions including:

**voteOnPollServer:**
- ✅ Successful voting for authenticated users
- ✅ Successful voting for anonymous users
- ✅ Multiple votes when allowed
- ❌ Poll not found errors
- ❌ Poll not active errors
- ❌ Poll ended errors
- ❌ Login required errors
- ❌ Multiple votes not allowed errors
- ❌ User already voted errors
- ❌ IP already voted errors
- ❌ Vote insertion failures

**getUserVotesServer:**
- ✅ User votes for authenticated users
- ✅ Empty votes when user hasn't voted
- ✅ IP votes for anonymous users
- ✅ Empty votes when IP hasn't voted
- ❌ Vote fetch failures

### 2. Poll API Functions (`polls.test.ts`)
Tests for client-side poll API functions including:

**createPoll:**
- ✅ Successful poll creation
- ✅ Profile creation if doesn't exist
- ❌ Authentication errors
- ❌ Poll creation failures

**getPolls:**
- ✅ Successful polls fetch
- ❌ Fetch failures

**getPollById:**
- ✅ Successful poll fetch by ID
- ❌ Poll not found errors

**voteOnPoll:**
- ✅ Successful voting
- ❌ Poll not found errors
- ❌ Poll not active errors
- ❌ Login required errors

**getUserVotes:**
- ✅ User votes retrieval
- ✅ Empty votes when user hasn't voted

**getUserPolls:**
- ✅ User polls fetch
- ❌ Fetch failures

**updatePoll:**
- ✅ Successful poll updates
- ❌ Authentication errors
- ❌ Poll not found errors
- ❌ Ownership errors

**updatePollOptions:**
- ✅ Successful options updates
- ❌ Authentication errors

**deletePoll:**
- ✅ Successful poll deletion
- ❌ Authentication errors
- ❌ Poll not found errors
- ❌ Ownership errors

### 3. Server-Side Poll API (`polls-server.test.ts`)
Tests for server-side poll API functions including:

**getUserPollsServer:**
- ✅ User polls fetch
- ❌ Fetch failures

**getPollsServer:**
- ✅ Active polls fetch
- ❌ Fetch failures

**getUserVotesWithIpServer:**
- ✅ User votes for authenticated users
- ✅ IP votes for anonymous users
- ✅ Empty votes scenarios
- ❌ Vote fetch failures

**getPollByIdServer:**
- ✅ Poll fetch by ID
- ❌ Poll not found errors
- ❌ Fetch failures

## Mock Data

The test utilities provide comprehensive mock data:

- `mockUser` - Authenticated user data
- `mockPoll` - Sample poll data
- `mockPollOption` - Sample poll option data
- `mockVote` - Sample vote data
- `mockProfile` - Sample user profile data

## Mock Setup

### Supabase Client Mocking
The tests mock the Supabase client to avoid actual database calls:

```typescript
// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))
```

### Authentication Mocking
Helper functions to set up different authentication scenarios:

```typescript
setupAuthSuccess() // Authenticated user
setupAuthFailure() // Authentication failed
setupAnonymousUser() // Anonymous user
```

### Next.js Mocks
The Jest setup includes mocks for Next.js specific features:

- `next/navigation` - Router functions
- `next/headers` - Request headers

## Running Tests

### Development
For development, use watch mode to automatically re-run tests when files change:

```bash
npm run test:watch
```

### Coverage
To see test coverage:

```bash
npm run test:coverage
```

This will generate a coverage report showing:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

### CI/CD
For continuous integration:

```bash
npm run test:ci
```

This runs tests without watch mode and generates coverage reports.

## Test Coverage Goals

The testing setup aims for:
- **70% line coverage**
- **70% branch coverage**
- **70% function coverage**
- **70% statement coverage**

## Adding New Tests

When adding new functionality:

1. **Create test file** in the appropriate `__tests__` directory
2. **Use existing mock data** from `test-utils.ts`
3. **Follow the existing patterns** for mocking and assertions
4. **Test both success and error scenarios**
5. **Update this README** if adding new test categories

## Example Test Structure

```typescript
import { functionToTest } from '../function-file'
import { 
  mockSupabaseClient, 
  setupAuthSuccess,
  resetMocks 
} from '@/lib/test-utils'

describe('functionToTest', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should work correctly', async () => {
    setupAuthSuccess()
    
    // Mock Supabase responses
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      }),
    }
    mockSupabaseClient.from.mockReturnValue(mockQuery)

    const result = await functionToTest('test-param')

    expect(result.success).toBe(true)
    expect(result.error).toBeNull()
  })

  it('should handle errors correctly', async () => {
    // Test error scenarios
  })
})
```

## Troubleshooting

### Common Issues

1. **Import errors**: Make sure paths are correct and use `@/` alias
2. **Mock not working**: Ensure mocks are set up before the function is called
3. **Async test failures**: Use `async/await` and proper error handling
4. **Coverage not updating**: Clear Jest cache with `npm test -- --clearCache`

### Debugging Tests

To debug a specific test:

```bash
# Run only tests matching a pattern
npm test -- --testNamePattern="should create a poll"

# Run tests in verbose mode
npm test -- --verbose

# Run tests with console output
npm test -- --silent=false
```

## Best Practices

1. **Test behavior, not implementation**: Focus on what the function does, not how it does it
2. **Use descriptive test names**: Test names should clearly describe what's being tested
3. **Test edge cases**: Include tests for error conditions and boundary cases
4. **Keep tests isolated**: Each test should be independent and not rely on other tests
5. **Use meaningful assertions**: Assertions should clearly show what's expected
6. **Mock external dependencies**: Don't test external services, mock them instead
