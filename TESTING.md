# Testing Guide

This document describes the testing setup and how to run tests for the Spec-Kit-Viewer extension.

## Test Structure

The test suite is organized as follows:

```
src/test/
├── translationCache.test.ts    # TranslationCache unit tests
├── parserService.test.ts       # ParserService unit tests
├── fridayClient.test.ts        # FridayClient unit tests
├── translationService.test.ts  # TranslationService factory tests
└── suite/
    └── index.ts                # Test suite runner
```

## Testing Framework

- **Framework**: Mocha + Sinon
- **Mocking**: Sinon for stubs and mocks
- **VSCode APIs**: Mocked for unit testing
- **Network calls**: OpenAI SDK is mocked

## Available Test Commands

### Run All Unit Tests
```bash
npm run test:unit
```

### Watch Mode (Re-run on file changes)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### VSCode Extension Tests (Integration)
```bash
npm test
```

## Test Coverage

The unit tests cover the following core services:

### TranslationCache
- ✅ Cache storage and retrieval
- ✅ TTL (Time To Live) expiration
- ✅ Size limits and LRU eviction
- ✅ Cache statistics and management
- ✅ Error handling

### ParserService
- ✅ File type classification (spec.md, plan.md, tasks.md, etc.)
- ✅ Content hash generation
- ✅ Markdown link extraction
- ✅ Wiki-style link parsing ([[link]])
- ✅ Path resolution
- ✅ Line number calculation
- ✅ Error handling for malformed content

### FridayClient
- ✅ Configuration loading
- ✅ Streaming translation API calls
- ✅ Error handling (401, 429, SSL, network errors)
- ✅ Connection testing
- ✅ OpenAI SDK integration (mocked)

### TranslationService Factory
- ✅ Service selection logic
- ✅ Fallback to mock service
- ✅ Error handling during service creation
- ✅ Mock service functionality

## Mock Strategies

### VSCode API Mocking
```typescript
// Mock VSCode Memento for TranslationCache tests
const mockMemento = {
  get: <T>(key: string, defaultValue?: T): T => storage.get(key) ?? defaultValue,
  update: async (key: string, value: any): Promise<void> => storage.set(key, value)
};
```

### OpenAI SDK Mocking
```typescript
// Mock OpenAI streaming response
const mockStream = {
  async *[Symbol.asyncIterator]() {
    yield { choices: [{ delta: { content: 'chunk1' }, finish_reason: null }] };
    yield { choices: [{ delta: { content: 'chunk2' }, finish_reason: 'stop' }] };
  }
};
```

### Time-based Testing
```typescript
// Use Sinon fake timers for TTL testing
const clock = sinon.useFakeTimers();
clock.tick(7 * 24 * 60 * 60 * 1000); // Advance 7 days
```

## What's NOT Tested

The following components are excluded from unit tests as they involve complex UI interactions or VSCode integration:

- **React Components**: webviews/pages/TranslationView.tsx
- **VSCode Panels**: src/panels/TranslationPanel.ts
- **CodeLens Providers**: src/providers/SpecTranslationProvider.ts
- **Extension Activation**: src/extension.ts

These components should be tested through:
- Manual testing with the extension
- VSCode extension integration tests (npm test)
- End-to-end testing scenarios

## Running Tests

### Prerequisites
```bash
npm install
```

### Quick Test Run
```bash
npm run test:unit
```

### Development Workflow
```bash
# Start watch mode for continuous testing
npm run test:watch

# In another terminal, make code changes
# Tests will automatically re-run
```

### Coverage Analysis
```bash
npm run test:coverage
```

This will generate a coverage report showing which lines of code are tested.

## Test Debugging

### VSCode Debugging
1. Set breakpoints in test files
2. Run "Debug Tests" configuration in VSCode
3. Step through test execution

### Console Output
Tests include extensive console logging (disabled in CI):
```typescript
console.log('🔄 Testing cache operation...');
```

### Common Issues

**Mock not working**: Ensure sinon.restore() is called in afterEach()
**Timing issues**: Use sinon.useFakeTimers() for time-dependent tests
**VSCode API errors**: Verify mock objects match the real API interface

## Continuous Integration

The test suite is designed to run in CI environments:
- No external dependencies (APIs, network)
- Deterministic timing with fake timers
- Comprehensive error scenario coverage
- Fast execution (< 30 seconds)

## Future Improvements

- Add integration tests for VSCode panels
- Implement visual regression testing for webviews
- Add performance benchmarks for parsing large documents
- Expand error scenario coverage