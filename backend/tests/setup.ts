// Test setup file for Vitest
import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// Mock environment variables for testing
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.PAYSTACK_SECRET_KEY = 'test_paystack_key';
  process.env.OPENAI_API_KEY = 'test-openai-key';
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  // Helper to create mock request
  createMockRequest: (overrides = {}) => ({
    method: 'GET',
    path: '/api/test',
    headers: {
      'content-type': 'application/json',
      'authorization': ''
    },
    body: {},
    query: {},
    params: {},
    user: null,
    ...overrides
  }),

  // Helper to create mock response
  createMockResponse: () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    res.setHeader = vi.fn().mockReturnValue(res);
    return res;
  },

  // Helper to create mock next function
  createMockNext: () => vi.fn()
};

// Extend expect with custom matchers
expect.extend({
  toHaveStatus(received, expected) {
    const pass = received.status === expected;
    return {
      pass,
      message: pass 
        ? `Expected status not to be ${expected}`
        : `Expected status to be ${expected}, but got ${received.status}`
    };
  }
});
