import 'server-only';
import { NextRequest, NextResponse } from 'next/server';

/**
 * In-memory rate limiter using a sliding-window counter per IP+route.
 * In production with multiple replicas this should be backed by Redis, but
 * for a single-process demo it's sufficient to prevent naive abuse.
 *
 * Limits:
 *   - Mutating routes (POST/PATCH/DELETE): 30 requests / minute / IP
 *   - Read routes (GET): 120 requests / minute / IP
 *   - /api/events (SSE): exempt (long-lived connection)
 *   - /api/auth/switch: 10 requests / minute / IP (token issuance)
 */

interface RateBucket {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60_000;
const MUTATING_LIMIT = 30;
const READ_LIMIT = 120;
const AUTH_LIMIT = 10;

const buckets = new Map<string, RateBucket>();

// Periodically purge expired buckets to keep memory bounded.
let lastPurge = Date.now();
function purgeIfNeeded() {
  const now = Date.now();
  if (now - lastPurge < 60_000) return;
  lastPurge = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > WINDOW_MS * 2) {
      buckets.delete(key);
    }
  }
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  const xri = req.headers.get('x-real-ip');
  if (xri) return xri;
  return 'unknown';
}

function getLimit(pathname: string, method: string): number {
  if (pathname.startsWith('/api/auth/')) return AUTH_LIMIT;
  if (method === 'GET') return READ_LIMIT;
  return MUTATING_LIMIT;
}

export function rateLimit(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  // Skip SSE — long-lived connection.
  if (pathname === '/api/events') return null;
  // Only rate-limit API routes.
  if (!pathname.startsWith('/api/')) return null;

  purgeIfNeeded();

  const ip = getClientIp(req);
  const limit = getLimit(pathname, req.method);
  const key = `${ip}:${pathname}:${req.method}`;
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    bucket = { count: 0, windowStart: now };
    buckets.set(key, bucket);
  }
  bucket.count += 1;

  if (bucket.count > limit) {
    const retryAfter = Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000);
    return NextResponse.json(
      { error: 'Too Many Requests', message: `Rate limit exceeded. Try again in ${retryAfter}s.` },
      {
        status: 429,
        headers: {
          'content-type': 'application/json',
          'retry-after': String(retryAfter),
          'x-ratelimit-limit': String(limit),
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': String(bucket.windowStart + WINDOW_MS),
        },
      }
    );
  }

  // Attach informational headers via a cloned response (NextResponse.next
  // would short-circuit; instead we return null and let the route handler
  // run, but we can't add headers without intercepting. For simplicity we
  // only return the 429 case here.)
  return null;
}

/** Test helper — resets all buckets between tests. */
export function __resetRateLimiterForTesting() {
  buckets.clear();
  lastPurge = Date.now();
}
