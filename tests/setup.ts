import '@testing-library/jest-dom/vitest';
import { vi, beforeEach } from 'vitest';

// jsdom doesn't implement matchMedia — stub it so reduced-motion checks work.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
}

// jsdom doesn't implement IntersectionObserver — stub it for AnimatedCounter.
if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
  class IntersectionObserverStub {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
    root = null;
    rootMargin = '';
    thresholds = [];
  }
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IntersectionObserverStub;
  (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IntersectionObserverStub;
}

// sessionStorage stub (jsdom has it, but make sure it's clean between tests).
if (typeof window !== 'undefined') {
  beforeEach(() => {
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch {
      /* noop */
    }
  });
}
