// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AnimatedCounter } from '@/components/football/animated-counter';

describe('AnimatedCounter', () => {
  it('renders the final value immediately under reduced-motion', () => {
    // Force reduced-motion path
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    render(<AnimatedCounter value={82500} />);
    expect(screen.getByText('82,500')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('renders 0 initially then counts up when not reduced-motion', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    render(<AnimatedCounter value={42} duration={100} />);
    // Initial state should be 0 (or close to it)
    expect(screen.getByText('0')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('honors prefix and suffix', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    render(<AnimatedCounter value={1.5} prefix="< " suffix="s" decimals={1} />);
    expect(screen.getByText('< 1.5s')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('applies the scoreboard-numeral class by default', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const { container } = render(<AnimatedCounter value={8} />);
    const span = container.querySelector('span');
    expect(span?.classList.contains('scoreboard-numeral')).toBe(true);
    vi.unstubAllGlobals();
  });
});
