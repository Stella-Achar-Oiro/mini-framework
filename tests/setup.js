import { vi } from 'vitest';

// Mock browser APIs
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    hash: '',
    pathname: '/',
    search: '',
    origin: 'http://localhost:3000',
    reload: vi.fn(),
    assign: vi.fn(),
    replace: vi.fn()
  },
  writable: true
});

Object.defineProperty(window, 'history', {
  value: {
    pushState: vi.fn(),
    replaceState: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn(),
    length: 1,
    state: null
  },
  writable: true
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  },
  writable: true
});

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn()
};

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
  window.location.hash = '';
  window.location.pathname = '/';
});