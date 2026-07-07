'use client';

import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'fifa_kickoff_seen';

/**
 * KickoffIntro — a one-time-per-session full-screen intro overlay shown on
 * the home page. A football flies in from the upper-left, lands on the
 * trophy, and the overlay fades. Skipped if already seen this session or
 * if the user prefers reduced motion.
 *
 * IMPORTANT: The decision to show the overlay is deferred to a `useEffect`
 * so the FIRST client render always matches the server render (both render
 * `null`). This avoids the React hydration mismatch that would otherwise
 * occur because `sessionStorage` / `window.matchMedia` are only available
 * in the browser.
 */
export const KickoffIntro: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') return;
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* sessionStorage can throw in some privacy modes — fail open */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sessionStorage + matchMedia are client-only, must run after hydration to avoid SSR mismatch
    setMounted(true);
    const t = setTimeout(() => setMounted(false), 2100);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="kickoff-overlay fixed inset-0 z-[10000] flex items-center justify-center bg-[#03110a]/80 backdrop-blur-sm"
      aria-hidden="true"
    >
      <div className="relative">
        {/* Flying football */}
        <div className="kickoff-fly-in relative" style={{ transformOrigin: 'center' }}>
          <svg viewBox="0 0 64 64" width="120" height="120">
            <defs>
              <radialGradient id="kickoff-ball-grad" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#94a3b8" />
              </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#kickoff-ball-grad)" stroke="#0f172a" strokeWidth="2" />
            <path
              d="M32 12l9 6.5-3.3 10.5h-11.4L23 18.5 32 12zm-16 13l10-1.2 4 9.5-6 8-10-3.5-.5-9.5 2.5-3.3zm32 0l2.5 3.3-.5 9.5-10 3.5-6-8 4-9.5 10 1.2zM32 40l8 6-2.7 9.5h-10.6L24 46l8-6z"
              fill="#0f172a"
            />
          </svg>
        </div>
        {/* Glow under the ball */}
        <div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{ background: 'radial-gradient(circle, rgba(252,211,77,0.5) 0%, transparent 70%)' }}
          aria-hidden="true"
        />
      </div>
      {/* "KICKOFF" caption */}
      <div
        className="absolute bottom-1/4 left-1/2 -translate-x-1/2 jersey-heading text-3xl sm:text-5xl text-white tracking-[0.4em]"
        style={{
          animation: 'counter-pop 0.5s ease-out 0.7s both',
          textShadow: '0 0 24px rgba(252,211,77,0.5)',
        }}
      >
        KICK<span className="trophy-text">OFF</span>
      </div>
    </div>
  );
};
