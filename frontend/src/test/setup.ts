import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mantine reads media queries on mount and jsdom does not implement matchMedia, so the
// components would throw before rendering anything.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
})
