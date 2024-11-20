import { vi } from 'vitest'

// Mock import.meta.env
global.import = { 
  meta: { 
    env: {
      VITE_API_URL: 'https://ski-hjsi.onrender.com',
      MODE: 'test'
    } 
  } 
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
}
