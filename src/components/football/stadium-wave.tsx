'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useStadiumWave — watches the `currentAct` value. When it advances (so the
 * just-passed act becomes "isPassed"), triggers the stadium-wave animation
 * on that tile. Returns a function that yields the CSS class to apply for a
 * given act index.
 *
 * Usage:
 *   const waveClass = useStadiumWave(currentAct);
 *   <button className={waveClass(act.act)}>...</button>
 */
export function useStadiumWave(currentAct: number): (actNumber: number) => string {
  const [waving, setWaving] = useState<number | null>(null);
  const lastAct = useRef(currentAct);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (currentAct === lastAct.current) return;
    const prev = lastAct.current;
    lastAct.current = currentAct;
    // Wave the tile that was just passed (the previous act).
    if (currentAct > prev && prev >= 1) {
      setWaving(prev);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setWaving(null), 700);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [currentAct]);

  return useCallback(
    (actNumber: number) => (waving === actNumber ? 'stadium-wave-tile' : ''),
    [waving]
  );
}
