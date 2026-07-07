'use client';

import React from 'react';

interface BallPassAnimationProps {
  /** SVG path `d` attribute the ball should travel along. */
  pathD: string;
  /** Duration of one full traversal in seconds. Default 4. */
  duration?: number;
  /** Delay before the animation starts (s). Default 0. */
  delay?: number;
  /** Ball radius (SVG units). Default 8. */
  radius?: number;
  /** Unique id suffix so multiple instances don't clash. */
  idSuffix?: string;
}

/**
 * BallPassAnimation — renders a small football SVG that travels along an
 * SVG `<path>` using CSS `offset-path`. The ball rotates to match the path
 * direction so it looks like a real pass. Hidden under reduced-motion.
 *
 * NOTE: requires CSS `offset-path` support (all modern browsers since 2023).
 */
export const BallPassAnimation: React.FC<BallPassAnimationProps> = ({
  pathD,
  duration = 4,
  delay = 0,
  radius = 8,
  idSuffix = 'a',
}) => {
  const pathId = `ball-pass-${idSuffix}`;
  return (
    <g aria-hidden="true">
      <path id={pathId} d={pathD} fill="none" stroke="none" />
      <g
        style={{
          offsetPath: `path("${pathD}")`,
          offsetRotate: 'auto',
          animation: `ball-pass-travel ${duration}s linear ${delay}s infinite`,
        }}
      >
        {/* Glow halo */}
        <circle r={radius + 4} fill="rgba(252, 211, 77, 0.25)" />
        {/* Football body */}
        <circle r={radius} fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
        {/* Pentagon pattern (simplified) */}
        <path
          d={`M0 -${radius * 0.6} L${radius * 0.45} -${radius * 0.15} L${radius * 0.28} ${radius * 0.45} L-${radius * 0.28} ${radius * 0.45} L-${radius * 0.45} -${radius * 0.15} Z`}
          fill="#0f172a"
        />
      </g>
    </g>
  );
};
