'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * FootballCompanion — a tiny football that trails the cursor with a spring
 * lag and rotates based on movement direction. Hidden on touch devices,
 * when the user prefers reduced motion, or after the page has been idle for
 * a few seconds.
 *
 * Purely decorative — pointer-events: none, no impact on UX or a11y.
 */
export const FootballCompanion: React.FC = () => {
  // Always start as `false` so the server render matches the first client
  // render (both render `null`). The actual feature detection happens in
  // a `useEffect` after hydration, which flips `enabled` to `true` if the
  // browser has a fine pointer and no reduced-motion preference.
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isTouch && !reduceMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: matchMedia is client-only, must run after hydration to avoid SSR mismatch
      setEnabled(true);
    }
  }, []);

  const ballRef = useRef<HTMLDivElement | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const lastMove = useRef(0);
  const rotation = useRef(0);
  const lastX = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      lastMove.current = performance.now();
      // Spin the ball based on horizontal movement direction.
      const dx = e.clientX - lastX.current;
      rotation.current += dx * 0.4;
      lastX.current = e.clientX;
    };

    const onLeave = () => {
      if (ballRef.current) ballRef.current.style.opacity = '0';
    };
    const onEnter = () => {
      if (ballRef.current) ballRef.current.style.opacity = '1';
    };

    window.addEventListener('mousemove', onMove);
    document.body.addEventListener('mouseleave', onLeave);
    document.body.addEventListener('mouseenter', onEnter);

    // Spring-physics loop — current lags target with exponential smoothing.
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.18;
      current.current.y += (target.current.y - current.current.y) * 0.18;
      if (ballRef.current) {
        ballRef.current.style.transform = `translate3d(${current.current.x - 7}px, ${current.current.y - 7}px, 0) rotate(${rotation.current}deg)`;
        // Auto-hide after 4s of no movement.
        const idle = performance.now() - lastMove.current;
        ballRef.current.style.opacity = idle > 4000 ? '0' : '1';
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.body.removeEventListener('mouseleave', onLeave);
      document.body.removeEventListener('mouseenter', onEnter);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={ballRef}
      className="ball-trail"
      style={{ opacity: 0 }}
      aria-hidden="true"
    >
      {/* Tiny SVG football with classic pentagon pattern */}
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
        <path
          d="M12 5l3 2.2-1.1 3.5h-3.8L9 7.2 12 5zm-5.5 4.5l3.4-.4 1.4 3.3-2.1 2.7-3.4-1.2-.3-3.4 1-1zm11 0l1 1-.3 3.4-3.4 1.2-2.1-2.7 1.4-3.3 3.4.4zM12 14.5l2.7 2-.9 3.2h-3.6l-.9-3.2 2.7-2z"
          fill="#0f172a"
        />
      </svg>
    </div>
  );
};
