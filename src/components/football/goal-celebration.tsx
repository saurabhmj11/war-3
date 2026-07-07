'use client';

import React, { useState, useCallback } from 'react';

interface GoalCelebrationState {
  id: number;
  x: number; // viewport X (px)
  y: number; // viewport Y (px)
  label: string;
}

interface GoalCelebrationHandle {
  /** Fire a goal celebration centered at the given viewport coordinates. */
  fire: (x: number, y: number, label?: string) => void;
}

/**
 * useGoalCelebration — returns a `fire(x, y, label)` function and a React
 * node to render. Calling `fire` overlays a goal-net shake + radial ball
 * burst + a small "GOAL!" label at the given viewport coordinates, then
 * auto-clears after 1.2s.
 *
 * Usage:
 *   const { fire, node } = useGoalCelebration();
 *   <button onClick={() => fire(e.clientX, e.clientY)}>Kick</button>
 *   {node}
 */
export function useGoalCelebration(): GoalCelebrationHandle & { node: React.ReactNode } {
  const [celebrations, setCelebrations] = useState<GoalCelebrationState[]>([]);

  const fire = useCallback((x: number, y: number, label = 'GOAL!') => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return; // skip animation entirely
    }
    const id = Date.now() + Math.random();
    setCelebrations((prev) => [...prev, { id, x, y, label }]);
    setTimeout(() => {
      setCelebrations((prev) => prev.filter((c) => c.id !== id));
    }, 1300);
  }, []);

  const node = (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden">
      {celebrations.map((c) => (
        <div
          key={c.id}
          style={{
            position: 'absolute',
            left: c.x,
            top: c.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Goal burst — expanding ring */}
          <div
            className="goal-burst"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 40,
              height: 40,
              marginLeft: -20,
              marginTop: -20,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(252,211,77,0.9) 0%, rgba(251,191,36,0.4) 40%, transparent 70%)',
            }}
          />
          {/* Goal net shake — tiny SVG net that vibrates */}
          <svg
            className="goal-net-shake"
            width="64"
            height="64"
            viewBox="0 0 64 64"
            style={{ position: 'absolute', left: -32, top: -32 }}
          >
            <defs>
              <pattern id={`net-${c.id}`} width="6" height="6" patternUnits="userSpaceOnUse">
                <path d="M0 6 L6 0 M0 0 L6 6" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" fill="none" />
              </pattern>
            </defs>
            <circle cx="32" cy="32" r="22" fill={`url(#net-${c.id})`} stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
          </svg>
          {/* GOAL! label */}
          <div
            className="jersey-heading"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 22,
              fontWeight: 900,
              color: '#fcd34d',
              textShadow: '0 0 16px rgba(252,211,77,0.7), 0 2px 4px rgba(0,0,0,0.6)',
              animation: 'counter-pop 0.4s cubic-bezier(0.2,0.8,0.2,1) 1',
              whiteSpace: 'nowrap',
            }}
          >
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );

  return { fire, node };
}

/** Hook helper: attach a one-shot click handler that fires a celebration at the click point. */
export function useGoalOnClick(label = 'GOAL!') {
  const { fire, node } = useGoalCelebration();
  const onClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      fire(e.clientX, e.clientY, label);
    },
    [fire, label]
  );
  return { onClick, node };
}
