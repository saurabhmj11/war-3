'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  /** Target value to count up to. */
  value: number;
  /** Duration of the count-up in milliseconds. Default 1400ms. */
  duration?: number;
  /** Number of decimal places to display. Default 0. */
  decimals?: number;
  /** Optional prefix (e.g. "$" or "< "). */
  prefix?: string;
  /** Optional suffix (e.g. " min" or " ms"). */
  suffix?: string;
  /** Locale for number formatting. Default en-US. */
  locale?: string;
  /** Render the number with the scoreboard-numeral style (monospace, glowing). Default true. */
  scoreboard?: boolean;
  /** Additional className. */
  className?: string;
}

/**
 * AnimatedCounter — counts up from 0 to `value` when the element first
 * scrolls into view, with a final "pop" so it feels like a stadium digital
 * display snapping into place. Respects reduced-motion.
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1400,
  decimals = 0,
  prefix = '',
  suffix = '',
  locale = 'en-US',
  scoreboard = true,
  className = '',
}) => {
  // Always start with `display = 0` and `popped = false` so the server
  // render matches the first client render. The actual reduce-motion check
  // and count-up happen in the `useEffect` below, which runs only after
  // hydration — avoiding any hydration mismatch.
  const [display, setDisplay] = useState<number>(0);
  const [popped, setPopped] = useState<boolean>(false);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // If the user prefers reduced motion, snap to the final value immediately.
    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: matchMedia is client-only, must run after hydration to avoid SSR mismatch
      setDisplay(value);
      setPopped(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / duration);
              // easeOutExpo for that snappy scoreboard snap
              const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
              setDisplay(value * eased);
              if (t < 1) {
                requestAnimationFrame(tick);
              } else {
                setDisplay(value);
                setPopped(true);
              }
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  const formatted = display.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span
      ref={ref}
      className={`${scoreboard ? 'scoreboard-numeral' : ''} ${popped ? 'counter-pop' : ''} ${className}`}
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
